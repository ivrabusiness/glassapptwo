import React from 'react';
import { CheckCircle, Clock, Receipt, Truck } from 'lucide-react';
import { DeliveryNote } from '../../../types';

interface TimelineProps {
  deliveryNote: DeliveryNote;
  compact?: boolean;
}

const Timeline: React.FC<TimelineProps> = ({ deliveryNote, compact = false }) => {
  // Get step status
  const getStepStatus = (step: 'generated' | 'delivered' | 'invoiced') => {
    switch (step) {
      case 'generated':
        return deliveryNote.status === 'generated' || deliveryNote.status === 'delivered' || deliveryNote.status === 'invoiced';
      case 'delivered':
        return deliveryNote.status === 'delivered' || deliveryNote.status === 'invoiced';
      case 'invoiced':
        return deliveryNote.status === 'invoiced';
      default:
        return false;
    }
  };

  // Get date for step
  const getStepDate = (step: 'generated' | 'delivered' | 'invoiced') => {
    switch (step) {
      case 'generated':
        return deliveryNote.createdAt ? new Date(deliveryNote.createdAt) : null;
      case 'delivered':
        return deliveryNote.deliveredAt ? new Date(deliveryNote.deliveredAt) : null;
      case 'invoiced':
        return deliveryNote.invoicedAt ? new Date(deliveryNote.invoicedAt) : null;
      default:
        return null;
    }
  };

  // Format date to display both date and time
  const formatDate = (date: Date | null) => {
    if (!date) return null;
    return {
      date: date.toLocaleDateString('hr-HR'),
      time: date.toLocaleTimeString('hr-HR', { hour: '2-digit', minute: '2-digit' })
    };
  };

  // Calculate progress percentage for visual indicator
  const getProgressPercentage = () => {
    switch (deliveryNote.status) {
      case 'draft': return 0;
      case 'generated': return 0;
      case 'delivered': return 50;
      case 'invoiced': return 100;
      default: return 0;
    }
  };

  // Get step data (formatted dates, completion status)
  const steps = [
    {
      id: 'generated',
      label: 'Generirana',
      icon: Clock,
      color: 'blue',
      completed: getStepStatus('generated'),
      current: deliveryNote.status === 'generated',
      dateInfo: formatDate(getStepDate('generated'))
    },
    {
      id: 'delivered',
      label: 'Isporučena',
      icon: Truck,
      color: 'green',
      completed: getStepStatus('delivered'),
      current: deliveryNote.status === 'delivered',
      dateInfo: formatDate(getStepDate('delivered')),
      additionalInfo: deliveryNote.receivedBy ? `Preuzeo/la: ${deliveryNote.receivedBy}` : null
    },
    {
      id: 'invoiced',
      label: 'Izdan račun',
      icon: Receipt,
      color: 'purple',
      completed: getStepStatus('invoiced'),
      current: deliveryNote.status === 'invoiced',
      dateInfo: formatDate(getStepDate('invoiced')),
      additionalInfo: deliveryNote.invoiceNumber ? `Račun: ${deliveryNote.invoiceNumber}` : null
    }
  ];

  // Compact sidebar version
  if (compact) {
    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Status otpremnice</h3>
        
        {/* Progress Bar */}
        <div className="relative h-1.5 bg-gray-100 rounded-full mb-4">
          <div 
            className={`absolute h-full rounded-full transition-all duration-1000 ease-out ${
              steps[0].current ? 'bg-blue-500' : 
              steps[1].current ? 'bg-green-500' : 
              steps[2].current ? 'bg-purple-500' : 'bg-blue-500'
            }`}
            style={{ width: `${getProgressPercentage()}%` }}
          />
        </div>
        
        {/* Vertical Timeline */}
        <div className="space-y-2">
          {steps.map((step, index) => (
            <div key={step.id} className="relative pl-8 pb-4">
              {/* Connecting Line */}
              {index < steps.length - 1 && (
                <div className={`absolute left-[0.5625rem] top-6 bottom-0 w-0.5 ${
                  step.completed && steps[index + 1].completed ? 
                    step.id === 'generated' ? 'bg-blue-500' : 'bg-green-500' :
                    'bg-gray-200'
                }`}></div>
              )}
              
              {/* Step Circle */}
              <div className={`absolute left-0 top-0 w-4.5 h-4.5 rounded-full flex items-center justify-center
                ${step.completed 
                  ? step.id === 'generated' ? 'bg-blue-500 text-white' : 
                    step.id === 'delivered' ? 'bg-green-500 text-white' :
                    'bg-purple-500 text-white'
                  : 'bg-gray-200 text-gray-400'
                }
                ${step.current ? 'ring-2 ring-offset-1 ' + (
                  step.id === 'generated' ? 'ring-blue-200' : 
                  step.id === 'delivered' ? 'ring-green-200' : 
                  'ring-purple-200'
                ) : ''}
              `}>
                <step.icon className="h-2.5 w-2.5" />
              </div>
              
              {/* Content */}
              <div>
                <h4 className={`text-sm font-medium 
                  ${step.completed 
                    ? step.id === 'generated' ? 'text-blue-600' : 
                      step.id === 'delivered' ? 'text-green-600' :
                      'text-purple-600'
                    : 'text-gray-400'
                  }
                `}>
                  {step.label}
                </h4>
                
                {step.completed && step.dateInfo ? (
                  <p className="text-xs text-gray-500 mt-0.5">
                    {step.dateInfo.date}, {step.dateInfo.time}
                  </p>
                ) : (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {step.id === 'generated' ? 'U pripremi' : 
                    step.id === 'delivered' ? 'Čeka isporuku' : 
                    'Čeka račun'}
                  </p>
                )}
                
                {step.completed && step.additionalInfo && (
                  <div className={`mt-1 inline-block px-2 py-0.5 rounded text-xs
                    ${step.id === 'generated' ? 'bg-blue-50 text-blue-700' : 
                      step.id === 'delivered' ? 'bg-green-50 text-green-700' :
                      'bg-purple-50 text-purple-700'
                    }
                  `}>
                    {step.additionalInfo}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Original expanded version
  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-8">Status otpremnice</h3>
      
      {/* Progress Bar */}
      <div className="relative h-2 bg-gray-200 rounded-full mb-10 overflow-hidden">
        <div 
          className={`absolute h-full rounded-full transition-all duration-1000 ease-out ${
            steps[0].current ? 'bg-blue-500' : 
            steps[1].current ? 'bg-green-500' : 
            steps[2].current ? 'bg-purple-500' : 
            'bg-blue-500'
          }`}
          style={{ width: `${getProgressPercentage()}%` }}
        />
      </div>

      {/* Steps */}
      <div className="relative flex justify-between">
        {/* Connecting Line */}
        <div className="absolute left-0 right-0 top-6 border-t-2 border-gray-200 -z-10"></div>
        
        {steps.map((step) => (
          <div key={step.id} className="relative flex flex-col items-center text-center z-10">
            {/* Step Circle */}
            <div 
              className={`
                w-12 h-12 rounded-full flex items-center justify-center mb-2
                transition-all duration-500 ease-in-out
                ${step.completed 
                  ? step.id === 'generated' 
                    ? 'bg-blue-500 text-white shadow-md' 
                    : step.id === 'delivered'
                      ? 'bg-green-500 text-white shadow-md'
                      : 'bg-purple-500 text-white shadow-md'
                  : 'bg-white text-gray-400 border-2 border-gray-200'
                }
                ${step.current && 'ring-4 ring-opacity-50 ' + (
                  step.id === 'generated' ? 'ring-blue-200' : 
                  step.id === 'delivered' ? 'ring-green-200' : 
                  'ring-purple-200'
                )}
              `}
            >
              <step.icon className="h-5 w-5" />
            </div>
            
            {/* Label */}
            <div className={`
              font-medium mb-1 text-base
              ${step.completed 
                ? step.id === 'generated' 
                  ? 'text-blue-600' 
                  : step.id === 'delivered'
                    ? 'text-green-600'
                    : 'text-purple-600'
                : 'text-gray-400'
              }
            `}>
              {step.label}
            </div>
            
            {/* Date Info */}
            {step.completed && step.dateInfo ? (
              <div className="text-center">
                <p className="text-sm text-gray-600 font-medium">
                  {step.dateInfo.date}
                </p>
                <p className="text-xs text-gray-500">
                  {step.dateInfo.time}
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-400">
                {step.id === 'generated' ? 'U pripremi' : 
                 step.id === 'delivered' ? 'Čeka isporuku' : 
                 'Čeka račun'}
              </p>
            )}
            
            {/* Additional Info */}
            {step.completed && step.additionalInfo && (
              <div className={`
                mt-1 px-2 py-1 rounded-md text-xs font-medium
                ${step.id === 'generated' 
                  ? 'bg-blue-50 text-blue-700' 
                  : step.id === 'delivered'
                    ? 'bg-green-50 text-green-700'
                    : 'bg-purple-50 text-purple-700'
                }
              `}>
                {step.additionalInfo}
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Status Description */}
      <div className="mt-10 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-start space-x-4">
          <div className={`
            w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center 
            ${deliveryNote.status === 'generated' ? 'bg-blue-100 text-blue-600' : 
              deliveryNote.status === 'delivered' ? 'bg-green-100 text-green-600' : 
              deliveryNote.status === 'invoiced' ? 'bg-purple-100 text-purple-600' : 
              'bg-gray-100 text-gray-600'}
          `}>
            {deliveryNote.status === 'generated' ? <Clock className="h-5 w-5" /> : 
             deliveryNote.status === 'delivered' ? <Truck className="h-5 w-5" /> : 
             deliveryNote.status === 'invoiced' ? <Receipt className="h-5 w-5" /> : 
             <Clock className="h-5 w-5" />}
          </div>
          <div>
            <h4 className={`
              font-medium text-base mb-1
              ${deliveryNote.status === 'generated' ? 'text-blue-700' : 
                deliveryNote.status === 'delivered' ? 'text-green-700' : 
                deliveryNote.status === 'invoiced' ? 'text-purple-700' : 
                'text-gray-700'}
            `}>
              {deliveryNote.status === 'generated' ? 'Otpremnica je generirana' : 
               deliveryNote.status === 'delivered' ? 'Roba je isporučena klijentu' : 
               deliveryNote.status === 'invoiced' ? 'Račun je izdan' : 
               'Status otpremnice'}
            </h4>
            <p className="text-sm text-gray-600">
              {deliveryNote.status === 'generated' ? 
                'Otpremnica je generirana i spremna za isporuku. Kada roba bude isporučena klijentu, označite status kao "Isporučena".' : 
               deliveryNote.status === 'delivered' ? 
                'Roba je uspješno isporučena klijentu. Nakon što izdate račun u MINIMAX sustavu, unesite broj računa i označite status kao "Izdan račun".' : 
               deliveryNote.status === 'invoiced' ? 
                'Proces je završen. Roba je isporučena i račun je izdan klijentu.' : 
                'Pratite status otpremnice kroz korake iznad.'}
            </p>
            
            {/* Special case indicators */}
            {deliveryNote.status === 'delivered' && deliveryNote.deliveredBy && deliveryNote.receivedBy && (
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                  <Truck className="h-3 w-3 mr-1" />
                  Isporučio: {deliveryNote.deliveredBy}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Preuzeo: {deliveryNote.receivedBy}
                </span>
              </div>
            )}
            
            {deliveryNote.status === 'invoiced' && deliveryNote.invoiceNumber && (
              <div className="mt-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
                  <Receipt className="h-3 w-3 mr-1" />
                  Broj računa: {deliveryNote.invoiceNumber}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Timeline;
