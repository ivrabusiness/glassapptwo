import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSupabaseData } from '../../hooks/useSupabaseData';
import { Quote } from '../../types';
import QuotesList from './QuotesList';
import CreateQuote from './Create';
import EditQuote from './Edit';
import ViewQuote from './View';

const Quotes: React.FC = () => {
  const [quotes, setQuotes] = useSupabaseData<Quote>('quotes', []);
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const [currentView, setCurrentView] = useState<'list' | 'create' | 'edit' | 'view'>('list');
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);

  useEffect(() => {
    // If we have an ID in the URL, view that quote
    if (id) {
      setSelectedQuoteId(id);
      setCurrentView('view');
    }

    // KLJUČNO: Provjeri React Router state za direktno kreiranje nove ponude
    if (location.state?.action === 'create') {
      setCurrentView('create');
      // Očisti state da se ne ponovi
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [id, navigate, location]);

  const handleCreateNew = () => {
    setCurrentView('create');
  };

  const handleEditQuote = (quoteId: string) => {
    setSelectedQuoteId(quoteId);
    setCurrentView('edit');
  };

  const handleViewQuote = (quoteNumber: string) => {
    // Navigate to URL with quote number
    navigate(`/quotes/${quoteNumber}`);
  };

  const handleBackToList = () => {
    setCurrentView('list');
    navigate('/quotes');
    setSelectedQuoteId(null);
  };

  const handleBackToView = () => {
    setCurrentView('view');
    // Zadržava selectedQuoteId i ne mijenja URL
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'create':
        return <CreateQuote onBack={handleBackToList} />;
      case 'edit':
        return selectedQuoteId ? (
          <EditQuote quoteId={selectedQuoteId} onBack={handleBackToView} />
        ) : null;
      case 'view':
        return selectedQuoteId ? (
          <ViewQuote quoteId={selectedQuoteId} onBack={handleBackToList} onEdit={handleEditQuote} />
        ) : null;
      default:
        return (
          <QuotesList 
            onCreateNew={handleCreateNew}
            onEditQuote={handleEditQuote}
            onViewQuote={handleViewQuote}
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

export default Quotes;
