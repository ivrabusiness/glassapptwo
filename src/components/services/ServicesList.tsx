import React from 'react';
import { Service } from '../../types';
import ServiceItem from './ServiceItem';
import EmptyState from './EmptyState';

interface ServicesListProps {
  services: Service[];
  setServices: React.Dispatch<React.SetStateAction<Service[]>>;
  onEditService: (service: Service) => void;
}

const ServicesList: React.FC<ServicesListProps> = ({ 
  services, 
  setServices, 
  onEditService 
}) => {
  if (services.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="divide-y divide-gray-200">
        {services.map((service) => (
          <ServiceItem
            key={service.id}
            service={service}
            onEdit={() => onEditService(service)}
            setServices={setServices}
          />
        ))}
      </div>
    </div>
  );
};

export default ServicesList;
