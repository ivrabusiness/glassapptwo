import React, { useState } from 'react';
import { Search, Filter, Calendar, ArrowUpDown, X, ChevronDown, TrendingUp, TrendingDown, RotateCcw } from 'lucide-react';

interface ItemTransactionFiltersProps {
  dateRange: {
    startDate: Date | null;
    endDate: Date | null;
  };
  setDateRange: React.Dispatch<React.SetStateAction<{
    startDate: Date | null;
    endDate: Date | null;
  }>>;
  transactionType: 'all' | 'in' | 'out' | 'adjustment';
  setTransactionType: React.Dispatch<React.SetStateAction<'all' | 'in' | 'out' | 'adjustment'>>;
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  sortOrder: 'newest' | 'oldest';
  setSortOrder: React.Dispatch<React.SetStateAction<'newest' | 'oldest'>>;
}

const ItemTransactionFilters: React.FC<ItemTransactionFiltersProps> = ({
  dateRange,
  setDateRange,
  transactionType,
  setTransactionType,
  searchTerm,
  setSearchTerm,
  sortOrder,
  setSortOrder
}) => {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Funkcija za resetiranje datumskog filtera
  const clearDateFilter = () => {
    setDateRange({
      startDate: null,
      endDate: null
    });
  };

  // Funkcija za postavljanje predefiniranih datumskih raspona
  const setPresetDateRange = (days: number) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    setDateRange({
      startDate,
      endDate
    });
    
    setShowDatePicker(false);
  };

  // Funkcija za formatiranje datuma za prikaz
  const formatDateRange = () => {
    if (!dateRange.startDate && !dateRange.endDate) return 'Svi datumi';
    
    const formatDate = (date: Date | null) => {
      if (!date) return '';
      return date.toLocaleDateString('hr-HR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };
    
    if (dateRange.startDate && dateRange.endDate) {
      return `${formatDate(dateRange.startDate)} - ${formatDate(dateRange.endDate)}`;
    } else if (dateRange.startDate) {
      return `Od ${formatDate(dateRange.startDate)}`;
    } else if (dateRange.endDate) {
      return `Do ${formatDate(dateRange.endDate)}`;
    }
    
    return 'Svi datumi';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4 print:hidden">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-medium text-gray-900">Filteri transakcija</h3>
        <button
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
        >
          {showAdvancedFilters ? 'Sakrij napredne filtere' : 'Prikaži napredne filtere'}
          <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} />
        </button>
      </div>
      
      {/* Osnovni filteri - uvijek vidljivi */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Pretraga */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Pretraži transakcije..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        
        {/* Tip transakcije */}
        <div className="relative">
          <div className="flex space-x-1">
            <button
              onClick={() => setTransactionType('all')}
              className={`flex-1 flex items-center justify-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                transactionType === 'all'
                  ? 'bg-gray-200 text-gray-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Filter className="h-4 w-4 mr-1" />
              Sve
            </button>
            <button
              onClick={() => setTransactionType('in')}
              className={`flex-1 flex items-center justify-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                transactionType === 'in'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-green-50'
              }`}
            >
              <TrendingUp className="h-4 w-4 mr-1" />
              Ulazi
            </button>
            <button
              onClick={() => setTransactionType('out')}
              className={`flex-1 flex items-center justify-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                transactionType === 'out'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-red-50'
              }`}
            >
              <TrendingDown className="h-4 w-4 mr-1" />
              Izlazi
            </button>
            <button
              onClick={() => setTransactionType('adjustment')}
              className={`flex-1 flex items-center justify-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                transactionType === 'adjustment'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-blue-50'
              }`}
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Korekcije
            </button>
          </div>
        </div>
        
        {/* Datum - dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <div className="flex items-center">
              <Calendar className="h-4 w-4 text-gray-400 mr-2" />
              <span className="text-sm text-gray-700 truncate">{formatDateRange()}</span>
            </div>
            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${showDatePicker ? 'rotate-180' : ''}`} />
          </button>
          
          {showDatePicker && (
            <div className="absolute z-10 mt-1 w-full bg-white rounded-lg shadow-lg border border-gray-200 p-4">
              <div className="space-y-4">
                <div className="flex flex-col space-y-2">
                  <h4 className="text-sm font-medium text-gray-900">Brzi odabir</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setPresetDateRange(7)}
                      className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      Zadnjih 7 dana
                    </button>
                    <button
                      onClick={() => setPresetDateRange(30)}
                      className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      Zadnjih 30 dana
                    </button>
                    <button
                      onClick={() => setPresetDateRange(90)}
                      className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      Zadnja 3 mjeseca
                    </button>
                    <button
                      onClick={() => setPresetDateRange(365)}
                      className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      Zadnjih godinu dana
                    </button>
                  </div>
                </div>
                
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Prilagođeni raspon</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Od datuma</label>
                      <input
                        type="date"
                        value={dateRange.startDate ? dateRange.startDate.toISOString().split('T')[0] : ''}
                        onChange={(e) => setDateRange(prev => ({ 
                          ...prev, 
                          startDate: e.target.value ? new Date(e.target.value) : null 
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Do datuma</label>
                      <input
                        type="date"
                        value={dateRange.endDate ? dateRange.endDate.toISOString().split('T')[0] : ''}
                        onChange={(e) => setDateRange(prev => ({ 
                          ...prev, 
                          endDate: e.target.value ? new Date(e.target.value) : null 
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between pt-3 border-t border-gray-200">
                  <button
                    onClick={clearDateFilter}
                    className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                  >
                    Poništi
                  </button>
                  <button
                    onClick={() => setShowDatePicker(false)}
                    className="px-3 py-1 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                  >
                    Primijeni
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Napredni filteri - prikazuju se samo kad su otvoreni */}
      {showAdvancedFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Sortiranje */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sortiranje
              </label>
              <div className="flex space-x-2">
                <button
                  onClick={() => setSortOrder('newest')}
                  className={`flex-1 flex items-center justify-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    sortOrder === 'newest'
                      ? 'bg-gray-200 text-gray-800'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <ArrowUpDown className="h-4 w-4 mr-1" />
                  Najnovije
                </button>
                <button
                  onClick={() => setSortOrder('oldest')}
                  className={`flex-1 flex items-center justify-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    sortOrder === 'oldest'
                      ? 'bg-gray-200 text-gray-800'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <ArrowUpDown className="h-4 w-4 mr-1 transform rotate-180" />
                  Najstarije
                </button>
              </div>
            </div>
            
            {/* Dodatne opcije */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dodatne opcije
              </label>
              <div className="flex space-x-2">
                <button
                  onClick={clearDateFilter}
                  className="flex-1 flex items-center justify-center px-3 py-2 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
                >
                  <X className="h-4 w-4 mr-1" />
                  Poništi filtere
                </button>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setTransactionType('all');
                    clearDateFilter();
                    setSortOrder('newest');
                  }}
                  className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
                >
                  <Filter className="h-4 w-4 mr-1" />
                  Resetiraj sve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Aktivni filteri */}
      <div className="flex flex-wrap gap-2 mt-2">
        {transactionType !== 'all' && (
          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-50 text-blue-700 border border-blue-200">
            <Filter className="h-3 w-3 mr-1" />
            <span className="mr-2">Tip: {
              transactionType === 'in' ? 'Ulazi' :
              transactionType === 'out' ? 'Izlazi' :
              'Korekcije'
            }</span>
            <button 
              onClick={() => setTransactionType('all')}
              className="text-blue-500 hover:text-blue-700"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
        
        {(dateRange.startDate || dateRange.endDate) && (
          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-50 text-green-700 border border-green-200">
            <Calendar className="h-3 w-3 mr-1" />
            <span className="mr-2">Datum: {formatDateRange()}</span>
            <button 
              onClick={clearDateFilter}
              className="text-green-500 hover:text-green-700"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
        
        {searchTerm && (
          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-50 text-purple-700 border border-purple-200">
            <Search className="h-3 w-3 mr-1" />
            <span className="mr-2">Pretraga: {searchTerm}</span>
            <button 
              onClick={() => setSearchTerm('')}
              className="text-purple-500 hover:text-purple-700"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
        
        <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-50 text-gray-700 border border-gray-200 ml-auto">
          <ArrowUpDown className="h-3 w-3 mr-1" />
          <span className="mr-2">Redoslijed: {sortOrder === 'newest' ? 'Najnovije' : 'Najstarije'}</span>
          <button 
            onClick={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ItemTransactionFilters;
