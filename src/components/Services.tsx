import React from 'react';
import { useSupabaseData } from '../hooks/useSupabaseData';
import { Service } from '../types';
import ServicesList from './services/ServicesList';
import ServiceHeader from './services/ServiceHeader';
import SearchBar from './services/SearchBar';
import ServiceModal from './services/ServiceModal';
import { generateId } from '../utils/idGenerators';

const Services: React.FC = () => {
  const [services, setServices] = useSupabaseData<Service>('services', []);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [editingService, setEditingService] = React.useState<Service | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateNew = () => {
    setEditingService(undefined);
    setIsModalOpen(true);
  };

  const handleSaveService = async (service: Service) => {
    setIsSubmitting(true);
    
    if (!service.id) {
      // New service
      const newService = {
        ...service,
        id: generateId(),
        createdAt: new Date().toISOString()
      };
      
      try {
        await setServices(prev => [...prev, newService]);

      } catch (error) {
        console.error('❌ Error saving new service:', error);
        alert('Greška pri spremanju usluge. Molimo pokušajte ponovno.');
      }
    } else {
      // Update existing service
      try {
        await setServices(prev => prev.map(s => s.id === service.id ? service : s));

      } catch (error) {
        console.error('❌ Error updating service:', error);
        alert('Greška pri ažuriranju usluge. Molimo pokušajte ponovno.');
      }
    }
    
    setIsSubmitting(false);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <ServiceHeader onCreateNew={handleCreateNew} />

      {/* Search */}
      <SearchBar 
        searchTerm={searchTerm} 
        setSearchTerm={setSearchTerm} 
        resultsCount={filteredServices.length}
      />

      {/* Services List */}
      <ServicesList 
        services={filteredServices} 
        setServices={setServices}
        onEditService={(service) => {
          setEditingService(service);
          setIsModalOpen(true);
        }}
      />

      {/* Service Modal */}
      <ServiceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveService}
        isSubmitting={isSubmitting}
        initialService={editingService}
      />
    </div>
  );
};

export default Services;
