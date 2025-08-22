import React from 'react';
import { Briefcase } from 'lucide-react';
import { QuoteItem, Product, Service } from '../../../../types';

interface ProductServiceSelectionProps {
  item: QuoteItem;
  products: Product[];
  services: Service[];
  onUpdate: (itemId: string, field: keyof QuoteItem, value: any) => void;
}

const ProductServiceSelection: React.FC<ProductServiceSelectionProps> = ({
  item,
  products,
  services,
  onUpdate
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
      {/* Type Selection - Product or Service */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tip stavke</label>
        <select 
          value={item.isService ? "service" : "product"}
          onChange={(e) => {
            const isService = e.target.value === "service";
            onUpdate(item.id, 'isService', isService);
            // Reset product/service ID when changing type
            if (isService) {
              onUpdate(item.id, 'productId', '');
              onUpdate(item.id, 'materials', []);
            } else {
              onUpdate(item.id, 'serviceId', '');
            }
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        >
          <option value="product">Proizvod</option>
          <option value="service">Usluga</option>
        </select>
      </div>

      {/* Product or Service Selection based on type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {item.isService ? "Usluga" : "Proizvod"}
        </label>
        {item.isService ? (
          <select
            value={item.serviceId || ''}
            onChange={(e) => {
              const selectedService = services.find(s => s.id === e.target.value);
              onUpdate(item.id, 'serviceId', e.target.value);
              if (selectedService) {
                onUpdate(item.id, 'productName', selectedService.name);
                onUpdate(item.id, 'productCode', selectedService.code);
                if (selectedService.price && selectedService.price > 0) {
                  onUpdate(item.id, 'unitPrice', selectedService.price);
                }
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="">Odaberite uslugu</option>
            {services.map(service => (
              <option key={service.id} value={service.id}>
                {service.name} ({service.code}) - {service.price ? `${service.price.toFixed(2)} €/${getUnitLabel(service.unit)}` : 'Bez cijene'}
              </option>
            ))}
          </select>
        ) : (
          <select
            value={item.productId || ''}
            onChange={(e) => {
              const selectedProduct = products.find(p => p.id === e.target.value);
              onUpdate(item.id, 'productId', e.target.value);
              if (selectedProduct) {
                onUpdate(item.id, 'productName', selectedProduct.name);
                onUpdate(item.id, 'productCode', selectedProduct.code);
                if (selectedProduct.price && selectedProduct.price > 0) {
                  onUpdate(item.id, 'unitPrice', selectedProduct.price);
                }
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="">Odaberite proizvod</option>
            {products.map(product => (
              <option key={product.id} value={product.id}>
                {product.name} ({product.code}) - {product.price ? `${product.price.toFixed(2)} €` : 'Bez cijene'}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Service Badge */}
      {item.isService && (
        <div className="col-span-2">
          <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-800">
            <Briefcase className="h-3 w-3 mr-1" />
            Usluga
          </span>
        </div>
      )}
    </>
  );
};

export default ProductServiceSelection;

