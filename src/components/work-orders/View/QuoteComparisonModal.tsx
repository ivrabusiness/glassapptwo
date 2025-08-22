import React, { useState } from 'react';
import { AlertTriangle, DollarSign, FileText, CheckCircle, X } from 'lucide-react';
import { WorkOrder, Quote } from '../../../types';
import { useAuth } from '../../../contexts/AuthContext';

interface QuoteComparisonModalProps {
  workOrder: WorkOrder;
  quote: Quote;
  onClose: () => void;
  onUpdateQuote: (reason: string) => void;
  onApproveChange: (reason: string) => void;
}

const QuoteComparisonModal: React.FC<QuoteComparisonModalProps> = ({
  workOrder,
  quote,
  onClose,
  onUpdateQuote,
  onApproveChange
}) => {
  const { user } = useAuth();
  const [selectedAction, setSelectedAction] = useState<'approve' | 'update' | null>(null);
  const [reason, setReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const priceDifference = (workOrder.currentTotal || 0) - (workOrder.originalQuoteTotal || 0);
  const percentageChange = workOrder.originalQuoteTotal ? 
    (priceDifference / workOrder.originalQuoteTotal * 100) : 0;

  const handleSubmit = async () => {
    if (!selectedAction || !reason.trim()) return;
    
    setIsProcessing(true);
    try {
      if (selectedAction === 'approve') {
        await onApproveChange(reason);
      } else {
        await onUpdateQuote(reason);
      }
      onClose();
    } catch (error) {
      console.error('Greška:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 sm:mx-0 sm:h-10 sm:w-10">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Neusklađenost između ponude i naloga
                </h3>
                
                <div className="mt-4 space-y-4">
                  {/* Usporedba cijena */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3">💰 Usporedba cijena</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Originalna ponuda:</span>
                        <p className="font-medium">{workOrder.originalQuoteTotal?.toLocaleString('hr-HR', { minimumFractionDigits: 2 })} €</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Trenutni nalog:</span>
                        <p className="font-medium">{workOrder.currentTotal?.toLocaleString('hr-HR', { minimumFractionDigits: 2 })} €</p>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className={`flex items-center justify-between ${priceDifference > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        <span className="font-medium">Razlika:</span>
                        <span className="font-bold">
                          {priceDifference > 0 ? '+' : ''}{priceDifference.toLocaleString('hr-HR', { minimumFractionDigits: 2 })} € 
                          ({percentageChange > 0 ? '+' : ''}{percentageChange.toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Opcije rješavanja */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">🔧 Kako riješiti neusklađenost?</h4>
                    
                    <div className="space-y-2">
                      <label className="flex items-start space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="action"
                          value="approve"
                          checked={selectedAction === 'approve'}
                          onChange={(e) => setSelectedAction(e.target.value as 'approve')}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="font-medium">Odobri promjenu cijene</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            Zadržava trenutnu cijenu naloga. Klijent će biti naplaćen razliku od {priceDifference.toLocaleString('hr-HR', { minimumFractionDigits: 2 })} €.
                          </p>
                        </div>
                      </label>

                      <label className="flex items-start space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          name="action"
                          value="update"
                          checked={selectedAction === 'update'}
                          onChange={(e) => setSelectedAction(e.target.value as 'update')}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <FileText className="h-4 w-4 text-blue-600" />
                            <span className="font-medium">Ažuriraj ponudu</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            Kreira novu verziju ponude s trenutnim cijenama naloga. Originalna ponuda ostaje za evidenciju.
                          </p>
                        </div>
                      </label>
                    </div>

                    {selectedAction && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Razlog {selectedAction === 'approve' ? 'odobrenja promjene' : 'ažuriranja ponude'}:
                        </label>
                        <textarea
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows={3}
                          placeholder="Opišite razlog promjene (npr. dodani materijali, promjena specifikacije...)"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!selectedAction || !reason.trim() || isProcessing}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Obrađujem...
                </>
              ) : (
                selectedAction === 'approve' ? '✅ Odobri promjenu' : '📝 Ažuriraj ponudu'
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
            >
              Odustani
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuoteComparisonModal;
