import React from 'react';
import { X } from 'lucide-react';
import { QuoteItem } from '../../../types';
import { generateId } from '../../../utils/idGenerators';
import { useBulkEntry } from './hooks/useBulkEntry';
import { parseDimensionsText } from './utils';
import { BulkEntryModalProps } from './types';
import ProductSelector from './components/ProductSelector';
import DimensionsInput from './components/DimensionsInput';
import PreviewTable from './components/PreviewTable';
import SummaryCard from './components/SummaryCard';
import ModalActions from './components/ModalActions';

/**
 * Refaktorirani BulkEntryModal - profesionalno organiziran u logičke komponente
 */
const BulkEntryModal: React.FC<BulkEntryModalProps> = ({
  isOpen,
  onClose,
  onAddItems,
  products
}) => {
  const {
    selectedProductId,
    dimensionsText,
    error,
    parsedItems,
    isPreviewMode,
    unitPrice,
    setSelectedProductId,
    setDimensionsText,
    setError,
    setParsedItems,
    setIsPreviewMode,
    setUnitPrice,
    resetForm
  } = useBulkEntry();

  if (!isOpen) return null;

  const selectedProduct = products.find(p => p.id === selectedProductId);

  /**
   * Parsira unesene dimenzije i prelazi u preview mode
   */
  const handleParseItems = () => {
    if (!selectedProductId) {
      setError('Molimo odaberite proizvod');
      return;
    }

    if (!dimensionsText.trim()) {
      setError('Molimo unesite dimenzije');
      return;
    }

    setError(null);
    const { items, errors } = parseDimensionsText(dimensionsText);

    if (errors.length > 0) {
      setError(`Greške u formatu:\n${errors.join('\n')}`);
      return;
    }

    if (items.length === 0) {
      setError('Nema valjanih dimenzija za unos');
      return;
    }

    // Postavi početnu cijenu iz proizvoda ako je dostupna
    if (selectedProduct && selectedProduct.price && unitPrice === 0) {
      setUnitPrice(selectedProduct.price);
    }

    setParsedItems(items);
    setIsPreviewMode(true);
  };

  /**
   * Kreira QuoteItem objekte i dodaje ih u ponudu
   */
  const handleAddItems = () => {
    if (!selectedProductId || parsedItems.length === 0) return;

    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;

    const newItems: QuoteItem[] = parsedItems.map(item => {
      // Izračunaj površinu u m² (konvertiraj mm u m)
      const widthInMeters = item.width / 1000;
      const heightInMeters = item.height / 1000;
      const area = widthInMeters * heightInMeters;

      return {
        id: generateId(),
        productId: selectedProductId,
        productName: product.name,
        isService: false,
        quantity: item.quantity,
        unitPrice: unitPrice,
        totalPrice: area * unitPrice * item.quantity,
        dimensions: {
          width: item.width,
          height: item.height,
          area: area
        },
        materials: product.materials ? product.materials.map(material => ({
          id: generateId(),
          inventoryItemId: material.inventoryItemId,
          quantity: material.quantity,
          unit: material.unit,
          notes: material.notes,
          hasProcesses: material.hasProcesses,
          showOnDeliveryNote: material.showOnDeliveryNote,
          inventoryName: material.inventoryName,
          processSteps: material.processSteps ? material.processSteps.map(step => ({
            id: generateId(),
            processId: step.processId,
            status: 'pending' as const,
            notes: step.notes || '',
            isFixed: true // Označava da je proces kopiran iz proizvoda
          })) : []
        })) : [],
        notes: ''
      };
    });

    onAddItems(newItems);
    handleClose();
  };

  /**
   * Vraća na edit mode
   */
  const handleGoBack = () => {
    setIsPreviewMode(false);
  };

  /**
   * Zatvara modal i resetira form
   */
  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleClose} />
        
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {isPreviewMode ? 'Pregled artikala' : 'Masovni unos stavki'}
              </h3>
              <button
                type="button"
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="space-y-6">
              {!isPreviewMode ? (
                <>
                  <ProductSelector
                    products={products}
                    selectedProductId={selectedProductId}
                    onProductChange={setSelectedProductId}
                    error={error}
                  />
                  
                  <DimensionsInput
                    dimensionsText={dimensionsText}
                    onDimensionsChange={setDimensionsText}
                    error={error}
                  />
                </>
              ) : (
                <>
                  <PreviewTable
                    items={parsedItems}
                    unitPrice={unitPrice}
                    onUnitPriceChange={setUnitPrice}
                  />
                  
                  <SummaryCard
                    items={parsedItems}
                    unitPrice={unitPrice}
                  />
                </>
              )}
            </div>
          </div>

          {/* Actions */}
          <ModalActions
            isPreviewMode={isPreviewMode}
            itemsCount={parsedItems.length}
            onParseItems={handleParseItems}
            onAddItems={handleAddItems}
            onGoBack={handleGoBack}
            onClose={handleClose}
          />
        </div>
      </div>
    </div>
  );
};

export default BulkEntryModal;

