import React, { useState, useEffect } from 'react';
import { generateItemCode, checkDuplicateName, checkDuplicateCode } from '../../utils/idGenerators';
import { InventoryItem } from '../../types';
import { X, AlertTriangle } from 'lucide-react';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  formData: {
    name: string;
    code: string;
    type: 'glass' | 'other';
    glassThickness: number;
    unit: string;
    minQuantity: number;
    notes: string;
  };
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  editingItem: InventoryItem | null;
  inventory: InventoryItem[];
  isSubmitting: boolean;
}

const AddItemModal: React.FC<AddItemModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  formData,
  setFormData,
  editingItem,
  inventory,
  isSubmitting
}) => {
  const [nameError, setNameError] = useState<string>('');
  const [codeError, setCodeError] = useState<string>('');
  const [useAutoCode, setUseAutoCode] = useState<boolean>(!editingItem);

  // Auto-generate code if useAutoCode is true - MOVED BEFORE EARLY RETURN
  useEffect(() => {
    if (isOpen && useAutoCode && !editingItem) {
      const autoCode = generateItemCode(inventory);
      setFormData((prev: any) => ({ ...prev, code: autoCode }));
    }
  }, [isOpen, useAutoCode, inventory, editingItem, setFormData]);

  if (!isOpen) return null;

  // Generate thickness options from 1 to 30mm
  const thicknessOptions = Array.from({ length: 30 }, (_, i) => i + 1);

  // Check for duplicate name
  const handleNameChange = (name: string) => {
    setFormData((prev: any) => ({ ...prev, name }));
    
    if (name.trim() && checkDuplicateName(inventory, name, editingItem?.id)) {
      setNameError('Artikal s ovim nazivom već postoji!');
    } else {
      setNameError('');
    }
  };

  // Check for duplicate code
  const handleCodeChange = (code: string) => {
    setFormData((prev: any) => ({ ...prev, code }));
    
    if (code.trim() && checkDuplicateCode(inventory, code, editingItem?.id)) {
      setCodeError('Artikal s ovim kodom već postoji!');
    } else {
      setCodeError('');
    }
  };

  // Toggle between auto and manual code
  const handleCodeModeChange = (auto: boolean) => {
    setUseAutoCode(auto);
    if (auto && !editingItem) {
      const autoCode = generateItemCode(inventory);
      setFormData((prev: any) => ({ ...prev, code: autoCode }));
      setCodeError('');
    }
  };

  // Check if form has errors
  const hasErrors = Boolean(nameError || codeError);

  // Enhanced submit handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Final validation before submit
    const nameExists = checkDuplicateName(inventory, formData.name, editingItem?.id);
    const codeExists = checkDuplicateCode(inventory, formData.code, editingItem?.id);
    
    if (nameExists) {
      setNameError('Artikal s ovim nazivom već postoji!');
      return;
    }
    
    if (codeExists) {
      setCodeError('Artikal s ovim kodom već postoji!');
      return;
    }
    
    // Call original submit if no errors
    onSubmit(e);
  };

  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto relative z-10">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">
              {editingItem ? 'Uredi artikal' : 'Dodaj novi artikal'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 rounded-full p-1"
              aria-label="Zatvori"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {!editingItem && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tip artikla
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData((prev: any) => ({ 
                      ...prev, 
                      type: e.target.value as 'glass' | 'other',
                      unit: e.target.value === 'glass' ? 'm²' : prev.unit
                    }))}
                    disabled={isSubmitting}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                  >
                    <option value="glass">Staklo</option>
                    <option value="other">Ostalo</option>
                  </select>
                </div>
              )}

              <div className={!editingItem ? "md:col-span-1" : "md:col-span-2"}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Naziv artikla
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  disabled={isSubmitting}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 ${
                    nameError ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                />
                {nameError && (
                  <div className="flex items-center mt-1 text-sm text-red-600">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    {nameError}
                  </div>
                )}
              </div>
            </div>

            {/* Kod artikla sekcija */}
            <div className="space-y-3">
              {!editingItem && (
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={useAutoCode}
                      onChange={() => handleCodeModeChange(true)}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">Automatski kod</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={!useAutoCode}
                      onChange={() => handleCodeModeChange(false)}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">Vlastiti kod</span>
                  </label>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kod artikla
                </label>
                <input
                  type="text"
                  required
                  value={formData.code || ''}
                  onChange={(e) => handleCodeChange(e.target.value)}
                  disabled={(!editingItem && useAutoCode) || isSubmitting}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 ${
                    codeError ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  } ${!editingItem && useAutoCode ? 'bg-gray-50' : ''}`}
                  placeholder={!editingItem && useAutoCode ? 'Automatski generirani kod' : 'Unesite kod artikla'}
                />
                {codeError && (
                  <div className="flex items-center mt-1 text-sm text-red-600">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    {codeError}
                  </div>
                )}
                {!editingItem && useAutoCode && (
                  <p className="text-xs text-gray-500 mt-1">
                    Kod se automatski generira u formatu IN0001, IN0002, itd.
                  </p>
                )}
              </div>
            </div>

            {formData.type === 'glass' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Debljina stakla (mm)
                </label>
                <select
                  value={formData.glassThickness}
                  onChange={(e) => setFormData((prev: any) => ({ ...prev, glassThickness: parseInt(e.target.value) }))}
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                >
                  {thicknessOptions.map(thickness => (
                    <option key={thickness} value={thickness}>
                      {thickness} mm
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jedinica mjere
                </label>
                <div className="relative">
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData((prev: any) => ({ ...prev, unit: e.target.value }))}
                    disabled={formData.type === 'glass' || isSubmitting}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                  >
                    <option value="m²">m² (kvadratni metar)</option>
                    <option value="m">m (metar)</option>
                    <option value="kg">kg (kilogram)</option>
                    <option value="kom">kom (komad)</option>
                    <option value="l">l (litar)</option>
                  </select>
                </div>
                {formData.type === 'glass' && (
                  <p className="text-xs text-gray-500 mt-1">
                    Staklo se uvijek mjeri u m²
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min. količina
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.001"
                  required
                  value={formData.minQuantity}
                  onChange={(e) => setFormData((prev: any) => ({ ...prev, minQuantity: parseFloat(e.target.value) || 0 }))}
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Napomena
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData((prev: any) => ({ ...prev, notes: e.target.value }))}
                rows={3}
                disabled={isSubmitting}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                placeholder="Dodatne informacije o artiklu..."
              />
            </div>
            
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Odustani
              </button>
              <button
                type="submit"
                disabled={isSubmitting || hasErrors}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Spremam...' : (editingItem ? 'Spremi promjene' : 'Dodaj artikal')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddItemModal;
