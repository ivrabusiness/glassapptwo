import React, { useState } from 'react';
import { Trash2, Package, ChevronDown, ChevronUp, Euro } from 'lucide-react';
import { WorkOrderItem, Product, Process, InventoryItem } from '../../../types';

interface ItemEditorProps {
  item: WorkOrderItem;
  index: number;
  products: Product[];
  processes: Process[];
  inventory: InventoryItem[];
  onUpdate: (itemId: string, field: keyof WorkOrderItem, value: any) => void;
  onRemove: (itemId: string) => void;
  onUpdateMaterialProcesses: (itemId: string, materialId: string, processId: string, action: 'add' | 'remove', notes?: string) => void;
  onUpdateProcessNotes: (itemId: string, materialId: string, processId: string, notes: string) => void;
}

const ItemEditor: React.FC<ItemEditorProps> = ({
  item,
  index,
  products,
  processes,
  inventory,
  onUpdate,
  onRemove,
  onUpdateMaterialProcesses,
  onUpdateProcessNotes
}) => {
  const [showMaterials, setShowMaterials] = useState(false);

  const product = products.find(p => p.id === item.productId);
  

  const handleDimensionChange = (field: 'width' | 'height', value: number) => {
    const newDimensions = { ...item.dimensions, [field]: value };
    // Calculate area in m² (convert mm to m)
    const widthInMeters = newDimensions.width / 1000;
    const heightInMeters = newDimensions.height / 1000;
    newDimensions.area = widthInMeters * heightInMeters;
    onUpdate(item.id, 'dimensions', newDimensions);
  };

  // Provjeri je li proces odabran za specifični materijal
  const isProcessSelected = (materialId: string, processId: string) => {
    // Koristi jedinstveni material.id umjesto inventoryItemId
    const material = item.materials?.find(m => m.id === materialId);
    if (!material || !material.processSteps) {
      return false;
    }
    
    // Provjeri samo processSteps za ovaj specifični materijal
    return material.processSteps.some(step => step.processId === processId);
  };

  // Dohvati napomenu za proces
  const getProcessNotes = (materialId: string, processId: string) => {
    // Koristi jedinstveni material.id umjesto inventoryItemId
    const material = item.materials?.find(m => m.id === materialId);
    if (!material || !material.processSteps) return '';
    
    const processStep = material.processSteps.find(step => step.processId === processId);
    return processStep?.notes || '';
  };

  // Provjeri je li proces fiksan (default) i ne smije se isključiti
  const isProcessFixed = (materialId: string, processId: string) => {
    // Pronađi materijal po jedinstvenom ID-u
    const material = item.materials?.find(m => m.id === materialId);
    if (!material) return false;

    // Odredi redni broj (occurrence index) ove instance među item.materials koji dijele isti inventoryItemId
    const sameItemMaterials = (item.materials || []).filter(m => m.inventoryItemId === material.inventoryItemId);
    const occurrenceIndex = sameItemMaterials.findIndex(m => m.id === materialId);

    // Pronađi odgovarajući product materijal po istom occurrence indexu
    const sameProductMaterials = product?.materials?.filter(m => m.inventoryItemId === material.inventoryItemId) || [];
    const productMaterialForInstance = sameProductMaterials[occurrenceIndex];

    return productMaterialForInstance?.processSteps?.some(step => step.processId === processId && step.isDefault === true) || false;
  };



  // Funkcija za toggle procesa za materijal
  const toggleProcess = (materialId: string, processId: string) => {
    const selected = isProcessSelected(materialId, processId);
    if (selected && isProcessFixed(materialId, processId)) {
      // Ne dozvoli uklanjanje fiksnog (default) procesa
      return;
    }
    onUpdateMaterialProcesses(item.id, materialId, processId, selected ? 'remove' : 'add');
  };

  // Funkcija za ažuriranje napomene za proces
  const handleProcessNotesChange = (materialId: string, processId: string, notes: string) => {
    onUpdateProcessNotes(item.id, materialId, processId, notes);
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Artikal {index + 1}</h3>
        <button
          onClick={() => onRemove(item.id)}
          className="text-red-600 hover:text-red-900 p-1 rounded"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Product Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Proizvod</label>
          <select
            value={item.productId}
            onChange={(e) => {
              const selectedProductId = e.target.value;
              // Parent updateItem će inicijalizirati materijale i dodati samo default (fiksne) procese
              onUpdate(item.id, 'productId', selectedProductId);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Odaberite proizvod</option>
            {products.map(product => (
              <option key={product.id} value={product.id}>
                {product.name} ({product.code})
              </option>
            ))}
          </select>
        </div>

        {/* Quantity */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Količina (kom)</label>
          <input
            type="number"
            min="1"
            value={item.quantity}
            onChange={(e) => onUpdate(item.id, 'quantity', parseInt(e.target.value) || 1)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Width in mm */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Širina (mm)</label>
          <input
            type="number"
            min="0"
            step="0.1"
            value={item.dimensions.width}
            onChange={(e) => handleDimensionChange('width', parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="npr. 3503"
          />
        </div>

        {/* Height in mm */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Visina (mm)</label>
          <input
            type="number"
            min="0"
            step="0.1"
            value={item.dimensions.height}
            onChange={(e) => handleDimensionChange('height', parseFloat(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="npr. 2203"
          />
        </div>
      </div>

      {/* Area Display */}
      {item.dimensions.area > 0 && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700">
            <strong>Dimenzije:</strong> {item.dimensions.width} mm × {item.dimensions.height} mm
          </p>
          <p className="text-sm text-blue-700">
            <strong>Površina po komadu:</strong> {item.dimensions.area.toFixed(4)} m²
          </p>
          <p className="text-sm text-blue-700">
            <strong>Ukupna površina:</strong> {(item.dimensions.area * item.quantity).toFixed(4)} m²
          </p>
        </div>
      )}

      {/* Product Description */}
      {product && product.description && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-1">Opis proizvoda:</h4>
              <p className="text-sm text-gray-700">{product.description}</p>
            </div>
            <div className="flex items-center bg-green-50 px-3 py-1 rounded-lg">
              <Euro className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-sm font-medium text-green-700">{product.price ? product.price.toFixed(2) : '0.00'} €/{product.materials && product.materials.length > 0 ? product.materials[0].unit : 'kom'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Materials and Processes */}
      {product && item.materials && item.materials.length > 0 && (
        <div className="mb-4">
          <button
            type="button"
            onClick={() => setShowMaterials(!showMaterials)}
            className="flex items-center justify-between w-full text-left text-sm font-medium text-gray-700 hover:text-gray-900 p-2 bg-gray-50 rounded-lg"
          >
            <span className="flex items-center">
              <Package className="h-4 w-4 mr-2" />
              Materijali proizvoda ({item.materials?.length || 0})
            </span>
            {showMaterials ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>

          {showMaterials && (
            <div className="mt-3 space-y-4">
              {product.materials?.map((productMaterial, materialIndex) => {
                const inventoryItem = inventory.find(inv => inv.id === productMaterial.inventoryItemId);
                // Za duplikate istog inventoryItemId, uzmi odgovarajuću instancu po occurrence indexu
                const occurrenceIndex = (product.materials || [])
                  .slice(0, materialIndex + 1)
                  .filter(m => m.inventoryItemId === productMaterial.inventoryItemId).length - 1;
                const matchingItemMaterials = (item.materials || []).filter(m => m.inventoryItemId === productMaterial.inventoryItemId);
                const itemMaterial = matchingItemMaterials[occurrenceIndex];
                
                
               // Provjeri ima li materijal procese
               const hasProcesses = productMaterial?.hasProcesses !== false;
               
               // Provjeri prikazuje li se materijal na otpremnici
               const showOnDeliveryNote = productMaterial?.showOnDeliveryNote !== false;
               
                // Potrošnja = količina_po_m² × broj_komada × površina_po_komadu
                const usedQuantity = item.dimensions.area > 0 
                  ? (itemMaterial?.quantity || 0) * item.quantity * item.dimensions.area 
                  : 0;

                return (
                  <div key={`${productMaterial.inventoryItemId}-${materialIndex}`} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">
                          {inventoryItem?.name || 'Nepoznat materijal'} #{materialIndex + 1}
                          {inventoryItem?.type === 'glass' && inventoryItem.glassThickness && (
                            <span className="text-sm text-gray-500">({(itemMaterial?.quantity || 0).toFixed(4)} m²/kom × {item.quantity} kom)</span>
                          )}
                        </h4>
                        <p className="text-xs text-gray-500">
                          <strong>Utrošak:</strong> {(itemMaterial?.quantity || 0)} {inventoryItem?.unit || 'm²'}/{item.dimensions.area > 0 ? 'm²' : 'kom'} × {item.quantity} kom × {item.dimensions.area.toFixed(4)} m² = <span className="font-semibold text-red-600">{usedQuantity.toFixed(inventoryItem?.unit === 'kom' ? 0 : 4)} {inventoryItem?.unit || 'm²'}</span>
                        </p>
                        <p className="text-xs text-gray-500">
                          <strong>Dostupno na skladištu:</strong> {inventoryItem?.quantity.toFixed(inventoryItem?.unit === 'kom' ? 0 : 4) || 0} {inventoryItem?.unit || 'm²'}
                        </p>
                        {inventoryItem && usedQuantity > inventoryItem.quantity && (
                          <>
                            <p className="text-xs text-red-600 font-medium">
                              ⚠️ Nedovoljno materijala! Nedostaje {(usedQuantity - inventoryItem.quantity).toFixed(inventoryItem?.unit === 'kom' ? 0 : 4)} {inventoryItem?.unit || 'm²'}
                            </p>
                            <p className="text-xs text-gray-500">
                              <strong>Prikazuje se na otpremnici:</strong> {showOnDeliveryNote ? '✓ Da' : '✗ Ne'}
                            </p>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Procesi za ovaj specifični materijal */}
                   {hasProcesses ? (
                    <div>
                      <h5 className="text-xs font-medium text-gray-700 mb-2">
                        Procesi za materijal #{materialIndex + 1}:
                      </h5>
                      <div className="space-y-2">
                        {/* Filtriraj procese - prikaži samo one koji su odabrani za ovaj materijal na proizvodu */}
                        {(processes || [])
                          .filter(process => {
                            // Provjeri ima li ovaj materijal ovaj proces odabran na proizvodu (bilo default ili ne)
                            return productMaterial?.processSteps?.some(step => step.processId === process.id);
                          })
                          .sort((a, b) => a.order - b.order)
                          .map(process => {
                            // Koristi jedinstveni ID materijala iz item.materials po occurrence indexu
                            const materialId = itemMaterial?.id || '';
                            const uniqueCheckboxId = `item-${item.id}-material-${materialId}-process-${process.id}`;
                            const isSelected = isProcessSelected(materialId, process.id);
                            const processNotes = getProcessNotes(materialId, process.id);
                            
                            // Provjeri je li proces označen kao default na proizvodu
                            const isDefault = productMaterial?.processSteps?.some(step => 
                              step.processId === process.id && step.isDefault === true
                            );

                            return (
                              <div key={uniqueCheckboxId} className={`border rounded p-3 ${
                                isDefault 
                                  ? 'bg-orange-50 border-orange-200' 
                                  : 'bg-white border-gray-200'
                              }`}>
                                <div className="flex items-center space-x-3 mb-2">
                                  <input
                                    type="checkbox"
                                    id={uniqueCheckboxId}
                                    checked={isSelected}
                                    disabled={isDefault}
                                    onChange={() => toggleProcess(materialId, process.id)}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
                                  />
                                  <div className="flex-1">
                                    <label 
                                      htmlFor={uniqueCheckboxId}
                                      className="text-sm font-medium text-gray-900 cursor-pointer flex items-center"
                                    >
                                      <span>{process.order}. {process.name}</span>
                                      {isDefault && (
                                        <span className="ml-2 text-xs bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded font-medium">
                                          OBAVEZAN
                                        </span>
                                      )}
                                      {!isDefault && (
                                        <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                                          opcionalno
                                        </span>
                                      )}
                                      {process.thicknessPrices && process.thicknessPrices.length > 0 && inventoryItem?.type === 'glass' && (
                                        <span className="ml-2 text-xs bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded">
                                          {inventoryItem.glassThickness}mm
                                        </span>
                                      )}
                                    </label>
                                    <p className="text-sm text-gray-600">Potrebno: {(itemMaterial?.quantity || 0).toFixed(4)} m²/kom</p>
                                  </div>
                                </div>

                                {isSelected && (
                                  <div className="mt-2">
                                    <label className="block text-xs font-medium text-gray-700 mb-1">
                                      Napomena za proces na materijal #{materialIndex + 1}
                                    </label>
                                    <textarea
                                      value={processNotes}
                                      onChange={(e) => handleProcessNotesChange(materialId, process.id, e.target.value)}
                                      rows={2}
                                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                      placeholder={`Napomena za ${process.name} na ${inventoryItem?.name || 'materijal'} #${materialIndex + 1}...`}
                                    />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    </div>
                   ) : (
                     <div className="mt-2">
                       <label className="block text-xs font-medium text-gray-700 mb-1">
                         Napomena za materijal #{materialIndex + 1}
                       </label>
                       <textarea
                         value={itemMaterial?.quantity || 0}
                         onChange={(e) => onUpdate(
                           item.id,
                           'materials',
                           item.materials?.map((m) =>
                             m.id === (itemMaterial?.id || '')
                               ? { ...m, quantity: parseFloat(e.target.value) || 0 }
                               : m
                           )
                         )}
                         rows={2}
                         className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                         placeholder={`Napomena za ${inventoryItem?.name || 'materijal'} #${materialIndex + 1}...`}
                       />
                     </div>
                   )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Item Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Napomene artikla</label>
        <textarea
          value={item.notes || ''}
          onChange={(e) => onUpdate(item.id, 'notes', e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Dodatne napomene za ovaj artikal..."
        />
      </div>
    </div>
  );
};

export default ItemEditor;
