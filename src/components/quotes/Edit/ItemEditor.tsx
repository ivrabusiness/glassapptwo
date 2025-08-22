import React, { useState } from 'react';
import { Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Product, QuoteItem, Process, InventoryItem, Service } from '../../../types';
import { calculateItemProcessPrice } from '../../../utils/processUtils';
import { useItemProcesses } from '../Create/hooks/useItemProcesses';
import { useItemDimensions } from './hooks/useItemDimensions';
import { useItemPricing } from './hooks/useItemPricing';
import ProductServiceSelection from './components/ProductServiceSelection';
import DimensionsInput from './components/DimensionsInput';
import PricingDisplay from './components/PricingDisplay';
import MaterialsProcesses from './components/MaterialsProcesses';
import ServiceProcesses from './components/ServiceProcesses';
import { useServiceProcesses } from '../Create/hooks/useServiceProcesses';

interface ItemEditorProps {
  item: QuoteItem;
  index: number;
  products: Product[];
  services: Service[];
  processes: Process[];
  inventory: InventoryItem[];
  onUpdate: (itemId: string, field: keyof QuoteItem, value: any) => void;
  onRemove: (itemId: string) => void;
  onUpdateMaterialProcesses: (itemId: string, materialId: string, processId: string, action: 'add' | 'remove', notes?: string) => void;
  onUpdateProcessNotes: (itemId: string, materialId: string, processId: string, notes: string) => void;
  onUpdateServiceProcesses: (itemId: string, processId: string, action: 'add' | 'remove', notes?: string) => void;
  onUpdateServiceProcessNotes: (itemId: string, processId: string, notes: string) => void;
}

