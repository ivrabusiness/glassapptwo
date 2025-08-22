import React from 'react';
import { Briefcase, ChevronDown, ChevronUp, Building, User, Settings } from 'lucide-react';
import { Quote, Client, Process, InventoryItem, Service, BankAccount, PaymentInfo } from '../../../types';
import { useSupabaseData } from '../../../hooks/useSupabaseData';
import { calculateItemProcessPrice, calculateProcessPrice } from '../../../utils/processUtils';
import PaymentPDF417 from '../PaymentPDF417';

interface QuoteContentProps {
  quote: Quote;
  client: Client | null; 
  processes?: Process[];
  inventory?: InventoryItem[];
}

const QuoteContent: React.FC<QuoteContentProps> = ({ quote, client, processes = [], inventory = [] }) => {
  const [expandedItems, setExpandedItems] = React.useState<{[key: string]: boolean}>({});
  const [services] = useSupabaseData<Service>('services', []);
  const [bankAccounts] = useSupabaseData<BankAccount>('bank_accounts', []);

  // Normalize paymentInfo to ensure it's always an array
  const normalizedPaymentInfo = React.useMemo(() => {
    if (!quote || !quote.paymentInfo) return [];
    const paymentArray = Array.isArray(quote.paymentInfo) ? quote.paymentInfo : [quote.paymentInfo];
    // Filter out empty payment info (no company name or IBAN)
    return paymentArray.filter(info => info.companyName && info.iban);
  }, [quote.paymentInfo]);

  // Odredi zadani bankovni račun iz postavki
  const defaultBankAccount = React.useMemo(() => {
    return bankAccounts.find(acc => acc.isDefault);
  }, [bankAccounts]);

  // Primarni payment info za QR/PDF417: preferiraj zadani IBAN iz postavki
  const primaryPayment: PaymentInfo | null = React.useMemo(() => {
    if (normalizedPaymentInfo.length > 0 && defaultBankAccount) {
      const byIban = normalizedPaymentInfo.find((info: any) => info.iban === defaultBankAccount.iban);
      if (byIban) return byIban as PaymentInfo;
    }

    if (defaultBankAccount) {
      // Izgradi payment info iz zadanog računa ako nije među snimljenim
      let description = defaultBankAccount.description || `Plaćanje po ponudi ${quote.quoteNumber}`;
      description = description.replace('{broj_ponude}', quote.quoteNumber);
      let reference = quote.quoteNumber;
      if (defaultBankAccount.referencePrefix) {
        reference = `${defaultBankAccount.referencePrefix}${quote.quoteNumber}`;
      }
      return {
        companyName: defaultBankAccount.accountName,
        bankName: defaultBankAccount.bankName,
        iban: defaultBankAccount.iban,
        swift: defaultBankAccount.swift || '',
        model: defaultBankAccount.model || 'HR00',
        reference,
        purposeCode: defaultBankAccount.purposeCode || 'OTHR',
        description
      };
    }

    return normalizedPaymentInfo.length > 0 ? (normalizedPaymentInfo[0] as PaymentInfo) : null;
  }, [normalizedPaymentInfo, defaultBankAccount, quote.quoteNumber]);

  // Format IBAN za prikaz (grupiranje po 4 znaka)
  const formatIban = React.useCallback((iban: string) => {
    return iban.replace(/\s+/g, '').replace(/(.{4})/g, '$1 ').trim();
  }, []);


  // Funkcija za toggle prikaza materijala i procesa
  const toggleItemExpand = (itemId: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  // Funkcija za izračun cijene procesa za stavku
  const calculateProcessPriceForItem = (item: any) => {
    return calculateItemProcessPrice(item, processes, inventory);
  };

  return (
    <div className="lg:col-span-2 space-y-6">
      {/* Client Info */}
      {client && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Klijent</h2>
          <div className="flex items-start space-x-3">
            {client.type === 'company' ? (
              <Building className="h-5 w-5 text-purple-500 mt-0.5" />
            ) : (
              <User className="h-5 w-5 text-green-500 mt-0.5" />
            )}
            <div>
              <p className="text-sm font-medium text-gray-900">{client.name}</p>
              <p className="text-sm text-gray-600">{client.address}</p>
              <p className="text-sm text-gray-600">OIB: {client.oib}</p>
              {client.contactPerson && (
                <p className="text-sm text-gray-600">Kontakt: {client.contactPerson}</p>
              )}
              {client.phone && (
                <p className="text-sm text-gray-600">Telefon: {client.phone}</p>
              )}
              {client.email && (
                <p className="text-sm text-gray-600">Email: {client.email}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Items */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Stavke ponude</h2>
        <div className="space-y-4">
          {quote.items.map((item, index) => {
            // Izračunaj cijenu procesa za ovu stavku
            const processPrice = calculateProcessPriceForItem(item);
            const isExpanded = expandedItems[item.id] || false;
            
            return (
              <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      Stavka {index + 1}: {item.productName}
                    </h3>
                    {item.isService && (
                      <span className="inline-flex items-center px-2 py-1 mt-1 rounded-md text-xs font-medium bg-purple-100 text-purple-800">
                        <Briefcase className="h-3 w-3 mr-1" />
                        Usluga
                      </span>
                    )}
                  </div>
                  {item.productCode && (
                    <span className="text-sm text-gray-500">{item.productCode}</span>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <span className="text-sm text-gray-600">Količina:</span>
                    <p className="font-medium">{item.quantity} {item.isService && services.find(s => s.id === item.serviceId)?.unit === 'hour' ? 'sati' : 'kom'}</p>
                  </div>
                  {!item.isService && (
                  <div>
                    <span className="text-sm text-gray-600">Dimenzije:</span>
                    <p className="font-medium">{item.dimensions.width} × {item.dimensions.height} mm</p>
                  </div>
                  )}
                  {!item.isService && (
                  <div>
                    <span className="text-sm text-gray-600">Površina:</span>
                    <p className="font-medium">{item.dimensions.area.toFixed(4)} m²</p>
                  </div>
                  )}
                  {!item.isService && (
                  <div>
                    <span className="text-sm text-gray-600">Ukupna površina:</span>
                    <p className="font-medium">{(item.dimensions.area * item.quantity).toFixed(4)} m²</p>
                  </div>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-3 bg-purple-50 p-3 rounded-lg">
                  {item.isService ? (
                    <>
                      <div>
                        <span className="text-sm text-purple-700">Cijena po {
                          (() => {
                            const service = services.find(s => s.id === item.serviceId);
                            switch(service?.unit) {
                              case 'hour': return 'satu';
                              case 'piece': return 'komadu';
                              case 'square_meter': return 'm²';
                              case 'linear_meter': return 'm';
                              default: return 'komadu';
                            }
                          })()
                        }:</span>
                        <p className="font-medium text-purple-900">{item.unitPrice.toLocaleString('hr-HR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</p>
                      </div>
                      <div>
                        <span className="text-sm text-purple-700">Količina:</span>
                        <p className="font-medium text-purple-900">{item.quantity} {
                          (() => {
                            const service = services.find(s => s.id === item.serviceId);
                            switch(service?.unit) {
                              case 'hour': return 'sati';
                              case 'piece': return 'kom';
                              case 'square_meter': return 'm²';
                              case 'linear_meter': return 'm';
                              default: return 'kom';
                            }
                          })()
                        }</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <span className="text-sm text-purple-700">Cijena po m²:</span>
                        <p className="font-medium text-purple-900">{item.unitPrice.toLocaleString('hr-HR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</p>
                      </div>
                      <div>
                        <span className="text-sm text-purple-700">Ukupna površina:</span>
                        <p className="font-medium text-purple-900">{(item.dimensions.area * item.quantity).toFixed(4)} m²</p>
                      </div>
                    </>
                  )}
                  <div>
                    <span className="text-sm text-purple-700">Ukupna cijena:</span>
                    <p className="font-medium text-purple-900">{item.totalPrice.toLocaleString('hr-HR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</p>
                  </div>
                </div>
              
                {/* Cijena svih procesa */}
                <div className="p-3 border rounded-lg mt-2 flex justify-between items-center" 
                  style={{ 
                    backgroundColor: processPrice > 0 ? 'rgb(243 232 255)' : 'rgb(249 250 251)', 
                    borderColor: processPrice > 0 ? 'rgb(233 213 255)' : 'rgb(229 231 235)' 
                  }}>
                  <span className="text-sm font-medium" 
                    style={{ color: processPrice > 0 ? 'rgb(107 33 168)' : 'rgb(107 114 128)' }}>
                    Ukupna cijena procesa:
                  </span>
                  <span className="text-sm font-bold" style={{ color: processPrice > 0 ? 'rgb(107 33 168)' : 'rgb(107 114 128)' }}>
                    {processPrice.toLocaleString('hr-HR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                  </span>
                </div>
              
                {processPrice > 0 && (
                  <div className="text-xs text-purple-700 mt-1 px-3">
                    Ova cijena uključuje sve odabrane procese i dodaje se na osnovnu cijenu proizvoda.
                  </div>
                )}
              
                {/* Prikaz procesa i njihovih cijena */}
                {!item.isService && item.materials && item.materials.some(m => m.processSteps && m.processSteps.length > 0) && (
                  <div className="mb-4">
                    <button
                      type="button"
                      onClick={() => toggleItemExpand(item.id)}
                      className="flex items-center justify-between w-full text-left text-sm font-medium text-gray-700 hover:text-gray-900 p-2 bg-gray-50 rounded-lg mb-2"
                    >
                      <span className="flex items-center">
                        <Settings className="h-4 w-4 mr-2 text-gray-500" />
                        Procesi i materijali
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                  
                    {isExpanded && (
                      <div className="space-y-3 mt-2">
                        {item.materials.map((material, materialIndex) => {
                          const inventoryItem = inventory.find(inv => inv.id === material.inventoryItemId);
                        
                          return (
                            <div key={material.id} className="border border-gray-200 p-3 rounded-lg">
                              <h4 className="text-sm font-medium text-gray-800">
                                {inventoryItem?.name || 'Materijal'} #{materialIndex + 1}
                                {inventoryItem?.type === 'glass' && inventoryItem.glassThickness && (
                                  <span className="ml-1 text-blue-600">({inventoryItem.glassThickness}mm)</span>
                                )}
                              </h4>
                            
                              {material.processSteps && material.processSteps.length > 0 ? (
                                <div className="mt-2 space-y-2">
                                  <h5 className="text-xs font-medium text-gray-700">Procesi za materijal #{materialIndex + 1}:</h5>
                                  <div className="space-y-1">
                                    {material.processSteps.map(step => {
                                      const process = processes.find(p => p.id === step.processId);
                                      if (!process) return null;
                                    
                                      // Get inventory item for glass thickness
                                      const inventoryItem = inventory.find(inv => inv.id === material.inventoryItemId);
                                      const glassThickness = inventoryItem?.type === 'glass' ? inventoryItem.glassThickness : undefined;
                                      
                                      // Get process price based on thickness
                                      const processBasePrice = calculateProcessPrice(process, glassThickness);
                                    
                                      const priceUnit = process.priceType === 'square_meter' ? 'm²' :
                                        process.priceType === 'linear_meter' ? 'm' :
                                          process.priceType === 'piece' ? 'kom' :
                                            process.priceType === 'hour' ? 'h' : '';

                                      // Calculate price based on dimensions and quantity
                                      let processItemPrice = 0;
                                      switch (process.priceType) {
                                        case 'square_meter':
                                          processItemPrice = processBasePrice * item.dimensions.area * item.quantity;
                                          break;
                                        case 'linear_meter':
                                          const perimeter = 2 * (item.dimensions.width + item.dimensions.height) / 100;
                                          processItemPrice = processBasePrice * perimeter * item.quantity;
                                          break;
                                        case 'piece':
                                          processItemPrice = processBasePrice * item.quantity;
                                          break;
                                        case 'hour':
                                          processItemPrice = processBasePrice;
                                          break;
                                      }
                                    
                                      return (
                                        <div key={step.id} className="flex justify-between items-center p-2 bg-white border border-gray-100 rounded">
                                          <div>
                                            <span className="text-sm font-medium">{process.name}</span>
                                            <span className="ml-2 text-xs text-gray-600">
                                              ({processBasePrice.toFixed(2)} €/{priceUnit})
                                            </span>
                                            {process.thicknessPrices && process.thicknessPrices.length > 0 && inventoryItem?.type === 'glass' && (
                                              <span className="ml-1 text-xs text-purple-600">
                                                (za {inventoryItem.glassThickness}mm)
                                              </span>
                                            )}
                                          </div>
                                          {processItemPrice > 0 && (
                                            <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded-full">
                                              {processItemPrice.toFixed(2)} €
                                            </span>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                
                                  {/* Napomene za procese */}
                                  {material.processSteps.some(step => step.notes) && (
                                    <div className="mt-2 p-2 bg-yellow-50 rounded border border-yellow-200">
                                      <h6 className="text-xs font-medium text-yellow-800 mb-1">Napomene za procese:</h6>
                                      <div className="space-y-1">
                                        {material.processSteps.filter(step => step.notes).map(step => {
                                          const process = processes.find(p => p.id === step.processId);
                                          return (
                                            <div key={`note-${step.id}`} className="text-xs">
                                              <span className="font-medium">{process?.name || 'Proces'}:</span> {step.notes}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="mt-2">
                                  <h5 className="text-xs font-medium text-gray-700 mb-2">Procesi za materijal #{materialIndex + 1}:</h5>
                                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-center">
                                    <p className="text-xs text-gray-500">Nema dodanih procesa</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      
                        {/* Ukupna cijena procesa */}
                        {processPrice > 0 && (
                          <div className="p-3 bg-purple-100 border border-purple-200 rounded-lg">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-purple-800">Ukupna cijena procesa:</span>
                              <span className="text-sm font-bold text-purple-800">{processPrice.toLocaleString('hr-HR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</span>
                            </div>
                            <p className="text-xs text-purple-700 mt-1">
                              Ova cijena uključuje sve odabrane procese i dodana je na osnovnu cijenu proizvoda.
                            </p>
                          </div>
                        )}
                      
                        {/* Ukupna cijena s procesima */}
                        <div className="p-3 bg-green-100 border border-green-200 rounded-lg">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-green-800">UKUPNA CIJENA SA SVIM PROCESIMA:</span>
                            <span className="text-sm font-bold text-green-800">{(item.totalPrice + processPrice).toLocaleString('hr-HR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Item Notes */}
                {item.isService && services.find(s => s.id === item.serviceId)?.description && (
                  <div className="p-3 bg-purple-50 rounded-lg border border-purple-200 mb-4">
                    <h4 className="text-sm font-medium text-purple-900 mb-1">Opis usluge:</h4>
                    <p className="text-sm text-purple-700">{services.find(s => s.id === item.serviceId)?.description}</p>
                  </div>
                )}
                
                {item.notes && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-900 mb-1">Napomene stavke:</h4>
                    <p className="text-sm text-gray-700">{item.notes}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
      </div>

      {/* Quote Notes */}
      {quote.notes && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Napomene ponude</h2>
          <p className="text-gray-700">{quote.notes}</p>
        </div>
      )}

      {/* Payment Information */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Podaci za plaćanje</h2>
        
        {primaryPayment ? (
          <>
            {/* Zajednički podaci za plaćanje */}
            <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p><span className="font-medium">Primatelj:</span> {primaryPayment.companyName}</p>
                  <p><span className="font-medium">Model:</span> {primaryPayment.model || 'HR00'}</p>
                  <p><span className="font-medium">Poziv na broj:</span> {primaryPayment.reference || quote.quoteNumber}</p>
                  <p><span className="font-medium">Šifra namjene:</span> {primaryPayment.purposeCode || 'OTHR'}</p>
                  <p><span className="font-medium">Opis plaćanja:</span> {primaryPayment.description || `Plaćanje po ponudi ${quote.quoteNumber}`}</p>
                  <p className="font-bold text-purple-700">
                    <span className="font-medium text-gray-900">Iznos:</span> {quote.grandTotal.toLocaleString('hr-HR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                  </p>
                </div>
                
                {/* QR kod za plaćanje */}
                <div className="flex flex-col items-center justify-center">
                  <PaymentPDF417
                    payment={primaryPayment}
                    amount={quote.grandTotal}
                    quoteNumber={quote.quoteNumber}
                    width={220}
                  />
                </div>
              </div>
            </div>
            
            {/* Lista bankovnih računa */}
            {normalizedPaymentInfo.length > 0 && (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="px-4 py-2 bg-gray-50 text-xs text-gray-600">
                  Uplatu možete izvršiti na bilo koji od navedenih računa. Primarni račun je označen.
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">Banka</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-500">IBAN</th>
                      {normalizedPaymentInfo.some(info => info.swift) && (
                        <th className="px-4 py-2 text-left font-medium text-gray-500">SWIFT/BIC</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {normalizedPaymentInfo.map((info, index) => (
                      <tr key={index} className={info.iban === primaryPayment?.iban ? 'bg-purple-50' : ''}>
                        <td className="px-4 py-3">
                          <div className="font-medium">{info.bankName}</div>
                          {info.iban === primaryPayment?.iban && <div className="text-xs text-purple-700">Primarni račun</div>}
                        </td>
                        <td className="px-4 py-3 font-mono tracking-wider">{formatIban(info.iban)}</td>
                        {normalizedPaymentInfo.some(info => info.swift) && (
                          <td className="px-4 py-3 font-mono">{info.swift || '-'}</td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-8">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <div className="flex items-center justify-center mb-4">
                <svg className="h-12 w-12 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Podaci za plaćanje nisu dodani</h3>
              <p className="text-gray-600 mb-4">
                Za prikaz bankovnih računa i QR koda potrebno je dodati podatke za plaćanje u profil.
              </p>
              <a
                href="/profile"
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
              >
                Dodaj podatke za plaćanje
              </a>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default QuoteContent;
