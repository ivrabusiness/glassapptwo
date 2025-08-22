import React from 'react';
import { Euro } from 'lucide-react';
import { QuoteItem, Product, Service } from '../../../../types';

interface PricingDisplayProps {
  item: QuoteItem;
  product?: Product;
  service?: Service;
  processPrice: number;
  onQuantityChange: (quantity: number) => void;
  onUnitPriceChange: (unitPrice: number) => void;
}

const PricingDisplay: React.FC<PricingDisplayProps> = ({
  item,
  product,
  service,
  processPrice,
  onQuantityChange,
  onUnitPriceChange
}) => {
  const getUnitLabel = (unit: string): string => {
    switch (unit) {
      case 'hour': return 'sat';
      case 'piece': return 'komad';
      case 'square_meter': return 'm²';
      case 'linear_meter': return 'm';
      default: return unit;
    }
  };

  return (
    <>
      {/* Quantity */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Količina (kom)</label>
        <input
          type="number"
          min="1"
          value={item.quantity}
          onChange={(e) => onQuantityChange(parseInt(e.target.value) || 1)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        />
      </div>

      {/* Unit Price */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Cijena po m² (€)</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Euro className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="number"
            min="0"
            step="0.01"
            value={item.unitPrice}
            onChange={(e) => onUnitPriceChange(parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 pl-8 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder={product?.price ? product.price.toString() : "0.00"}
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-gray-500">€/{item.isService && service ? 
              getUnitLabel(service.unit) : 
              (product?.materials && product.materials.length > 0 ? product.materials[0].unit : 'm²')}</span>
          </div>
        </div>
      </div>

      {/* Total Price (Read-only) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Ukupna cijena (€)</label>
        <div className="relative">
          <input
            type="text"
            value={item.totalPrice.toLocaleString('hr-HR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            readOnly
            className="w-full px-3 py-2 pl-8 border border-gray-300 rounded-md bg-gray-50 cursor-not-allowed"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Euro className="h-4 w-4 text-gray-400" />
          </div>
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-gray-500">€/m²</span>
          </div>
        </div>
      </div>


    </>
  );
};

export default PricingDisplay;

