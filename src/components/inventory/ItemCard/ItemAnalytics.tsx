import React, { useState } from 'react';
import { BarChart2, TrendingUp, TrendingDown, RotateCcw, Calendar, ArrowUpRight, ArrowDownRight, AlertCircle, CheckCircle, Clock, Info } from 'lucide-react';
import { InventoryItem, StockTransaction } from '../../../types';

interface ItemAnalyticsProps {
  item: InventoryItem;
  transactions: StockTransaction[];
}

const ItemAnalytics: React.FC<ItemAnalyticsProps> = ({ item, transactions }) => {
  const [timeframe, setTimeframe] = useState<'month' | 'quarter' | 'year'>('month');
  
  // Statistika transakcija
  const totalIn = transactions.filter(t => t.type === 'in').reduce((sum, t) => sum + t.quantity, 0);
  const totalOut = transactions.filter(t => t.type === 'out').reduce((sum, t) => sum + t.quantity, 0);
  const totalAdjustments = transactions.filter(t => t.type === 'adjustment').length;
  
  // Izračun prometa po vremenskim periodima
  const getTransactionsByPeriod = () => {
    const now = new Date();
    const periods: { [key: string]: { in: number; out: number; adjustments: number } } = {};
    
    // Inicijaliziraj periode ovisno o odabranom timeframe-u
    if (timeframe === 'month') {
      // Zadnjih 30 dana po danima
      for (let i = 0; i < 30; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const key = date.toISOString().split('T')[0];
        periods[key] = { in: 0, out: 0, adjustments: 0 };
      }
    } else if (timeframe === 'quarter') {
      // Zadnja 3 mjeseca po tjednima
      for (let i = 0; i < 12; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() - (i * 7));
        const weekNumber = Math.ceil((date.getDate() + new Date(date.getFullYear(), date.getMonth(), 1).getDay()) / 7);
        const key = `${date.getFullYear()}-${date.getMonth() + 1}-W${weekNumber}`;
        periods[key] = { in: 0, out: 0, adjustments: 0 };
      }
    } else {
      // Zadnjih 12 mjeseci po mjesecima
      for (let i = 0; i < 12; i++) {
        const date = new Date(now);
        date.setMonth(date.getMonth() - i);
        const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
        periods[key] = { in: 0, out: 0, adjustments: 0 };
      }
    }
    
    // Filtriraj transakcije po vremenskom periodu
    const filteredTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.createdAt);
      const monthsAgo = (now.getFullYear() - transactionDate.getFullYear()) * 12 + 
                        now.getMonth() - transactionDate.getMonth();
      
      if (timeframe === 'month') return monthsAgo === 0 && (now.getDate() - transactionDate.getDate()) < 30;
      if (timeframe === 'quarter') return monthsAgo < 3;
      return monthsAgo < 12;
    });
    
    // Grupiraj transakcije po periodima
    filteredTransactions.forEach(t => {
      const date = new Date(t.createdAt);
      let key;
      
      if (timeframe === 'month') {
        key = date.toISOString().split('T')[0];
      } else if (timeframe === 'quarter') {
        const weekNumber = Math.ceil((date.getDate() + new Date(date.getFullYear(), date.getMonth(), 1).getDay()) / 7);
        key = `${date.getFullYear()}-${date.getMonth() + 1}-W${weekNumber}`;
      } else {
        key = `${date.getFullYear()}-${date.getMonth() + 1}`;
      }
      
      // Ako ključ ne postoji u periodima, preskočimo (može se dogoditi za starije transakcije)
      if (!periods[key]) return;
      
      if (t.type === 'in') {
        periods[key].in += t.quantity;
      } else if (t.type === 'out') {
        periods[key].out += t.quantity;
      } else if (t.type === 'adjustment') {
        periods[key].adjustments += 1;
      }
    });
    
    return periods;
  };
  
  const transactionsByPeriod = getTransactionsByPeriod();
  
  // Formatiranje labela za prikaz
  const formatPeriodLabel = (key: string) => {
    if (timeframe === 'month') {
      // Format: YYYY-MM-DD -> DD.MM.
      const parts = key.split('-');
      return `${parts[2]}.${parts[1]}.`;
    } else if (timeframe === 'quarter') {
      // Format: YYYY-MM-WX -> MM/WX
      const parts = key.split('-');
      return `${parts[1]}/T${parts[2].replace('W', '')}`;
    } else {
      // Format: YYYY-MM -> MM/YYYY
      const parts = key.split('-');
      return `${parts[1]}/${parts[0]}`;
    }
  };
  
  // Izračun trendova
  const calculateTrends = () => {
    if (transactions.length < 2) return { in: 0, out: 0 };
    
    // Sortiraj transakcije po datumu
    const sortedTransactions = [...transactions].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    
    // Podijeli na prvu i drugu polovicu
    const midpoint = Math.floor(sortedTransactions.length / 2);
    const firstHalf = sortedTransactions.slice(0, midpoint);
    const secondHalf = sortedTransactions.slice(midpoint);
    
    // Izračunaj ukupne količine za ulaz i izlaz u obje polovice
    const firstHalfIn = firstHalf.filter(t => t.type === 'in').reduce((sum, t) => sum + t.quantity, 0);
    const firstHalfOut = firstHalf.filter(t => t.type === 'out').reduce((sum, t) => sum + t.quantity, 0);
    
    const secondHalfIn = secondHalf.filter(t => t.type === 'in').reduce((sum, t) => sum + t.quantity, 0);
    const secondHalfOut = secondHalf.filter(t => t.type === 'out').reduce((sum, t) => sum + t.quantity, 0);
    
    // Izračunaj postotne promjene
    const inTrend = firstHalfIn === 0 ? 0 : ((secondHalfIn - firstHalfIn) / firstHalfIn) * 100;
    const outTrend = firstHalfOut === 0 ? 0 : ((secondHalfOut - firstHalfOut) / firstHalfOut) * 100;
    
    return { in: inTrend, out: outTrend };
  };
  
  const trends = calculateTrends();
  
  // Izračunaj prosječnu dnevnu potrošnju na temelju zadnjih 30 dana
  const last30DaysOut = transactions
    .filter(t => {
      const date = new Date(t.createdAt);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return t.type === 'out' && diffDays <= 30;
    })
    .reduce((sum, t) => sum + t.quantity, 0);
  
  const avgDailyUsage = last30DaysOut / 30;
  
  // Izračunaj koliko dana će trajati zaliha
  const daysRemaining = avgDailyUsage === 0 ? Infinity : item.quantity / avgDailyUsage;
  
  // Izračunaj koliko dana će trebati da zaliha padne ispod minimuma
  const daysUntilMin = avgDailyUsage === 0 ? Infinity : (item.quantity - item.minQuantity) / avgDailyUsage;
  
  // Formatiraj procjenu trajanja zalihe
  let formattedEstimate;
  if (daysRemaining === Infinity) {
    formattedEstimate = 'Nema potrošnje';
  } else if (daysRemaining > 365) {
    formattedEstimate = `${(daysRemaining / 365).toFixed(1)} godina`;
  } else if (daysRemaining > 30) {
    formattedEstimate = `${(daysRemaining / 30).toFixed(1)} mjeseci`;
  } else {
    formattedEstimate = `${Math.ceil(daysRemaining)} dana`;
  }
  
  // Izračunaj datum kada će zaliha pasti ispod minimuma
  const minDate = new Date();
  if (daysUntilMin !== Infinity) {
    minDate.setDate(minDate.getDate() + Math.floor(daysUntilMin));
  }
  
  return (
    <div className="space-y-6 print:space-y-4">
      {/* Timeframe Selector */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 print:hidden">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Analitika artikla</h3>
          <div className="flex space-x-2">
            <button
              onClick={() => setTimeframe('month')}
              className={`px-3 py-1 text-sm rounded-lg ${
                timeframe === 'month'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Mjesec
            </button>
            <button
              onClick={() => setTimeframe('quarter')}
              className={`px-3 py-1 text-sm rounded-lg ${
                timeframe === 'quarter'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Kvartal
            </button>
            <button
              onClick={() => setTimeframe('year')}
              className={`px-3 py-1 text-sm rounded-lg ${
                timeframe === 'year'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Godina
            </button>
          </div>
        </div>
      </div>
      
      {/* Statistika */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 print:p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4 print:text-base">Statistika transakcija</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:grid-cols-3 print:gap-4">
          {/* Ukupno ulaza */}
          <div className="bg-green-50 rounded-lg p-4 border border-green-200 print:p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
                <h4 className="text-sm font-medium text-green-900">Ukupno ulaza</h4>
              </div>
              {trends.in !== 0 && (
                <div className={`flex items-center text-xs ${trends.in > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {trends.in > 0 ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                  <span>{Math.abs(trends.in).toFixed(1)}%</span>
                </div>
              )}
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold text-green-700">{totalIn.toFixed(2)} {item.unit}</div>
              <div className="text-xs text-green-600 mt-1">
                {transactions.filter(t => t.type === 'in').length} transakcija
              </div>
            </div>
          </div>
          
          {/* Ukupno izlaza */}
          <div className="bg-red-50 rounded-lg p-4 border border-red-200 print:p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <TrendingDown className="h-5 w-5 text-red-600 mr-2" />
                <h4 className="text-sm font-medium text-red-900">Ukupno izlaza</h4>
              </div>
              {trends.out !== 0 && (
                <div className={`flex items-center text-xs ${trends.out > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {trends.out > 0 ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                  <span>{Math.abs(trends.out).toFixed(1)}%</span>
                </div>
              )}
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold text-red-700">{totalOut.toFixed(2)} {item.unit}</div>
              <div className="text-xs text-red-600 mt-1">
                {transactions.filter(t => t.type === 'out').length} transakcija
              </div>
            </div>
          </div>
          
          {/* Korekcije */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 print:p-3">
            <div className="flex items-center">
              <RotateCcw className="h-5 w-5 text-blue-600 mr-2" />
              <h4 className="text-sm font-medium text-blue-900">Korekcije</h4>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold text-blue-700">{totalAdjustments}</div>
              <div className="text-xs text-blue-600 mt-1">
                {totalAdjustments === 1 ? 'korekcija' : totalAdjustments < 5 ? 'korekcije' : 'korekcija'}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Procjena zalihe */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 print:p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4 print:text-base">Procjena zalihe</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2 print:gap-4">
          {/* Status zalihe */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 print:p-3">
            <div className="flex items-center mb-3">
              <Clock className="h-5 w-5 text-gray-600 mr-2" />
              <h4 className="text-sm font-medium text-gray-900">Status zalihe</h4>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Trenutno stanje:</span>
                <span className="text-sm font-medium text-gray-900">
                  {item.quantity.toFixed(2)} {item.unit}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Minimalna količina:</span>
                <span className="text-sm font-medium text-gray-900">
                  {item.minQuantity.toFixed(2)} {item.unit}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Status:</span>
                {item.quantity <= item.minQuantity ? (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    {item.quantity === 0 ? 'Nema zalihe' : 'Ispod minimuma'}
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Dostupno
                  </span>
                )}
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Razlika do minimuma:</span>
                <span className={`text-sm font-medium ${
                  item.quantity <= item.minQuantity ? 'text-red-600' : 'text-green-600'
                }`}>
                  {(item.quantity - item.minQuantity).toFixed(2)} {item.unit}
                </span>
              </div>
            </div>
          </div>
          
          {/* Procjena potrošnje */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 print:p-3">
            <div className="flex items-center mb-3">
              <Calendar className="h-5 w-5 text-gray-600 mr-2" />
              <h4 className="text-sm font-medium text-gray-900">Procjena potrošnje</h4>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Prosječna dnevna potrošnja:</span>
                <span className="text-sm font-medium text-red-600">
                  {avgDailyUsage.toFixed(3)} {item.unit}/dan
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Procijenjeno trajanje:</span>
                <span className={`text-sm font-medium ${
                  daysRemaining < 7 ? 'text-red-600' : 
                  daysRemaining < 30 ? 'text-yellow-600' : 
                  'text-green-600'
                }`}>
                  {formattedEstimate}
                </span>
              </div>
              
              {item.quantity > item.minQuantity && daysUntilMin !== Infinity && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Pad ispod minimuma:</span>
                  <span className={`text-sm font-medium ${
                    daysUntilMin < 7 ? 'text-red-600' : 
                    daysUntilMin < 30 ? 'text-yellow-600' : 
                    'text-green-600'
                  }`}>
                    {Math.floor(daysUntilMin)} dana ({minDate.toLocaleDateString('hr-HR')})
                  </span>
                </div>
              )}
              
              {item.quantity <= item.minQuantity && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Status minimuma:</span>
                  <span className="text-sm font-medium text-red-600">
                    Već ispod minimuma!
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Grafički prikaz */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 print:p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4 print:text-base">Promet po periodima</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50 print:bg-gray-100">
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200 print:text-xxs">
                  Period
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200 print:text-xxs">
                  Ulaz
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200 print:text-xxs">
                  Izlaz
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200 print:text-xxs">
                  Korekcije
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border border-gray-200 print:text-xxs">
                  Saldo
                </th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(transactionsByPeriod)
                .sort((a, b) => b[0].localeCompare(a[0]))
                .map(([key, data]) => (
                  <tr key={key} className="hover:bg-gray-50 print:hover:bg-white">
                    <td className="px-4 py-2 text-sm border border-gray-200 print:text-xs">
                      {formatPeriodLabel(key)}
                    </td>
                    <td className="px-4 py-2 text-sm border border-gray-200 print:text-xs">
                      <span className="text-green-600 font-medium">{data.in > 0 ? `+${data.in.toFixed(2)}` : '0.00'}</span>
                    </td>
                    <td className="px-4 py-2 text-sm border border-gray-200 print:text-xs">
                      <span className="text-red-600 font-medium">{data.out > 0 ? `-${data.out.toFixed(2)}` : '0.00'}</span>
                    </td>
                    <td className="px-4 py-2 text-sm border border-gray-200 print:text-xs">
                      <span className="text-blue-600 font-medium">{data.adjustments}</span>
                    </td>
                    <td className="px-4 py-2 text-sm border border-gray-200 print:text-xs">
                      <span className={`font-medium ${data.in - data.out > 0 ? 'text-green-600' : data.in - data.out < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                        {(data.in - data.out).toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        
        <div className="mt-4 text-xs text-gray-500 print:text-xxs">
          <p>* Prikazani su podaci za {
            timeframe === 'month' ? 'zadnjih 30 dana' : 
            timeframe === 'quarter' ? 'zadnja 3 mjeseca' : 
            'zadnjih 12 mjeseci'
          }</p>
        </div>
      </div>
      
      {/* Prosječna potrošnja */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 print:p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4 print:text-base">Prosječna potrošnja</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:grid-cols-3 print:gap-4">
          {/* Zadnjih 30 dana */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 print:p-3">
            <div className="flex items-center mb-2">
              <Calendar className="h-4 w-4 text-gray-600 mr-2" />
              <h4 className="text-sm font-medium text-gray-900">Zadnjih 30 dana</h4>
            </div>
            
            <div className="mt-2">
              <div className="text-2xl font-bold text-red-600">
                {transactions
                  .filter(t => {
                    const date = new Date(t.createdAt);
                    const now = new Date();
                    const diffTime = Math.abs(now.getTime() - date.getTime());
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    return t.type === 'out' && diffDays <= 30;
                  })
                  .reduce((sum, t) => sum + t.quantity, 0)
                  .toFixed(2)
                } {item.unit}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {transactions
                  .filter(t => {
                    const date = new Date(t.createdAt);
                    const now = new Date();
                    const diffTime = Math.abs(now.getTime() - date.getTime());
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    return t.type === 'out' && diffDays <= 30;
                  }).length} transakcija
              </div>
            </div>
          </div>
          
          {/* Zadnja 3 mjeseca */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 print:p-3">
            <div className="flex items-center mb-2">
              <Calendar className="h-4 w-4 text-gray-600 mr-2" />
              <h4 className="text-sm font-medium text-gray-900">Zadnja 3 mjeseca</h4>
            </div>
            
            <div className="mt-2">
              <div className="text-2xl font-bold text-red-600">
                {(transactions
                  .filter(t => {
                    const date = new Date(t.createdAt);
                    const now = new Date();
                    const diffTime = Math.abs(now.getTime() - date.getTime());
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    return t.type === 'out' && diffDays <= 90;
                  })
                  .reduce((sum, t) => sum + t.quantity, 0) / 3)
                  .toFixed(2)
                } {item.unit}/mj
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {transactions
                  .filter(t => {
                    const date = new Date(t.createdAt);
                    const now = new Date();
                    const diffTime = Math.abs(now.getTime() - date.getTime());
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    return t.type === 'out' && diffDays <= 90;
                  }).length} transakcija
              </div>
            </div>
          </div>
          
          {/* Zadnjih 12 mjeseci */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 print:p-3">
            <div className="flex items-center mb-2">
              <Calendar className="h-4 w-4 text-gray-600 mr-2" />
              <h4 className="text-sm font-medium text-gray-900">Zadnjih 12 mjeseci</h4>
            </div>
            
            <div className="mt-2">
              <div className="text-2xl font-bold text-red-600">
                {(transactions
                  .filter(t => {
                    const date = new Date(t.createdAt);
                    const now = new Date();
                    const diffTime = Math.abs(now.getTime() - date.getTime());
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    return t.type === 'out' && diffDays <= 365;
                  })
                  .reduce((sum, t) => sum + t.quantity, 0) / 12)
                  .toFixed(2)
                } {item.unit}/mj
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {transactions
                  .filter(t => {
                    const date = new Date(t.createdAt);
                    const now = new Date();
                    const diffTime = Math.abs(now.getTime() - date.getTime());
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    return t.type === 'out' && diffDays <= 365;
                  }).length} transakcija
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Distribucija transakcija */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 print:p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4 print:text-base">Distribucija transakcija</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2 print:gap-4">
          {/* Distribucija po tipu */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 print:p-3">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Po tipu transakcije</h4>
            
            <div className="space-y-3">
              {/* Ulazi */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    <span className="text-sm text-gray-700">Ulazi</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {transactions.filter(t => t.type === 'in').length} ({
                      transactions.length === 0 
                        ? '0%' 
                        : `${Math.round((transactions.filter(t => t.type === 'in').length / transactions.length) * 100)}%`
                    })
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ 
                      width: transactions.length === 0 
                        ? '0%' 
                        : `${(transactions.filter(t => t.type === 'in').length / transactions.length) * 100}%` 
                    }}
                  ></div>
                </div>
              </div>
              
              {/* Izlazi */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                    <span className="text-sm text-gray-700">Izlazi</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {transactions.filter(t => t.type === 'out').length} ({
                      transactions.length === 0 
                        ? '0%' 
                        : `${Math.round((transactions.filter(t => t.type === 'out').length / transactions.length) * 100)}%`
                    })
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-red-500 h-2 rounded-full" 
                    style={{ 
                      width: transactions.length === 0 
                        ? '0%' 
                        : `${(transactions.filter(t => t.type === 'out').length / transactions.length) * 100}%` 
                    }}
                  ></div>
                </div>
              </div>
              
              {/* Korekcije */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                    <span className="text-sm text-gray-700">Korekcije</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {transactions.filter(t => t.type === 'adjustment').length} ({
                      transactions.length === 0 
                        ? '0%' 
                        : `${Math.round((transactions.filter(t => t.type === 'adjustment').length / transactions.length) * 100)}%`
                    })
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full" 
                    style={{ 
                      width: transactions.length === 0 
                        ? '0%' 
                        : `${(transactions.filter(t => t.type === 'adjustment').length / transactions.length) * 100}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Distribucija po vremenu */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 print:p-3">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Po vremenskim periodima</h4>
            
            <div className="space-y-3">
              {/* Zadnjih 30 dana */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                    <span className="text-sm text-gray-700">Zadnjih 30 dana</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {transactions.filter(t => {
                      const date = new Date(t.createdAt);
                      const now = new Date();
                      const diffTime = Math.abs(now.getTime() - date.getTime());
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                      return diffDays <= 30;
                    }).length} ({
                      transactions.length === 0 
                        ? '0%' 
                        : `${Math.round((transactions.filter(t => {
                          const date = new Date(t.createdAt);
                          const now = new Date();
                          const diffTime = Math.abs(now.getTime() - date.getTime());
                          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                          return diffDays <= 30;
                        }).length / transactions.length) * 100)}%`
                    })
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-500 h-2 rounded-full" 
                    style={{ 
                      width: transactions.length === 0 
                        ? '0%' 
                        : `${(transactions.filter(t => {
                          const date = new Date(t.createdAt);
                          const now = new Date();
                          const diffTime = Math.abs(now.getTime() - date.getTime());
                          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                          return diffDays <= 30;
                        }).length / transactions.length) * 100}%` 
                    }}
                  ></div>
                </div>
              </div>
              
              {/* Zadnja 3 mjeseca */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-indigo-500 rounded-full mr-2"></div>
                    <span className="text-sm text-gray-700">Zadnja 3 mjeseca</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {transactions.filter(t => {
                      const date = new Date(t.createdAt);
                      const now = new Date();
                      const diffTime = Math.abs(now.getTime() - date.getTime());
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                      return diffDays <= 90;
                    }).length} ({
                      transactions.length === 0 
                        ? '0%' 
                        : `${Math.round((transactions.filter(t => {
                          const date = new Date(t.createdAt);
                          const now = new Date();
                          const diffTime = Math.abs(now.getTime() - date.getTime());
                          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                          return diffDays <= 90;
                        }).length / transactions.length) * 100)}%`
                    })
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-indigo-500 h-2 rounded-full" 
                    style={{ 
                      width: transactions.length === 0 
                        ? '0%' 
                        : `${(transactions.filter(t => {
                          const date = new Date(t.createdAt);
                          const now = new Date();
                          const diffTime = Math.abs(now.getTime() - date.getTime());
                          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                          return diffDays <= 90;
                        }).length / transactions.length) * 100}%` 
                    }}
                  ></div>
                </div>
              </div>
              
              {/* Zadnjih 12 mjeseci */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-pink-500 rounded-full mr-2"></div>
                    <span className="text-sm text-gray-700">Zadnjih 12 mjeseci</span>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {transactions.filter(t => {
                      const date = new Date(t.createdAt);
                      const now = new Date();
                      const diffTime = Math.abs(now.getTime() - date.getTime());
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                      return diffDays <= 365;
                    }).length} ({
                      transactions.length === 0 
                        ? '0%' 
                        : `${Math.round((transactions.filter(t => {
                          const date = new Date(t.createdAt);
                          const now = new Date();
                          const diffTime = Math.abs(now.getTime() - date.getTime());
                          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                          return diffDays <= 365;
                        }).length / transactions.length) * 100)}%`
                    })
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-pink-500 h-2 rounded-full" 
                    style={{ 
                      width: transactions.length === 0 
                        ? '0%' 
                        : `${(transactions.filter(t => {
                          const date = new Date(t.createdAt);
                          const now = new Date();
                          const diffTime = Math.abs(now.getTime() - date.getTime());
                          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                          return diffDays <= 365;
                        }).length / transactions.length) * 100}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Sažetak */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 print:p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4 print:text-base">Sažetak artikla</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2 print:gap-4">
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 print:p-3">
            <div className="flex items-center mb-3">
              <Info className="h-5 w-5 text-gray-600 mr-2" />
              <h4 className="text-sm font-medium text-gray-900">Osnovni podaci</h4>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Ukupno transakcija:</span>
                <span className="text-sm font-medium text-gray-900">{transactions.length}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Prva transakcija:</span>
                <span className="text-sm font-medium text-gray-900">
                  {transactions.length > 0 
                    ? new Date(transactions.sort((a, b) => 
                        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                      )[0].createdAt).toLocaleDateString('hr-HR')
                    : 'Nema transakcija'
                  }
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Zadnja transakcija:</span>
                <span className="text-sm font-medium text-gray-900">
                  {transactions.length > 0 
                    ? new Date(transactions.sort((a, b) => 
                        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                      )[0].createdAt).toLocaleDateString('hr-HR')
                    : 'Nema transakcija'
                  }
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Ukupni promet:</span>
                <span className="text-sm font-medium text-gray-900">
                  {(totalIn + totalOut).toFixed(2)} {item.unit}
                </span>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 print:p-3">
            <div className="flex items-center mb-3">
              <BarChart2 className="h-5 w-5 text-gray-600 mr-2" />
              <h4 className="text-sm font-medium text-gray-900">Trendovi</h4>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Trend ulaza:</span>
                <span className={`text-sm font-medium flex items-center ${
                  trends.in > 0 ? 'text-green-600' : trends.in < 0 ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {trends.in > 0 ? <ArrowUpRight className="h-3 w-3 mr-1" /> : 
                   trends.in < 0 ? <ArrowDownRight className="h-3 w-3 mr-1" /> : null}
                  {trends.in === 0 ? 'Nema promjene' : `${Math.abs(trends.in).toFixed(1)}%`}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Trend izlaza:</span>
                <span className={`text-sm font-medium flex items-center ${
                  trends.out > 0 ? 'text-red-600' : trends.out < 0 ? 'text-green-600' : 'text-gray-600'
                }`}>
                  {trends.out > 0 ? <ArrowUpRight className="h-3 w-3 mr-1" /> : 
                   trends.out < 0 ? <ArrowDownRight className="h-3 w-3 mr-1" /> : null}
                  {trends.out === 0 ? 'Nema promjene' : `${Math.abs(trends.out).toFixed(1)}%`}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Neto promjena:</span>
                <span className={`text-sm font-medium ${
                  totalIn > totalOut ? 'text-green-600' : 
                  totalIn < totalOut ? 'text-red-600' : 
                  'text-gray-600'
                }`}>
                  {(totalIn - totalOut).toFixed(2)} {item.unit}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Omjer ulaz/izlaz:</span>
                <span className="text-sm font-medium text-gray-900">
                  {totalOut === 0 ? '∞' : (totalIn / totalOut).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemAnalytics;
