import React from 'react';
import { FileCheck, Loader2 } from 'lucide-react';

interface ActionButtonsProps {
  onSaveAndSend: () => void;
  canSave: boolean;
  isLoading: boolean;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  onSaveAndSend,
  canSave,
  isLoading
}) => {
  return (
    <div className="flex space-x-3">
        <button
          onClick={onSaveAndSend}
          disabled={!canSave || isLoading}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <FileCheck className="h-4 w-4 mr-2" />
          )}
          Kreiraj
        </button>
    </div>
  );
};

export default ActionButtons;

