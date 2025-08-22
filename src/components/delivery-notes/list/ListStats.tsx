import React from 'react';
import { FileText, Clock, CheckCircle, Receipt, Filter } from 'lucide-react';
import { DeliveryNote } from '../../../types';

interface ListStatsProps {
  filteredDeliveryNotes: DeliveryNote[];
}

const ListStats: React.FC<ListStatsProps> = ({ filteredDeliveryNotes }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center">
          <div className="p-3 rounded-lg bg-blue-50">
            <FileText className="h-6 w-6 text-blue-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Ukupno</p>
            <p className="text-2xl font-semibold text-gray-900">{filteredDeliveryNotes.length}</p>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center">
          <div className="p-3 rounded-lg bg-yellow-50">
            <Clock className="h-6 w-6 text-amber-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Čeka račun</p>
            <p className="text-2xl font-semibold text-gray-900">
              {filteredDeliveryNotes.filter(note => note.status !== 'invoiced').length}
            </p>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center">
          <div className="p-3 rounded-lg bg-green-50">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Isporučene</p>
            <p className="text-2xl font-semibold text-gray-900">
              {filteredDeliveryNotes.filter(note => note.status === 'delivered').length}
            </p>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center">
          <div className="p-3 rounded-lg bg-purple-50">
            <Receipt className="h-6 w-6 text-purple-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Izdan račun</p>
            <p className="text-2xl font-semibold text-gray-900">
              {filteredDeliveryNotes.filter(note => note.status === 'invoiced').length}
            </p>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center">
          <div className="p-3 rounded-lg bg-indigo-50">
            <Filter className="h-6 w-6 text-indigo-600" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-600">Filtrirano</p>
            <p className="text-2xl font-semibold text-gray-900">
              {filteredDeliveryNotes.length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListStats;
