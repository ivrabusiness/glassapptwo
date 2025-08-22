import { QuoteItem } from '../../../../types';

interface UseServiceProcessesParams {
  item: QuoteItem;
  onUpdateServiceProcesses: (
    itemId: string,
    processId: string,
    action: 'add' | 'remove',
    notes?: string
  ) => void;
  onUpdateServiceProcessNotes: (
    itemId: string,
    processId: string,
    notes: string
  ) => void;
}

export function useServiceProcesses({
  item,
  onUpdateServiceProcesses,
  onUpdateServiceProcessNotes,
}: UseServiceProcessesParams) {
  // Provjeri je li proces odabran na razini usluge
  const isProcessSelected = (processId: string) => {
    const steps = item.processSteps || [];
    return steps.some(step => step.processId === processId);
    };

  // Provjeri je li proces fiksan (ako ga ne želimo moći ukloniti)
  const isProcessFixed = (processId: string) => {
    const steps = item.processSteps || [];
    const step = steps.find(s => s.processId === processId);
    return !!step?.isFixed;
  };

  // Dohvati napomenu za proces
  const getProcessNotes = (processId: string) => {
    const steps = item.processSteps || [];
    const step = steps.find(s => s.processId === processId);
    return step?.notes || '';
  };

  // Toggle proces na razini usluge
  const toggleProcess = (processId: string) => {
    const selected = isProcessSelected(processId);
    if (selected && isProcessFixed(processId)) return; // ne dopuštamo uklanjanje fiksnog procesa
    onUpdateServiceProcesses(
      item.id,
      processId,
      selected ? 'remove' : 'add',
      getProcessNotes(processId)
    );
  };

  // Ažuriraj napomenu za proces
  const handleProcessNotesChange = (processId: string, notes: string) => {
    onUpdateServiceProcessNotes(item.id, processId, notes);
  };

  return {
    isProcessSelected,
    isProcessFixed,
    getProcessNotes,
    toggleProcess,
    handleProcessNotesChange,
  };
}
