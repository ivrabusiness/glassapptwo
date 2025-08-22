import React from 'react';
import { MaterialRequirement } from '@/lib/issueWorkOrder';

type Props = {
  isOpen: boolean;
  orderNumber: string;
  requirements: MaterialRequirement[];
  onConfirm: () => void;
  onCancel: () => void;
  isSubmitting?: boolean;
  isSuccess?: boolean;
};

const IssueConfirmationModal: React.FC<Props> = ({ isOpen, orderNumber, requirements, onConfirm, onCancel, isSubmitting = false, isSuccess = false }) => {
  if (!isOpen) return null;

  const allOk = requirements.every(r => r.sufficient);
  const confirmDisabled = !allOk || isSubmitting || isSuccess;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Provjera materijala za nalog {orderNumber}</h3>
          <p className="text-sm text-gray-500 mt-1">Pregled dostupnosti materijala na skladištu.</p>
        </div>

        <div className="max-h-96 overflow-auto divide-y divide-gray-100 border border-gray-100 rounded-md">
          {requirements.length === 0 && (
            <div className="p-4 text-sm text-gray-500">Nema materijala za provjeru.</div>
          )}
          {requirements.map((r) => {
            const missing = Math.max(0, r.required - r.available);
            const ok = r.sufficient;
            return (
              <div key={r.inventoryItemId} className="flex items-center justify-between p-4">
                <div>
                  <div className="text-sm font-medium text-gray-900">{r.name}</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    Na skladištu: <span className="font-medium">{r.available.toFixed(4)} {r.unit}</span> • Potrebno: <span className="font-medium">{r.required.toFixed(4)} {r.unit}</span>
                  </div>
                </div>
                <span
                  className={
                    'inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ' +
                    (ok
                      ? 'bg-green-100 text-green-800 border border-green-200'
                      : 'bg-red-100 text-red-800 border border-red-200')
                  }
                >
                  {ok ? 'DOSTATNO' : `NEDOSTAJE ${missing.toFixed(4)} ${r.unit}`}
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="inline-flex justify-center px-4 py-2 bg-gray-100 text-gray-800 text-sm font-medium rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
            disabled={isSubmitting || isSuccess}
          >
            Odustani
          </button>
          <button
            onClick={onConfirm}
            disabled={confirmDisabled}
            className={
              'inline-flex justify-center px-4 py-2 text-white text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ' +
              (isSuccess
                ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                : (allOk && !isSubmitting
                    ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                    : 'bg-gray-300 cursor-not-allowed focus:ring-gray-300'))
            }
            aria-busy={isSubmitting}
            title={!allOk ? 'Nedovoljno zaliha' : (isSuccess ? 'Izdano uspješno' : (isSubmitting ? 'Izdavanje u tijeku...' : 'Potvrdi i izdaj nalog'))}
          >
            {isSubmitting && !isSuccess && (
              <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            )}
            {isSuccess ? (
              <span className="inline-flex items-center">
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                Izdano!
              </span>
            ) : (
              allOk ? (isSubmitting ? 'Izdavanje...' : 'Potvrdi i izdaj nalog') : 'Nedovoljno zaliha'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default IssueConfirmationModal;
