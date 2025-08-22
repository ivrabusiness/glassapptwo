import React from 'react';
import { Search } from 'lucide-react';
import type { FiltersProps } from './types';

const Filters: React.FC<FiltersProps> = ({ searchTerm, setSearchTerm, statusFilter, setStatusFilter }) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Pretraži naloge..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <option value="all">Svi statusi</option>
        <option value="draft">Nacrti</option>
        <option value="pending">Na čekanju</option>
        <option value="in-progress">U tijeku</option>
        <option value="completed">Završeni</option>
        <option value="cancelled">Otkazani</option>
        <option value="archived">Arhivirani</option>
      </select>
    </div>
  );
};

export default Filters;
