import React from 'react';
import { DeliveryNote, WorkOrder } from '../../../types';
import { Printer, Download, CheckCircle, Receipt, ExternalLink } from 'lucide-react';

interface StatusActionsProps {
  deliveryNote: DeliveryNote;
  workOrder: WorkOrder;
  onViewWorkOrder: () => void;
  onStatusChange: (status: 'draft' | 'generated' | 'delivered' | 'invoiced') => void;
  onPrint: () => void;
  onDownload: () => void;
}

const StatusActions: React.FC<StatusActionsProps> = ({
  deliveryNote, 
  workOrder,
  onViewWorkOrder,
  onStatusChange,
  onPrint,
  onDownload
}) => {
  const canMarkAsDelivered = deliveryNote.status === 'generated';
  const canMarkAsInvoiced = deliveryNote.status === 'delivered';

  return (
    <div className="space-y-4">
      {/* Status Card */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b border-gray-100">
          Status i akcije
        </h3>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-700">Status:</span>
            <span className={`px-3 py-1.5 rounded-full text-xs font-medium
              ${deliveryNote.status === 'draft' ? 'bg-gray-100 text-gray-800' : 
                deliveryNote.status === 'generated' ? 'bg-blue-100 text-blue-800' : 
                deliveryNote.status === 'delivered' ? 'bg-green-100 text-green-800' : 
                'bg-purple-100 text-purple-800'}`}
            >
              {deliveryNote.status === 'draft' ? 'Nacrt' : 
               deliveryNote.status === 'generated' ? 'Generirana' : 
               deliveryNote.status === 'delivered' ? 'Isporučena' : 
               'Izdan račun'}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-700">Radni nalog:</span>
            <span className={`px-3 py-1.5 rounded-full text-xs font-medium
              ${workOrder.status === 'draft' ? 'bg-gray-100 text-gray-800' : 
                workOrder.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                workOrder.status === 'in-progress' ? 'bg-blue-100 text-blue-800' : 
                workOrder.status === 'completed' ? 'bg-green-100 text-green-800' : 
                'bg-red-100 text-red-800'}`}
            >
              {workOrder.status === 'draft' ? 'Nacrt' : 
               workOrder.status === 'pending' ? 'Na čekanju' : 
               workOrder.status === 'in-progress' ? 'U tijeku' : 
               workOrder.status === 'completed' ? 'Završen' : 
               'Otkazan'}
            </span>
          </div>
          
          {deliveryNote.deliveredAt && (
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Isporučeno:</span>
              <span className="text-gray-900 font-medium">
                {new Date(deliveryNote.deliveredAt).toLocaleDateString('hr-HR')}
              </span>
            </div>
          )}
          
          {deliveryNote.invoicedAt && (
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Datum računa:</span>
              <span className="text-gray-900 font-medium">
                {new Date(deliveryNote.invoicedAt).toLocaleDateString('hr-HR')}
              </span>
            </div>
          )}
          
          {deliveryNote.invoiceNumber && (
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Broj računa:</span>
              <span className="bg-purple-50 px-2 py-1 rounded text-purple-700 font-medium">
                {deliveryNote.invoiceNumber}
              </span>
            </div>
          )}
          
          {/* Status Actions */}
          <div className="pt-4 border-t border-gray-100 space-y-3">
            {canMarkAsDelivered && (
              <button
                onClick={() => onStatusChange('delivered')}
                className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Označi kao isporučeno
              </button>
            )}
            
            {canMarkAsInvoiced && (
              <button
                onClick={() => onStatusChange('invoiced')}
                className="w-full flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Receipt className="h-4 w-4 mr-2" />
                Unesi broj računa
              </button>
            )}
            
            {deliveryNote.status === 'invoiced' && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700">
                  <span className="font-medium">✅ Otpremnica je potpuno završena.</span> Uspješno je isporučena klijentu i izdan je račun.
                </p>
              </div>
            )}
            
            {deliveryNote.status !== 'invoiced' && deliveryNote.status !== 'delivered' && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700">
                  <span className="font-medium">ℹ️ Sljedeći koraci:</span> Kada isporučite robu klijentu, označite otpremnicu kao isporučenu. Nakon izdavanja računa, unesite broj računa iz MINIMAX sustava.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Document Actions */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b border-gray-100">
          Akcije dokumenta
        </h3>
        
        <div className="space-y-3">
          <button
            className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            onClick={onPrint}
          >
            <Printer className="h-4 w-4 mr-2" />
            Ispiši otpremnicu
          </button>
          <button
            className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            onClick={onDownload}
          >
            <Download className="h-4 w-4 mr-2" />
            Preuzmi PDF
          </button>
          <button
            className="w-full flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            onClick={onViewWorkOrder}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Pregledaj radni nalog
          </button>
        </div>
      </div>
      
      {/* Info Card */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b border-gray-100">
          Informacije
        </h3>
        
        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-gray-700">Broj otpremnice:</span>
            <span className="font-medium">{deliveryNote.deliveryNumber}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-700">Datum kreiranja:</span>
            <span className="font-medium">{new Date(deliveryNote.createdAt).toLocaleDateString('hr-HR')}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-700">Broj radnog naloga:</span>
            <span className="font-medium">{workOrder.orderNumber}</span>
          </div>
          
          <div className="pt-3 mt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Otpremnica je automatski generirana iz radnog naloga. Promjenom statusa otpremnice utječete i na status povezanog radnog naloga.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatusActions;
