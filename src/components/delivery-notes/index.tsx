import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DeliveryNoteListContainer from './list';
import DeliveryNoteView from './View';

const DeliveryNotes: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedDeliveryNoteId, setSelectedDeliveryNoteId] = useState<string | null>(null);

  // If we have an ID in the URL, use it
  React.useEffect(() => {
    if (id) {
      setSelectedDeliveryNoteId(id);
    }
  }, [id]);

  const handleViewDeliveryNote = (deliveryNumber: string) => {
    // Navigate to URL with delivery number
    navigate(`/delivery-notes/${deliveryNumber}`);
  };

  const handleBackToList = () => {
    setSelectedDeliveryNoteId(null);
    navigate('/delivery-notes');
  };

  if (selectedDeliveryNoteId) {
    return <DeliveryNoteView deliveryNoteId={selectedDeliveryNoteId} onBack={handleBackToList} />;
  }

  return <DeliveryNoteListContainer onViewDeliveryNote={handleViewDeliveryNote} />;
};

export default DeliveryNotes;
