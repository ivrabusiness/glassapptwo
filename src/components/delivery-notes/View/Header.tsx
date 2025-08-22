import React from 'react';
import { ArrowLeft, Printer, Download } from 'lucide-react';
import { DeliveryNote, WorkOrder, Client } from '../../../types';

interface HeaderProps {
  deliveryNote: DeliveryNote;
  workOrder: WorkOrder;
  client: Client;
  onBack: () => void;
  onPrint: () => void;
}

const Header: React.FC<HeaderProps> = ({ deliveryNote, workOrder, client, onBack, onPrint }) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'draft': 
        return { 
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          textColor: 'text-gray-800'
        };
      case 'generated': 
        return { 
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          textColor: 'text-blue-800'
        };
      case 'delivered': 
        return { 
          color: 'bg-green-100 text-green-800 border-green-200',
          textColor: 'text-green-800'
        };
      case 'invoiced': 
        return { 
          color: 'bg-purple-100 text-purple-800 border-purple-200',
          textColor: 'text-purple-800'
        };
      default: 
        return { 
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          textColor: 'text-gray-800'
        };
    }
  };

  const statusConfig = getStatusConfig(deliveryNote.status);
  
  const getWorkOrderStatusConfig = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getWorkOrderStatusText = (status: string) => {
    switch (status) {
      case 'draft': return 'Nacrt';
      case 'pending': return 'Na čekanju';
      case 'in-progress': return 'U tijeku';
      case 'completed': return 'Završen';
      case 'cancelled': return 'Otkazan';
      default: return status;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between">
        <div className="flex items-start space-x-4">
          <button
            onClick={onBack}
            className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
            title="Povratak na popis"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          
          <div className="space-y-1 min-w-0">
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-gray-900">Otpremnica {deliveryNote.deliveryNumber}</h1>
              <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${statusConfig.color}`}>
                {deliveryNote.status === 'draft' ? 'Nacrt' : 
                 deliveryNote.status === 'generated' ? 'Generirana' : 
                 deliveryNote.status === 'delivered' ? 'Isporučena' : 
                 deliveryNote.status === 'invoiced' ? 'Izdan račun' : deliveryNote.status}
              </span>
            </div>
            

          </div>
        </div>
        
        <div className="flex space-x-3 mt-4 md:mt-0">
          <button
            onClick={() => {/* TODO: Download functionality */}}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="h-4 w-4 mr-2" />
            Preuzmi PDF
          </button>
          <button
            onClick={onPrint}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
          >
            <Printer className="h-4 w-4 mr-2" />
            Ispiši
          </button>
        </div>
      </div>
      
      {/* Additional information based on status */}
      {deliveryNote.status === 'delivered' && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-green-600 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <div>
              <p className="text-sm font-medium text-green-800">
                Otpremnica je isporučena {deliveryNote.deliveredAt ? new Date(deliveryNote.deliveredAt).toLocaleDateString('hr-HR') : ''}
              </p>
              {deliveryNote.receivedBy && (
                <p className="text-sm text-green-700">
                  Preuzeo/la: {deliveryNote.receivedBy}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
      
      {deliveryNote.status === 'invoiced' && (
        <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-purple-600 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            <div>
              <p className="text-sm font-medium text-purple-800">
                Izdan račun {deliveryNote.invoiceNumber} dana {deliveryNote.invoicedAt ? new Date(deliveryNote.invoicedAt).toLocaleDateString('hr-HR') : ''}
              </p>
              <p className="text-sm text-purple-700">
                Otpremnica je fakturirana u sustavu.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Header;
