import React from 'react';
import { Calendar } from 'lucide-react';
import { QuoteItem } from '../../../types';

interface QuoteSummaryProps {
  quoteNumber: string;
  items: QuoteItem[];
  validUntil: string;
  onValidUntilChange: (date: string) => void;
  vatRate: number;
  onVatRateChange: (rate: number) => void;
  totalAmount: number;
  vatAmount: number;
  grandTotal: number;
  processAmount: number;
  productAmount: number;
  purchaseOrder?: string;
  onPurchaseOrderChange?: (po: string) => void;
}

const QuoteSummary: React.FC<QuoteSummaryProps> = ({
  quoteNumber,
  items, 
  validUntil,
  onValidUntilChange,
  vatRate,
  onVatRateChange,
  totalAmount,
  processAmount,
  vatAmount,
  grandTotal,
  productAmount,
  purchaseOrder,
  onPurchaseOrderChange,
}) => {
  // Izračunaj minimalni datum (danas)
  const today = new Date().toISOString().split('T')[0];
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Sažetak ponude</h3>
      
      <div className="space-y-4">
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Broj ponude:</span>
            <span className="font-medium">{quoteNumber}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Stavke:</span>
            <span className="font-medium">{items.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Ukupno komada:</span>
            <span className="font-medium">
              {items.reduce((total, item) => total + item.quantity, 0)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Ukupna površina:</span>
            <span className="font-medium">
              {items.reduce((total, item) => total + (item.dimensions.area * item.quantity), 0).toFixed(4)} m²
            </span>
          </div>
        </div>
        
        {/* Datum valjanosti */}
        <div className="pt-4 border-t border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ponuda vrijedi do:
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="date"
              value={validUntil}
              onChange={(e) => onValidUntilChange(e.target.value)}
              min={today}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>
        
        {/* Narudžbenica (PO) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Narudžbenica
          </label>
          <input
            type="text"
            value={purchaseOrder || ''}
            onChange={(e) => onPurchaseOrderChange?.(e.target.value)}
            placeholder="npr. PO-2025-0001"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        {/* PDV stopa */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Stopa PDV-a (%):
          </label>
          <select
            value={vatRate}
            onChange={(e) => onVatRateChange(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value={0}>0%</option>
            <option value={5}>5%</option>
            <option value={13}>13%</option>
            <option value={25}>25%</option>
          </select>
        </div>
        
        
        <div className="pt-4 border-t border-gray-200 space-y-2">          
          {/* Product and process totals */}
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Proizvodi (bez PDV-a):</span>
            <span className="font-medium">
              {(productAmount ?? 0).toLocaleString('hr-HR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-purple-700 font-medium">Procesi (bez PDV-a):</span>
            <span className="font-medium text-purple-700">
              {processAmount.toLocaleString('hr-HR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
            </span>
          </div>
          
          {/* Total including products and processes */}
          <div className="flex justify-between items-center pt-2 border-t border-gray-200">
            <span className="text-gray-800 font-medium">Ukupno bez PDV-a (proizvodi i procesi):</span>
            <span className="font-medium">
              {totalAmount.toLocaleString('hr-HR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-700">PDV ({vatRate}%):</span>
            <span className="font-medium">
              {vatAmount.toLocaleString('hr-HR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
            </span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-gray-200">
            <span className="text-gray-900 font-bold">UKUPNO:</span>
            <span className="text-lg font-bold text-purple-700">
              {grandTotal.toLocaleString('hr-HR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuoteSummary;
