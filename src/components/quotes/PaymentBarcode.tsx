import React from 'react';
import { PaymentBarcodeData } from '../../types';

interface PaymentBarcodeProps {
  data: PaymentBarcodeData;
  size?: number;
}

export const PaymentBarcode: React.FC<PaymentBarcodeProps> = ({ data, size = 200 }) => {
  // Funkcija za generiranje HUB3 2D barkoda
  const generateHUB3BarcodeURL = (data: PaymentBarcodeData): string => {
    // Formatiranje iznosa: 2 decimalna mjesta, bez točke, s vodećim nulama do 15 znakova
    const formattedAmount = data.amount.toFixed(2).replace('.', '').padStart(15, '0');
    
    // Formatiranje IBAN-a: uklanjanje razmaka i crtica
    const formattedIBAN = data.recipientIBAN.replace(/\s+/g, '');
    
    // Formatiranje modela i poziva na broj
    const formattedModel = data.paymentModel.replace('HR', '');
    const formattedReference = data.paymentReference.replace(/\s+/g, '');
    
    // Kreiranje PDF417 barkod sadržaja prema HUB3 standardu
    const barcodeContent = [
      'HRVHUB30',
      formattedAmount,
      data.payerName,
      data.payerAddress,
      data.payerPlace,
      data.recipientName,
      data.recipientAddress,
      data.recipientPlace,
      formattedIBAN,
      formattedModel,
      formattedReference,
      data.purposeCode,
      data.purposeText
    ].join('\n');
    
    // Enkodiranje za URL
    const encodedContent = encodeURIComponent(barcodeContent);
    
    // Korištenje online servisa za generiranje barkoda
    return `https://barcodeapi.org/api/pdf417/${encodedContent}`;
  };

  const barcodeURL = generateHUB3BarcodeURL(data);

  return (
    <div className="flex flex-col items-center">
      <img 
        src={barcodeURL} 
        alt="HUB3 2D barkod za plaćanje" 
        width={size} 
        height={size / 3} 
        className="border border-gray-300 rounded-lg"
      />
      <div className="mt-2 text-xs text-gray-600 text-center">
        <p>IBAN: {data.recipientIBAN}</p>
        <p>Model: {data.paymentModel} Poziv na broj: {data.paymentReference}</p>
        <p>Iznos: {data.amount.toLocaleString('hr-HR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</p>
      </div>
    </div>
  );
};
