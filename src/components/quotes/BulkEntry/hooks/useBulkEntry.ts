import { useState } from 'react';
import { BulkEntryState, BulkEntryActions, ParsedDimension } from '../types';

const initialState: BulkEntryState = {
  selectedProductId: '',
  dimensionsText: '',
  error: null,
  parsedItems: [],
  isPreviewMode: false,
  unitPrice: 0,
};

/**
 * Custom hook za upravljanje stanjem BulkEntry komponente
 */
export const useBulkEntry = (): BulkEntryState & BulkEntryActions => {
  const [selectedProductId, setSelectedProductId] = useState(initialState.selectedProductId);
  const [dimensionsText, setDimensionsText] = useState(initialState.dimensionsText);
  const [error, setError] = useState<string | null>(initialState.error);
  const [parsedItems, setParsedItems] = useState<ParsedDimension[]>(initialState.parsedItems);
  const [isPreviewMode, setIsPreviewMode] = useState(initialState.isPreviewMode);
  const [unitPrice, setUnitPrice] = useState(initialState.unitPrice);

  const resetForm = () => {
    setSelectedProductId(initialState.selectedProductId);
    setDimensionsText(initialState.dimensionsText);
    setError(initialState.error);
    setParsedItems(initialState.parsedItems);
    setIsPreviewMode(initialState.isPreviewMode);
    setUnitPrice(initialState.unitPrice);
  };

  return {
    // State
    selectedProductId,
    dimensionsText,
    error,
    parsedItems,
    isPreviewMode,
    unitPrice,
    
    // Actions
    setSelectedProductId,
    setDimensionsText,
    setError,
    setParsedItems,
    setIsPreviewMode,
    setUnitPrice,
    resetForm,
  };
};

