import React, { useMemo } from 'react';
import { Euro } from 'lucide-react';
import { Quote } from '../../../../types';

interface PaymentInfoCardProps {
  quote: Quote;
}

const PaymentInfoCard: React.FC<PaymentInfoCardProps> = ({ quote }) => {
  // Normalize paymentInfo to ensure it's always an array
  const normalizedPaymentInfo = useMemo(() => {
    if (!quote.paymentInfo) return [];
    const paymentArray = Array.isArray(quote.paymentInfo) ? quote.paymentInfo : [quote.paymentInfo];
    // Filter out empty payment info (no company name or IBAN)
    return paymentArray.filter(info => info.companyName && info.iban);
  }, [quote.paymentInfo]);

  const hasPaymentData = normalizedPaymentInfo.length > 0;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
        <Euro className="h-5 w-5 mr-2 text-gray-500" />
        Podaci za plaćanje
      </h3>
      
      {hasPaymentData ? (
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Primatelj:</span>
            <span className="font-medium">{normalizedPaymentInfo[0]?.companyName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">IBAN:</span>
            <span className="font-medium">{normalizedPaymentInfo[0]?.iban}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Model:</span>
            <span className="font-medium">{normalizedPaymentInfo[0]?.model || 'HR00'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Poziv na broj:</span>
            <span className="font-medium">{normalizedPaymentInfo[0]?.reference || quote.quoteNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Opis plaćanja:</span>
            <span className="font-medium truncate max-w-[150px]">{normalizedPaymentInfo[0]?.description || `Plaćanje po ponudi ${quote.quoteNumber}`}</span>
          </div>
        </div>
      ) : (
        <div className="text-center py-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center justify-center mb-2">
              <svg className="h-8 w-8 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-900 mb-2">Podaci nisu dodani</p>
            <p className="text-xs text-gray-600 mb-3">
              Dodajte bankovne račune u profil za prikaz podataka za plaćanje.
            </p>
            <a
              href="/profile"
              className="inline-flex items-center px-3 py-1.5 bg-purple-600 text-white text-xs font-medium rounded hover:bg-purple-700 transition-colors"
            >
              Dodaj podatke
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentInfoCard;

