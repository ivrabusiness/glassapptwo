import React from 'react';
import { FileCheck, AlertCircle } from 'lucide-react';

interface SuccessModalProps {
  isOpen: boolean;
  successData: {
    type: 'created';
    error?: string;
    quoteNumber?: string;
  } | null;
  onClose: () => void;
}

const SuccessModal: React.FC<SuccessModalProps> = ({ isOpen, successData, onClose }) => {
  if (!isOpen || !successData) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              {!successData.error ? (
                <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full sm:mx-0 sm:h-10 sm:w-10 bg-purple-100`}>
                  <FileCheck className="h-6 w-6 text-purple-600" />
                </div>
              ) : (
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full sm:mx-0 sm:h-10 sm:w-10 bg-red-100">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
              )}
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Ponuda uspješno kreirana!
                </h3>
                <div className="mt-2">
                  {!successData.error ? (
                    <p className="text-sm text-gray-500">
                      {`Ponuda ${successData.quoteNumber || ''} je uspješno kreirana i spremna za slanje klijentu.`}
                    </p>
                  ) : (
                    <p className="text-sm text-red-500">
                      {successData.error}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={onClose}
              className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white sm:ml-3 sm:w-auto sm:text-sm bg-purple-600 hover:bg-purple-700`}
            >
              U redu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuccessModal;

