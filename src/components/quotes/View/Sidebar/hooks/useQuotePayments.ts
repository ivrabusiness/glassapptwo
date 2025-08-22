import { useState, useEffect } from 'react';
import { Quote, PaymentRecord } from '../../../../../types';
import { supabase } from '../../../../../lib/supabase';

interface UseQuotePaymentsProps {
  quote: Quote;
  setQuotes: (updater: (prev: Quote[]) => Quote[]) => void;
}

export default function useQuotePayments({ quote, setQuotes }: UseQuotePaymentsProps) {
  const [paymentRecords, setPaymentRecords] = useState<PaymentRecord[]>(quote.paymentRecords || []);

  // Dohvati plaćanja iz baze podataka
  useEffect(() => {
    const loadPayments = async () => {
      try {
        const { data: payments, error } = await supabase
          .from('payment_records')
          .select('*')
          .eq('quote_id', quote.id)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Greška pri dohvaćanju plaćanja:', error);
          return;
        }

        if (payments && payments.length > 0) {
          const loadedPayments: PaymentRecord[] = payments.map(p => ({
            id: p.id,
            paymentMethod: p.payment_method,
            amount: p.amount,
            transactionNumber: p.transaction_number || undefined,
            description: p.description || undefined,
            paymentDate: p.payment_date,
            createdAt: p.created_at
          }));

          // Ažuriraj lokalni state s dohvaćenim plaćanjima
          setPaymentRecords(loadedPayments);
        }
      } catch (error) {
        console.error('Neočekivana greška pri dohvaćanju plaćanja:', error);
      }
    };

    loadPayments();
  }, [quote.id]);

  // Funkcija za dodavanje plaćanja
  const handleAddPayment = async (paymentData: Omit<PaymentRecord, 'id' | 'createdAt'>) => {
    try {
      // Spremi plaćanje u bazu podataka
      const { data: paymentRecord, error: paymentError } = await supabase
        .from('payment_records')
        .insert({
          quote_id: quote.id,
          payment_method: paymentData.paymentMethod,
          amount: paymentData.amount,
          transaction_number: paymentData.transactionNumber,
          description: paymentData.description,
          payment_date: paymentData.paymentDate
        })
        .select()
        .single();

      if (paymentError) {
        console.error('Greška pri spremanju plaćanja:', paymentError);
        alert('Greška pri spremanju plaćanja. Molimo pokušajte ponovo.');
        return;
      }

      // Stvori novi PaymentRecord objekt
      const newPayment: PaymentRecord = {
        id: paymentRecord.id,
        paymentMethod: paymentRecord.payment_method,
        amount: paymentRecord.amount,
        transactionNumber: paymentRecord.transaction_number || undefined,
        description: paymentRecord.description || undefined,
        paymentDate: paymentRecord.payment_date,
        createdAt: paymentRecord.created_at
      };

      // Ažuriraj lokalni state s novim plaćanjem
      const updatedPayments = [...paymentRecords, newPayment];
      setPaymentRecords(updatedPayments);
    } catch (error) {
      console.error('Neočekivana greška:', error);
      alert('Neočekivana greška. Molimo pokušajte ponovo.');
    }
  };

  // Funkcija za uklanjanje plaćanja
  const handleRemovePayment = async (paymentId: string) => {
    try {
      // Obriši plaćanje iz baze podataka
      const { error: deleteError } = await supabase
        .from('payment_records')
        .delete()
        .eq('id', paymentId);

      if (deleteError) {
        console.error('Greška pri brisanju plaćanja:', deleteError);
        alert('Greška pri brisanju plaćanja. Molimo pokušajte ponovo.');
        return;
      }

      // Ažuriraj lokalni state - ukloni plaćanje
      const updatedPayments = paymentRecords.filter(p => p.id !== paymentId);
      setPaymentRecords(updatedPayments);
    } catch (error) {
      console.error('Neočekivana greška:', error);
      alert('Neočekivana greška. Molimo pokušajte ponovo.');
    }
  };

  return {
    paymentRecords,
    handleAddPayment,
    handleRemovePayment
  };
}

