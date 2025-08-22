/**
 * Utility functions for work orders
 */

/**
 * Parses a work order number from notes text
 * @param notes The notes text to parse
 * @returns The work order number if found, null otherwise
 */
export const parseWorkOrderFromNotes = (notes: string): string | null => {
  if (!notes) return null;
  
  // Look for pattern WO + year + month + day + - + number (e.g., WO250703-323162)
  const workOrderMatch = notes.match(/WO\d{6}-\d+/);
  return workOrderMatch ? workOrderMatch[0] : null;
};
