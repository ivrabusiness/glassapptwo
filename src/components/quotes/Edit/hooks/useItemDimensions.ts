import { useCallback } from 'react';
import { QuoteItem } from '../../../../types';

interface UseItemDimensionsParams {
  item: QuoteItem;
  onUpdate: (itemId: string, field: keyof QuoteItem, value: any) => void;
}

export function useItemDimensions({ item, onUpdate }: UseItemDimensionsParams) {
  const handleDimensionChange = useCallback((field: 'width' | 'height', value: number) => {
    const newDimensions = { ...item.dimensions, [field]: value };
    // Calculate area in m² (convert mm to m)
    const widthInMeters = newDimensions.width / 1000;
    const heightInMeters = newDimensions.height / 1000;
    newDimensions.area = widthInMeters * heightInMeters;
    onUpdate(item.id, 'dimensions', newDimensions);

    // Also update total price based on new area
    const newTotalPrice = newDimensions.area * item.quantity * item.unitPrice;
    onUpdate(item.id, 'totalPrice', newTotalPrice);
  }, [item.id, item.dimensions, item.quantity, item.unitPrice, onUpdate]);

  return {
    handleDimensionChange
  };
}

