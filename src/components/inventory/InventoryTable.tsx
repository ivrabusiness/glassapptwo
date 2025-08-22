import React, { useState, useRef, useEffect } from 'react';
import { Package, Edit, Trash2, TrendingUp, TrendingDown, RotateCcw, History, Euro, MoreVertical, Eye } from 'lucide-react';
import { InventoryItem } from '../../types';

interface InventoryTableProps {
  items: InventoryItem[];
  onEdit: (item: InventoryItem) => void;
  onDelete: (id: string) => void;
  onStockOperation: (item: InventoryItem, type: 'in' | 'out' | 'adjustment') => void;
  onViewHistory: (item: InventoryItem) => void;
  onViewItem?: (item: InventoryItem) => void;
}

const InventoryTable: React.FC<InventoryTableProps> = ({
  items,
  onEdit,
  onDelete,
  onStockOperation,
  onViewHistory,
  onViewItem
}) => {
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Zatvori dropdown kad se klikne van njega
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdownId(null);
        setDropdownPosition(null);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Funkcija za toggle dropdown-a s pozicioniranjem
  const toggleDropdown = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (openDropdownId === id) {
      setOpenDropdownId(null);
      setDropdownPosition(null);
    } else {
      const buttonRect = event.currentTarget.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const windowWidth = window.innerWidth;
      
      // Izračunaj poziciju dropdown-a
      const dropdownWidth = 200; // Približna širina dropdown-a
      const dropdownHeight = 300; // Približna visina dropdown-a
      
      // Provjeri ima li dovoljno prostora ispod
      const spaceBelow = windowHeight - buttonRect.bottom;
      
      let top;
      
      // Ako nema dovoljno prostora ispod, prikaži iznad
      if (spaceBelow < dropdownHeight) {
        top = buttonRect.top - dropdownHeight;
        if (top < 0) top = 10; // Ako bi bio izvan ekrana, prikaži ga na vrhu
      } else {
        top = buttonRect.bottom + 5;
      }
      
      // Izračunaj horizontalnu poziciju
      let left = buttonRect.left;
      
      // Ako bi dropdown izašao izvan desnog ruba ekrana, pomakni ga lijevo
      if (left + dropdownWidth > windowWidth) {
        left = windowWidth - dropdownWidth - 10;
      }
      
      setOpenDropdownId(id);
      setDropdownPosition({ top, left });
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Artikal
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Kod
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tip
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Količina
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Min. količina
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Vrijednost
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Akcije
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.map((item) => {
              // Ukupna vrijednost artikla
              const itemValue = item.quantity * item.price;
              
              return (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Package className="h-8 w-8 text-gray-400 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                        <div className="text-sm text-gray-500">
                          {item.unit}
                          {item.type === 'glass' && item.glassThickness && (
                            <span className="ml-2 text-blue-600">• {item.glassThickness}mm</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.code}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      item.type === 'glass' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {item.type === 'glass' ? 'Staklo' : 'Ostalo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.quantity.toFixed(item.unit === 'kom' ? 0 : 4)} {item.unit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {item.minQuantity.toFixed(item.unit === 'kom' ? 0 : 4)} {item.unit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Euro className="h-4 w-4 text-green-600 mr-1" />
                      <span className="text-sm font-medium text-green-700">
                        {itemValue.toLocaleString('hr-HR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} € <span className="text-xs text-gray-500">({item.price.toFixed(2)} €/{item.unit})</span>
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {item.quantity <= item.minQuantity ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        {item.quantity === 0 ? 'Nema zalihe' : 'Niska zaliha'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Dostupno
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end">
                      <div className="relative">
                        <button
                          onClick={(e) => toggleDropdown(item.id, e)}
                          className="text-gray-500 hover:text-gray-700 p-1 rounded"
                          title="Akcije"
                        >
                          <MoreVertical className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {items.length === 0 && (
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Nema artikala</h3>
          <p className="mt-1 text-sm text-gray-500">
            Nema artikala koji odgovaraju pretraživanju.
          </p>
        </div>
      )}

      {/* Dropdown menu - pozicioniran fiksno */}
      {openDropdownId && dropdownPosition && (
        <div 
          ref={dropdownRef}
          className="fixed z-50 w-48 bg-white rounded-md shadow-lg border border-gray-200"
          style={{ 
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`
          }}
        >
          <div className="py-1">
            <button
              onClick={() => {
                setOpenDropdownId(null);
                onStockOperation(items.find(item => item.id === openDropdownId)!, 'in');
              }}
              className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <TrendingUp className="h-4 w-4 text-green-600 mr-3" />
              Ulaz zalihe robe
            </button>
            <button
              onClick={() => {
                setOpenDropdownId(null);
                onStockOperation(items.find(item => item.id === openDropdownId)!, 'out');
              }}
              className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <TrendingDown className="h-4 w-4 text-red-600 mr-3" />
              Oduzmi sa stanja
            </button>
            <button
              onClick={() => {
                setOpenDropdownId(null);
                onStockOperation(items.find(item => item.id === openDropdownId)!, 'adjustment');
              }}
              className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <RotateCcw className="h-4 w-4 text-blue-600 mr-3" />
              Postavi stanje
            </button>
            <button
              onClick={() => {
                setOpenDropdownId(null);
                onViewHistory(items.find(item => item.id === openDropdownId)!);
              }}
              className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <History className="h-4 w-4 text-purple-600 mr-3" />
              Povijest promjena
            </button>
            {onViewItem && (
              <button
                onClick={() => {
                  setOpenDropdownId(null);
                  onViewItem(items.find(item => item.id === openDropdownId)!);
                }}
                className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                title="Detaljan pregled artikla"
              >
                <Eye className="h-4 w-4 text-indigo-600 mr-3" />
                Detaljan pregled
              </button>
            )}
            <button
              onClick={() => {
                setOpenDropdownId(null);
                onEdit(items.find(item => item.id === openDropdownId)!);
              }}
              className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <Edit className="h-4 w-4 text-gray-600 mr-3" />
              Uredi
            </button>
            <button
              onClick={() => {
                setOpenDropdownId(null);
                onDelete(openDropdownId);
              }}
              className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              <Trash2 className="h-4 w-4 text-red-600 mr-3" />
              Obriši
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryTable;
