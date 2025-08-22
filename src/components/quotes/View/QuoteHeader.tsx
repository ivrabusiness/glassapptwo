import React from 'react';
import { ArrowLeft, Printer, Edit, Lock, FileText } from 'lucide-react';
import { Quote, WorkOrder } from '../../../types';

interface QuoteHeaderProps {
  quote: Quote;
  workOrder: WorkOrder | null;
  canEditQuote: boolean;
  onBack: () => void;
  onEdit: () => void;
  onPrintQuote: (e?: React.MouseEvent) => void;
}

const QuoteHeader: React.FC<QuoteHeaderProps> = ({
  quote,
  workOrder,
  canEditQuote,
  onBack,
  onEdit,
  onPrintQuote
}) => {
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

  // Provjeri je li ponuda istekla
  const isExpired = () => {
    const today = new Date();
    const validUntil = new Date(quote.validUntil);
    return today > validUntil && quote.status !== 'accepted' && quote.status !== 'converted';
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Ponuda {quote.quoteNumber}</h1>
            <div className="flex items-center space-x-3 mt-1">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                isExpired() ? 'bg-yellow-100 text-yellow-800' : getStatusColor(quote.status)
              }`}>
                {isExpired() ? 'Istekla' : getStatusText(quote.status)}
              </span>
              <span className="text-sm text-gray-500">
                Kreirana: {new Date(quote.createdAt).toLocaleDateString('hr-HR')}
              </span>
              {/* Prikaži broj radnog naloga u header-u ako postoji */}
              {workOrder && (
                <span className="text-sm text-green-600 font-medium bg-green-50 px-2 py-1 rounded">
                  Nalog: {workOrder.orderNumber}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex space-x-3">
          {/* Edit gumb bez popup-a kad je disabled */}
          <button
            onClick={onEdit}
            className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              canEditQuote
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            title={canEditQuote ? 'Uredi ponudu' : `Ponuda se ne može uređivati (status: ${getStatusText(quote.status)})`}
          >
            {canEditQuote ? (
              <>
                <Edit className="h-4 w-4 mr-2" />
                Uredi ponudu
              </>
            ) : (
              <>
                <Lock className="h-4 w-4 mr-2" />
                Zaključana
              </>
            )}
          </button>
          {/* Gumb za printanje ponude */}
          <button
            onClick={onPrintQuote}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
          >
            <Printer className="h-4 w-4 mr-2" />
            Ispiši ponudu
          </button>
        </div>
      </div>

      {/* Obavijest o pretvorbi u radni nalog */}
      {quote.status === 'converted' && workOrder && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <FileText className="h-5 w-5 text-green-500 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-green-900">Ponuda je pretvorena u radni nalog</h3>
              <p className="text-sm text-green-700 mt-1">
                Ova ponuda je prihvaćena i pretvorena u radni nalog <strong>{workOrder.orderNumber}</strong>. 
                Sve promjene i daljnje upravljanje se vrši kroz radni nalog.
              </p>
            </div>
          </div>
        </div>
      )}
      {/* Obavijest o ograničenjima uređivanja */}
      {!canEditQuote && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Lock className="h-5 w-5 text-amber-500 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-amber-900">Ponuda je zaključana za uređivanje</h3>
              <p className="text-sm text-amber-700 mt-1">
                Ponuda s statusom "<strong>{getStatusText(quote.status)}</strong>" se ne može uređivati. 
                Uređivanje je omogućeno za ponude u statusu 'Kreirana'. Ako je ponuda pretvorena u nalog,
                uređivanje je moguće samo dok je povezani radni nalog u statusu 'skica'.
              </p>
            </div>
          </div>
        </div>
      )}

    </>
  );
};

export default QuoteHeader;
