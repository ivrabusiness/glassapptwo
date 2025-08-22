import React, { useState } from 'react';
import { QuoteItem, Process } from '../../../../types';
import { calculateProcessPrice } from '../../../../utils/processUtils';
import { Package, ChevronDown, ChevronUp } from 'lucide-react';

interface ServiceProcessesProps {
  item: QuoteItem;
  processes: Process[];
  isProcessSelected: (processId: string) => boolean;
  isProcessFixed: (processId: string) => boolean;
  getProcessNotes: (processId: string) => string;
  toggleProcess: (processId: string) => void;
  handleProcessNotesChange: (processId: string, notes: string) => void;
}

const ServiceProcesses: React.FC<ServiceProcessesProps> = ({
  item,
  processes,
  isProcessSelected,
  isProcessFixed,
  getProcessNotes,
  toggleProcess,
  handleProcessNotesChange,
}) => {
  const [open, setOpen] = useState(false);

  if (!item.isService) return null;

  return (
    <div className="mb-4">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-left px-4 py-3 bg-white hover:bg-gray-50 transition-colors border border-gray-200 rounded-lg"
      >
        <span className="flex items-center">
          <Package className="h-4 w-4 mr-3 text-gray-500" />
          <span className="text-sm font-medium text-gray-900">Procesi usluge</span>
          <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
            {processes?.length || 0}
          </span>
        </span>
        {open ? <ChevronUp className="h-4 w-4 text-gray-500" /> : <ChevronDown className="h-4 w-4 text-gray-500" />}
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          {processes
            .slice()
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
            .map((process) => {
              const checkboxId = `quote-item-${item.id}-service-process-${process.id}`;
              const selected = isProcessSelected(process.id);
              const fixed = isProcessFixed(process.id);
              const notes = getProcessNotes(process.id);

              // Za usluge, cijena nije ovisna o debljini
              const basePrice = calculateProcessPrice(process, undefined);

              // Ako je odabrani korak za ovu uslugu default, ne naplaćuje se
              const stepForProcess = (item.processSteps || []).find(s => s.processId === process.id);
              const isDefaultStep = stepForProcess?.isDefault === true;

              const hasPrice = !isDefaultStep && typeof basePrice === 'number' && basePrice > 0;
              let processUnitPrice = 0;
              let processItemPrice = 0;
              let priceUnit = '';

              if (hasPrice) {
                switch (process.priceType) {
                  case 'square_meter':
                    processUnitPrice = basePrice;
                    processItemPrice = processUnitPrice * (item.dimensions?.area || 0) * (item.quantity || 0);
                    priceUnit = 'm²';
                    break;
                  case 'linear_meter': {
                    const perimeter = 2 * ((item.dimensions?.width || 0) + (item.dimensions?.height || 0)) / 1000; // mm -> m
                    processUnitPrice = basePrice;
                    processItemPrice = processUnitPrice * perimeter * (item.quantity || 0);
                    priceUnit = 'm';
                    break;
                  }
                  case 'piece':
                    processUnitPrice = basePrice;
                    processItemPrice = processUnitPrice * (item.quantity || 0);
                    priceUnit = 'kom';
                    break;
                  case 'hour':
                    processUnitPrice = basePrice;
                    processItemPrice = processUnitPrice * (item.quantity || 0);
                    priceUnit = 'sat';
                    break;
                  default:
                    processUnitPrice = basePrice;
                    processItemPrice = processUnitPrice;
                    priceUnit = 'fiksno';
                }
              }

              return (
                <div key={checkboxId} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id={checkboxId}
                      checked={selected}
                      disabled={fixed}
                      onChange={() => toggleProcess(process.id)}
                      className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded disabled:opacity-50"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <label htmlFor={checkboxId} className="flex items-center text-sm font-medium text-gray-900 cursor-pointer">
                          {process.name}
                          {fixed && (
                            <span className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-800 text-xs rounded-full font-medium">
                              Obavezno
                            </span>
                          )}
                          {hasPrice && selected && (
                            <span className="ml-3 text-xs font-semibold text-gray-700">
                              {processItemPrice.toFixed(2)} €
                            </span>
                          )}
                        </label>
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{process.description}</p>
                      {hasPrice && selected && (
                        <div className="text-xs text-gray-600 mt-1">
                          {processUnitPrice.toFixed(2)} €/{priceUnit}
                        </div>
                      )}
                    </div>
                  </div>

                  {selected && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <label className="block text-xs font-medium text-gray-700 mb-2">Napomena za proces</label>
                      <textarea
                        value={notes}
                        onChange={(e) => handleProcessNotesChange(process.id, e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white"
                        placeholder={`Napomena za ${process.name}...`}
                      />
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
};

export default ServiceProcesses;
