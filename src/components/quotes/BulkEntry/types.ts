import { Product, QuoteItem } from '../../../types';

export interface BulkEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddItems: (items: QuoteItem[]) => void;
  products: Product[];
}

export interface ParsedDimension {
  width: number;
  height: number;
  quantity: number;
}

export interface BulkEntryState {
  selectedProductId: string;
  dimensionsText: string;
  error: string | null;
  parsedItems: ParsedDimension[];
  isPreviewMode: boolean;
  unitPrice: number;
}

export interface BulkEntryActions {
  setSelectedProductId: (id: string) => void;
  setDimensionsText: (text: string) => void;
  setError: (error: string | null) => void;
  setParsedItems: (items: ParsedDimension[]) => void;
  setIsPreviewMode: (mode: boolean) => void;
  setUnitPrice: (price: number) => void;
  resetForm: () => void;
}

