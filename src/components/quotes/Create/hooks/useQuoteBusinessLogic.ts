import { useCallback } from 'react';
import { QuoteItem, Product, ProcessStep, Process, InventoryItem } from '../../../../types';
import { generateId } from '../../../../utils/idGenerators';
import { calculateItemProcessPrice } from '../../../../utils/processUtils';

interface UseQuoteBusinessLogicParams {
  items: QuoteItem[];
  setItems: React.Dispatch<React.SetStateAction<QuoteItem[]>>;
  products: Product[];
  processes: Process[];
  inventory: InventoryItem[];
}

export function useQuoteBusinessLogic({ items, setItems, products, processes, inventory }: UseQuoteBusinessLogicParams) {
  const updateItem = useCallback((itemId: string, field: keyof QuoteItem, value: any) => {
    setItems(prevItems => {
      return prevItems.map(item => {
        if (item.id !== itemId) return item;

        const updatedItem = { ...item, [field]: value };

        // Ako se mijenja proizvod, ažuriraj materijale
        if (field === 'productId' && value) {
          const product = products.find(p => p.id === value);
          if (product && product.materials) {
            updatedItem.materials = product.materials.map(material => ({
              id: generateId(),
              materialId: material.id,
              inventoryItemId: material.inventoryItemId,
              quantity: material.quantity,
              unit: material.unit,
              processSteps: material.processSteps ? material.processSteps
                .filter(step => step.isDefault === true) // Kopiraj SAMO default procese
                .map(step => ({
                  ...step,
                  id: generateId(),
                  isFixed: step.isDefault === true, // Samo default procesi su fiksni
                  notes: step.notes || ''
                })) : [],
              notes: ''
            }));
          }
        }

        // Ako se mijenja usluga, obriši materijale
        if (field === 'serviceId' && value) {
          updatedItem.materials = [];
        }

        // Ako se mijenja tip stavke
        if (field === 'isService') {
          if (value) {
            // Prebacivanje na uslugu - obriši materijale i proizvod
            updatedItem.materials = [];
            updatedItem.productId = '';
          } else {
            // Prebacivanje na proizvod - obriši uslugu
            updatedItem.serviceId = '';
          }
        }

        return updatedItem;
      });
    });
  }, [setItems, products]);

  const updateMaterialProcesses = useCallback((
    itemId: string, 
    materialId: string, 
    processId: string, 
    action: 'add' | 'remove', 
    notes: string = ''
  ) => {
    setItems(prevItems => {
      return prevItems.map(item => {
        if (item.id !== itemId) return item;

        const updatedMaterials = (item.materials || []).map(material => {
          if (material.id !== materialId) return material;

          let updatedProcessSteps = [...(material.processSteps || [])];

          if (action === 'add') {
            // Dodaj proces ako ne postoji
            const existingStep = updatedProcessSteps.find(step => step.processId === processId);
            if (!existingStep) {
              const newProcessStep: ProcessStep = {
                id: generateId(),
                processId,
                status: 'pending',
                isFixed: false,
                notes
              };
              updatedProcessSteps.push(newProcessStep);
            }
          } else if (action === 'remove') {
            // Ukloni proces ako nije fiksiran
            updatedProcessSteps = updatedProcessSteps.filter(step => {
              if (step.processId === processId) {
                return step.isFixed; // Zadrži samo fiksirane procese
              }
              return true;
            });
          }

          return {
            ...material,
            processSteps: updatedProcessSteps
          };
        });

        return {
          ...item,
          materials: updatedMaterials
        };
      });
    });
  }, [setItems]);

  // Service-level: toggle add/remove process on item.processSteps
  const updateServiceProcesses = useCallback((
    itemId: string,
    processId: string,
    action: 'add' | 'remove',
    notes: string = ''
  ) => {
    setItems(prevItems => {
      return prevItems.map(item => {
        if (item.id !== itemId) return item;

        let updatedProcessSteps = [...(item.processSteps || [])];

        if (action === 'add') {
          const existingStep = updatedProcessSteps.find(step => step.processId === processId);
          if (!existingStep) {
            const newProcessStep: ProcessStep = {
              id: generateId(),
              processId,
              status: 'pending',
              isFixed: false,
              notes
            };
            updatedProcessSteps.push(newProcessStep);
          }
        } else if (action === 'remove') {
          updatedProcessSteps = updatedProcessSteps.filter(step => {
            if (step.processId === processId) {
              return step.isFixed; // keep only fixed ones
            }
            return true;
          });
        }

        return {
          ...item,
          processSteps: updatedProcessSteps
        };
      });
    });
  }, [setItems]);

  // Service-level: update notes on item.processSteps
  const updateServiceProcessNotes = useCallback((itemId: string, processId: string, notes: string) => {
    setItems(prevItems => {
      return prevItems.map(item => {
        if (item.id !== itemId) return item;

        const updatedProcessSteps = (item.processSteps || []).map(step =>
          step.processId === processId ? { ...step, notes } : step
        );

        return {
          ...item,
          processSteps: updatedProcessSteps
        };
      });
    });
  }, [setItems]);

  const updateProcessNotes = useCallback((itemId: string, materialId: string, processId: string, notes: string) => {
    setItems(prevItems => {
      return prevItems.map(item => {
        if (item.id !== itemId) return item;

        const updatedMaterials = (item.materials || []).map(material => {
          if (material.id !== materialId) return material;

          const updatedProcessSteps = (material.processSteps || []).map(step => {
            if (step.processId === processId) {
              return { ...step, notes };
            }
            return step;
          });

          return {
            ...material,
            processSteps: updatedProcessSteps
          };
        });

        return {
          ...item,
          materials: updatedMaterials
        };
      });
    });
  }, [setItems]);

  const calculateTotals = useCallback((vatRate: number) => {
    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    
    // Dodaj cijenu procesa za sve artikle
    const processTotal = items.reduce((sum, item) => {
      return sum + calculateItemProcessPrice(item, processes, inventory);
    }, 0);
    
    const totalBeforeVat = subtotal + processTotal;
    const vatAmount = totalBeforeVat * (vatRate / 100);
    const grandTotal = totalBeforeVat + vatAmount;

    return {
      subtotal,
      processTotal,
      totalBeforeVat,
      vatAmount,
      grandTotal
    };
  }, [items, processes, inventory]);

  const canSaveQuote = useCallback(() => {
    return items.length > 0 && items.every(item => {
      if (item.isService) {
        return item.serviceId && item.quantity > 0 && item.unitPrice >= 0;
      } else {
        return item.productId && item.quantity > 0 && item.unitPrice >= 0 && 
               item.dimensions.width > 0 && item.dimensions.height > 0;
      }
    });
  }, [items]);

  return {
    updateItem,
    updateMaterialProcesses,
    updateProcessNotes,
    updateServiceProcesses,
    updateServiceProcessNotes,
    calculateTotals,
    canSaveQuote
  };
}

