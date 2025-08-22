import React, { useState } from 'react';
import { WorkOrder, Process, InventoryItem } from '../../types';
import { CheckCircle, Clock, ChevronDown, ChevronUp, Settings } from 'lucide-react';

interface ProcessListProps {
  order: WorkOrder;
  processes: Process[];
  inventory: InventoryItem[];
  onCompleteProcess: (itemId: string, processStepId: string, itemName: string, dimensions: {width: number, height: number}, quantity: number, processName: string, orderNumber: string) => void;
}

const ProcessList: React.FC<ProcessListProps> = ({ order, processes, inventory, onCompleteProcess }) => {
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  // Toggle expanded state for an item
  const toggleItemExpand = (itemId: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  // Check if all processes are completed
  const areAllProcessesCompleted = order.items.every(item => 
    item.processSteps && item.processSteps.every(step => step.status === 'completed')
  );

  // Get process name by ID
  const getProcessName = (processId: string) => {
    const process = processes.find(p => p.id === processId);
    return process ? process.name : 'Nepoznat proces';
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-900">Procesi radnog naloga</h3>
      
      {/* Status overview */}
      <div className={`p-4 rounded-lg ${
        areAllProcessesCompleted ? 'bg-green-50 border border-green-200' : 'bg-blue-50 border border-blue-200'
      }`}>
        <div className="flex items-start">
          {areAllProcessesCompleted ? (
            <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
          ) : (
            <Clock className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
          )}
          <div>
            <h4 className={`text-sm font-medium ${
              areAllProcessesCompleted ? 'text-green-800' : 'text-blue-800'
            }`}>
              {areAllProcessesCompleted ? 'Svi procesi završeni' : 'Procesi u tijeku'}
            </h4>
            <p className={`text-sm ${
              areAllProcessesCompleted ? 'text-green-700' : 'text-blue-700'
            }`}>
              {areAllProcessesCompleted ? 
                'Svi procesi su završeni. Nalog je označen kao završen.' : 
                'Neki procesi još nisu završeni. Završite sve procese da bi nalog bio označen kao završen.'}
            </p>
          </div>
        </div>
      </div>

      {/* Items and their processes */}
      <div className="space-y-4">
        {order.items.map((item, itemIndex) => {
          const isExpanded = expandedItems[item.id] || false;
          
          // Count completed processes for this item
          let totalProcesses = 0;
          let completedProcesses = 0;
          
          // Format the status display to match the design
          const formatProcessStatus = (completed: number, total: number) => {
            return `${completed}/${total} procesa završeno`;
          };
          
          // Count processes at item level, not material level
          item.processSteps?.forEach(step => {
            totalProcesses++;
            if (step.status === 'completed') {
              completedProcesses++;
            }
          });
          
          return (
            <div key={item.id} className="border border-gray-200 rounded-lg overflow-hidden">
              {/* Item header */}
              <div 
                className={`bg-gray-50 px-6 py-4 border-b border-gray-200 cursor-pointer hover:bg-gray-100 ${isExpanded ? 'bg-gray-100' : ''}`}
                onClick={() => toggleItemExpand(item.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                      <span className="text-blue-600 font-medium">{itemIndex + 1}</span>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Artikal {itemIndex + 1}: {item.productName || 'Nepoznat proizvod'}</h4>
                      <div className="flex items-center text-sm text-gray-600 mt-1">
                        <span>{item.dimensions.width} × {item.dimensions.height} cm</span>
                        <span className="mx-2">|</span>
                        <span>{item.quantity} kom</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {completedProcesses === totalProcesses ? (
                      <div className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 inline mr-1" />
                        {formatProcessStatus(completedProcesses, totalProcesses)}
                      </div>
                    ) : (
                      <div className="flex flex-col items-end">
                        <div className="text-xs">
                          <span className="text-gray-700 font-medium">{formatProcessStatus(completedProcesses, totalProcesses)} </span>
                          <span className="text-gray-500">
                            ({Math.round((completedProcesses/totalProcesses) * 100)}%)
                          </span>
                        </div>
                        <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden mt-1">
                          <div 
                            className={`h-full rounded-full ${
                              completedProcesses === totalProcesses ? 'bg-green-500' :
                              completedProcesses > totalProcesses/2 ? 'bg-blue-500' :
                              'bg-amber-500'
                            }`} 
                            style={{ width: `${(completedProcesses/totalProcesses) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                    {isExpanded ? <ChevronUp className="h-5 w-5 text-gray-500" /> : <ChevronDown className="h-5 w-5 text-gray-500" />}
                  </div>
                </div>
              </div>

              {/* Materials and processes */}
              {isExpanded && (
                <div className="p-6 space-y-6">
                  {item.materials && item.materials.length > 0 && (
                    <div className="space-y-3">
                      <h5 className="text-sm font-medium text-gray-900">Materijali:</h5>
                      {item.materials.map((material, materialIndex) => (
                        <div key={material.id} className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                          <span className="text-sm text-gray-700">
                            Materijal {materialIndex + 1}: {inventory.find(i => i.id === material.inventoryItemId)?.name || 'Nepoznat materijal'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {item.processSteps && item.processSteps.length > 0 ? (
                    <div className="space-y-3">
                      <h5 className="text-sm font-medium text-gray-900">Procesi:</h5>
                      <div className="space-y-2">
                        {item.processSteps.map(processStep => (
                          <div key={processStep.id} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                            <div className="flex items-center">
                              <Settings className="h-5 w-5 text-gray-500 mr-3" />
                              <span className="text-sm font-medium text-gray-900">
                                {getProcessName(processStep.processId)}
                              </span>
                            </div>
                            {processStep.status === 'completed' ? (
                              <div className="flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Završeno
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  // Pass all necessary data to the parent component's handler
                                  onCompleteProcess(
                                    item.id,
                                    processStep.id,
                                    item.productName || 'Nepoznat proizvod',
                                    item.dimensions,
                                    item.quantity,
                                    getProcessName(processStep.processId),
                                    order.orderNumber
                                  )
                                }}
                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Završi proces
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
                      <p className="text-sm text-gray-600">Nema procesa za ovaj artikal</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProcessList;
