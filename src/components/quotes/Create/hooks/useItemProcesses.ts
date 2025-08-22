import { QuoteItem } from '../../../../types';

interface UseItemProcessesParams {
  item: QuoteItem;
  onUpdateMaterialProcesses: (
    itemId: string,
    materialId: string,
    processId: string,
    action: 'add' | 'remove',
    notes?: string
  ) => void;
  onUpdateProcessNotes: (
    itemId: string,
    materialId: string,
    processId: string,
    notes: string
  ) => void;
}

export function useItemProcesses({
  item,
  onUpdateMaterialProcesses,
  onUpdateProcessNotes,
}: UseItemProcessesParams) {
  // Provjeri je li proces odabran za materijal
  const isProcessSelected = (materialId: string, processId: string) => {
    const material = item.materials?.find((m) => m.id === materialId);
    if (!material || !Array.isArray(material.processSteps)) return false;

    return material.processSteps.some((step) => step.processId === processId);
  };

  // Provjeri je li proces fiksan (kopiran iz proizvoda)
  const isProcessFixed = (materialId: string, processId: string) => {
    const material = item.materials?.find((m) => m.id === materialId);
    if (!material || !Array.isArray(material.processSteps)) return false;
    const step = material.processSteps.find((s) => s.processId === processId);
    return !!step?.isFixed;
  };

  // Dohvati napomenu za proces
  const getProcessNotes = (materialId: string, processId: string) => {
    const material = item.materials?.find((m) => m.id === materialId);
    if (!material || !Array.isArray(material.processSteps)) return '';

    const processStep = material.processSteps.find((step) => step.processId === processId);
    return processStep?.notes || '';
  };

  // Funkcija za toggle procesa za materijal
  const toggleProcess = (materialId: string, processId: string) => {
    const selected = isProcessSelected(materialId, processId);
    // Ako je proces već odabran i fiksan, ne dopuštamo ga isključiti
    if (selected && isProcessFixed(materialId, processId)) {
      return;
    }
    onUpdateMaterialProcesses(
      item.id,
      materialId,
      processId,
      selected ? 'remove' : 'add',
      getProcessNotes(materialId, processId)
    );
  };

  // Funkcija za ažuriranje napomene za proces
  const handleProcessNotesChange = (materialId: string, processId: string, notes: string) => {
    onUpdateProcessNotes(item.id, materialId, processId, notes);
  };

  return {
    isProcessSelected,
    isProcessFixed,
    getProcessNotes,
    toggleProcess,
    handleProcessNotesChange,
  };
}

