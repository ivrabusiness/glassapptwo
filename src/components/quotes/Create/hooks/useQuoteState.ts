import { useState, useCallback } from 'react';
import { QuoteItem, PaymentInfo } from '../../../../types';
import { generateQuoteNumber } from '../../../../utils/idGenerators';

export function useQuoteState() {
  const [quoteNumber] = useState(generateQuoteNumber());
  const [selectedClientId, setSelectedClientId] = useState('');
  const [quoteNotes, setQuoteNotes] = useState('');
  const [purchaseOrder, setPurchaseOrder] = useState('');
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [validUntilDate, setValidUntilDate] = useState(() => {
    // Default: 7 dana od danas
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toISOString().split('T')[0];
  });
  const [vatRate, setVatRate] = useState(25); // Default PDV stopa: 25%
  const [selectedBankAccounts, setSelectedBankAccounts] = useState<string[]>([]);
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo[]>([{
    companyName: '',
    iban: '',
    bankName: '',
    swift: '',
    model: 'HR00',
    reference: quoteNumber,
    purposeCode: 'OTHR',
    description: `Plaćanje po ponudi ${quoteNumber}`
  }]);

  // Funkcija za dodavanje više artikala odjednom
  const addBulkItems = useCallback((newItems: QuoteItem[]) => {
    setItems(prev => [...prev, ...newItems]);
  }, []);

  // Handler za promjenu datuma valjanosti
  const handleValidUntilChange = useCallback((dateString: string) => {
    setValidUntilDate(dateString);
  }, []);

  const addItem = useCallback(() => {
    const newItem: QuoteItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      productId: '',
      productName: '',
      productCode: '',
      serviceId: '',
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
      dimensions: { width: 0, height: 0, area: 0 },
      materials: [],
      processSteps: [],
      notes: '',
      isService: false
    };
    setItems(prev => [...prev, newItem]);
  }, []);

  const removeItem = useCallback((itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
  }, []);

  return {
    // State
    quoteNumber,
    selectedClientId,
    setSelectedClientId,
    quoteNotes,
    setQuoteNotes,
    purchaseOrder,
    setPurchaseOrder,
    items,
    setItems,
    validUntilDate,
    setValidUntilDate,
    vatRate,
    setVatRate,
    selectedBankAccounts,
    setSelectedBankAccounts,
    paymentInfo,
    setPaymentInfo,
    
    // Actions
    addBulkItems,
    handleValidUntilChange,
    addItem,
    removeItem
  };
}

