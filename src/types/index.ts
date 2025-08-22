export interface InventoryItem {
  id: string;
  name: string;
  code: string;
  unit: string;
  quantity: number;
  minQuantity: number;
  price: number;
  type: 'glass' | 'other';
  glassThickness?: number; // in mm, only for glass items
  notes?: string; // DODANO: Napomene za inventory item
  createdAt: string;
}

export interface StockTransaction {
  id: string;
  inventoryItemId: string;
  type: 'in' | 'out' | 'adjustment' | 'return';
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  supplierId?: string;
  documentNumber?: string;
  documentType?: 'invoice' | 'delivery-note' | 'other';
  attachmentUrl?: string; // URL to the stored attachment
  attachmentName?: string; // Original filename of the attachment
  attachmentType?: string; // MIME type of the attachment
  notes?: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  type: 'company' | 'individual';
  address: string;
  oib: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  notes?: string;
  createdAt: string;
}

export interface Client {
  id: string;
  name: string;
  type: 'company' | 'individual';
  address: string;
  oib: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  notes?: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  code: string;
  description: string;
  price: number; // Price per unit (m², piece, liter, etc.)
  materials: ProductMaterial[];
  createdAt: string;
}

export interface ProductMaterial {
  id: string; // DODANO: Jedinstveni ID za svaki materijal u proizvodu
  inventoryItemId: string;
  quantity: number;
  unit: string;
  notes?: string;
  hasProcesses?: boolean; // Kontrolira prikaz procesa za materijal
  showOnDeliveryNote?: boolean; // Kontrolira prikaz materijala na otpremnici
  inventoryName?: string; // DODANO: Naziv materijala iz inventory (dodaje se runtime)
  processSteps?: ProcessStep[]; // DODANO: Procesi vezani za materijal (koristi se u device sučelju)
}

export interface WorkOrder {
  id: string;
  orderNumber: string;
  clientId?: string;
  items: WorkOrderItem[];
  status: 'draft' | 'pending' | 'in-progress' | 'completed' | 'cancelled' | 'archived';
  createdAt: string;
  completedAt?: string;
  notes?: string;
  purchaseOrder?: string; // Broj narudžbenice kupca
  quoteId?: string; // Reference to the quote if converted from a quote
  originalQuoteTotal?: number; // Originalni iznos ponude pri konverziji
  currentTotal?: number; // Trenutni iznos naloga
  priceChangeReason?: string; // Razlog promjene cijene
  priceChangeApprovedBy?: string; // Tko je odobrio promjenu cijene
  priceChangeApprovedAt?: string; // Kada je odobrena promjena
  requiresQuoteUpdate?: boolean; // Da li je potrebno ažurirati ponudu
}

export interface WorkOrderItem {
  id: string;
  productId: string;
  productName?: string;
  quantity: number;
  dimensions: {
    width: number;
    height: number;
    area: number;
  };
  materials?: ProductMaterial[]; 
  processSteps?: ProcessStep[];
  notes?: string;
  isService?: boolean;
  serviceUnit?: string;
}

export interface ProcessStep {
  id: string;
  processId: string;
  status: 'pending' | 'in-progress' | 'completed';
  assignedDeviceId?: string;
  startedAt?: string;
  completedAt?: string;
  notes?: string;
  isFixed?: boolean;
  isDefault?: boolean; // Označava da li je ovaj proces default za ovaj proizvod
}

export interface Process {
  id: string;
  name: string;
  description: string;
  estimatedDuration: number; // in minutes
  priceType?: 'square_meter' | 'linear_meter' | 'piece' | 'hour'; // Tip cijene
  price?: number; // Cijena po jedinici mjere
  thicknessPrices?: ThicknessPriceItem[]; // New property for thickness-based pricing
  order: number;
  isDefault: boolean; // Označava da li se proces automatski označava kada se odabere proizvod
  createdAt: string;
}

export interface ThicknessPriceItem {
  thickness: number; // in mm
  price: number; // in euros
}

// NOVO: Dodano za usluge
export interface Service {
  id: string;
  name: string;
  code: string;
  description: string;
  price: number;
  unit: 'hour' | 'piece' | 'square_meter' | 'linear_meter';
  createdAt: string;
}

