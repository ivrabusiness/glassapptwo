import QRCode from 'qrcode';

/**
 * Generiraj QR kod s fallback opcijama
 */
export async function generateQRCode(text: string): Promise<string> {
  try {
    console.log('🔄 Generating QR code for:', text);

    const options = [
      { width: 200, margin: 2, color: { dark: '#000000', light: '#FFFFFF' }, errorCorrectionLevel: 'M' as const },
      { width: 300, margin: 1, color: { dark: '#000000', light: '#FFFFFF' }, errorCorrectionLevel: 'H' as const },
      { width: 150, margin: 0, color: { dark: '#000000', light: '#FFFFFF' } }
    ];

    for (let i = 0; i < options.length; i++) {
      try {
        const qrCode = await QRCode.toDataURL(text, options[i]);
        if (qrCode && qrCode.length > 100) {
          console.log(`✅ QR code generated with option ${i + 1}, length:`, qrCode.length);
          return qrCode;
        }
      } catch (optionError) {
        console.warn(`⚠️ QR option ${i + 1} failed:`, optionError);
        continue;
      }
    }

    console.log('🔄 Generating SVG fallback QR code');
    return generateFallbackQR(text);
  } catch (error) {
    console.error('❌ All QR generation methods failed:', error);
    return generateFallbackQR(text);
  }
}

/**
 * Generiraj fallback SVG QR kod
 */
export function generateFallbackQR(text: string): string {
  const svg = `
    <svg width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" fill="#ffffff" stroke="#000000" stroke-width="2"/>
      <rect x="20" y="20" width="40" height="40" fill="#000000"/>
      <rect x="140" y="20" width="40" height="40" fill="#000000"/>
      <rect x="20" y="140" width="40" height="40" fill="#000000"/>
      <rect x="80" y="80" width="40" height="40" fill="#000000"/>
      <text x="100" y="110" text-anchor="middle" font-family="Arial" font-size="8" fill="#666">${text}</text>
    </svg>
  `;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Generiraj EPC/SEPA QR (SCT) za plaćanje
 * Minimalni skup polja: Name, IBAN, (EUR) Amount, opcionalno BIC i remittance
 * Reference: EPC QR Code (SCT) specifikacija
 */
export async function generateEpcQr(params: {
  name: string;
  iban: string;
  amount?: number; // u EUR
  currency?: 'EUR';
  bic?: string; // SWIFT/BIC (opcionalno za verziju 002)
  remittance?: string; // opis ili poziv na broj (unstructured)
}): Promise<string> {
  const sanitizeText = (s: string | undefined, maxLen: number): string => {
    if (!s) return '';
    const ascii = s
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // strip diacritics
      .replace(/[^\x20-\x7E]/g, ''); // remove non-ASCII
    return ascii.toUpperCase().slice(0, maxLen);
  };

  const formatAmount = (amt?: number): string => {
    if (!amt || amt <= 0) return '';
    // Always dot as decimal separator, 2 decimals
    return `EUR${amt.toFixed(2).replace(',', '.')}`;
  };

  const serviceTag = 'BCD';
  const version = '002'; // 002 omogućuje opcionalni BIC unutar EEA
  const characterSet = '1'; // UTF-8
  const identification = 'SCT';
  const bic = sanitizeText(params.bic, 11);
  const name = sanitizeText(params.name, 70);
  const iban = (params.iban || '').replace(/\s+/g, '').toUpperCase();
  const amount = formatAmount(params.amount);
  const purpose = '';
  // Ako postoji model/poziv, preporuka: staviti u unstructured remittance (line 11)
  const remittanceRef = '';
  const unstructured = sanitizeText(params.remittance, 140);

  const payload = [
    serviceTag,
    version,
    characterSet,
    identification,
    bic,
    name,
    iban,
    amount,
    purpose,
    remittanceRef, // structured reference (prazno jer koristimo unstructured)
    unstructured   // unstructured remittance info
  ].join('\n');

  try {
    const dataUrl = await QRCode.toDataURL(payload, { width: 200, margin: 2, errorCorrectionLevel: 'M' });
    return dataUrl;
  } catch (e) {
    console.warn('⚠️ EPC QR generation failed, falling back to generic QR. Error:', e);
    return generateQRCode(payload);
  }
}
