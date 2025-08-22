import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, CreditCard, Building, AlertTriangle, CheckCircle } from 'lucide-react';
import { useSupabaseData } from '../../hooks/useSupabaseData';
import { BankAccount } from '../../types';
import { generateId } from '../../utils/idGenerators';
import { useAuth } from '../../contexts/AuthContext';

const BankAccountSkeleton = () => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {['Naziv računa', 'Banka', 'IBAN', 'Model', 'Zadano', 'Akcije'].map((header) => (
                <th key={header} className="px-6 py-3 text-left">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {[...Array(3)].map((_, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="h-5 bg-gray-200 rounded w-32 mb-1"></div>
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="h-5 bg-gray-200 rounded w-28"></div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="h-5 bg-gray-200 rounded w-40"></div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="h-5 bg-gray-200 rounded w-16"></div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="h-6 w-6 bg-gray-200 rounded-full"></div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="flex items-center justify-end space-x-2">
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

const BankAccounts: React.FC = () => {
  const { user } = useAuth();
  const [bankAccounts, setBankAccounts] = useSupabaseData<BankAccount>('bank_accounts', []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  const [formData, setFormData] = useState({
    accountName: '',
    bankName: '',
    iban: '',
    swift: '',
    model: 'HR00',
    referencePrefix: '',
    purposeCode: 'OTHR',
    description: '',
    isDefault: false,
    isVisibleOnQuotes: false,
    notes: ''
  });

  // Simuliraj učitavanje
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, []);

  // Učitaj podatke o tvrtki iz korisničkog profila
  useEffect(() => {
    if (user?.user_metadata?.company) {
      setFormData(prev => ({
        ...prev,
        accountName: user.user_metadata.company
      }));
    }
  }, [user]);

  const filteredAccounts = bankAccounts.filter(account =>
    account.accountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.bankName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.iban.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Provjeri ispravnost IBAN-a
      if (!validateIBAN(formData.iban)) {
        showNotification('error', 'IBAN nije ispravan. Molimo provjerite unos.');
        return;
      }
      
      if (editingAccount) {
        // Ako je novi račun označen kao zadani, poništi zadani status na svim ostalim računima
        if (formData.isDefault && !editingAccount.isDefault) {
          setBankAccounts(prev => prev.map(account =>
            account.id !== editingAccount.id ? { ...account, isDefault: false } : account
          ));
        }
        
        setBankAccounts(prev => prev.map(account =>
          account.id === editingAccount.id
            ? { ...account, ...formData }
            : account
        ));
        
        showNotification('success', 'Bankovni račun je uspješno ažuriran.');
      } else {
        const newAccount: BankAccount = {
          id: generateId(),
          ...formData,
          createdAt: new Date().toISOString()
        };
        
        // Ako je novi račun označen kao zadani, poništi zadani status na svim ostalim računima
        if (formData.isDefault) {
          setBankAccounts(prev => prev.map(account => ({ ...account, isDefault: false })));
        }
        
        // Ako je ovo prvi račun, automatski ga označi kao zadani
        if (bankAccounts.length === 0) {
          newAccount.isDefault = true;
        }
        
        setBankAccounts(prev => [...prev, newAccount]);
        showNotification('success', 'Novi bankovni račun je uspješno dodan.');
      }
      
      resetForm();
    } catch (error) {
      console.error('Greška pri spremanju bankovnog računa:', error);
      showNotification('error', 'Došlo je do greške pri spremanju bankovnog računa.');
    }
  };

  const resetForm = () => {
    // Postavi naziv računa na tvrtku iz korisničkog profila
    setFormData({
      accountName: user?.user_metadata?.company || '',
      bankName: '',
      iban: '',
      swift: '',
      model: 'HR00',
      referencePrefix: '',
      purposeCode: 'OTHR',
      description: 'Plaćanje po ponudi {broj_ponude}',
      isDefault: false,
      isVisibleOnQuotes: false,
      notes: ''
    });
    setEditingAccount(null);
    setIsModalOpen(false);
  };

  const handleEdit = (account: BankAccount) => {
    setFormData({
      accountName: account.accountName,
      bankName: account.bankName,
      iban: account.iban,
      swift: account.swift || '',
      model: account.model || 'HR00',
      referencePrefix: account.referencePrefix || '',
      purposeCode: account.purposeCode || 'OTHR',
      description: account.description || '',
      isDefault: account.isDefault,
      isVisibleOnQuotes: account.isVisibleOnQuotes || false,
      notes: account.notes || ''
    });
    setEditingAccount(account);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    const accountToDelete = bankAccounts.find(account => account.id === id);
    
    if (!accountToDelete) return;
    
    if (confirm(`Jeste li sigurni da želite obrisati bankovni račun "${accountToDelete.accountName}"?`)) {
      // Ako brišemo zadani račun, postavimo prvi preostali račun kao zadani
      if (accountToDelete.isDefault && bankAccounts.length > 1) {
        const remainingAccounts = bankAccounts.filter(account => account.id !== id);
        const firstRemainingAccount = remainingAccounts[0];
        
        setBankAccounts(prev => prev
          .filter(account => account.id !== id)
          .map((account, index) => 
            index === 0 ? { ...account, isDefault: true } : account
          )
        );
      } else {
        setBankAccounts(prev => prev.filter(account => account.id !== id));
      }
      
      showNotification('success', 'Bankovni račun je uspješno obrisan.');
    }
  };

  const setAsDefault = (id: string) => {
    setBankAccounts(prev => prev.map(account => ({
      ...account,
      isDefault: account.id === id
    })));
    
    showNotification('success', 'Zadani bankovni račun je uspješno promijenjen.');
  };

  // Jednostavna validacija IBAN-a
  const validateIBAN = (iban: string): boolean => {
    // Ukloni razmake i pretvori u velika slova
    const cleanedIBAN = iban.replace(/\s/g, '').toUpperCase();
    
    // Provjeri osnovni format (za HR IBAN)
    const ibanRegex = /^HR\d{19}$/;
    
    // Za jednostavnu validaciju, provjeravamo samo format
    // U produkciji bi trebalo implementirati punu IBAN validaciju s provjerom kontrolne znamenke
    return ibanRegex.test(cleanedIBAN);
  };

  // Formatiraj IBAN za prikaz (HR12 3456 7890 1234 5678 9)
  const formatIBAN = (iban: string): string => {
    const cleanedIBAN = iban.replace(/\s/g, '').toUpperCase();
    if (cleanedIBAN.length < 2) return cleanedIBAN;
    
    const countryCode = cleanedIBAN.substring(0, 2);
    const rest = cleanedIBAN.substring(2);
    
    // Grupiraj po 4 znaka
    let formatted = countryCode;
    for (let i = 0; i < rest.length; i += 4) {
      formatted += ' ' + rest.substring(i, i + 4);
    }
    
    return formatted.trim();
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold text-gray-900 mb-2">Bankovni računi</h2>
      <p className="text-gray-600 mb-6">Upravljanje bankovnim računima za ponude i račune</p>
      
      {/* Notification */}
      {notification && (
        <div className={`mb-6 p-4 rounded-lg ${
          notification.type === 'success' 
            ? 'bg-green-50 border-l-4 border-green-500' 
            : 'bg-red-50 border-l-4 border-red-500'
        }`}>
          <div className="flex">
            <div className="flex-shrink-0">
              {notification.type === 'success' ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-500" />
              )}
            </div>
            <div className="ml-3">
              <p className={`text-sm font-medium ${notification.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>
                {notification.message}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Pretraži račune..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center px-4 py-2 bg-gray-700 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Dodaj bankovni račun
        </button>
      </div>

      {/* Bank Accounts Table */}
      {isLoading ? (
        <BankAccountSkeleton />
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Naziv računa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Banka
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IBAN
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Model
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Zadano
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Akcije
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAccounts.map((account) => (
                  <tr key={account.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <CreditCard className="h-5 w-5 text-gray-500 mr-3 flex-shrink-0" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{account.accountName}</div>
                          {account.swift && (
                            <div className="text-xs text-gray-500">SWIFT: {account.swift}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Building className="h-4 w-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">{account.bankName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                      {formatIBAN(account.iban)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {account.model || 'HR00'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {account.isDefault ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Zadano
                        </span>
                      ) : (
                        <button
                          onClick={() => setAsDefault(account.id)}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 hover:bg-blue-100 hover:text-blue-800 transition-colors"
                        >
                          Postavi kao zadano
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(account)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded"
                          title="Uredi"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(account.id)}
                          className="text-red-600 hover:text-red-900 p-1 rounded"
                          title="Obriši"
                          disabled={account.isDefault && bankAccounts.length > 1}
                        >
                          <Trash2 className={`h-4 w-4 ${account.isDefault && bankAccounts.length > 1 ? 'opacity-50 cursor-not-allowed' : ''}`} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredAccounts.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nema bankovnih računa</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm ? 'Nema bankovnih računa koji odgovaraju pretraživanju.' : 'Počnite dodavanjem novog bankovnog računa.'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">
                {editingAccount ? 'Uredi bankovni račun' : 'Dodaj novi bankovni račun'}
              </h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Naziv računa / primatelja
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.accountName}
                    onChange={(e) => setFormData(prev => ({ ...prev, accountName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    placeholder="npr. RakićERP d.o.o."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Naziv banke
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.bankName}
                    onChange={(e) => setFormData(prev => ({ ...prev, bankName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    placeholder="npr. Zagrebačka banka d.d."
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    IBAN
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.iban}
                    onChange={(e) => setFormData(prev => ({ ...prev, iban: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    placeholder="HR1234567890123456789"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Format: HR + 19 brojeva, bez razmaka
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SWIFT / BIC
                  </label>
                  <input
                    type="text"
                    value={formData.swift}
                    onChange={(e) => setFormData(prev => ({ ...prev, swift: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    placeholder="npr. ZABAHR2X"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Model
                  </label>
                  <select
                    value={formData.model}
                    onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  >
                    <option value="HR00">HR00</option>
                    <option value="HR01">HR01</option>
                    <option value="HR02">HR02</option>
                    <option value="HR03">HR03</option>
                    <option value="HR05">HR05</option>
                    <option value="HR06">HR06</option>
                    <option value="HR07">HR07</option>
                    <option value="HR08">HR08</option>
                    <option value="HR09">HR09</option>
                    <option value="HR10">HR10</option>
                    <option value="HR11">HR11</option>
                    <option value="HR12">HR12</option>
                    <option value="HR13">HR13</option>
                    <option value="HR14">HR14</option>
                    <option value="HR15">HR15</option>
                    <option value="HR16">HR16</option>
                    <option value="HR17">HR17</option>
                    <option value="HR18">HR18</option>
                    <option value="HR23">HR23</option>
                    <option value="HR24">HR24</option>
                    <option value="HR26">HR26</option>
                    <option value="HR27">HR27</option>
                    <option value="HR28">HR28</option>
                    <option value="HR29">HR29</option>
                    <option value="HR30">HR30</option>
                    <option value="HR31">HR31</option>
                    <option value="HR33">HR33</option>
                    <option value="HR34">HR34</option>
                    <option value="HR40">HR40</option>
                    <option value="HR41">HR41</option>
                    <option value="HR42">HR42</option>
                    <option value="HR43">HR43</option>
                    <option value="HR55">HR55</option>
                    <option value="HR62">HR62</option>
                    <option value="HR63">HR63</option>
                    <option value="HR64">HR64</option>
                    <option value="HR65">HR65</option>
                    <option value="HR67">HR67</option>
                    <option value="HR68">HR68</option>
                    <option value="HR69">HR69</option>
                    <option value="HR83">HR83</option>
                    <option value="HR84">HR84</option>
                    <option value="HR99">HR99</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prefiks poziva na broj
                  </label>
                  <input
                    type="text"
                    value={formData.referencePrefix}
                    onChange={(e) => setFormData(prev => ({ ...prev, referencePrefix: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    placeholder="npr. 00-"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Šifra namjene
                  </label>
                  <select
                    value={formData.purposeCode}
                    onChange={(e) => setFormData(prev => ({ ...prev, purposeCode: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  >
                    <option value="OTHR">OTHR - Ostalo</option>
                    <option value="GDSV">GDSV - Plaćanje roba i usluga</option>
                    <option value="ADVP">ADVP - Plaćanje predujma</option>
                    <option value="CCRD">CCRD - Plaćanje kreditnom karticom</option>
                    <option value="CMDT">CMDT - Plaćanje robe</option>
                    <option value="GDDS">GDDS - Kupnja/prodaja robe</option>
                    <option value="SERV">SERV - Plaćanje usluga</option>
                    <option value="CSDB">CSDB - Gotovinska uplata</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Opis plaćanja (predložak)
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  placeholder="npr. Plaćanje po ponudi {broj_ponude}"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Koristite {'{broj_ponude}'} kao oznaku koja će biti zamijenjena stvarnim brojem ponude
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Napomene
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  placeholder="Dodatne napomene o bankovnom računu..."
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData(prev => ({ ...prev, isDefault: e.target.checked }))}
                  className="h-4 w-4 text-gray-600 focus:ring-gray-500 border-gray-300 rounded"
                />
                <label htmlFor="isDefault" className="ml-2 block text-sm text-gray-900">
                  Postavi kao zadani bankovni račun
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isVisibleOnQuotes"
                  checked={formData.isVisibleOnQuotes}
                  onChange={(e) => setFormData(prev => ({ ...prev, isVisibleOnQuotes: e.target.checked }))}
                  className="h-4 w-4 text-gray-600 focus:ring-gray-500 border-gray-300 rounded"
                />
                <label htmlFor="isVisibleOnQuotes" className="ml-2 block text-sm text-gray-900">
                  Prikaži na ponudama
                </label>
              </div>
              
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 mt-2">
                <p className="text-xs text-blue-700">
                  <strong>Napomena:</strong> Ako je račun označen kao "Prikaži na ponudama", bit će vidljiv na svim ponudama.
                  Možete označiti više računa za prikaz na ponudama. Prvi račun će biti korišten za generiranje 2D barkoda.
                </p>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Odustani
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-gray-700 rounded-md hover:bg-gray-800 transition-colors"
                >
                  {editingAccount ? 'Spremi promjene' : 'Dodaj bankovni račun'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BankAccounts;
