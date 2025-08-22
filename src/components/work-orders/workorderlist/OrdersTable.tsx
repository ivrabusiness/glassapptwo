import React from 'react';
import { Eye, Printer, Download, Edit, Lock, Archive as ArchiveIcon } from 'lucide-react';
import type { OrdersTableProps, WorkOrder } from './types';
import { getStatusColor, getStatusIcon, getStatusText, getProcessCompletion, formatDimensions, getTotalArea, getTotalItems, getDeliveryNoteConfig } from './helpers';

const canEditOrder = (order: WorkOrder) => order.status === 'draft';

const OrdersTable: React.FC<OrdersTableProps> = ({ orders, clients, deliveryNotes, onEditOrder, onViewOrder, onRequestArchive }) => {
  const getDeliveryNoteForOrder = (orderId: string) => deliveryNotes.find(note => note.workOrderId === orderId);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nalog</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Klijent</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Artikli</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dimenzije</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ukupno</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Datum</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Akcije</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.map((order) => {
              const client = order.clientId ? clients.find(c => c.id === order.clientId) : null;
              const StatusIcon = getStatusIcon(order.status);
              const items = order.items || [];
              const deliveryNote = getDeliveryNoteForOrder(order.id);
              const isEditable = canEditOrder(order);
              const isArchived = order.status === 'archived';

              return (
                <tr key={order.id} className="hover:bg-gray-50" onClick={() => onViewOrder(order.orderNumber)}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-blue-600">{order.orderNumber}</div>
                    {deliveryNote && (() => {
                      const config = getDeliveryNoteConfig(deliveryNote.status);
                      const DeliveryIcon = config.icon;
                      return (
                        <div className="flex items-center mt-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${config.color}`}>
                            <DeliveryIcon className="h-3 w-3 mr-1" />
                            {deliveryNote.deliveryNumber}
                          </span>
                        </div>
                      );
                    })()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{client ? client.name : 'Bez klijenta'}</div>
                    {client && (
                      <div className="text-sm text-gray-500">{client.type === 'company' ? 'Tvrtka' : 'Fizička osoba'}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{items.length} {items.length === 1 ? 'proizvod' : 'proizvoda'}</div>
                    <div className="text-sm text-gray-500">{getTotalItems(order)} kom</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatDimensions(order)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{getTotalArea(order).toFixed(4)} m²</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {(() => {
                      if (order.status === 'completed' || order.status === 'cancelled' || order.status === 'draft' || order.status === 'archived') {
                        return (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {getStatusText(order.status)}
                          </span>
                        );
                      }
                      const { completed, total, percentage } = getProcessCompletion(order);
                      return (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className={`text-xs font-medium ${
                              percentage === 100 ? 'text-green-600' : percentage > 50 ? 'text-blue-600' : 'text-amber-600'
                            }`}>
                              {completed}/{total} ({percentage}%)
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${
                              percentage === 100 ? 'bg-green-500' : percentage > 50 ? 'bg-blue-500' : 'bg-amber-500'
                            }`} style={{ width: `${percentage}%` }} />
                          </div>
                        </div>
                      );
                    })()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>{new Date(order.createdAt).toLocaleDateString('hr-HR')}</div>
                    {order.completedAt && (
                      <div className="text-xs text-green-600 font-medium">
                        Završen: {new Date(order.completedAt).toLocaleDateString('hr-HR')}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); if (isEditable) onEditOrder(order.id); }}
                        className={`p-1 rounded transition-colors ${isEditable ? 'text-blue-600 hover:text-blue-900' : 'text-gray-300 cursor-not-allowed'}`}
                        title={isEditable ? 'Uredi nalog' : `Nalog se ne može uređivati (status: ${getStatusText(order.status)})`}
                      >
                        {isEditable ? <Edit className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onViewOrder(order.orderNumber); }}
                        className="text-green-600 hover:text-green-900 p-1 rounded"
                        title="Pregled"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); if (!isArchived) onRequestArchive(order); }}
                        className={`p-1 rounded ${isArchived ? 'text-gray-300 cursor-not-allowed' : 'text-amber-600 hover:text-amber-900'}`}
                        title={isArchived ? 'Nalog je već arhiviran' : 'Arhiviraj nalog'}
                      >
                        <ArchiveIcon className="h-4 w-4" />
                      </button>
                      <button onClick={(e) => e.stopPropagation()} className="text-gray-600 hover:text-gray-900 p-1 rounded" title="Ispiši nalog">
                        <Printer className="h-4 w-4" />
                      </button>
                      <button onClick={(e) => e.stopPropagation()} className="text-purple-600 hover:text-purple-900 p-1 rounded" title="Preuzmi otpremnicu">
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
      {orders.length === 0 && (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400">—</div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Nema naloga</h3>
          <p className="mt-1 text-sm text-gray-500">Pokušajte promijeniti filtere ili kreirati novi nalog.</p>
        </div>
      )}
    </div>
  );
};

export default OrdersTable;
