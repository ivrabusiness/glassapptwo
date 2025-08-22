import React from 'react';
import { AlertTriangle, CheckCircle, FileText, Truck } from 'lucide-react';
import type { ArchiveModalProps } from './types';
import { getStatusColor, getStatusText } from './helpers';

const ArchiveModal: React.FC<ArchiveModalProps> = ({ open, orderToArchive, analysis, onConfirm, onCancel }) => {
  if (!open || !orderToArchive || !analysis) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
                <h3 className="text-lg leading-6 font-medium text-gray-900">🗃️ Arhiviranje radnog naloga</h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500 mb-4">
                    <strong>Jeste li sigurni da želite arhivirati radni nalog {orderToArchive.orderNumber}?</strong>
                  </p>

                  {/* Osnovne informacije o nalogu */}
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">📋 Informacije o nalogu:</h4>
                    <div className="text-sm text-gray-700 space-y-1">
                      <div className="flex justify-between">
                        <span>Broj naloga:</span>
                        <span className="font-medium">{orderToArchive.orderNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(orderToArchive.status)}`}>
                          {getStatusText(orderToArchive.status)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Datum kreiranja:</span>
                        <span className="font-medium">{new Date(orderToArchive.createdAt).toLocaleDateString('hr-HR')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Broj artikala:</span>
                        <span className="font-medium">{orderToArchive.items.length}</span>
                      </div>
                    </div>
                  </div>

                  {/* Upozorenje za nacrt */}
                  {orderToArchive.status === 'draft' && (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
                      <div className="flex items-start">
                        <FileText className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                        <div>
                          <h4 className="text-sm font-medium text-blue-900">Arhiviranje nacrta</h4>
                          <p className="text-sm text-blue-700 mt-1">
                            Ovaj nalog je nacrt i nije utjecao na stanje skladišta. 
                            Arhiviranje neće utjecati na zalihe materijala.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Analiza vraćanja materijala */}
                  {orderToArchive.status !== 'draft' && analysis.materialsToRestore.length > 0 && (
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200 mb-4">
                      <div className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-green-900">📦 Materijali će biti vraćeni na skladište</h4>
                          <p className="text-sm text-green-700 mt-1 mb-3">Sljedeći materijali će biti automatski vraćeni na skladište:</p>
                          <div className="max-h-40 overflow-y-auto">
                            <table className="w-full text-xs">
                              <thead className="bg-green-100">
                                <tr>
                                  <th className="px-2 py-1 text-left">Materijal</th>
                                  <th className="px-2 py-1 text-right">Vraća se</th>
                                  <th className="px-2 py-1 text-right">Trenutno</th>
                                  <th className="px-2 py-1 text-right">Novo stanje</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-green-200">
                                {analysis.materialsToRestore.map((material, index) => (
                                  <tr key={index} className="bg-white">
                                    <td className="px-2 py-1 font-medium">{material.name}</td>
                                    <td className="px-2 py-1 text-right font-bold text-green-700">+{material.quantity.toFixed(4)} {material.unit}</td>
                                    <td className="px-2 py-1 text-right">{material.currentStock.toFixed(4)} {material.unit}</td>
                                    <td className="px-2 py-1 text-right font-bold text-green-700">{material.newStock.toFixed(4)} {material.unit}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          <div className="mt-3 pt-3 border-t border-green-200">
                            <p className="text-xs text-green-700"><strong>📝 Logiranje:</strong> Kreirat će se {analysis.transactionsToCreate} transakcija vraćanja s detaljnim opisom.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Upozorenje o otpremnici */}
                  {analysis.hasDeliveryNote && (
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mb-4">
                      <div className="flex items-start">
                        <Truck className="h-5 w-5 text-yellow-500 mr-2 mt-0.5" />
                        <div>
                          <h4 className="text-sm font-medium text-yellow-900">🚚 Povezana otpremnica</h4>
                          <p className="text-sm text-yellow-700 mt-1">
                            Ovaj nalog ima povezanu otpremnicu <strong>{analysis.deliveryNoteNumber}</strong>. 
                            Otpremnica će također biti arhivirana.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Finalno upozorenje */}
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                    <div className="flex items-start">
                      <AlertTriangle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-red-900">⚠️ PAŽNJA</h4>
                        <ul className="text-sm text-red-700 mt-1 list-disc list-inside space-y-1">
                          <li>Radni nalog i povezani dokumenti bit će označeni kao arhivirani</li>
                          {analysis.materialsToRestore.length > 0 && <li>Materijali će biti vraćeni na skladište</li>}
                          {analysis.hasDeliveryNote && <li>Povezana otpremnica će biti arhivirana</li>}
                          <li>Sve transakcije vraćanja će biti zabilježene</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={onConfirm}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-amber-600 text-base font-medium text-white hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 sm:ml-3 sm:w-auto sm:text-sm"
            >
              🗃️ DA, ARHIVIRAJ NALOG
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Odustani
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArchiveModal;
