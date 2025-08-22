import React from 'react';
import { Plus } from 'lucide-react';

interface HeaderProps {
  onCreateNew: () => void;
}

const Header: React.FC<HeaderProps> = ({ onCreateNew }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Radni nalozi</h1>
        <p className="text-gray-600">Upravljanje proizvodnim nalozima</p>
      </div>
      <button
        onClick={onCreateNew}
        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
      >
        <Plus className="h-4 w-4 mr-2" />
        Kreiraj nalog
      </button>
    </div>
  );
};

export default Header;
