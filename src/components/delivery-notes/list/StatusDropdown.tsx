import React, { forwardRef } from 'react';
import { CheckCircle, Clock, Receipt } from 'lucide-react';

interface StatusDropdownProps {
  dropdownPosition: { top: number; left: number };
  onStatusChange: (status: 'draft' | 'generated' | 'delivered' | 'invoiced') => void;
  currentStatus: string;
}

const StatusDropdown = forwardRef<HTMLDivElement, StatusDropdownProps>(
  ({ dropdownPosition, onStatusChange, currentStatus }, ref) => {
    const statusOptions = [
      { value: 'generated', label: 'Generirana', icon: Clock, color: 'text-blue-700', dotColor: 'bg-blue-500' },
      { value: 'delivered', label: 'Isporučena', icon: CheckCircle, color: 'text-green-700', dotColor: 'bg-green-500' },
      { value: 'invoiced', label: 'Izdan račun', icon: Receipt, color: 'text-purple-700', dotColor: 'bg-purple-500' }
    ];

    return (
      <div 
        ref={ref}
        className="fixed z-50 w-52 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden"
        style={{
          top: `${dropdownPosition.top}px`,
          left: `${dropdownPosition.left}px`
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="py-1">
          {statusOptions.map((option) => {
            const OptionIcon = option.icon;
            const isSelected = currentStatus === option.value;
            
            return (
              <button
                key={option.value}
                onClick={(e) => {
                  e.stopPropagation();
                  onStatusChange(option.value as any);
                }}
                className={`w-full flex items-center px-4 py-3 text-sm transition-colors duration-150 ${
                  isSelected 
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-500' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className={`w-2 h-2 rounded-full mr-3 ${option.dotColor}`}></div>
                <OptionIcon className="h-4 w-4 mr-3" />
                <span className="font-medium">{option.label}</span>
                {isSelected && (
                  <CheckCircle className="h-4 w-4 ml-auto text-blue-500" />
                )}
              </button>
            );
          })}
        </div>
        
        {/* Divider and info */}
        <div className="border-t border-gray-100 px-4 py-2 bg-gray-50">
          <p className="text-xs text-gray-500">Kliknite za promjenu statusa</p>
        </div>
      </div>
    );
  }
);

export default StatusDropdown;
