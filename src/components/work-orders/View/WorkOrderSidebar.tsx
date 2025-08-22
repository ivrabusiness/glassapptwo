import React from 'react';
import { Link } from 'react-router-dom';
import { Edit, Printer, Lock, Archive, AlertTriangle, CheckCircle, FileText, Truck, Eye } from 'lucide-react';
import { useSupabaseData } from '../../../hooks/useSupabaseData';
import { WorkOrder, Product, Client, Process, InventoryItem, DeliveryNote, StockTransaction, Quote } from '../../../types';
import { generateId } from '../../../utils/idGenerators';
import { supabase } from '../../../lib/supabase';

interface WorkOrderSidebarProps {
  order: WorkOrder;
  existingDeliveryNote: DeliveryNote | undefined;
  canEditOrder: boolean;
  onEdit: () => void;
  onPrintWorkOrder: () => void | Promise<void>;
  onPrintDeliveryNote: () => void;
  onPrintGlassLabels: () => void;
  onOrderDeleted?: () => void;
  onConvertDraftToOrder: () => void | Promise<void>;
}

const WorkOrderSidebar: React.FC<WorkOrderSidebarProps> = ({
  order,
  existingDeliveryNote,
  canEditOrder,
  onEdit,
  onPrintWorkOrder,
  onPrintDeliveryNote,
  onPrintGlassLabels,
  onOrderDeleted,
  onConvertDraftToOrder
}) => {
  const [, setWorkOrders] = useSupabaseData<WorkOrder>('work_orders', []);
  const [inventory, setInventory] = useSupabaseData<InventoryItem>('inventory', []);
  const [transactions, setTransactions] = useSupabaseData<StockTransaction>('stock_transactions', []);
  const [, setDeliveryNotes] = useSupabaseData<DeliveryNote>('delivery_notes', []);
  const [products] = useSupabaseData<Product>('products', []);
  const [clients] = useSupabaseData<Client>('clients', []);
  const [processes] = useSupabaseData<Process>('processes', []);
  const [quotes, setQuotes] = useSupabaseData<Quote>('quotes', []);
  
  const [showArchiveModal, setShowArchiveModal] = React.useState(false);
  const [archiveAnalysis, setArchiveAnalysis] = React.useState<{
    materialsToRestore: Array<{
      inventoryItemId: string;
      name: string;
      quantity: number;
      unit: string;
      currentStock: number;
      newStock: number;
    }>;
    transactionsToCreate: number;
    hasDeliveryNote: boolean;
    deliveryNoteNumber?: string;
  } | null>(null);

  const client = order?.clientId ? clients.find(c => c.id === order.clientId) : null;
  const quoteNumber = React.useMemo(() => {
    // 1) Direct on order if available
    const direct = (order as any)?.quoteNumber as string | undefined;
    if (direct) return direct;
    // 2) Lookup by quoteId from loaded quotes
    if (order.quoteId) {
      const q = quotes.find(q => q.id === order.quoteId);
      if (q?.quoteNumber) return q.quoteNumber;
    }
    // 3) Fallback: localStorage (for legacy/offline data)
    try {
      const stored = localStorage.getItem('quotes');
      if (stored && order.quoteId) {
        const parsed = JSON.parse(stored) as Array<{ id: string; quoteNumber?: string }>;
        const found = parsed.find(q => q.id === order.quoteId);
        return found?.quoteNumber;
      }
    } catch (_) {
      // ignore parsing errors
    }
    return undefined;
  }, [order, quotes]);

  const isDraft = order.status === 'draft';
  const isArchived = order.status === 'archived';
  const isFromQuote = Boolean((order as any)?.quoteId) || Boolean(quoteNumber);

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft': return 'Nacrt';
      case 'pending': return 'Na čekanju';
      case 'in-progress': return 'U tijeku';
      case 'completed': return 'Završen';
      case 'cancelled': return 'Otkazan';
      case 'archived': return 'Arhivirano';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'archived': return 'bg-gray-200 text-gray-700';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Calculate process completion for the work order
  const getProcessCompletion = () => {
    let totalProcesses = 0;
    let completedProcesses = 0;
    
    // Count processes in all items and materials
    order.items.forEach(item => {
      if (item.materials && item.materials.length > 0) {
        item.materials.forEach(material => {
          if (material.processSteps && material.processSteps.length > 0) {
            material.processSteps.forEach(step => {
              totalProcesses++;
              if (step.status === 'completed') {
                completedProcesses++;
              }
            });
          }
        });
      }
    });
    
    return {
      completed: completedProcesses,
      total: totalProcesses,
      percentage: totalProcesses > 0 ? Math.round((completedProcesses / totalProcesses) * 100) : 0
    };
  };

  // Funkcija za analizu što će se dogoditi pri arhiviranju
  const analyzeOrderArchiving = () => {
    const materialsToRestore: Array<{
      inventoryItemId: string;
      name: string;
      quantity: number;
      unit: string;
      currentStock: number;
      newStock: number;
    }> = [];

    // Analiziraj samo ako nalog nije nacrt
    if (order.status !== 'draft') {
      // Pronađi sve transakcije povezane s ovim nalogom
      const orderTransactions = transactions.filter(t => 
        t.type === 'out' && 
        t.notes && 
        t.notes.includes(order.orderNumber)
      );

      // Grupiraj po inventoryItemId
      const materialGroups: { [key: string]: number } = {};
      
      orderTransactions.forEach(transaction => {
        if (!materialGroups[transaction.inventoryItemId]) {
          materialGroups[transaction.inventoryItemId] = 0;
        }
        materialGroups[transaction.inventoryItemId] += transaction.quantity;
      });

      // Kreiraj listu materijala za vraćanje
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

    return {
      materialsToRestore,
      transactionsToCreate: materialsToRestore.length,
      hasDeliveryNote: !!existingDeliveryNote,
      deliveryNoteNumber: existingDeliveryNote?.deliveryNumber
    };
  };

  // Funkcija za pokretanje arhiviranja
  const handleArchiveOrder = () => {
    // Ne dopuštaj ponovno arhiviranje
    if (order.status === 'archived') return;
    const analysis = analyzeOrderArchiving();
    setArchiveAnalysis(analysis);
    setShowArchiveModal(true);
  };

  // Funkcija za potvrdu arhiviranja
  const confirmArchiveOrder = async () => {
    if (!archiveAnalysis) return;

    try {
      // 1. Vrati materijale na skladište (samo ako nije nacrt)
      if (order.status !== 'draft' && archiveAnalysis.materialsToRestore.length > 0) {
        const updatedInventory = inventory.map(item => {
          const materialToRestore = archiveAnalysis.materialsToRestore.find(m => m.inventoryItemId === item.id);
          if (materialToRestore) {
            return {
              ...item,
              quantity: item.quantity + materialToRestore.quantity
            };
          }
          return item;
        });

        // 2. Kreiraj transakcije za vraćanje materijala
        const restorationTransactions: StockTransaction[] = archiveAnalysis.materialsToRestore.map(material => ({
          id: generateId(),
          inventoryItemId: material.inventoryItemId,
          type: 'return',
          quantity: material.quantity,
          previousQuantity: material.currentStock,
          oldQuantity: material.currentStock,
          newQuantity: material.newStock,
          notes: `📦 VRAĆANJE MATERIJALA - Arhiviranje radnog naloga ${order.orderNumber}\n\nMaterijal: ${material.name}\nVraćeno: ${material.quantity.toFixed(4)} ${material.unit}\nRazlog: Radni nalog je arhiviran u sustavu\n\nℹ️ NAPOMENA: Ova transakcija je automatski kreirana zbog arhiviranja radnog naloga.`,
          createdAt: new Date().toISOString()
        }));

        // Spremi ažurirani inventar i nove transakcije
        await setInventory(updatedInventory);
        await setTransactions(prev => [...prev, ...restorationTransactions]);
      }

      // 3. Arhiviraj povezane otpremnice
      if (archiveAnalysis.hasDeliveryNote) {
        // a) Ažuriraj status u bazi (Supabase)
        const { error: updateDnError } = await supabase
          .from('delivery_notes')
          .update({ status: 'archived' })
          .eq('work_order_id', order.id);
        if (updateDnError) throw updateDnError;

        // b) Ažuriraj lokalno stanje tako da postavi status na 'archived'
        await setDeliveryNotes(prev => prev.map(note => 
          note.workOrderId === order.id ? { ...note, status: 'archived' as any } : note
        ));
      }

      // 4. Ako je nalog nastao iz ponude, arhiviraj i ponudu
      let relatedQuoteNumber: string | undefined;
      if (order.quoteId || quoteNumber) {
        const relatedQuote = order.quoteId
          ? quotes.find(q => q.id === order.quoteId)
          : quotes.find(q => q.quoteNumber === quoteNumber);
        if (relatedQuote) {
          relatedQuoteNumber = relatedQuote.quoteNumber;
          await setQuotes(prev => prev.map(q =>
            q.id === relatedQuote!.id
              ? ({ ...q, status: 'archived' as any })
              : q
          ));
        }
      }

      // 5. Arhiviraj radni nalog
      await setWorkOrders(prev => prev.map(wo => 
        wo.id === order.id ? { ...wo, status: 'archived' as any } : wo
      ));

      // 6. Prikaži potvrdu uspjeha
      const successMessage = order.status === 'draft' 
        ? `✅ Nacrt radnog naloga ${order.orderNumber} je uspješno arhiviran.`
        : `✅ Radni nalog ${order.orderNumber} je uspješno arhiviran!\n\n📦 Vraćeno na skladište:\n${archiveAnalysis.materialsToRestore.map(m => 
            `• ${m.name}: +${m.quantity.toFixed(4)} ${m.unit}`
          ).join('\n')}\n\n📋 Kreirano ${archiveAnalysis.transactionsToCreate} transakcija vraćanja.${archiveAnalysis.hasDeliveryNote ? `\n🚚 Otpremnica arhivirana: ${archiveAnalysis.deliveryNoteNumber}` : ''}`;

      const successWithQuoteReset = successMessage + (relatedQuoteNumber 
        ? `\n🧾 Ponuda ${relatedQuoteNumber} je arhivirana.`
        : '');

      alert(successWithQuoteReset);

      // Zatvori modal i vrati na listu
      setShowArchiveModal(false);
      setArchiveAnalysis(null);
      
      // Pozovi callback za vraćanje na listu
      if (onOrderDeleted) {
        onOrderDeleted();
      }

    } catch (error) {
      console.error('Greška pri arhiviranju radnog naloga:', error);
      alert('❌ Greška pri arhiviranju radnog naloga. Molimo pokušajte ponovo.');
    }
  };

  // Funkcija za zatvaranje modal-a
  const cancelArchive = () => {
    setShowArchiveModal(false);
    setArchiveAnalysis(null);
  };
  return (
    <div className="space-y-6">
      {/* Order Summary */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Sažetak naloga</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Broj naloga:</span>
            <span className="font-medium">{order.orderNumber}</span>
          </div>
          {quoteNumber && (
            <div className="flex justify-between">
              <span className="text-gray-600">Broj ponude:</span>
              <Link to={`/quotes/${quoteNumber}`} className="font-medium text-purple-600 hover:text-purple-800">{quoteNumber}</Link>
            </div>
          )}
          {existingDeliveryNote && (
            <div className="flex justify-between">
              <span className="text-gray-600">Otpremnica:</span>
              <Link to={`/delivery-notes/${existingDeliveryNote.deliveryNumber}`} className="font-medium text-orange-600 hover:text-orange-800">
                {existingDeliveryNote.deliveryNumber}
              </Link>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-600">Status:</span>
            {(() => {
              // For completed, draft, or cancelled orders, just show the status badge
              if (order.status === 'completed' || order.status === 'draft' || order.status === 'cancelled') {
                return (
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                    {getStatusText(order.status)}
                  </span>
                );
              }
              
              // For pending or in-progress orders, show progress
              const { completed, total, percentage } = getProcessCompletion();
              
              return (
                <div className="text-right">
                  <div className={`text-xs font-medium ${
                    percentage === 100 ? 'text-green-600' : 
                    percentage > 50 ? 'text-blue-600' :
                    'text-amber-600'
                  }`}>
                    {completed}/{total} ({percentage}%)
                  </div>
                  <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden mt-1">
                    <div 
                      className={`h-full rounded-full ${
                        percentage === 100 ? 'bg-green-500' : 
                        percentage > 50 ? 'bg-blue-500' :
                        'bg-amber-500'
                      }`} 
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })()}
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Klijent:</span>
            <span className="font-medium">{client?.name || 'Bez klijenta'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Artikli:</span>
            <span className="font-medium">{order.items.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Ukupno komada:</span>
            <span className="font-medium">
              {order.items.reduce((total, item) => total + item.quantity, 0)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Ukupna površina:</span>
            {order.items.some(item => !item.isService) ? (
              <span className="font-medium">
                {order.items.filter(item => !item.isService)
                  .reduce((total, item) => total + (item.dimensions.area * item.quantity), 0)
                  .toFixed(4)} m²
              </span>
            ) : (
              <span className="text-gray-500 italic">Samo usluge</span>
            )}
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Datum kreiranja:</span>
            <span className="font-medium">
              {new Date(order.createdAt).toLocaleString('hr-HR', {
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
              })}
            </span>
          </div>
          {order.completedAt && (
            <div className="flex justify-between">
              <span className="text-gray-600">Datum završetka:</span>
              <span className="font-medium">
                {new Date(order.completedAt).toLocaleString('hr-HR', {
                  year: 'numeric', month: '2-digit', day: '2-digit',
                  hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
                })}
              </span>
            </div>
          )}
          
        </div>
      </div>

      {/* Material Summary */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Sažetak materijala</h3>
        <div className="space-y-2">
          {(() => {
            const materialSummary: { [key: string]: { name: string; total: number; unit: string } } = {};
            
            order.items.forEach(item => {
              const product = products.find(p => p.id === item.productId);
              if (product) {
                product.materials.forEach(material => {
                  const inventoryItem = inventory.find(inv => inv.id === material.inventoryItemId);
                  const usedQuantity = material.quantity * item.quantity * item.dimensions.area;
                  
                  if (!materialSummary[material.inventoryItemId]) {
                    materialSummary[material.inventoryItemId] = {
                      name: inventoryItem?.name || 'Nepoznat materijal',
                      total: 0,
                      unit: inventoryItem?.unit || material.unit
                    };
                  }
                  materialSummary[material.inventoryItemId].total += usedQuantity;
                });
              }
            });

            return Object.values(materialSummary).map((summary, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm text-gray-900">
                  {summary.name}
                  <div className="text-xs text-gray-500">
                    Jedinica mjere: {summary.unit}
                  </div>
                </span>
                <span className="text-sm font-medium text-red-600">
                  {summary.unit === 'kom' ? 
                    summary.total.toFixed(0) : 
                    summary.total.toFixed(4)} {summary.unit}
                </span>
              </div>
            ));
          })()}
        </div>
      </div>

      {/* Process Summary */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Sažetak procesa</h3>
        <div className="space-y-2">
          {(() => {
            // Fix: Access processSteps from materials, not directly from items
            const allProcessSteps = order.items.flatMap(item => 
              (item.materials || []).flatMap(material => material.processSteps || [])
            );
            
            // Ako nema procesa, prikaži poruku
            if (allProcessSteps.length === 0) {
              return (
                <div className="text-center py-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-500">Nema dodanih procesa</p>
                </div>
              );
            }
            
            const processGroups = allProcessSteps.reduce((acc, step) => {
              const process = processes.find(p => p.id === step.processId);
              const processName = process?.name || 'Nepoznat proces';
              
              if (!acc[processName]) {
                acc[processName] = { total: 0, completed: 0 };
              }
              acc[processName].total++;
              if (step.status === 'completed') {
                acc[processName].completed++;
              }
              return acc;
            }, {} as Record<string, { total: number; completed: number }>);

            return Object.entries(processGroups).map(([processName, counts]) => (
              <div key={processName} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm text-gray-900">{processName}</span>
                <span className="text-sm text-gray-600">
                  {counts.completed}/{counts.total}
                </span>
              </div>
            ));
          })()}
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Akcije</h3>
        <div className="space-y-3">
          {/* Edit gumb: sakrij ako je nacrt iz ponude */}
          {!(isDraft && isFromQuote) && (
            <button 
              onClick={onEdit}
              className={`w-full flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                canEditOrder
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              title={canEditOrder ? 'Uredi nalog' : `Nalog se ne može uređivati (status: ${getStatusText(order.status)})`}
            >
              {canEditOrder ? (
                <>
                  <Edit className="h-4 w-4 mr-2" />
                  Uredi nalog
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Zaključan za uređivanje
                </>
              )}
            </button>
          )}

          {/* Prebaci u pravi nalog: prikaži za sve nacrte */}
          {isDraft && (
            <button 
              onClick={onConvertDraftToOrder}
              className="w-full flex items-center justify-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
              title="Prebaci u pravi nalog"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Prebaci u pravi nalog
            </button>
          )}
          <button 
            onClick={onPrintWorkOrder}
            className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
          >
            <Printer className="h-4 w-4 mr-2" />
            Ispiši radni nalog
          </button>
          
          {/* Gumb za otpremnicu: sakrij za nacrt osim ako već postoji otpremnica */}
          {(order.status !== 'draft' || !!existingDeliveryNote) && (
            <button 
              onClick={isArchived && !existingDeliveryNote ? undefined : onPrintDeliveryNote}
              disabled={isArchived && !existingDeliveryNote}
              className={`w-full flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                isArchived && !existingDeliveryNote
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-orange-600 text-white hover:bg-orange-700'
              }`}
              title={
                isArchived && !existingDeliveryNote
                  ? 'Nalog je arhiviran – nije moguće generirati novu otpremnicu'
                  : (existingDeliveryNote ? 'Pogledaj otpremnicu' : 'Generiraj otpremnicu')
              }
            >
              {existingDeliveryNote ? (
                <Eye className="h-4 w-4 mr-2" />
              ) : (
                <FileText className="h-4 w-4 mr-2" />
              )}
              {existingDeliveryNote ? 'Pogledaj otpremnicu' : 'Generiraj otpremnicu'}
            </button>
          )}
          
          {/* Button za printanje naljepnica proizvoda */}
          <button 
            onClick={onPrintGlassLabels}
            className="w-full flex items-center justify-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
            title="Printaj naljepnice za proizvode s QR kodom"
          >
            <Printer className="h-4 w-4 mr-2" />
            🏷️ Naljepnice proizvoda
          </button>
        </div>
        
        {/* Separator */}
        <div className="border-t border-gray-200 my-4"></div>
        
        {/* Danger Zone */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-red-900">⚠️ Opasna zona</h4>
          {order.status !== 'archived' ? (
            <>
              <button 
                onClick={handleArchiveOrder}
                className="w-full flex items-center justify-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
              >
                <Archive className="h-4 w-4 mr-2" />
                Arhiviraj radni nalog
              </button>
              <p className="text-xs text-red-600">
                Arhiviranje radnog naloga će vratiti sve materijale na skladište i arhivirati povezane otpremnice i (ako postoji) povezanu ponudu.
              </p>
            </>
          ) : (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded text-sm text-gray-600 flex items-center">
              <Archive className="h-4 w-4 mr-2 text-gray-500" />
              Ovaj nalog je već arhiviran.
            </div>
          )}
        </div>
      </div>

      {/* Archive Confirmation Modal */}
      {showArchiveModal && archiveAnalysis && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      📦 Arhiviranje radnog naloga
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 mb-4">
                        <strong>Jeste li sigurni da želite arhivirati radni nalog {order.orderNumber}?</strong>
                      </p>
                      
                      {/* Osnovne informacije o nalogu */}
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">📋 Informacije o nalogu:</h4>
                        <div className="text-sm text-gray-700 space-y-1">
                          <div className="flex justify-between">
                            <span>Broj naloga:</span>
                            <span className="font-medium">{order.orderNumber}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Status:</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                              {getStatusText(order.status)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Datum kreiranja:</span>
                            <span className="font-medium">{new Date(order.createdAt).toLocaleDateString('hr-HR')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Broj artikala:</span>
                            <span className="font-medium">{order.items.length}</span>
                          </div>
                        </div>
                      </div>

                      {/* Upozorenje za nacrt */}
                      {order.status === 'draft' && (
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
                          <div className="flex items-start">
                            <FileText className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                            <div>
                              <h4 className="text-sm font-medium text-blue-900">Arhiviranje nacrta</h4>
                              <p className="text-sm text-blue-700 mt-1">
                                Ovaj nalog je nacrt i nije utjecao na stanje skladišta. 
                                Arhiviranje neće utjecati na zalihe materijala.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Analiza vraćanja materijala */}
                      {order.status !== 'draft' && archiveAnalysis.materialsToRestore.length > 0 && (
                        <div className="bg-green-50 p-4 rounded-lg border border-green-200 mb-4">
                          <div className="flex items-start">
                            <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-green-900">📦 Materijali će biti vraćeni na skladište</h4>
                              <p className="text-sm text-green-700 mt-1 mb-3">
                                Sljedeći materijali će biti automatski vraćeni na skladište:
                              </p>
                              
                              <div className="max-h-32 overflow-y-auto">
                                <table className="w-full text-xs">
                                  <thead className="bg-green-100">
                                    <tr>
                                      <th className="px-2 py-1 text-left">Materijal</th>
                                      <th className="px-2 py-1 text-right">Vraća se</th>
                                      <th className="px-2 py-1 text-right">Novo stanje</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-green-200">
                                    {archiveAnalysis.materialsToRestore.map((material, index) => (
                                      <tr key={index} className="bg-white">
                                        <td className="px-2 py-1 font-medium">{material.name}</td>
                                        <td className="px-2 py-1 text-right font-bold text-green-700">
                                          +{material.quantity.toFixed(4)} {material.unit}
                                        </td>
                                        <td className="px-2 py-1 text-right font-bold text-green-700">
                                          {material.newStock.toFixed(4)} {material.unit}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Upozorenje o otpremnici */}
                      {archiveAnalysis.hasDeliveryNote && (
                        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mb-4">
                          <div className="flex items-start">
                            <Truck className="h-5 w-5 text-yellow-500 mr-2 mt-0.5" />
                            <div>
                              <h4 className="text-sm font-medium text-yellow-900">🚚 Povezana otpremnica</h4>
                              <p className="text-sm text-yellow-700 mt-1">
                                Ovaj nalog ima povezanu otpremnicu <strong>{archiveAnalysis.deliveryNoteNumber}</strong>. 
                                Otpremnica će također biti arhivirana.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Finalno upozorenje */}
                      <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                        <div className="flex items-start">
                          <AlertTriangle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                          <div>
                            <h4 className="text-sm font-medium text-red-900">⚠️ PAŽNJA</h4>
                            <ul className="text-sm text-red-700 mt-1 list-disc list-inside space-y-1">
                              <li>Radni nalog će biti arhiviran</li>
                              {archiveAnalysis.materialsToRestore.length > 0 && (
                                <li>Materijali će biti vraćeni na skladište</li>
                              )}
                              {archiveAnalysis.hasDeliveryNote && (
                                <li>Povezana otpremnica će biti arhivirana</li>
                              )}
                              <li>Sve transakcije vraćanja će biti zabilježene</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={confirmArchiveOrder}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  📦 DA, ARHIVIRAJ NALOG
                </button>
                <button
                  type="button"
                  onClick={cancelArchive}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Odustani
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkOrderSidebar;
