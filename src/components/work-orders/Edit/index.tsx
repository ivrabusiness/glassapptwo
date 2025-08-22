import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, FileText, AlertTriangle, Loader2, Package } from 'lucide-react';
import { useSupabaseData } from '../../../hooks/useSupabaseData';
import { WorkOrder, WorkOrderItem, Product, Client, Process, InventoryItem, StockTransaction } from '../../../types';
import { generateId } from '../../../utils/idGenerators';
import ClientSelection from '../Create/ClientSelection';
import ItemsList from '../Create/ItemsList';
import OrderSummary from '../Create/OrderSummary';
import MaterialRequirements from '../Create/MaterialRequirements';

interface EditWorkOrderProps {
  orderId: string;
  onBack: () => void;
}

const EditWorkOrder: React.FC<EditWorkOrderProps> = ({ orderId, onBack }) => {
  const [workOrders, setWorkOrders] = useSupabaseData<WorkOrder>('work_orders', []);
  const [products] = useSupabaseData<Product>('products', []);
  const [clients] = useSupabaseData<Client>('clients', []);
  const [processes] = useSupabaseData<Process>('processes', []);
  const [inventory, setInventory] = useSupabaseData<InventoryItem>('inventory', []);
  const [transactions, setTransactions] = useSupabaseData<StockTransaction>('stock_transactions', []);

  const [selectedClientId, setSelectedClientId] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [items, setItems] = useState<WorkOrderItem[]>([]);
  const [originalOrder, setOriginalOrder] = useState<WorkOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successData, setSuccessData] = useState<{
    type: 'draft' | 'confirmed';
    orderNumber: string;
    materialSummary?: string;
  } | null>(null);

  // Ukloni warning ako 'transactions' nije direktno korišten
  // (setTransactions se koristi pri izdavanju naloga)
  void(transactions);

  // Učitavanje naloga
  useEffect(() => {
    const order = workOrders.find(o => o.id === orderId || o.orderNumber === orderId);
    
    if (!order) {
      setError(`Radni nalog s ID "${orderId}" nije pronađen u bazi podataka.`);
      setIsLoading(false);
      return;
    }

    try {
      setOriginalOrder(order);
      setSelectedClientId(order.clientId || '');
      setOrderNotes(order.notes || '');
      setItems(order.items);
      setError(null);
    } catch (err) {
      console.error('Greška pri obradi naloga:', err);
      setError('Greška pri učitavanju podataka naloga.');
    } finally {
      setIsLoading(false);
    }
  }, [orderId, workOrders]);

  // Funkcija za dodavanje novog artikla
  const addItem = () => {
    const newItem: WorkOrderItem = {
      id: generateId(),
      productId: '',
      quantity: 1,
      dimensions: { width: 0, height: 0, area: 0 },
      materials: [],
      notes: ''
    };
    setItems([...items, newItem]);
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
        
        // Recalculate area when dimensions change
        if (field === 'dimensions') {
          const widthInMeters = value.width / 100;
          const heightInMeters = value.height / 100;
          updatedItem.dimensions = {
            width: value.width,
            height: value.height,
            area: widthInMeters * heightInMeters
          };
        }
        
        // Ako se mijenja proizvod, kreiraj materijale na temelju proizvoda
        if (field === 'productId' && value) {
          const product = products.find(p => p.id === value);
          if (product) {
            updatedItem.materials = product.materials.map(material => ({
              id: generateId(),
              materialId: material.id,
              inventoryItemId: material.inventoryItemId,
              quantity: material.quantity,
              unit: material.unit,
              processSteps: []
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
        const updatedMaterials = (item.materials ?? []).map(material => {
          if (material.id === materialId) {
            let updatedProcessSteps = [...(material.processSteps ?? [])];
            
            if (action === 'add') {
              // Dodaj proces ako ne postoji
              const existingStep = updatedProcessSteps.find(step => step.processId === processId);
              if (!existingStep) {
                updatedProcessSteps.push({
                  id: generateId(),
                  processId,
                  status: 'pending',
                  notes
                });
              } else {
                // Ažuriraj napomenu ako proces već postoji
                updatedProcessSteps = updatedProcessSteps.map(step => 
                  step.processId === processId ? { ...step, notes } : step
                );
              }
            } else if (action === 'remove') {
              // Ukloni proces
              updatedProcessSteps = updatedProcessSteps.filter(step => step.processId !== processId);
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
        const updatedMaterials = (item.materials ?? []).map(material => {
          if (material.id === materialId) {
            const updatedProcessSteps = (material.processSteps ?? []).map(step => {
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
        (item.materials ?? []).forEach(material => {
          const inventoryItem = inventory.find(i => i.id === material.inventoryItemId);
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
    
    return hasValidItems;
  };

  // Funkcija za spremanje kao nacrt (ne mijenja status)
  const saveAsDraft = async () => {
    if (!originalOrder || !canSaveOrder()) {
      alert('Molimo provjerite sve podatke');
      return;
    }

    try {
      const updatedOrder: WorkOrder = {
        ...originalOrder,
        clientId: selectedClientId,
        items: items,
        notes: orderNotes,
        status: 'draft' // Ostaje nacrt
      };

      await setWorkOrders(prev => prev.map(order => 
        order.id === orderId ? updatedOrder : order
      ));
      
      // Prikaži modal za uspjeh
      setSuccessData({
        type: 'draft',
        orderNumber: originalOrder.orderNumber
      });
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Greška pri spremanju:', error);
      alert('Greška pri spremanju promjena. Molimo pokušajte ponovo.');
    }
  };

  // Funkcija za izdavanje pravog naloga (mijenja status u pending i skida materijale)
  const issueRealOrder = () => {
    if (!canSaveOrder()) {
      alert('Molimo provjerite sve podatke');
      return;
    }

    const materialRequirements = calculateMaterialRequirements();
    const insufficientMaterials = materialRequirements.filter(req => !req.sufficient);
    
    if (insufficientMaterials.length > 0) {
      alert(`Nedovoljno materijala!\n\n${insufficientMaterials.map(req => 
        `• ${req.name}: nedostaje ${(req.required - req.available).toFixed(4)} ${req.unit}`
      ).join('\n')}`);
      return;
    }

    setShowConfirmModal(true);
  };

  // Potvrda izdavanja naloga
  const confirmIssueOrder = async () => {
    if (!originalOrder) return;

    try {
      // Izračunaj i oduzmi materijale
      const materialUpdates: { [key: string]: number } = {};
      const materialDetails: { [key: string]: { name: string; unit: string; details: string[] } } = {};

      items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product) {
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
          oldQuantity: inventoryItem?.quantity || 0,
          newQuantity: (inventoryItem?.quantity || 0) - totalQuantity,
          notes: `Nalog ${originalOrder.orderNumber} - ${details.name}:\n${details.details.join('\n')}`,
          createdAt: new Date().toISOString()
        };
      });

      const updatedOrder: WorkOrder = {
        ...originalOrder,
        clientId: selectedClientId,
        items: items,
        notes: orderNotes,
        status: 'pending' // Mijenja status u pending
      };

      // Spremi sve
      await setInventory(updatedInventory);
      await setTransactions(prev => [...prev, ...newTransactions]);
      await setWorkOrders(prev => prev.map(order => 
        order.id === orderId ? updatedOrder : order
      ));
      
      // Sažetak što je skinuto
      const materialSummary = Object.entries(materialUpdates).map(([itemId, quantity]) => {
        const inventoryItem = inventory.find(inv => inv.id === itemId);
        return `• ${inventoryItem?.code || ''} ${inventoryItem?.name || 'Nepoznat materijal'}: ${quantity.toFixed(4)} ${inventoryItem?.unit || 'kom'}`;
      }).join('\n');
      
      // Prikaži modal za uspjeh
      setSuccessData({
        type: 'confirmed',
        orderNumber: originalOrder.orderNumber,
        materialSummary: materialSummary
      });
      setShowSuccessModal(true);
      setShowConfirmModal(false);
    } catch (error) {
      console.error('Greška pri izdavanju naloga:', error);
      alert('Greška pri izdavanju naloga. Molimo pokušajte ponovo.');
      setShowConfirmModal(false);
    }
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    onBack();
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <Loader2 className="h-8 w-8 text-white animate-spin" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Učitavam nalog...</h2>
          <p className="text-gray-600">Molimo pričekajte</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !originalOrder) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <AlertTriangle className="mx-auto h-16 w-16 text-red-400 mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">Nalog nije pronađen</h3>
          <p className="text-gray-600 mb-4">
            {error || `Radni nalog s ID "${orderId}" nije pronađen u bazi podataka.`}
          </p>
          
          <button 
            onClick={onBack}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            ← Povratak na listu
          </button>
        </div>
      </div>
    );
  }

  const materialRequirements = calculateMaterialRequirements();
  const insufficientMaterials = materialRequirements.filter(req => !req.sufficient);

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
            <h1 className="text-2xl font-bold text-gray-900">Uredi nacrt naloga</h1>
            <p className="text-gray-600">
              Broj naloga: <span className="font-medium">{originalOrder.orderNumber}</span>
              <span className="ml-3 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                Nacrt
              </span>
            </p>
          </div>
        </div>
        {/* Dva gumba - spremi kao nacrt ili izdaj pravi nalog */}
        <div className="flex space-x-3">
          <button
            onClick={saveAsDraft}
            disabled={!canSaveOrder()}
            className="inline-flex items-center px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <Save className="h-4 w-4 mr-2" />
            Spremi promjene
          </button>
          <button
            onClick={issueRealOrder}
            disabled={!canSaveOrder()}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <FileText className="h-4 w-4 mr-2" />
            Izdaj pravi nalog
          </button>
        </div>
      </div>

      {/* Obavijest o opcijama */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Package className="h-5 w-5 text-blue-500 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-blue-900">Opcije spremanja</h3>
            <div className="text-sm text-blue-700 mt-1 space-y-1">
              <p><strong>📝 Spremi promjene:</strong> Ažurira nacrt bez utjecaja na skladište. Zaliha sa skladišta nije skinuta i skica služi za pregled i pripremu proizvodnje ali nije nalog za proizvodnju.</p>
              <p><strong>🏭 Izdaj pravi nalog:</strong> Mijenja status u "Na čekanju", skida materijale i šalje u proizvodnju</p>
            </div>
          </div>
        </div>
      </div>

      {/* Upozorenje o nedovoljnim materijalima */}
      {insufficientMaterials.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-red-900">Nedovoljno materijala za izdavanje naloga</h3>
              <div className="text-sm text-red-700 mt-1">
                <p className="mb-2">Sljedeći materijali nemaju dovoljno zaliha:</p>
                <ul className="list-disc list-inside space-y-1">
                  {insufficientMaterials.map((req, index) => (
                    <li key={index}>
                      <strong>{req.name}:</strong> nedostaje {(req.required - req.available).toFixed(4)} {req.unit}
                    </li>
                  ))}
                </ul>
                <p className="mt-2 font-medium">💡 Možete spremiti promjene kao nacrt ili dopuniti skladište.</p>
              </div>
            </div>
          </div>
        </div>
      )}

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
            onAddBulkItems={(newItems) => setItems(prev => [...prev, ...newItems])}
            onAddItem={addItem}
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
            orderNumber={originalOrder.orderNumber}
            items={items}
          />

          {/* Material Requirements */}
          {materialRequirements.length > 0 && (
            <MaterialRequirements requirements={materialRequirements} />
          )}

          {/* Order Info */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Informacije o nalogu</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Kreiran:</span>
                <span className="font-medium">{new Date(originalOrder.createdAt).toLocaleDateString('hr-HR')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  Nacrt
                </span>
              </div>
              <div className="pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  💡 Nacrt se može uređivati jer ne utječe na skladište. 
                  Materijali se skidaju tek kad se nalog izdaje.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal za potvrdu izdavanja naloga */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 sm:mx-0 sm:h-10 sm:w-10">
                    <AlertTriangle className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Potvrda izdavanja naloga
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        <strong>Jeste li sigurni da želite izdati pravi radni nalog?</strong>
                      </p>
                      
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mt-3">
                        <h4 className="text-sm font-medium text-orange-900 mb-2">⚠️ Što će se dogoditi:</h4>
                        <ul className="text-sm text-orange-700 space-y-1 list-disc list-inside">
                          <li><strong>Status:</strong> Nacrt → Na čekanju</li>
                          <li><strong>Skladište:</strong> Materijali će biti skinuti</li>
                          <li><strong>Proizvodnja:</strong> Nalog ide u proizvodnju</li>
                          <li><strong>Uređivanje:</strong> Nalog se više neće moći uređivati</li>
                        </ul>
                      </div>

                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-3">
                        <h4 className="text-sm font-medium text-green-900 mb-2">📦 Materijali koji će biti skinuti:</h4>
                        <div className="text-sm text-green-700 space-y-1">
                          {materialRequirements.map((req, index) => (
                            <div key={index} className="flex justify-between">
                              <span>{req.name}:</span>
                              <span className="font-medium">{req.required.toFixed(4)} {req.unit}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={confirmIssueOrder}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  ✅ Potvrdi i izdaj nalog
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Odustani
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                      <FileText className="h-6 w-6 text-green-600" />
                    ) : (
                      <Save className="h-6 w-6 text-blue-600" />
                    )}
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      {successData.type === 'confirmed' 
                        ? 'Nalog uspješno izdan!' 
                        : 'Promjene uspješno spremljene'}
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        {successData.type === 'confirmed' 
                          ? `Radni nalog ${successData.orderNumber} je uspješno izdan i spreman za proizvodnju.` 
                          : `Promjene na nacrtu ${successData.orderNumber} su uspješno spremljene. Zaliha sa skladišta nije skinuta i skica služi za pregled i pripremu proizvodnje ali nije nalog za proizvodnju.`}
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

export default EditWorkOrder;
