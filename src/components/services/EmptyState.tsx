import React from 'react';
import { FileText } from 'lucide-react';

const EmptyState: React.FC = () => {
  return (
    <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
      <FileText className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-2 text-sm font-medium text-gray-900">Nema usluga</h3>
      <p className="mt-1 text-sm text-gray-500">
        Počnite dodavanjem nove usluge.
      </p>
    </div>
  );
};

export default EmptyState;
