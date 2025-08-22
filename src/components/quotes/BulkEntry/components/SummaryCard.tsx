import React from 'react';
import { ParsedDimension } from '../types';
import { calculateTotalArea, calculateTotalPrice, formatNumber, formatPrice } from '../utils';

interface SummaryCardProps {
  items: ParsedDimension[];
  unitPrice: number;
}

/**
 * Komponenta za prikaz sažetka bulk entry stavki
 */
const SummaryCard: React.FC<SummaryCardProps> = ({
  items,
  unitPrice
}) => {
  const totalArea = calculateTotalArea(items);
  const totalPrice = calculateTotalPrice(items, unitPrice);

  return (
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-700">
          Ukupno artikala: <span className="font-medium">{items.length}</span>
        </div>
        <div className="text-sm text-gray-700">
          Ukupna površina: <span className="font-medium text-blue-600">
            {formatNumber(totalArea, 4)} m²
          </span>
        </div>
      </div>
      <div className="mt-2 pt-2 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Cijena po m²: <span className="font-medium">{formatPrice(unitPrice)} €</span>
          </div>
          <div className="text-sm text-gray-700">
            Ukupna cijena: <span className="font-medium text-blue-600">
              {formatPrice(totalPrice)} €
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryCard;

