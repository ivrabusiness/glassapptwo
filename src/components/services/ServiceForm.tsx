import React, { useState } from 'react';
import { Euro, Info } from 'lucide-react';
import { Service } from '../../types';

interface ServiceFormProps {
  initialService?: Service;
  onSave: (service: Service) => void;
  isSubmitting?: boolean;
  onCancel: () => void;
}

const ServiceForm: React.FC<ServiceFormProps> = ({ initialService, onSave, isSubmitting = false, onCancel }) => {
  const [formData, setFormData] = useState({
    name: initialService?.name || '',
    code: initialService?.code || '',
    description: initialService?.description || '',
    price: initialService?.price || 0,
    unit: initialService?.unit || 'hour' as 'hour' | 'piece' | 'square_meter' | 'linear_meter'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const serviceData: Service = {
      id: initialService?.id || '',
      name: formData.name,
      code: formData.code,
      description: formData.description,
      price: formData.price,
      unit: formData.unit,
      createdAt: initialService?.createdAt || new Date().toISOString()
    };
    
    onSave(serviceData);
  };

  const getUnitLabel = (unit: string): string => {
    switch (unit) {
      case 'hour': return 'sat';
      case 'piece': return 'komad';
      case 'square_meter': return 'm²';
      case 'linear_meter': return 'm';
      default: return unit;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Naziv usluge
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="npr. Montaža stakla"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Kod usluge
          </label>
          <input
            type="text"
            required
            value={formData.code}
            onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="npr. USL-001"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Opis usluge
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          placeholder="Detaljan opis usluge..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Jedinica mjere
          </label>
          <select
            value={formData.unit}
            onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value as any }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="hour">Po satu (h)</option>
            <option value="piece">Po komadu (kom)</option>
            <option value="square_meter">Po kvadratnom metru (m²)</option>
            <option value="linear_meter">Po dužnom metru (m)</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cijena (€)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Euro className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="number"
              min="0" 
              step="0.01"
              required
              value={formData.price}
              onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
              className="w-full pl-10 pr-16 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="0.00"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-gray-500">€/{getUnitLabel(formData.unit)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg mt-4">
        <div className="flex items-start">
          <Info className="h-5 w-5 text-purple-600 mr-2 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-purple-800">Informacije o cijeni usluge</p>
            <p className="text-xs text-purple-700 mt-1">
              Cijena usluge će biti korištena za automatsko izračunavanje vrijednosti u ponudama.
              Ovisno o odabranoj jedinici mjere, cijena će se množiti s odgovarajućom vrijednošću (sati, komadi, površina, duljina).
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-6 mt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
        >
          Odustani
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 transition-colors"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Spremam...
            </>
          ) : (
            initialService ? 'Spremi promjene' : 'Dodaj uslugu'
          )}
        </button>
      </div>
    </form>
  );
};

export default ServiceForm;
