import * as PDF417 from 'pdf417-generator';

export interface Hub3Params {
  amountEur?: number;
  payerName?: string;
  payerAddress?: string;
  payerCity?: string;
  receiverName: string;
  receiverAddress?: string;
  receiverCity?: string;
  iban: string;
  model?: string;
  reference?: string;
  purposeCode?: string;
  description?: string;
  currency?: 'EUR';
}

const toAsciiUpper = (s?: string): string => {
  if (!s) return '';
  const ascii = s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .replace(/[^\x20-\x7E]/g, '') // remove non-ASCII
    .replace(/\s+/g, ' ') // collapse whitespace
    .trim();
  return ascii.toUpperCase();
};

const normalizeIban = (iban?: string): string => {
  return (iban || '').replace(/\s+/g, '').toUpperCase();
};

const normalizeModel = (model?: string): string => {
  if (!model) return 'HR00';
  const m = model.replace(/\s+/g, '').toUpperCase();
  if (m.startsWith('HR') && m.length >= 4) return m.slice(0, 4);
  if (/^\d{2}$/.test(m)) return `HR${m}`;
  if (m.length === 4) return m; // already like XXYY
  return 'HR00';
};

const formatAmountCents = (amt?: number): string => {
  if (!amt || amt <= 0) return '';
  const cents = Math.round(amt * 100);
  return `${cents}`.padStart(15, '0');
};

export function buildHub3Payload(params: Hub3Params): string {
  const lines = [
    'HRVHUB30',
    params.currency || 'EUR',
    formatAmountCents(params.amountEur),
    toAsciiUpper(params.payerName),
    toAsciiUpper(params.payerAddress),
    toAsciiUpper(params.payerCity),
    toAsciiUpper(params.receiverName || 'PRIMATELJ'),
    toAsciiUpper(params.receiverAddress),
    toAsciiUpper(params.receiverCity),
    normalizeIban(params.iban),
    normalizeModel(params.model),
    toAsciiUpper(params.reference),
    toAsciiUpper(params.purposeCode),
    toAsciiUpper(params.description),
  ];
  return lines.join('\n');
}

export async function generateHub3Pdf417(params: Hub3Params): Promise<string> {
  const payload = buildHub3Payload(params);
  const canvas = document.createElement('canvas');
  try {
    // aspectRatio=2 (default), ecl=-1 (auto), devicePixelRatio for sharpness
    const dpr = (typeof window !== 'undefined' && (window as any).devicePixelRatio) ? (window as any).devicePixelRatio : 2;
    (PDF417 as any).draw(payload, canvas, 2, -1, dpr);
    return canvas.toDataURL('image/png');
  } catch (e) {
    // Retry with safer defaults
    try {
      (PDF417 as any).draw(payload, canvas);
      return canvas.toDataURL('image/png');
    } catch (err) {
      throw err;
    }
  }
}
