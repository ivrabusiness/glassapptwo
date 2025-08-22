import { useState, useRef, useEffect } from 'react';
import { Quote } from '../../../../../types';

interface UseQuoteActionsProps {
  quote: Quote;
  setQuotes: (updater: (prev: Quote[]) => Quote[]) => void;
}

export default function useQuoteActions({ quote, setQuotes }: UseQuoteActionsProps) {
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [rejectInProgress, setRejectInProgress] = useState(false);
  const [rejectProgress, setRejectProgress] = useState(0);
  const [rejectCompleted, setRejectCompleted] = useState(false);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);



  // Funkcija za odbijanje ponude
  const handleRejectQuote = async () => {
    if (!quote) return;
    
    // Start the reject process
    setRejectInProgress(true);
    setShowSuccessMessage(true);
    setRejectProgress(0);
    setRejectCompleted(false);
    
    // Set up progress interval (updates every 50ms)
    progressIntervalRef.current = setInterval(() => {
      setRejectProgress(prev => {
        if (prev >= 100) {
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
          }
          setRejectCompleted(true);
          
          // Hide success message after 3 seconds
          timerRef.current = setTimeout(() => {
            setShowSuccessMessage(false);
            setRejectInProgress(false);
            setRejectProgress(0);
            setRejectCompleted(false);
          }, 3000);
          
          return 100;
        }
        return prev + 2; // Increase by 2% every 50ms (completes in 2.5 seconds)
      });
    }, 50);

    // Update quote status
    const updatedQuote: Quote = {
      ...quote,
      status: 'rejected',
      rejectedAt: new Date().toISOString()
    };

    setQuotes(prev => prev.map(q => q.id === quote.id ? updatedQuote : q));
  };

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  // Utility functions
  const getStatusText = (status: string) => {
    switch (status) {
      case 'created': return 'Kreirana';
      case 'accepted': return 'Plaćena';
      case 'rejected': return 'Odbijena';
      case 'expired': return 'Istekla';
      case 'converted': return 'Pretvorena u nalog';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'created': return 'bg-blue-100 text-blue-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'expired': return 'bg-yellow-100 text-yellow-800';
      case 'converted': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Provjeri je li ponuda istekla
  const isExpired = () => {
    const today = new Date();
    const validUntil = quote.validUntil ? new Date(quote.validUntil) : new Date();
    return today > validUntil && quote.status !== 'accepted' && quote.status !== 'converted';
  };

  // Provjeri može li se ponuda odbiti
  const canRejectQuote = () => {
    return quote.status === 'created' && !isExpired();
  };

  // Provjeri može li se ponuda pretvoriti u nalog
  const canConvertToOrder = () => {
    return quote.status === 'created' && !quote.convertedToWorkOrderId;
  };

  return {
    showSuccessMessage,
    rejectInProgress,
    rejectProgress,
    rejectCompleted,
    handleRejectQuote,
    getStatusText,
    getStatusColor,
    isExpired,
    canRejectQuote,
    canConvertToOrder
  };
}

