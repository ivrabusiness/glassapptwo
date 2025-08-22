import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

interface PaymentQRCodeProps {
  paymentInfo: {
    companyName: string;
    iban: string;
    model: string;
    reference: string;
    purposeCode: string;
    description: string;
    amount: string;
  };
  size?: number;
}

const PaymentQRCode: React.FC<PaymentQRCodeProps> = ({ paymentInfo, size = 200 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Generiranje HUB3 QR koda prema standardu
    // Format: HRVHUB30\nIznos\nPrimatelj\nIBAN\nModel\nPoziv na broj\nŠifra namjene\nOpis plaćanja
    const qrData = [
      'HRVHUB30',
      paymentInfo.amount, // Iznos u formatu 0000.00
      paymentInfo.companyName, // Primatelj
      paymentInfo.iban, // IBAN
      paymentInfo.model, // Model (HR00, HR01, itd.)
      paymentInfo.reference, // Poziv na broj
      paymentInfo.purposeCode, // Šifra namjene (OTHR, GDSV, itd.)
      paymentInfo.description // Opis plaćanja
    ].join('\n');

    // Generiraj QR kod
    QRCode.toCanvas(canvasRef.current, qrData, {
      width: size,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });
  }, [paymentInfo, size]);

  return (
    <div className="flex flex-col items-center">
      <canvas ref={canvasRef} />
      <div className="mt-2 text-xs text-gray-600 text-center">
        <p>Skenirajte za plaćanje</p>
        <p className="font-medium">{paymentInfo.amount} €</p>
      </div>
    </div>
  );
};

export default PaymentQRCode;
