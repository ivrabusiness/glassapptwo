import React, { useMemo } from 'react';
import { NavigateFunction } from 'react-router-dom';
import { Quote, WorkOrder, Process, InventoryItem } from '../../../../types';
import { useSupabaseData } from '../../../../hooks/useSupabaseData';
import { calculateTotalProcessPrice } from '../../../../utils/processUtils';
import useQuotePayments from './hooks/useQuotePayments';
import useQuoteActions from './hooks/useQuoteActions';
import QuoteStatusCard from './QuoteStatusCard';
import QuoteSummaryCard from './QuoteSummaryCard';
import PaymentManagementCard from './PaymentManagementCard';
import QuoteActionsCard from './QuoteActionsCard';

interface QuoteSidebarProps {
  quote: Quote;
  workOrder: WorkOrder | null;
  navigate: NavigateFunction;
  canEditQuote: boolean;
  onEdit: () => void;
  onPrintQuote: () => void;
}

const QuoteSidebar: React.FC<QuoteSidebarProps> = ({
  quote,
  workOrder,
  navigate,
  canEditQuote = false,
  onEdit = () => {},
  onPrintQuote = () => {}
}) => {
  const [quotes, setQuotes] = useSupabaseData<Quote>('quotes', []);
  const [processes] = useSupabaseData<Process>('processes', []);
  const [inventory] = useSupabaseData<InventoryItem>('inventory', []);

  // Calculate amounts
  const processAmount = useMemo(() => {
    return quote.processAmount !== undefined ? 
      quote.processAmount : 
      calculateTotalProcessPrice(quote.items, processes, inventory);
  }, [quote.processAmount, quote.items, processes, inventory]);

  const productAmount = useMemo(() => {
    return quote.productAmount !== undefined ? 
      quote.productAmount : 
      (quote.totalAmount - processAmount);
  }, [quote.productAmount, quote.totalAmount, processAmount]);

  // Custom hooks for functionality
  const {
    paymentRecords,
    handleAddPayment,
    handleRemovePayment
  } = useQuotePayments({ quote, setQuotes });

  const {
    showSuccessMessage,
    rejectInProgress,
    rejectProgress,
    rejectCompleted,
    handleRejectQuote,
    getStatusText,
    getStatusColor,
    canRejectQuote,
    canConvertToOrder
  } = useQuoteActions({ quote, setQuotes });

  return (
    <div className="space-y-6">
      {/* Quote Status Card */}
      <QuoteStatusCard
        quote={quote}
        workOrder={workOrder}
        showSuccessMessage={showSuccessMessage}
        rejectInProgress={rejectInProgress}
        rejectProgress={rejectProgress}
        rejectCompleted={rejectCompleted}
        getStatusText={getStatusText}
        getStatusColor={getStatusColor}
      />

      {/* Quote Summary Card */}
      <QuoteSummaryCard
        quote={quote}
        productAmount={productAmount}
        processAmount={processAmount}
      />

      {/* Payment Management Card */}
      <PaymentManagementCard
        quote={quote}
        paymentRecords={paymentRecords}
        onAddPayment={handleAddPayment}
        onRemovePayment={handleRemovePayment}
      />

      {/* Quote Actions Card */}
      <QuoteActionsCard
        quote={quote}
        workOrder={workOrder}
        canEditQuote={canEditQuote}
        onEdit={onEdit}
        onPrintQuote={onPrintQuote}
        canRejectQuote={canRejectQuote}
        canConvertToOrder={canConvertToOrder}
        handleRejectQuote={handleRejectQuote}
      />
    </div>
  );
};

export default QuoteSidebar;
