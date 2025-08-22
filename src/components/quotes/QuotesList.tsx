import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, CheckCircle, XCircle, AlertCircle, FileCheck, Search, Plus, Edit, Eye, Lock, Printer, Download } from 'lucide-react';
import { useSupabaseData } from '../../hooks/useSupabaseData';
import { Quote, Client, WorkOrder } from '../../types';

interface QuotesListProps {
  onCreateNew: () => void;
  onEditQuote: (quoteId: string) => void;
  onViewQuote: (quoteId: string) => void;
}

const QuoteSkeleton = () => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {['Ponuda', 'Klijent', 'Stavke', 'Ukupno', 'Plaćeno', 'Status', 'Vrijedi do', 'Akcije'].map((header) => (
                <th key={header} className="px-6 py-3 text-left">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {[...Array(5)].map((_, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="h-5 bg-gray-200 rounded w-28 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="h-5 bg-gray-200 rounded w-32 mb-1"></div>
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="h-5 bg-gray-200 rounded w-20 mb-1"></div>
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="h-5 bg-gray-200 rounded w-28"></div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="h-2 bg-gray-200 rounded-full w-20 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-16"></div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="h-6 bg-gray-200 rounded-full w-24"></div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="h-5 bg-gray-200 rounded w-24 mb-1"></div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="flex items-center justify-end space-x-2">
                    <div className="h-6 w-6 bg-gray-200 rounded-full"></div>
                    <div className="h-6 w-6 bg-gray-200 rounded-full"></div>
                    <div className="h-6 w-6 bg-gray-200 rounded-full"></div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const QuotesList: React.FC<QuotesListProps> = ({ onCreateNew, onEditQuote }) => {
  const [quotes] = useSupabaseData<Quote>('quotes', []);
  const [clients] = useSupabaseData<Client>('clients', []);
  const [workOrders] = useSupabaseData<WorkOrder>('work_orders', []);
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Simuliraj učitavanje
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, []);

  const filteredQuotes = quotes.filter(quote => {
    const matchesSearch = quote.quoteNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || quote.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'created': return 'bg-gray-100 text-gray-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'expired': return 'bg-yellow-100 text-yellow-800';
      case 'converted': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'created': return 'Kreirana';
      case 'accepted': return 'Plaćena';
      case 'rejected': return 'Odbijena'; 
      case 'expired': return 'Istekla';
      case 'converted': return 'Pretvorena u nalog';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'created': return FileText;
      case 'accepted': return CheckCircle;
      case 'rejected': return XCircle;
      case 'expired': return AlertCircle;
      case 'converted': return FileCheck;
      default: return FileText;
    }
  };

  const getTotalItems = (quote: Quote) => {
    const items = quote.items || [];
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  // Funkcija za provjeru može li se uređivati ponuda
  const canEditQuote = (quote: Quote) => {
    return quote.status === 'created';
  };

  // Funkcija za rukovanje klikom na edit
  const handleEditClick = (quote: Quote) => {
    if (!canEditQuote(quote)) {
      return;
    }
    onEditQuote(quote.id);
  };


  // Funkcija za provjeru je li ponuda istekla
  const isQuoteExpired = (validUntil: string) => {
    const today = new Date();
    const expiryDate = new Date(validUntil);
    return today > expiryDate;
  };

  // NOVO: Funkcija za izračun postotka plaćanja
  const getPaymentPercentage = (quote: Quote) => {
    if (!quote.paymentRecords || quote.paymentRecords.length === 0) {
      return 0;
    }
    const totalPaid = quote.paymentRecords.reduce((sum, payment) => sum + payment.amount, 0);
    return quote.grandTotal > 0 ? (totalPaid / quote.grandTotal) * 100 : 0;
  };

  const getTotalPaid = (quote: Quote) => {
    if (!quote.paymentRecords || quote.paymentRecords.length === 0) {
      return 0;
    }
    return quote.paymentRecords.reduce((sum, payment) => sum + payment.amount, 0);
  };

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ponude</h1>
          <p className="text-gray-600">Upravljanje ponudama za klijente</p>
        </div>
        <button
          onClick={onCreateNew}
          className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Kreiraj ponudu
        </button>
      </div>

      {/* Obavijest o ograničenjima uređivanja */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <FileCheck className="h-5 w-5 text-blue-500 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-blue-900">Upravljanje ponudama</h3>
            <p className="text-sm text-blue-700 mt-1">
              <strong>Uređivati se mogu samo kreirane ponude</strong>. Ponude koje su prihvaćene, odbijene, istekle ili pretvorene u nalog su zaključane.
              <span className="block mt-1 font-medium">💡 Kliknite na broj ponude za brzi pregled!</span>
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Pretraži ponude..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        >
          <option value="all">Svi statusi</option>
          <option value="created">Kreirane</option>
          <option value="accepted">Prihvaćene</option>
          <option value="rejected">Odbijene</option>
          <option value="expired">Istekle</option>
          <option value="converted">Pretvorene u nalog</option>
        </select>
      </div>

      {/* Quotes Table */}
      {isLoading ? (
        <QuoteSkeleton />
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ponuda
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Klijent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stavke
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ukupno
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plaćeno
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vrijedi do
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Akcije
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredQuotes.map((quote) => {
                  const client = quote.clientId ? clients.find(c => c.id === quote.clientId) : null;
                  const StatusIcon = getStatusIcon(quote.status);
                  const items = quote.items || [];
                  const isEditable = canEditQuote(quote);
                  const expired = isQuoteExpired(quote.validUntil) && quote.status !== 'accepted' && quote.status !== 'converted';
                  const workOrder = quote.convertedToWorkOrderId ? workOrders.find(wo => wo.id === quote.convertedToWorkOrderId) : null;
                  
                  return (
                    <tr key={quote.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/quotes/${quote.quoteNumber}`)} style={{cursor: 'pointer'}}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-purple-600">
                          {quote.quoteNumber}
                        </div>
                        {/* Prikaži nalog ako je ponuda pretvorena */}
                        {quote.status === 'converted' && workOrder && (
                          <div className="flex items-center mt-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border bg-green-50 text-green-700 border-green-200">
                              <FileText className="h-3 w-3 mr-1" />
                              Nalog: {workOrder.orderNumber}
                            </span>
                          </div>
                        )}
                        
                        {/* Show rejection info */}
                        {quote.status === 'rejected' && quote.rejectedAt && (
                          <div className="flex items-center mt-2">
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border text-red-600 bg-red-50 border-red-200">
                              <XCircle className="h-3 w-3 mr-1" />
                              Odbijena: {new Date(quote.rejectedAt).toLocaleDateString('hr-HR')}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {client ? client.name : 'Bez klijenta'}
                        </div>
                        {client && (
                          <div className="text-sm text-gray-500">{client.type === 'company' ? 'Tvrtka' : 'Fizička osoba'}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {items.length} {items.length === 1 ? 'stavka' : 'stavki'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {getTotalItems(quote)} kom
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {quote.grandTotal.toLocaleString('hr-HR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                        </div>
                        <div className="text-xs text-gray-500">
                          PDV: {quote.vatAmount.toLocaleString('hr-HR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                        </div>
                      </td>
                      {/* NOVO: Payment column */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {(() => {
                          const paymentPercentage = getPaymentPercentage(quote);
                          const totalPaid = getTotalPaid(quote);
                          
                          if (paymentPercentage === 0) {
                            return (
                              <div className="text-sm text-gray-500">
                                Nije plaćeno
                              </div>
                            );
                          }
                          
                          return (
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <div className="flex-1">
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                      className={`h-2 rounded-full transition-all duration-300 ${
                                        paymentPercentage >= 100 ? 'bg-green-500' : 
                                        paymentPercentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                      }`}
                                      style={{ width: `${Math.min(paymentPercentage, 100)}%` }}
                                    ></div>
                                  </div>
                                </div>
                                <span className={`text-xs font-medium ${
                                  paymentPercentage >= 100 ? 'text-green-600' : 
                                  paymentPercentage >= 50 ? 'text-yellow-600' : 'text-red-600'
                                }`}>
                                  {paymentPercentage.toFixed(0)}%
                                </span>
                              </div>
                              <div className="text-xs text-gray-500">
                                {totalPaid.toLocaleString('hr-HR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} € / {quote.grandTotal.toLocaleString('hr-HR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                              </div>
                            </div>
                          );
                        })()} 
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          expired && quote.status !== 'rejected' ? 'bg-yellow-100 text-yellow-800' : getStatusColor(quote.status)
                        }`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {expired && quote.status !== 'rejected' ? 'Istekla' : getStatusText(quote.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className={expired ? 'text-red-600 font-medium' : ''}>
                          {new Date(quote.validUntil).toLocaleDateString('hr-HR')}
                        </div>
                        <div className="text-xs text-gray-500">
                          Kreirana: {new Date(quote.createdAt).toLocaleDateString('hr-HR')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          {/* Edit gumb bez popup-a kad je disabled */}
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditClick(quote);
                            }}
                            className={`p-1 rounded transition-colors ${
                              isEditable 
                                ? 'text-purple-600 hover:text-purple-900' 
                                : 'text-gray-300 cursor-not-allowed'
                            }`}
                            title={isEditable ? 'Uredi ponudu' : `Ponuda se ne može uređivati (status: ${getStatusText(quote.status)})`}
                          >
                            {isEditable ? (
                              <Edit className="h-4 w-4" />
                            ) : (
                              <Lock className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/quotes/${quote.id}`);
                            }}
                            className="text-green-600 hover:text-green-900 p-1 rounded"
                            title="Pregled"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={(e) => e.stopPropagation()}
                            className="text-gray-600 hover:text-gray-900 p-1 rounded"
                            title="Ispiši ponudu"
                          >
                            <Printer className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={(e) => e.stopPropagation()}
                            className="text-purple-600 hover:text-purple-900 p-1 rounded"
                            title="Preuzmi PDF"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {filteredQuotes.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <FileCheck className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nema ponuda</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Nema ponuda koje odgovaraju filtrima.' 
                  : 'Počnite kreiranjem nove ponude.'
                }
              </p>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default QuotesList;
