import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Search, Euro, TrendingUp, Package, AlertTriangle } from 'lucide-react';
import { useSupabaseData } from '../../hooks/useSupabaseData';
import { InventoryItem, StockTransaction, Supplier, WorkOrder } from '../../types';
import { generateId, generateItemCode } from '../../utils/idGenerators';
import InventoryTable from './InventoryTable';
import AddItemModal from './AddItemModal';
import StockOperationModal from './StockOperationModal';
import HistoryModal from './HistoryModal';
import ItemCard from './ItemCard';

// Skeleton loader za tablicu inventara
const InventoryTableSkeleton = () => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {['Artikal', 'Kod', 'Tip', 'Količina', 'Min. količina', 'Vrijednost', 'Status', 'Akcije'].map((header) => (
                <th key={header} className="px-6 py-3 text-left">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {[...Array(5)].map((_, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-8 w-8 bg-gray-200 rounded-full mr-3"></div>
                    <div>
                      <div className="h-5 bg-gray-200 rounded w-32 mb-1"></div>
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="h-5 bg-gray-200 rounded w-16"></div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="h-5 bg-gray-200 rounded w-20"></div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="h-5 bg-gray-200 rounded w-20"></div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="h-5 bg-gray-200 rounded w-24"></div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="h-6 bg-gray-200 rounded-full w-24"></div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="flex items-center justify-end">
                    <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
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

// Skeleton loader za statistiku
const StatisticsSkeleton = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="lg:col-span-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg shadow-sm p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-5 bg-white bg-opacity-20 rounded w-40 mb-2"></div>
            <div className="h-8 bg-white bg-opacity-20 rounded w-32 mb-1"></div>
            <div className="h-4 bg-white bg-opacity-20 rounded w-24"></div>
          </div>
          <div className="p-3 bg-white bg-opacity-20 rounded-lg">
            <div className="h-8 w-8 bg-white bg-opacity-30 rounded"></div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
            <div className="h-6 bg-gray-200 rounded w-16 mb-1"></div>
            <div className="h-3 bg-gray-200 rounded w-24"></div>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="h-6 w-6 bg-blue-100 rounded"></div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
            <div className="h-6 bg-gray-200 rounded w-16 mb-1"></div>
            <div className="h-3 bg-gray-200 rounded w-24"></div>
          </div>
          <div className="p-3 bg-amber-50 rounded-lg">
            <div className="h-6 w-6 bg-amber-100 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Inventory: React.FC = () => {
  const [inventory, setInventory] = useSupabaseData<InventoryItem>('inventory', []);
  const { id } = useParams();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useSupabaseData<StockTransaction>('stock_transactions', []);
  const [suppliers] = useSupabaseData<Supplier>('suppliers', []);
  const [workOrders] = useSupabaseData<WorkOrder>('work_orders', []); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewItemId, setViewItemId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'glass' as 'glass' | 'other',
    glassThickness: 4,
    unit: 'm²',
    minQuantity: 0,
    notes: ''
  });
  
  const [stockFormData, setStockFormData] = useState({
    type: 'in' as 'in' | 'out' | 'adjustment',
    quantity: 0,
    price: 0,
    supplierId: '',
    documentNumber: '',
    documentType: 'invoice' as 'invoice' | 'delivery-note' | 'other',
    notes: '',
    attachment: null as File | null
  });

  // Simuliraj učitavanje
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Check if we have an ID in the URL
  useEffect(() => {
    if (id) {
      setViewItemId(id);
    }
  }, [id]);

  const filteredInventory = inventory.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Izračun ukupne vrijednosti skladišta - zbroj svih ulaznih vrijednosti
  const calculateInventoryValue = () => {
    // Izračunaj ukupnu vrijednost na temelju količine i cijene
    return inventory.reduce((total, item) => {
      return total + (item.quantity * item.price);
    }, 0);
  };

  // Statistike skladišta
  const getInventoryStats = () => {
    const totalValue = calculateInventoryValue();
    const totalItems = inventory.length;
    const lowStockItems = inventory.filter(item => item.quantity <= item.minQuantity).length;
    const outOfStockItems = inventory.filter(item => item.quantity === 0).length;
    const glassItems = inventory.filter(item => item.type === 'glass').length;
    const otherItems = inventory.filter(item => item.type === 'other').length;

    return {
      totalValue,
      totalItems,
      lowStockItems,
      outOfStockItems,
      glassItems,
      otherItems
    };
  };

  const stats = getInventoryStats();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return; // Sprečava duplo slanje
    setIsSubmitting(true);
    
    try {
      if (editingItem) {
        // Edit existing item (don't change code, type, or price)
        await setInventory(prev => prev.map(item =>
          item.id === editingItem.id
            ? { 
                ...item, 
                name: formData.name,
                code: formData.code,
                unit: formData.unit,
                minQuantity: formData.minQuantity,
                notes: formData.notes,
                ...(item.type === 'glass' && { glassThickness: formData.glassThickness })
              }
            : item
        ));
      } else {
        // Create new item - use provided code or auto-generate
        const itemCode = formData.code.trim() || generateItemCode(inventory);
        
        const newItem: InventoryItem = {
          id: generateId(),
          name: formData.name,
          code: itemCode,
          type: formData.type,
          unit: formData.unit,
          quantity: 0, // Početna količina je 0
          minQuantity: formData.minQuantity,
          price: 0, // Početna cijena je 0
          ...(formData.type === 'glass' && { glassThickness: formData.glassThickness }),
          createdAt: new Date().toISOString(),
          notes: formData.notes
        };
        
        // KLJUČNO: Spremi inventory item
        await setInventory(prev => [...prev, newItem]);
      }
      
      resetForm();
    } catch (error) {
      console.error('Greška pri spremanju:', error);
      alert('Greška pri spremanju artikla. Molimo pokušajte ponovo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStockOperation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedItem || isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      let newQuantity = selectedItem.quantity;
      let newPrice = selectedItem.price;
      let attachmentUrl = undefined;
      let attachmentName = undefined;
      let attachmentType = undefined;
      
      // NOVO: Obradi attachment ako postoji
      if (stockFormData.attachment) {
        // U pravoj implementaciji ovdje bi uploadali file na server/storage
        // Za sada samo simuliramo URL
        attachmentUrl = URL.createObjectURL(stockFormData.attachment);
        attachmentName = stockFormData.attachment.name;
        attachmentType = stockFormData.attachment.type;
        

      }
      
      switch (stockFormData.type) {
        case 'in':
          // KLJUČNO: Izračun nove prosječne cijene i ukupne vrijednosti
          if (stockFormData.price >= 0) {
            // Izračunaj vrijednost trenutne zalihe
            const currentValue = selectedItem.quantity * selectedItem.price;
            
            // Izračunaj vrijednost nove zalihe
            const newValue = stockFormData.quantity * stockFormData.price;
            
            // Ukupna količina nakon dodavanja
            const totalQuantity = selectedItem.quantity + stockFormData.quantity;
            
            // Izračunaj novu prosječnu cijenu kao težinski prosjek
            if (totalQuantity > 0) {
              newPrice = (currentValue + newValue) / totalQuantity;
            }
          }
          
          newQuantity += stockFormData.quantity;
          break;
        case 'out':
          newQuantity -= stockFormData.quantity;
          if (newQuantity < 0) {
            alert('Količina ne može biti negativna!');
            setIsSubmitting(false);
            return;
          }
          // KLJUČNO: Kod izlaza, količina se oduzima
          break;
        case 'adjustment':
          // KLJUČNO: Kod korekcije, postavlja se nova količina
          newQuantity = stockFormData.quantity;
          break;
      }
      
      // Update inventory item
      await setInventory(prev => prev.map(item =>
        item.id === selectedItem.id
          ? { 
              ...item, 
              quantity: newQuantity,
              // KLJUČNO: Ažuriraj cijenu samo za 'in' operacije s cijenom
              ...(stockFormData.type === 'in' && stockFormData.price >= 0 ? { price: newPrice } : {})
            }
          : item
      ));
      
      // KLJUČNO: Dodaj kratku pauzu da se osigura da je ažuriranje završeno
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Tek onda kreiraj transaction
      const transaction: StockTransaction = {
        id: generateId(),
        inventoryItemId: selectedItem.id,
        type: stockFormData.type,
        quantity: stockFormData.type === 'adjustment' ? stockFormData.quantity : Math.abs(stockFormData.quantity),
        previousQuantity: selectedItem.quantity,
        oldQuantity: selectedItem.quantity,
        newQuantity: newQuantity,
        supplierId: stockFormData.supplierId || undefined,
        documentNumber: stockFormData.documentNumber || undefined,
        documentType: stockFormData.documentType,
        attachmentUrl,
        attachmentName,
        attachmentType,
        notes: stockFormData.notes || undefined,
        createdAt: new Date().toISOString()
      };
      
      await setTransactions(prev => [...prev, transaction]);
      resetStockForm();
    } catch (error) {
      console.error('Greška pri stock operaciji:', error);
      alert('Greška pri ažuriranju stanja. Molimo pokušajte ponovo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      type: 'glass',
      glassThickness: 4,
      unit: 'm²',
      minQuantity: 0,
      notes: ''
    });
    setEditingItem(null);
    setIsModalOpen(false);
  };

  const resetStockForm = () => {
    setStockFormData({
      type: 'in',
      quantity: 0,
      price: 0,
      supplierId: '',
      documentNumber: '',
      documentType: 'invoice',
      notes: '',
      attachment: null
    });
    setSelectedItem(null);
    setIsStockModalOpen(false);
  };

  const handleEdit = (item: InventoryItem) => {
    setFormData({
      name: item.name,
      code: item.code,
      type: item.type,
      glassThickness: item.glassThickness || 4,
      unit: item.unit,
      minQuantity: item.minQuantity,
      notes: item.notes || ''
    });
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Jeste li sigurni da želite obrisati ovaj artikal?')) {
      setInventory(prev => prev.filter(item => item.id !== id));
      setTransactions(prev => prev.filter(transaction => transaction.inventoryItemId !== id));
    }
  };

  const openStockModal = (item: InventoryItem, type: 'in' | 'out' | 'adjustment') => {
    setSelectedItem(item);
    setStockFormData(prev => ({ 
      ...prev, 
      type,
      // Set initial price to current item price for 'in' operations
      price: type === 'in' ? item.price : 0
    }));
    setIsStockModalOpen(true);
  };

  const viewHistory = (item: InventoryItem) => {
    setSelectedItem(item);
    setIsHistoryModalOpen(true);
  };

  // Funkcija za otvaranje detaljnog pregleda artikla
  const handleViewItem = (item: InventoryItem) => {
    // Navigate to the item detail URL
    navigate(`/inventory/${item.id}`);
  };

  // ISPRAVLJENA funkcija za otvaranje radnog naloga - BEZ HASH NAVIGACIJE!
  const handleOpenWorkOrder = (workOrderNumber: string) => {
    // Pronađi nalog po broju
    const workOrder = workOrders.find(order => order.orderNumber === workOrderNumber);
    
    if (workOrder) {
      // Zatvori history modal
      if (isHistoryModalOpen) setIsHistoryModalOpen(false);
      if (selectedItem) setSelectedItem(null);
      // Dispatchaj custom event za navigaciju
      window.dispatchEvent(new CustomEvent('navigateToWorkOrders', { 
        detail: { orderId: workOrder.id } 
      }));
      
      // KLJUČNO: Kratka potvrda bez hash-a

    } else {
      alert(`❌ Radni nalog ${workOrderNumber} nije pronađen u bazi podataka.`);
    }
  };

  const itemTransactions = selectedItem 
    ? transactions
        .filter(t => t.inventoryItemId === selectedItem.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    : [];

  // Ako je odabran artikal za pregled, prikaži komponentu za detaljan pregled
  if (viewItemId) {
    return (
      <ItemCard
        key={viewItemId}
        itemId={viewItemId} 
        onNavigate={() => navigate('/inventory')}
        onBack={() => setViewItemId(null)} 
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Skladište</h1>
          <p className="text-gray-600">Upravljanje zalihama i artiklima</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          disabled={isSubmitting}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="h-4 w-4 mr-2" />
          {isSubmitting ? 'Spremam...' : 'Dodaj artikal'}
        </button>
      </div>

      {/* Statistike skladišta s vrijednošću */}
      {isLoading ? (
        <StatisticsSkeleton />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Ukupna vrijednost - GLAVNA KARTICA */}
          <div className="lg:col-span-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg shadow-sm p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium mb-1">Ukupna vrijednost skladišta</p>
                <p className="text-3xl font-bold">{stats.totalValue.toLocaleString('hr-HR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</p>
                <p className="text-green-100 text-sm mt-1">
                  {stats.totalItems} artikala
                </p>
              </div>
              <div className="p-3 bg-white bg-opacity-20 rounded-lg">
                <Euro className="h-8 w-8" />
              </div>
            </div>
          </div>

          {/* Ukupno artikala */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Ukupno artikala</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalItems}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.glassItems} staklo • {stats.otherItems} ostalo
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Niska zaliha */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Upozorenja</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.lowStockItems}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.outOfStockItems > 0 ? `${stats.outOfStockItems} bez zalihe` : 'Niska zaliha'}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${stats.lowStockItems > 0 ? 'bg-amber-50' : 'bg-green-50'}`}>
                {stats.lowStockItems > 0 ? (
                  <AlertTriangle className="h-6 w-6 text-amber-600" />
                ) : (
                  <TrendingUp className="h-6 w-6 text-green-600" />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Pretraži artikle..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Inventory Table */}
      {isLoading ? (
        <InventoryTableSkeleton />
      ) : (
        <InventoryTable
          items={filteredInventory}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onStockOperation={openStockModal}
          onViewHistory={viewHistory}
          onViewItem={handleViewItem}
        />
      )}

      {/* Add/Edit Item Modal */}
      <AddItemModal
        isOpen={isModalOpen}
        onClose={resetForm}
        onSubmit={handleSubmit}
        formData={formData}
        setFormData={setFormData}
        editingItem={editingItem}
        inventory={inventory}
        isSubmitting={isSubmitting}
      />

      {/* Stock Operation Modal */}
      <StockOperationModal
        isOpen={isStockModalOpen}
        onClose={resetStockForm}
        onSubmit={handleStockOperation}
        selectedItem={selectedItem}
        formData={stockFormData}
        setFormData={setStockFormData}
        suppliers={suppliers}
        isSubmitting={isSubmitting}
      />

      {/* History Modal - KLJUČNO: Dodaj onOpenWorkOrder prop */}
      <HistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        selectedItem={selectedItem}
        transactions={itemTransactions}
        suppliers={suppliers}
        onOpenWorkOrder={handleOpenWorkOrder}
      />
    </div>
  );
};

export default Inventory;
