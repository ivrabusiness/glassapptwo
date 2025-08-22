import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSupabaseData } from '../../hooks/useSupabaseData';
import { WorkOrder } from '../../types';
import WorkOrdersList from './workorderlist';
import CreateWorkOrder from './Create';
import EditWorkOrder from './Edit';
import ViewWorkOrder from './View';

const WorkOrders: React.FC = () => {
  const [workOrders] = useSupabaseData<WorkOrder>('work_orders', []);
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const [currentView, setCurrentView] = useState<'list' | 'create' | 'edit' | 'view'>('list');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  useEffect(() => {
    // If we have an ID in the URL, view that work order
    if (id) {
      setSelectedOrderId(id);
      setCurrentView('view');
    }

    // KLJUČNO: Provjeri React Router state za direktno kreiranje novog naloga
    if (location.state?.action === 'create') {
      setCurrentView('create');
      // Očisti state da se ne ponovi
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [id, navigate, location]);

  const handleBackToListWithCleanup = () => {
    handleBackToList();
  };

  const handleCreateNew = () => {
    setCurrentView('create');
  };

  const handleEditOrder = (orderId: string) => {
    setSelectedOrderId(orderId);
    setCurrentView('edit');
  };

  const handleViewOrder = (orderNumber: string) => {
    // Navigate to URL with order number
    navigate(`/work-orders/${orderNumber}`);
  };

  const handleBackToList = () => {
    setCurrentView('list');
    navigate('/work-orders');
    setSelectedOrderId(null);
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'create':
        return <CreateWorkOrder onBack={handleBackToList} />;
      case 'edit':
        return selectedOrderId ? (
          <EditWorkOrder orderId={selectedOrderId} onBack={handleBackToListWithCleanup} />
        ) : null;
      case 'view':
        return selectedOrderId ? (
          <ViewWorkOrder orderId={selectedOrderId} onBack={handleBackToListWithCleanup} onEdit={handleEditOrder} />
        ) : null;
      default:
        return (
          <WorkOrdersList 
            onCreateNew={handleCreateNew}
            onEditOrder={handleEditOrder}
            onViewOrder={handleViewOrder}
          />
        );
    }
  };

  return (
    <div className="space-y-6">
      {renderCurrentView()}
    </div>
  );
};

export default WorkOrders;
