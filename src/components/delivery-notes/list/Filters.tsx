import React from 'react';
import { Search, Calendar, X } from 'lucide-react';

interface FiltersProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  dateFilter: {
    year: number;
    month: number | null;
    day: number | null;
  };
  onDateFilterChange: (filter: {
    year: number;
    month: number | null;
    day: number | null;
  }) => void;
}

const Filters: React.FC<FiltersProps> = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  dateFilter,
  onDateFilterChange
}) => {
  // Generate years for filter (last 5 years)
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
  
  // Generate months
  const months = [
    { value: 1, label: 'Siječanj' },
    { value: 2, label: 'Veljača' },
    { value: 3, label: 'Ožujak' },
    { value: 4, label: 'Travanj' },
    { value: 5, label: 'Svibanj' },
    { value: 6, label: 'Lipanj' },
    { value: 7, label: 'Srpanj' },
    { value: 8, label: 'Kolovoz' },
    { value: 9, label: 'Rujan' },
    { value: 10, label: 'Listopad' },
    { value: 11, label: 'Studeni' },
    { value: 12, label: 'Prosinac' }
  ];
  
  // Generate days based on selected month and year
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month, 0).getDate();
  };
  
  const days = dateFilter.month 
    ? Array.from({ length: getDaysInMonth(dateFilter.year, dateFilter.month) }, (_, i) => i + 1)
    : [];
  
  // Format date filter for display
  const getDateFilterDisplay = () => {
    if (!dateFilter.month && !dateFilter.day) {
      return `${dateFilter.year}`;
    } else if (!dateFilter.day) {
      return `${months.find(m => m.value === dateFilter.month)?.label} ${dateFilter.year}`;
    } else {
      return `${dateFilter.day}. ${months.find(m => m.value === dateFilter.month)?.label} ${dateFilter.year}`;
    }
  };
  
  // Clear date filter
  const clearDateFilter = () => {
    onDateFilterChange({
      year: new Date().getFullYear(),
      month: null,
      day: null
    });
  };

  return (
    <div>
      {/* Main Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Pretraži otpremnice..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        {/* Status filter with ADDED awaiting_invoice option */}
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">Svi statusi</option>
          <option value="awaiting_invoice">Čeka račun</option>
          <option value="generated">Generirane</option>
          <option value="delivered">Isporučene</option>
          <option value="invoiced">Izdan račun</option>
        </select>
        
        {/* Date filter */}
        <div className="flex gap-2">
          <select
            value={dateFilter.year}
            onChange={(e) => onDateFilterChange({ ...dateFilter, year: parseInt(e.target.value), month: null, day: null })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          
          <select
            value={dateFilter.month || ''}
            onChange={(e) => onDateFilterChange({ 
              ...dateFilter, 
              month: e.target.value ? parseInt(e.target.value) : null,
              day: null
            })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Svi mjeseci</option>
            {months.map(month => (
              <option key={month.value} value={month.value}>{month.label}</option>
            ))}
          </select>
          
          {dateFilter.month && (
            <select
              value={dateFilter.day || ''}
              onChange={(e) => onDateFilterChange({ 
                ...dateFilter, 
                day: e.target.value ? parseInt(e.target.value) : null 
              })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Svi dani</option>
              {days.map(day => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>
          )}
          
          <button
            onClick={clearDateFilter}
            className="px-3 py-2 text-gray-500 hover:text-gray-700"
            title="Poništi filter datuma"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Active Filters Display */}
      <div className="flex flex-wrap gap-2">
        {statusFilter !== 'all' && (
          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-50 text-blue-700 border border-blue-200">
            <span className="mr-2">Status: {
              statusFilter === 'generated' ? 'Generirane' :
              statusFilter === 'delivered' ? 'Isporučene' :
              statusFilter === 'invoiced' ? 'Izdan račun' :
              statusFilter === 'awaiting_invoice' ? 'Čeka račun' : statusFilter
            }</span>
            <button 
              onClick={() => onStatusFilterChange('all')}
              className="text-blue-500 hover:text-blue-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        
        {(dateFilter.month !== null || dateFilter.day !== null) && (
          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-50 text-green-700 border border-green-200">
            <Calendar className="h-4 w-4 mr-1" />
            <span className="mr-2">Datum: {getDateFilterDisplay()}</span>
            <button 
              onClick={clearDateFilter}
              className="text-green-500 hover:text-green-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Filters;
