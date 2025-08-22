import { Calendar, CheckCircle, Clock, FileText, XCircle, Archive as ArchiveIcon, Truck, DollarSign } from 'lucide-react';
import type { WorkOrder } from '../../../types';

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'draft': return 'bg-gray-100 text-gray-800';
    case 'pending': return 'bg-yellow-100 text-yellow-800';
    case 'in-progress': return 'bg-blue-100 text-blue-800';
    case 'completed': return 'bg-green-100 text-green-800';
    case 'cancelled': return 'bg-red-100 text-red-800';
    case 'archived': return 'bg-gray-200 text-gray-700';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const getStatusText = (status: string) => {
  switch (status) {
    case 'draft': return 'Nacrt';
    case 'pending': return 'U tijeku';
    case 'in-progress': return 'U tijeku';
    case 'completed': return 'Završen';
    case 'cancelled': return 'Otkazan';
    case 'archived': return 'Arhiviran';
    default: return status;
  }
};

export const getStatusIcon = (status: string) => {
  switch (status) {
    case 'draft': return FileText;
    case 'pending': return Clock;
    case 'in-progress': return Calendar;
    case 'completed': return CheckCircle;
    case 'cancelled': return XCircle;
    case 'archived': return ArchiveIcon;
    default: return Clock;
  }
};

export const getProcessCompletion = (order: WorkOrder) => {
  let totalProcesses = 0;
  let completedProcesses = 0;

  const items = order.items || [];
  items.forEach(item => {
    if (item.materials && item.materials.length > 0) {
      item.materials.forEach(material => {
        if (material.processSteps && material.processSteps.length > 0) {
          material.processSteps.forEach(step => {
            totalProcesses++;
            if (step.status === 'completed') {
              completedProcesses++;
            }
          });
        }
      });
    }
  });

  return {
    completed: completedProcesses,
    total: totalProcesses,
    percentage: totalProcesses > 0 ? Math.round((completedProcesses / totalProcesses) * 100) : 0
  };
};

export const formatDimensions = (order: WorkOrder) => {
  const items = order.items || [];
  const productItems = items.filter(item => !item.isService);

  if (productItems.length === 0) {
    return 'Nema proizvoda';
  }

  if (productItems.length === 1) {
    const item = productItems[0];
    return `${item.dimensions.width} × ${item.dimensions.height} mm`;
  }

  return `${productItems.length} različitih dimenzija`;
};

export const getTotalArea = (order: WorkOrder) => {
  const items = order.items || [];
  const productItems = items.filter(item => !item.isService);
  return productItems.reduce((total, item) => total + (item.dimensions.area * item.quantity), 0);
};

export const getTotalItems = (order: WorkOrder) => {
  const items = order.items || [];
  return items.reduce((total, item) => total + item.quantity, 0);
};

export const getDeliveryNoteConfig = (status: string) => {
  switch (status) {
    case 'delivered':
      return {
        color: 'text-green-600 bg-green-50 border-green-200',
        icon: Truck,
        text: 'Isporučena'
      };
    case 'invoiced':
      return {
        color: 'text-purple-600 bg-purple-50 border-purple-200',
        icon: DollarSign,
        text: 'Račun izdan'
      };
    case 'generated':
      return {
        color: 'text-blue-600 bg-blue-50 border-blue-200',
        icon: FileText,
        text: 'Generirana'
      };
    default:
      return {
        color: 'text-orange-600 bg-orange-50 border-orange-200',
        icon: FileText,
        text: 'Otpremnica'
      };
  }
};
