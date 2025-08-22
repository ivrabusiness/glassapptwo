import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Quote, QuoteItem, PaymentInfo } from '../../../../types';
import { generateId } from '../../../../utils/idGenerators';

interface UseQuoteSubmissionParams {
  quoteNumber: string;
  selectedClientId: string;
  quoteNotes: string;
  items: QuoteItem[];
  validUntilDate: string;
  vatRate: number;
  paymentInfo: PaymentInfo[];
  purchaseOrder?: string;
  totals: {
    subtotal: number;
    processTotal: number;
    totalBeforeVat: number;
    vatAmount: number;
    grandTotal: number;
  };
  setQuotes: React.Dispatch<React.SetStateAction<Quote[]>>;
}

export function useQuoteSubmission({
  quoteNumber,
  selectedClientId,
  quoteNotes,
  items,
  validUntilDate,
  vatRate,
  paymentInfo,
  purchaseOrder,
  totals,
  setQuotes
}: UseQuoteSubmissionParams) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successData, setSuccessData] = useState<{ type: 'created'; error?: string; quoteNumber?: string } | null>(null);

  const createQuoteObject = useCallback((status: 'created'): Quote => {
    return {
      id: generateId(),
      quoteNumber,
      clientId: selectedClientId,
      items: items.map(item => ({ ...item })),
      totalAmount: totals.totalBeforeVat,
      productAmount: totals.subtotal,
      processAmount: totals.processTotal,
      vatRate,
      vatAmount: totals.vatAmount,
      grandTotal: totals.grandTotal,
      status,
      createdAt: new Date().toISOString(),
      validUntil: validUntilDate ? new Date(validUntilDate).toISOString() : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      notes: quoteNotes,
      purchaseOrder: purchaseOrder || undefined,
      paymentInfo: paymentInfo.map(info => ({ ...info }))
    };
  }, [quoteNumber, selectedClientId, items, totals, vatRate, validUntilDate, quoteNotes, paymentInfo, purchaseOrder]);

  const saveAndSend = useCallback(async () => {
    if (!selectedClientId) {
      setSuccessData({
        type: 'created',
        error: 'Molimo odaberite klijenta prije kreiranja ponude',
        quoteNumber
      });
      setShowSuccessModal(true);
      return;
    }

    setIsLoading(true);
    try {
      const quote = createQuoteObject('created');
      
      setQuotes(prevQuotes => {
        const existingIndex = prevQuotes.findIndex(q => q.quoteNumber === quoteNumber);
        if (existingIndex >= 0) {
          // Ažuriraj postojeću ponudu
          const updatedQuotes = [...prevQuotes];
          updatedQuotes[existingIndex] = quote;
          return updatedQuotes;
        } else {
          // Dodaj novu ponudu
          return [...prevQuotes, quote];
        }
      });

      setSuccessData({
        type: 'created',
        quoteNumber
      });
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Greška pri slanju ponude:', error);
      setSuccessData({
        type: 'created',
        error: 'Greška pri kreiranju ponude',
        quoteNumber
      });
      setShowSuccessModal(true);
    } finally {
      setIsLoading(false);
    }
  }, [createQuoteObject, selectedClientId, quoteNumber, setQuotes]);

  const handleSuccessModalClose = useCallback(() => {
    setShowSuccessModal(false);
    
    // Ako je kreiranje prošlo bez greške, preusmjeri na pregled ponude
    if (successData && !successData.error) {
      navigate(`/quotes/${successData.quoteNumber}`);
    }
    
    setSuccessData(null);
  }, [navigate, successData]);

  return {
    isLoading,
    showSuccessModal,
    successData,
    saveAndSend,
    handleSuccessModalClose
  };
}

