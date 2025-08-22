import React from 'react';
import { Package, AlertTriangle, CheckCircle, Euro, Calendar, Clock } from 'lucide-react';
import { InventoryItem } from '../../../types';

interface ItemDetailsProps {
  item: InventoryItem;
}

const ItemDetails: React.FC<ItemDetailsProps> = ({ item }) => {
  // Izračun vrijednosti artikla
  const itemValue = item.quantity * item.price;
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 print:p-4 print:border-0 print:shadow-none">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
        {/* Osnovni podaci */}
        <div className="flex items-start space-x-4">
          <div className={`p-3 rounded-lg ${
            item.quantity <= item.minQuantity 
              ? 'bg-red-100' 
              : 'bg-gray-100'
          }`}>
            <Package className={`h-8 w-8 ${
              item.quantity <= item.minQuantity 
                ? 'text-red-600' 
                : 'text-gray-600'
            }`} />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold text-gray-900">{item.name}</h2>
              <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded">
                {item.code}
              </span>
            </div>
            <div className="mt-1 flex items-center space-x-3">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                item.type === 'glass' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {item.type === 'glass' ? 'Staklo' : 'Ostalo'}
              </span>
              {item.type === 'glass' && item.glassThickness && (
                <span className="text-sm text-blue-600 font-medium">
                  {item.glassThickness} mm
                </span>
              )}
              <span className="text-sm text-gray-500">
                Jedinica mjere: <span className="font-medium">{item.unit}</span>
              </span>
            </div>
            <div className="mt-2 flex items-center text-sm text-gray-500">
              <Calendar className="h-4 w-4 mr-1" />
              <span>Kreirano: {new Date(item.createdAt).toLocaleDateString('hr-HR')}</span>
            </div>
          </div>
        </div>
        
        {/* Statistika */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:grid-cols-4">
          <div className="bg-gray-50 p-3 rounded-lg print:bg-gray-100">
            <div className="text-sm text-gray-500">Trenutno stanje</div>
            <div className="text-xl font-bold text-gray-900">{item.quantity.toFixed(item.unit === 'kom' ? 0 : 4)} {item.unit}</div>
          </div>
          
          <div className="bg-gray-50 p-3 rounded-lg print:bg-gray-100">
            <div className="text-sm text-gray-500">Min. količina</div>
            <div className="text-xl font-bold text-gray-900">{item.minQuantity.toFixed(item.unit === 'kom' ? 0 : 4)} {item.unit}</div>
          </div>
          
          <div className="bg-gray-50 p-3 rounded-lg print:bg-gray-100">
            <div className="text-sm text-gray-500">Cijena</div>
            <div className="text-xl font-bold text-gray-900">{item.price.toFixed(2)} €/{item.unit}</div>
          </div>
          
          <div className="bg-gray-50 p-3 rounded-lg print:bg-gray-100">
            <div className="text-sm text-gray-500">Vrijednost</div>
            <div className="flex items-center">
              <Euro className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-xl font-bold text-green-600">
                {itemValue.toLocaleString('hr-HR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Status zalihe */}
      <div className="mt-4 flex flex-wrap items-center gap-4">
        {item.quantity <= item.minQuantity ? (
          <div className="flex items-center px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            <span className="font-medium text-red-800">
              {item.quantity === 0 ? 'Nema zalihe' : 'Niska zaliha'}
            </span>
          </div>
        ) : (
          <div className="flex items-center px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            <span className="font-medium text-green-800">Dostupno</span>
          </div>
        )}
        
        <div className="flex items-center px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
          <Clock className="h-5 w-5 text-blue-600 mr-2" />
          <span className="font-medium text-blue-800">
            Razlika: {(item.quantity - item.minQuantity).toFixed(2)} {item.unit}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ItemDetails;
