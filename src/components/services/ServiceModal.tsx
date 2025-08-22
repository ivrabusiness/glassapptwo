import React from 'react';
import { X } from 'lucide-react';
import { Service } from '../../types';
import ServiceForm from './ServiceForm';

interface ServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (service: Service) => void;
  isSubmitting?: boolean;
  initialService?: Service;
}

const ServiceModal: React.FC<ServiceModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  isSubmitting = false,
  initialService 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-xl w-full max-h-[90vh] overflow-y-auto relative z-10">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-medium text-gray-900">
            {initialService ? 'Uredi uslugu' : 'Dodaj novu uslugu'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 rounded-full p-1"
            aria-label="Zatvori"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-6">
          <ServiceForm 
            initialService={initialService} 
            onSave={onSave}
            isSubmitting={isSubmitting}
            onCancel={onClose} 
          />
        </div>
      </div>
    </div>
  );
};

export default ServiceModal;
