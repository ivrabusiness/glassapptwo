import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Receipt, AlertTriangle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseData } from '../../../hooks/useSupabaseData';
import { Quote, QuoteItem, Client, Product, BankAccount, Process, InventoryItem, Service, PaymentInfo } from '../../../types';
import { calculateItemProcessPrice } from '../../../utils/processUtils';
// Import storage utilities ako budu potrebni
import ClientSelection from '../Create/ClientSelection';
import ItemsList from '../Create/ItemsList';
import QuoteSummary from '../Create/QuoteSummary';
import PaymentDetails from '../Create/PaymentDetails'; 

interface EditQuoteProps {
  quoteId: string;
  onBack: () => void;
}

const EditQuote: React.FC<EditQuoteProps> = ({ quoteId, onBack }) => {
  const navigate = useNavigate();
  const [quotes, setQuotes] = useSupabaseData<Quote>('quotes', []);
  const [products] = useSupabaseData<Product>('products', []);
  const [clients] = useSupabaseData<Client>('clients', []);
  const [services] = useSupabaseData<Service>('services', []);
  const [processes] = useSupabaseData<Process>('processes', []);
  const [inventory] = useSupabaseData<InventoryItem>('inventory', []);
  const [bankAccounts] = useSupabaseData<BankAccount>('bank_accounts', []);

  const [selectedClientId, setSelectedClientId] = useState('');
  const [quoteNotes, setQuoteNotes] = useState('');
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [vatRate, setVatRate] = useState(25); 
  const [validUntil, setValidUntil] = useState(() => {
    // Default to 30 days from now
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().split('T')[0];
  });
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo[]>([{
    companyName: '',
    iban: '', 
    bankName: '',
    swift: '',
    model: 'HR00', 
    reference: '', 
    purposeCode: 'OTHR',
    description: ''
  }]);
  const [originalQuote, setOriginalQuote] = useState<Quote | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  // Funkcija za dodavanje više artikala odjednom
  const addBulkItems = (newItems: QuoteItem[]) => {
    setItems(prev => [...prev, ...newItems]);
  };

  const [successData, setSuccessData] = useState<{
    type: 'created';
    quoteNumber: string;
  } | null>(null);

  // Učitavanje ponude
  useEffect(() => {
    const quote = quotes.find(q => q.id === quoteId || q.quoteNumber === quoteId);
    
    // Function to ensure each quote item has materials property
    const ensureItemsMaterials = (items: QuoteItem[]) => {
      return items.map(item => {
        // If item has no materials, initialize an empty array
        if (!item.materials) {
          // Get product to initialize materials
          const product = products.find(p => p.id === item.productId);
          if (product && product.materials) {
            // Create materials from product
            return {
              ...item,
              materials: product.materials.map(material => ({
                id: generateId(),
                materialId: material.id,
                inventoryItemId: material.inventoryItemId,
                quantity: material.quantity,
                unit: material.unit,
                processSteps: [],
                notes: ''
              }))
            };
          }
          // If no product or no materials in product, just add empty array
          return {
            ...item,
            materials: []
          };
        }
        
        // Already has materials, return as is
        return item;
      });
    };
    
    if (!quote) {
      setError(`Ponuda s ID "${quoteId}" nije pronađena u bazi podataka.`);
      setIsLoading(false);
      return;
    }

    // Provjeri može li se ponuda uređivati
    if (quote.status !== 'created') {
      const statusText = quote.status === 'accepted' ? 'Plaćena' : 
                         quote.status === 'rejected' ? 'Odbijena' :
                         quote.status === 'expired' ? 'Istekla' :
                         quote.status === 'converted' ? 'Pretvorena u nalog' : quote.status;
      setError(`Ponuda sa statusom "${statusText}" se ne može uređivati.`);
      setIsLoading(false);
      return;
    }

    try {
      setOriginalQuote(quote);
      setSelectedClientId(quote.clientId || '');
      
      
      // Ensure all items have materials property
      const itemsWithMaterials = ensureItemsMaterials(quote.items);
      setItems(itemsWithMaterials);
      
      setVatRate(quote.vatRate);
      
      // Format the date as yyyy-MM-dd for the date input
      if (quote.validUntil) {
        const validUntilDate = new Date(quote.validUntil);
        const formattedDate = validUntilDate.toISOString().split('T')[0];
        setValidUntil(formattedDate);
      }
      
      // Normaliziraj paymentInfo u array
      const paymentInfoArray = Array.isArray(quote.paymentInfo) ? quote.paymentInfo : [quote.paymentInfo];
      setPaymentInfo(paymentInfoArray);
      
      // Provjeri postoje li bankovni računi koji odgovaraju podacima iz ponude
      if (bankAccounts.length > 0 && quote.paymentInfo) {
        const matchingAccountIds: string[] = [];
        
        // Normaliziraj paymentInfo u array prije iteracije
        const paymentInfoArray = Array.isArray(quote.paymentInfo) ? quote.paymentInfo : [quote.paymentInfo];
        
        // Prođi kroz sve podatke za plaćanje i pronađi odgovarajuće račune
        paymentInfoArray.forEach(info => {
          const matchingAccount = bankAccounts.find(account => 
            account.iban === info.iban && 
            account.accountName === info.companyName
          );
          
          if (matchingAccount) {
            matchingAccountIds.push(matchingAccount.id);
          }
        });
        
        // Postavi ID-jeve bankovnih računa
        setSelectedBankAccounts(matchingAccountIds);
      }
      
      setError(null);
    } catch (err) {
      console.error('Greška pri obradi ponude:', err);
      setError('Greška pri učitavanju podataka ponude.');
    } finally {
      setIsLoading(false);
    }
  }, [quoteId, quotes]);

  // State za odabrani bankovni račun
  const [selectedBankAccounts, setSelectedBankAccounts] = useState<string[]>([]);

  // Funkcija za odabir bankovnog računa
  const handleBankAccountSelect = (accountId: string, selected: boolean) => {
    if (selected) {
      // Dodaj račun u odabrane
      setSelectedBankAccounts(prev => [...prev, accountId]);
      
      // Dodaj payment info za ovaj račun
      const selectedAccount = bankAccounts.find(account => account.id === accountId);
      
      if (selectedAccount && originalQuote) {
        // Kreiraj opis plaćanja s brojem ponude
        let description = selectedAccount.description || `Plaćanje po ponudi ${originalQuote.quoteNumber}`;
        description = description.replace('{broj_ponude}', originalQuote.quoteNumber);
        
        // Kreiraj poziv na broj s prefiksom i brojem ponude
        let reference = originalQuote.quoteNumber;
        if (selectedAccount.referencePrefix) {
          reference = `${selectedAccount.referencePrefix}${originalQuote.quoteNumber}`;
        }
        
        const newPaymentInfo = {
          companyName: selectedAccount.accountName,
          bankName: selectedAccount.bankName,
          iban: selectedAccount.iban,
          swift: selectedAccount.swift || '',
          model: selectedAccount.model || 'HR00',
          reference: reference,
          purposeCode: selectedAccount.purposeCode || 'OTHR',
          description: description
        };
        
        setPaymentInfo(prev => [...prev, newPaymentInfo]);
      }
    } else {
      // Ukloni račun iz odabranih
      setSelectedBankAccounts(prev => prev.filter(id => id !== accountId));
      
      // Ukloni payment info za ovaj račun
      const selectedAccount = bankAccounts.find(account => account.id === accountId);
      if (selectedAccount) {
        setPaymentInfo(prev => prev.filter(info => info.iban !== selectedAccount.iban));
      }
    }
  };

  // Funkcija za dodavanje novog artikla
  const addItem = () => {
    const newItem: QuoteItem = {
      id: generateId(),
      productId: '',
      productName: '',
      quantity: 1,
      dimensions: { width: 0, height: 0, area: 0 },
      unitPrice: 0,
      totalPrice: 0,
      notes: ''
    };
    setItems([...items, newItem]);
  };
  
  // Funkcija za ažuriranje procesa za materijal
  const updateMaterialProcesses = (
    itemId: string, 
    materialId: string, 
    processId: string, 
    action: 'add' | 'remove', 
    notes: string = ''
  ) => {
    setItems(items.map(item => {
      if (item.id === itemId && item.materials) {
        const updatedMaterials = item.materials.map(material => {
          if (material.id === materialId) {
            let updatedProcessSteps = [...(material.processSteps || [])];
            
            if (action === 'add') {
              // Dodaj proces ako ne postoji
              const existingStep = updatedProcessSteps.find(step => step.processId === processId);
              if (!existingStep) {
                updatedProcessSteps.push({
                  id: generateId(),
                  processId,
                  status: 'pending',
                  notes
                });
              } else {
                // Ažuriraj napomenu ako proces već postoji
                updatedProcessSteps = updatedProcessSteps.map(step => 
                  step.processId === processId ? { ...step, notes } : step
                );
              }
            } else if (action === 'remove') {
              // Ukloni proces
              updatedProcessSteps = updatedProcessSteps.filter(step => step.processId !== processId);
            }
            
            return {
              ...material,
              processSteps: updatedProcessSteps
            };
          }
          return material;
        });
        
        return {
          ...item,
          materials: updatedMaterials
        };
      }
      return item;
    }));
  };

  // Funkcija za ažuriranje napomene za proces
  const updateProcessNotes = (itemId: string, materialId: string, processId: string, notes: string) => {
    setItems(items.map(item => {
      if (item.id === itemId && item.materials) {
        const updatedMaterials = item.materials.map(material => {
          if (material.id === materialId) {
            const updatedProcessSteps = material.processSteps?.map(step => {
              if (step.processId === processId) {
                return { ...step, notes };
              }
              return step;
            }) || [];
            
            return {
              ...material,
              processSteps: updatedProcessSteps
            };
          }
          return material;
        });
        
        return {
          ...item,
          materials: updatedMaterials
        };
      }
      return item;
    }));
  };

  // Service-level: toggle add/remove process on item.processSteps
  const updateServiceProcesses = (
    itemId: string,
    processId: string,
    action: 'add' | 'remove',
    notes: string = ''
  ) => {
    setItems(items.map(item => {
      if (item.id !== itemId) return item;

      let updatedProcessSteps = [...(item.processSteps || [])];

      if (action === 'add') {
        const existingStep = updatedProcessSteps.find(step => step.processId === processId);
        if (!existingStep) {
          updatedProcessSteps.push({
            id: generateId(),
            processId,
            status: 'pending',
            isFixed: false,
            notes
          });
        }
      } else if (action === 'remove') {
        updatedProcessSteps = updatedProcessSteps.filter(step => {
          if (step.processId === processId) {
            return step.isFixed; // keep only fixed ones
          }
          return true;
        });
      }

      return {
        ...item,
        processSteps: updatedProcessSteps
      };
    }));
  };

  // Service-level: update notes on item.processSteps
  const updateServiceProcessNotes = (itemId: string, processId: string, notes: string) => {
    setItems(items.map(item => {
      if (item.id !== itemId) return item;

      const updatedProcessSteps = (item.processSteps || []).map(step =>
        step.processId === processId ? { ...step, notes } : step
      );

      return {
        ...item,
        processSteps: updatedProcessSteps
      };
    }));
  };

  // Funkcija za uklanjanje artikla
  const removeItem = (itemId: string) => {
    setItems(items.filter(item => item.id !== itemId));
  };

  // Funkcija za ažuriranje artikla
  const updateItem = (itemId: string, field: keyof QuoteItem, value: any) => {
    setItems(prevItems => prevItems.map(item => {
      if (item.id === itemId) {
        const updatedItem = { ...item, [field]: value };
        
        // Recalculate area when dimensions change
        if (field === 'dimensions') {
          const widthInMeters = value.width / 100;
          const heightInMeters = value.height / 100;
          updatedItem.dimensions = {
            width: value.width,
            height: value.height,
            area: widthInMeters * heightInMeters
          };
          
          // Recalculate total price based on new area
          if (!updatedItem.isService) {
            updatedItem.totalPrice = updatedItem.unitPrice * updatedItem.quantity * updatedItem.dimensions.area;
          }
        }
        
        // Update product name when product changes
        if (field === 'productId') {
          const product = products.find(p => p.id === value);
          if (product && product.materials) {
            // Kreiraj materijale na temelju proizvoda
            updatedItem.materials = product.materials.map(material => ({
              id: generateId(),
              materialId: material.id,
              inventoryItemId: material.inventoryItemId,
              quantity: material.quantity,
              unit: material.unit,
              processSteps: [],
              notes: ''
            }));
            
            updatedItem.productName = product.name;
            updatedItem.productCode = product.code;
            
            // Postavi cijenu iz proizvoda ako je dostupna
            if (product.price) {
              updatedItem.unitPrice = product.price;
              
              // Izračunaj ukupnu cijenu
              const newTotalPrice = product.price * updatedItem.quantity * updatedItem.dimensions.area;
              updatedItem.totalPrice = newTotalPrice;
            }
          }
        }
        
        // Recalculate total price when quantity or unit price changes
        if (field === 'quantity' || field === 'unitPrice') {
          updatedItem.totalPrice = updatedItem.isService ? 
            updatedItem.unitPrice * updatedItem.quantity : 
            updatedItem.unitPrice * updatedItem.quantity * updatedItem.dimensions.area;
        }
        
        return updatedItem;
      }
      
      return item;
    }));
  };

  // Izračun ukupnih iznosa
  const calculateTotals = () => {
    let productAmount = 0;
    let processAmount = 0;

    // Izračunaj ukupni iznos s procesima koristeći util (usklađeno s PDF-om)
    items.forEach(item => {
      // Osnovna cijena proizvoda/usluge (bez procesa)
      const productPrice = item.totalPrice || 0;
      productAmount += productPrice;

      // Cijena procesa po stavci preko util funkcije (uključuje debljinu stakla, tip naplate itd.)
      const itemProcessTotal = calculateItemProcessPrice(item as any, processes as any[], inventory as any[]);
      processAmount += itemProcessTotal;
    });

    const totalBeforeVat = productAmount + processAmount;
    const vatAmount = totalBeforeVat * (vatRate / 100);
    const grandTotal = totalBeforeVat + vatAmount;

    return {
      totalAmount: totalBeforeVat,
      productAmount,
      processAmount,
      vatAmount,
      grandTotal
    };
  };

  // Provjera može li se ponuda spremiti
  const canSaveQuote = () => {
    const clientValid = !!selectedClientId;
    const itemsValid = items.length > 0;
    
    if (!clientValid || !itemsValid) {
      return false;
    }
    
    const hasValidItems = items.every(item => 
      (item.isService ? item.serviceId : item.productId) && 
      item.quantity > 0 && 
      (item.isService || (item.dimensions.width > 0 && item.dimensions.height > 0)) &&
      item.unitPrice > 0
    );
    
    return hasValidItems;
  };

  // Handler za promjenu datuma valjanosti
  const handleValidUntilChange = (dateString: string) => setValidUntil(dateString);


  // Spremanje i slanje ponude
  const saveAndSend = async () => {
    if (!originalQuote || !canSaveQuote()) {
      alert('Molimo provjerite sve podatke');
      return;
    }

    const totals = calculateTotals();
    
    const updatedQuote: Quote = {
      ...originalQuote,
      clientId: selectedClientId,
      items: items,
      notes: quoteNotes,
      status: 'created', // Mijenja status u sent
      validUntil: new Date(validUntil).toISOString(),
      totalAmount: totals.totalAmount,
      productAmount: totals.productAmount,
      processAmount: totals.processAmount,
      vatRate: vatRate,
      vatAmount: totals.vatAmount,
      grandTotal: totals.grandTotal,
      paymentInfo: paymentInfo
    };

    try {
      await setQuotes(prev => {
        const newQuotes = prev.map(quote => 
          (quote.id === quoteId || quote.quoteNumber === quoteId) ? updatedQuote : quote
        );
        return newQuotes;
      });
      
      // Prikaži modal za uspjeh
      setSuccessData({
        type: 'created',
        quoteNumber: updatedQuote.quoteNumber
      });
      setShowSuccessModal(true);
    } catch (error) {
      console.error('❌ Greška pri spremanju ponude:', error);
      console.error('❌ Detalji greške:', {
        message: error instanceof Error ? error.message : 'Nepoznata greška',
        stack: error instanceof Error ? error.stack : 'Nema stack trace'
      });
      alert('Greška pri spremanju ponude: ' + (error instanceof Error ? error.message : 'Nepoznata greška'));
    }
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    
    // Ako je ponuda poslana, dodaj statusChanged parametar za osvježavanje
    if (successData && successData.type === 'created') {
      const targetUrl = `/quotes/${originalQuote?.quoteNumber}?statusChanged=true`;
      
      // Pokušaj s window.location.href za direktnu navigaciju
      try {
        window.location.href = targetUrl;
      } catch (error) {
        console.error('❌ Greška s window.location.href:', error);
        // Fallback na navigate
        navigate(targetUrl);
      }
    } else {
      onBack();
    }
  };

  // Helper funkcija za generiranje ID-a
  const generateId = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-purple-600 rounded-full flex items-center justify-center mb-4">
            <Loader2 className="h-8 w-8 text-white animate-spin" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Učitavam ponudu...</h2>
          <p className="text-gray-600">Molimo pričekajte</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !originalQuote) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <AlertTriangle className="mx-auto h-16 w-16 text-red-400 mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">Ponuda nije pronađena</h3>
          <p className="text-gray-600 mb-4">
            {error || `Ponuda s ID "${quoteId}" nije pronađena u bazi podataka.`}
          </p>
          
          <button 
            onClick={onBack}
            className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            ← Povratak na listu
          </button>
        </div>
      </div>
    );
  }

  const totals = calculateTotals();
  const { grandTotal } = totals;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Uredi ponudu</h1>
            <p className="text-gray-600">
              Broj ponude: <span className="font-medium">{originalQuote.quoteNumber}</span>
              <span className="ml-3 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Poslana
              </span>
            </p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={onBack}
            className="inline-flex items-center px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
          >
            Odustani
          </button>
          <button
            onClick={saveAndSend}
            disabled={!canSaveQuote()}
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <Receipt className="h-4 w-4 mr-2" />
            Spremi promjene
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Client Selection */}
          <ClientSelection
            selectedClientId={selectedClientId}
            onClientChange={setSelectedClientId}
            clients={clients}
          />

          {/* Items */}
          <ItemsList
            items={items}
            products={products}
            services={services}
            processes={processes}
            inventory={inventory}
            onAddItem={addItem}
            onAddBulkItems={addBulkItems}
            onUpdateItem={updateItem}
            onRemoveItem={removeItem}
            onUpdateMaterialProcesses={updateMaterialProcesses}
            onUpdateProcessNotes={updateProcessNotes}
            onUpdateServiceProcesses={updateServiceProcesses}
            onUpdateServiceProcessNotes={updateServiceProcessNotes}
          />

          {/* Quote Notes */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Napomene ponude</h2>
            <textarea
              value={quoteNotes}
              onChange={(e) => setQuoteNotes(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Dodatne napomene za ponudu..."
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quote Summary */}
          <QuoteSummary
            quoteNumber={originalQuote.quoteNumber}
            items={items}
            totalAmount={totals.totalAmount}
            productAmount={totals.productAmount}
            processAmount={totals.processAmount}
            vatRate={vatRate}
            onVatRateChange={setVatRate}
            vatAmount={totals.vatAmount}
            grandTotal={totals.grandTotal}
            validUntil={validUntil} 
            onValidUntilChange={handleValidUntilChange}
          />

          {/* Payment Details */}
          <PaymentDetails
            paymentInfo={paymentInfo}
            onPaymentInfoChange={setPaymentInfo}
            bankAccounts={bankAccounts}
            selectedBankAccounts={selectedBankAccounts}
            onBankAccountSelect={handleBankAccountSelect}
            quoteNumber={originalQuote.quoteNumber} 
            grandTotal={grandTotal}
          />

          {/* Quote Info */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Informacije o ponudi</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Kreirana:</span>
                <span className="font-medium">{new Date(originalQuote.createdAt).toLocaleDateString('hr-HR')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Poslana
                </span>
              </div>
              <div className="pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  💡 Ponuda se može uređivati dok je u statusu "Poslana".
                  Nakon što je prihvaćena, odbijena ili pretvorena u nalog, više se ne može mijenjati.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && successData && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full sm:mx-0 sm:h-10 sm:w-10 bg-purple-100">
                    <Receipt className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Ponuda uspješno ažurirana!
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Ponuda ${successData.quoteNumber} je uspješno ažurirana i spremna za slanje klijentu.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleSuccessModalClose}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white sm:ml-3 sm:w-auto sm:text-sm bg-purple-600 hover:bg-purple-700"
                >
                  U redu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditQuote;