const ItemEditor: React.FC<ItemEditorProps> = ({
  item,
  index,
  products,
  services,
  processes,
  inventory,
  onUpdate,
  onRemove,
  onUpdateMaterialProcesses,
  onUpdateProcessNotes,
  onUpdateServiceProcesses,
  onUpdateServiceProcessNotes
}) => {
  const [showDetailedCalculation, setShowDetailedCalculation] = useState(false);
  
  const product = products.find(p => p.id === item.productId);
  const service = services.find(s => s.id === item.serviceId);

  // Custom hooks for different concerns
  const { handleDimensionChange } = useItemDimensions({ item, onUpdate });
  const { handleQuantityChange, handleUnitPriceChange } = useItemPricing({ 
    item, 
    product, 
    service, 
    onUpdate 
  });
  
  // Process logic hook
  const { 
    isProcessSelected,
    isProcessFixed,
    getProcessNotes,
    toggleProcess,
    handleProcessNotesChange,
  } = useItemProcesses({ 
    item, 
    onUpdateMaterialProcesses, 
    onUpdateProcessNotes 
  });

  // Service process logic hook
  const {
    isProcessSelected: isServiceProcessSelected,
    isProcessFixed: isServiceProcessFixed,
    getProcessNotes: getServiceProcessNotes,
    toggleProcess: toggleServiceProcess,
    handleProcessNotesChange: handleServiceProcessNotesChange,
  } = useServiceProcesses({
    item,
    onUpdateServiceProcesses,
    onUpdateServiceProcessNotes,
  });
  
  // Calculate process price
  const processPrice = calculateItemProcessPrice(item, processes, inventory);

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Stavka {index + 1}</h3>
          {!item.isService && product && (
            <p className="text-sm text-gray-500 mt-1">
              {product.name}
            </p>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onRemove(item.id)}
            className="text-red-600 hover:text-red-900 p-1 rounded"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Osnovni podaci - proizvod/usluga */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <ProductServiceSelection
          item={item}
          products={products}
          services={services}
          onUpdate={onUpdate}
        />
      </div>

      {/* Dimenzije - istaknuto i odvojeno */}
      {!item.isService && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-lg font-semibold text-blue-900 mb-3">
            Dimenzije proizvoda
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DimensionsInput
              item={item}
              onDimensionChange={handleDimensionChange}
            />
          </div>
          {item.dimensions.area > 0 && (
            <div className="mt-3 p-2 bg-blue-100 rounded">
              <p className="text-sm font-medium text-blue-800">
                Površina: {item.dimensions.width} mm × {item.dimensions.height} mm = <strong>{item.dimensions.area.toFixed(4)} m²</strong>
              </p>
            </div>
          )}
        </div>
      )}

      {/* Cijena i količina */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-3">Cijena i količina</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <PricingDisplay
            item={item}
            product={product}
            service={service}
            processPrice={processPrice}
            onQuantityChange={handleQuantityChange}
            onUnitPriceChange={handleUnitPriceChange}
          />
        </div>
      </div>

      {/* Product Description */}
      {!item.isService && product && product.description && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 mb-1">Opis proizvoda:</h4>
          <p className="text-sm text-gray-700">{product.description}</p>
        </div>
      )}
      
      {/* Service Description */}
      {item.isService && service && service.description && (
        <div className="mb-4 p-3 bg-purple-50 rounded-lg">
          <h4 className="text-sm font-medium text-purple-900 mb-1">Opis usluge:</h4>
          <p className="text-sm text-purple-700">{service.description}</p>
          <div className="mt-2 pt-2 border-t border-purple-200">
            <p className="text-xs text-purple-700">
              <strong>Jedinica mjere:</strong> {service.unit === 'hour' ? 'sat' : 
                                             service.unit === 'piece' ? 'komad' : 
                                             service.unit === 'square_meter' ? 'm²' : 
                                             service.unit === 'linear_meter' ? 'm' : service.unit}
            </p>
          </div>
        </div>
      )}
      
      {/* Materials and Processes */}
      {!item.isService ? (
        <MaterialsProcesses
          item={item}
          product={product}
          processes={processes}
          inventory={inventory}
          isProcessSelected={isProcessSelected}
          isProcessFixed={isProcessFixed}
          getProcessNotes={getProcessNotes}
          toggleProcess={toggleProcess}
          handleProcessNotesChange={handleProcessNotesChange}
        />
      ) : (
        <ServiceProcesses
          item={item}
          processes={processes}
          isProcessSelected={isServiceProcessSelected}
          isProcessFixed={isServiceProcessFixed}
          getProcessNotes={getServiceProcessNotes}
          toggleProcess={toggleServiceProcess}
          handleProcessNotesChange={handleServiceProcessNotesChange}
        />
      )}

      {/* Detaljni izračun - korporativni minimalistički dizajn */}
      {(item.dimensions.area > 0 || item.isService) && (
        <div className="mt-6 mb-4 border border-gray-200 rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => setShowDetailedCalculation(!showDetailedCalculation)}
            className="flex items-center justify-between w-full text-left px-4 py-3 bg-white hover:bg-gray-50 transition-colors border-b border-gray-100"
          >
            <span className="text-sm font-medium text-gray-900">
              Detaljni izračun cijene
            </span>
            {showDetailedCalculation ? (
              <ChevronUp className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            )}
          </button>

          {showDetailedCalculation && (
            <div className="bg-gray-50">
              {/* Osnovni izračun proizvoda/usluge */}
              <div className="px-4 py-3 border-b border-gray-200 bg-white">
                <h6 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">
                  {item.isService ? 'Osnovna cijena usluge' : 'Osnovna cijena proizvoda'}
                </h6>
                
                {!item.isService ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Dimenzije:</span>
                        <div className="font-medium text-gray-900">{item.dimensions.width} mm × {item.dimensions.height} mm</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Površina:</span>
                        <div className="font-medium text-gray-900">{item.dimensions.area.toFixed(4)} m²</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Količina:</span>
                        <div className="font-medium text-gray-900">{item.quantity} kom</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Cijena po m²:</span>
                        <div className="font-medium text-gray-900">{item.unitPrice.toLocaleString('hr-HR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</div>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">Ukupno proizvod:</span>
                        <span className="text-lg font-semibold text-gray-900">
                          {item.totalPrice.toLocaleString('hr-HR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Količina:</span>
                        <div className="font-medium text-gray-900">{item.quantity} {service?.unit === 'hour' ? 'sati' : service?.unit === 'piece' ? 'kom' : service?.unit === 'square_meter' ? 'm²' : service?.unit === 'linear_meter' ? 'm' : 'kom'}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Cijena po jedinici:</span>
                        <div className="font-medium text-gray-900">{item.unitPrice.toLocaleString('hr-HR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</div>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">Ukupno usluga:</span>
                        <span className="text-lg font-semibold text-gray-900">
                          {item.totalPrice.toLocaleString('hr-HR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Detaljni prikaz procesa */}
              {processPrice > 0 && (
                <div className="px-4 py-3 border-b border-gray-200 bg-white">
                  <h6 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-3">Procesi obrade</h6>
                  <div className="space-y-3">
                    {(item.materials || []).map((material, materialIndex) => {
                      const inventoryItem = inventory?.find(inv => inv.id === material.inventoryItemId);
                      const materialProcesses = (material.processSteps || []).filter(step => 
                        isProcessSelected(material.id, step.processId)
                      );
                      
                      if (materialProcesses.length === 0) return null;

                      return (
                        <div key={material.id} className="border border-gray-200 rounded-lg overflow-hidden">
                          <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
                            <p className="text-xs font-medium text-gray-700 uppercase tracking-wide">
                              {inventoryItem?.name || 'Nepoznat materijal'} #{materialIndex + 1}
                            </p>
                          </div>
                          
                          {materialProcesses.map(step => {
                            const process = processes.find(p => p.id === step.processId);
                            if (!process) return null;

                            let processUnitPrice = 0;
                            let processItemPrice = 0;
                            let priceUnit = '';

                            // Pronađi odgovarajuću cijenu za debljinu stakla
                            let effectivePrice = process.price; // Osnovna cijena kao fallback
                            
                            if (inventoryItem?.glassThickness && process.thicknessPrices && process.thicknessPrices.length > 0) {
                              const thicknessPrice = process.thicknessPrices.find(tp => tp.thickness === inventoryItem.glassThickness);
                              if (thicknessPrice) {
                                effectivePrice = thicknessPrice.price;
                              }
                            }

                            // Default procesi su besplatni
                            if (step?.isDefault === true) {
                              effectivePrice = 0;
                            }

                            if (effectivePrice !== undefined && effectivePrice > 0) {
                              switch (process.priceType) {
                                case 'square_meter':
                                  processUnitPrice = effectivePrice;
                                  processItemPrice = processUnitPrice * item.dimensions.area * item.quantity;
                                  priceUnit = 'm²';
                                  break;
                                case 'linear_meter':
                                  const perimeter = 2 * (item.dimensions.width + item.dimensions.height) / 100;
                                  processUnitPrice = effectivePrice;
                                  processItemPrice = processUnitPrice * perimeter * item.quantity;
                                  priceUnit = 'm';
                                  break;
                                case 'piece':
                                  processUnitPrice = effectivePrice;
                                  processItemPrice = processUnitPrice * item.quantity;
                                  priceUnit = 'kom';
                                  break;
                                case 'hour':
                                  processUnitPrice = effectivePrice;
                                  processItemPrice = processUnitPrice * item.quantity;
                                  priceUnit = 'sat';
                                  break;
                                default:
                                  processUnitPrice = effectivePrice;
                                  processItemPrice = processUnitPrice;
                                  priceUnit = 'fiksno';
                                  break;
                              }
                            }

                            return (
                              <div key={step.id} className="px-3 py-2 bg-white">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-sm font-medium text-gray-900">{process.name}</span>
                                  {processItemPrice > 0 && (
                                    <span className="text-sm font-semibold text-gray-900">
                                      {processItemPrice.toFixed(2)} €
                                    </span>
                                  )}
                                </div>
                                {processItemPrice > 0 && (
                                  <div className="text-xs text-gray-600">
                                    {processUnitPrice.toFixed(2)} €/{priceUnit}
                                    {process.priceType === 'linear_meter' && ` × ${(2 * (item.dimensions.width + item.dimensions.height) / 100 * item.quantity).toFixed(2)} m`}
                                    {process.priceType === 'square_meter' && ` × ${(item.dimensions.area * item.quantity).toFixed(4)} m²`}
                                    {process.priceType === 'piece' && ` × ${item.quantity} kom`}
                                    {process.priceType === 'hour' && ` × ${item.quantity} sati`}
                                  </div>
                                )}
                                {step.notes && (
                                  <div className="text-xs text-gray-500 mt-1 italic">
                                    Napomena: {step.notes}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                    
                    <div className="px-3 py-2 bg-gray-50 border-t border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">Ukupno procesi:</span>
                        <span className="text-sm font-semibold text-gray-900">
                          {processPrice.toLocaleString('hr-HR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Finalni izračun - korporativni stil */}
              <div className="px-4 py-3 bg-slate-100 border-t border-gray-300">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium text-gray-700">{item.isService ? 'Cijena usluge:' : 'Cijena proizvoda:'}</span>
                    <span className="font-semibold text-gray-900">{item.totalPrice.toLocaleString('hr-HR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium text-gray-700">Cijena procesa:</span>
                    <span className="font-semibold text-gray-900">{processPrice.toLocaleString('hr-HR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-gray-300">
                    <span className="font-bold text-gray-900 text-base">UKUPNA CIJENA STAVKE:</span>
                    <span className="font-bold text-gray-900 text-xl">
                      {(item.totalPrice + processPrice).toLocaleString('hr-HR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Item Notes */}
      <div className="mt-4">
        <textarea
          value={item.notes || ''}
          onChange={(e) => onUpdate(item.id, 'notes', e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          placeholder="Dodatne napomene za ovu stavku..."
        />
      </div>
    </div>
  );
};

export default ItemEditor;


