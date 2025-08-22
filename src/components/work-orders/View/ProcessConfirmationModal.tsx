import React from 'react';

interface ProcessAnalysis {
  incompleteProcesses: Array<{
    processName: string;
    itemName: string;
    materialName: string;
    count: number;
  }>;
  totalIncomplete: number;
  allProcesses: number;
}

interface ProcessConfirmationModalProps {
  isOpen: boolean;
  processAnalysis: ProcessAnalysis | null;
  onConfirm: () => void;
  onCancel: () => void;
}

const ProcessConfirmationModal: React.FC<ProcessConfirmationModalProps> = ({
  isOpen,
  processAnalysis,
  onConfirm,
  onCancel
}) => {
  if (!isOpen || !processAnalysis) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          ⚠️ Potvrda generiranja otpremnice
        </h3>
        
        <div className="mb-6">
          <p className="text-sm text-gray-700 mb-4">
            <strong>Generiranje otpremnice će automatski označiti radni nalog kao završen.</strong>
          </p>
          
          {processAnalysis.totalIncomplete > 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-yellow-800">
                    Sljedeći procesi će se automatski označiti kao završeni:
                  </h4>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p className="mb-2">
                      <strong>Ukupno nezavršenih procesa: {processAnalysis.totalIncomplete} od {processAnalysis.allProcesses}</strong>
                    </p>
                    <div className="space-y-2">
                      {processAnalysis.incompleteProcesses.map((proc, index) => (
                        <div key={index} className="bg-white rounded p-2 border border-yellow-300">
                          <div className="font-medium">{proc.processName}</div>
                          <div className="text-xs text-gray-600">
                            {proc.itemName} → {proc.materialName}
                            {proc.count > 1 && ` (${proc.count}x)`}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-green-800">
                    Svi procesi su već završeni
                  </h4>
                  <p className="text-sm text-green-700 mt-1">
                    Ukupno procesa: {processAnalysis.allProcesses} (svi završeni)
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-red-800">
                  PAŽNJA - Ova akcija se ne može poništiti!
                </h4>
                <ul className="text-sm text-red-700 mt-1 list-disc list-inside space-y-1">
                  <li>Radni nalog će biti označen kao završen</li>
                  <li>Svi procesi će biti označeni kao završeni</li>
                  <li>Otpremnica će biti generirana</li>
                  <li>Nalog se neće moći više uređivati</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Odustani
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            ✅ DA, generiraj otpremnicu
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProcessConfirmationModal;

