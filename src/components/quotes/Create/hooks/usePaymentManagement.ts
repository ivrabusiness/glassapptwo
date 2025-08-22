import { useEffect, useCallback } from 'react';
import { BankAccount, PaymentInfo } from '../../../../types';

interface UsePaymentManagementParams {
  bankAccounts: BankAccount[];
  quoteNumber: string;
  selectedBankAccounts: string[];
  setSelectedBankAccounts: React.Dispatch<React.SetStateAction<string[]>>;
  paymentInfo: PaymentInfo[];
  setPaymentInfo: React.Dispatch<React.SetStateAction<PaymentInfo[]>>;
}

export function usePaymentManagement({
  bankAccounts,
  quoteNumber,
  selectedBankAccounts,
  setSelectedBankAccounts,
  paymentInfo,
  setPaymentInfo
}: UsePaymentManagementParams) {
  // No-op reference to izbjeći TS "declared but never read" upozorenja za ulazne vrijednosti
  void selectedBankAccounts;
  void paymentInfo;

  // Učitaj zadani bankovni račun ako postoji
  useEffect(() => {
    const defaultAccount = bankAccounts.find(account => account.isDefault);
    // Pronađi sve račune označene za prikaz na ponudama; ako nema takvih, koristi sve račune
    const visibleAccounts = bankAccounts.filter(account => account.isVisibleOnQuotes);
    const baseAccounts = visibleAccounts.length > 0 ? visibleAccounts : bankAccounts;

    if (baseAccounts.length > 0) {
      // Sortiraj tako da zadani račun bude prvi
      const accountsForDisplay = [...baseAccounts].sort((a, b) => {
        if (!defaultAccount) return 0;
        if (a.id === defaultAccount.id) return -1;
        if (b.id === defaultAccount.id) return 1;
        return 0;
      });
      // Postavi odabrane račune
      const accountIds = accountsForDisplay.map(account => account.id);
      setSelectedBankAccounts(accountIds);
      
      // Kreiraj payment info za svaki račun
      const paymentInfoArray = accountsForDisplay.map(account => {
        // Kreiraj opis plaćanja s brojem ponude
        let description = account.description || `Plaćanje po ponudi ${quoteNumber}`;
        description = description.replace('{broj_ponude}', quoteNumber);
        
        // Kreiraj poziv na broj s prefiksom i brojem ponude
        let reference = quoteNumber;
        if (account.referencePrefix) {
          reference = `${account.referencePrefix}${quoteNumber}`;
        }
        
        return {
          companyName: account.accountName,
          bankName: account.bankName,
          iban: account.iban,
          swift: account.swift || '',
          model: account.model || 'HR00',
          reference,
          purposeCode: account.purposeCode || 'OTHR',
          description
        };
      });
      
      setPaymentInfo(paymentInfoArray);
    }
  }, [bankAccounts, quoteNumber, setSelectedBankAccounts, setPaymentInfo]);

  // Funkcija za odabir bankovnog računa
  const handleBankAccountSelect = useCallback((accountId: string, selected: boolean) => {
    const account = bankAccounts.find(acc => acc.id === accountId);
    if (!account) return;

    // Ne dopuštaj odznačavanje zadanog računa
    if (!selected && account.isDefault) {
      return;
    }

    if (selected) {
      // Dodaj račun (bez duplikata)
      setSelectedBankAccounts(prev => (prev.includes(accountId) ? prev : [...prev, accountId]));

      // Dodaj payment info za ovaj račun (bez duplikata po IBAN-u)
      let description = account.description || `Plaćanje po ponudi ${quoteNumber}`;
      description = description.replace('{broj_ponude}', quoteNumber);

      let reference = quoteNumber;
      if (account.referencePrefix) {
        reference = `${account.referencePrefix}${quoteNumber}`;
      }

      const newPaymentInfo: PaymentInfo = {
        companyName: account.accountName,
        bankName: account.bankName,
        iban: account.iban,
        swift: account.swift || '',
        model: account.model || 'HR00',
        reference,
        purposeCode: account.purposeCode || 'OTHR',
        description
      };

      setPaymentInfo(prev => (prev.some(info => info.iban === account.iban) ? prev : [...prev, newPaymentInfo]));
    } else {
      // Ukloni račun
      setSelectedBankAccounts(prev => prev.filter(id => id !== accountId));

      // Ukloni payment info za ovaj račun
      setPaymentInfo(prev => prev.filter(info => info.iban !== account.iban));
    }
  }, [bankAccounts, quoteNumber, setSelectedBankAccounts, setPaymentInfo]);

  return {
    handleBankAccountSelect
  };
}

