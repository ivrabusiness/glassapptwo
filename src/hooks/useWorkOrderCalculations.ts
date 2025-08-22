import { useMemo } from 'react';
import { WorkOrder, Product, Process, InventoryItem } from '../types';

interface UseWorkOrderCalculationsProps {
  order: WorkOrder;
  products: Product[];
  processes: Process[];
  inventory: InventoryItem[];
}

export const useWorkOrderCalculations = ({
  order,
  products,
  processes,
  inventory
}: UseWorkOrderCalculationsProps) => {
  
  const currentTotal = useMemo(() => {
    if (!order?.items) return 0;

    let total = 0;

    order.items.forEach(item => {
      // Cijena proizvoda/usluge
      if (item.isService) {
        // Za usluge koristimo cijenu iz item-a ili pronađemo u products
        const serviceProduct = products.find(p => p.id === item.productId);
        const itemPrice = serviceProduct?.price || 0;
        total += itemPrice * item.quantity;
      } else {
        // Za proizvode računamo na osnovu materijala i dimenzija
        const product = products.find(p => p.id === item.productId);
        if (product && item.dimensions) {
          const area = item.dimensions.area || (item.dimensions.width * item.dimensions.height / 1000000); // m²
          total += product.price * area * item.quantity;
        }
      }

      // Dodaj cijene procesa
      item.materials?.forEach(material => {
        material.processSteps?.forEach(step => {
          const process = processes.find(p => p.id === step.processId);
          if (process && item.dimensions) {
            const area = item.dimensions.area || (item.dimensions.width * item.dimensions.height / 1000000);
            total += process.pricePerM2 * area * item.quantity;
          }
        });
      });
    });

    return total;
  }, [order, products, processes]);

  const hasChangedFromQuote = useMemo(() => {
    if (!order.originalQuoteTotal) return false;
    const difference = Math.abs(currentTotal - order.originalQuoteTotal);
    return difference > 0.01; // Tolerancija od 1 cent
  }, [currentTotal, order.originalQuoteTotal]);

  const priceDifference = useMemo(() => {
    return currentTotal - (order.originalQuoteTotal || 0);
  }, [currentTotal, order.originalQuoteTotal]);

  const percentageChange = useMemo(() => {
    if (!order.originalQuoteTotal) return 0;
    return (priceDifference / order.originalQuoteTotal) * 100;
  }, [priceDifference, order.originalQuoteTotal]);

  return {
    currentTotal,
    hasChangedFromQuote,
    priceDifference,
    percentageChange,
    originalQuoteTotal: order.originalQuoteTotal || 0
  };
};
