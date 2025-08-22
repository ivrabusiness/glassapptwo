import React from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  resultsCount: number;
}

const SearchBar: React.FC<SearchBarProps> = ({ searchTerm, setSearchTerm, resultsCount }) => {
  return (
    <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-4">
      <div className="relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
          <Search className="h-5 w-5" />
        </div>
        <input
          type="text"
          placeholder="Pretraži usluge po nazivu, kodu ili opisu..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-700"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
      
      {/* Search results stats */}
      <div className="mt-2 flex items-center text-sm text-gray-600">
        <span className="mr-2">Pronađeno: {resultsCount} {resultsCount === 1 ? 'usluga' : resultsCount < 5 ? 'usluge' : 'usluga'}</span>
        {searchTerm && (
          <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full text-xs font-medium">
            Pretraga: "{searchTerm}"
          </span>
        )}
      </div>
    </div>
  );
};

export default SearchBar;
