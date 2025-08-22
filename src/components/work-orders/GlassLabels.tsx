import React, { useState, useEffect } from 'react';
import { X, Printer, Download } from 'lucide-react';
import QRCode from 'qrcode';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { WorkOrder, Client, Product } from '../../types';
import { GlassLabelsTemplate } from '../../utils/pdf/templates';
import { useAuth } from '../../contexts/AuthContext';
import { useSupabaseData } from '../../hooks/useSupabaseData';

interface GlassLabelsProps {
  workOrder: WorkOrder;
  onClose: () => void;
}

interface LabelData {
  orderNumber: string;
  customerName: string;
  companyName: string;
  glassItems: {
    material: any; // Fleksibilniji tip za različite materijale
    processes: string[];
    quantity: number;
    productName?: string;
  }[];
  qrCodeUrl: string;
}

const GlassLabels: React.FC<GlassLabelsProps> = ({ workOrder, onClose }) => {
  const { user } = useAuth();
  const [clients] = useSupabaseData<Client>('clients', []);
  const [products] = useSupabaseData<Product>('products', []);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [labelData, setLabelData] = useState<LabelData | null>(null);
  
  // Pronađi naručitelja
  const client = workOrder?.clientId ? clients.find(c => c.id === workOrder.clientId) : null;

  useEffect(() => {
    const generateLabelData = async () => {
      // Generiraj secure URL za QR kod
      const baseUrl = window.location.origin;
      const secureUrl = `${baseUrl}/work-orders/${workOrder.orderNumber}?auth=required`;
      
      // Generiraj QR kod
      try {
        const qrDataUrl = await QRCode.toDataURL(secureUrl, {
          width: 120,
          margin: 1,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });
        setQrCodeDataUrl(qrDataUrl);
      } catch (error) {
        console.error('Greška pri generiranju QR koda:', error);
      }

      // Pripremi podatke za naljepnice - uzimamo sve proizvode iz naloga
      const allItems = workOrder.items?.map(item => {
        // Pronađi proizvod u bazi (ista logika kao u view order)
        const product = products.find(p => p.id === item.productId);
        const productName = item.isService ? item.productName : (product?.name || 'Nepoznat proizvod');
        
        // Uzimamo prvi materijal ili kreiramo placeholder
        const primaryMaterial = item.materials?.[0] || {
          inventoryName: productName,
          glassThickness: null,
          processSteps: []
        };
        
        return {
          material: primaryMaterial,
          processes: primaryMaterial.processSteps?.map(p => `Proces ${p.processId}`) || [],
          quantity: item.quantity,
          productName: productName,
          dimensions: item.dimensions || { width: 0, height: 0, area: 0 },
          originalItem: item // Čuvamo originalni item za dodatne podatke
        };
      }) || [];

      setLabelData({
        orderNumber: workOrder.orderNumber,
        customerName: client?.name || 'Nepoznat kupac',
        companyName: user?.user_metadata?.company || 'Vaša firma',
        glassItems: allItems,
        qrCodeUrl: secureUrl
      });
    };

    generateLabelData();
  }, [workOrder, user, clients, client, products]);

  const handlePrint = () => {
    if (!qrCodeDataUrl || !labelData) {
      alert('Podaci se još uvijek pripremaju. Molimo pričekajte.');
      return;
    }

    // Generiraj PDF sadržaj
    const printContent = GlassLabelsTemplate.generate(
      workOrder, 
      labelData.companyName, 
      labelData.customerName, 
      products
    );
    
    // Otvori novi prozor za printanje (pokušaj)
    const printWindow = window.open('', '_blank', 'width=800,height=600,noopener');
    
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      
      // Čekaj da se učita i pokreni print
      printWindow.onload = () => {
        try { printWindow.focus(); } catch {}
        printWindow.print();
        // Zatvaramo prozor nakon što korisnik završi s printanjem
        printWindow.onafterprint = () => {
          printWindow.close();
        };
      };
    } else {
      // Popup je vjerojatno blokiran – fallback na skriveni iframe
      try {
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        iframe.style.visibility = 'hidden';
        iframe.onload = () => {
          try { iframe.contentWindow?.focus(); } catch {}
          iframe.contentWindow?.print();
          setTimeout(() => {
            document.body.removeChild(iframe);
          }, 1500);
        };
        // Korištenje srcdoc za direktno postavljanje HTML sadržaja
        (iframe as any).srcdoc = printContent;
        document.body.appendChild(iframe);
      } catch {
        alert('Molimo omogućite popup prozore za ovu stranicu ili pokušajte ponovno.');
      }
    }
  };

  const handleDownload = async () => {
    if (!qrCodeDataUrl || !labelData) {
      alert('Podaci se još uvijek pripremaju. Molimo pričekajte.');
      return;
    }

    try {
      // Generiraj HTML sadržaj
      const htmlContent = GlassLabelsTemplate.generate(
        workOrder, 
        labelData.companyName, 
        labelData.customerName, 
        products
      );
      
      // Otvori novi prozor za renderiranje
      const printWindow = window.open('', '_blank', 'width=1200,height=800');
      
      if (!printWindow) {
        alert('Molimo dozvolite pop-up prozore za preuzimanje PDF-a.');
        return;
      }
      
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // Čekaj da se učita
      await new Promise(resolve => {
        printWindow.onload = resolve;
        setTimeout(resolve, 2000); // Fallback timeout
      });
      
      // Pronađi labels container
      const labelsContainer = printWindow.document.querySelector('.labels-container');
      
      if (!labelsContainer) {
        printWindow.close();
        alert('Greška: Ne mogu pronaći naljepnice za renderiranje.');
        return;
      }
      
      // Generiraj canvas iz labels container-a
      const canvas = await html2canvas(labelsContainer as HTMLElement, {
        scale: 3, // Viša rezolucija za bolju kvalitetu
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: labelsContainer.scrollWidth,
        height: labelsContainer.scrollHeight,
        scrollX: 0,
        scrollY: 0
      });
      
      // Zatvori prozor
      printWindow.close();
      
      // Kreiraj PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Izračunaj dimenzije s marginama
      const pageWidth = 210; // A4 širina u mm
      const pageHeight = 297; // A4 visina u mm
      const margin = 10; // 10mm margina
      const availableWidth = pageWidth - (margin * 2);
      const availableHeight = pageHeight - (margin * 2);
      
      // Izračunaj visinu slike
      const imgWidth = availableWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Dodaj sliku s marginama
      const imgData = canvas.toDataURL('image/png', 1.0);
      
      // Jednostavno dodaj sliku na stranicu
      if (imgHeight <= availableHeight) {
        // Sve stane na jednu stranicu
        pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight);
      } else {
        // Smanji sliku da stane na stranicu
        const scaledHeight = availableHeight;
        const scaledWidth = (canvas.width * scaledHeight) / canvas.height;
        
        if (scaledWidth <= availableWidth) {
          // Centriraj horizontalno
          const xOffset = (availableWidth - scaledWidth) / 2;
          pdf.addImage(imgData, 'PNG', margin + xOffset, margin, scaledWidth, scaledHeight);
        } else {
          // Koristi punu širinu
          pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight);
        }
      }
      
      // Spremi PDF
      pdf.save(`naljepnice-${workOrder.orderNumber}.pdf`);
      
    } catch (error) {
      console.error('Greška pri generiranju PDF-a:', error);
      alert('Greška pri generiranju PDF-a. Molimo pokušajte ponovo.');
    }
  };

  const handleZebraPrint = () => {
    if (!qrCodeDataUrl || !labelData) {
      alert('Podaci se još uvijek pripremaju. Molimo pričekajte.');
      return;
    }

    // Generiraj HTML sadržaj optimiziran za Zebra printer
    const zebraContent = GlassLabelsTemplate.generate(
      workOrder, 
      labelData.companyName, 
      labelData.customerName, 
      products
    );
    
    // Otvori novi prozor optimiziran za Zebra printer
    const zebraWindow = window.open('', '_blank', 'width=400,height=600,scrollbars=yes');
    
    if (zebraWindow) {
      zebraWindow.document.write(zebraContent);
      zebraWindow.document.close();
      
      // Auto print bez instrukcija
      zebraWindow.onload = () => {
      };
    }
  };

  const getTotalLabels = () => {
    return labelData?.glassItems.reduce((total, item) => total + item.quantity, 0) || 0;
  };

  if (!labelData) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6">
          <p>Priprema naljepnica...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Modal Header - samo za screen */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 print:hidden">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Naljepnice proizvoda - {labelData.orderNumber}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Ukupno naljepnica: {getTotalLabels()}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handlePrint}
                disabled={labelData.glassItems.length === 0}
                className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                  labelData.glassItems.length > 0
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                title={labelData.glassItems.length === 0 ? 'Nema proizvoda za printanje' : 'Printaj naljepnice'}
              >
                <Printer className="h-4 w-4 mr-2" />
                Printaj
              </button>
              <button
                onClick={handleDownload}
                disabled={labelData.glassItems.length === 0}
                className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                  labelData.glassItems.length > 0
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                title={labelData.glassItems.length === 0 ? 'Nema proizvoda za preuzimanje' : 'Preuzmi PDF naljepnice'}
              >
                <Download className="h-4 w-4 mr-2" />
                Preuzmi PDF
              </button>
              <button
                onClick={() => handleZebraPrint()}
                disabled={labelData.glassItems.length === 0}
                className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                  labelData.glassItems.length > 0
                    ? 'bg-orange-600 text-white hover:bg-orange-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                title={labelData.glassItems.length === 0 ? 'Nema proizvoda za Zebra printer' : 'Otvori za Zebra printer'}
              >
                <Printer className="h-4 w-4 mr-2" />
                Zebra Printer
              </button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>
          
          <div className="p-6">
            {labelData.glassItems.length > 0 && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">Pregled naljepnica:</h3>
                <div className="text-sm text-blue-800">
                  {labelData.glassItems.map((item, index) => (
                    <div key={index} className="mb-1">
                      <strong>{item.material.inventoryName}</strong> - {item.quantity} kom
                      {item.processes.length > 0 && (
                        <span className="ml-2 text-blue-600">
                          ({item.processes.join(', ')})
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Info o PDF generiranju */}
            {labelData.glassItems.length > 0 ? (
              <div className="border border-gray-300 p-4 bg-blue-50">
                <h4 className="font-medium mb-2 text-blue-800">📝 PDF naljepnice spremne</h4>
                <p className="text-sm text-blue-700 mb-2">
                  Klikom na "Printaj" će se generirati PDF dokument s {getTotalLabels()} naljepnica za proizvode.
                </p>
                <p className="text-xs text-blue-600">
                  PDF će se otvoriti u novom prozoru i automatski pokrenuti print dialog.
                </p>
              </div>
            ) : (
              <div className="border border-gray-300 p-4 bg-yellow-50">
                <h4 className="font-medium mb-2 text-yellow-800">⚠️ Nema proizvoda za naljepnice</h4>
                <p className="text-sm text-yellow-700">
                  Ovaj radni nalog ne sadrži proizvode. Dodajte proizvode u nalog da biste mogli generirati naljepnice.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

    </>
  );
};

export default GlassLabels;

