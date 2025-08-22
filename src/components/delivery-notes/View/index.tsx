import React, { useState } from 'react';
import { FileText } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSupabaseData } from '../../../hooks/useSupabaseData';
import { DeliveryNote, WorkOrder, Client, Product } from '../../../types';
import { supabase } from '../../../lib/supabase';
import PDFService from '../../../services/PDFService';
import { useAuth } from '../../../contexts/AuthContext';
import Header from './Header';
import Timeline from './Timeline';
import ClientInfo from './ClientInfo';
import Items from './Items';
import StatusActions from './StatusActions';
import NotesSection from './NotesSection';
import InvoiceModal from '../InvoiceModal';
import DeliveryConfirmationModal from '../DeliveryConfirmationModal';
import CustomAlert from '../../common/CustomAlert';

interface DeliveryNoteViewProps {
  deliveryNoteId?: string;
  onBack: () => void;
}

const DeliveryNoteView: React.FC<DeliveryNoteViewProps> = ({ deliveryNoteId, onBack }) => {
  const params = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const id = deliveryNoteId || params.id;
  const [deliveryNotes, setDeliveryNotes] = useSupabaseData<DeliveryNote>('delivery_notes', []);
  const [workOrders, setWorkOrders] = useSupabaseData<WorkOrder>('work_orders', []);
  const [clients] = useSupabaseData<Client>('clients', []);
  const [products] = useSupabaseData<Product>('products', []);
  
  const [isLoading, setIsLoading] = useState(true);
  
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showDeliveryConfirmationModal, setShowDeliveryConfirmationModal] = useState(false);
  
  // Success message state
  const [successMessage, setSuccessMessage] = useState<{
    title: string;
    message: string;
    show: boolean;
  }>({ title: '', message: '', show: false });

  // Simulate loading
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);

  const handleViewWorkOrder = () => {
    if (workOrder) {
      navigate(`/work-orders/${workOrder.orderNumber}`);
    }
  };

  const deliveryNote = deliveryNotes.find(note => note.id === id || note.deliveryNumber === id);
  const workOrder = deliveryNote ? workOrders.find(wo => wo.id === deliveryNote.workOrderId) : null;
  const client = deliveryNote ? clients.find(c => c.id === deliveryNote.clientId) : null;
  
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

  const handleBack = () => {
    navigate('/delivery-notes');
    onBack();
  };

  if (!deliveryNote || !workOrder || !client) {
    return (
      <div className="text-center py-12">
        <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900">Otpremnica nije pronađena ili je došlo do greške pri učitavanju</h3>
        <button onClick={handleBack} className="mt-4 text-blue-600 hover:text-blue-900">
          ← Povratak na listu
        </button>
      </div>
    );
  }

  // Function for direct printing
  const handlePrint = () => {
    if (deliveryNote && workOrder && client) {
      try {
        PDFService.generateDeliveryNotePDF(deliveryNote, workOrder, client, products, user);
      } catch (error) {
        console.error('Error printing delivery note:', error);
        alert('Greška pri printanju otpremnice. Molimo pokušajte ponovo.');
      }
    }
  };

  // Function for direct download
  const handleDownload = () => {
    if (deliveryNote && workOrder && client) {
      try {
        PDFService.downloadDeliveryNotePDF(deliveryNote, workOrder, client, products, user);
      } catch (error) {
        console.error('Error downloading delivery note PDF:', error);
        alert('Greška pri preuzimanju PDF-a otpremnice. Molimo pokušajte ponovo.');
      }
    }
  };

  // Function to handle status change
  const handleStatusChange = async (newStatus: 'draft' | 'generated' | 'delivered' | 'invoiced') => {
    // If new status is "invoiced", show invoice modal
    if (newStatus === 'invoiced') {
      setShowInvoiceModal(true);
      return;
    }
    
    // If new status is "delivered", show delivery confirmation modal
    if (newStatus === 'delivered') {
      setShowDeliveryConfirmationModal(true);
      return;
    }
    
    // For other statuses (draft, generated), update directly
    const updatedNote = { ...deliveryNote!, status: newStatus };
    
    // Clean up data based on status (only draft/generated reach here)
    if (newStatus === 'generated') {
      // Remove delivery and invoice data
      delete updatedNote.deliveredAt;
      delete updatedNote.deliveredBy;
      delete updatedNote.invoicedAt;
      delete updatedNote.invoiceNumber;
    }
    
    // Save the delivery note first
    await setDeliveryNotes(prev => prev.map(note =>
      note.id === id ? updatedNote : note
    ));
    
    // Note: 'delivered' and 'invoiced' statuses are handled by modals above
  };

  // Handle invoice confirmation
  const handleInvoiceConfirm = async (invoiceNumber: string) => {
    setShowInvoiceModal(false);
    
    const updatedNote = { 
      ...deliveryNote, 
      status: 'invoiced' as const,
      invoicedAt: new Date().toISOString(),
      invoiceNumber: invoiceNumber 
    };
    
    try {
      // Spremi u Supabase bazu
      const { error } = await supabase
        .from('delivery_notes')
        .update({
          status: 'invoiced',
          invoiced_at: new Date().toISOString(),
          invoice_number: invoiceNumber
        })
        .eq('id', deliveryNote.id);

      if (error) {
        console.error('Error updating delivery note in database:', error);
        alert('Greška pri spremanju u bazu podataka.');
        return;
      }

      // Ažuriraj stanje u aplikaciji (Supabase je već ažuriran)
      setDeliveryNotes(prev => prev.map(note => 
        note.id === deliveryNote.id ? updatedNote : note
      ));
      
      // Show success message
      setSuccessMessage({
        title: 'Otpremnica fakturirana!',
        message: `Otpremnica ${deliveryNote.deliveryNumber} je uspješno označena kao fakturirana.\n\nBroj računa: ${invoiceNumber}`,
        show: true
      });
    } catch (error) {
      console.error('Error updating delivery note:', error);
      alert('Greška pri spremanju broja računa.');
    }
  };

  // Handle delivery confirmation
  const handleDeliveryConfirm = async (receivedBy: string) => {
    setShowDeliveryConfirmationModal(false);
    
    const updatedNote = { 
      ...deliveryNote, 
      status: 'delivered' as const,
      deliveredAt: new Date().toISOString(),
      deliveredBy: 'Ivan Tolić',
      receivedBy: receivedBy
    };

    try {
      // Spremi u Supabase bazu
      const { error } = await supabase
        .from('delivery_notes')
        .update({
          status: 'delivered',
          delivered_at: new Date().toISOString(),
          delivered_by: 'Ivan Tolić',
          received_by: receivedBy
        })
        .eq('id', deliveryNote.id);

      if (error) {
        console.error('Error updating delivery note in database:', error);
        alert('Greška pri spremanju u bazu podataka.');
        return;
      }

      // Update work order status to "completed" if not already
      if (workOrder.status !== 'completed') {
        const updatedWorkOrder = {
          ...workOrder,
          status: 'completed' as const,
          completedAt: new Date().toISOString()
        };
        
        // Save work order changes
        setWorkOrders(prev => prev.map(order => 
          order.id === workOrder.id ? updatedWorkOrder : order
        ));
      }
      
      // Save delivery note changes
      setDeliveryNotes(prev => prev.map(note => 
        note.id === deliveryNote.id ? updatedNote : note
      ));
      
      // Show success message
      setSuccessMessage({
        title: 'Otpremnica isporučena!',
        message: `Otpremnica ${deliveryNote.deliveryNumber} je uspješno označena kao isporučena.\n\nRadni nalog ${workOrder.orderNumber} je automatski označen kao ZAVRŠEN.`,
        show: true
      });
    } catch (error) {
      console.error('Error updating delivery note:', error);
      alert('Greška pri spremanju podataka o isporuci.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Header 
        deliveryNote={deliveryNote}
        workOrder={workOrder}
        client={client!}
        onBack={handleBack}
        onPrint={handlePrint}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Full-width content on mobile, 2/3 on desktop */}
        <div className="lg:col-span-2 space-y-5">
          {/* Client Info */}
          <ClientInfo client={client} />

          {/* Items */}
          <Items items={deliveryNote!.items} products={products} />
          
          {/* Notes Section */}
          {(workOrder.notes || deliveryNote.notes) && (
            <NotesSection 
              workOrderNotes={workOrder.notes}
              deliveryNoteNotes={deliveryNote.notes}
              onViewWorkOrder={handleViewWorkOrder}
            />
          )}
        </div>
        
        {/* Sidebar - Full-width on mobile, 1/3 on desktop */}
        <div className="space-y-6">
          {/* Compact Timeline in Sidebar */}
          <Timeline deliveryNote={deliveryNote!} compact={true} />
          
          {/* Status Actions */}
          <StatusActions 
            deliveryNote={deliveryNote!} 
            workOrder={workOrder!}
            onViewWorkOrder={handleViewWorkOrder}
            onStatusChange={handleStatusChange}
            onPrint={handlePrint}
            onDownload={handleDownload}
          />
        </div>
      </div>

      {/* Invoice Modal */}
      {showInvoiceModal && (
        <InvoiceModal
          isOpen={showInvoiceModal}
          onClose={() => setShowInvoiceModal(false)}
          onConfirm={handleInvoiceConfirm}
          deliveryNumber={deliveryNote!.deliveryNumber}
        />
      )}

      {/* Delivery Confirmation Modal */}
      {showDeliveryConfirmationModal && (
        <DeliveryConfirmationModal
          isOpen={showDeliveryConfirmationModal}
          onClose={() => setShowDeliveryConfirmationModal(false)}
          onConfirm={handleDeliveryConfirm}
          deliveryNumber={deliveryNote!.deliveryNumber}
        />
      )}

      {/* Success Alert */}
      <CustomAlert
        isOpen={successMessage.show}
        onClose={() => setSuccessMessage({ title: '', message: '', show: false })}
        title={successMessage.title}
        message={successMessage.message}
        type="success"
      />
    </div>
  );
};

export default DeliveryNoteView;
