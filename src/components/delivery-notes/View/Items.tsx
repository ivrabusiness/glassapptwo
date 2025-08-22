import React, { useState } from 'react';
import { Package, ChevronDown, ChevronUp } from 'lucide-react';
import { DeliveryNoteItem, Product } from '../../../types';

interface ItemsProps {
  items: DeliveryNoteItem[];
  products: Product[];
}

const Items: React.FC<ItemsProps> = ({ items, products }) => {
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  const toggleItemExpand = (itemId: string) => {
    setExpandedItemId(expandedItemId === itemId ? null : itemId);
  };

  // Calculate totals
  const totalItems = items.length;
  const totalQuantity = items.reduce((total, item) => total + item.quantity, 0);
  const totalArea = items.reduce((total, item) => total + item.totalArea, 0);

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
      <div className="p-6 pb-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b border-gray-100">
          Stavke otpremnice
        </h3>
      </div>
      
      <div className="divide-y divide-gray-200">
        {items.map((item, index) => {
          const isExpanded = expandedItemId === item.id;
          const product = products.find(p => p.id === item.productId);
          
          return (
            <div key={item.id} className={`transition-colors duration-150 ${isExpanded ? 'bg-blue-50' : ''}`}>
              <div 
                className="px-6 py-4 cursor-pointer hover:bg-gray-50"
                onClick={() => toggleItemExpand(item.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full ${isExpanded ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
                      <Package className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-base font-medium text-gray-900">
                        Stavka {index + 1}: {item.productName}
                      </h4>
                      {item.productCode && (
                        <p className="text-sm text-gray-500">Kod: {item.productCode}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium">
                      {item.quantity} × {item.dimensions.width}×{item.dimensions.height} cm
                    </span>
                    <span className="text-sm font-medium text-blue-600">
                      {item.totalArea.toFixed(4)} m²
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>
              
              {/* Expanded content */}
              {isExpanded && (
                <div className="px-6 py-4 bg-blue-50 border-t border-blue-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="text-sm font-medium text-gray-900 mb-2">Detalji proizvoda</h5>
                      <div className="bg-white p-3 rounded-lg border border-blue-200 space-y-2 text-sm">
                        <p><span className="font-medium">Proizvod:</span> {item.productName}</p>
                        {item.productCode && <p><span className="font-medium">Kod:</span> {item.productCode}</p>}
                        {product?.description && <p><span className="font-medium">Opis:</span> {product.description}</p>}
                      </div>
                    </div>
                    
                    <div>
                      <h5 className="text-sm font-medium text-gray-900 mb-2">Detalji dimenzija</h5>
                      <div className="bg-white p-3 rounded-lg border border-blue-200 space-y-2 text-sm">
                        <p><span className="font-medium">Količina:</span> {item.quantity} kom</p>
                        <p><span className="font-medium">Dimenzije:</span> {item.dimensions.width} × {item.dimensions.height} cm</p>
                        <p><span className="font-medium">Površina po komadu:</span> {item.dimensions.area.toFixed(4)} m²</p>
                        <p><span className="font-medium">Ukupna površina:</span> {item.totalArea.toFixed(4)} m²</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Materials display */}
                  {item.materials && item.materials.length > 0 && (
                    <div className="mt-4">
                      <h5 className="text-sm font-medium text-gray-900 mb-2">Materijali</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {item.materials.map((material, idx) => (
                          <div key={idx} className="bg-white p-3 rounded-lg border border-blue-200 text-sm">
                            <p className="font-medium">{material.name}</p>
                            {material.type === 'glass' && material.thickness && (
                              <p className="text-blue-600">{material.thickness}mm</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Notes */}
                  {item.notes && (
                    <div className="mt-4">
                      <h5 className="text-sm font-medium text-gray-900 mb-2">Napomene</h5>
                      <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200 text-sm">
                        {item.notes}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      

    </div>
  );
};

export default Items;
