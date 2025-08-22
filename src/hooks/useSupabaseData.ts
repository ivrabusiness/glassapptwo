import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured, getCurrentUserId } from '../lib/supabase';

// KLJUČNO: Hook koji UVIJEK koristi Supabase - PAMETNO ažuriranje bez brisanja
export function useSupabaseData<T>(
  tableName: string,
  initialValue: T[] = []
) {
  const [data, setDataState] = useState<T[]>(initialValue);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(isSupabaseConfigured());

  const loadData = useCallback(async () => {
    const normalizedTable = tableName;
    // 🚨 PROVJERI JE LI SUPABASE KONFIGURIRAN - OBAVEZNO!
    if (!isSupabaseConfigured()) {
      setError('❌ SUPABASE NIJE KONFIGURIRAN! Aplikacija radi SAMO sa Supabase.');
      setIsOnline(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get current user ID for tenant filtering
      const userId = await getCurrentUserId();
      
      const { data: supabaseData, error: supabaseError } = await supabase
        .from(normalizedTable)
        .select('*')
        .eq('tenant_id', userId)
        .order('created_at', { ascending: false });

      if (supabaseError) {
        throw supabaseError;
      }

      // Konvertiraj Supabase format u naš format
      const convertedData = (supabaseData || []).map(convertFromSupabase);
      setDataState(convertedData);
      setIsOnline(true); 
    } catch (err) {
      console.error(`❌ GREŠKA pri učitavanju ${normalizedTable}:`, err);
      setError(`Greška konekcije: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setIsOnline(false);
      setDataState([]);
    } finally {
      setLoading(false);
    }
  }, [tableName]);

  // Učitaj podatke na početku
  useEffect(() => {
    loadData();
  }, [loadData]);

  const setData = async (newData: T[] | ((prev: T[]) => T[])) => {
    const updatedData = typeof newData === 'function' ? newData(data) : newData;
    
    // 🚨 PROVJERI JE LI SUPABASE KONFIGURIRAN
    if (!isSupabaseConfigured()) {
      setError('❌ SUPABASE NIJE KONFIGURIRAN! Podaci se ne mogu spremiti.');
      return;
    }

    // 🎯 OPTIMISTIČNO AŽURIRANJE - prikaži odmah u UI-ju
    setDataState(updatedData);

    // Dodaj mali timeout da osiguramo da se UI ažurira prije nego što pokušamo spremiti u bazu
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Get current user ID for tenant filtering
    const userId = await getCurrentUserId();
    
    // Ako korisnik nije prijavljen, prekini spremanje i vrati stanje
    if (!userId) {
      setError('Nije moguće spremiti: korisnik nije prijavljen. Prijavite se i pokušajte ponovno.');
      setIsOnline(false);
      // Vrati podatke iz baze (poništi optimističnu promjenu)
      await loadData();
      return;
    }

    try {
      // 🎯 KLJUČNO: PAMETNO AŽURIRANJE - ne briši sve, nego usporedi i ažuriraj
      await smartUpdate(updatedData, userId);
      
      setIsOnline(true);
      setError(null);
    } catch (err) {
      const normalizedTable = tableName;
      console.error(`❌ GREŠKA pri spremanju u ${normalizedTable}:`, err);
      
      // 🚨 VRATI STARO STANJE ako je greška
      await loadData();
      
      const errorMessage = err instanceof Error ? err.message : 'Save error';
      setError(`Greška spremanja: ${errorMessage}`);
      setIsOnline(false);
      
      // 🚨 PRIKAŽI ALERT KORISNIKU
      console.error(`❌ GREŠKA pri spremanju u ${tableName}:`, err);
      
      // Prikaži detaljniju poruku o grešci
      let alertMessage = `❌ GREŠKA! Podaci se nisu mogli spremiti u bazu:\n${errorMessage}`;
      
      // Dodaj posebnu poruku za duplikate
      if (errorMessage.includes('duplicate key value') || errorMessage.includes('unique constraint')) {
        alertMessage += '\n\nPostoji duplikat ključa. Provjerite postoji li već zapis s istim kodom ili identifikatorom.';
      }
      
      alert(alertMessage);
    }
  };

  // 🎯 KLJUČNO: PAMETNO AŽURIRANJE - ne briši sve!
  const smartUpdate = async (newData: T[], userId: string) => {
    if (!userId) {
      throw new Error('User ID is required for data operations');
    }
    const normalizedTable = tableName;
    
    // Dohvati trenutne podatke iz baze
    const { data: currentData, error: fetchError } = await supabase
      .from(normalizedTable)
      .select('*')
      .eq('tenant_id', userId);

    if (fetchError) throw fetchError;

    const currentItems = (currentData || []).map(convertFromSupabase);
    const newItems = newData.map(item => {
      // Add tenant_id to each item
      const itemWithTenant = { ...item, tenant_id: userId };
      return convertToSupabase(itemWithTenant);
    });

    // Pronađi što treba dodati, ažurirati i obrisati
    const currentIds = new Set(currentItems.map(item => item.id));
    const newIds = new Set(newItems.map(item => item.id));

    // 1. DODAJ nove stavke
    const toInsert = newItems.filter(item => !currentIds.has(item.id));
    if (toInsert.length > 0) {
      // Ensure tenant_id is set for all new items
      const itemsWithTenant = toInsert.map(item => ({
        ...item,
        tenant_id: userId
      }));
      
      const { error: insertError } = await supabase
        .from(normalizedTable)
        .insert(itemsWithTenant);
      if (insertError) throw insertError;

    }

    // 2. AŽURIRAJ postojeće stavke
    const toUpdate = newItems.filter(item => currentIds.has(item.id));
    for (const item of toUpdate) {
      // Ensure tenant_id is preserved during update
      const itemWithTenant: any = {
        ...item,
        tenant_id: userId
      };
      // Dodaj thickness_prices SAMO za tablice koje to polje imaju (npr. processes)
      if (normalizedTable === 'processes') {
        itemWithTenant.thickness_prices = (item as any).thicknessPrices || (item as any).thickness_prices;
      }
      
      const { error: updateError } = await supabase
        .from(normalizedTable)
        .update(itemWithTenant)
        .eq('id', item.id);
      if (updateError) throw updateError;
    }
    // no-op

    // 3. OBRIŠI stavke koje više ne postoje (OPCIONALNO - možda ne želimo brisati)
    const toDelete = Array.from(currentIds).filter(id => !newIds.has(id));
    if (toDelete.length > 0) {
      // 🚨 PAŽNJA: Ovo će obrisati stavke koje nisu u novom setu
      // Za otpremnice možda ne želimo ovo!
      if (normalizedTable !== 'delivery_notes') {
        const { error: deleteError } = await supabase
          .from(normalizedTable)
          .delete()
          .in('id', toDelete);
        if (deleteError) throw deleteError;

      }
    }
  };

  // Konvertiraj camelCase u snake_case za Supabase
  const convertToSupabase = (item: any): any => {
    const converted: any = { ...item };
    
    // Ukloni polja koja ne postoje u bazi za specifične tablice
    // stock_transactions u bazi NEMA old_quantity kolonu
    if (tableName === 'stock_transactions') {
      delete converted.oldQuantity;
    }
    
    // KLJUČNO: Dodaj tenant_id ako ne postoji
    if (!converted.tenant_id) {
      getCurrentUserId().then(userId => {
        converted.tenant_id = userId;
      });
    }
    
    // Ukloni updated_at polje jer ga Supabase automatski upravlja
    delete converted.updated_at;
    delete converted.updatedAt;
    
    Object.keys(converted).forEach(key => {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      if (snakeKey !== key) {
        converted[snakeKey] = converted[key];
        delete converted[key];
      }
    });

    return converted;
  };

  // Konvertiraj snake_case u camelCase iz Supabase
  const convertFromSupabase = (item: any): any => {
    const converted: any = { ...item };
    
    Object.keys(converted).forEach(key => {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      if (camelKey !== key) {
        converted[camelKey] = converted[key];
        delete converted[key];
      }
    });

    // Nadopuni polja specifično za tablice gdje ih app očekuje
    if (tableName === 'stock_transactions') {
      // App očekuje oldQuantity; u bazi ga nema pa ga izjednačimo s previousQuantity
      if (typeof converted.oldQuantity === 'undefined' && typeof converted.previousQuantity !== 'undefined') {
        converted.oldQuantity = converted.previousQuantity;
      }
    }

    return converted;
  };

  return [data, setData, { loading, error, isOnline, refresh: loadData }] as const;
}
