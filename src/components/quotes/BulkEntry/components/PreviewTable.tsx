import React from 'react';
import { Layers, Maximize2 } from 'lucide-react';
import { ParsedDimension } from '../types';
import { mmToMeters, formatNumber } from '../utils';

interface PreviewTableProps {
  items: ParsedDimension[];
  unitPrice: number;
  onUnitPriceChange: (price: number) => void;
}

/**
 * Komponenta za prikaz tablice s parsiranim stavkama
 */
const PreviewTable: React.FC<PreviewTableProps> = ({
  items,
  unitPrice,
  onUnitPriceChange
}) => {
  return (
    <div className="space-y-4">
      {/* Unos cijene po m² */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <label htmlFor="unit-price" className="block text-sm font-medium text-blue-900 mb-2">
          Cijena po m²
        </label>
        <div className="relative">
          <input
            type="number"
            id="unit-price"
            value={unitPrice}
            onChange={(e) => onUnitPriceChange(parseFloat(e.target.value) || 0)}
            step="0.01"
            min="0"
            className="w-full px-3 py-2 pr-12 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            placeholder="0.00"
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-blue-600 text-sm">€/m²</span>
          </div>
        </div>
      </div>

      {/* Tablica stavki */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center">
            <Layers className="h-4 w-4 mr-2" />
            Pregled stavki ({items.length})
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  #
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center">
                    <Maximize2 className="h-3 w-3 mr-1" />
                    Dimenzije (mm)
                  </div>
                </th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Količina
                </th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Površina (m²)
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.map((item, index) => {
                const widthInMeters = mmToMeters(item.width);
                const heightInMeters = mmToMeters(item.height);
                const area = widthInMeters * heightInMeters;
                const totalArea = area * item.quantity;

                return (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-3 py-2.5 whitespace-nowrap text-sm text-gray-500">
                      {index + 1}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-sm">
                      <div className="flex items-center">
                        <span className="font-medium text-gray-900">
                          {item.width} × {item.height}
                        </span>
                        <span className="ml-2 text-xs text-gray-500">
                          ({formatNumber(area, 4)} m²)
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-sm text-center">
                      <span className="inline-flex items-center justify-center">
                        <span className="text-gray-900">{item.quantity}</span>
                      </span>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-sm text-right font-medium text-blue-600">
                      {formatNumber(totalArea, 4)} m²
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PreviewTable;

