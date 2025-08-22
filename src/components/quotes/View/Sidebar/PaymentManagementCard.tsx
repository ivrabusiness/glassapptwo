import React from 'react';
import { CreditCard } from 'lucide-react';
import { Quote, PaymentRecord } from '../../../../types';
import PaymentManager from '../../PaymentManager';

interface PaymentManagementCardProps {
  quote: Quote;
  paymentRecords: PaymentRecord[];
  onAddPayment: (paymentData: Omit<PaymentRecord, 'id' | 'createdAt'>) => void;
  onRemovePayment: (paymentId: string) => void;
}

const PaymentManagementCard: React.FC<PaymentManagementCardProps> = ({
  quote,
  paymentRecords,
  onAddPayment,
  onRemovePayment
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
        <CreditCard className="h-5 w-5 mr-2 text-gray-500" />
        Upravljanje plaćanjima
      </h3>
      <PaymentManager
        payments={paymentRecords}
        totalAmount={quote.grandTotal}
        onAddPayment={onAddPayment}
        onRemovePayment={onRemovePayment}
        disabled={quote.status === 'rejected'}
      />
    </div>
  );
};

export default PaymentManagementCard;

