import React from 'react';
import { WorkOrderItem } from '@/types';

interface OrderSummaryProps {
  orderNumber: string;
  items: WorkOrderItem[];
  purchaseOrder?: string;
  onPurchaseOrderChange?: (po: string) => void;
}

const OrderSummary: React.FC<OrderSummaryProps> = ({ orderNumber, items, purchaseOrder, onPurchaseOrderChange }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Sažetak naloga</h3>
      <div className="space-y-3 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Broj naloga:</span>
          <span className="font-medium">{orderNumber}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Artikli:</span>
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

      {/* Narudžbenica kupca */}
      <div className="pt-4 border-t border-gray-200 mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Narudžbenica
        </label>
        <input
          type="text"
          value={purchaseOrder || ''}
          onChange={(e) => onPurchaseOrderChange?.(e.target.value)}
          placeholder="npr. PO-2025-0001"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
    </div>
  );
};

export default OrderSummary;
