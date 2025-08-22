import React from 'react';
import { Package } from 'lucide-react';
import { Product } from '../../../../types';

interface ProductSelectorProps {
  products: Product[];
  selectedProductId: string;
  onProductChange: (productId: string) => void;
  error?: string | null;
}

/**
 * Komponenta za odabir proizvoda u bulk entry modalu
 */
const ProductSelector: React.FC<ProductSelectorProps> = ({
  products,
  selectedProductId,
  onProductChange,
  error
}) => {
  return (
    <div className="mb-6">
      <label htmlFor="product-select" className="block text-sm font-medium text-gray-900 mb-2">
        <Package className="h-4 w-4 inline mr-2" />
        Odaberite proizvod
      </label>
      <select
        id="product-select"
        value={selectedProductId}
        onChange={(e) => onProductChange(e.target.value)}
        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm ${
          error && !selectedProductId ? 'border-red-300' : 'border-gray-300'
        }`}
      >
        <option value="">-- Odaberite proizvod --</option>
        {products.map(product => (
          <option key={product.id} value={product.id}>
            {product.name} - {product.price?.toFixed(2)} €/m²
          </option>
        ))}
      </select>
      {error && !selectedProductId && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

export default ProductSelector;

