import React, { useState } from 'react';
import { ArrowLeft, Save, FileText, CheckCircle } from 'lucide-react';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { WorkOrder, WorkOrderItem, Product, Client, Process, InventoryItem, StockTransaction } from '@/types';
import { generateId, generateOrderNumber } from '@/utils/idGenerators';
import ClientSelection from './ClientSelection';
import ItemsList from './ItemsList';
import OrderSummary from './OrderSummary';
import MaterialRequirements from './MaterialRequirements';
import SocketManager from '@/lib/socket';

interface CreateWorkOrderProps {
  onBack: () => void;
}

// Struktura za praćenje procesa po materijalima tijekom kreiranja
export interface MaterialProcessData {
  materialId: string;
  processId: string;
  notes: string;
}

const CreateWorkOrder: React.FC<CreateWorkOrderProps> = ({ onBack }) => {
  const [, setWorkOrders] = useSupabaseData<WorkOrder>('work_orders', []);
  const [products] = useSupabaseData<Product>('products', []);
  const [clients] = useSupabaseData<Client>('clients', []);
  const [processes] = useSupabaseData<Process>('processes', []);
  const [inventory, setInventory] = useSupabaseData<InventoryItem>('inventory', []);
  const [, setTransactions] = useSupabaseData<StockTransaction>('stock_transactions', []);
  

  const [orderNumber] = useState(generateOrderNumber());
  const [selectedClientId, setSelectedClientId] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [purchaseOrder, setPurchaseOrder] = useState('');
  const [items, setItems] = useState<WorkOrderItem[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successData, setSuccessData] = useState<{
    type: 'draft' | 'confirmed';
    orderNumber: string;
    materialSummary?: string;
  } | null>(null);

  // Funkcija za dodavanje novog artikla
  const addItem = () => {
    const newItem: WorkOrderItem = {
      id: generateId(),
      productId: '',
      quantity: 1,
      dimensions: { width: 0, height: 0, area: 0 },
      materials: [], // Prazna lista materijala
      notes: ''
    };
    setItems([...items, newItem]);
  };

  // Funkcija za dodavanje više artikala odjednom
  const addBulkItems = (newItems: WorkOrderItem[]) => {
    setItems(prev => [...prev, ...newItems]);
  };

  // Funkcija za uklanjanje artikla
  const removeItem = (itemId: string) => {
    setItems(items.filter(item => item.id !== itemId));
  };

  // Funkcija za ažuriranje artikla
  const updateItem = (itemId: string, field: keyof WorkOrderItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        const updatedItem = { ...item, [field]: value };
        
        // Recalculate area when dimensions change (convert mm to m²)
        if (field === 'dimensions') {
          const widthInMeters = value.width / 1000;
          const heightInMeters = value.height / 1000;
          updatedItem.dimensions = {
            width: value.width, // Keep original mm values for display
            height: value.height,
            area: widthInMeters * heightInMeters // Area in m²
          };
        }
        
        // Ako se mijenja proizvod, kreiraj materijale na temelju proizvoda
        if (field === 'productId' && value) {
          const product = products.find(p => p.id === value);
          if (product) {
            updatedItem.materials = product.materials.map(material => ({
              id: generateId(),
              inventoryItemId: material.inventoryItemId,
              quantity: material.quantity,
              unit: material.unit,
              notes: '',
              // Inicijalno postavi samo default procese za ovaj specifični materijal
              processSteps: material.processSteps
                ? material.processSteps
                    .filter(step => step.isDefault === true)
                    .map(step => ({
                      id: generateId(),
                      processId: step.processId,
                      status: 'pending',
                      notes: step.notes || '',
                      isFixed: true,
                      isDefault: true
                    }))
                : []
            }));
          } else {
            updatedItem.materials = [];
          }
        }
        
        return updatedItem;
      }
      return item;
    }));
  };

  // Funkcija za ažuriranje procesa za materijal
  const updateMaterialProcesses = (
    itemId: string, 
    materialId: string, 
    processId: string, 
    action: 'add' | 'remove', 
    notes: string = ''
  ) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        const updatedMaterials = (item.materials || []).map(material => {
          // Koristi jedinstveni material.id umjesto inventoryItemId
          if (material.id === materialId) {
            let updatedProcessSteps = [...(material.processSteps || [])];
            
            if (action === 'add') {
              // Dodaj proces ako ne postoji
              const existingStep = updatedProcessSteps.find(step => step.processId === processId);
              if (!existingStep) {
                updatedProcessSteps.push({
                  id: generateId(),
                  processId,
                  status: 'pending',
                  notes,
                  isFixed: false,
                  isDefault: false
                });
              } else {
                // Ažuriraj napomenu ako proces već postoji
                updatedProcessSteps = updatedProcessSteps.map(step => 
                  step.processId === processId ? { ...step, notes } : step
                );
              }
            } else if (action === 'remove') {
              // Ukloni proces ako NIJE fiksan
              const existingStep = updatedProcessSteps.find(step => step.processId === processId);
              if (existingStep && existingStep.isFixed) {
                // Preskoči uklanjanje fiksnog (default) procesa — no-op
              } else {
                updatedProcessSteps = updatedProcessSteps.filter(step => step.processId !== processId);
              }
            }
            
            return {
              ...material,
              processSteps: updatedProcessSteps
            };
          }
          return material;
        });
        
        return {
          ...item,
          materials: updatedMaterials
        };
      }
      return item;
    }));
  };

  // Funkcija za ažuriranje napomene za proces
  const updateProcessNotes = (itemId: string, materialId: string, processId: string, notes: string) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        const updatedMaterials = (item.materials || []).map(material => {
          // Koristi jedinstveni material.id umjesto inventoryItemId
          if (material.id === materialId) {
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
          }
          return material;
        });
        
        return {
          ...item,
          materials: updatedMaterials
        };
      }
      return item;
    }));
  };

  // Izračun potrebnih materijala
  const calculateMaterialRequirements = () => {
    const requirements: { [key: string]: { name: string; required: number; available: number; unit: string; sufficient: boolean } } = {};
    
    items.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (product && item.dimensions.area > 0) {
        (item.materials || []).forEach(material => {
          const inventoryItem = inventory.find(i => i.id === material.inventoryItemId);
          // Potrošnja = količina_po_m² × broj_komada × površina_po_komadu
          const requiredQuantity = material.quantity * item.quantity * item.dimensions.area;
          
          if (!requirements[material.inventoryItemId]) {
            requirements[material.inventoryItemId] = {
              name: inventoryItem?.name || 'Nepoznat materijal',
              required: 0,
              available: inventoryItem?.quantity || 0,
              unit: material.unit,
              sufficient: true
            };
          }
          
          requirements[material.inventoryItemId].required += requiredQuantity;
        });
      }
    });

    // Provjeri ima li dovoljno materijala
    Object.values(requirements).forEach(req => {
      req.sufficient = req.available >= req.required;
    });

    return Object.values(requirements);
  };

  // Provjera može li se nalog spremiti
  const canSaveOrder = () => {
    if (!selectedClientId || items.length === 0) return false;
    
    const hasValidItems = items.every(item => 
      item.productId && 
      item.quantity > 0 && 
      item.dimensions.width > 0 && 
      item.dimensions.height > 0
    );
    
    if (!hasValidItems) return false;
    
    const materialRequirements = calculateMaterialRequirements();
    return materialRequirements.every(req => req.sufficient);
  };

  // Spremanje nacrta
  const saveDraft = () => {
    const newOrder: WorkOrder = {
      id: generateId(),
      orderNumber,
      clientId: selectedClientId,
      items: items,
      status: 'draft',
      createdAt: new Date().toISOString(),
      notes: orderNotes,
      purchaseOrder: purchaseOrder || undefined
    };

    setWorkOrders(prev => [...prev, newOrder]);
    
    // Emit Socket.IO event for new work order
    const socketManager = SocketManager.getInstance();
    socketManager.connect();
    socketManager.emitWorkOrderCreated(newOrder);
    
    // Prikaži modal za uspjeh
    setSuccessData({
      type: 'draft',
      orderNumber: orderNumber
    });
    setShowSuccessModal(true);
  };

  // Spremanje i potvrda naloga
  const saveAndConfirm = () => {
    if (!canSaveOrder()) {
      alert('Molimo provjerite sve podatke i dostupnost materijala');
      return;
    }

    // Izračunaj i oduzmi materijale
    const materialUpdates: { [key: string]: number } = {};
    const materialDetails: { [key: string]: { name: string; unit: string; details: string[] } } = {};

    items.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        (item.materials || []).forEach(material => {
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
          
          // Dodaj detalj za ovaj materijal
          materialDetails[material.inventoryItemId].details.push(
            `${inventoryItem?.code || ''} ${product.name} - ${inventoryItem?.name}${inventoryItem?.type === 'glass' && inventoryItem.glassThickness ? ` (${inventoryItem.glassThickness}mm)` : ''}: ${requiredQuantity.toFixed(4)} ${material.unit}`
          );
        });
      }
    });

    // Ažuriraj inventar
    const updatedInventory = inventory.map(item => {
      const deduction = materialUpdates[item.id];
      return deduction ? { ...item, quantity: item.quantity - deduction } : item;
    });

    // Kreiraj transakcije
    const newTransactions: StockTransaction[] = Object.entries(materialUpdates).map(([itemId, totalQuantity]) => {
      const inventoryItem = inventory.find(inv => inv.id === itemId);
      const details = materialDetails[itemId];
      
      return {
        id: generateId(),
        inventoryItemId: itemId,
        type: 'out',
        quantity: totalQuantity,
        previousQuantity: inventoryItem?.quantity || 0,
        newQuantity: (inventoryItem?.quantity || 0) - totalQuantity,
        notes: `Nalog ${orderNumber} - ${details.name}:\n${details.details.join('\n')}`,
        createdAt: new Date().toISOString()
      };
    });

    const newOrder: WorkOrder = {
      id: generateId(),
      orderNumber,
      clientId: selectedClientId,
      items: items,
      status: 'pending',
      createdAt: new Date().toISOString(),
      notes: orderNotes,
      purchaseOrder: purchaseOrder || undefined
    };

    setInventory(updatedInventory);
    setTransactions(prev => [...prev, ...newTransactions]);
    setWorkOrders(prev => [...prev, newOrder]);
    
    // Emit Socket.IO event for new work order
    const socketManager = SocketManager.getInstance();
    socketManager.connect();
    socketManager.emitWorkOrderCreated(newOrder);
    
    // Kraći prikaz što je skinuto
    const materialSummary = Object.entries(materialUpdates).map(([itemId, quantity]) => {
      const inventoryItem = inventory.find(inv => inv.id === itemId);
      return `• ${inventoryItem?.code || ''} ${inventoryItem?.name || 'Nepoznat materijal'}: ${quantity.toFixed(4)} ${inventoryItem?.unit || 'kom'}`;
    }).join('\n');
    
    // Prikaži modal za uspjeh
    setSuccessData({
      type: 'confirmed',
      orderNumber: orderNumber,
      materialSummary: materialSummary
    });
    setShowSuccessModal(true);
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    onBack();
  };

  const materialRequirements = calculateMaterialRequirements();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Kreiraj novi nalog</h1>
            <p className="text-gray-600">Broj naloga: <span className="font-medium">{orderNumber}</span></p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={saveDraft}
            disabled={!selectedClientId || items.length === 0}
            className="inline-flex items-center px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4 mr-2" />
            Spremi nacrt
          </button>
          <button
            onClick={saveAndConfirm}
            disabled={!canSaveOrder()}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <FileText className="h-4 w-4 mr-2" />
            Potvrdi nalog
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Client Selection */}
          <ClientSelection
            selectedClientId={selectedClientId}
            onClientChange={setSelectedClientId}
            clients={clients}
          />

          {/* Items */}
          <ItemsList
            items={items}
            products={products}
            processes={processes}
            inventory={inventory}
            onAddItem={addItem}
            onAddBulkItems={addBulkItems}
            onUpdateItem={updateItem}
            onRemoveItem={removeItem}
            onUpdateMaterialProcesses={updateMaterialProcesses}
            onUpdateProcessNotes={updateProcessNotes}
          />

          {/* Order Notes */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Napomene naloga</h2>
            <textarea
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Dodatne napomene za nalog..."
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Summary */}
          <OrderSummary
            orderNumber={orderNumber}
            items={items}
            purchaseOrder={purchaseOrder}
            onPurchaseOrderChange={setPurchaseOrder}
          />

          {/* Material Requirements */}
          {materialRequirements.length > 0 && (
            <MaterialRequirements requirements={materialRequirements} />
          )}
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && successData && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full sm:mx-0 sm:h-10 sm:w-10 ${
                    successData.type === 'confirmed' ? 'bg-green-100' : 'bg-blue-100'
                  }`}>
                    {successData.type === 'confirmed' ? (
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    ) : (
                      <Save className="h-6 w-6 text-blue-600" />
                    )}
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      {successData.type === 'confirmed' 
                        ? 'Radni nalog uspješno kreiran!' 
                        : 'Nacrt naloga spremljen'}
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        {successData.type === 'confirmed' 
                          ? `Radni nalog ${successData.orderNumber} je uspješno kreiran i spreman za proizvodnju.` 
                          : `Nacrt radnog naloga ${successData.orderNumber} je uspješno spremljen. Zaliha sa skladišta nije skinuta i skica služi za pregled i pripremu proizvodnje ali nije nalog za proizvodnju.`}
                      </p>
                      
                      {successData.type === 'confirmed' && successData.materialSummary && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <p className="text-sm font-medium text-gray-700 mb-1">Materijali skinuti sa skladišta:</p>
                          <pre className="text-xs text-gray-600 whitespace-pre-wrap">{successData.materialSummary}</pre>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleSuccessModalClose}
                  className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white sm:ml-3 sm:w-auto sm:text-sm ${
                    successData.type === 'confirmed' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  U redu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateWorkOrder;
