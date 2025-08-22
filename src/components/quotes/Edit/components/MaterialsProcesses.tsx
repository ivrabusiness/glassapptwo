import React, { useState } from 'react';
import { Package, ChevronDown, ChevronUp } from 'lucide-react';
import { QuoteItem, Product, Process, InventoryItem } from '../../../../types';


interface MaterialsProcessesProps {
  item: QuoteItem;
  product?: Product;
  processes: Process[];
  inventory: InventoryItem[];
  isProcessSelected: (materialId: string, processId: string) => boolean;
  isProcessFixed: (materialId: string, processId: string) => boolean;
  getProcessNotes: (materialId: string, processId: string) => string;
  toggleProcess: (materialId: string, processId: string) => void;
  handleProcessNotesChange: (materialId: string, processId: string, notes: string) => void;
}

const MaterialsProcesses: React.FC<MaterialsProcessesProps> = ({
  item,
  product,
  processes,
  inventory,
  isProcessSelected,
  isProcessFixed,
  getProcessNotes,
  toggleProcess,
  handleProcessNotesChange
}) => {
  const [showMaterials, setShowMaterials] = useState(false);

  if (item.isService || !product || !item.materials || item.materials.length === 0) {
    return null;
  }

  return (
    <div className="mb-4">
      <button
        type="button"
        onClick={() => setShowMaterials(!showMaterials)}
        className="flex items-center justify-between w-full text-left px-4 py-3 bg-white hover:bg-gray-50 transition-colors border border-gray-200 rounded-lg"
      >
        <span className="flex items-center">
          <Package className="h-4 w-4 mr-3 text-gray-500" />
          <span className="text-sm font-medium text-gray-900">Materijali i procesi</span>
          <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
            {product.materials?.length || 0}
          </span>
        </span>
        {showMaterials ? (
          <ChevronUp className="h-4 w-4 text-gray-500" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-500" />
        )}
      </button>

      {showMaterials && (
        <div className="mt-3 space-y-3">
          {(item.materials || []).map((material, materialIndex) => {
            const inventoryItem = inventory?.find(inv => inv.id === material.inventoryItemId);

            // Mapiranje instance materijala po occurrence indexu (isti pristup kao u radnim nalozima)
            const sameItemMaterials = (item.materials || []).filter(m => m.inventoryItemId === material.inventoryItemId);
            const occurrenceIndex = sameItemMaterials.findIndex(m => m.id === material.id);
            const sameProductMaterials = product.materials?.filter(m => m.inventoryItemId === material.inventoryItemId) || [];
            const productMaterialForInstance = sameProductMaterials[occurrenceIndex];

            // Provjeri ima li materijal procese (po odgovarajućem product materijalu)
            const hasProcesses = productMaterialForInstance?.hasProcesses !== false;

            return (
              <div key={material.id} className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                    {inventory?.find(inv => inv.id === material.inventoryItemId)?.name || 'Nepoznat materijal'} #{materialIndex + 1}
                    {inventoryItem?.type === 'glass' && inventoryItem.glassThickness && (
                      <span className="text-blue-600 ml-2 normal-case">({inventoryItem.glassThickness}mm)</span>
                    )}
                  </h4>
                </div>

                {/* Procesi za ovaj specifični materijal */}
                {hasProcesses && (
                  <div className="px-4 py-3">
                    <div className="space-y-2">
                      {/* Filtriraj procese - prikaži SVE procese dodijeljene na product materijalu (default + opcionalni) za odgovarajuću instancu */}
                      {(() => {
                        const productAssignedIds = new Set(
                          (productMaterialForInstance?.processSteps || []).map(step => step.processId)
                        );
                        return (processes || []).filter(process => productAssignedIds.has(process.id));
                      })()
                        .sort((a, b) => a.order - b.order)
                        .map(process => {
                          const uniqueCheckboxId = `quote-item-${item.id}-material-${material.id}-process-${process.id}`;
                          const isSelected = isProcessSelected(material.id, process.id);
                          const isFixed = isProcessFixed(material.id, process.id);
                          const processNotes = getProcessNotes(material.id, process.id);
                          // Detektiraj je li ovaj proces default za ovu instancu materijala
                          const productStepForProcess = productMaterialForInstance?.processSteps?.find(step => step.processId === process.id);
                          const isDefaultForInstance = productStepForProcess?.isDefault === true;
                        // Pronađi odgovarajuću cijenu za debljinu stakla
                        let effectivePrice = process.price; // Osnovna cijena kao fallback
                        
                        if (inventoryItem?.glassThickness && process.thicknessPrices && process.thicknessPrices.length > 0) {
                          const thicknessPrice = process.thicknessPrices.find(tp => tp.thickness === inventoryItem.glassThickness);
                          if (thicknessPrice) {
                            effectivePrice = thicknessPrice.price;
                          }
                        }

                        const hasPrice = !isDefaultForInstance && effectivePrice !== undefined && effectivePrice > 0;

                        let processUnitPrice = 0;
                        let processItemPrice = 0;
                        
                        if (hasPrice) {
                          switch (process.priceType) {
                            case 'square_meter':
                              processUnitPrice = effectivePrice || 0;
                              processItemPrice = processUnitPrice * item.dimensions.area * item.quantity;
                              break;
                            case 'linear_meter':
                              const perimeter = 2 * (item.dimensions.width + item.dimensions.height) / 1000; // mm to m
                              processUnitPrice = effectivePrice || 0;
                              processItemPrice = processUnitPrice * perimeter * item.quantity;
                              break;
                            case 'piece':
                              processUnitPrice = effectivePrice || 0;
                              processItemPrice = processUnitPrice * item.quantity;
                              break;
                            case 'hour':
                              processUnitPrice = effectivePrice || 0;
                              processItemPrice = processUnitPrice; // Osnovna cijena po satu
                              break;
                          }
                        }
                        
                        return (
                          <div key={uniqueCheckboxId} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                            <div className="flex items-center space-x-3">
                              <input
                                type="checkbox"
                                id={uniqueCheckboxId}
                                checked={isSelected}
                                disabled={isFixed}
                                onChange={() => toggleProcess(material.id, process.id)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                              />
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <label htmlFor={uniqueCheckboxId} className="flex items-center text-sm font-medium text-gray-900 cursor-pointer">
                                    {process.name}
                                    {isFixed && (
                                      <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-800 text-xs rounded-full font-medium">
                                        Obavezno
                                      </span>
                                    )}
                                    {hasPrice && isSelected && (
                                      <span className="ml-3 text-xs font-semibold text-gray-700">
                                        {processItemPrice.toFixed(2)} €
                                      </span>
                                    )}
                                  </label>
                                </div>
                                
                                <p className="text-xs text-gray-600 mt-1">{process.description}</p>
                              </div>
                            </div>

                            {isSelected && (
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <label className="block text-xs font-medium text-gray-700 mb-2">
                                  Napomena za proces
                                </label>
                                <textarea
                                  value={processNotes}
                                  onChange={(e) => handleProcessNotesChange(material.id, process.id, e.target.value)}
                                  rows={2}
                                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                  placeholder={`Napomena za ${process.name}...`}
                                />
                              </div>
                            )}
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
      )}
    </div>
  );
};

export default MaterialsProcesses;

