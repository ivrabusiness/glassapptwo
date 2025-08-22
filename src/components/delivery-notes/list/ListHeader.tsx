import React from 'react';

interface ListHeaderProps {
  onSearch: (term: string) => void;
}

const ListHeader: React.FC<ListHeaderProps> = ({ onSearch }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Otpremnice</h1>
        <p className="text-gray-600">Upravljanje otpremnicama i isporukama</p>
      </div>
    </div>
  );
};

export default ListHeader;
