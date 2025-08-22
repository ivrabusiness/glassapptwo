import React, { useEffect, useMemo, useState } from 'react';
import Header from './Header';
import Filters from './Filters';
import Skeleton from './Skeleton';
import OrdersTable from './OrdersTable';
import ArchiveModal from './ArchiveModal';
import type { ArchiveAnalysis, WorkOrdersListProps, WorkOrder, InventoryItem, StockTransaction, DeliveryNote, Quote } from './types';
import { useSupabaseData } from '../../../hooks/useSupabaseData';
import { generateId } from '../../../utils/idGenerators';
import { supabase, getCurrentUserId } from '../../../lib/supabase';
import { Lock } from 'lucide-react';

const WorkOrdersListRefactored: React.FC<WorkOrdersListProps> = ({ onCreateNew, onEditOrder, onViewOrder }) => {
  const [workOrders, setWorkOrders] = useSupabaseData<WorkOrder>('work_orders', []);
  const [inventory, setInventory] = useSupabaseData<InventoryItem>('inventory', []);
  const [transactions, setTransactions] = useSupabaseData<StockTransaction>('stock_transactions', []);
  const [clients] = useSupabaseData<any>('clients', []);
  const [deliveryNotes, setDeliveryNotes] = useSupabaseData<DeliveryNote>('delivery_notes', []);
  const [, setQuotes] = useSupabaseData<Quote>('quotes', []);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [orderToArchive, setOrderToArchive] = useState<WorkOrder | null>(null);
  const [archiveAnalysis, setArchiveAnalysis] = useState<ArchiveAnalysis | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const filteredOrders = useMemo(() => {
    return workOrders.filter(order => {
      const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [workOrders, searchTerm, statusFilter]);

  const analyzeOrderArchiving = (order: WorkOrder): ArchiveAnalysis => {
    const materialsToRestore: ArchiveAnalysis['materialsToRestore'] = [];

    if (order.status !== 'draft') {
      const orderTransactions = transactions.filter(t => t.type === 'out' && t.notes && t.notes.includes(order.orderNumber));

      const materialGroups: { [key: string]: number } = {};
      orderTransactions.forEach(transaction => {
        if (!materialGroups[transaction.inventoryItemId]) materialGroups[transaction.inventoryItemId] = 0;
        materialGroups[transaction.inventoryItemId] += transaction.quantity;
      });

      Object.entries(materialGroups).forEach(([inventoryItemId, quantity]) => {
        const inventoryItem = inventory.find(item => item.id === inventoryItemId);
        if (inventoryItem) {
          materialsToRestore.push({
            inventoryItemId,
            name: inventoryItem.name,
            quantity,
            unit: inventoryItem.unit,
            currentStock: inventoryItem.quantity,
            newStock: inventoryItem.quantity + quantity
          });
        }
      });
    }

    const deliveryNote = deliveryNotes.find(note => note.workOrderId === order.id);

    return {
      materialsToRestore,
      transactionsToCreate: materialsToRestore.length,
      hasDeliveryNote: !!deliveryNote,
      deliveryNoteNumber: deliveryNote?.deliveryNumber
    };
  };

  const handleRequestArchive = (order: WorkOrder) => {
    const analysis = analyzeOrderArchiving(order);
    setOrderToArchive(order);
    setArchiveAnalysis(analysis);
    setShowArchiveModal(true);
  };

  const confirmArchiveOrder = async () => {
    if (!orderToArchive || !archiveAnalysis) return;

    try {
      if (orderToArchive.status !== 'draft' && archiveAnalysis.materialsToRestore.length > 0) {
        const updatedInventory = inventory.map(item => {
          const materialToRestore = archiveAnalysis.materialsToRestore.find(m => m.inventoryItemId === item.id);
          if (materialToRestore) {
            return { ...item, quantity: item.quantity + materialToRestore.quantity };
          }
          return item;
        });

        const restorationTransactions: StockTransaction[] = archiveAnalysis.materialsToRestore.map(material => ({
          id: generateId(),
          inventoryItemId: material.inventoryItemId,
          type: 'return',
          quantity: material.quantity,
          previousQuantity: material.currentStock,
          oldQuantity: material.currentStock,
          newQuantity: material.newStock,
          notes: `📦 VRAĆANJE MATERIJALA - Arhiviranje radnog naloga ${orderToArchive.orderNumber}\n\nMaterijal: ${material.name}\nVraćeno: ${material.quantity.toFixed(4)} ${material.unit}\nRazlog: Radni nalog je arhiviran\n\n📝 Napomena: Ova transakcija je automatski kreirana zbog arhiviranja radnog naloga.`,
          createdAt: new Date().toISOString()
        }));

        setInventory(updatedInventory);

        if (restorationTransactions.length > 0) {
          const userId = await getCurrentUserId();
          const supabaseTransactions = restorationTransactions.map(transaction => ({
            id: transaction.id,
            inventory_item_id: transaction.inventoryItemId,
            type: transaction.type,
            quantity: transaction.quantity,
            previous_quantity: transaction.previousQuantity,
            new_quantity: transaction.newQuantity,
            notes: transaction.notes,
            created_at: transaction.createdAt,
            tenant_id: userId
          }));

          const { error: transactionError } = await supabase.from('stock_transactions').insert(supabaseTransactions);
          if (transactionError) {
            console.error('❌ Greška pri spremanju transakcija u Supabase:', transactionError);
          }
        }

        setTransactions(prev => [...prev, ...restorationTransactions]);
      }

      const userId = await getCurrentUserId();

      if (archiveAnalysis.hasDeliveryNote) {
        const { error: deliveryError } = await supabase
          .from('delivery_notes')
          .update({ status: 'archived' })
          .eq('work_order_id', orderToArchive.id)
          .eq('tenant_id', userId);

        if (deliveryError) {
          console.error('❌ Greška pri arhiviranju otpremnice:', deliveryError);
          throw new Error(`Greška pri arhiviranju otpremnice: ${deliveryError.message}`);
        }

        setDeliveryNotes(prev => prev.map(note => note.workOrderId === orderToArchive.id ? { ...note, status: 'archived' } : note));
      }

      if (orderToArchive.quoteId) {
        const { error: quoteError } = await supabase
          .from('quotes')
          .update({ status: 'archived' })
          .eq('id', orderToArchive.quoteId)
          .eq('tenant_id', userId);

        if (quoteError) {
          console.error('❌ Greška pri arhiviranju ponude:', quoteError);
        } else {
          setQuotes(prev => prev.map(q => q.id === orderToArchive.quoteId ? { ...q, status: 'archived' } : q));
        }
      }

      const { error: orderError } = await supabase
        .from('work_orders')
        .update({ status: 'archived' })
        .eq('id', orderToArchive.id)
        .eq('tenant_id', userId);

      if (orderError) {
        console.error('❌ Greška pri arhiviranju radnog naloga:', orderError);
        throw new Error(`Greška pri arhiviranju radnog naloga: ${orderError.message}`);
      }

      setWorkOrders(prev => prev.map(order => order.id === orderToArchive.id ? { ...order, status: 'archived' } : order));

      const successMessage = orderToArchive.status === 'draft' 
        ? `✅ Nacrt radnog naloga ${orderToArchive.orderNumber} je uspješno arhiviran.`
        : `✅ Radni nalog ${orderToArchive.orderNumber} je uspješno arhiviran!\n\n📦 Vraćeno na skladište:\n${archiveAnalysis.materialsToRestore.map(m => `• ${m.name}: +${m.quantity.toFixed(4)} ${m.unit}`).join('\n')}\n\n📋 Kreirano ${archiveAnalysis.transactionsToCreate} transakcija vraćanja.${archiveAnalysis.hasDeliveryNote ? `\n🚚 Arhivirana otpremnica: ${archiveAnalysis.deliveryNoteNumber}` : ''}`;

      alert(successMessage);

      setShowArchiveModal(false);
      setOrderToArchive(null);
      setArchiveAnalysis(null);
    } catch (error) {
      console.error('Greška pri arhiviranju radnog naloga:', error);
      alert('❌ Greška pri arhiviranju radnog naloga. Molimo pokušajte ponovo.');
    }
  };

  const cancelArchive = () => {
    setShowArchiveModal(false);
    setOrderToArchive(null);
    setArchiveAnalysis(null);
  };

  return (
    <>
      <Header onCreateNew={onCreateNew} />

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Lock className="h-5 w-5 text-blue-500 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-blue-900">Pravila uređivanja</h3>
            <p className="text-sm text-blue-700 mt-1">
              <strong>Mogu se uređivati samo nacrti</strong> jer ne utječu na stanje skladišta. 
              Nalozi s drugim statusima su zaključani jer su već potrošili materijale.
              <span className="block mt-1 font-medium">💡 Kliknite na broj naloga za brzi pregled!</span>
            </p>
          </div>
        </div>
      </div>

      <Filters 
        searchTerm={searchTerm} setSearchTerm={setSearchTerm} 
        statusFilter={statusFilter} setStatusFilter={setStatusFilter} 
      />

      {isLoading ? (
        <Skeleton />
      ) : (
        <OrdersTable 
          orders={filteredOrders}
          clients={clients}
          deliveryNotes={deliveryNotes}
          onEditOrder={onEditOrder}
          onViewOrder={onViewOrder}
          onRequestArchive={handleRequestArchive}
        />
      )}

      <ArchiveModal 
        open={showArchiveModal}
        orderToArchive={orderToArchive}
        analysis={archiveAnalysis}
        onConfirm={confirmArchiveOrder}
        onCancel={cancelArchive}
      />
    </>
  );
};

export default WorkOrdersListRefactored;
