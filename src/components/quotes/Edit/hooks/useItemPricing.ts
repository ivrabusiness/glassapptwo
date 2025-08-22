import { useCallback, useEffect } from 'react';
import { QuoteItem, Product, Service } from '../../../../types';

interface UseItemPricingParams {
  item: QuoteItem;
  product?: Product;
  service?: Service;
  onUpdate: (itemId: string, field: keyof QuoteItem, value: any) => void;
}

export function useItemPricing({ item, product, service, onUpdate }: UseItemPricingParams) {
  // Function to calculate total price
  const calculateTotalPrice = useCallback((unitPrice: number, quantity: number, area: number): number => {
    return unitPrice * quantity * area;
  }, []);

  // When product changes, update unit price from product price if available
  useEffect(() => {
    if (product && product.price && product.price > 0 && (!item.unitPrice || item.unitPrice === 0)) {
      onUpdate(item.id, 'unitPrice', product.price);
      const newTotalPrice = calculateTotalPrice(product.price, item.quantity, item.dimensions.area);
      onUpdate(item.id, 'totalPrice', newTotalPrice);
    }
  }, [product, item.productId, item.unitPrice, item.quantity, item.dimensions.area, onUpdate, calculateTotalPrice]);

  // When service changes, update unit price from service price if available
  useEffect(() => {
    if (service && service.price && service.price > 0 && (!item.unitPrice || item.unitPrice === 0)) {
      onUpdate(item.id, 'unitPrice', service.price);
      const newTotalPrice = calculateTotalPrice(service.price, item.quantity, item.dimensions.area);
      onUpdate(item.id, 'totalPrice', newTotalPrice);
    }
  }, [service, item.serviceId, item.unitPrice, item.quantity, item.dimensions.area, onUpdate, calculateTotalPrice]);

  const handleQuantityChange = useCallback((quantity: number) => {
    onUpdate(item.id, 'quantity', quantity);
    // Also update total price
    const newTotalPrice = item.isService 
      ? quantity * item.unitPrice 
      : item.dimensions.area * quantity * item.unitPrice;
    onUpdate(item.id, 'totalPrice', newTotalPrice);
  }, [item.id, item.isService, item.unitPrice, item.dimensions.area, onUpdate]);

  const handleUnitPriceChange = useCallback((unitPrice: number) => {
    onUpdate(item.id, 'unitPrice', unitPrice);
    // Also update total price
    const calculatedTotalPrice = item.isService 
      ? item.quantity * unitPrice 
      : item.dimensions.area * item.quantity * unitPrice;
    onUpdate(item.id, 'totalPrice', calculatedTotalPrice);
  }, [item.id, item.isService, item.quantity, item.dimensions.area, onUpdate]);

  return {
    calculateTotalPrice,
    handleQuantityChange,
    handleUnitPriceChange
  };
}

