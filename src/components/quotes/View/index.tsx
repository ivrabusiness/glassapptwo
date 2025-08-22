import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSupabaseData } from '../../../hooks/useSupabaseData';
import { Quote, Client, WorkOrder, Process, InventoryItem, DeliveryNote } from '../../../types';
import { AlertCircle, AlertTriangle } from 'lucide-react';
import QuoteHeader from './QuoteHeader';
import QuoteContent from './QuoteContent';
import { QuoteSidebar } from './Sidebar';
import { useAuth } from '../../../contexts/AuthContext';
 

interface ViewQuoteProps {
  quoteId?: string;
  onBack: () => void;
  onEdit?: (quoteId: string) => void;
}

const ViewQuote: React.FC<ViewQuoteProps> = ({ quoteId, onBack, onEdit }) => {
  const params = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const id = quoteId || params.id;
  const [quotes, setQuotes] = useSupabaseData<Quote>('quotes', []);
  const [workOrders, setWorkOrders] = useSupabaseData<WorkOrder>('work_orders', []);
  const [deliveryNotes] = useSupabaseData<DeliveryNote>('delivery_notes', []);
  const [clients] = useSupabaseData<Client>('clients', []);
  const [processes] = useSupabaseData<Process>('processes', []);
  const [inventory] = useSupabaseData<InventoryItem>('inventory', []);
  const [products] = useSupabaseData<any>('products', []);
  
  const [isLoading, setIsLoading] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successData] = useState<{ type: 'created' } | null>(null);
  const [showEditConfirm, setShowEditConfirm] = useState(false);
  
  

  // Dohvati ponudu po id-u ILI po broju ponude
  const quote = quotes.find((q: Quote) => q.id === id || q.quoteNumber === id);
  
  // Force reload if we detect a status change in the URL
  useEffect(() => {
    // Check if there's a status change parameter in the URL
    const urlParams = new URLSearchParams(location.search);
    const statusChanged = urlParams.get('statusChanged');
    if (statusChanged === 'true') {
      // Remove the parameter from URL
      urlParams.delete('statusChanged');
      const newUrl = location.pathname + (urlParams.toString() ? `?${urlParams.toString()}` : '');
      // Use replace to avoid adding to history
      navigate(newUrl, { replace: true });
      
      // Fallback na window.location.reload()
      window.location.reload();
    }
  }, [location, navigate]);
  // Dohvati podatke o klijentu
  const client = clients.find(c => c.id === quote?.clientId) || null;
  // Dohvati radni nalog ako postoji (preko ponude)
  const workOrder = quote ? workOrders.find(wo => wo.quoteId === quote.id) || null : null;
  // Dohvati otpremnicu povezanu s ovim nalogom
  const deliveryNote = workOrder ? (deliveryNotes.find(dn => dn.workOrderId === workOrder.id) || null) : null;

  // Simulate loading
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);

  const handleBack = () => {
    onBack();
  };


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

  if (!quote) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto h-12 w-12 text-red-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900">Ponuda nije pronađena ili je došlo do greške pri učitavanju</h3>
        <button onClick={handleBack} className="mt-4 text-purple-600 hover:text-purple-900">
          ← Povratak na listu
        </button>
      </div>
    );
  }

  // Funkcija za provjeru može li se uređivati ponuda
  const canEditQuote = () => {
    // Osnovno: ponuda se može uređivati ako je još uvijek kreirana
    if (quote.status === 'created') return true;
    // Ako je pretvorena, može se uređivati SAMO ako povezani nalog postoji i u statusu je 'draft'
    if (quote.status === 'converted') {
      if (!workOrder) return false;
      return workOrder.status === 'draft';
    }
    // Za sve ostale statuse (accepted, rejected, expired) uređivanje NIJE dopušteno
    return false;
  };

  // Funkcija za edit - za konvertirane ponude s nacrtom naloga prvo traži potvrdu
  const editQuote = async () => {
    // Ako uređivanje nije dopušteno, prikaži objašnjenje
    if (!canEditQuote()) {
      if (quote.status === 'converted') {
        if (!workOrder) {
          alert('Uređivanje je blokirano: ponuda je označena kao pretvorena, ali povezani radni nalog nije pronađen.');
        } else if (workOrder.status !== 'draft') {
          const statusMap: Record<string, string> = {
            'draft': 'skica',
            'pending': 'u čekanju',
            'in-progress': 'u tijeku',
            'completed': 'završen',
            'cancelled': 'otkazan'
          };
          alert(`Uređivanje je blokirano jer je povezani radni nalog u statusu "${statusMap[workOrder.status] || workOrder.status}". Uređivanje je moguće samo dok je nalog skica.`);
        }
      }
      return;
    }

    // Ako je ponuda tek kreirana (nije pretvorena), samo otvori edit
    if (quote.status === 'created') {
      onEdit && onEdit(id!);
      return;
    }

    // Ako je ponuda pretvorena i postoji skica naloga -> pitaj za potvrdu prije brisanja skice
    if (quote.status === 'converted' && workOrder && workOrder.status === 'draft') {
      setShowEditConfirm(true);
      return;
    }
  };

  // Potvrda uređivanja: resetira ponudu, briše skicu naloga, obavijesti korisnika i otvara edit
  const handleConfirmEdit = async () => {
    if (!(quote && workOrder && workOrder.status === 'draft')) {
      setShowEditConfirm(false);
      return;
    }

    try {
      // 1) Resetiraj ponudu iz 'converted' natrag u 'created' i očisti poveznicu
      await setQuotes(prev => prev.map(q =>
        q.id === quote.id
          ? ({ ...q, status: 'created', convertedToWorkOrderId: null as any })
          : q
      ));

      // 2) Obriši skicu naloga iz stanja/baze
      await setWorkOrders(prev => prev.filter(wo => wo.id !== workOrder.id));

      setShowEditConfirm(false);

      // 3) Otvori uređivanje
      onEdit && onEdit(id!);
    } catch (err) {
      console.error('Greška pri pripremi uređivanja ponude:', err);
      alert('Došlo je do greške pri pripremi uređivanja ponude. Pokušajte ponovo.');
      setShowEditConfirm(false);
    }
  };

  // Funkcija za printanje ponude
  const handlePrintQuote = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    
    if (!quote) return;
    
    try {
      const { default: PDFService } = await import('../../../services/PDFService');
      await PDFService.generateQuotePDF(quote, client, products, processes, inventory, user, workOrder, deliveryNote);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Greška pri generiranju PDF-a. Molimo pokušajte ponovo.');
    }
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      <QuoteHeader 
        quote={quote}
        workOrder={workOrder}
        canEditQuote={canEditQuote()}
        onBack={handleBack}
        onEdit={editQuote}
        onPrintQuote={handlePrintQuote}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <QuoteContent 
          quote={quote}
          client={client}
          processes={processes}
          inventory={inventory}
        />

        {/* Sidebar */}
        <QuoteSidebar 
          quote={quote}
          workOrder={workOrder}
          navigate={navigate}
          canEditQuote={canEditQuote()}
          onEdit={editQuote}
          onPrintQuote={handlePrintQuote}
        />
      </div>

      {/* Confirm Edit Modal - deleting draft work order */}
      {showEditConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 sm:mx-0 sm:h-10 sm:w-10">
                    <AlertTriangle className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Potvrda uređivanja ponude
                    </h3>
                    <div className="mt-2 text-sm text-gray-600">
                      <p className="mb-2">
                        Uređivanje će obrisati skicu povezanog radnog naloga <strong>{workOrder?.orderNumber || workOrder?.id}</strong> i ponudu otključati za uređivanje.
                      </p>
                      <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <ul className="list-disc list-inside space-y-1">
                          <li>Ovo se odnosi samo na skicu naloga (draft), ne na izdani nalog.</li>
                          <li><strong>Skladište neće biti dirano</strong> jer skice nikad ne utječu na skladište.</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleConfirmEdit}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white sm:ml-3 sm:w-auto sm:text-sm bg-purple-600 hover:bg-purple-700"
                >
                  ✅ Nastavi i obriši skicu
                </button>
                <button
                  type="button"
                  onClick={() => setShowEditConfirm(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Odustani
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && successData && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full sm:mx-0 sm:h-10 sm:w-10 bg-purple-100`}>
                    {/* ikona može se dodati po želji */}
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Ponuda uspješno ažurirana!
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Ponuda je uspješno ažurirana i spremna za slanje klijentu.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={() => setShowSuccessModal(false)}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white sm:ml-3 sm:w-auto sm:text-sm bg-purple-600 hover:bg-purple-700"
                >
                  U redu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewQuote;
