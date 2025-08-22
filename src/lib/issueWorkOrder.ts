import { InventoryItem, Product, StockTransaction, WorkOrder } from '../types';
import { generateId } from '../utils/idGenerators';

export interface MaterialRequirement {
  inventoryItemId: string;
  name: string;
  required: number;
  available: number;
  unit: string;
  sufficient: boolean;
}

export interface IssuePreparationResult {
  sufficient: boolean;
  requirements: MaterialRequirement[];
  materialSummary: string;
  updatedInventory: InventoryItem[];
  newTransactions: StockTransaction[]; // note: may contain extra local field oldQuantity but it's stripped before DB write
  updatedOrder: WorkOrder;
}

/**
 * Prepare all changes needed to issue a draft work order (convert to real order):
 * - calculates material requirements by order items (area * item.qty * material.qty)
 * - validates inventory sufficiency
 * - prepares updated inventory and stock transactions (type: 'out')
 * - prepares updated order with status 'pending'
 */
export function prepareIssueWorkOrder(
  order: WorkOrder,
  products: Product[],
  inventory: InventoryItem[]
): IssuePreparationResult {
  // Aggregate required quantities per inventory item
  const materialUpdates: Record<string, number> = {};
  const materialDetails: Record<string, { name: string; unit: string; details: string[] }> = {};

  order.items.forEach(item => {
    // For services there is no product in products table
    const product = item.isService ? undefined : products.find(p => p.id === item.productId);
    if (product || item.isService) {
      (item.materials ?? []).forEach(material => {
        const requiredQuantity = material.quantity * item.quantity * item.dimensions.area;
        const inventoryItem = inventory.find(inv => inv.id === material.inventoryItemId);

        if (!materialUpdates[material.inventoryItemId]) {
          materialUpdates[material.inventoryItemId] = 0;
          materialDetails[material.inventoryItemId] = {
            name: inventoryItem?.name || 'Nepoznat materijal',
            unit: material.unit,
            details: []
          };
        }
        materialUpdates[material.inventoryItemId] += requiredQuantity;

        const itemName = item.isService
          ? (item.productName || 'Usluga')
          : (product?.name || 'Nepoznat proizvod');
        materialDetails[material.inventoryItemId].details.push(
          `${inventoryItem?.code || ''} ${itemName} - ${inventoryItem?.name}${
            inventoryItem?.type === 'glass' && inventoryItem.glassThickness ? ` (${inventoryItem.glassThickness}mm)` : ''
          }: ${requiredQuantity.toFixed(4)} ${material.unit}`
        );
      });
    }
  });

  // Build requirements list and check sufficiency
  const requirements: MaterialRequirement[] = Object.entries(materialUpdates).map(([invId, required]) => {
    const invItem = inventory.find(i => i.id === invId);
    return {
      inventoryItemId: invId,
      name: invItem?.name || 'Nepoznat materijal',
      required,
      available: invItem?.quantity || 0,
      unit: (invItem?.unit || 'kom'),
      sufficient: (invItem?.quantity || 0) >= required
    };
  });

  const sufficient = requirements.every(r => r.sufficient);

  // Prepare results
  let updatedInventory: InventoryItem[] = inventory;
  let newTransactions: StockTransaction[] = [];
  let materialSummary = '';

  if (sufficient) {
    // Apply inventory deductions
    updatedInventory = inventory.map(item => {
      const deduction = materialUpdates[item.id];
      return deduction ? { ...item, quantity: item.quantity - deduction } : item;
    });

    // Create stock transactions
    newTransactions = Object.entries(materialUpdates).map(([itemId, totalQuantity]) => {
      const inventoryItem = inventory.find(inv => inv.id === itemId);
      const details = materialDetails[itemId];

      return {
        id: generateId(),
        inventoryItemId: itemId,
        type: 'out',
        quantity: totalQuantity,
        previousQuantity: inventoryItem?.quantity || 0,
        // Extra local field kept for UI compatibility; stripped by useSupabaseData before DB write
        oldQuantity: inventoryItem?.quantity || 0,
        newQuantity: (inventoryItem?.quantity || 0) - totalQuantity,
        notes: `Nalog ${order.orderNumber} - ${details.name}:\n${details.details.join('\n')}`,
        createdAt: new Date().toISOString()
      } as unknown as StockTransaction;
    });

    // Build human-readable summary
    materialSummary = Object.entries(materialUpdates)
      .map(([itemId, quantity]) => {
        const inventoryItem = inventory.find(inv => inv.id === itemId);
        return `• ${inventoryItem?.code || ''} ${inventoryItem?.name || 'Nepoznat materijal'}: ${quantity.toFixed(4)} ${inventoryItem?.unit || 'kom'}`;
      })
      .join('\n');
  }

  const updatedOrder: WorkOrder = {
    ...order,
    status: 'pending'
  };

  return {
    sufficient,
    requirements,
    materialSummary,
    updatedInventory,
    newTransactions,
    updatedOrder
  };
}
