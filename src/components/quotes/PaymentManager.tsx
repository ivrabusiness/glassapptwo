import React, { useState } from 'react';
import { Plus, Euro, CreditCard, Banknote, FileText, Trash2, Calendar, Hash } from 'lucide-react';
import { PaymentRecord } from '../../types';

interface PaymentManagerProps {
  payments: PaymentRecord[];
  totalAmount: number;
  onAddPayment: (payment: Omit<PaymentRecord, 'id' | 'createdAt'>) => void;
  onRemovePayment: (paymentId: string) => void;
  disabled?: boolean;
}

const PaymentManager: React.FC<PaymentManagerProps> = ({
  payments,
  totalAmount,
  onAddPayment,
  onRemovePayment,
  disabled = false
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    paymentMethod: 'bank_transfer' as PaymentRecord['paymentMethod'],
    amount: '',
    transactionNumber: '',
    description: '',
    paymentDate: new Date().toISOString().split('T')[0]
  });

  const paymentMethodLabels = {
    cash: 'Gotovina',
    bank_transfer: 'Bankovni transfer',
    card: 'Kartica',
    check: 'Ček',
    other: 'Ostalo'
  };

  const paymentMethodIcons = {
    cash: Banknote,
    bank_transfer: FileText,
    card: CreditCard,
    check: FileText,
    other: Euro
  };

  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const remainingAmount = totalAmount - totalPaid;
  const paymentPercentage = totalAmount > 0 ? (totalPaid / totalAmount) * 100 : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      alert('Molimo unesite valjan iznos plaćanja');
      return;
    }

    if (parseFloat(formData.amount) > remainingAmount) {
      alert(`Iznos plaćanja ne može biti veći od preostale sume (${remainingAmount.toFixed(2)} €)`);
      return;
    }

    onAddPayment({
      paymentMethod: formData.paymentMethod,
      amount: parseFloat(formData.amount),
      transactionNumber: formData.transactionNumber || undefined,
      description: formData.description || undefined,
      paymentDate: formData.paymentDate
    });

    // Reset form
    setFormData({
      paymentMethod: 'bank_transfer',
      amount: '',
      transactionNumber: '',
      description: '',
      paymentDate: new Date().toISOString().split('T')[0]
    });
    setShowAddForm(false);
  };

  const handleCancel = () => {
    setFormData({
      paymentMethod: 'bank_transfer',
      amount: '',
      transactionNumber: '',
      description: '',
      paymentDate: new Date().toISOString().split('T')[0]
    });
    setShowAddForm(false);
  };

  return (
    <div className="space-y-4">
      {/* Payment Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-900">Pregled plaćanja</h3>
          <span className="text-sm text-gray-500">
            {paymentPercentage.toFixed(1)}% plaćeno
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
          <div 
            className="bg-green-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(paymentPercentage, 100)}%` }}
          ></div>
        </div>

        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Ukupno</p>
            <p className="font-medium">{totalAmount.toFixed(2)} €</p>
          </div>
          <div>
            <p className="text-gray-500">Plaćeno</p>
            <p className="font-medium text-green-600">{totalPaid.toFixed(2)} €</p>
          </div>
          <div>
            <p className="text-gray-500">Preostalo</p>
            <p className={`font-medium ${remainingAmount > 0 ? 'text-orange-600' : 'text-green-600'}`}>
              {remainingAmount.toFixed(2)} €
            </p>
          </div>
        </div>
      </div>

      {/* Payment Records */}
      {payments.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900">Evidencija plaćanja</h4>
          {payments.map((payment) => {
            const IconComponent = paymentMethodIcons[payment.paymentMethod];
            return (
              <div key={payment.id} className="bg-white border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <IconComponent className="h-4 w-4 text-gray-400" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900">
                          {payment.amount.toFixed(2)} €
                        </span>
                        <span className="text-xs text-gray-500">
                          {paymentMethodLabels[payment.paymentMethod]}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-xs text-gray-500 flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(payment.paymentDate).toLocaleDateString('hr-HR')}
                        </span>
                        {payment.transactionNumber && (
                          <span className="text-xs text-gray-500 flex items-center">
                            <Hash className="h-3 w-3 mr-1" />
                            {payment.transactionNumber}
                          </span>
                        )}
                      </div>
                      {payment.description && (
                        <p className="text-xs text-gray-500 mt-1">{payment.description}</p>
                      )}
                    </div>
                  </div>
                  {!disabled && (
                    <button
                      onClick={() => onRemovePayment(payment.id)}
                      className="text-red-400 hover:text-red-600 p-1"
                      title="Ukloni plaćanje"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Payment Button/Form */}
      {!disabled && remainingAmount > 0 && (
        <div>
          {!showAddForm ? (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Dodaj plaćanje
            </button>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
              <h4 className="text-sm font-medium text-gray-900">Novo plaćanje</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Način plaćanja
                  </label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      paymentMethod: e.target.value as PaymentRecord['paymentMethod']
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.entries(paymentMethodLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Iznos (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={remainingAmount}
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Broj transakcije
                  </label>
                  <input
                    type="text"
                    value={formData.transactionNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, transactionNumber: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Opcionalno"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Datum plaćanja
                  </label>
                  <input
                    type="date"
                    value={formData.paymentDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, paymentDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Opis
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder="Opcionalni opis plaćanja"
                />
              </div>

              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
                >
                  Spremi plaćanje
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors"
                >
                  Odustani
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Fully Paid Message */}
      {remainingAmount <= 0 && totalPaid > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">
                Ponuda je u potpunosti plaćena
              </p>
              <p className="text-xs text-green-600">
                Ukupno plaćeno: {totalPaid.toFixed(2)} €
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentManager;

