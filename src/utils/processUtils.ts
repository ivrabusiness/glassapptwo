/**
 * Calculate process price based on glass thickness
 * 
 * @param process The process with price information
 * @param glassThickness Optional glass thickness in millimeters
 * @returns The price to use for the process
 */
export const calculateProcessPrice = (process: any, glassThickness?: number | null): number => {
  if (!process || typeof process.price !== 'number') return 0;
  
  // If process has thickness-based pricing and thickness is provided, use thickness-based price only
  if (Array.isArray(process.thicknessPrices) && process.thicknessPrices.length > 0) {
    // If no glass thickness provided, return 0 (can't calculate without thickness)
    if (!glassThickness || glassThickness <= 0) return 0;
    
    // Find exact match first
    const exactMatch = process.thicknessPrices.find((tp: any) => tp.thickness === glassThickness);
    if (exactMatch) return exactMatch.price;
    
    // If no exact match, find the closest match
    const sortedThicknesses = [...process.thicknessPrices].sort((a: any, b: any) => {
      const diffA = Math.abs(a.thickness - glassThickness);
      const diffB = Math.abs(b.thickness - glassThickness);
      return diffA - diffB || b.thickness - a.thickness; // Sort by closest, then by thickest
    });
    
    if (sortedThicknesses && sortedThicknesses.length > 0) {
      return sortedThicknesses[0].price || 0;
    }
    
    // If we have thickness prices but no match, return 0 (don't fall back to standard price)
    return 0;
  }
  
  // Fall back to standard price
  return process.price;
};

// Helper function to calculate total price
export const calculateTotalPrice = (unitPrice: number, quantity: number, area: number): number => {
  return (unitPrice || 0) * (quantity || 0) * (area || 0);
};

/**
 * Calculate total process price for one quote item
 * @param items Quote items with materials and processes
 * @param processes Available processes
 * @param inventory Inventory items
 */
export const calculateItemProcessPrice = (item: any, processes: any[], inventory: any[]): number => {
  // If the item already has a calculated process price, use it
  if (item?.processPrice !== undefined && typeof item.processPrice === 'number') {
    return item.processPrice;
  }

  let totalProcessPrice = 0;

  // 1) Material-level processes (for products)
  if (Array.isArray(item?.materials) && item.materials.length > 0) {
    item.materials.forEach((material: any) => {
      if (!material.processSteps) return;

      // Get inventory item for glass thickness
      const inventoryItem = inventory.find((inv: any) => inv.id === material.inventoryItemId);
      const glassThickness = inventoryItem?.type === 'glass' ? inventoryItem.glassThickness : undefined;

      material.processSteps.forEach((step: any) => {
        const process = processes.find((p: any) => p.id === step.processId);
        if (!process) return;

        // Default processes are free - skip pricing
        if (step?.isDefault === true) return;

        // Get process price based on glass thickness
        const processBasePrice = calculateProcessPrice(process, glassThickness);

        let price = 0;
        switch (process.priceType) {
          case 'square_meter': {
            price = processBasePrice * (item.dimensions?.area || 0) * (item.quantity || 0);
            break;
          }
          case 'linear_meter': {
            const perimeter = 2 * ((item.dimensions?.width || 0) + (item.dimensions?.height || 0)) / 100;
            price = processBasePrice * perimeter * (item.quantity || 0);
            break;
          }
          case 'piece': {
            price = processBasePrice * (item.quantity || 0);
            break;
          }
          case 'hour': {
            price = processBasePrice;
            break;
          }
        }

        totalProcessPrice += price;
      });
    });
  }

  // 2) Service-level processes (for services)
  if (item?.isService && Array.isArray(item?.processSteps) && item.processSteps.length > 0) {
    item.processSteps.forEach((step: any) => {
      const process = processes.find((p: any) => p.id === step.processId);
      if (!process) return;

      // Default processes are free - skip pricing
      if (step?.isDefault === true) return;

      // For services, thickness-based pricing is not applicable
      const processBasePrice = calculateProcessPrice(process, undefined);

      let price = 0;
      switch (process.priceType) {
        case 'square_meter': {
          price = processBasePrice * (item.dimensions?.area || 0) * (item.quantity || 0);
          break;
        }
        case 'linear_meter': {
          const perimeter = 2 * ((item.dimensions?.width || 0) + (item.dimensions?.height || 0)) / 100;
          price = processBasePrice * perimeter * (item.quantity || 0);
          break;
        }
        case 'piece': {
          price = processBasePrice * (item.quantity || 0);
          break;
        }
        case 'hour': {
          price = processBasePrice * (item.quantity || 0);
          break;
        }
        default: {
          price = processBasePrice;
        }
      }

      totalProcessPrice += price;
    });
  }

  return totalProcessPrice;
};

/**
 * Calculate total process price for all items in a quote
 */
export const calculateTotalProcessPrice = (items: any[], processes: any[], inventory: any[]): number => {
  if (!items || items.length === 0) return 0;
  
  let totalProcessAmount = 0;
  
  items.forEach(item => {
    const itemProcessPrice = calculateItemProcessPrice(item, processes, inventory);
    totalProcessAmount += itemProcessPrice;
  });
        
  return totalProcessAmount;
};
