import { QRCodeData } from '../types';

// Simple QR code generation using a service (in production, you'd use a proper QR library)
export const generateQRCode = (data: QRCodeData): string => {
  const qrData = JSON.stringify(data);
  const encodedData = encodeURIComponent(qrData);
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodedData}`;
};

export const parseQRCode = (qrData: string): QRCodeData | null => {
  try {
    return JSON.parse(qrData);
  } catch {
    return null;
  }
};

export const generateWorkOrderQR = (workOrderId: string): string => {
  const data: QRCodeData = {
    type: 'work-order',
    workOrderId,
    timestamp: new Date().toISOString(),
  };
  return generateQRCode(data);
};

export const generateProcessStepQR = (workOrderId: string, processStepId: string): string => {
  const data: QRCodeData = {
    type: 'process-step',
    workOrderId,
    processStepId,
    timestamp: new Date().toISOString(),
  };
  return generateQRCode(data);
};
