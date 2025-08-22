import React from 'react';
import { Client } from '../../../types';
import { Building, User, MapPin, Mail, Phone } from 'lucide-react';

interface ClientInfoProps {
  client: Client;
}

const ClientInfo: React.FC<ClientInfoProps> = ({ client }) => {
  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4 pb-2 border-b border-gray-100">
        Podaci o klijentu
      </h3>
      
      <div className="flex items-start space-x-4">
        <div className="h-12 w-12 flex-shrink-0 flex items-center justify-center rounded-full bg-gray-100">
          {client.type === 'company' ? (
            <Building className="h-6 w-6 text-gray-600" />
          ) : (
            <User className="h-6 w-6 text-gray-600" />
          )}
        </div>
        
        <div className="flex-1 space-y-3">
          <div>
            <h4 className="text-lg font-medium text-gray-900">{client.name}</h4>
            <p className="text-sm text-gray-500">
              {client.type === 'company' ? 'Tvrtka' : 'Fizička osoba'}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center">
              <MapPin className="h-4 w-4 text-gray-400 mr-2" />
              <span className="text-gray-600">{client.address}</span>
            </div>
            
            <div className="flex items-center">
              <div className="h-4 w-4 text-gray-400 mr-2 flex items-center justify-center">
                <span className="text-xs font-bold">OIB</span>
              </div>
              <span className="text-gray-600">{client.oib}</span>
            </div>
            
            {client.contactPerson && (
              <div className="flex items-center">
                <User className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-gray-600">{client.contactPerson}</span>
              </div>
            )}
            
            {client.phone && (
              <div className="flex items-center">
                <Phone className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-gray-600">{client.phone}</span>
              </div>
            )}
            
            {client.email && (
              <div className="flex items-center">
                <Mail className="h-4 w-4 text-gray-400 mr-2" />
                <span className="text-gray-600">{client.email}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientInfo;
