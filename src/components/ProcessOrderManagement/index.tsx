import React, { useState } from 'react';
import { useSupabaseData } from '../../hooks/useSupabaseData';
import { WorkOrder, Process, Product, InventoryItem, Client } from '../../types';
import { 
  Search, 
  CheckCircle,
  AlertTriangle, 
  X
} from 'lucide-react';
import ProcessList from './ProcessList';


const ProcessOrderManagement = () => {
  const [workOrders, setWorkOrders] = useSupabaseData<WorkOrder>('work_orders', []);
  const [clients] = useSupabaseData<Client>('clients', []);
  const [processes] = useSupabaseData<Process>('processes', []);
  const [products] = useSupabaseData<Product>('products', []);
  const [inventory] = useSupabaseData<InventoryItem>('inventory', []);

  
  const [orderNumber, setOrderNumber] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);  
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  
  // State for the process completion confirmation modal
  const [confirmationModalState, setConfirmationModalState] = useState({
    isOpen: false,
    itemId: '',
    materialId: '',
    processStepId: '',
    itemName: '',
    dimensions: { width: 0, height: 0 },
    quantity: 0,
    processName: '',
    orderNumber: ''
  });

  // Search for a work order by number
  const handleSearch = () => {
    if (!orderNumber.trim()) {
      setError('Molimo unesite broj radnog naloga');
      return;
    }

    setLoading(true);
    setError(null);
    setSelectedOrder(null);
    
    // Clean the order number
    const trimmedOrderNumber = orderNumber.trim().toUpperCase();

    // Find the order by number
    const order = (workOrders || []).find(o => o.orderNumber.toUpperCase() === trimmedOrderNumber);
    
    if (!order) {
      setError(`Radni nalog "${trimmedOrderNumber}" nije pronađen`);
      setLoading(false);
      return;
    }
    
    // Fetch product names for display
    const updatedOrder = { ...order };
    
    // Update items with product names
    if (updatedOrder.items) {
      updatedOrder.items = updatedOrder.items.map(item => {
        const productId = item.productId;
        
        // Find product to get its name
        const product = products.find(p => p.id === productId);
        const productName = product ? product.name : 'Nepoznat proizvod';
        
        // Add product name to the item
        const updatedItem = { 
          ...item, 
          productName 
        };
        
        // Add inventory names to materials
        if (updatedItem.materials) {
          updatedItem.materials = updatedItem.materials.map(material => {
            const inventoryId = material.inventoryItemId;
            const inventoryItem = inventory.find(i => i.id === inventoryId);
            const inventoryName = inventoryItem ? inventoryItem.name : 'Nepoznat materijal';
            
            return {
              ...material,
              inventoryName
            };
          });
        }
        
        return updatedItem;
      });
    }
    
    setSelectedOrder(updatedOrder);
    setLoading(false);
    
    // Add to recent searches
    if (!recentSearches.includes(trimmedOrderNumber)) {
      setRecentSearches(prevSearches => {
        // Only keep the last 5 searches
        const newSearches = [trimmedOrderNumber, ...prevSearches].slice(0, 5);
        
        // Save to localStorage
        try {
          localStorage.setItem('processManagementSearches', JSON.stringify(newSearches));
        } catch (error) {
          console.error('Error saving recent searches:', error);
        }
        
        return newSearches;
      });
    }
  };

  // Load recent searches from localStorage on component mount
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('processManagementSearches');
      if (saved) {
        setRecentSearches(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading recent searches:', error);
    }
  }, []);

  // Clear the search term
  const clearSearch = () => {
    setOrderNumber('');
    setSelectedOrder(null);
    setError(null);
  };

  // Handle process completion confirmation
  const handleConfirmProcess = (itemId: string, processStepId: string, itemName: string, dimensions: {width: number, height: number}, quantity: number, processName: string, orderNumber: string) => {
    setConfirmationModalState({
      isOpen: true,
      itemId,
      materialId: '', // Set to empty string since it's not provided
      processStepId,
      itemName,
      dimensions,
      quantity,
      processName,
      orderNumber
    });
  };

  // Close the confirmation modal
  const closeConfirmationModal = () => {
    setConfirmationModalState(prev => ({...prev, isOpen: false}));
  };

  // Mark a process as completed
  const completeProcess = (itemId: string, processStepId: string) => {
    if (!selectedOrder) return;
    
    // Create a deep copy of the selected order
    const updatedOrder = JSON.parse(JSON.stringify(selectedOrder));
    
    // Find the item
    const item = updatedOrder.items.find((i: any) => i.id === itemId);
    if (!item) return;
    
    // Find the process step
    const processStep = item.processSteps.find((p: any) => p.id === processStepId);
    if (!processStep) return;
    
    // Update the process step status
    processStep.status = 'completed';
    processStep.completedAt = new Date().toISOString();
    
    // Check if all processes are completed
    const allProcessesCompleted = updatedOrder.items.every((item: any) => 
      item.processSteps && item.processSteps.every((step: any) => step.status === 'completed')
    );
    
    // If all processes are completed, update the order status
    if (allProcessesCompleted) {
      updatedOrder.status = 'completed';
      updatedOrder.completedAt = new Date().toISOString();
      setSuccess(`Svi procesi su završeni. Nalog ${updatedOrder.orderNumber} je označen kao završen.`);
    } else {
      setSuccess(`Proces je označen kao završen.`);
    }
    
    // Update the order in storage
    setWorkOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
    
    // Update the selected order
    setSelectedOrder(updatedOrder);
    
    // Clear success message after 3 seconds
    setTimeout(() => {
      setSuccess(null);
    }, 3000);
  };

  // Complete the process after confirmation
  const confirmProcessCompletion = () => {
    const { itemId, processStepId } = confirmationModalState;
    completeProcess(itemId, processStepId);
    closeConfirmationModal();
  };

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Upravljanje nalozima</h1>
          <p className="text-gray-600">Završavanje procesa i praćenje napretka proizvodnje</p>
        </div>
      </div>

      {/* Search box */}
      <div className="bg-white border border-gray-200 shadow-sm rounded-lg p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            <Search className="h-5 w-5 mr-2 text-gray-700" />
            Pretraga radnog naloga
          </h2>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative flex items-center">
            <div className="absolute left-4 text-gray-500">
              {loading ? <X className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
            </div>
            <input
              type="text"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="Unesite broj radnog naloga (npr. WO220415-123456)"
              className="w-full pl-12 pr-12 py-3 bg-white text-gray-700 placeholder-gray-400 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent shadow-sm text-lg"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearch();
              }}
            />
            {orderNumber && (
              <button 
                onClick={clearSearch}
                className="absolute right-20 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            )}
            <button
              onClick={handleSearch}
              disabled={loading || !orderNumber.trim()}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        
      </div>

      {/* Error/Success messages */}
      <div className="mt-4">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg animate-fadeIn shadow-md">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg animate-fadeIn shadow-md">
            <div className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
              <p className="text-sm text-green-700">{success}</p>
            </div>
          </div>
        )}
      </div>

      {/* Order details and process list */}
      {selectedOrder && (
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pb-4 border-b border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-full mr-3">
                <X className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Nalog: {selectedOrder.orderNumber}</h2>
                <p className="text-sm text-gray-600">Status:
                  <span className={`ml-1 ${
                    selectedOrder.status === 'completed' ? 'text-green-600' :
                    selectedOrder.status === 'in-progress' ? 'text-blue-600' :
                    selectedOrder.status === 'pending' ? 'text-amber-600' : 'text-gray-600'
                  }`}>
                    {(() => {
                      if (selectedOrder.status === 'completed' || selectedOrder.status === 'draft' || selectedOrder.status === 'cancelled') {
                        return selectedOrder.status === 'completed' ? 'Završen' :
                              selectedOrder.status === 'draft' ? 'Nacrt' : 'Otkazan';
                      }
                      
                      // Calculate process completion for in-progress orders
                      let totalProcesses = 0;
                      let completedProcesses = 0;
                      
                      selectedOrder.items.forEach(item => {
                        if (item.processSteps && item.processSteps.length > 0) {
                          item.processSteps.forEach(step => {
                            totalProcesses++;
                            if (step.status === 'completed') {
                              completedProcesses++;
                            }
                          });
                        }
                      });
                      
                      const percentage = totalProcesses > 0 ? Math.round((completedProcesses / totalProcesses) * 100) : 0;
                      return `${completedProcesses}/${totalProcesses} (${percentage}%)`;
                    })()}
                  </span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-lg shadow-sm">
              {(() => {
                if (selectedOrder.status === 'completed' || selectedOrder.status === 'draft' || selectedOrder.status === 'cancelled') {
                  return (
                    <div className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                      selectedOrder.status === 'completed' ? 'bg-green-100 text-green-800' :
                      selectedOrder.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {selectedOrder.status === 'completed' ? 'Završen' :
                       selectedOrder.status === 'draft' ? 'Nacrt' : 'Otkazan'}
                    </div>
                  );
                }
                
                // Calculate process completion for in-progress orders
                let totalProcesses = 0;
                let completedProcesses = 0;
                
                selectedOrder.items.forEach(item => {
                  if (item.processSteps && item.processSteps.length > 0) {
                    item.processSteps.forEach(step => {
                      totalProcesses++;
                      if (step.status === 'completed') {
                        completedProcesses++;
                      }
                    });
                  }
                });
                
                const percentage = totalProcesses > 0 ? Math.round((completedProcesses / totalProcesses) * 100) : 0;
                
                return (
                  <div className="flex items-center gap-3">
                    <div className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                      percentage === 100 ? 'bg-green-100 text-green-800' :
                      percentage > 50 ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      <X className="h-4 w-4 inline mr-1.5" />
                      <span>{completedProcesses}/{totalProcesses}</span>
                      <span className="ml-1">({percentage}%)</span>
                    </div>
                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          percentage === 100 ? 'bg-green-500' :
                          percentage > 50 ? 'bg-blue-500' :
                          'bg-yellow-500'
                        }`} 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
          
          {selectedOrder.status === 'completed' && selectedOrder.completedAt && (
            <div className="mb-6 p-3 bg-green-50 border border-green-100 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                <span className="text-green-800 font-medium">
                  Nalog završen: {new Date(selectedOrder.completedAt).toLocaleDateString('hr-HR')} {new Date(selectedOrder.completedAt).toLocaleTimeString('hr-HR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          )}

          {/* Process list */}
          <ProcessList 
            order={selectedOrder}
            processes={processes}
            inventory={inventory}
            onCompleteProcess={handleConfirmProcess}
          />
        </div>
      )}
      
      {/* Full-screen confirmation modal */}
      {confirmationModalState.isOpen && (
        <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-center justify-center">
          <div className="relative bg-white rounded-lg max-w-md w-full mx-4 shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <div className="flex items-center">
                <CheckCircle className="h-6 w-6 text-green-600 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">Potvrda završetka procesa</h3>
              </div>
              <button
                onClick={closeConfirmationModal}
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* Content */}
            <div className="p-5">
              <div className="flex items-start mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                <div>
                  <h3 className="text-base font-medium text-blue-800">Jeste li sigurni?</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    Potvrdite da želite označiti proces kao završen. Ova akcija se ne može poništiti.
                  </p>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Detalji:</h4>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Radni nalog:</span>
                    <span className="font-medium text-gray-900">{confirmationModalState.orderNumber}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Artikal:</span>
                    <span className="font-medium text-gray-900">{confirmationModalState.itemName}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Dimenzije:</span>
                    <span className="font-medium text-gray-900">{confirmationModalState.dimensions.width} × {confirmationModalState.dimensions.height} cm</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Količina:</span>
                    <span className="font-medium text-gray-900">{confirmationModalState.quantity} kom</span>
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Proces koji završavate:</span>
                    <span className="font-bold text-blue-600">{confirmationModalState.processName}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-700">
                  <span className="font-medium">Napomena:</span> Nakon što označite proces kao završen, status naloga će se ažurirati. Ako je ovo posljednji proces, nalog će biti označen kao završen.
                </p>
              </div>
            </div>
            
            {/* Footer */}
            <div className="flex justify-end space-x-3 p-5 border-t border-gray-200">
              <button
                onClick={closeConfirmationModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Odustani
              </button>
              <button
                onClick={confirmProcessCompletion}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
              >
                Potvrdi završetak
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProcessOrderManagement;
