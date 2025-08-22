import React from 'react';
import { FileText } from 'lucide-react';
import { Quote } from '../../../../types';

interface QuoteSummaryCardProps {
  quote: Quote;
  productAmount: number;
  processAmount: number;
}

const QuoteSummaryCard: React.FC<QuoteSummaryCardProps> = ({
  quote,
  productAmount,
  processAmount
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
        <FileText className="h-5 w-5 mr-2 text-gray-500" />
        Sažetak ponude
      </h3>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Proizvodi:</span>
          <span className="font-medium">
            {productAmount.toLocaleString('hr-HR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Procesi:</span>
          <span className="font-medium">
            {processAmount.toLocaleString('hr-HR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
          </span>
        </div>
        <div className="flex justify-between border-t border-gray-200 pt-2">
          <span className="text-gray-600">Ukupno (bez PDV-a):</span>
          <span className="font-medium">
            {quote.totalAmount.toLocaleString('hr-HR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">PDV ({quote.vatRate}%):</span>
          <span className="font-medium">
            {quote.vatAmount.toLocaleString('hr-HR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
          </span>
        </div>
        <div className="flex justify-between pt-2 border-t border-gray-200">
          <span className="text-gray-900 font-bold">UKUPNO:</span>
          <span className="font-bold text-purple-700">
            {quote.grandTotal.toLocaleString('hr-HR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
          </span>
        </div>
      </div>
    </div>
  );
};

export default QuoteSummaryCard;

