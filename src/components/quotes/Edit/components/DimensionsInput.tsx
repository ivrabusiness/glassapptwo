import React from 'react';
import { QuoteItem } from '../../../../types';

interface DimensionsInputProps {
  item: QuoteItem;
  onDimensionChange: (field: 'width' | 'height', value: number) => void;
}

const DimensionsInput: React.FC<DimensionsInputProps> = ({
  item,
  onDimensionChange
}) => {
  if (item.isService) return null;

  return (
    <>
      {/* Width in mm */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Širina (mm)</label>
        <input
          type="number"
          min="0"
          step="0.1"
          value={item.dimensions.width}
          onChange={(e) => onDimensionChange('width', parseFloat(e.target.value) || 0)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          placeholder="npr. 3503"
        />
      </div>

      {/* Height in mm */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Visina (mm)</label>
        <input
          type="number"
          min="0"
          step="0.1"
          value={item.dimensions.height}
          onChange={(e) => onDimensionChange('height', parseFloat(e.target.value) || 0)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          placeholder="npr. 2203"
        />
      </div>
    </>
  );
};

export default DimensionsInput;

