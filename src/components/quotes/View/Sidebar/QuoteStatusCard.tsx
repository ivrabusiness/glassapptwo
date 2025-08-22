import React from 'react';
import { Link } from 'react-router-dom';
import { XCircle } from 'lucide-react';
import { Quote, WorkOrder } from '../../../../types';

interface QuoteStatusCardProps {
  quote: Quote;
  workOrder: WorkOrder | null;
  showSuccessMessage: boolean;
  rejectInProgress: boolean;
  rejectProgress: number;
  rejectCompleted: boolean;
  getStatusText: (status: string) => string;
  getStatusColor: (status: string) => string;
}

const QuoteStatusCard: React.FC<QuoteStatusCardProps> = ({
  quote,
  workOrder,
  showSuccessMessage,
  rejectInProgress,
  rejectProgress,
  rejectCompleted,
  getStatusText,
  getStatusColor
}) => {
  return (
    <div className="space-y-6">
      {/* Success Message */}
      {showSuccessMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            {rejectInProgress && !rejectCompleted && (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-600 mr-3"></div>
                <div className="flex-1">
                  <p className="text-red-800 font-medium">Obrađujem odbijanje...</p>
                  <div className="w-full bg-red-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-red-600 h-2 rounded-full transition-all duration-100 ease-out"
                      style={{ width: `${rejectProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-red-600 text-sm mt-1">{Math.round(rejectProgress)}%</p>
                </div>
              </>
            )}
            {rejectCompleted && (
              <>
                <XCircle className="h-5 w-5 text-red-600 mr-3" />
                <p className="text-red-800 font-medium">Ponuda je uspješno odbijena!</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Quote Status */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Status ponude</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Status:</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(quote.status)}`}>
              {getStatusText(quote.status)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Broj ponude:</span>
            <span className="font-medium">{quote.quoteNumber}</span>
          </div>
          {/* Ako je konvertirana ponuda i postoji nalog, prikaži broj naloga ispod broja ponude (klikabilno) */}
          {quote.status === 'converted' && workOrder && (
            <div className="flex justify-between">
              <span className="text-gray-600">Broj naloga:</span>
              <Link
                to={`/work-orders/${workOrder.orderNumber}`}
                className="font-medium text-purple-600 hover:text-purple-800 underline"
                onClick={(e) => e.stopPropagation()}
              >
                {workOrder.orderNumber}
              </Link>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-600">Datum kreiranja:</span>
            <span className="font-medium">
              {new Date(quote.createdAt).toLocaleDateString('hr-HR')}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Vrijedi do:</span>
            <span className="font-medium">
              {new Date(quote.validUntil).toLocaleDateString('hr-HR')}
            </span>
          </div>
          {quote.acceptedAt && (
            <div className="flex justify-between">
              <span className="text-gray-600">Prihvaćeno:</span>
              <span className="font-medium text-green-600">
                {new Date(quote.acceptedAt).toLocaleDateString('hr-HR')} {new Date(quote.acceptedAt).toLocaleTimeString('hr-HR')}
              </span>
            </div>
          )}
          {quote.rejectedAt && (
            <div className="flex justify-between">
              <span className="text-gray-600">Odbijeno:</span>
              <span className="font-medium text-red-600">
                {new Date(quote.rejectedAt).toLocaleDateString('hr-HR')} {new Date(quote.rejectedAt).toLocaleTimeString('hr-HR')}
              </span>
            </div>
          )}
          
          {/* Prikaži informacije o radnom nalogu ako je ponuda pretvorena */}
          {quote.status === 'converted' && workOrder && (
            <div className="border-t border-gray-200 pt-3 mt-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Status naloga:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  workOrder.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  workOrder.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                  workOrder.status === 'completed' ? 'bg-green-100 text-green-800' :
                  workOrder.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {workOrder.status === 'pending' ? 'Na čekanju' :
                   workOrder.status === 'in-progress' ? 'U tijeku' :
                   workOrder.status === 'completed' ? 'Završen' :
                   workOrder.status === 'cancelled' ? 'Otkazan' : workOrder.status}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuoteStatusCard;

