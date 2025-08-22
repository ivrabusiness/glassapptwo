import React from 'react';
import { BankAccount } from '../../../types';

interface PaymentDetailsProps {
  bankAccounts: BankAccount[];
  selectedBankAccounts: string[];
  onBankAccountSelect: (accountId: string, selected: boolean) => void;
  paymentInfo: any[];
  onPaymentInfoChange?: (paymentInfo: any[]) => void; // Opcijski prop za Edit workflow
  quoteNumber: string;
  grandTotal: number;
}

const PaymentDetails: React.FC<PaymentDetailsProps> = ({
  bankAccounts,
  selectedBankAccounts,
  onBankAccountSelect,
  paymentInfo,
  quoteNumber,
  grandTotal
}) => {
  // Keep props for API compatibility; not displayed in sidebar UI
  void paymentInfo;
  void quoteNumber;
  void grandTotal;
  const formatIban = (iban: string) => iban.replace(/\s+/g, '').replace(/(.{4})/g, '$1 ').trim();
  // Sortiraj za prikaz tako da je zadani račun prvi
  const sortedBankAccounts = React.useMemo(() => {
    return [...bankAccounts].sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
  }, [bankAccounts]);
  return (
    <div className="space-y-4">
      {bankAccounts.length > 0 && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Odaberi bankovne račune za prikaz na ponudi
            </label>
            <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded-md p-3">
              {sortedBankAccounts.map(account => (
                <div key={account.id} className="flex items-center">
                  <input
                    checked={account.isDefault ? true : selectedBankAccounts.includes(account.id)}
                    id={`bank-account-${account.id}`}
                    onChange={(e) => onBankAccountSelect(account.id, e.target.checked)}
                    type="checkbox"
                    disabled={account.isDefault}
                    aria-disabled={account.isDefault}
                    title={account.isDefault ? 'Zadani račun je uvijek uključen' : undefined}
                    className={`h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded ${account.isDefault ? 'opacity-60 cursor-not-allowed' : ''}`}
                  />
                  <label htmlFor={`bank-account-${account.id}`} className="ml-2 flex flex-col text-sm text-gray-900 w-full leading-tight">
                    <div className="flex items-center gap-2">
                      <span className="font-mono tracking-wider whitespace-nowrap">{formatIban(account.iban)}</span>
                      {account.isDefault && <span className="ml-auto text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">Zadano</span>}
                    </div>
                    <span className="text-xs text-gray-600 truncate">{account.accountName} • {account.bankName}</span>
                  </label>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Odaberite jedan ili više bankovnih računa koji će biti prikazani na ponudi
            </p>
          </div>
        </>
      )}

      {selectedBankAccounts.length === 0 && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
          <p className="text-sm text-yellow-700">
            Niste odabrali nijedan bankovni račun za prikaz na ponudi.
          </p>
          <p className="text-xs text-yellow-600 mt-1">
            Odaberite barem jedan bankovni račun za prikaz podataka za plaćanje.
          </p>
        </div>
      )}
    </div>
  );
};

export default PaymentDetails;

