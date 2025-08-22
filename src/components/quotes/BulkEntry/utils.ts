import { ParsedDimension } from './types';

/**
 * Parsira tekst s dimenzijama u strukturirane podatke
 * Podržava formate: "300x300x1", "300 300 1", "300,300,1"
 */
export const parseDimensionsText = (text: string): { items: ParsedDimension[]; errors: string[] } => {
  const lines = text.trim().split(/\n+/);
  const parsedDimensions: ParsedDimension[] = [];
  const errors: string[] = [];

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();
    if (!trimmedLine) return;

    let match;
    let width = 0;
    let height = 0;
    let quantity = 1; // Zadana količina je 1

    // Format 1: 300x300x1
    match = trimmedLine.match(/^(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)(?:x(\d+))?$/);
    if (match) {
      width = parseFloat(match[1]);
      height = parseFloat(match[2]);
      quantity = match[3] ? parseInt(match[3]) : 1;
    } 
    // Format 2: 300 300 1
    else {
      match = trimmedLine.match(/^(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)(?:\s+(\d+))?$/);
      if (match) {
        width = parseFloat(match[1]);
        height = parseFloat(match[2]);
        quantity = match[3] ? parseInt(match[3]) : 1;
      } 
      // Format 3: 300,300,1
      else {
        match = trimmedLine.match(/^(\d+(?:\.\d+)?),(\d+(?:\.\d+)?)(?:,(\d+))?$/);
        if (match) {
          width = parseFloat(match[1]);
          height = parseFloat(match[2]);
          quantity = match[3] ? parseInt(match[3]) : 1;
        }
      }
    }

    if (width > 0 && height > 0 && quantity > 0) {
      parsedDimensions.push({ width, height, quantity });
    } else {
      errors.push(`Linija ${index + 1}: "${trimmedLine}" nije u ispravnom formatu. Koristite format "širina x visina x količina", "širina visina količina" ili "širina,visina,količina".`);
    }
  });

  return { items: parsedDimensions, errors };
};

/**
 * Izračunava ukupnu površinu za sve parsove stavke
 */
export const calculateTotalArea = (items: ParsedDimension[]): number => {
  return items.reduce((total, item) => {
    const widthInMeters = item.width / 100;
    const heightInMeters = item.height / 100;
    const area = widthInMeters * heightInMeters;
    return total + (area * item.quantity);
  }, 0);
};

/**
 * Izračunava ukupnu cijenu za sve parsove stavke
 */
export const calculateTotalPrice = (items: ParsedDimension[], unitPrice: number): number => {
  return calculateTotalArea(items) * unitPrice;
};

/**
 * Konvertira milimetre u metre
 */
export const mmToMeters = (mm: number): number => {
  return mm / 1000;
};

/**
 * Formatira broj s određenim brojem decimala
 */
export const formatNumber = (num: number, decimals: number = 2): string => {
  return num.toFixed(decimals);
};

/**
 * Formatira cijenu u hrvatskom formatu
 */
export const formatPrice = (price: number): string => {
  return price.toLocaleString('hr-HR', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });
};

