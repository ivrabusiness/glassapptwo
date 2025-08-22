/**
 * Utility functions for generating IDs and codes
 * No localStorage - pure utility functions only
 */

/**
 * Generate a unique ID using crypto.randomUUID() with fallback
 */
export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Generate a work order number in format WOyymmdd-XXXXXX
 */
export function generateOrderNumber(): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  
  // Generate random 6-digit number
  const randomNum = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  
  return `WO${year}${month}${day}-${randomNum}`;
}

/**
 * Generate an item code based on existing inventory
 * Format: IN0001, IN0002, etc.
 */
export function generateItemCode(inventory: any[] = []): string {
  if (!Array.isArray(inventory)) {
    return 'IN0001';
  }
  
  // Find existing codes that match pattern IN####
  const existingCodes = inventory
    .map(item => item.code)
    .filter(code => code && /^IN\d{4}$/.test(code))
    .map(code => parseInt(code.slice(2), 10))
    .filter(num => !isNaN(num));
  
  // Find the highest number and increment
  const maxNumber = existingCodes.length > 0 ? Math.max(...existingCodes) : 0;
  const nextNumber = maxNumber + 1;
  
  return `IN${nextNumber.toString().padStart(4, '0')}`;
}

/**
 * Generate a quote number in format QT-yymmdd-XXXX
 */
export function generateQuoteNumber(): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  
  // Generate random 4-digit number
  const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  
  return `QT-${year}${month}${day}-${randomNum}`;
}

/**
 * Check if item name already exists in inventory
 */
export function checkDuplicateName(inventory: any[] = [], name: string, excludeId?: string): boolean {
  if (!Array.isArray(inventory) || !name) {
    return false;
  }
  
  return inventory.some(item => 
    item.name.toLowerCase().trim() === name.toLowerCase().trim() && 
    item.id !== excludeId
  );
}

/**
 * Check if item code already exists in inventory
 */
export function checkDuplicateCode(inventory: any[] = [], code: string, excludeId?: string): boolean {
  if (!Array.isArray(inventory) || !code) {
    return false;
  }
  
  return inventory.some(item => 
    item.code.toLowerCase().trim() === code.toLowerCase().trim() && 
    item.id !== excludeId
  );
}

