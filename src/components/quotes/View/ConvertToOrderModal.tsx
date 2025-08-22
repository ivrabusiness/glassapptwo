import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, AlertTriangle, CheckCircle } from 'lucide-react';
import { useSupabaseData } from '../../../hooks/useSupabaseData';
import { Quote, WorkOrder, WorkOrderItem } from '../../../types';
import { generateId, generateOrderNumber } from '../../../utils/idGenerators'; 

interface ConvertToOrderModalProps {
  quote: Quote;
  onClose: () => void;
}

const ConvertToOrderModal: React.FC<ConvertToOrderModalProps> = ({ quote, onClose }) => {
  const [, setQuotes] = useSupabaseData<Quote>('quotes', []);
  const navigate = useNavigate();
  const [, setWorkOrders] = useSupabaseData<WorkOrder>('work_orders', []);
  const [isConverting, setIsConverting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [newOrderNumber, setNewOrderNumber] = useState('');

  const handleConvert = async () => {
    setIsConverting(true);
    
    try {
      // Generiraj broj radnog naloga
      const orderNumber = generateOrderNumber();
      setNewOrderNumber(orderNumber);
      
      // Pretvori stavke ponude u stavke radnog naloga
      const workOrderItems: WorkOrderItem[] = quote.items.map(item => ({
        id: generateId(),
        // Za usluge koristi serviceId, a ako ga nema, fallback na productId da ostane string
        productId: item.isService ? (item.serviceId ?? item.productId) : item.productId,
        productName: item.productName,
        isService: item.isService,
        quantity: item.quantity,
        dimensions: item.dimensions,
        materials: item.materials || [],
        notes: item.notes
      }));
      
      // Kreiraj novi radni nalog
      const newWorkOrder: WorkOrder = {
        id: generateId(),
        orderNumber,
        clientId: quote.clientId,
        items: workOrderItems,
        status: 'draft', // Počinje kao nacrt
        createdAt: new Date().toISOString(),
        notes: `Kreirano iz ponude ${quote.quoteNumber}. ${quote.notes || ''}`,
        purchaseOrder: quote.purchaseOrder,
        quoteId: quote.id, // Referenca na ponudu
        originalQuoteTotal: quote.grandTotal, // Spremi originalni iznos ponude
        currentTotal: quote.grandTotal, // Početno je isti kao ponuda
        requiresQuoteUpdate: false // Početno nema potrebe za ažuriranjem
      };
      
      // Ažuriraj ponudu
      const updatedQuote: Quote = {
        ...quote,
        status: 'converted',
        convertedToWorkOrderId: newWorkOrder.id
      };
      
      // Spremi promjene
      await setWorkOrders(prev => [...prev, newWorkOrder]);
      await setQuotes(prev => prev.map(q => q.id === quote.id ? updatedQuote : q));
      
      // Prikaži uspjeh
      setSuccess(true);
      
      // Store the new work order ID
      const newWorkOrderId = newWorkOrder.id;
      
      // Short pause before navigating
      setTimeout(() => {
        onClose();
        // Navigate to the work order with status change parameter
        navigate(`/work-orders/${newWorkOrderId}?statusChanged=true`);
      }, 2000);
      
    } catch (error) {
      console.error('Greška pri pretvaranju ponude u nalog:', error);
      alert('Došlo je do greške pri pretvaranju ponude u radni nalog.');
      setIsConverting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-85"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          {success ? (
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-100 sm:mx-0 sm:h-10 sm:w-10">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Ponuda pretvorena u NACRT radnog naloga
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">
                      Kreiran je nacrt radnog naloga {newOrderNumber} iz ponude {quote.quoteNumber}.
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      Pregledajte podatke i kliknite "Izdaj pravi nalog" kako bi se materijali skinuli sa skladišta i pokrenula proizvodnja.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-purple-100 sm:mx-0 sm:h-10 sm:w-10">
                    <FileText className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Pretvori ponudu u radni nalog
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        <strong>Jeste li sigurni da želite pretvoriti ovu ponudu u radni nalog?</strong><br/>
                        Ova akcija će kreirati novi radni nalog sa svim stavkama iz ponude.
                      </p>
                      
                      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-start">
                          <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-yellow-800">🚨 Važne napomene:</h4>
                            <ul className="mt-1 text-sm text-yellow-700 list-disc list-inside space-y-1">
                              <li>Radni nalog će biti kreiran kao nacrt</li>
                              <li>Materijali neće biti skinuti sa skladišta dok ne potvrdite nalog</li>
                              <li>Ponuda će biti označena kao "Pretvorena u nalog"</li>
                              <li>Ponuda se više neće moći uređivati</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <h4 className="text-sm font-medium text-green-800 mb-2">✅ Prednosti pretvaranja plaćene ponude u nalog:</h4>
                        <ul className="text-sm text-green-700 list-disc list-inside space-y-1">
                          <li>Automatsko prenošenje svih stavki iz plaćene ponude</li>
                          <li>Prenose se svi odabrani procesi i materijali</li>
                          <li>Poveznica između ponude i naloga ostaje sačuvana</li>
                          <li>Lakša naplata i praćenje izvršenja</li>
                        </ul>
                      </div>
                    
                      {quote.acceptedAt && (
                        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <h4 className="text-sm font-medium text-blue-800 mb-2">💰 Informacije o plaćanju:</h4>
                          <div className="text-sm text-blue-700">
                            <p>Ponuda je označena kao plaćena {new Date(quote.paymentDate || quote.acceptedAt).toLocaleDateString('hr-HR')} {new Date(quote.paymentDate || quote.acceptedAt).toLocaleTimeString('hr-HR')}</p>
                            <p className="mt-1 text-xs">Ukupan iznos: {quote.grandTotal.toLocaleString('hr-HR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleConvert}
                  disabled={isConverting}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-purple-600 text-base font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isConverting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Pretvaranje...
                    </>
                  ) : (
                    '✅ Pretvori u nalog'
                  )}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isConverting}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Odustani
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConvertToOrderModal;
