import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Package, Euro, Layers, Settings, CheckSquare, Info, Truck } from 'lucide-react';
import { useSupabaseData } from '../hooks/useSupabaseData';
import { Product, ProductMaterial, InventoryItem, Process } from '../types';
import { generateId } from '../utils/idGenerators';

const ProductSkeleton = () => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {['Proizvod', 'Kod', 'Opis', 'Materijali', 'Datum', 'Akcije'].map((header) => (
                <th key={header} className="px-4 py-2 text-left">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {[...Array(5)].map((_, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="h-5 bg-gray-200 rounded w-3/4 mb-1"></div>
                </td>
                <td className="px-4 py-3">
                  <div className="h-5 bg-gray-200 rounded w-16"></div>
                </td>
                <td className="px-4 py-3">
                  <div className="h-5 bg-gray-200 rounded w-full mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </td>
                <td className="px-4 py-3">
                  <div className="h-5 bg-gray-200 rounded w-1/2"></div>
                </td>
                <td className="px-4 py-3">
                  <div className="h-5 bg-gray-200 rounded w-24"></div>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end space-x-1">
                    <div className="h-6 w-6 bg-gray-200 rounded-full"></div>
                    <div className="h-6 w-6 bg-gray-200 rounded-full"></div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const Products: React.FC = () => {
  const [products, setProducts] = useSupabaseData<Product>('products', []);
  const [inventory] = useSupabaseData<InventoryItem>('inventory', []);
  const [processes] = useSupabaseData<Process>('processes', []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    price: 0,
    materials: [] as ProductMaterial[]
  });

  // Simuliraj učitavanje
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, []);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    
    if (editingProduct) {
      setProducts(prev => prev.map(product =>
        product.id === editingProduct.id
          ? { ...product, ...formData }
          : product
      ));
    } else {
      const newProduct: Product = {
        id: generateId(),
        ...formData,
        createdAt: new Date().toISOString()
      };
      setProducts(prev => [...prev, newProduct]);
    }
    
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      price: 0,
      materials: []
    });
    setEditingProduct(null);
    setIsModalOpen(false);
  };

  const handleEdit = (product: Product) => {
    setFormData({
      name: product.name,
      code: product.code,
      description: product.description,
      price: product.price || 0,
      materials: product.materials
    });
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Jeste li sigurni da želite obrisati ovaj proizvod?')) {
      setProducts(prev => prev.filter(product => product.id !== id));
    }
  };

  const addMaterial = () => {
    setFormData(prev => ({
      ...prev,
      materials: [...prev.materials, { 
        id: generateId(),
        inventoryItemId: '', 
        quantity: 1, 
        unit: 'm²',
        hasProcesses: true,
        showOnDeliveryNote: true
      }]
    }));
  };

  const removeMaterial = (index: number) => {
    setFormData(prev => ({
      ...prev,
      materials: prev.materials.filter((_, i) => i !== index)
    }));
  };

  const updateMaterial = (index: number, field: keyof ProductMaterial, value: any) => {
    setFormData(prev => ({
      ...prev,
      materials: prev.materials.map((material, i) =>
        i === index ? { ...material, [field]: value } : material
      )
    }));
  };

  const getMaterialsText = (product: Product) => {
    if (product.materials.length === 0) return 'Nema materijala';
    if (product.materials.length === 1) {
      const material = product.materials[0];
      const item = inventory.find(i => i.id === material.inventoryItemId);
      return item?.name || 'Nepoznat materijal';
    }
    return `${product.materials.length} materijala`;
  };

  const getMaterialsTooltip = (product: Product) => {
    return product.materials.map(material => {
      const item = inventory.find(i => i.id === material.inventoryItemId);
      return `• ${item?.name || 'Nepoznat materijal'}${item?.type === 'glass' && item.glassThickness ? ` (${item.glassThickness}mm)` : ''}`;
    }).join('\n');
  };

  const handleProcessesToggle = (index: number, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      materials: prev.materials.map((material, i) => {
        if (i !== index) return material;
        const updated = { ...material, hasProcesses: checked };
        // Ako se isključi, očisti odabrane procese
        if (!checked) {
          return { ...updated, processSteps: [] };
        }
        return updated;
      })
    }));
  };

  const isProcessSelected = (materialIndex: number, processId: string) => {
    const mat = formData.materials[materialIndex];
    return !!mat.processSteps?.some(step => step.processId === processId);
  };

  const toggleMaterialProcess = (materialIndex: number, processId: string) => {
    setFormData(prev => ({
      ...prev,
      materials: prev.materials.map((mat, i) => {
        // SAMO mijenjaj materijal na specificiranom indexu
        if (i !== materialIndex) return mat;
        
        const selected = mat.processSteps?.some(s => s.processId === processId);
        
        if (selected) {
          return {
            ...mat,
            processSteps: (mat.processSteps || []).filter(s => s.processId !== processId)
          };
        } else {
          const newStep = { 
            id: generateId(), 
            processId, 
            status: 'pending' as const,
            isDefault: false // Početno nije default, korisnik može označiti
          };
          return {
            ...mat,
            processSteps: [...(mat.processSteps || []), newStep]
          };
        }
      })
    }));
  };

  const toggleProcessDefault = (materialIndex: number, processId: string) => {
    setFormData(prev => ({
      ...prev,
      materials: prev.materials.map((mat, i) => {
        // SAMO mijenjaj materijal na specificiranom indexu
        if (i !== materialIndex) return mat;
        return {
          ...mat,
          processSteps: (mat.processSteps || []).map(step => 
            step.processId === processId 
              ? { ...step, isDefault: !step.isDefault }
              : step
          )
        };
      })
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Proizvodi</h1>
          <p className="text-gray-600">Upravljanje proizvodima i recepturama</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Dodaj proizvod
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Pretraži proizvode..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Products Table - Skeleton ili stvarni podaci */}
      {isLoading ? (
        <ProductSkeleton />
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Proizvod
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kod
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cijena
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Opis
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Materijali
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Datum
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Akcije
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded text-center inline-block">
                        {product.code}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center text-sm text-gray-900">
                        <Euro className="h-3 w-3 text-green-600 mr-1" />
                        <span className="font-medium">{product.price ? product.price.toFixed(2) : '0.00'}</span>
                        <span className="ml-1 text-gray-500 text-xs">€/{product.materials.length > 0 ? product.materials[0].unit : 'kom'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900 max-w-xs">
                        {product.description ? (
                          <span className="line-clamp-2">{product.description}</span>
                        ) : (
                          <span className="text-gray-400 italic">Nema opisa</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-900">
                        {product.materials.length > 0 ? (
                          <span
                            title={getMaterialsTooltip(product)}
                            className="cursor-help inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs"
                          >
                            <Layers className="h-3 w-3 mr-1" />
                            {getMaterialsText(product)}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic text-xs">Nema materijala</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(product.createdAt).toLocaleDateString('hr-HR')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => handleEdit(product)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded transition-colors"
                          title="Uredi proizvod"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="text-red-600 hover:text-red-900 p-1 rounded transition-colors"
                          title="Obriši proizvod"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredProducts.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nema proizvoda</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm ? 'Nema proizvoda koji odgovaraju pretraživanju.' : 'Počnite dodavanjem novog proizvoda.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <Package className="h-5 w-5 text-blue-600 mr-2" />
                {editingProduct ? 'Uredi proizvod' : 'Dodaj novi proizvod'}
              </h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              {/* Osnovni podaci - Card style */}
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Info className="h-5 w-5 text-blue-600 mr-2" />
                  Osnovni podaci
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Naziv proizvoda
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="npr. Staklo 4mm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kod proizvoda
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.code}
                      onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="npr. P001"
                    />
                  </div>
                </div>
                
                <div className="mt-5">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cijena
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Euro className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                      className="w-full pl-10 pr-16 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <span className="text-gray-500">€/{formData.materials.length > 0 ? formData.materials[0].unit : 'kom'}</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Cijena po jedinici mjere ({formData.materials.length > 0 ? formData.materials[0].unit : 'm², kom, l, itd.'})
                  </p>
                </div>
                
                <div className="mt-5">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Opis
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Detaljan opis proizvoda..."
                  />
                </div>
              </div>
              
              {/* Materijali - Card style */}
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Layers className="h-5 w-5 text-blue-600 mr-2" />
                    Materijali
                  </h3>
                  
                  <button
                    type="button"
                    onClick={addMaterial}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Dodaj materijal
                  </button>
                </div>
                
                <div className="space-y-3">
                  {formData.materials.map((material, index) => {
                    const inventoryItem = inventory.find(item => item.id === material.inventoryItemId);
                    return (
                      <div key={material.id} className="border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                        <div className="bg-gray-50 p-4">
                          <div className="flex items-center space-x-3">
                            <div className="flex-1">
                              <select
                                value={material.inventoryItemId}
                                onChange={(e) => updateMaterial(index, 'inventoryItemId', e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              >
                                <option value="">Odaberite materijal</option>
                                {inventory.map(item => (
                                  <option key={item.id} value={item.id}>
                                    {item.name} ({item.code})
                                    {item.type === 'glass' && item.glassThickness && ` - ${item.glassThickness}mm`}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeMaterial(index)}
                              className="text-red-600 hover:text-red-900 p-2 rounded-md hover:bg-red-50 transition-colors"
                              title="Ukloni materijal"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        
                          {/* Material consumption */}
                          {material.inventoryItemId && (
                            <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Utrošak po {formData.materials.length > 0 ? formData.materials[0].unit : 'm²'}
                                  </label>
                                  <div className="flex">
                                    <input
                                      type="number"
                                      min="0.001"
                                      step="0.001"
                                      value={material.quantity}
                                      onChange={(e) => updateMaterial(index, 'quantity', parseFloat(e.target.value) || 0)}
                                      className="w-full px-3 py-2 border border-gray-300 rounded-l-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                      placeholder="Količina"
                                    />
                                    <div className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md text-gray-600 font-medium">
                                      {inventoryItem?.unit || 'jedinica'}/{formData.materials.length > 0 ? formData.materials[0].unit : 'm²'}
                                    </div>
                                  </div>
                                 
                                  <p className="text-xs text-gray-500 mt-1">
                                    Koliko se troši {inventoryItem?.unit || 'jedinica'} po {formData.materials.length > 0 ? formData.materials[0].unit : 'm²'} proizvoda
                                  </p>
                                </div>
                                
                                <div className="space-y-3">
                                  {/* Process toggle checkbox */}
                                  <div className="flex items-start">
                                    <input
                                      type="checkbox"
                                      id={`process-toggle-${material.id}`}
                                      checked={material.hasProcesses !== false}
                                      onChange={(e) => handleProcessesToggle(index, e.target.checked)}
                                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-0.5"
                                    />
                                    <label htmlFor={`process-toggle-${material.id}`} className="ml-2 text-sm text-gray-700">
                                      <Settings className="h-4 w-4 text-blue-600 mr-1" />
                                      Materijal ima procese proizvodnje
                                    </label>
                                  </div>

                                  {/* Odabir procesa za materijal */}
                                  {(material.hasProcesses !== false) && (
                                    <div className="mt-3">
                                      <label className="block text-xs font-medium text-gray-600 mb-1">
                                        Odaberite procese
                                      </label>
                                      {processes.length === 0 ? (
                                        <div className="text-xs text-gray-500">
                                          Nema definiranih procesa. Dodajte ih u postavkama.
                                        </div>
                                      ) : (
                                        <div className="space-y-3">
                                          {processes
                                            .slice()
                                            .sort((a, b) => a.order - b.order)
                                            .map(proc => {
                                              const selected = isProcessSelected(index, proc.id);
                                              const processStep = material.processSteps?.find(s => s.processId === proc.id);
                                              const isDefault = processStep?.isDefault || false;
                                              
                                              return (
                                                <div key={proc.id} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                                  <div className="flex items-center justify-between">
                                                    <label className="flex items-center text-sm">
                                                      <input
                                                        type="checkbox"
                                                        checked={selected}
                                                        onChange={() => toggleMaterialProcess(index, proc.id)}
                                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                                      />
                                                      <span className="ml-2 text-gray-700 font-medium">{proc.name}</span>
                                                    </label>
                                                    
                                                    {selected && (
                                                      <label className="flex items-center text-xs text-orange-600">
                                                        <input
                                                          type="checkbox"
                                                          checked={isDefault}
                                                          onChange={() => toggleProcessDefault(index, proc.id)}
                                                          className="h-3 w-3 text-orange-600 focus:ring-orange-500 border-gray-300 rounded mr-1"
                                                        />
                                                        <CheckSquare className="h-3 w-3 mr-1" />
                                                        Default
                                                      </label>
                                                    )}
                                                  </div>
                                                  
                                                  {selected && isDefault && (
                                                    <div className="mt-2 text-xs text-orange-600 bg-orange-50 p-2 rounded border border-orange-200">
                                                      <div className="flex items-center">
                                                        <Info className="h-3 w-3 mr-1" />
                                                        Ovaj proces će se automatski dodati u ponude i radne naloge
                                                      </div>
                                                    </div>
                                                  )}
                                                </div>
                                              );
                                            })}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  
                                  {/* Show on delivery note toggle checkbox */}
                                  <div className="flex items-start">
                                    <input
                                      type="checkbox"
                                      id={`delivery-toggle-${material.id}`}
                                      checked={material.showOnDeliveryNote !== false}
                                      onChange={(e) => updateMaterial(index, 'showOnDeliveryNote', e.target.checked)}
                                     className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-0.5"
                                    />
                                   <label htmlFor={`delivery-toggle-${material.id}`} className="ml-2 text-sm text-gray-700">
                                      <Truck className="h-4 w-4 text-blue-600 mr-1" />
                                      Prikaži na otpremnici
                                    </label>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  
                  {formData.materials.length === 0 && (
                    <div className="text-center py-10 bg-gray-50 border border-gray-200 border-dashed rounded-lg">
                      <Package className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                     <p className="text-gray-600 font-medium mb-2">Nema dodanih materijala</p>
                     <p className="text-sm text-gray-500 max-w-md mx-auto mb-4">
                       Dodajte materijale koji se koriste za ovaj proizvod.
                      </p>
                    </div>
                  )}
                </div>
                
                {formData.materials.length > 0 && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="text-sm text-blue-700 space-y-3">
                      <div>
                        <p className="font-medium mb-1 flex items-center">
                          <Info className="h-4 w-4 mr-1" />
                          Kako funkcionira utrošak materijala:
                        </p>
                        <ol className="list-decimal list-inside space-y-1 text-xs ml-2">
                          <li>Unesite koliko se troši materijala po jedinici proizvoda (m², kom, l)</li>
                          <li>Kod kreiranja naloga, sustav će automatski izračunati ukupnu potrošnju</li>
                          <li>Formula: <span className="font-mono bg-blue-100 px-1 rounded">utrošak × količina × površina</span></li>
                          <li>Primjer: 4 m letvica po m² × 2 kom × 1.5 m² = 12 m letvica</li>
                        </ol>
                      </div>
                      
                      <div>
                        <p className="font-medium mb-1 flex items-center">
                          <Settings className="h-4 w-4 mr-1" />
                          Procesi i otpremnica:
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-xs ml-2">
                          <li><strong>Materijal ima procese</strong> - označite za materijale koji prolaze kroz proizvodne procese</li>
                          <li><strong>Prikaži na otpremnici</strong> - označite za materijale koji su dio konačnog proizvoda</li>
                          <li>Potrošni materijali (silikon, ljepilo, itd.) se skidaju sa skladišta ali ne prikazuju na otpremnici</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 mt-6">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Odustani
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingProduct ? 'Spremi promjene' : 'Dodaj proizvod'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
