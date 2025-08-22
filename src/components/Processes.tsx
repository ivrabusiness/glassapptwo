import React, { useState } from 'react';
import { Plus, Search, Edit, Trash2, Cog, ArrowUp, ArrowDown, X, PlusCircle, Layers } from 'lucide-react';
import { useSupabaseData } from '../hooks/useSupabaseData';
import { Process, ThicknessPriceItem } from '../types';
import { generateId } from '../utils/idGenerators';

const Processes: React.FC = () => {
  const [processes, setProcesses] = useSupabaseData<Process>('processes', []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProcess, setEditingProcess] = useState<Process | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    estimatedDuration: 0,
    priceType: 'square_meter' as 'square_meter' | 'linear_meter' | 'piece' | 'hour', 
    price: 0,
    thicknessPrices: [] as ThicknessPriceItem[],
    useThicknessPricing: false
  });
  const [currentThickness, setCurrentThickness] = useState<number>(0);
  const [currentThicknessPrice, setCurrentThicknessPrice] = useState<number>(0);
  const [thicknessError, setThicknessError] = useState<string | null>(null);
  const [showPricingWarning, setShowPricingWarning] = useState<boolean>(false);

  const sortedProcesses = processes
    .filter(process =>
      process.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      process.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => a.order - b.order);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Extract only the fields that exist in the database schema
    const processData = {
      name: formData.name,
      description: formData.description,
      estimatedDuration: formData.estimatedDuration,
      priceType: formData.priceType,
      price: formData.price,
      thicknessPrices: formData.thicknessPrices
    };
    
    if (editingProcess) {
      setProcesses(prev => prev.map(process =>
        process.id === editingProcess.id
          ? { ...process, ...processData }
          : process
      ));
    } else {
      const maxOrder = Math.max(...processes.map(p => p.order), 0);
      const newProcess: Process = {
        id: generateId(),
        ...processData,
        order: maxOrder + 1,
        createdAt: new Date().toISOString()
      };
      setProcesses(prev => [...prev, newProcess]);
    }
    
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      estimatedDuration: 0,
      priceType: 'square_meter',
      price: 0,
      thicknessPrices: [],
      useThicknessPricing: false
    });
    setEditingProcess(null);
    setIsModalOpen(false);
    setCurrentThickness(0);
    setCurrentThicknessPrice(0);
    setThicknessError(null);
  };

  const handleEdit = (process: Process) => {
    setFormData({
      name: process.name,
      description: process.description,
      estimatedDuration: process.estimatedDuration,
      priceType: process.priceType || 'square_meter',
      price: process.price || 0,
      thicknessPrices: process.thicknessPrices || [],
      useThicknessPricing: (process.thicknessPrices && process.thicknessPrices.length > 0) ? true : false
    });
    setEditingProcess(process);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Jeste li sigurni da želite obrisati ovaj proces?')) {
      setProcesses(prev => prev.filter(process => process.id !== id));
    }
  };

  const handleAddThicknessPrice = () => {
    // Validate thickness
    if (currentThickness <= 0) {
      setThicknessError('Debljina mora biti veća od 0 mm.');
      return;
    }

    // Check if thickness already exists
    const existingIndex = formData.thicknessPrices.findIndex(
      item => item.thickness === currentThickness
    );

    if (existingIndex >= 0) {
      setThicknessError('Cijena za ovu debljinu već postoji.');
      return;
    }

    // Add the new thickness-price pair
    const newThicknessPrices = [
      ...formData.thicknessPrices, 
      { 
        thickness: currentThickness, 
        price: currentThicknessPrice 
      }
    ].sort((a, b) => a.thickness - b.thickness); // Sort by thickness

    setFormData(prev => ({
      ...prev,
      thicknessPrices: newThicknessPrices
    }));

    // Reset inputs
    setCurrentThickness(0);
    setCurrentThicknessPrice(0);
    setThicknessError(null);
  };

  const handleRemoveThicknessPrice = (thickness: number) => {
    setFormData(prev => ({
      ...prev,
      thicknessPrices: prev.thicknessPrices.filter(item => item.thickness !== thickness)
    }));
  };

  const moveProcess = (id: string, direction: 'up' | 'down') => {
    const processIndex = sortedProcesses.findIndex(p => p.id === id);
    if (
      (direction === 'up' && processIndex === 0) ||
      (direction === 'down' && processIndex === sortedProcesses.length - 1)
    ) {
      return;
    }

    const newIndex = direction === 'up' ? processIndex - 1 : processIndex + 1;
    const currentProcess = sortedProcesses[processIndex];
    const swapProcess = sortedProcesses[newIndex];

    setProcesses(prev => prev.map(process => {
      if (process.id === currentProcess.id) {
        return { ...process, order: swapProcess.order };
      }
      if (process.id === swapProcess.id) {
        return { ...process, order: currentProcess.order };
      }
      return process;
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Procesi</h1>
          <p className="text-gray-600">Upravljanje proizvodnim procesima</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Dodaj proces
        </button>
      </div>

      {/* Search */}
      <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-4">
        <div className="relative">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
            <Search className="h-5 w-5" />
          </div>
          <input
            type="text"
            placeholder="Pretraži procese po nazivu, opisu ili trajanju..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        
        {/* Search results stats */}
        <div className="mt-2 flex items-center text-sm text-gray-600">
          <span className="mr-2">Pronađeno: {sortedProcesses.length} {sortedProcesses.length === 1 ? 'proces' : sortedProcesses.length < 5 ? 'procesa' : 'procesa'}</span>
          {searchTerm && (
            <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs font-medium">
              Pretraga: "{searchTerm}"
            </span>
          )}
        </div>
      </div>

      {/* Processes List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {sortedProcesses.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {sortedProcesses.map((process, index) => (
              <div key={process.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex flex-col space-y-1">
                      <button
                        onClick={() => moveProcess(process.id, 'up')}
                        disabled={index === 0}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => moveProcess(process.id, 'down')}
                        disabled={index === sortedProcesses.length - 1}
                        className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <div className="flex items-center">
                      <Cog className="h-8 w-8 text-blue-500 mr-3" />
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                            {process.order}
                          </span>
                          <h3 className="text-lg font-medium text-gray-900">{process.name}</h3>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{process.description}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-md">
                            Vrijeme: {process.estimatedDuration} min
                          </span>
                          
                          {process.price && process.priceType && (
                            <span className={`text-xs px-2 py-1 rounded-md ${
                              process.thicknessPrices && process.thicknessPrices.length > 0 
                                ? 'bg-purple-50 text-purple-700 border border-purple-200' 
                                : 'bg-blue-50 text-blue-700'
                            }`}>
                              {process.thicknessPrices && process.thicknessPrices.length > 0 ? (
                                <span className="flex items-center">
                                  <Layers className="h-3 w-3 mr-1" />
                                  {process.thicknessPrices.length} cijena po debljini
                                </span>
                              ) : (
                                <span>
                                  {process.price.toFixed(2)} €/{process.priceType === 'square_meter' ? 'm²' :
                                    process.priceType === 'linear_meter' ? 'm' :
                                    process.priceType === 'piece' ? 'kom' :
                                    process.priceType === 'hour' ? 'h' : ''
                                  }
                                </span>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEdit(process)}
                      className="text-blue-600 hover:text-blue-900 p-2 rounded"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(process.id)}
                      className="text-red-600 hover:text-red-900 p-2 rounded"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Cog className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nema procesa</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Nema procesa koji odgovaraju pretraživanju.' : 'Počnite dodavanjem novog procesa.'}
            </p>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              {editingProcess ? 'Uredi proces' : 'Dodaj novi proces'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Naziv procesa
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Opis procesa
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Procijenjeno vrijeme (minuta)
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={formData.estimatedDuration}
                  onChange={(e) => setFormData(prev => ({ ...prev, estimatedDuration: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tip cijene
                  </label>
                  <select
                    value={formData.priceType}
                    onChange={(e) => setFormData(prev => ({ ...prev, priceType: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="square_meter">Po kvadratnom metru (m²)</option>
                    <option value="linear_meter">Po dužnom metru (m)</option>
                    <option value="piece">Po komadu (kom)</option>
                    <option value="hour">Po satu (h)</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cijena (€)
                    {formData.useThicknessPricing && (
                      <span className="ml-2 text-xs text-red-600 font-bold">
                        (Neaktivno - koriste se cijene po debljini stakla)
                      </span>
                    )}
                  </label>
                  <input
                    type="number"
                    min="0" 
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }));
                    }}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formData.useThicknessPricing ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    disabled={formData.useThicknessPricing}
                    placeholder="0.00"
                  />
                </div>
              </div>
              
              {/* Toggle switch for pricing type */}
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Način određivanja cijene</h4>
                    <p className="text-xs text-gray-600 mt-1">Odaberite kako želite definirati cijenu za ovaj proces</p>
                  </div>
                  <div className="flex items-center">
                    <span className={`mr-2 text-sm ${!formData.useThicknessPricing ? 'font-medium text-blue-600' : 'text-gray-500'}`}>Standardna cijena</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={formData.useThicknessPricing}
                        onChange={(e) => {
                          const newValue = e.target.checked;
                          if (newValue && formData.price > 0) {
                            if (confirm('Prebacivanjem na cijene po debljini stakla, standardna cijena će biti obrisana. Želite li nastaviti?')) {
                              setFormData(prev => ({ ...prev, useThicknessPricing: newValue, price: 0 }));
                            }
                          } else if (!newValue && formData.thicknessPrices.length > 0) {
                            if (confirm('Prebacivanjem na standardnu cijenu, sve cijene po debljini će biti obrisane. Želite li nastaviti?')) {
                              setFormData(prev => ({ ...prev, useThicknessPricing: newValue, thicknessPrices: [] }));
                            }
                          } else {
                            setFormData(prev => ({ ...prev, useThicknessPricing: newValue }));
                          }
                        }}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                    <span className={`ml-2 text-sm ${formData.useThicknessPricing ? 'font-medium text-purple-600' : 'text-gray-500'}`}>Cijena po debljini stakla</span>
                  </div>
                </div>
              </div>
              
              <div className="p-3 mt-2 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center">
                  <div className="mr-2 bg-blue-100 rounded-full p-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-700"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>
                  </div>
                  <div>
                    <p className="text-sm text-blue-700 font-medium">Informacije o cijeni procesa</p>
                    <p className="text-xs text-blue-600 mt-1">
                      Cijena procesa će biti korištena za automatsko izračunavanje vrijednosti proizvodnje i izradu ponuda.
                      Za staklo možete definirati posebne cijene ovisno o debljini.
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Thickness-based pricing section */}
              <div className={`border-t border-gray-200 pt-6 mt-4 ${!formData.useThicknessPricing ? 'opacity-50' : ''}`}>
                <h3 className="text-base font-medium text-gray-900 mb-3 flex items-center">
                  <Layers className="h-5 w-5 text-purple-500 mr-2" />
                  Cijene ovisno o debljini stakla
                </h3>
                
                <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <p className="text-sm text-purple-700">
                    Definirajte različite cijene procesa za različite debljine stakla. Kad korisnik kreira ponudu, 
                    sustav će automatski odabrati odgovarajuću cijenu na temelju debljine stakla.
                  </p>
                </div>

                {/* Add thickness-price form */}
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Debljina stakla (mm)
                    </label>
                    <input
                      type="number"
                      min="0.1" 
                      step="0.1"
                      value={currentThickness || ''}
                      onChange={(e) => setCurrentThickness(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      disabled={!formData.useThicknessPricing}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cijena (€)
                    </label>
                    <div className="relative flex">
                      <input
                        type="number"
                        min="0" 
                        step="0.01"
                        value={currentThicknessPrice || ''}
                        onChange={(e) => setCurrentThicknessPrice(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        disabled={!formData.useThicknessPricing}
                      />
                      <span className="inline-flex items-center px-3 py-2 bg-gray-100 text-gray-700 border border-l-0 border-gray-300 rounded-r-md">
                        €/{formData.priceType === 'square_meter' ? 'm²' :
                          formData.priceType === 'linear_meter' ? 'm' :
                          formData.priceType === 'piece' ? 'kom' :
                          formData.priceType === 'hour' ? 'h' : ''
                        }
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={handleAddThicknessPrice}
                      className="w-full px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors flex items-center justify-center"
                      disabled={!formData.useThicknessPricing}
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Dodaj cijenu
                    </button>
                  </div>
                </div>

                {thicknessError && (
                  <div className="mb-4 p-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-md">
                    {thicknessError}
                  </div>
                )}

                {/* Display thickness-price combinations */}
                <div className="mt-4">
                  {formData.thicknessPrices.length > 0 ? (
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Definirane cijene po debljini:</h4>
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {formData.thicknessPrices.map((item, index) => (
                          <div 
                            key={index} 
                            className="flex items-center justify-between p-3 bg-white rounded border border-gray-200 hover:bg-gray-50"
                          >
                            <div className="flex items-center">
                              <span className="font-mono text-sm bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                                {item.thickness} mm
                              </span>
                              <span className="mx-2">→</span>
                              <span className="font-medium text-sm">
                                {item.price.toFixed(2)} €/{formData.priceType === 'square_meter' ? 'm²' :
                                  formData.priceType === 'linear_meter' ? 'm' :
                                  formData.priceType === 'piece' ? 'kom' :
                                  formData.priceType === 'hour' ? 'h' : ''
                                }
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveThicknessPrice(item.thickness)}
                              className="text-red-500 hover:text-red-700 p-1.5 rounded hover:bg-red-50"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center p-4 bg-gray-50 border border-gray-200 border-dashed rounded-lg">
                      <p className="text-sm text-gray-500">
                        Nema definiranih cijena po debljini stakla
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Dodajte specifične cijene za različite debljine stakla ili koristite standardnu cijenu iznad
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
                  <p className="text-yellow-700">
                    <strong>Napomena:</strong> Koristite prekidač iznad za odabir načina određivanja cijene. <strong>Nije moguće istovremeno koristiti standardnu
                    cijenu i cijene po debljini</strong> - odaberite samo jedan način pomoću prekidača.
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-6 mt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Odustani
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                >
                  {editingProcess ? 'Spremi promjene' : 'Dodaj proces'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Processes;

