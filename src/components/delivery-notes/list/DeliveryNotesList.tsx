import React, { useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Printer, Download, FileText, CheckCircle, Clock, Receipt } from 'lucide-react';
import { DeliveryNote, WorkOrder, Client } from '../../../types';
import StatusDropdown from './StatusDropdown';

interface DeliveryNotesListProps {
  filteredDeliveryNotes: DeliveryNote[];
  workOrders: WorkOrder[];
  clients: Client[];
  onViewDeliveryNote: (noteId: string) => void;
  openDropdownId: string | null;
  toggleDropdown: (noteId: string, event: React.MouseEvent) => void;
  handleStatusChange: (noteId: string, status: 'draft' | 'generated' | 'delivered' | 'invoiced') => void;
  dropdownPosition: { top: number; left: number } | null;
}

const DeliveryNotesList: React.FC<DeliveryNotesListProps> = ({
  filteredDeliveryNotes,
  workOrders,
  clients,
  onViewDeliveryNote,
  openDropdownId,
  toggleDropdown,
  handleStatusChange,
  dropdownPosition
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        // Close the dropdown if clicking outside
        if (openDropdownId) {
          setTimeout(() => {
            toggleDropdown(openDropdownId, event as unknown as React.MouseEvent);
          }, 0);
        }
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdownId, toggleDropdown]);

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'draft': 
        return { 
          color: 'bg-gray-100 text-gray-800 border-gray-200', 
          icon: FileText,
          text: 'Nacrt',
          dotColor: 'bg-gray-400'
        };
      case 'generated': 
        return { 
          color: 'bg-blue-100 text-blue-800 border-blue-200', 
          icon: Clock,
          text: 'Generirana',
          dotColor: 'bg-blue-500'
        };
      case 'delivered': 
        return { 
          color: 'bg-green-100 text-green-800 border-green-200', 
          icon: CheckCircle,
          text: 'Isporučena',
          dotColor: 'bg-green-500'
        };
      case 'invoiced': 
        return { 
          color: 'bg-purple-100 text-purple-800 border-purple-200', 
          icon: Receipt,
          text: 'Izdan račun',
          dotColor: 'bg-purple-500'
        };
      default: 
        return { 
          color: 'bg-gray-100 text-gray-800 border-gray-200', 
          icon: Clock,
          text: status,
          dotColor: 'bg-gray-400'
        };
    }
  };

  // KLJUČNO: Funkcija za rukovanje klikom na broj otpremnice
  const handleDeliveryNumberClick = (noteId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    navigate(`/delivery-notes/${noteId}`);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Otpremnica
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Radni nalog
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Klijent
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stavke
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Datum
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Akcije
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredDeliveryNotes.map((note) => {
              const workOrder = workOrders.find(wo => wo.id === note.workOrderId);
              const client = clients.find(c => c.id === note.clientId);
              const statusConfig = getStatusConfig(note.status);
              const StatusIcon = statusConfig.icon;
              
              return (
                <tr key={note.id} className="hover:bg-gray-50" onClick={() => onViewDeliveryNote(note.deliveryNumber)}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {/* KLJUČNO: Broj otpremnice je gumb koji vodi na detalje */}
                    <button
                      onClick={(e) => handleDeliveryNumberClick(note.id, e)}
                      className="text-sm font-medium text-gray-900 hover:text-black hover:underline transition-colors focus:outline-none rounded px-1 py-0.5"
                      title="Kliknite za pregled otpremnice"
                    >
                      {note.deliveryNumber}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{workOrder?.orderNumber || 'N/A'}</div>
                    {/* KLJUČNO: Prikaži status radnog naloga */}
                    {workOrder && (
                      <div className={`text-xs px-2 py-1 rounded-full inline-block mt-1 ${
                        workOrder.status === 'completed' ? 'bg-green-100 text-green-800' :
                        workOrder.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {workOrder.status === 'completed' ? 'Završen' :
                         workOrder.status === 'in-progress' ? 'U tijeku' : 'Na čekanju'}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {client ? client.name : 'Nepoznat klijent'}
                    </div>
                    {client && (
                      <div className="text-sm text-gray-500">
                        {client.type === 'company' ? 'Tvrtka' : 'Fizička osoba'}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {note.items.length} {note.items.length === 1 ? 'stavka' : 'stavki'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {note.items.reduce((total, item) => total + item.quantity, 0)} kom
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="relative">
                      <div className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium border ${statusConfig.color}`}>
                        <div className={`w-2 h-2 rounded-full mr-2 ${statusConfig.dotColor}`}></div>
                        <StatusIcon className="h-4 w-4 mr-2" />
                        <span>{statusConfig.text}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>{new Date(note.createdAt).toLocaleDateString('hr-HR')}</div>
                    {note.deliveredAt && (
                      <div className="text-xs text-green-600 font-medium">
                        Isporučeno: {new Date(note.deliveredAt).toLocaleDateString('hr-HR')}
                      </div>
                    )}
                    {note.invoicedAt && (
                      <div className="text-xs text-purple-600 font-medium">
                        Račun: {note.invoiceNumber || 'Br.'} ({new Date(note.invoicedAt).toLocaleDateString('hr-HR')})
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/delivery-notes/${note.id}`);
                        }}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded"
                        title="Pregled"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={(e) => e.stopPropagation()}
                        className="text-green-600 hover:text-green-900 p-1 rounded"
                        title="Ispiši"
                      >
                        <Printer className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={(e) => e.stopPropagation()}
                        className="text-purple-600 hover:text-purple-900 p-1 rounded"
                        title="Preuzmi PDF"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {filteredDeliveryNotes.length === 0 && (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Nema otpremnica</h3>
          <p className="mt-1 text-sm text-gray-500">
            Nema otpremnica koje odgovaraju filtrima.
          </p>
        </div>
      )}

      {/* Status Dropdown - Fixed position */}
      {openDropdownId && dropdownPosition && (
        <StatusDropdown
          ref={dropdownRef}
          dropdownPosition={dropdownPosition}
          onStatusChange={(status) => handleStatusChange(openDropdownId, status)}
          currentStatus={filteredDeliveryNotes.find(note => note.id === openDropdownId)?.status || 'generated'}
        />
      )}
    </div>
  );
};

export default DeliveryNotesList;
