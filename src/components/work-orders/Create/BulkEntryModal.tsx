import React, { useState } from 'react';
import { X, Package, AlertCircle, CheckCircle, FileText, ArrowRight, Layers, Maximize2 } from 'lucide-react';
import { Product, WorkOrderItem } from '../../../types';
import { generateId } from '../../../utils/idGenerators';

interface BulkEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddItems: (items: WorkOrderItem[]) => void;
  products: Product[];
}

const BulkEntryModal: React.FC<BulkEntryModalProps> = ({
  isOpen,
  onClose,
  onAddItems,
  products
}) => {
  const [selectedProductId, setSelectedProductId] = useState('');
  const [dimensionsText, setDimensionsText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [parsedItems, setParsedItems] = useState<Array<{width: number, height: number, quantity: number}>>([]);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  if (!isOpen) return null;

  const selectedProduct = products.find(p => p.id === selectedProductId);

  const parseItems = () => {
    if (!selectedProductId) {
      setError('Molimo odaberite proizvod');
      return;
    }

    if (!dimensionsText.trim()) {
      setError('Molimo unesite dimenzije');
      return;
    }

    setError(null);
    const lines = dimensionsText.trim().split(/\n+/);
    const parsedDimensions: Array<{width: number, height: number, quantity: number}> = [];
    const errors: string[] = [];

    lines.forEach((line, index) => {
      // Remove any extra whitespace
      const trimmedLine = line.trim();
      if (!trimmedLine) return;

      // Try different formats:
      // 1. 300x300x1 (width x height x quantity)
      // 2. 300 300 1 (width height quantity)
      // 3. 300,300,1 (width,height,quantity)
      
      let match;
      let width = 0;
      let height = 0;
      let quantity = 1; // Default quantity is 1

      // Format 1: 300x300x1
      match = trimmedLine.match(/^(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)(?:x(\d+))?$/);
      if (match) {
        width = parseFloat(match[1]);
        height = parseFloat(match[2]);
        quantity = match[3] ? parseInt(match[3]) : 1;
      } 
      // Format 2: 300 300 1
      else {
        match = trimmedLine.match(/^(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)(?:\s+(\d+))?$/);
        if (match) {
          width = parseFloat(match[1]);
          height = parseFloat(match[2]);
          quantity = match[3] ? parseInt(match[3]) : 1;
        } 
        // Format 3: 300,300,1
        else {
          match = trimmedLine.match(/^(\d+(?:\.\d+)?),(\d+(?:\.\d+)?)(?:,(\d+))?$/);
          if (match) {
            width = parseFloat(match[1]);
            height = parseFloat(match[2]);
            quantity = match[3] ? parseInt(match[3]) : 1;
          }
        }
      }

      if (width > 0 && height > 0 && quantity > 0) {
        parsedDimensions.push({ width, height, quantity });
      } else {
        errors.push(`Linija ${index + 1}: "${trimmedLine}" nije u ispravnom formatu. Koristite format "širina x visina x količina", "širina visina količina" ili "širina,visina,količina".`);
      }
    });

    if (errors.length > 0) {
      setError(`Greške u formatu:\n${errors.join('\n')}`);
      return;
    }

    if (parsedDimensions.length === 0) {
      setError('Nema valjanih dimenzija za unos');
      return;
    }

    setParsedItems(parsedDimensions);
    setIsPreviewMode(true);
  };

  const handleAddItems = () => {
    if (!selectedProductId || parsedItems.length === 0) return;

    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;

    const newItems: WorkOrderItem[] = parsedItems.map(item => {
      // Calculate area in m² (convert mm to m)
      const widthInMeters = item.width / 1000;
      const heightInMeters = item.height / 1000;
      const area = widthInMeters * heightInMeters;

      // Create materials based on product
      const materials = product.materials.map(material => ({
        id: generateId(),
        materialId: material.id,
        inventoryItemId: material.inventoryItemId,
        quantity: material.quantity,
        unit: material.unit,
        notes: '',
        processSteps: []
      }));

      return {
        id: generateId(),
        productId: selectedProductId,
        quantity: item.quantity,
        dimensions: {
          width: item.width,
          height: item.height,
          area
        },
        materials,
        notes: ''
      };
    });

    onAddItems(newItems);
    onClose();
  };

  const resetForm = () => {
    setSelectedProductId('');
    setDimensionsText('');
    setError(null);
    setParsedItems([]);
    setIsPreviewMode(false);
  };

  const goBackToEdit = () => {
    setIsPreviewMode(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center">
                <div className="bg-blue-100 p-2 rounded-lg mr-3">
                  <Layers className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Masovni unos artikala
                </h3>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 focus:outline-none p-1 rounded-full hover:bg-gray-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {!isPreviewMode ? (
              <div className="mt-4">
                <div className="mb-5">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Odaberite proizvod
                  </label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                  >
                    <option value="">Odaberite proizvod</option>
                    {products.map(product => (
                      <option key={product.id} value={product.id}>
                        {product.name} ({product.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-5">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dimenzije (svaka dimenzija u novom redu)
                  </label>
                  <textarea
                    value={dimensionsText}
                    onChange={(e) => setDimensionsText(e.target.value)}
                    rows={10}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm font-mono text-sm"
                    placeholder="Unesite dimenzije u formatu:
800x300x1
230x250
120x345x2

ili

800 300 1
230 250
120 345 2

ili

800,300,1
230,250
120,345,2"
                  />
                  <p className="mt-2 text-xs text-gray-500 flex items-center">
                    <FileText className="h-3.5 w-3.5 mr-1 text-gray-400" />
                    <span>Formati: <span className="font-mono">širina x visina x količina</span>, <span className="font-mono">širina visina količina</span>, ili <span className="font-mono">širina,visina,količina</span>. Količina je opcionalna (zadano 1).</span>
                  </p>
                </div>
                
                <div className="mb-5 p-4 bg-indigo-50 border border-indigo-200 rounded-lg shadow-sm">
                  <div className="flex items-start">
                    <Maximize2 className="h-5 w-5 text-indigo-500 mr-2 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-indigo-800">Format dimenzija:</p>
                      <ul className="mt-2 text-xs text-indigo-700 space-y-1">
                        <li><strong>V</strong> X <strong>Š</strong> - V=visina, Š=širina (mm)</li>
                        <li>Broj na kraju - količina komada</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="mb-5 p-4 bg-red-50 border border-red-200 rounded-lg shadow-sm">
                    <div className="flex items-start">
                      <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                      <div className="text-sm text-red-700 whitespace-pre-wrap">{error}</div>
                    </div>
                  </div>
                )}

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 shadow-sm">
                  <div className="flex items-start">
                    <Package className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">Upute za masovni unos:</p>
                      <ul className="mt-2 text-xs text-blue-700 space-y-2">
                        <li className="flex items-start">
                          <span className="inline-block h-4 w-4 rounded-full bg-blue-200 text-blue-800 text-xs flex items-center justify-center mr-2 mt-0.5">1</span>
                          <span>Odaberite proizvod koji želite dodati</span>
                        </li>
                        <li className="flex items-start">
                          <span className="inline-block h-4 w-4 rounded-full bg-blue-200 text-blue-800 text-xs flex items-center justify-center mr-2 mt-0.5">2</span>
                          <span>Unesite dimenzije u bilo kojem od podržanih formata</span>
                        </li>
                        <li className="flex items-start">
                          <span className="inline-block h-4 w-4 rounded-full bg-blue-200 text-blue-800 text-xs flex items-center justify-center mr-2 mt-0.5">3</span>
                          <span>Svaka linija predstavlja jedan artikal</span>
                        </li>
                        <li className="flex items-start">
                          <span className="inline-block h-4 w-4 rounded-full bg-blue-200 text-blue-800 text-xs flex items-center justify-center mr-2 mt-0.5">4</span>
                          <span>Količina je opcionalna (zadano 1)</span>
                        </li>
                        <li className="flex items-start">
                          <span className="inline-block h-4 w-4 rounded-full bg-blue-200 text-blue-800 text-xs flex items-center justify-center mr-2 mt-0.5">5</span>
                          <span>Primjer: <span className="font-mono bg-blue-100 px-1 rounded">800x300x2</span> = Š800mm, V300mm, 2 kom</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-4">
                <div className="mb-5 p-4 bg-green-50 border border-green-200 rounded-lg shadow-sm">
                  <div className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-green-800">Pregled artikala za dodavanje</p>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <div className="bg-white bg-opacity-50 p-2 rounded border border-green-100">
                          <p className="text-xs text-green-700">Proizvod:</p>
                          <p className="text-sm font-medium text-green-900">{selectedProduct?.name}</p>
                        </div>
                        <div className="bg-white bg-opacity-50 p-2 rounded border border-green-100">
                          <p className="text-xs text-green-700">Broj artikala:</p>
                          <p className="text-sm font-medium text-green-900">{parsedItems.length}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg mb-5 shadow-sm">
                  <table className="min-w-full divide-y divide-gray-200 table-fixed">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                      <tr>
                        <th className="w-[10%] px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rb.</th>
                        <th className="w-[35%] px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DIMENZIJE</th>
                        <th className="w-[20%] px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">KOLIČINA</th>
                        <th className="w-[35%] px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Površina</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {parsedItems.map((item, index) => {
                        // Calculate area in m²
                        const widthInMeters = item.width / 1000;
                        const heightInMeters = item.height / 1000;
                        const area = widthInMeters * heightInMeters;
                        const totalArea = area * item.quantity;

                        return (
                          <tr key={index} className={index % 2 === 0 ? 'bg-white hover:bg-blue-50' : 'bg-gray-50 hover:bg-blue-50'}>
                            <td className="px-3 py-2.5 whitespace-nowrap text-sm text-center font-medium text-gray-700">{index + 1}</td>
                            <td className="px-3 py-2.5 whitespace-nowrap text-sm text-gray-900 font-medium">
                              <span className="inline-flex items-center space-x-1">
                                <span className="text-blue-700 font-bold">V</span><span>{item.height}</span>
                                <span className="text-gray-500">X</span>
                                <span className="text-blue-700 font-bold">Š</span><span>{item.width}</span>
                                <span>mm</span>
                              </span>
                            </td>
                            <td className="px-3 py-2.5 whitespace-nowrap text-sm text-center">
                              <span className="inline-flex items-center justify-center">
                                <span className="text-gray-900">{item.quantity}</span>
                              </span>
                            </td>
                            <td className="px-3 py-2.5 whitespace-nowrap text-sm text-right font-medium text-blue-600">{totalArea.toFixed(4)} m²</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">Ukupno artikala: <span className="font-medium">{parsedItems.length}</span></div>
                    <div className="text-sm text-gray-700">
                      Ukupna površina: <span className="font-medium text-blue-600">
                        {parsedItems.reduce((total, item) => {
                          const widthInMeters = item.width / 1000;
                          const heightInMeters = item.height / 1000;
                          const area = widthInMeters * heightInMeters;
                          return total + (area * item.quantity);
                        }, 0).toFixed(4)} m²
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-gray-50 px-4 py-4 sm:px-6 sm:flex sm:flex-row-reverse border-t border-gray-200">
            {!isPreviewMode ? (
              <>
                <button
                  type="button"
                  onClick={parseItems}
                  className="w-full inline-flex justify-center items-center rounded-lg border border-transparent shadow-sm px-4 py-2.5 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm transition-colors"
                >
                  <ArrowRight className="h-4 w-4 mr-1.5" />
                  Pregledaj artikle
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2.5 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
                >
                  Odustani
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleAddItems}
                  className="w-full inline-flex justify-center items-center rounded-lg border border-transparent shadow-sm px-4 py-2.5 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm transition-colors"
                >
                  <CheckCircle className="h-4 w-4 mr-1.5" />
                  Dodaj {parsedItems.length} artikala
                </button>
                <button
                  type="button"
                  onClick={goBackToEdit}
                  className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2.5 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
                >
                  Natrag na uređivanje
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkEntryModal;
