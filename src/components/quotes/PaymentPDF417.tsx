import React, { useEffect, useState } from 'react';
import { PaymentInfo } from '../../types';
import PaymentQRCode from './PaymentQRCode';
import { generateHub3Pdf417, Hub3Params } from '../../services/Print/PDF417';

interface PaymentPDF417Props {
  payment: PaymentInfo;
  amount: number; // in EUR
  quoteNumber: string;
  width?: number; // px, default 220
}

const PaymentPDF417: React.FC<PaymentPDF417Props> = ({ payment, amount, quoteNumber, width = 220 }) => {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const params: Hub3Params = {
      amountEur: amount,
      payerName: '',
      payerAddress: '',
      payerCity: '',
      receiverName: payment.companyName,
      receiverAddress: '',
      receiverCity: '',
      iban: payment.iban,
      model: payment.model || 'HR00',
      reference: payment.reference || quoteNumber,
      purposeCode: payment.purposeCode || 'OTHR',
      description: payment.description || `PLACANJE PO PONUDI ${quoteNumber}`,
      currency: 'EUR',
    };

    (async () => {
      try {
        const url = await generateHub3Pdf417(params);
        if (!isMounted) return;
        setDataUrl(url);
      } catch (e: any) {
        if (!isMounted) return;
        setError(e?.message || 'Neuspjelo generiranje PDF417 barkoda');
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [payment, amount, quoteNumber]);

  const height = Math.round(width * 0.4); // prilagodba omjera za PDF417

  if (error) {
    // Fallback na QR kod ako PDF417 ne uspije
    return (
      <div className="flex flex-col items-center">
        <PaymentQRCode
          paymentInfo={{
            companyName: payment.companyName,
            iban: payment.iban,
            model: payment.model,
            reference: payment.reference || quoteNumber,
            purposeCode: payment.purposeCode || 'OTHR',
            description: payment.description || `Plaćanje po ponudi ${quoteNumber}`,
            amount: amount.toFixed(2),
          }}
          size={Math.max(150, width)}
        />
        <p className="mt-2 text-xs text-red-600">PDF417 nije dostupan, prikazan je QR kod.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      {dataUrl ? (
        <img
          src={dataUrl}
          alt="HUB3 PDF417 barkod za plaćanje"
          width={width}
          height={height}
          className="border border-gray-300 rounded-lg bg-white"
        />
      ) : (
        <div
          className="border border-dashed border-gray-300 rounded-lg bg-gray-50 animate-pulse"
          style={{ width, height }}
        />
      )}
    </div>
  );
};

export default PaymentPDF417;
