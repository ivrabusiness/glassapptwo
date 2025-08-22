import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Package, History, Download, Printer, BarChart2 } from 'lucide-react';
import { useSupabaseData } from '../../../hooks/useSupabaseData';
import { parseWorkOrderFromNotes } from '../../../utils/workOrderUtils';
import { InventoryItem, StockTransaction, Supplier, WorkOrder } from '../../../types'; 
import TransactionsList from './TransactionsList';
import ItemDetails from './ItemDetails';
import ItemAnalytics from './ItemAnalytics';
import ItemTransactionFilters from './ItemTransactionFilters';

interface ItemCardProps {
  itemId: string;
  onBack?: () => void;
  onNavigate?: () => void;
}

const ItemCard: React.FC<ItemCardProps> = ({ itemId, onBack, onNavigate }) => {
  const [inventory, setInventory, { loading: inventoryLoading }] = useSupabaseData<InventoryItem>('inventory', []);
  const navigate = useNavigate();
  const params = useParams();
  const [transactions, setTransactions, { loading: transactionsLoading }] = useSupabaseData<StockTransaction>('stock_transactions', []);
  const [suppliers, setSuppliers, { loading: suppliersLoading }] = useSupabaseData<Supplier>('suppliers', []);
  const [workOrders, setWorkOrders, { loading: workOrdersLoading }] = useSupabaseData<WorkOrder>('work_orders', []);
  
  const isLoading = inventoryLoading || transactionsLoading || suppliersLoading || workOrdersLoading;
  
  const [activeTab, setActiveTab] = useState<'transactions' | 'analytics'>('transactions');
  const [dateRange, setDateRange] = useState<{
    startDate: Date | null;
    endDate: Date | null;
  }>({
    startDate: null,
    endDate: null
  });
  const [transactionType, setTransactionType] = useState<'all' | 'in' | 'out' | 'adjustment'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [expandedTransactionId, setExpandedTransactionId] = useState<string | null>(null);

  const item = inventory.find(i => i.id === itemId);
  
  // Handle back navigation
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate('/inventory');
    }
  };

  // Filtrirane transakcije
  const filteredTransactions = transactions
    .filter(t => t.inventoryItemId === itemId)
    .filter(t => {
      // Filter po tipu transakcije
      if (transactionType !== 'all' && t.type !== transactionType) {
        return false;
      }
      
      // Filter po datumu
      if (dateRange.startDate && new Date(t.createdAt) < dateRange.startDate) {
        return false;
      }
      if (dateRange.endDate) {
        const endDateWithTime = new Date(dateRange.endDate);
        endDateWithTime.setHours(23, 59, 59, 999);
        if (new Date(t.createdAt) > endDateWithTime) {
          return false;
        }
      }
      
      // Filter po tekstu pretrage
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const supplier = t.supplierId ? suppliers.find(s => s.id === t.supplierId) : null;
        
        return (
          t.documentNumber?.toLowerCase().includes(searchLower) ||
          t.notes?.toLowerCase().includes(searchLower) ||
          supplier?.name.toLowerCase().includes(searchLower) ||
          t.type.toLowerCase().includes(searchLower)
        );
      }
      
      return true;
    })
    .sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

  // Grupiranje transakcija po mjesecima za prikaz
  const groupedTransactions: {
    [key: string]: StockTransaction[];
  } = {};

  filteredTransactions.forEach(transaction => {
    const date = new Date(transaction.createdAt);
    const monthYear = `${date.getMonth() + 1}-${date.getFullYear()}`;
    
    if (!groupedTransactions[monthYear]) {
      groupedTransactions[monthYear] = [];
    }
    
    groupedTransactions[monthYear].push(transaction);
  });

  // Funkcija za formatiranje naziva mjeseca
  const formatMonthYear = (key: string) => {
    const [month, year] = key.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    
    return new Intl.DateTimeFormat('hr-HR', { 
      month: 'long', 
      year: 'numeric' 
    }).format(date);
  };

  // Funkcija za otvaranje radnog naloga
  const handleOpenWorkOrder = (workOrderNumber: string) => {
    const workOrder = workOrders.find(wo => wo.orderNumber === workOrderNumber);
    if (workOrder) {
      // Open work order in a new tab
      window.open(`/work-orders/${workOrder.id}`, '_blank');
    } else {
      alert(`❌ Radni nalog ${workOrderNumber} nije pronađen u bazi podataka.`);
    }
  };

  // Funkcija za rukovanje klikom na nalog
  const handleWorkOrderClick = (workOrderNumber: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    const workOrder = workOrders.find(wo => wo.orderNumber === workOrderNumber);
    if (workOrder) {
      // Open work order in a new tab
      window.open(`/work-orders/${workOrder.id}`, '_blank');
    } else {
      alert(`❌ Radni nalog ${workOrderNumber} nije pronađen u bazi podataka.`);
    }
  };

  const toggleTransactionDetails = (transactionId: string) => {
    if (expandedTransactionId === transactionId) {
      setExpandedTransactionId(null);
    } else {
      setExpandedTransactionId(transactionId);
    }
  };

  // Funkcija za izvoz podataka
  const handleExportData = () => {
    if (!item) return;
    
    const data = {
      item: {
        id: item.id,
        name: item.name,
        code: item.code,
        type: item.type,
        unit: item.unit,
        quantity: item.quantity,
        minQuantity: item.minQuantity,
        price: item.price,
        ...(item.type === 'glass' && { glassThickness: item.glassThickness }),
        createdAt: item.createdAt
      },
      transactions: filteredTransactions.map(t => ({
        id: t.id,
        type: t.type,
        quantity: t.quantity,
        previousQuantity: t.previousQuantity,
        newQuantity: t.newQuantity,
        supplierId: t.supplierId,
        documentNumber: t.documentNumber,
        documentType: t.documentType,
        notes: t.notes,
        createdAt: t.createdAt,
        supplierName: t.supplierId ? suppliers.find(s => s.id === t.supplierId)?.name : null
      }))
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `kartica-artikla-${item.code}-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  // Funkcija za printanje kartice artikla
  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div>
          <div className="mx-auto h-12 w-12 bg-gray-200 rounded-full mb-4"></div>
          <div className="h-5 bg-gray-200 rounded mx-auto w-48 mb-4"></div>
          <div className="h-10 bg-gray-200 rounded-lg mx-auto w-56"></div>
        </div>
      </div>
    );
  }
  
  if (!item) {
    return (
      <div className="text-center py-12">
        <Package className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Artikal nije pronađen</h3>
        <button onClick={handleBack} className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Povratak na skladište
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center space-x-4">
          <button 
            onClick={handleBack}
            className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Kartica artikla</h1>
            <p className="text-gray-600">Detaljan pregled artikla i transakcija</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleExportData}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="h-4 w-4 mr-2" />
            Izvoz podataka
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
          >
            <Printer className="h-4 w-4 mr-2" />
            Ispiši karticu
          </button>
        </div>
      </div>

      {/* Print Header - vidljiv samo kod printanja */}
      <div className="hidden print:block print:mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Kartica artikla</h1>
            <p className="text-gray-600">Datum ispisa: {new Date().toLocaleDateString('hr-HR')}</p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold text-blue-600">TolicApp</h2>
            <p className="text-sm text-gray-600">Sustav za upravljanje proizvodnjom</p>
          </div>
        </div>
      </div>

      {/* Item Details */}
      <ItemDetails item={item} />

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden print:hidden">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('transactions')}
            className={`flex-1 py-3 px-4 text-center font-medium ${
              activeTab === 'transactions'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center justify-center">
              <History className="h-4 w-4 mr-2" />
              Transakcije
            </div>
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex-1 py-3 px-4 text-center font-medium ${
              activeTab === 'analytics'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <div className="flex items-center justify-center">
              <BarChart2 className="h-4 w-4 mr-2" />
              Analitika
            </div>
          </button>
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'transactions' && (
        <>
          {/* Filters */}
          <ItemTransactionFilters 
            dateRange={dateRange}
            setDateRange={setDateRange}
            transactionType={transactionType}
            setTransactionType={setTransactionType}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
          />

          {/* Transactions List */}
          <TransactionsList 
            groupedTransactions={groupedTransactions}
            formatMonthYear={formatMonthYear}
            suppliers={suppliers}
            parseWorkOrderFromNotes={parseWorkOrderFromNotes}
            handleWorkOrderClick={handleWorkOrderClick}
            expandedTransactionId={expandedTransactionId}
            toggleTransactionDetails={toggleTransactionDetails}
          />
        </>
      )}

      {activeTab === 'analytics' && (
        <ItemAnalytics 
          item={item} 
          transactions={transactions.filter(t => t.inventoryItemId === itemId)}
        />
      )}
    </div>
  );
};

export default ItemCard;
