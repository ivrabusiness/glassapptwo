import React from 'react';
import { ArrowRight, CheckCircle } from 'lucide-react';

interface ModalActionsProps {
  isPreviewMode: boolean;
  itemsCount: number;
  onParseItems: () => void;
  onAddItems: () => void;
  onGoBack: () => void;
  onClose: () => void;
}

/**
 * Komponenta za akcije u bulk entry modalu
 */
const ModalActions: React.FC<ModalActionsProps> = ({
  isPreviewMode,
  itemsCount,
  onParseItems,
  onAddItems,
  onGoBack,
  onClose
}) => {
  return (
    <div className="bg-gray-50 px-4 py-4 sm:px-6 sm:flex sm:flex-row-reverse border-t border-gray-200">
      {!isPreviewMode ? (
        <>
          <button
            type="button"
            onClick={onParseItems}
            className="w-full inline-flex justify-center items-center rounded-lg border border-transparent shadow-sm px-4 py-2.5 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm transition-colors"
          >
            <ArrowRight className="h-4 w-4 mr-1.5" />
            Pregledaj artikle
          </button>
          <button
            type="button"
            onClick={onClose}
            className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2.5 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
          >
            Odustani
          </button>
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={onAddItems}
            className="w-full inline-flex justify-center items-center rounded-lg border border-transparent shadow-sm px-4 py-2.5 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none sm:ml-3 sm:w-auto sm:text-sm transition-colors"
          >
            <CheckCircle className="h-4 w-4 mr-1.5" />
            Dodaj {itemsCount} artikala
          </button>
          <button
            type="button"
            onClick={onGoBack}
            className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2.5 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
          >
            Natrag na uređivanje
          </button>
        </>
      )}
    </div>
  );
};

export default ModalActions;

