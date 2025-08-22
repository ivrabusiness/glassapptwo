import React, { useState } from 'react';
import { Edit, Printer, Lock, CheckCircle, XCircle } from 'lucide-react';
import { Quote, WorkOrder } from '../../../../types';
import ConvertToOrderModal from '../ConvertToOrderModal';

interface QuoteActionsCardProps {
  quote: Quote;
  workOrder: WorkOrder | null;
  canEditQuote: boolean;
  onEdit: () => void;
  onPrintQuote: () => void;
  canRejectQuote: () => boolean;
  canConvertToOrder: () => boolean;
  handleRejectQuote: () => void;
}

const QuoteActionsCard: React.FC<QuoteActionsCardProps> = ({
  quote,
  workOrder,
  canEditQuote,
  onEdit,
  onPrintQuote,
  canRejectQuote,
  canConvertToOrder,
  handleRejectQuote
}) => {
  const [showConvertModal, setShowConvertModal] = useState(false);

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-3">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Akcije</h3>
        
        {/* Edit gumb bez popup-a kad je disabled */}
        <button 
          onClick={onEdit}
          disabled={!canEditQuote}
          className={`w-full flex items-center justify-center px-4 py-2 border rounded-md text-sm font-medium transition-colors ${
            canEditQuote 
              ? 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50' 
              : 'border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed'
          }`}
        >
          {canEditQuote ? (
            <Edit className="h-4 w-4 mr-2" />
          ) : (
            <Lock className="h-4 w-4 mr-2" />
          )}
          {canEditQuote ? 'Uredi ponudu' : 'Ponuda je zaključana'}
        </button>
        {!canEditQuote && (
          <p className="text-xs text-gray-500">
            {quote.status === 'converted' ? (
              workOrder ? (
                workOrder.status !== 'draft' ? 'Uređivanje nije moguće jer je povezani radni nalog već započet ili završen. Uređivanje je dopušteno samo dok je nalog skica.' : null
              ) : (
                'Uređivanje nije moguće jer je ponuda pretvorena, ali povezani radni nalog nije pronađen.'
              )
            ) : quote.status === 'accepted' ? (
              'Ponuda je plaćena i zaključana za izmjene.'
            ) : quote.status === 'rejected' ? (
              'Ponuda je odbijena i nije je moguće uređivati.'
            ) : quote.status === 'expired' ? (
              'Ponuda je istekla i nije je moguće uređivati.'
            ) : null}
          </p>
        )}

        <button 
          onClick={onPrintQuote}
          className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          <Printer className="h-4 w-4 mr-2" />
          Ispiši ponudu
        </button>



        {/* Odbij ponudu gumb */}
        {canRejectQuote() && (
          <button 
            onClick={handleRejectQuote}
            className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700"
          >
            <XCircle className="h-4 w-4 mr-2" />
            Odbij ponudu
          </button>
        )}

        {/* Pretvori u radni nalog gumb */}
        {canConvertToOrder() && (
          <button 
            onClick={() => setShowConvertModal(true)}
            className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-purple-600 hover:bg-purple-700"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Pretvori u radni nalog
          </button>
        )}
      </div>

      {/* Convert to Order Modal */}
      {showConvertModal && (
        <ConvertToOrderModal
          quote={quote}
          onClose={() => setShowConvertModal(false)}
        />
      )}
    </>
  );
};

export default QuoteActionsCard;

