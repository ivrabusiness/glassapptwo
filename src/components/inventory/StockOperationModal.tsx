import React, { useState, useRef, useEffect } from 'react';
import { InventoryItem, Supplier, WorkOrder } from '../../types';
import { useSupabaseData } from '../../hooks/useSupabaseData';
import { X, Upload, File, Paperclip, XCircle } from 'lucide-react';

interface StockOperationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  selectedItem: InventoryItem | null;
  formData: {
    type: 'in' | 'out' | 'adjustment';
    quantity: number;
    price: number;
    supplierId: string;
    documentNumber: string;
    documentType: 'invoice' | 'delivery-note' | 'other';
    notes: string;
    attachment?: File | null;
  };
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  suppliers: Supplier[];
  isSubmitting: boolean;
}

const StockOperationModal: React.FC<StockOperationModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  selectedItem,
  formData,
  setFormData,
  suppliers,
  isSubmitting
}) => {
  // KLJUČNO: Dodaj workOrders za pametni selektor
  const [workOrders] = useSupabaseData<WorkOrder>('work_orders', []);
  
  // NOVO: State za upravljanje attachmentom
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // KLJUČNO: State za autocomplete funkcionalnost
  const [showWorkOrderSuggestions, setShowWorkOrderSuggestions] = useState(false);
  const [filteredWorkOrders, setFilteredWorkOrders] = useState<WorkOrder[]>([]);
  const [atPosition, setAtPosition] = useState(-1); // KLJUČNO: Pozicija @ znaka
  const [lastAtText, setLastAtText] = useState(''); // KLJUČNO: Tekst nakon @ znaka
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null); // KLJUČNO: Ref za dropdown
  const modalRef = useRef<HTMLDivElement>(null);

  // KLJUČNO: Filtriraj radne naloge (u tijeku i završeni)
  const availableWorkOrders = workOrders.filter(order => 
    order.status === 'in-progress' || order.status === 'completed'
  );

  // Handle click outside to close modal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // KLJUČNO: Funkcija za rukovanje promjenom teksta u napomenama
  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart;
    
    // KLJUČNO: Provjeri je li korisnik obrisao dio teksta koji sadrži radni nalog
    if (formData.notes.length > value.length) {
      // Provjeri sadrži li obrisani dio teksta radni nalog (WO...)
      const deletedText = formData.notes.substring(value.length);
      const workOrderPattern = /WO\d{6}-\d+/;
      
      if (workOrderPattern.test(formData.notes)) {
        // Pronađi sve radne naloge u tekstu
        const workOrderMatches = formData.notes.match(/WO\d{6}-\d+\s*\([^)]*\)/g) || [];
        
        // Provjeri je li bilo koji od njih djelomično obrisan
        for (const match of workOrderMatches) {
          // Ako je dio radnog naloga obrisan, ukloni cijeli radni nalog
          if (formData.notes.includes(match) && !value.includes(match) && value.includes(match.substring(0, 3))) {
            // Pronađi poziciju radnog naloga u originalnom tekstu
            const matchIndex = formData.notes.indexOf(match);
            
            // Rekonstruiraj tekst bez cijelog radnog naloga
            const newText = formData.notes.substring(0, matchIndex) + formData.notes.substring(matchIndex + match.length);
            
            // Postavi novi tekst
            setFormData((prev: any) => ({ ...prev, notes: newText }));
            return;
          }
        }
      }
    }
    
    setFormData((prev: any) => ({ ...prev, notes: value }));
    
    // KLJUČNO: Provjeri je li korisnik utipkao @ i prikaži prijedloge
    const textBeforeCursor = value.substring(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const searchTerm = textBeforeCursor.substring(lastAtIndex + 1);
      
      // Ako nema razmaka nakon @, prikaži prijedloge
      if (!searchTerm.includes(' ') && searchTerm.length >= 0) {
        const filtered = availableWorkOrders.filter(order =>
          order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (order.status === 'in-progress' && 'u tijeku'.includes(searchTerm.toLowerCase())) ||
          (order.status === 'completed' && 'završen'.includes(searchTerm.toLowerCase()))
        );
        
        setFilteredWorkOrders(filtered);
        setShowWorkOrderSuggestions(true);
        setAtPosition(lastAtIndex); // KLJUČNO: Zapamti poziciju @ znaka
        setLastAtText(searchTerm); // KLJUČNO: Zapamti tekst nakon @ znaka
      } else {
        setShowWorkOrderSuggestions(false);
        setAtPosition(-1);
        setLastAtText('');
      }
    } else {
      setShowWorkOrderSuggestions(false);
      setAtPosition(-1);
      setLastAtText('');
    }
  };

  // KLJUČNO: ISPRAVLJENA funkcija za odabir radnog naloga - SPRJEČAVA PROPAGACIJU!
  const selectWorkOrder = (order: WorkOrder, event: React.MouseEvent) => {
    // KLJUČNO: Spriječi propagaciju event-a da se ne zatvori dropdown
    event.preventDefault();
    event.stopPropagation();
    
    if (atPosition === -1) return;
    
    const currentNotes = formData.notes;
    const beforeAt = currentNotes.substring(0, atPosition);
    const afterAt = currentNotes.substring(atPosition);
    
    // Pronađi gdje završava trenutni @ dio
    const spaceIndex = afterAt.indexOf(' ');
    const afterAtPart = spaceIndex !== -1 ? afterAt.substring(spaceIndex) : '';
    
    const statusText = order.status === 'in-progress' ? 'u tijeku' : 'završen';
    const newText = `${beforeAt}${order.orderNumber} (${statusText})${afterAtPart}`;
    
    // KLJUČNO: Ažuriraj formData
    setFormData((prev: any) => ({ ...prev, notes: newText }));
    setShowWorkOrderSuggestions(false);
    setAtPosition(-1);
    setLastAtText('');
    
    // KLJUČNO: Vrati fokus na textarea i postavi kursor na kraj umetnutog teksta
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = beforeAt.length + order.orderNumber.length + statusText.length + 3; // +3 za ( )
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 10);
  };

  // KLJUČNO: Poboljšano zatvaranje prijedloga - ne zatvara ako se klikne na dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      // KLJUČNO: Ne zatvori ako se klikne na textarea ili dropdown
      if (
        textareaRef.current && textareaRef.current.contains(target) ||
        dropdownRef.current && dropdownRef.current.contains(target)
      ) {
        return;
      }
      
      setShowWorkOrderSuggestions(false);
      setAtPosition(-1);
      setLastAtText('');
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // KLJUČNO: Rukovanje tipkovnicom (ESC za zatvaranje)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showWorkOrderSuggestions) {
      if (e.key === 'Escape') {
        setShowWorkOrderSuggestions(false);
        setAtPosition(-1);
        setLastAtText('');
        e.preventDefault();
      }
    }
  };

  if (!isOpen || !selectedItem) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in-progress': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'completed': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'in-progress': return 'U tijeku';
      case 'completed': return 'Završen';
      default: return status;
    }
  };

  // KLJUČNO: Izračun prosječne cijene za prikaz
  const calculateAveragePrice = () => {
    if (formData.type !== 'in' || formData.quantity <= 0 || formData.price < 0 || !selectedItem) {
      return null;
    }

    const currentValue = selectedItem.quantity * selectedItem.price;
    const newValue = formData.quantity * formData.price;
    const totalQuantity = selectedItem.quantity + formData.quantity;
    const weightedAverage = totalQuantity > 0 ? (currentValue + newValue) / totalQuantity : 0;

    return {
      currentPrice: selectedItem.price,
      newPrice: weightedAverage,
      currentValue,
      newValue,
      totalValue: currentValue + newValue,
      totalQuantity
    };
  };

  // NOVO: Funkcija za rukovanje odabirom datoteke
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Provjeri veličinu datoteke (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Datoteka je prevelika. Maksimalna veličina je 5MB.');
      return;
    }
    
    // Postavi datoteku u formData
    setFormData((prev: any) => ({ ...prev, attachment: file }));
    
    // Kreiraj preview za PDF ili sliku
    if (file.type === 'application/pdf') {
      setAttachmentPreview('pdf');
    } else if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setAttachmentPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setAttachmentPreview('other');
    }
  };
  
  // NOVO: Funkcija za uklanjanje datoteke
  const removeAttachment = () => {
    setFormData((prev: any) => ({ ...prev, attachment: null }));
    setAttachmentPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // NOVO: Funkcija za prikaz imena datoteke
  const getFileName = () => {
    const file = formData.attachment;
    if (!file) return '';
    
    // Skrati ime ako je predugo
    const name = file.name;
    if (name.length > 25) {
      return name.substring(0, 10) + '...' + name.substring(name.length - 10);
    }
    return name;
  };
  
  // NOVO: Funkcija za prikaz veličine datoteke
  const getFileSize = () => {
    const file = formData.attachment;
    if (!file) return '';
    
    // Formatiraj veličinu u KB ili MB
    const sizeInKB = file.size / 1024;
    if (sizeInKB < 1024) {
      return `${Math.round(sizeInKB)} KB`;
    } else {
      return `${(sizeInKB / 1024).toFixed(2)} MB`;
    }
  };

  const averagePriceInfo = calculateAveragePrice();

  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black bg-opacity-50"></div>
      <div className="flex items-center justify-center min-h-screen p-4">
        <div ref={modalRef} className="bg-white rounded-lg max-w-xl w-full max-h-[90vh] overflow-y-auto relative z-10">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">
              {formData.type === 'in' && 'Dodaj na stanje'}
              {formData.type === 'out' && 'Oduzmi sa stanja'}
              {formData.type === 'adjustment' && 'Postavi stanje'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 rounded-full p-1"
              aria-label="Zatvori"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="p-6">
            <div className="mb-5 p-4 bg-gray-50 rounded-lg">
              <div className="flex">
              <p className="text-sm font-medium text-gray-900">{selectedItem.name}</p>
              </div>
              <p className="text-sm text-gray-500">
                Trenutno stanje: {selectedItem.quantity.toFixed(selectedItem.unit === 'kom' ? 0 : 4)} {selectedItem.unit}
                {selectedItem.type === 'glass' && selectedItem.glassThickness && (
                  <span className="ml-2 text-blue-600">• {selectedItem.glassThickness}mm</span>
                )}
              </p>
              <p className="text-sm text-gray-500">
                Trenutna cijena: {selectedItem.price.toFixed(2)} € / {selectedItem.unit}
              </p>
            </div>
            
            <form onSubmit={onSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {formData.type === 'adjustment' ? 'Novo stanje' : 'Količina'} ({selectedItem.unit})
                  </label>
                  <div className="flex">
                    <input
                      type="number"
                      min="0.001"
                      step="0.001"
                      required
                      value={formData.quantity}
                      onChange={(e) => setFormData((prev: any) => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                      disabled={isSubmitting}
                      className="w-full px-3 py-2 border border-gray-300 rounded-l-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                    />
                    <div className="px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md text-gray-600 font-medium">
                      {selectedItem?.unit}
                    </div>
                  </div>
                </div>
                
                {formData.type === 'in' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cijena (€)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      value={formData.price}
                      onChange={(e) => setFormData((prev: any) => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                      disabled={isSubmitting}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                    />
                  </div>
                )}
              </div>
              
              {/* KLJUČNO: Prikaz izračuna prosječne cijene */}
              {formData.type === 'in' && averagePriceInfo && formData.quantity > 0 && formData.price >= 0 && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">
                    Izračun prosječne cijene
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-blue-700">Trenutna zaliha:</div>
                    <div className="text-blue-900 font-medium">{selectedItem.quantity.toFixed(2)} {selectedItem.unit}</div>
                    
                    <div className="text-blue-700">Trenutna cijena:</div>
                    <div className="text-blue-900 font-medium">{selectedItem.price.toFixed(2)} €/{selectedItem.unit}</div>
                    
                    <div className="text-blue-700">Trenutna vrijednost:</div>
                    <div className="text-blue-900 font-medium">{averagePriceInfo.currentValue.toFixed(2)} €</div>
                    
                    <div className="text-blue-700">Nova količina:</div>
                    <div className="text-blue-900 font-medium">{formData.quantity.toFixed(2)} {selectedItem.unit}</div>
                    
                    <div className="text-blue-700">Nova cijena:</div>
                    <div className="text-blue-900 font-medium">{formData.price.toFixed(2)} €/{selectedItem.unit}</div>
                    
                    <div className="text-blue-700">Nova vrijednost:</div>
                    <div className="text-blue-900 font-medium">{averagePriceInfo.newValue.toFixed(2)} €</div>
                    
                    <div className="border-t border-blue-200 col-span-2 my-1"></div>
                    
                    <div className="text-blue-700">Ukupna količina:</div>
                    <div className="text-blue-900 font-medium">{averagePriceInfo.totalQuantity.toFixed(2)} {selectedItem.unit}</div>
                    
                    <div className="text-blue-700">Ukupna vrijednost:</div>
                    <div className="text-blue-900 font-medium">{averagePriceInfo.totalValue.toFixed(2)} €</div>
                    
                    <div className="text-blue-700 font-semibold">Nova prosječna cijena:</div>
                    <div className="text-blue-900 font-bold">{averagePriceInfo.newPrice.toFixed(2)} €/{selectedItem.unit}</div>
                  </div>
                  <p className="text-xs text-blue-700 mt-2">
                    <strong>Napomena:</strong> Prosječna cijena se automatski izračunava kao težinski prosjek postojeće i nove cijene.
                  </p>
                </div>
              )}
              
              {formData.type === 'in' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dobavljač
                    </label>
                    <select
                      value={formData.supplierId}
                      onChange={(e) => setFormData((prev: any) => ({ ...prev, supplierId: e.target.value }))}
                      disabled={isSubmitting}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                      required
                    >
                      <option value="">Odaberite dobavljača</option>
                      {suppliers.map(supplier => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Broj dokumenta
                      </label>
                      <input
                        type="text"
                        value={formData.documentNumber}
                        onChange={(e) => setFormData((prev: any) => ({ ...prev, documentNumber: e.target.value }))}
                        disabled={isSubmitting}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tip dokumenta
                      </label>
                      <select
                        value={formData.documentType}
                        onChange={(e) => setFormData((prev: any) => ({ ...prev, documentType: e.target.value as any }))}
                        disabled={isSubmitting}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                      >
                        <option value="invoice">Račun</option>
                        <option value="delivery-note">Otpremnica</option>
                        <option value="other">Ostalo</option>
                      </select>
                    </div>
                  </div>
                </>
              )}
              
              {/* NOVO: Attachment upload */}
              <div className="mt-4 border-t border-gray-200 pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <div className="flex items-center">
                    <Paperclip className="h-4 w-4 mr-1 text-gray-500" />
                    Priložite dokument (opcionalno)
                  </div>
                </label>
                
                {!attachmentPreview ? (
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="file-upload"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                        >
                          <span>Odaberite datoteku</span>
                          <input
                            id="file-upload"
                            name="file-upload"
                            type="file"
                            ref={fileInputRef}
                            className="sr-only"
                            onChange={handleFileChange}
                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                          />
                        </label>
                        <p className="pl-1">ili povucite i ispustite</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        PDF, slike ili dokumenti do 5MB
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-1 flex items-center p-4 border border-gray-300 rounded-md bg-gray-50">
                    <div className="flex-shrink-0 mr-4">
                      {attachmentPreview === 'pdf' ? (
                        <File className="h-10 w-10 text-red-500" />
                      ) : attachmentPreview === 'other' ? (
                        <File className="h-10 w-10 text-blue-500" />
                      ) : (
                        <img 
                          src={attachmentPreview} 
                          alt="Preview" 
                          className="h-16 w-16 object-cover rounded border border-gray-300" 
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {getFileName()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {getFileSize()} • {formData.attachment?.type}
                      </p>
                    </div>
                    <div className="flex-shrink-0 ml-4">
                      <button
                        type="button"
                        onClick={removeAttachment}
                        className="inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        <XCircle className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                )}
                
                <p className="mt-2 text-xs text-gray-500">
                  Priložite sken računa, otpremnice ili drugog dokumenta vezanog uz ovu transakciju.
                </p>
              </div>
              
              {/* KLJUČNO: Poboljšana napomena s autocomplete funkcionalnosti */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Napomena
                  {formData.type === 'out' && (
                    <span className="text-blue-600 text-xs ml-2">
                      💡 Utipkajte @ za povezivanje s radnim nalogom
                    </span>
                  )}
                </label>
                <textarea
                  ref={textareaRef}
                  value={formData.notes}
                  onChange={handleNotesChange}
                  onKeyDown={handleKeyDown}
                  rows={2}
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                  placeholder={
                    formData.type === 'out' 
                      ? "npr. Razbilo se staklo @ (utipkajte @ za odabir naloga)"
                      : "Dodatne informacije..."
                  }
                />
                
                {/* KLJUČNO: Dropdown s prijedlozima radnih naloga - DODAJ REF I SPRIJEČI PROPAGACIJU */}
                {showWorkOrderSuggestions && filteredWorkOrders.length > 0 && (
                  <div 
                    ref={dropdownRef}
                    className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto"
                    onMouseDown={(e) => e.preventDefault()} // KLJUČNO: Spriječi zatvaranje na mousedown
                  >
                    <div className="p-2 bg-gray-50 border-b border-gray-200">
                      <p className="text-xs text-gray-600 font-medium">
                        📋 Odaberite radni nalog ({filteredWorkOrders.length} pronađeno)
                      </p>
                    </div>
                    {filteredWorkOrders.map(order => (
                      <button
                        key={order.id}
                        type="button"
                        onClick={(e) => selectWorkOrder(order, e)} // KLJUČNO: Proslijedi event
                        onMouseDown={(e) => e.preventDefault()} // KLJUČNO: Dodatna zaštita
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors focus:outline-none focus:bg-blue-50"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {order.orderNumber}
                            </p>
                            <p className="text-xs text-gray-500">
                              {order.items.length} artikal{order.items.length !== 1 ? 'a' : ''} • 
                              {order.items.reduce((total, item) => total + item.quantity, 0)} kom
                            </p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                            {getStatusText(order.status)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          Kreiran: {new Date(order.createdAt).toLocaleDateString('hr-HR')}
                          {order.completedAt && (
                            <span className="ml-2">
                              • Završen: {new Date(order.completedAt).toLocaleDateString('hr-HR')}
                            </span>
                          )}
                        </p>
                      </button>
                    ))}
                    
                    {/* KLJUČNO: Instrukcije za korištenje */}
                    <div className="p-2 bg-blue-50 border-t border-blue-200">
                      <p className="text-xs text-blue-600">
                        💡 Kliknite na nalog za odabir ili pritisnite ESC za zatvaranje
                      </p>
                    </div>
                  </div>
                )}
                
                {/* KLJUČNO: Poruka kad nema naloga */}
                {showWorkOrderSuggestions && filteredWorkOrders.length === 0 && (
                  <div 
                    ref={dropdownRef}
                    className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg"
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    <div className="p-3 text-center">
                      <p className="text-sm text-gray-500">
                        📋 Nema radnih naloga u tijeku ili završenih
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Prikazuju se samo nalozi s statusom "U tijeku" ili "Završen"
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* KLJUČNO: Objašnjenje funkcionalnosti */}
              {formData.type === 'out' && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-900 mb-1">
                    🔗 Povezivanje s radnim nalozima
                  </h4>
                  <div className="text-xs text-blue-700 space-y-1">
                    <p>• Utipkajte <strong>@</strong> u napomeni za prikaz dostupnih naloga</p>
                    <p>• Prikazuju se samo nalozi "U tijeku" i "Završeni"</p>
                    <p>• Odaberite nalog za automatsko umetanje broja i statusa</p>
                    <p>• Korisno za praćenje na kojem nalogu se dogodio kvar/gubitak</p>
                  </div>
                </div>
              )}
              
              <div className="flex justify-end space-x-3 pt-4 mt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  Odustani
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || formData.quantity <= 0}
                  className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    formData.type === 'in' ? 'bg-green-600 hover:bg-green-700' :
                    formData.type === 'out' ? 'bg-red-600 hover:bg-red-700' :
                    'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {isSubmitting ? 'Spremam...' : 'Potvrdi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockOperationModal;
