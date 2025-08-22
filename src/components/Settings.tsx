import React, { useState } from 'react';
import { Download, Upload, Trash2, AlertTriangle, CheckCircle, Database, ExternalLink } from 'lucide-react';
import { useSupabaseData } from '../hooks/useSupabaseData';
import { InventoryItem, Product, WorkOrder, Process, Supplier, Client, DeliveryNote, BankAccount, StockTransaction, Quote } from '../types';
import SupabaseStatus from './SupabaseStatus';
import { isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const Settings: React.FC = () => {
  const { user } = useAuth();
  const [inventory, setInventory] = useSupabaseData<InventoryItem>('inventory', []);
  const [products, setProducts] = useSupabaseData<Product>('products', []);
  const [workOrders, setWorkOrders] = useSupabaseData<WorkOrder>('work_orders', []);
  const [processes, setProcesses] = useSupabaseData<Process>('processes', []);
  const [suppliers, setSuppliers] = useSupabaseData<Supplier>('suppliers', []);
  const [clients, setClients] = useSupabaseData<Client>('clients', []);
  const [deliveryNotes, setDeliveryNotes] = useSupabaseData<DeliveryNote>('delivery_notes', []);
  const [bankAccounts, setBankAccounts] = useSupabaseData<BankAccount>('bank_accounts', []);
  const [stockTransactions, setStockTransactions] = useSupabaseData<StockTransaction>('stock_transactions', []);
  const [quotes, setQuotes] = useSupabaseData<Quote>('quotes', []);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const exportData = () => {
    const data = {
      inventory,
      products,
      workOrders,
      processes,
      suppliers,
      clients,
      deliveryNotes,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };

    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `factory-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    showNotification('success', 'Podaci su uspješno izvezeni');
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('🔄 Pokretanje uvoza datoteke:', file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        console.log('📄 Čitanje datoteke...');
        const data = JSON.parse(e.target?.result as string);
        console.log('✅ JSON uspješno parsiran:', data);
        
        // Provjeri je li ovo pojedinačna datoteka (array) ili kompletan backup (objekt)
        const isArrayFile = Array.isArray(data);
        console.log('📋 Tip datoteke:', isArrayFile ? 'Pojedinačna datoteka (array)' : 'Kompletan backup (objekt)');
        
        if (isArrayFile) {
          // Pojedinačna datoteka - prepoznaj tip po imenu datoteke
          const fileName = file.name.toLowerCase();
          console.log('📁 Ime datoteke:', fileName);
          
          // Automatski dodijeli tenantId trenutnog korisnika i ukloni postojeće ID-jeve
          const currentTenantId = user?.id;
          if (!currentTenantId) {
            throw new Error('Nema prijavljenog korisnika - ne mogu dodijeliti tenantId');
          }
          
          // Ukloni postojeće ID i tenantId, dodaj novi tenantId
          const dataWithTenant = data.map((item: any) => {
            const { id, tenantId, ...itemWithoutIds } = item;
            return {
              ...itemWithoutIds,
              tenantId: currentTenantId
            };
          });
          
          console.log('🔑 Dodajem tenantId:', currentTenantId);
          
          if (fileName.includes('supplier')) {
            console.log('🏭 Postavljam suppliers:', dataWithTenant.length, 'stavki');
            console.log('🔍 Suppliers podaci:', dataWithTenant);
            setSuppliers(dataWithTenant);
            console.log('✅ Suppliers uspješno uvezeni!');
            showNotification('success', `Uvezeno ${dataWithTenant.length} dobavljača`);
            return;
          } else if (fileName.includes('client')) {
            console.log('👥 Postavljam clients:', dataWithTenant.length, 'stavki');
            setClients(dataWithTenant);
            console.log('✅ Clients uspješno uvezeni!');
            showNotification('success', `Uvezeno ${dataWithTenant.length} klijenata`);
            return;
          } else if (fileName.includes('process')) {
            console.log('⚙️ Postavljam processes:', dataWithTenant.length, 'stavki');
            setProcesses(dataWithTenant);
            console.log('✅ Processes uspješno uvezeni!');
            showNotification('success', `Uvezeno ${dataWithTenant.length} procesa`);
            return;
          } else if (fileName.includes('inventory')) {
            console.log('📦 Postavljam inventory:', dataWithTenant.length, 'stavki');
            setInventory(dataWithTenant);
            console.log('✅ Inventory uspješno uvezen!');
            showNotification('success', `Uvezeno ${dataWithTenant.length} stavki inventara`);
            return;
          } else if (fileName.includes('product')) {
            console.log('🏷️ Postavljam products:', dataWithTenant.length, 'stavki');
            setProducts(dataWithTenant);
            console.log('✅ Products uspješno uvezeni!');
            showNotification('success', `Uvezeno ${dataWithTenant.length} proizvoda`);
            return;
          } else {
            throw new Error(`Neprepoznat tip datoteke: ${fileName}. Očekivani nazivi: suppliers.json, clients.json, processes.json, inventory.json, products.json`);
          }
        } else {
          // Kompletan backup objekt
          console.log('📊 Struktura podataka:');
          console.log('- inventory:', data.inventory?.length || 0, 'stavki');
          console.log('- products:', data.products?.length || 0, 'stavki');
          console.log('- workOrders:', data.workOrders?.length || 0, 'stavki');
          console.log('- processes:', data.processes?.length || 0, 'stavki');
          console.log('- suppliers:', data.suppliers?.length || 0, 'stavki');
          console.log('- clients:', data.clients?.length || 0, 'stavki');
          console.log('- deliveryNotes:', data.deliveryNotes?.length || 0, 'stavki');
          
          // Validate data structure - fleksibilnija provjera
          const requiredFields = ['inventory', 'products', 'workOrders', 'processes'];
          const missingFields = requiredFields.filter(field => !Array.isArray(data[field]));
          
          if (missingFields.length > 0) {
            console.error('❌ Nedostaju polja:', missingFields);
            throw new Error(`Nedostaju obavezna polja: ${missingFields.join(', ')}`);
          }

          console.log('🔄 Postavljanje podataka...');
          
          // Automatski dodijeli tenantId trenutnog korisnika i ukloni postojeće ID-jeve
          const currentTenantId = user?.id;
          if (!currentTenantId) {
            throw new Error('Nema prijavljenog korisnika - ne mogu dodijeliti tenantId');
          }
          
          // Funkcija za čišćenje podataka
          const cleanData = (items: any[]) => items.map((item: any) => {
            const { id, tenantId, ...itemWithoutIds } = item;
            return {
              ...itemWithoutIds,
              tenantId: currentTenantId
            };
          });
          
          // Postavi podatke s detaljnim logiranjem
          console.log('📦 Postavljam inventory:', data.inventory.length, 'stavki');
          setInventory(cleanData(data.inventory));
          
          console.log('🏷️ Postavljam products:', data.products.length, 'stavki');
          setProducts(cleanData(data.products));
          
          console.log('📋 Postavljam workOrders:', data.workOrders.length, 'stavki');
          setWorkOrders(cleanData(data.workOrders));
          
          console.log('⚙️ Postavljam processes:', data.processes.length, 'stavki');
          setProcesses(cleanData(data.processes));
          
          if (data.suppliers) {
            console.log('🏭 Postavljam suppliers:', data.suppliers.length, 'stavki');
            setSuppliers(cleanData(data.suppliers));
          }
          
          if (data.clients) {
            console.log('👥 Postavljam clients:', data.clients.length, 'stavki');
            setClients(cleanData(data.clients));
          }
          
          if (data.deliveryNotes) {
            console.log('📄 Postavljam deliveryNotes:', data.deliveryNotes.length, 'stavki');
            setDeliveryNotes(cleanData(data.deliveryNotes));
          }
        }
        
        console.log('✅ Svi podaci uspješno postavljeni!');
        showNotification('success', 'Podaci su uspješno uvezeni');
      } catch (error) {
        console.error('❌ Greška pri uvažanju:', error);
        console.error('📄 Raw file content:', e.target?.result);
        showNotification('error', 'Greška pri uvažanju datoteke: ' + (error as Error).message);
      }
    };
    
    reader.readAsText(file);
    event.target.value = '';
  };

  const clearAllData = async () => {
    try {
      // Briši u ispravnom redoslijed da izbjegneš foreign key constraintove
      // 1. PRVO briši stock_transactions jer referenciraju sve ostalo
      setStockTransactions([]);
      
      // 2. Zatim briši quotes jer referenciraju klijente
      setQuotes([]);
      
      // 3. Zatim briši podatke koji ovise o drugim tablicama
      setDeliveryNotes([]);
      setWorkOrders([]);
      
      // 4. Zatim briši procese
      setProcesses([]);
      
      // 5. Zatim briši proizvode i inventar
      setProducts([]);
      setInventory([]);
      
      // 6. Na kraju briši klijente i dobavljače
      setClients([]);
      setSuppliers([]);
      
      // 7. Briši bank accounts
      setBankAccounts([]);
      
      setShowConfirmDialog(false);
      showNotification('success', 'Svi podaci su uspješno obrisani');
    } catch (error) {
      console.error('Greška pri brisanju podataka:', error);
      showNotification('error', 'Greška pri brisanju podataka. Pokušajte ponovo.');
    }
  };

  const totalRecords = inventory.length + products.length + workOrders.length + processes.length + suppliers.length + clients.length + deliveryNotes.length + bankAccounts.length + stockTransactions.length + quotes.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Postavke</h1>
        <p className="text-gray-600">Upravljanje sustavom i podacima</p>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 flex items-center p-4 rounded-lg shadow-lg ${
          notification.type === 'success' 
            ? 'bg-green-100 text-green-800 border border-green-200' 
            : 'bg-red-100 text-red-800 border border-red-200'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircle className="h-5 w-5 mr-2" />
          ) : (
            <AlertTriangle className="h-5 w-5 mr-2" />
          )}
          {notification.message}
        </div>
      )}

      {/* 🚨 KRITIČNO UPOZORENJE ako Supabase nije konfiguriran */}
      {!isSupabaseConfigured() && (
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <AlertTriangle className="h-8 w-8 text-red-600 mr-3" />
            <div>
              <h2 className="text-xl font-bold text-red-900">🚨 KRITIČNO UPOZORENJE</h2>
              <p className="text-red-700">Aplikacija neće raditi bez Supabase konfiguracije!</p>
            </div>
          </div>
          
          <div className="bg-white border border-red-200 rounded-lg p-4 mb-4">
            <h3 className="font-bold text-red-900 mb-2">Što se događa:</h3>
            <ul className="text-red-700 space-y-1 list-disc list-inside text-sm">
              <li>❌ Podaci se NEĆE spremati</li>
              <li>❌ Sve promjene će se IZGUBITI</li>
              <li>❌ Aplikacija će prikazivati greške</li>
              <li>❌ Nema sinkronizacije između uređaja</li>
            </ul>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-bold text-blue-900 mb-2">🔧 HITNO - Kako riješiti:</h3>
            <ol className="text-blue-700 space-y-1 list-decimal list-inside text-sm">
              <li>Idite na <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="underline font-medium">supabase.com</a></li>
              <li>Kreirajte novi projekt</li>
              <li>Kopirajte Project URL i API Key</li>
              <li>Kreirajte .env datoteku u root direktoriju</li>
              <li>Dodajte varijable i restartajte aplikaciju</li>
            </ol>
            <a 
              href="https://supabase.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Otvori Supabase
            </a>
          </div>
        </div>
      )}

      {/* Supabase Status */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <Database className="h-5 w-5 mr-2" />
          Status baze podataka
        </h2>
        <SupabaseStatus />
      </div>

      {/* System Overview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Pregled sustava</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{inventory.length}</div>
            <div className="text-sm text-gray-600">Artikli</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{products.length}</div>
            <div className="text-sm text-gray-600">Proizvodi</div>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600">{workOrders.length}</div>
            <div className="text-sm text-gray-600">Nalozi</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{processes.length}</div>
            <div className="text-sm text-gray-600">Procesi</div>
          </div>
          <div className="text-center p-4 bg-cyan-50 rounded-lg">
            <div className="text-2xl font-bold text-cyan-600">{suppliers.length}</div>
            <div className="text-sm text-gray-600">Dobavljači</div>
          </div>
          <div className="text-center p-4 bg-pink-50 rounded-lg">
            <div className="text-2xl font-bold text-pink-600">{clients.length}</div>
            <div className="text-sm text-gray-600">Klijenti</div>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{deliveryNotes.length}</div>
            <div className="text-sm text-gray-600">Otpremnice</div>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{bankAccounts.length}</div>
            <div className="text-sm text-gray-600">Bankovni računi</div>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            <strong>Ukupno zapisa:</strong> {totalRecords}
          </p>
          <p className="text-sm text-gray-600">
            <strong>Zadnja promjena:</strong> {new Date().toLocaleString('hr-HR')}
          </p>
          <p className="text-sm font-medium text-blue-600">
            <strong>Način rada:</strong> {isSupabaseConfigured() ? '✅ SAMO SUPABASE' : '❌ NEĆE RADITI'}
          </p>
        </div>
      </div>

      {/* Data Management - SAMO ako je Supabase konfiguriran */}
      {isSupabaseConfigured() && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Upravljanje podacima</h2>
          
          <div className="space-y-4">
            {/* Export Data */}
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Izvezi podatke</h3>
                <p className="text-sm text-gray-600">Preuzmi sigurnosnu kopiju svih podataka</p>
              </div>
              <button
                onClick={exportData}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="h-4 w-4 mr-2" />
                Izvezi
              </button>
            </div>

            {/* Import Data */}
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Uvezi podatke</h3>
                <p className="text-sm text-gray-600">Učitaj podatke iz sigurnosne kopije</p>
              </div>
              <label className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors cursor-pointer">
                <Upload className="h-4 w-4 mr-2" />
                Uvezi
                <input
                  type="file"
                  accept=".json"
                  onChange={importData}
                  className="hidden"
                />
              </label>
            </div>

            {/* Clear All Data */}
            <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
              <div>
                <h3 className="text-sm font-medium text-red-900">Obriši sve podatke</h3>
                <p className="text-sm text-red-600">Trajno ukloni sve podatke iz Supabase baze</p>
              </div>
              <button
                onClick={() => setShowConfirmDialog(true)}
                className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Obriši sve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* System Information */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Informacije o sustavu</h2>
        
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Verzija:</span>
            <span className="font-medium">1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Tip sustava:</span>
            <span className="font-medium">TolicApp Pro</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Pohrana:</span>
            <span className={`font-medium ${isSupabaseConfigured() ? 'text-green-600' : 'text-red-600'}`}>
              {isSupabaseConfigured() ? '✅ Samo Supabase (Cloud)' : '❌ Nije konfiguriran'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Sigurnosne kopije:</span>
            <span className="font-medium text-blue-600">Automatske (Supabase)</span>
          </div>
        </div>
      </div>

      {/* Confirm Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-6 w-6 text-red-500 mr-3" />
              <h2 className="text-lg font-medium text-gray-900">Potvrda brisanja</h2>
            </div>
            
            <p className="text-sm text-gray-600 mb-6">
              Jeste li sigurni da želite obrisati sve podatke? Ova akcija je nepovratna i svi podaci će biti trajno uklonjeni iz Supabase baze.
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Odustani
              </button>
              <button
                onClick={clearAllData}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
              >
                Obriši sve podatke
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
