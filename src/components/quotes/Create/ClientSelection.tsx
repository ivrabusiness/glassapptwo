import React from 'react';
import { User, Building } from 'lucide-react';
import { Client } from '../../../types';

interface ClientSelectionProps {
  selectedClientId: string;
  onClientChange: (clientId: string) => void;
  clients: Client[];
}

const ClientSelection: React.FC<ClientSelectionProps> = ({
  selectedClientId,
  onClientChange,
  clients
}) => {
  const selectedClient = clients.find(c => c.id === selectedClientId);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Klijent</h2>
      <select
        value={selectedClientId}
        onChange={(e) => onClientChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        required
      >
        <option value="">Odaberite klijenta</option>
        {clients.map(client => (
          <option key={client.id} value={client.id}>
            {client.name} ({client.type === 'company' ? 'Tvrtka' : 'Fizička osoba'})
          </option>
        ))}
      </select>
      
      {selectedClient && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-start space-x-3">
            {selectedClient.type === 'company' ? (
              <Building className="h-5 w-5 text-purple-500 mt-0.5" />
            ) : (
              <User className="h-5 w-5 text-green-500 mt-0.5" />
            )}
            <div>
              <p className="text-sm font-medium text-gray-900">{selectedClient.name}</p>
              <p className="text-sm text-gray-600">{selectedClient.address}</p>
              <p className="text-sm text-gray-600">OIB: {selectedClient.oib}</p>
              {selectedClient.contactPerson && (
                <p className="text-sm text-gray-600">Kontakt: {selectedClient.contactPerson}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientSelection;
