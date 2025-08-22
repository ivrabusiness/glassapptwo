import React from 'react';
import { FileText, Edit, Trash2, Euro, Clock } from 'lucide-react';
import { Service } from '../../types';

interface ServiceItemProps {
  service: Service;
  onEdit: () => void;
  setServices: React.Dispatch<React.SetStateAction<Service[]>>;
}

const ServiceItem: React.FC<ServiceItemProps> = ({ 
  service, 
  onEdit,
  setServices
}) => {
  const handleDelete = () => {
    if (confirm('Jeste li sigurni da želite obrisati ovu uslugu?')) {
      setServices(prev => prev.filter(s => s.id !== service.id));
    }
  };

  const getUnitLabel = (unit: string): string => {
    switch (unit) {
      case 'hour': return 'sat';
      case 'piece': return 'komad';
      case 'square_meter': return 'm²';
      case 'linear_meter': return 'm';
      default: return unit;
    }
  };

  return (
    <div className="p-6 hover:bg-gray-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-purple-500 mr-3" />
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-medium text-gray-900">{service.name}</h3>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  {service.code}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">{service.description}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded-md flex items-center">
                  <Euro className="h-3 w-3 mr-1" />
                  {service.price.toFixed(2)} €/{getUnitLabel(service.unit)}
                </span>
                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-800 rounded-md flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  Jedinica: {getUnitLabel(service.unit)}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={onEdit}
            className="text-purple-600 hover:text-purple-900 p-2 rounded"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={handleDelete}
            className="text-red-600 hover:text-red-900 p-2 rounded"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServiceItem;
