import React, { useState } from 'react';
import { useSupabaseData } from '../../../hooks/useSupabaseData';
import { DeliveryNote, WorkOrder, Client } from '../../../types';
import ListHeader from './ListHeader';
import DeliveryNotesList from './DeliveryNotesList';
import ListStats from './ListStats';
import Filters from './Filters';
import DeliveryConfirmationModal from '../DeliveryConfirmationModal';
import InvoiceModal from '../InvoiceModal';
import Skeleton from '../../Skeleton';

const DeliveryNoteListContainer: React.FC<{
  onViewDeliveryNote: (noteId: string) => void;
}> = ({ onViewDeliveryNote }) => {
  const [deliveryNotes, setDeliveryNotes] = useSupabaseData<DeliveryNote>('delivery_notes', []);
  const [workOrders, setWorkOrders] = useSupabaseData<WorkOrder>('work_orders', []);
  const [clients] = useSupabaseData<Client>('clients', []);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [currentDeliveryNote, setCurrentDeliveryNote] = useState<DeliveryNote | null>(null);
  const [showDeliveryConfirmationModal, setShowDeliveryConfirmationModal] = useState(false);
  
  // Date filtering
  const [dateFilter, setDateFilter] = useState<{
    year: number;
    month: number | null;
    day: number | null;
  }>({
    year: new Date().getFullYear(),
    month: null,
    day: null
  });

  // Simuliraj učitavanje
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, []);

  const filteredDeliveryNotes = deliveryNotes.filter(note => {
    // Search filter
    const matchesSearch = note.deliveryNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (note.workOrderId && note.workOrderId.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Status filter
    const matchesStatus = statusFilter === 'all' || 
                          (statusFilter === 'awaiting_invoice' ? note.status !== 'invoiced' : note.status === statusFilter);
    
    // Date filter
    const noteDate = new Date(note.createdAt);
    const matchesYear = noteDate.getFullYear() === dateFilter.year;
    const matchesMonth = dateFilter.month === null || noteDate.getMonth() === dateFilter.month - 1;
    const matchesDay = dateFilter.day === null || noteDate.getDate() === dateFilter.day;
    
    return matchesSearch && matchesStatus && matchesYear && matchesMonth && matchesDay;
  });

  // KLJUČNO: Funkcija za rukovanje statusom
  const handleStatusChange = (noteId: string, newStatus: 'draft' | 'generated' | 'delivered' | 'invoiced') => {
    const note = deliveryNotes.find(n => n.id === noteId);
    if (!note) return;
    
    // Ako je novi status "invoiced", prikaži modal za unos broja računa
    if (newStatus === 'invoiced') {
      setCurrentDeliveryNote(note);
      setShowInvoiceModal(true);
      return;
    }
    
    // Ako je novi status "delivered", prikaži modal za potvrdu isporuke
    if (newStatus === 'delivered') {
      setCurrentDeliveryNote(note);
      setShowDeliveryConfirmationModal(true);
      return;
    }

    const workOrder = workOrders.find(wo => wo.id === note.workOrderId);
    if (!workOrder) return;

    const updatedNote = { ...note, status: newStatus };
    
    // Dodaj ili ukloni timestamp ovisno o statusu
    if (newStatus === 'delivered' && !note.deliveredAt) {
      updatedNote.deliveredAt = new Date().toISOString();
      updatedNote.deliveredBy = 'Ivan Tolić';
    } else if (newStatus === 'invoiced' && !note.invoicedAt) {
      updatedNote.invoicedAt = new Date().toISOString();
      if (!note.invoiceNumber) {
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const time = Date.now().toString().slice(-6);
        updatedNote.invoiceNumber = `R${year}${month}${day}-${time}`;
      }
    } else if (newStatus === 'generated') {
      // Ukloni delivery i invoice podatke
      delete updatedNote.deliveredAt;
      delete updatedNote.deliveredBy;
      delete updatedNote.invoicedAt;
    } else if (newStatus === 'delivered') {
      // Ukloni invoice podatke
      delete updatedNote.invoicedAt;
    }
    
    // KLJUČNO: Spremi otpremnicu prvo
    setDeliveryNotes(prev => prev.map(note => 
      note.id === noteId ? updatedNote : note
    ));
    
    // KLJUČNO: Ako je otpremnica označena kao "isporučena", automatski završi radni nalog
    if (newStatus === 'delivered' && workOrder.status !== 'completed') {
      const updatedWorkOrder = {
        ...workOrder,
        status: 'completed' as const,
        completedAt: new Date().toISOString()
      };
      
      setWorkOrders(prev => prev.map(order => 
        order.id === workOrder.id ? updatedWorkOrder : order
      ));
      
      // Prikaži obavijest korisniku
      alert(`✅ Otpremnica ${note.deliveryNumber} označena kao isporučena!\n\n📋 Radni nalog ${workOrder.orderNumber} je automatski označen kao ZAVRŠEN.`);
    }
    
    setOpenDropdownId(null);
    setDropdownPosition(null);
  };

  // Funkcija za potvrdu unosa broja računa
  const handleInvoiceConfirm = (invoiceNumber: string) => {
    // Zatvori modal
    setShowInvoiceModal(false);
    
    // Provjeri da li postoji trenutna otpremnica
    if (!currentDeliveryNote) return;
    
    const workOrder = workOrders.find(wo => wo.id === currentDeliveryNote.workOrderId);
    if (!workOrder) return;
    
    // Kreiraj ažuriranu otpremnicu s novim statusom i brojem računa
    const updatedNote = { 
      ...currentDeliveryNote, 
      status: 'invoiced',
      invoicedAt: new Date().toISOString(),
      invoiceNumber: invoiceNumber 
    };
    
    // Spremi promjene
    setDeliveryNotes(prev => prev.map(note => 
      note.id === currentDeliveryNote.id ? updatedNote : note
    ));
    
    setOpenDropdownId(null);
    setDropdownPosition(null);
  };
  
  // Funkcija za potvrdu isporuke
  const handleDeliveryConfirm = (receivedBy: string) => {
    // Zatvori modal
    setShowDeliveryConfirmationModal(false);
    
    // Provjeri da li postoji trenutna otpremnica
    if (!currentDeliveryNote) return;
    
    const workOrder = workOrders.find(wo => wo.id === currentDeliveryNote.workOrderId);
    if (!workOrder) return;
    
    // Kreiraj ažuriranu otpremnicu s novim statusom i podacima o preuzimatelju
    const updatedNote = { 
      ...currentDeliveryNote, 
      status: 'delivered',
      deliveredAt: new Date().toISOString(),
      deliveredBy: 'Ivan Tolić', // Može se zamijeniti s podacima iz korisničkog profila
      receivedBy: receivedBy
    };
    
    // Ažuriraj status radnog naloga u "completed"
    const updatedWorkOrder = {
      ...workOrder,
      status: 'completed' as const,
      completedAt: new Date().toISOString()
    };
    
    // Spremi promjene
    setDeliveryNotes(prev => prev.map(note => 
      note.id === currentDeliveryNote.id ? updatedNote : note
    ));
    
    setWorkOrders(prev => prev.map(order => 
      order.id === workOrder.id ? updatedWorkOrder : order
    ));
    
    // Prikaži obavijest korisniku
    alert(`✅ Otpremnica ${currentDeliveryNote.deliveryNumber} označena kao isporučena!\n\n📋 Radni nalog ${workOrder.orderNumber} je automatski označen kao ZAVRŠEN.`);
    
    setOpenDropdownId(null);
    setDropdownPosition(null);
  };
  
  // KLJUČNO: Funkcija za toggle dropdown-a
  const toggleDropdown = (noteId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (openDropdownId === noteId) {
      setOpenDropdownId(null);
      setDropdownPosition(null);
    } else {
      const rect = event.currentTarget.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      
      // KLJUČNO: Provjeri ima li dovoljno prostora ispod gumba
      const spaceBelow = window.innerHeight - rect.bottom;
      const dropdownHeight = 250; // Približna visina dropdown-a
      
      // Ako nema dovoljno prostora ispod, prikaži iznad
      const top = spaceBelow < dropdownHeight 
        ? rect.top + scrollTop - dropdownHeight - 10 // Prikaži iznad gumba
        : rect.bottom + scrollTop + 8; // Prikaži ispod gumba
      
      setDropdownPosition({
        top: top,
        left: rect.left + window.pageXOffset
      });
      setOpenDropdownId(noteId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <ListHeader 
        onSearch={setSearchTerm} 
      />

      {/* Filters */}
      <Filters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        dateFilter={dateFilter}
        onDateFilterChange={setDateFilter}
      />

      {/* Statistics Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {[...Array(5)].map((_, index) => (
            <Skeleton key={index} height={120} className="rounded-lg" />
          ))}
        </div>
      ) : (
        <ListStats filteredDeliveryNotes={filteredDeliveryNotes} />
      )}

      {/* Delivery Notes Table */}
      {isLoading ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {['Otpremnica', 'Radni nalog', 'Klijent', 'Stavke', 'Status', 'Datum', 'Akcije'].map((header) => (
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
                      <div className="h-5 bg-gray-200 rounded w-28 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-5 bg-gray-200 rounded w-32 mb-1"></div>
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-5 bg-gray-200 rounded w-32 mb-1"></div>
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-5 bg-gray-200 rounded w-20 mb-1"></div>
                      <div className="h-4 bg-gray-200 rounded w-16"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-6 bg-gray-200 rounded-full w-24"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-5 bg-gray-200 rounded w-24 mb-1"></div>
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <div className="h-6 w-6 bg-gray-200 rounded-full"></div>
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
      ) : (
        <DeliveryNotesList
          filteredDeliveryNotes={filteredDeliveryNotes}
          workOrders={workOrders}
          clients={clients}
          onViewDeliveryNote={onViewDeliveryNote}
          openDropdownId={openDropdownId}
          toggleDropdown={toggleDropdown}
          handleStatusChange={handleStatusChange}
          dropdownPosition={dropdownPosition}
        />
      )}

      {/* Delivery Confirmation Modal */}
      {showDeliveryConfirmationModal && currentDeliveryNote && (
        <DeliveryConfirmationModal
          isOpen={showDeliveryConfirmationModal}
          onClose={() => setShowDeliveryConfirmationModal(false)}
          onConfirm={handleDeliveryConfirm}
          deliveryNumber={currentDeliveryNote.deliveryNumber}
        />
      )}
      
      {/* Invoice Modal */}
      {showInvoiceModal && currentDeliveryNote && (
        <InvoiceModal
          isOpen={showInvoiceModal}
          onClose={() => setShowInvoiceModal(false)}
          onConfirm={handleInvoiceConfirm}
          deliveryNumber={currentDeliveryNote.deliveryNumber}
        />
      )}
    </div>
  );
};

export default DeliveryNoteListContainer;
