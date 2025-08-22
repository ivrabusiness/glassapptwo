import { ArrowLeft, Edit, Lock, Clock, CheckCircle, Eye, FileText } from 'lucide-react';
import { WorkOrder, DeliveryNote } from '../../../types';

interface WorkOrderHeaderProps {
  order: WorkOrder;
  existingDeliveryNote: DeliveryNote | undefined;
  canEditOrder: boolean;
  onBack: () => void;
  onEdit: () => void;
  onPrintDeliveryNote: () => void;
  onConvertDraftToOrder: () => void;
}

const WorkOrderHeader: React.FC<WorkOrderHeaderProps> = ({
  order,
  existingDeliveryNote,
  canEditOrder,
  onBack,
  onEdit,
  onPrintDeliveryNote,
  onConvertDraftToOrder
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft': return 'Nacrt';
      case 'pending': return 'U tijeku';
      case 'in-progress': return 'U tijeku';
      case 'completed': return 'Završen';
      case 'cancelled': return 'Otkazan';
      default: return status;
    }
  };

  // Calculate process completion for the work order
  const getProcessCompletion = () => {
    let totalProcesses = 0;
    let completedProcesses = 0;
    
    // Count processes in all items and materials
    order.items.forEach(item => {
      if (item.materials && item.materials.length > 0) {
        item.materials.forEach(material => {
          if (material.processSteps && material.processSteps.length > 0) {
            material.processSteps.forEach(step => {
              totalProcesses++;
              if (step.status === 'completed') {
                completedProcesses++;
              }
            });
          }
        });
      }
    });
    
    return {
      completed: completedProcesses,
      total: totalProcesses,
      percentage: totalProcesses > 0 ? Math.round((completedProcesses / totalProcesses) * 100) : 0
    };
  };

  const isDraft = order.status === 'draft';
  const isArchived = order.status === 'archived';
  const isFromQuote = Boolean((order as any)?.quoteId) || Boolean((order as any)?.quoteNumber);

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Radni nalog {order.orderNumber}</h1>
            <div className="flex items-center space-x-3 mt-1">
              {order.status === 'pending' || order.status === 'in-progress' ? (
                (() => {
                  const { completed, total, percentage } = getProcessCompletion();
                  return (
                    <div className="flex items-center space-x-2">
                      <div className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        percentage === 100 ? 'bg-green-100 text-green-800' :
                        percentage > 50 ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        <div className="flex items-center">
                          {percentage === 100 ? (
                            <CheckCircle className="h-3 w-3 mr-1" />
                          ) : (
                            <Clock className="h-3 w-3 mr-1" />
                          )}
                          <span>{completed}/{total} ({percentage}%)</span>
                        </div>
                      </div>
                      <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            percentage === 100 ? 'bg-green-500' :
                            percentage > 50 ? 'bg-blue-500' :
                            'bg-yellow-500'
                          }`} 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                  {getStatusText(order.status)}
                </span>
              )}
              <span className="text-sm text-gray-500">
                Kreiran: {new Date(order.createdAt).toLocaleDateString('hr-HR')}
              </span>
              {/* Uklonjeno prikazivanje broja otpremnice iz headera prema zahtjevu */}
            </div>
          </div>
        </div>
        <div className="flex space-x-3">
          {/* Edit gumb: sakrij ako je NACRT kreiran iz PONUDE */}
          {!(isDraft && isFromQuote) && (
            <button
              onClick={onEdit}
              className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                canEditOrder
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              title={canEditOrder ? 'Uredi nalog' : `Nalog se ne može uređivati (status: ${getStatusText(order.status)})`}
            >
              {canEditOrder ? (
                <>
                  <Edit className="h-4 w-4 mr-2" />
                  Uredi nalog
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Zaključan
                </>
              )}
            </button>
          )}

          {/* Prebaci u pravi nalog: prikaži za sve NACRTE */}
          {isDraft && (
            <button
              onClick={onConvertDraftToOrder}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
              title="Prebaci u pravi nalog"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Prebaci u pravi nalog
            </button>
          )}
          {/* Gumb za otpremnicu: sakrij za nacrt osim ako već postoji otpremnica */}
          {(order.status !== 'draft' || !!existingDeliveryNote) && (
            <button
              onClick={isArchived && !existingDeliveryNote ? undefined : onPrintDeliveryNote}
              disabled={isArchived && !existingDeliveryNote}
              className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                isArchived && !existingDeliveryNote
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
              title={
                isArchived && !existingDeliveryNote
                  ? 'Nalog je arhiviran – nije moguće generirati novu otpremnicu'
                  : (existingDeliveryNote ? 'Pogledaj otpremnicu' : 'Generiraj otpremnicu')
              }
            >
              {existingDeliveryNote ? (
                <Eye className="h-4 w-4 mr-2" />
              ) : (
                <FileText className="h-4 w-4 mr-2" />
              )}
              {existingDeliveryNote ? 'Pogledaj otpremnicu' : 'Generiraj otpremnicu'}
            </button>
          )}
        </div>
      </div>

      {/* Uklonjen locked order warning box prema zahtjevu */}
    </>
  );
};

export default WorkOrderHeader;
