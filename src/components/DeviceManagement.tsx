import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Search, 
  Trash2, 
  Smartphone, 
  Shield, 
  ShieldCheck, 
  ShieldX,
  Eye,
  EyeOff,
  Copy,
  CheckCircle,
  AlertTriangle,
  Clock,
  Monitor
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { 
  registerDevice, 
  getDevicesForTenant, 
  updateDeviceStatus, 
  deleteDevice,
  DeviceRegistrationData,
  DeviceInfo 
} from '../lib/deviceApi';

const DeviceManagement: React.FC = () => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  
  const [devices, setDevices] = useState<DeviceInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState<DeviceRegistrationData>({
    deviceName: '',
    email: '',
    password: ''
  });
  
  const [generatedCredentials, setGeneratedCredentials] = useState<{
    email: string;
    password: string;
    deviceCode: string;
  } | null>(null);

  const loadDevices = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const deviceList = await getDevicesForTenant(user.id);
      setDevices(deviceList);
    } catch (error) {
      console.error('Error loading devices:', error);
      addNotification({ title: 'Greška', message: 'Greška pri učitavanju uređaja', type: 'warning' });
    } finally {
      setLoading(false);
    }
  }, [user, addNotification]);

  useEffect(() => {
    if (user) {
      loadDevices();
    }
  }, [user, loadDevices]);
  // Auto-generiranje kredencijala je uklonjeno

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      addNotification({ title: 'Upozorenje', message: 'Morate biti prijavljeni', type: 'warning' });
      return;
    }

    if (!formData.deviceName.trim()) {
      addNotification({ title: 'Upozorenje', message: 'Ime uređaja je obavezno', type: 'warning' });
      return;
    }

    if (!formData.email.trim() || !formData.password.trim()) {
      addNotification({ title: 'Upozorenje', message: 'Email i lozinka su obavezni', type: 'warning' });
      return;
    }

    try {
      const registrationData: DeviceRegistrationData = {
        deviceName: formData.deviceName.trim(),
        email: formData.email.trim(),
        password: formData.password
      };

      const result = await registerDevice(user.id, registrationData);
      
      if (result.success) {
        if (result.deviceCode) {
          // Prikaži unesene kredencijale (ili one vraćene iz API-ja)
          const email = result.email || formData.email.trim();
          const password = result.password || formData.password;
          
          // Show credentials in custom modal
          setGeneratedCredentials({
            email,
            password,
            deviceCode: result.deviceCode
          });
          
          // Close registration modal
          setIsModalOpen(false);
        }
        // Napomena: nema toasta na uspješnu registraciju (zahtjev: bez notifikacija pri kreiranju uređaja)
        
        // Reset form
        setFormData({
          deviceName: '',
          email: '',
          password: ''
        });
        
        // Reload devices
        await loadDevices();
      } else {
        addNotification({ title: 'Greška', message: result.error || 'Greška pri registraciji uređaja', type: 'warning' });
      }
    } catch (error) {
      console.error('Registration error:', error);
      addNotification({ title: 'Greška', message: 'Neočekivana greška pri registraciji', type: 'warning' });
    }
  };

  const handleStatusChange = async (deviceId: string, newStatus: 'active' | 'inactive' | 'suspended') => {
    try {
      const result = await updateDeviceStatus(deviceId, newStatus);
      if (result.success) {
        await loadDevices();
      } else {
        // silent per request
      }
    } catch (error) {
      console.error('Status update error:', error);
      // silent per request
    }
  };

  const handleDelete = async (deviceId: string, deviceName: string) => {
    if (!confirm(`Jeste li sigurni da želite obrisati uređaj "${deviceName}"? Ova akcija se ne može poništiti.`)) {
      return;
    }

    try {
      const result = await deleteDevice(deviceId);
      if (result.success) {
        await loadDevices();
      } else {
        // silent per request
      }
    } catch (error) {
      console.error('Delete error:', error);
      // silent per request
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    addNotification({ title: 'Info', message: 'Kopirano u međuspremnik', type: 'info' });
  };

  const resetForm = () => {
    setFormData({
      deviceName: '',
      email: '',
      password: ''
    });
    setIsModalOpen(false);
    setShowPassword(false);
  };
  
  const closeCredentialsModal = () => {
    setGeneratedCredentials(null);
  };

  const filteredDevices = devices.filter(device =>
    device.device_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    device.device_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <ShieldCheck className="h-4 w-4 text-green-500" />;
      case 'inactive':
        return <Shield className="h-4 w-4 text-gray-500" />;
      case 'suspended':
        return <ShieldX className="h-4 w-4 text-red-500" />;
      default:
        return <Shield className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Upravljanje uređajima</h1>
          <p className="text-gray-600">Registrirajte i upravljajte uređajima za process management</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Registriraj uređaj
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <input
          type="text"
          placeholder="Pretraži uređaje..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Devices List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Registrirani uređaji ({filteredDevices.length})</h2>
        </div>
        
        {filteredDevices.length === 0 ? (
          <div className="p-6 text-center">
            <Monitor className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Nema registriranih uređaja</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? 'Nema uređaja koji odgovaraju pretraživanju.' : 'Počnite registriranjem prvog uređaja.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredDevices.map((device) => (
              <div key={device.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <Smartphone className="h-8 w-8 text-gray-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{device.device_name}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className="font-mono">{device.device_code}</span>
                        {device.last_login && (
                          <>
                            <span>•</span>
                            <span className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {new Date(device.last_login).toLocaleDateString('hr-HR')}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {/* Status Badge */}
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(device.status)}`}>
                      {getStatusIcon(device.status)}
                      <span className="ml-1 capitalize">{device.status}</span>
                    </span>
                    
                    {/* Status Change Dropdown */}
                    <select
                      value={device.status}
                      onChange={(e) => handleStatusChange(device.id, e.target.value as any)}
                      className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="active">Aktivan</option>
                      <option value="inactive">Neaktivan</option>
                      <option value="suspended">Suspendiran</option>
                    </select>
                    
                    {/* View Credentials Button removed (kredencijali se prikazuju samo jednom kod registracije) */}
                    
                    {/* Delete Button */}
                    <button
                      onClick={() => handleDelete(device.id, device.device_name)}
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                      title="Obriši uređaj"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Registration Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Registracija novog uređaja</h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ime uređaja *
                </label>
                <input
                  type="text"
                  value={formData.deviceName}
                  onChange={(e) => setFormData(prev => ({ ...prev, deviceName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="npr. Radni stol 1, Tablet proizvodnja..."
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Unesite email uređaja"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lozinka *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Unesite lozinku uređaja"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              
              {/* Napomena o automatskom generiranju je uklonjena */}
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Odustani
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Registriraj uređaj
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generated Credentials Modal */}
      {generatedCredentials && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                <h2 className="text-lg font-medium text-gray-900">Uređaj je registriran</h2>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <div className="flex">
                  <AlertTriangle className="h-5 w-5 text-yellow-400 mr-2 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-yellow-800">Važno!</h3>
                    <p className="text-sm text-yellow-700 mt-1">
                      Zapišite ove podatke jer se neće ponovno prikazati. Potrebni su za prijavu na uređaj.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <div className="flex">
                    <input
                      type="text"
                      value={generatedCredentials.email}
                      readOnly
                      className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-l-lg text-sm"
                    />
                    <button
                      onClick={() => copyToClipboard(generatedCredentials.email)}
                      className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg hover:bg-gray-200"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lozinka</label>
                  <div className="flex">
                    <input
                      type="text"
                      value={generatedCredentials.password}
                      readOnly
                      className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-l-lg text-sm font-mono"
                    />
                    <button
                      onClick={() => copyToClipboard(generatedCredentials.password)}
                      className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg hover:bg-gray-200"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kod uređaja</label>
                  <div className="flex">
                    <input
                      type="text"
                      value={generatedCredentials.deviceCode}
                      readOnly
                      className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-l-lg text-sm font-mono"
                    />
                    <button
                      onClick={() => copyToClipboard(generatedCredentials.deviceCode)}
                      className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg hover:bg-gray-200"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-700">
                  URL za pristup: <strong>http://localhost:5173/device-login</strong>
                </p>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200">
              <button
                onClick={closeCredentialsModal}
                className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Razumijem, zatvori
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeviceManagement;

