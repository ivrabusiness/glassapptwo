import React from 'react';
import { Plus } from 'lucide-react';

interface ServiceHeaderProps {
  onCreateNew?: () => void;
}

const ServiceHeader: React.FC<ServiceHeaderProps> = ({ onCreateNew }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Usluge</h1>
        <p className="text-gray-600">Upravljanje uslugama koje nudite klijentima</p>
      </div>
      <button
        onClick={onCreateNew}
        className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
      >
        <Plus className="h-4 w-4 mr-2" />
        Dodaj uslugu
      </button>
    </div>
  );
};

export default ServiceHeader;