export interface QRCodeData {
  type: 'work-order' | 'process-step';
  workOrderId: string;
  processStepId?: string;
  timestamp: string;
}

// NOVO: Dodano za otpremnice
export interface DeliveryNote {
  id: string;
  deliveryNumber: string;
  workOrderId: string;
  clientId: string;
  items: DeliveryNoteItem[];
  status: 'draft' | 'generated' | 'delivered' | 'invoiced' | 'archived'; // DODANO: invoiced status
  createdAt: string;
  deliveredAt?: string;
  deliveredBy?: string;
  receivedBy?: string;
  invoicedAt?: string; // NOVO: Datum izdavanja računa
  invoiceNumber?: string; // NOVO: Broj računa
  notes?: string;
}

export interface DeliveryNoteItem {
  id: string;
  workOrderItemId: string;
  productId: string;
  productName: string;
  productCode?: string;
  quantity: number;
  dimensions: {
    width: number;
    height: number;
    area: number;
  };
  totalArea: number;
  notes?: string;
  materials?: Array<{
    id: string;
    name: string;
    type: string;
    thickness?: number;
  }>;
}

// NOVO: Dodano za ponude (quotes)
// NOVO: Dodano za praćenje plaćanja
export interface PaymentRecord {
  id: string;
  paymentMethod: 'cash' | 'bank_transfer' | 'card' | 'check' | 'other';
  amount: number;
  transactionNumber?: string;
  description?: string;
  paymentDate: string;
  createdAt: string;
}

export interface Quote {
  id: string;
  quoteNumber: string;
  clientId?: string;
  items: QuoteItem[];
  status: 'created' | 'accepted' | 'rejected' | 'expired' | 'converted' | 'archived';
  createdAt: string;
  validUntil: string; // Datum do kojeg ponuda vrijedi
  acceptedAt?: string;
  rejectedAt?: string;
  paymentDate?: string; // Datum kada je ponuda označena kao plaćena (deprecated - koristiti paymentRecords)
  convertedToWorkOrderId?: string;
  totalAmount: number; // Ukupan iznos bez PDV-a (proizvodi + procesi)
  productAmount?: number; // Iznos samo za proizvode
  processAmount?: number; // Iznos samo za procese
  vatRate: number; // Stopa PDV-a (npr. 25)
  vatAmount: number; // Iznos PDV-a
  grandTotal: number; // Ukupan iznos s PDV-om
  paymentInfo: PaymentInfo[] | PaymentInfo; // Podaci za plaćanje - može biti array ili objekt
  paymentRecords?: PaymentRecord[]; // NOVO: Detaljno praćenje plaćanja
  purchaseOrder?: string; // Broj narudžbenice kupca
  notes?: string;
}

export interface QuoteItem {
  id: string;
  productId: string;
  serviceId?: string; // NOVO: Dodano za usluge
  productName: string;
  productCode?: string;
  quantity: number;
  dimensions: {
    width: number;
    height: number;
    area: number;
  };
  unitPrice: number; // Cijena po jedinici (m² ili kom)
  totalPrice: number; // Ukupna cijena stavke
  materials?: ProductMaterial[]; // Dodano: materijali i procesi slično kao kod naloga
  processSteps?: ProcessStep[]; // NOVO: Procesi na razini stavke (koristi se za usluge)
  isService?: boolean; // NOVO: Oznaka da je stavka usluga, a ne proizvod
  notes?: string;
}

export interface PaymentInfo {
  companyName: string;
  iban: string;
  bankName?: string;
  swift?: string;
  model: string;
  reference: string;
  purposeCode: string;
  description: string;
}

export interface CompanySettings {
  id: string;
  name: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  oib: string;
  mb: string;
  iban: string;
  email: string;
  phone: string;
  website: string;
  logo?: string;
  createdAt: string;
  updatedAt: string;
}

// NOVO: Dodano za bankovne račune
export interface BankAccount {
  id: string;
  accountName: string;
  bankName: string;
  iban: string;
  swift?: string;
  model?: string;
  referencePrefix?: string;
  purposeCode?: string;
  description?: string;
  isDefault: boolean; 
  isVisibleOnQuotes?: boolean; // Novo: kontrolira vidljivost na ponudama
  notes?: string;
  createdAt: string;
}
