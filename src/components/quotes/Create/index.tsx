import React from 'react';
import { useSupabaseData } from '../../../hooks/useSupabaseData';
import { Quote, Product, Client, BankAccount, Process, InventoryItem, Service } from '../../../types';
import { useQuoteState } from './hooks/useQuoteState';
import { useQuoteBusinessLogic } from './hooks/useQuoteBusinessLogic';
import { usePaymentManagement } from './hooks/usePaymentManagement';
import { useQuoteSubmission } from './hooks/useQuoteSubmission';
import ClientSelection from './ClientSelection';
import ItemsList from './ItemsList';
import QuoteSummary from './QuoteSummary';
import PaymentDetails from './PaymentDetails';
import ActionButtons from './components/ActionButtons';
import SuccessModal from './components/SuccessModal';

type CreateQuoteProps = Record<string, never>;

const CreateQuote: React.FC<CreateQuoteProps> = () => {
  const [, setQuotes] = useSupabaseData<Quote>('quotes', []);
  const [products] = useSupabaseData<Product>('products', []);
  const [clients] = useSupabaseData<Client>('clients', []);
  const [services] = useSupabaseData<Service>('services', []);
  const [processes] = useSupabaseData<Process>('processes', []);
  const [inventory] = useSupabaseData<InventoryItem>('inventory', []);
  const [bankAccounts] = useSupabaseData<BankAccount>('bank_accounts', []);

  // Custom hooks for state management
  const {
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
    vatRate,
    setVatRate,
    selectedBankAccounts,
    setSelectedBankAccounts,
    paymentInfo,
    setPaymentInfo,
    addBulkItems,
    handleValidUntilChange,
    addItem,
    removeItem
  } = useQuoteState();

  // Business logic hooks
  const {
    updateItem,
    updateMaterialProcesses,
    updateProcessNotes,
    updateServiceProcesses,
    updateServiceProcessNotes,
    calculateTotals,
    canSaveQuote
  } = useQuoteBusinessLogic({ items, setItems, products, processes, inventory });

  // Payment management hook
  const { handleBankAccountSelect } = usePaymentManagement({
    bankAccounts,
    quoteNumber,
    selectedBankAccounts,
    setSelectedBankAccounts,
    paymentInfo,
    setPaymentInfo
  });

  // Quote submission hook
  const {
    isLoading,
    showSuccessModal,
    successData,
    saveAndSend,
    handleSuccessModalClose
  } = useQuoteSubmission({
    quoteNumber,
    selectedClientId,
    quoteNotes,
    items,
    validUntilDate,
    vatRate,
    paymentInfo,
    purchaseOrder,
    totals: calculateTotals(vatRate),
    setQuotes
  });

  const totals = calculateTotals(vatRate);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kreiraj novu ponudu</h1>
          <p className="text-gray-600">Broj ponude: <span className="font-medium">{quoteNumber}</span></p>
        </div>
        <div className="flex items-center space-x-4">
          <ActionButtons
            onSaveAndSend={saveAndSend}
            canSave={canSaveQuote()}
            isLoading={isLoading}
          />
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
            quoteNumber={quoteNumber}
            items={items}
            validUntil={validUntilDate}
            processAmount={totals.processTotal}
            productAmount={totals.subtotal}
            onValidUntilChange={handleValidUntilChange}
            vatRate={vatRate}
            onVatRateChange={setVatRate}
            totalAmount={totals.totalBeforeVat}
            vatAmount={totals.vatAmount}
            grandTotal={totals.grandTotal}
            purchaseOrder={purchaseOrder}
            onPurchaseOrderChange={setPurchaseOrder}
          />

          {/* Payment Details */}
          <PaymentDetails
            paymentInfo={paymentInfo}
            bankAccounts={bankAccounts}
            selectedBankAccounts={selectedBankAccounts}
            onBankAccountSelect={handleBankAccountSelect}
            quoteNumber={quoteNumber}
            grandTotal={totals.grandTotal}
          />
        </div>
      </div>

      <SuccessModal
        isOpen={showSuccessModal}
        successData={successData}
        onClose={handleSuccessModalClose}
      />
    </div>
  );
};

export default CreateQuote;
