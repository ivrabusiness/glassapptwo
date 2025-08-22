import React, { useState } from 'react';
import { Truck, AlertCircle, X, CheckCircle } from 'lucide-react';

interface DeliveryConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (receivedBy: string) => void;
  deliveryNumber: string;
}

const DeliveryConfirmationModal: React.FC<DeliveryConfirmationModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  deliveryNumber 
}) => {
  const [receivedBy, setReceivedBy] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!receivedBy.trim()) {
      setError('Molimo unesite ime osobe koja je preuzela otpremnicu');
      return;
    }
    
    onConfirm(receivedBy);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose}></div>
        
        <div className="relative bg-white rounded-lg max-w-md w-full shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-gray-200">
            <div className="flex items-center">
              <Truck className="h-6 w-6 text-green-600 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Potvrda isporuke</h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          {/* Content */}
          <form onSubmit={handleSubmit} className="p-5">
            <div className="flex items-start mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-700">
                  Potvrda isporuke otpremnice <strong>{deliveryNumber}</strong>
                </p>
                <p className="text-sm text-green-600 mt-1">
                  Kada potvrdite isporuku, status otpremnice će biti promijenjen u "Isporučena" i status povezanog radnog naloga će biti automatski označen kao "Završen".
                </p>
              </div>
            </div>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
            
            <div className="mb-5">
              <label htmlFor="receivedBy" className="block text-sm font-medium text-gray-700 mb-1">
                Otpremnicu preuzeo/la
              </label>
              <input
                type="text"
                id="receivedBy"
                value={receivedBy}
                onChange={(e) => {
                  setReceivedBy(e.target.value);
                  setError(null);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Ime i prezime klijenta koji je preuzeo"
                autoFocus
              />
              <p className="mt-1 text-xs text-gray-500">
                Unesite ime osobe koja je preuzela otpremnicu
              </p>
            </div>
            
            {/* Footer */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Odustani
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
              >
                Potvrdi isporuku
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DeliveryConfirmationModal;
