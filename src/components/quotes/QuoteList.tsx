import React, { useState, useEffect } from 'react';
import { Receipt, Search, Edit, Eye, CheckCircle, XCircle, AlertTriangle, FileText, Plus, Lock, Printer } from 'lucide-react';
import { useSupabaseData } from '../../hooks/useSupabaseData';
import { Quote, Client } from '../../types';

interface QuoteListProps {
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
              {['Ponuda', 'Klijent', 'Iznos', 'Status', 'Vrijedi do', 'Datum', 'Akcije'].map((header) => (
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
                  <div className="h-6 bg-gray-200 rounded-full w-24"></div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="h-5 bg-gray-200 rounded w-24"></div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="h-5 bg-gray-200 rounded w-24 mb-1"></div>
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
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

const QuoteList: React.FC<QuoteListProps> = ({ onCreateNew, onEditQuote, onViewQuote }) => {
  const [quotes] = useSupabaseData<Quote>('quotes', []);
  const [clients] = useSupabaseData<Client>('clients', []);
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
      case 'accepted': return 'Prihvaćena';
      case 'rejected': return 'Odbijena';
      case 'expired': return 'Istekla';
      case 'converted': return 'Pretvorena u nalog';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'created': return Receipt;
      case 'accepted': return CheckCircle;
      case 'rejected': return XCircle;
      case 'expired': return AlertTriangle;
      case 'converted': return FileText;
      default: return Receipt;
    }
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

  // Funkcija za rukovanje klikom na broj ponude
  const handleQuoteNumberClick = (quoteId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    onViewQuote(quoteId);
  };

  // Provjeri je li ponuda istekla
  const isQuoteExpired = (validUntil: string) => {
    const today = new Date();
    const expiryDate = new Date(validUntil);
    return today > expiryDate;
  };

  // Funkcija za formatiranje iznosa
  const formatAmount = (amount: number) => {
    return amount.toLocaleString('hr-HR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
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
          <Receipt className="h-5 w-5 text-blue-500 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-blue-900">Upravljanje ponudama</h3>
            <p className="text-sm text-blue-700 mt-1">
              <strong>Mogu se uređivati samo kreirane ponude</strong> koje još nisu prihvaćene, odbijene ili pretvorene u nalog.
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
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    Iznos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vrijedi do
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Datum
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
                  const isEditable = canEditQuote(quote);
                  const expired = isQuoteExpired(quote.validUntil) && quote.status !== 'accepted' && quote.status !== 'rejected' && quote.status !== 'converted';
                  
                  return (
                    <tr key={quote.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {/* Napravi broj ponude klikabilnim */}
                        <button
                          onClick={(e) => handleQuoteNumberClick(quote.id, e)}
                          className="text-sm font-medium text-purple-600 hover:text-purple-900 hover:underline transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-1 rounded px-1 py-0.5"
                          title="Kliknite za pregled ponude"
                        >
                          {quote.quoteNumber}
                        </button>
                        {expired && (
                          <div className="flex items-center mt-1">
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Istekla
                            </span>
                          </div>
                        )}
                        {quote.convertedToWorkOrderId && (
                          <div className="flex items-center mt-1">
                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                              <FileText className="h-3 w-3 mr-1" />
                              Pretvorena u nalog
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
                        <div className="text-sm font-medium text-gray-900">
                          {formatAmount(quote.grandTotal)}
                        </div>
                        <div className="text-xs text-gray-500">
                          Osnovica: {formatAmount(quote.totalAmount)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(quote.status)}`}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {getStatusText(quote.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className={expired ? 'text-red-600 font-medium' : ''}>
                          {new Date(quote.validUntil).toLocaleDateString('hr-HR')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>{new Date(quote.createdAt).toLocaleDateString('hr-HR')}</div>
                        {quote.acceptedAt && (
                          <div className="text-xs text-green-600 font-medium">
                            Prihvaćena: {new Date(quote.acceptedAt).toLocaleDateString('hr-HR')}
                          </div>
                        )}
                        {quote.rejectedAt && (
                          <div className="text-xs text-red-600 font-medium">
                            Odbijena: {new Date(quote.rejectedAt).toLocaleDateString('hr-HR')}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          {/* Edit gumb bez popup-a kad je disabled */}
                          <button
                            onClick={() => handleEditClick(quote)}
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
                            onClick={() => onViewQuote(quote.id)}
                            className="text-green-600 hover:text-green-900 p-1 rounded"
                            title="Pregled"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            className="text-gray-600 hover:text-gray-900 p-1 rounded"
                            title="Ispiši ponudu"
                          >
                            <Printer className="h-4 w-4" />
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
              <Receipt className="mx-auto h-12 w-12 text-gray-400" />
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

export default QuoteList;
