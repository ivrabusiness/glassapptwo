import React from 'react';
import { TrendingUp, TrendingDown, RotateCcw, Truck, FileText, ExternalLink, ChevronDown, ChevronUp, Info, AlertCircle, Paperclip, Download } from 'lucide-react';
import { StockTransaction, Supplier } from '../../../types';

interface TransactionsListProps {
  groupedTransactions: {
    [key: string]: StockTransaction[];
  };
  formatMonthYear: (key: string) => string;
  suppliers: Supplier[];
  parseWorkOrderFromNotes: (notes: string) => string | null;
  handleWorkOrderClick: (workOrderNumber: string, event: React.MouseEvent) => void;
  expandedTransactionId: string | null;
  toggleTransactionDetails: (transactionId: string) => void;
}

const TransactionsList: React.FC<TransactionsListProps> = ({
  groupedTransactions,
  formatMonthYear,
  suppliers,
  parseWorkOrderFromNotes,
  handleWorkOrderClick,
  expandedTransactionId,
  toggleTransactionDetails
}) => {
  const getTransactionTypeText = (type: string) => {
    switch (type) {
      case 'in': return 'Ulaz';
      case 'out': return 'Izlaz';
      case 'adjustment': return 'Korekcija';
      default: return type;
    }
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'in': return 'text-green-600 bg-green-50 border-green-200';
      case 'out': return 'text-red-600 bg-red-50 border-red-200';
      case 'adjustment': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getTransactionTypeIcon = (type: string) => {
    switch (type) {
      case 'in': return TrendingUp;
      case 'out': return TrendingDown;
      case 'adjustment': return RotateCcw;
      default: return Info;
    }
  };

  const getDocumentTypeText = (type: string | undefined) => {
    if (!type) return '';
    switch (type) {
      case 'invoice': return 'Račun';
      case 'delivery-note': return 'Otpremnica';
      case 'other': return 'Ostalo';
      default: return type;
    }
  };

  // Ako nema transakcija
  if (Object.keys(groupedTransactions).length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
        <div className="py-12">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Nema transakcija</h3>
          <p className="mt-1 text-sm text-gray-500">
            Za ovaj artikal nema zabilježenih transakcija koje odgovaraju odabranim filterima.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 print:space-y-4">
      {Object.keys(groupedTransactions)
        .sort((a, b) => {
          const [monthA, yearA] = a.split('-').map(Number);
          const [monthB, yearB] = b.split('-').map(Number);
          
          if (yearA !== yearB) return yearB - yearA;
          return monthB - monthA;
        })
        .map(monthYear => (
          <div key={monthYear} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden print:border print:border-gray-300">
            <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 print:bg-gray-100">
              <h3 className="text-lg font-medium text-gray-900">{formatMonthYear(monthYear)}</h3>
            </div>
            
            <div className="divide-y divide-gray-200">
              {groupedTransactions[monthYear].map(transaction => {
                const supplier = transaction.supplierId ? suppliers.find(s => s.id === transaction.supplierId) : null;
                const workOrderNumber = parseWorkOrderFromNotes(transaction.notes || '');
                const TransactionIcon = getTransactionTypeIcon(transaction.type);
                const isExpanded = expandedTransactionId === transaction.id;
                
                return (
                  <div key={transaction.id} className="p-6 hover:bg-gray-50 print:p-4 print:hover:bg-white">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="flex items-start space-x-4">
                        <div className={`p-3 rounded-lg ${getTransactionTypeColor(transaction.type)} print:p-2`}>
                          <TransactionIcon className="h-5 w-5" />
                        </div>
                        
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTransactionTypeColor(transaction.type)}`}>
                              {getTransactionTypeText(transaction.type)}
                            </span>
                            <span className="text-sm font-medium text-gray-900">
                              {transaction.quantity} {transaction.type === 'in' ? 'dodano' : transaction.type === 'out' ? 'oduzeto' : 'postavljeno'}
                            </span>
                          </div>
                          
                          <div className="mt-1 text-sm text-gray-600">
                            <span>Stanje: {transaction.previousQuantity.toFixed(transaction.type === 'in' ? 4 : 0)} → {transaction.newQuantity.toFixed(transaction.type === 'in' ? 4 : 0)}</span>
                          </div>
                          
                          <div className="mt-2 flex flex-wrap gap-2">
                            {supplier && (
                              <div className="flex items-center text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                <Truck className="h-3 w-3 mr-1" />
                                <span>Dobavljač: {supplier.name}</span>
                              </div>
                            )}
                            
                            {transaction.documentNumber && (
                              <div className="flex items-center text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                <FileText className="h-3 w-3 mr-1" />
                                <span>
                                  {getDocumentTypeText(transaction.documentType)}: {transaction.documentNumber}
                                </span>
                              </div>
                            )}
                            
                            {workOrderNumber && (
                              <button
                                onClick={(e) => handleWorkOrderClick(workOrderNumber, e)}
                                className="flex items-center text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 transition-colors"
                              >
                                <ExternalLink className="h-3 w-3 mr-1" />
                                <span>Nalog: {workOrderNumber}</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4 md:min-w-[120px] md:text-right">
                        <div className="text-right ml-auto">
                          <div className="text-sm text-gray-900">
                            {new Date(transaction.createdAt).toLocaleDateString('hr-HR')}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(transaction.createdAt).toLocaleTimeString('hr-HR')}
                          </div>
                        </div>
                        
                        {transaction.notes && (
                          <button
                            onClick={() => toggleTransactionDetails(transaction.id)}
                            className="p-1 text-gray-400 hover:text-gray-600 rounded print:hidden"
                            title={isExpanded ? "Sakrij detalje" : "Prikaži detalje"}
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-5 w-5" />
                            ) : (
                              <ChevronDown className="h-5 w-5" />
                            )}
                          </button>
                        )}
                      </div>
                      
                      {/* NOVO: Prikaz attachmenta ako postoji */}
                      {transaction.attachmentUrl && (
                        <div className="mt-2 flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200">
                          <div className="flex items-center">
                            <Paperclip className="h-4 w-4 text-blue-600 mr-2" />
                            <span className="text-xs text-blue-700 truncate max-w-xs">
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
                    
                    {/* Prošireni detalji */}
                    {(isExpanded || transaction.notes) && (
                      <div className={`mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 ${isExpanded ? 'block' : 'print:block hidden'}`}>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Detalji transakcije:</h4>
                        <div className="text-sm text-gray-700 whitespace-pre-wrap">
                          {transaction.notes || 'Nema dodatnih detalja'}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
    </div>
  );
};

export default TransactionsList;
