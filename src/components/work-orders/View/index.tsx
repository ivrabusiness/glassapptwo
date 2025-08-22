import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useAuth } from '@/contexts/AuthContext';
import { WorkOrder, DeliveryNote, Client, Product, Process, InventoryItem, StockTransaction } from '@/types';
import { prepareIssueWorkOrder, type IssuePreparationResult } from '@/lib/issueWorkOrder';
import WorkOrderHeader from './WorkOrderHeader';
import WorkOrderContent from './WorkOrderContent';
import WorkOrderSidebar from './WorkOrderSidebar';
import ProcessConfirmationModal from './ProcessConfirmationModal';
import IssueConfirmationModal from './IssueConfirmationModal';
// import QuoteComparisonModal from './QuoteComparisonModal'; // Uklonjena nedovršena implementacija
import PDFService from '@/services/PDFService';
import GlassLabels from '../GlassLabels';
// import { AlertTriangle } from 'lucide-react';
// import { generateId, generateQuoteNumber } from '../../../utils/idGenerators'; // Uklonjena nedovršena implementacija

interface ViewWorkOrderProps {
  orderId?: string;
  onBack: () => void;
  onEdit?: (orderId: string) => void;
}

const ViewWorkOrder: React.FC<ViewWorkOrderProps> = ({ orderId, onBack, onEdit }) => {
  const { user } = useAuth();
  const params = useParams();
  const navigate = useNavigate();
  const id = orderId || params.id;
  const [workOrders, setWorkOrders] = useSupabaseData<WorkOrder>('work_orders', []);
  const [deliveryNotes, setDeliveryNotes] = useSupabaseData<DeliveryNote>('delivery_notes', []);
  const [clients] = useSupabaseData<Client>('clients', []);
  const [products] = useSupabaseData<Product>('products', []);
  const [inventory, setInventory] = useSupabaseData<InventoryItem>('inventory', []);
  const [processes] = useSupabaseData<Process>('processes', []); // Added for process name lookups
  // const [quotes, setQuotes] = useSupabaseData<Quote>('quotes', []); // Uklonjena nedovršena implementacija
  const [transactions, setTransactions] = useSupabaseData<StockTransaction>('stock_transactions', []);

  const [showDeliveryNoteSuccess, setShowDeliveryNoteSuccess] = useState(false);
  const [createdDeliveryNote, setCreatedDeliveryNote] = useState<any>(null);
  const [showGlassLabels, setShowGlassLabels] = useState(false);
  // const [showQuoteComparison, setShowQuoteComparison] = useState(false); // Uklonjena nedovršena implementacija
  const [showProcessConfirmation, setShowProcessConfirmation] = useState(false);
  const [processAnalysis, setProcessAnalysis] = useState<{
    incompleteProcesses: Array<{
      processName: string;
      itemName: string;
      materialName: string;
      count: number;
    }>;
    totalIncomplete: number;
    allProcesses: number;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  // Ukloni warning ako 'transactions' nije direktno korišten
  void(transactions);

  // Modal za potvrdu izdavanja (pregled zaliha)
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [issueResult, setIssueResult] = useState<IssuePreparationResult | null>(null);
  const [isIssuing, setIsIssuing] = useState(false);
  const [isIssueSuccess, setIsIssueSuccess] = useState(false);

  const order = workOrders.find(o => o.id === id || o.orderNumber === id);
  const client = order?.clientId ? clients.find(c => c.id === order.clientId) || null : null;

  // Provjeri postoji li otpremnica za ovaj nalog
  // id može biti orderNumber, ali u deliveryNote se čuva pravi workOrderId
  const existingDeliveryNote = deliveryNotes.find(note => note.workOrderId === order?.id);
  // const sourceQuote = order?.quoteId ? (quotes.find(q => q.id === order.quoteId) || null) : null; // Uklonjena nedovršena implementacija


  // Simulate loading
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  const handleBack = () => {
    navigate('/work-orders');
    onBack();
  };

  // Funkcija za provjeru može li se uređivati nalog
  const canEditOrder = () => {
    return order?.status === 'draft';
  };

  // Konverzija NACRTA u pravi nalog (pending) - prvo prikaži pregled zaliha u modalu
  const handleConvertDraftToOrder = async () => {
    if (!order || order.status !== 'draft') return;
    try {
      const result = prepareIssueWorkOrder(order, products, inventory);
      setIssueResult(result);
      setShowIssueModal(true);
    } catch (e) {
      console.error('Greška pri konverziji nacrta u nalog:', e);
      alert('❌ Greška pri konverziji nacrta u nalog. Pokušajte ponovo.');
    }
  };

  // Potvrda izdavanja iz modala
  const handleConfirmIssue = async () => {
    if (!order || !issueResult) return;
    try {
      if (!issueResult.sufficient) {
        // Ako nema dovoljno zaliha, ostavi modal otvoren i onemogući potvrdu (već onemogućeno u UI)
        return;
      }
      setIsIssuing(true);
      await setInventory(issueResult.updatedInventory);
      await setTransactions(prev => [...prev, ...issueResult.newTransactions]);
      await setWorkOrders((prev: WorkOrder[]) =>
        prev.map(wo => (wo.id === order.id ? issueResult.updatedOrder : wo))
      );
      // Prikaži uspjeh u istom modalu i auto-zatvori nakon kratkog vremena
      setIsIssueSuccess(true);
      setTimeout(() => {
        setShowIssueModal(false);
        setIsIssueSuccess(false);
        setIssueResult(null);
      }, 1000);
    } catch (e) {
      console.error('Greška pri izdavanju naloga:', e);
      alert('❌ Greška pri izdavanju naloga. Pokušajte ponovo.');
    } finally {
      setIsIssuing(false);
      // issueResult se resetira nakon auto-close
    }
  };

  const handleCancelIssue = () => {
    setShowIssueModal(false);
    setIsIssueSuccess(false);
    setIssueResult(null);
  };

  // Funkcija za edit - bez alert-a
  const editWorkOrder = () => {
    if (!canEditOrder()) {
      return;
    }

    if (onEdit) {
      onEdit(id!);
    }
  };

  // Funkcija za direktno printanje radnog naloga
  const handleDirectPrintWorkOrder = async () => {
    if (order) {
      try {
        await PDFService.generateWorkOrderPDF(order, client, products, inventory, processes, user);
      } catch (error) {
        console.error('Error printing work order:', error);
        alert('Greška pri printanju radnog naloga. Molimo pokušajte ponovo.');
      }
    }
  };

  // Funkcija za analizu procesa prije generiranja otpremnice
  const analyzeProcesses = () => {
    if (!order) return null;

    const incompleteProcesses: Array<{
      processName: string;
      itemName: string;
      materialName: string;
      count: number;
    }> = [];

    let totalIncomplete = 0;
    let allProcesses = 0;

    order.items.forEach((item, itemIndex) => {
      const itemName = item.isService ?
        (item.productName || `Usluga ${itemIndex + 1}`) :
        (products.find(p => p.id === item.productId)?.name || `Artikal ${itemIndex + 1}`);

      item.materials?.forEach((material, materialIndex) => {
        const materialName = `Materijal #${materialIndex + 1}`;

        material.processSteps?.forEach(step => {
          allProcesses++;
          if (step.status !== 'completed') {
            totalIncomplete++;
            const process = processes.find(p => p.id === step.processId);
            const processName = process?.name || 'Nepoznat proces';

            const existing = incompleteProcesses.find(ip =>
              ip.processName === processName &&
              ip.itemName === itemName &&
              ip.materialName === materialName
            );

            if (existing) {
              existing.count++;
            } else {
              incompleteProcesses.push({
                processName,
                itemName,
                materialName,
                count: 1
              });
            }
          }
        });
      });
    });

    return {
      incompleteProcesses,
      totalIncomplete,
      allProcesses
    };
  };

  // Funkcija za kreiranje/otvaranje otpremnice
  const handleDirectPrintDeliveryNote = () => {
    if (!order) return;
    // Blokiraj generiranje za arhiviran nalog bez postojeće otpremnice
    if (order.status === 'archived' && !existingDeliveryNote) {
      alert('Nalog je arhiviran – nije moguće generirati novu otpremnicu.');
      return;
    }
    // Blokiraj generiranje za nacrt naloge (dozvoli samo pregled postojeće otpremnice)
    if (order.status === 'draft' && !existingDeliveryNote) {
      alert('Nije moguće generirati otpremnicu za radni nalog u statusu nacrt. Prvo izdaj nalog.');
      return;
    }

    if (existingDeliveryNote) {
      // Ako otpremnica već postoji, otvori je
      navigate(`/delivery-notes/${existingDeliveryNote.deliveryNumber}`);
    } else {
      // Analiziraj procese prije generiranja otpremnice
      const analysis = analyzeProcesses();
      if (analysis && analysis.totalIncomplete > 0) {
        // Prikaži confirmation modal ako ima nezavršenih procesa
        setProcessAnalysis(analysis);
        setShowProcessConfirmation(true);
      } else {
        // Ako su svi procesi završeni ili nema procesa, direktno generiraj otpremnicu
        createDeliveryNoteWithModal();
      }
    }
  };

  // Funkcija za kreiranje otpremnice s success modal
  const createDeliveryNoteWithModal = async () => {
    if (!order || !client) {
      alert('Nedostaju podaci za kreiranje otpremnice.');
      return;
    }

    try {
      // Generiraj broj otpremnice
      const date = new Date();
      const year = date.getFullYear().toString().slice(-2);
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const time = Date.now().toString().slice(-6);
      const deliveryNumber = `DN${year}${month}${day}-${time}`;

      // Kreiraj otpremnicu
      const newDeliveryNote = {
        id: crypto.randomUUID(),
        deliveryNumber,
        workOrderId: order.id,
        clientId: client.id,
        items: order.items.map(item => {
          const product = products.find(p => p.id === item.productId);
          return {
            id: crypto.randomUUID(),
            workOrderItemId: item.id,
            productId: item.productId,
            productName: item.isService ? (item.productName || 'Nepoznata usluga') : (product?.name || 'Nepoznat proizvod'),
            productCode: product?.code,
            quantity: item.quantity,
            dimensions: item.dimensions,
            totalArea: item.dimensions.area * item.quantity,
            notes: item.notes
          };
        }),
        status: 'generated' as const,
        createdAt: new Date().toISOString(),
        notes: order.notes
      };

      // Spremi otpremnicu u localStorage
      setDeliveryNotes(prev => [...prev, newDeliveryNote]);

      // Označi radni nalog kao završen i sve procese kao završene
      const completedAt = new Date().toISOString();

      // Označi sve procese kao završene
      const updatedItems = order.items.map(item => ({
        ...item,
        materials: item.materials?.map(material => ({
          ...material,
          processSteps: material.processSteps?.map(step => ({
            ...step,
            status: 'completed' as const,
            completedAt: step.status !== 'completed' ? completedAt : step.completedAt
          }))
        }))
      }));

      const updatedOrder = {
        ...order,
        items: updatedItems,
        status: 'completed' as const,
        completedAt,
        completionReason: `Automatski završen generiranjem otpremnice ${newDeliveryNote.deliveryNumber}`
      };

      // Ažuriraj nalog u localStorage
      setWorkOrders(prev => prev.map((wo: WorkOrder) =>
        wo.id === order.id ? updatedOrder : wo
      ));

      // Supabase sinkronizaciju odrađuje useSupabaseData kroz setDeliveryNotes

      // Supabase sinkronizaciju odrađuje useSupabaseData kroz setWorkOrders

      // Postavi kreiranu otpremnicu i prikaži success modal
      setCreatedDeliveryNote(newDeliveryNote);
      setShowDeliveryNoteSuccess(true);

    } catch (error) {
      console.error('Error creating delivery note:', error);
      alert('Greška pri kreiranju otpremnice. Molimo pokušajte ponovo.');
    }
  };

  // Delivery notes creation is now handled directly in handleDirectPrintDeliveryNote

  // Delivery note view is now handled by navigation

  // Prikaži naljepnice za stakla
  if (showGlassLabels && order) {
    return <GlassLabels workOrder={order} onClose={() => setShowGlassLabels(false)} />;
  }

  // Uklonjena nedovršena implementacija ažuriranja ponuda

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center space-x-4">
          <div className="h-10 w-10 bg-gray-200 rounded-lg"></div>
          <div className="space-y-2 flex-1">
            <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          </div>
          <div className="flex space-x-2">
            <div className="h-10 w-24 bg-gray-200 rounded-lg"></div>
            <div className="h-10 w-24 bg-gray-200 rounded-lg"></div>
          </div>
        </div>

        {/* Content skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Client info skeleton */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="h-5 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>

            {/* Items skeleton */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="h-5 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="space-y-4">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between mb-4">
                      <div className="h-5 bg-gray-200 rounded w-1/3"></div>
                      <div className="h-5 bg-gray-200 rounded w-16"></div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      {[...Array(4)].map((_, j) => (
                        <div key={j}>
                          <div className="h-4 bg-gray-200 rounded w-1/2 mb-1"></div>
                          <div className="h-5 bg-gray-200 rounded w-2/3"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar skeleton */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="h-5 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex justify-between">
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="h-5 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="space-y-3">
                <div className="h-10 bg-gray-200 rounded w-full"></div>
                <div className="h-10 bg-gray-200 rounded w-full"></div>
                <div className="h-10 bg-gray-200 rounded w-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Nalog nije pronađen</h3>
        <button onClick={handleBack} className="mt-4 text-blue-600 hover:text-blue-900">
          Povratak na listu
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <WorkOrderHeader
        order={order}
        existingDeliveryNote={existingDeliveryNote}
        canEditOrder={canEditOrder()}
        onBack={handleBack}
        onEdit={editWorkOrder}
        onPrintDeliveryNote={handleDirectPrintDeliveryNote}
        onConvertDraftToOrder={handleConvertDraftToOrder}
      />

      {/* Uklonjen banner "Nalog je kreiran iz ponude" prema zahtjevu */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <WorkOrderContent order={order} />

        {/* Sidebar */}
        <WorkOrderSidebar
          order={order}
          existingDeliveryNote={existingDeliveryNote}
          canEditOrder={canEditOrder()}
          onEdit={editWorkOrder}
          onPrintWorkOrder={handleDirectPrintWorkOrder}
          onPrintDeliveryNote={handleDirectPrintDeliveryNote}
          onPrintGlassLabels={() => setShowGlassLabels(true)}
          onOrderDeleted={handleBack}
          onConvertDraftToOrder={handleConvertDraftToOrder}
        />
      </div>

      {/* Success overlay for created delivery note */}
      {showDeliveryNoteSuccess && createdDeliveryNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Otpremnica je uspješno generirana!</h3>
              <p className="text-sm text-gray-500 mb-6">
                Otpremnica <strong>{createdDeliveryNote.deliveryNumber}</strong> je kreirana za radni nalog <strong>{order?.orderNumber}</strong>.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setShowDeliveryNoteSuccess(false)}
                  className="inline-flex justify-center px-4 py-2 bg-gray-100 text-gray-800 text-sm font-medium rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
                >
                  Zatvori
                </button>
                <button
                  onClick={() => {
                    setShowDeliveryNoteSuccess(false);
                    navigate(`/delivery-notes/${createdDeliveryNote.deliveryNumber}`);
                  }}
                  className="inline-flex justify-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Otvori otpremnicu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Process Confirmation Modal */}
      <ProcessConfirmationModal
        isOpen={showProcessConfirmation}
        processAnalysis={processAnalysis}
        onConfirm={() => {
          setShowProcessConfirmation(false);
          setProcessAnalysis(null);
          createDeliveryNoteWithModal();
        }}
        onCancel={() => {
          setShowProcessConfirmation(false);
          setProcessAnalysis(null);
        }}
      />

      {/* Issue Confirmation Modal (pregled skladišta) */}
      <IssueConfirmationModal
        isOpen={showIssueModal}
        orderNumber={order.orderNumber}
        requirements={issueResult?.requirements || []}
        onConfirm={handleConfirmIssue}
        onCancel={handleCancelIssue}
        isSubmitting={isIssuing}
        isSuccess={isIssueSuccess}
      />

      {/* QuoteComparisonModal - uklonjena nedovršena implementacija */}

      {/* Prikaz upozorenja o neusklađenosti - uklonjena nedovršena implementacija */}
    </div>
  );
};

export default ViewWorkOrder;
