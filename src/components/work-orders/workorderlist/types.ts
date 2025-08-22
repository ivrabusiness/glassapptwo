import type { WorkOrder, Client, DeliveryNote, InventoryItem, StockTransaction, Quote } from '../../../types';

export interface WorkOrdersListProps {
  onCreateNew: () => void;
  onEditOrder: (orderId: string) => void;
  onViewOrder: (orderId: string) => void;
}

export interface ArchiveMaterialInfo {
  inventoryItemId: string;
  name: string;
  quantity: number;
  unit: string;
  currentStock: number;
  newStock: number;
}

export interface ArchiveAnalysis {
  materialsToRestore: ArchiveMaterialInfo[];
  transactionsToCreate: number;
  hasDeliveryNote: boolean;
  deliveryNoteNumber?: string;
}

export interface FiltersProps {
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
}

export interface OrdersTableProps {
  orders: WorkOrder[];
  clients: Client[];
  deliveryNotes: DeliveryNote[];
  onEditOrder: (orderId: string) => void;
  onViewOrder: (orderNumber: string) => void;
  onRequestArchive: (order: WorkOrder) => void;
}

export interface ArchiveModalProps {
  open: boolean;
  orderToArchive: WorkOrder | null;
  analysis: ArchiveAnalysis | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export type { WorkOrder, Client, DeliveryNote, InventoryItem, StockTransaction, Quote };
