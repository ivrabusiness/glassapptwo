import React from 'react';
import { User, Building, Package, Settings } from 'lucide-react';
import { useSupabaseData } from '../../../hooks/useSupabaseData';
import { WorkOrder, Product, Client, Process, InventoryItem } from '../../../types';

interface WorkOrderContentProps {
  order: WorkOrder;
}

const WorkOrderContent: React.FC<WorkOrderContentProps> = ({ order }) => {
  const [products] = useSupabaseData<Product>('products', []);
  const [clients] = useSupabaseData<Client>('clients', []);
  const [processes] = useSupabaseData<Process>('processes', []);
  const [inventory] = useSupabaseData<InventoryItem>('inventory', []);

  const client = order?.clientId ? clients.find(c => c.id === order.clientId) : null;

  return (
    <div className="lg:col-span-2 space-y-6">
      {/* Client Info */}
      {client && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Klijent</h2>
          <div className="flex items-start space-x-3">
            {client.type === 'company' ? (
              <Building className="h-5 w-5 text-blue-500 mt-0.5" />
            ) : (
              <User className="h-5 w-5 text-green-500 mt-0.5" />
            )}
            <div>
              <p className="text-sm font-medium text-gray-900">{client.name}</p>
              <p className="text-sm text-gray-600">{client.address}</p>
              <p className="text-sm text-gray-600">OIB: {client.oib}</p>
              {client.contactPerson && (
                <p className="text-sm text-gray-600">Kontakt: {client.contactPerson}</p>
              )}
              {client.phone && (
                <p className="text-sm text-gray-600">Telefon: {client.phone}</p>
              )}
              {client.email && (
                <p className="text-sm text-gray-600">Email: {client.email}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Items */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Artikli</h2>
        <div className="space-y-6">
          {order.items.map((item, index) => {
            const product = products.find(p => p.id === item.productId);
            
            return (
              <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Artikal {index + 1}: {item.isService ? item.productName : (product?.name || 'Nepoznat proizvod')}
                  </h3>
                  <span className="text-sm text-gray-500">
                    {item.isService ? (
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">Usluga</span>
                    ) : (
                      product?.code
                    )}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <span className="text-sm text-gray-600">Količina:</span>
                    <p className="font-medium">{item.quantity} {item.isService && item.serviceUnit === 'hour' ? 'sati' : 'kom'}</p>
                  </div>
                  {!item.isService && (
                  <div>
                    <span className="text-sm text-gray-600">Dimenzije:</span>
                    <p className="font-medium">{item.dimensions.width} × {item.dimensions.height} mm</p>
                  </div>
                  )}
                  {!item.isService && (
                  <div>
                    <span className="text-sm text-gray-600">Površina po komadu:</span>
                    <p className="font-medium">{item.dimensions.area.toFixed(4)} m²</p>
                  </div>
                  )}
                  {!item.isService && (
                  <div>
                    <span className="text-sm text-gray-600">Ukupna površina:</span>
                    <p className="font-medium">{(item.dimensions.area * item.quantity).toFixed(4)} m²</p>
                  </div>
                  )}
                </div>

                {/* Materials Used */}
                {!item.isService && item.materials && item.materials.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Korišteni materijali:</h4>
                    <div className="space-y-3">
                      {item.materials.map((material, materialIndex) => {
                        const inventoryItem = inventory.find(inv => inv.id === material.inventoryItemId);
                        const productMaterial = product?.materials?.find(pm => pm.inventoryItemId === material.inventoryItemId);
                        const usedQuantity = material.quantity * item.quantity * item.dimensions.area;
                        
                        return (
                          <div key={material.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <Package className="h-4 w-4 text-gray-400" />
                                <div className="text-sm font-medium text-gray-900">
                                  {inventoryItem?.name || 'Nepoznat materijal'} #{materialIndex + 1}
                                 <span className="flex items-center space-x-2">
                                   {inventoryItem?.type === 'glass' && inventoryItem.glassThickness && (
                                     <span className="text-blue-600 ml-1">({inventoryItem.glassThickness}mm)</span>
                                   )}
                                   {productMaterial?.showOnDeliveryNote === false && (
                                     <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                       Potrošni materijal
                                     </span>
                                   )}
                                 </span>
                                </div>
                              </div>
                              <span className="text-sm font-semibold text-red-600">
                                {inventoryItem?.unit === 'kg' ? 
                                  usedQuantity.toFixed(2) : 
                                  material.unit === 'kom' ? 
                                    usedQuantity.toFixed(0) : 
                                    usedQuantity.toFixed(4)} {inventoryItem?.unit || material.unit}
                              </span>
                            </div>
                            
                            {/* Detaljni prikaz kalkulacije */}
                            <div className="text-xs text-gray-600 bg-white p-2 rounded border">
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <span className="font-medium">Utrošak po {item.dimensions.area > 0 ? 'm²' : 'kom'}:</span> {material.quantity} {inventoryItem?.unit || material.unit}
                                </div>
                                <div>
                                  <span className="font-medium">Broj komada:</span> {item.quantity}
                                </div>
                                <div>
                                  <span className="font-medium">Površina po komadu:</span> {item.dimensions.area.toFixed(4)} m²
                                </div>
                                <div>
                                  <span className="font-medium">Ukupni utrošak:</span> 
                                  <span className="text-red-600 font-semibold ml-1">
                                    {inventoryItem?.unit === 'kg' ? 
                                      usedQuantity.toFixed(2) : 
                                      material.unit === 'kom' ? 
                                        usedQuantity.toFixed(0) : 
                                        usedQuantity.toFixed(4)} {inventoryItem?.unit || material.unit}
                                  </span>
                                </div>
                              </div>
                              <div className="mt-2 pt-2 border-t border-gray-200">
                                <span className="font-medium">Kalkulacija:</span> {material.quantity} × {item.quantity} × {item.dimensions.area.toFixed(4)} = {inventoryItem?.unit === 'kg' ? 
                                  usedQuantity.toFixed(2) : 
                                  material.unit === 'kom' ? 
                                    usedQuantity.toFixed(0) : 
                                    usedQuantity.toFixed(4)} {inventoryItem?.unit || material.unit}
                              </div>
                            </div>

                            {/* Napomena za materijal bez procesa */}
                            
                            {/* Procesi za ovaj materijal */}
                            {material.processSteps && material.processSteps.length > 0 && (
                              <div className="mt-3">
                                <h5 className="text-xs font-medium text-gray-700 mb-2">Procesi za materijal #{materialIndex + 1}:</h5>
                                <div className="space-y-1">
                                  {material.processSteps.map(step => {
                                    const process = processes.find(p => p.id === step.processId);
                                    return (
                                      <div key={step.id} className="flex items-center justify-between p-2 bg-white rounded border">
                                        <div className="flex items-center space-x-2">
                                          <Settings className="h-3 w-3 text-blue-500" />
                                          <span className="text-xs text-gray-900">
                                            {process?.name || 'Nepoznat proces'}
                                          </span>
                                        </div>
                                        <span className={`text-xs px-2 py-1 rounded-full ${
                                          step.status === 'completed' ? 'bg-green-100 text-green-800' :
                                          step.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                                          'bg-gray-100 text-gray-800'
                                        }`}>
                                          {step.status === 'completed' ? 'Završen' :
                                           step.status === 'in-progress' ? 'U tijeku' : 'Na čekanju'}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                            
                            {(!material.processSteps || material.processSteps.length === 0) && (
                              <div className="mt-3">
                                <h5 className="text-xs font-medium text-gray-700 mb-2">Procesi za materijal #{materialIndex + 1}:</h5>
                                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-center">
                                  <p className="text-xs text-gray-500">Nema dodanih procesa</p>
                                </div>
                              </div>
                            )}
                            
                            {/* Napomena za materijal */}
                            {material.notes && (
                              <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                                <h5 className="text-xs font-medium text-yellow-800 mb-1">Napomena za materijal #{materialIndex + 1}:</h5>
                                <p className="text-sm text-yellow-700">{material.notes}</p>
                              </div>
                            )}
                            
                            {/* Napomene za procese ovog materijala */}
                            {material.processSteps && material.processSteps.some(step => step.notes) && (
                              <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                                <h6 className="text-xs font-medium text-yellow-800 mb-1">Napomene za procese:</h6>
                                <div className="space-y-1">
                                  {material.processSteps.filter(step => step.notes).map(step => {
                                    const process = processes.find(p => p.id === step.processId);
                                    return (
                                      <div key={`note-${step.id}`} className="text-xs">
                                        <span className="font-medium">{process?.name || 'Proces'}:</span> {step.notes}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Item Notes */}
                {item.notes && (
                  <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <h4 className="text-sm font-medium text-gray-900 mb-1">Napomene artikla:</h4>
                    <p className="text-sm text-gray-700">{item.notes}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Order Notes */}
      {order.notes && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Napomene naloga</h2>
          <p className="text-gray-700">{order.notes}</p>
        </div>
      )}
    </div>
  );
};

export default WorkOrderContent;
