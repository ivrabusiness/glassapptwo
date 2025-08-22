import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Process } from '../types';

interface UseProcessesReturn {
  processes: Process[];
  loading: boolean;
  error: string | null;
  reloadProcesses: () => Promise<void>;
  updateProcessDefault: (processId: string, isDefault: boolean) => Promise<void>;
}

export function useProcesses(): UseProcessesReturn {
  const [processes, setProcesses] = useState<Process[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProcesses = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: supabaseError } = await supabase
        .from('processes')
        .select('*')
        .order('order', { ascending: true });

      if (supabaseError) {
        throw supabaseError;
      }

      // Mapiranje Supabase podataka u Process interface
      const mappedProcesses: Process[] = (data || []).map(row => ({
        id: row.id,
        name: row.name,
        description: row.description || '',
        estimatedDuration: row.estimated_duration || 0,
        priceType: row.price_type as 'square_meter' | 'linear_meter' | 'piece' | 'hour',
        price: row.price || 0,
        thicknessPrices: row.thickness_prices || [],
        order: row.order || 0,
        isDefault: row.is_default || false,
        createdAt: row.created_at
      }));

      setProcesses(mappedProcesses);
      console.log('🔄 Processes loaded from database:', mappedProcesses.length);
    } catch (err) {
      console.error('❌ Error loading processes:', err);
      setError(err instanceof Error ? err.message : 'Greška pri učitavanju procesa');
    } finally {
      setLoading(false);
    }
  };

  const updateProcessDefault = async (processId: string, isDefault: boolean) => {
    try {
      const { error: supabaseError } = await supabase
        .from('processes')
        .update({ is_default: isDefault })
        .eq('id', processId);

      if (supabaseError) {
        throw supabaseError;
      }

      // Ažuriraj lokalni state
      setProcesses(prev => prev.map(process => 
        process.id === processId 
          ? { ...process, isDefault }
          : process
      ));

      console.log(`✅ Process ${processId} default status updated to:`, isDefault);
    } catch (err) {
      console.error('❌ Error updating process default status:', err);
      throw err;
    }
  };

  const reloadProcesses = async () => {
    await loadProcesses();
  };

  useEffect(() => {
    loadProcesses();
  }, []);

  return {
    processes,
    loading,
    error,
    reloadProcesses,
    updateProcessDefault
  };
}

