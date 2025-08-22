import React, { useMemo } from 'react';
import { History, Truck, FileText, XCircle, ExternalLink, Paperclip, Download } from 'lucide-react';
import { parseWorkOrderFromNotes } from '../../utils/workOrderUtils';
import { InventoryItem, StockTransaction, Supplier } from '../../types';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItem: InventoryItem | null;
  transactions: StockTransaction[];
  suppliers: Supplier[];
  onOpenWorkOrder: (workOrderNumber: string) => void;
}

const HistoryModal: React.FC<HistoryModalProps> = React.memo(({
  isOpen,
  onClose,
  selectedItem,
  transactions,
  suppliers,
  onOpenWorkOrder
}) => {
  // Memoize filtered transactions for performance (hooks must not be conditional)
  const selectedId = selectedItem?.id;
  const filteredTransactions = useMemo(() => {
    if (!selectedId) return [] as typeof transactions;
    return transactions.filter(t => t.inventoryItemId === selectedId);
  }, [transactions, selectedId]);

  if (!isOpen || !selectedItem) return null;

  const getTransactionTypeText = (type: string) => {
    switch (type) {
      case 'in': return 'Ulaz';
      case 'out': return 'Izlaz';
      case 'adjustment': return 'Korekcija';
      case 'return': return 'Povrat iz naloga';
      default: return type;
    }
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'in': return 'text-green-600 bg-green-50';
      case 'out': return 'text-red-600 bg-red-50';
      case 'adjustment': return 'text-blue-600 bg-blue-50';
      case 'return': return 'text-orange-600 bg-orange-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  // KLJUČNO: Funkcija za rukovanje klikom na nalog
  const handleWorkOrderClick = (workOrderNumber: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    // Pozovi onOpenWorkOrder prop funkciju
    onOpenWorkOrder(workOrderNumber);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium text-gray-900">
                Povijest promjena - {selectedItem.name}
              </h2>
              <p className="text-sm text-gray-500">
                Kod: {selectedItem.code}
                {selectedItem.type === 'glass' && selectedItem.glassThickness && (
                  <span className="ml-2 text-blue-600">• {selectedItem.glassThickness}mm staklo</span>
                )}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircle className="h-6 w-6" />
            </button>
          </div>
        </div>
        
        <div className="p-6">
          {filteredTransactions.length > 0 ? (
            <div className="space-y-4">
              {filteredTransactions.map((transaction) => {
                const supplier = transaction.supplierId ? suppliers.find(s => s.id === transaction.supplierId) : null;
                const workOrderNumber = parseWorkOrderFromNotes(transaction.notes || '');
                
                return (
                  <div key={transaction.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTransactionTypeColor(transaction.type)}`}>
                          {getTransactionTypeText(transaction.type)}
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {transaction.quantity} {selectedItem.unit}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(transaction.createdAt).toLocaleString('hr-HR')}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-2">
                      <span>Stanje: {transaction.previousQuantity} → {transaction.newQuantity} {selectedItem.unit}</span>
                    </div>
                    
                    {supplier && (
                      <div className="flex items-center text-sm text-gray-600 mb-1">
                        <Truck className="h-4 w-4 mr-1" />
                        <span>Dobavljač: {supplier.name}</span>
                      </div>
                    )}
                    
                    {transaction.documentNumber && (
                      <div className="flex items-center text-sm text-gray-600 mb-1">
                        <FileText className="h-4 w-4 mr-1" />
                        <span>
                          {transaction.documentType === 'invoice' ? 'Račun' : 
                           transaction.documentType === 'delivery-note' ? 'Otpremnica' : 'Dokument'}: 
                          {transaction.documentNumber}
                        </span>
                      </div>
                    )}
                    
                    {transaction.notes && (
                      <div className="text-sm text-gray-600 mt-2 p-2 bg-gray-50 rounded border border-gray-200">
                        {/* KLJUČNO: Prikaz napomene s klikom na radni nalog */}
                        {workOrderNumber ? (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span>Povezano s radnim nalogom:</span>
                              <button
                                onClick={(e) => handleWorkOrderClick(workOrderNumber, e)}
                                className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded hover:bg-blue-200 transition-colors"
                                title="Otvori radni nalog"
                              >
                                <ExternalLink className="h-3 w-3 mr-1" />
                                {workOrderNumber}
                              </button>
                            </div>
                            <div className="text-xs text-gray-500 border-t border-gray-200 pt-2">
                              {transaction.notes}
                            </div>
                          </div>
                        ) : (
                          <div>{transaction.notes}</div>
                        )}
                      </div>
                    )}
                    
                    {/* NOVO: Prikaz attachmenta ako postoji */}
                    {transaction.attachmentUrl && (
                      <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-200 flex items-center justify-between">
                        <div className="flex items-center">
                          <Paperclip className="h-4 w-4 text-blue-600 mr-2" />
                          <span className="text-sm text-blue-700 truncate max-w-xs">
                            {transaction.attachmentName || 'Priloženi dokument'}
                          </span>
                        </div>
                        <a 
                          href={transaction.attachmentUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded hover:bg-blue-200 transition-colors"
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Preuzmi
                        </a>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <History className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nema promjena</h3>
              <p className="mt-1 text-sm text-gray-500">
                Nema zabilježenih promjena za ovaj artikal
              </p>
            </div>
          )}
        </div>
        
        <div className="p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            Zatvori
          </button>
        </div>
      </div>
    </div>
  );
});

// Add display name for better debugging
HistoryModal.displayName = 'HistoryModal';

export default HistoryModal;
