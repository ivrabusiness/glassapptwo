import React from 'react';
import { Plus, Package, List } from 'lucide-react';
import { WorkOrderItem, Product, Process, InventoryItem } from '../../../types';
import ItemEditor from './ItemEditor';
import BulkEntryModal from './BulkEntryModal';

interface ItemsListProps {
  items: WorkOrderItem[];
  products: Product[];
  processes: Process[];
  inventory: InventoryItem[];
  onAddItem: () => void;
  onAddBulkItems: (newItems: WorkOrderItem[]) => void;
  onUpdateItem: (itemId: string, field: keyof WorkOrderItem, value: any) => void;
  onRemoveItem: (itemId: string) => void;
  onUpdateMaterialProcesses: (itemId: string, materialId: string, processId: string, action: 'add' | 'remove', notes?: string) => void;
  onUpdateProcessNotes: (itemId: string, materialId: string, processId: string, notes: string) => void;
}

const ItemsList: React.FC<ItemsListProps> = ({ 
  items,
  products,
  processes,
  inventory,
  onAddItem,
  onAddBulkItems,
  onUpdateItem,
  onRemoveItem,
  onUpdateMaterialProcesses,
  onUpdateProcessNotes
}) => {
  const [showBulkEntryModal, setShowBulkEntryModal] = React.useState(false);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-lg font-medium text-gray-900">Artikli</h2>
        <div className="flex space-x-2">
          <button
            onClick={onAddItem}
            className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Dodaj artikal
          </button>
          <button
            onClick={() => setShowBulkEntryModal(true)}
            className="inline-flex items-center px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
          >
            <List className="h-4 w-4 mr-2" />
            Masovni unos
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Package className="mx-auto h-12 w-12 text-gray-400 mb-3" />
          <p>Nema dodanih artikala</p>
          <p className="text-sm">Kliknite "Dodaj artikal" za početak</p>
        </div>
      ) : (
        <div className="space-y-6">
          {items.map((item, index) => (
            <ItemEditor
              key={item.id}
              item={item}
              index={index}
              products={products}
              processes={processes}
              inventory={inventory}
              onUpdate={onUpdateItem}
              onRemove={onRemoveItem}
              onUpdateMaterialProcesses={onUpdateMaterialProcesses}
              onUpdateProcessNotes={onUpdateProcessNotes}
            />
          ))}
        </div>
      )}
      
      {/* Bulk Entry Modal */}
      {showBulkEntryModal && (
        <BulkEntryModal
          isOpen={showBulkEntryModal}
          onClose={() => setShowBulkEntryModal(false)}
          onAddItems={onAddBulkItems}
          products={products}
        />
      )}
    </div>
  );
};

export default ItemsList;
