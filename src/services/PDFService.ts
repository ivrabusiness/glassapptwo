import jsPDF from 'jspdf';
import { waitForImages, generateCanvasWithRetry } from './Print/PDFUtils';
import { collectOverlayImages, applyOverlayImagesToPdf } from './Print/Overlay';
import { preOpenViewer, pipePdfToPreOpenedViewer, handlePDFOutput } from './Print/Viewer';
import { generateQRCode } from './Print/QRCode';
import { generateHub3Pdf417 } from './Print/PDF417';
import { Quote, WorkOrder, DeliveryNote, Client, Product, Process, InventoryItem } from '../types';
import { 
  QuoteTemplate, 
  WorkOrderTemplate, 
  DeliveryNoteTemplate, 
  GlassLabelsTemplate 
} from '../utils/pdf/templates';

/**
 * Centralizirani PDF servis za sve dokumente
 * Generiše prave PDF-ove i otvara ih u browser PDF viewer-u
 */
export class PDFService {
  
  /**
   * Robusna metoda za generiranje PDF-a s naprednim error handling-om
   */
  private static async generatePDFFromHTML(
    htmlContent: string,
    filename: string,
    openInViewer: boolean = true
  ): Promise<void> {
    let tempDiv: HTMLElement | null = null;
    let prePopup: Window | null = null;
    let overlayDiv: HTMLDivElement | null = null;
    let prevBodyOverflow = '';
    let overlayTimeout: number | null = null;
    let fixedNodes: Array<{ el: HTMLElement; prevPosition: string }> = [];
    
    try {
      console.log('🚀 Starting PDF generation process...');
      
      // Validacija sadržaja
      if (!htmlContent || htmlContent.trim().length === 0) {
        throw new Error('HTML sadržaj je prazan');
      }

      // Kreiraj optimizirani div za renderiranje
      tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      
      // Postavi stilove za optimalno renderiranje
      Object.assign(tempDiv.style, {
        position: 'absolute',
        left: '-9999px',
        top: '0',
        width: '794px',
        height: 'auto',
        minHeight: '1123px',
        background: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontSize: '12px',
        lineHeight: '1.4',
        color: '#000000',
        padding: '0',
        margin: '0',
        boxSizing: 'border-box',
        webkitFontSmoothing: 'antialiased',
        mozOsxFontSmoothing: 'grayscale',
        textRendering: 'optimizeLegibility'
      });
      
      document.body.appendChild(tempDiv);

      // Privremeno neutraliziraj sve elemente s position: fixed unutar tempDiv
      // (sprječava da footer ili drugi fiksni elementi 'iscurе' u glavni UI)
      try {
        const nodes = tempDiv.querySelectorAll('*');
        nodes.forEach((n) => {
          const el = n as HTMLElement;
          const pos = window.getComputedStyle(el).position;
          if (pos === 'fixed') {
            fixedNodes.push({ el, prevPosition: el.style.position });
            el.style.position = 'absolute';
          }
        });
      } catch (e) {
        console.warn('⚠️ Failed to neutralize fixed elements:', e);
      }

      // Prikaži fullscreen overlay samo ako proces traje duže (spriječi "refresh" flicker)
      try {
        overlayTimeout = window.setTimeout(() => {
          try {
            overlayDiv = document.createElement('div');
            overlayDiv.id = 'pdf-loading-overlay';
            Object.assign(overlayDiv.style, {
              position: 'fixed',
              left: '0',
              top: '0',
              width: '100vw',
              height: '100vh',
              background: '#fff',
              zIndex: '2147483647', // max overlay
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'Arial, sans-serif',
              color: '#666',
              fontSize: '14px'
            } as CSSStyleDeclaration);
            overlayDiv.textContent = 'Otvaranje PDF-a...';
            prevBodyOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            document.body.appendChild(overlayDiv);
          } catch (e) {
            console.warn('⚠️ Failed to show loading overlay:', e);
          }
        }, 600);
      } catch (e) {
        console.warn('⚠️ Overlay scheduling failed:', e);
      }

      // Otvori viewer odmah (perceived speed) s minimalističkom loading stranicom
      if (openInViewer) {
        prePopup = preOpenViewer();
      }
      
      // Detektiraj overlay elemente (QR i ostalo) za direktno umetanje u PDF
      const overlayImages = collectOverlayImages(tempDiv);

      // Čekaj da se sve slike učitaju
      await waitForImages(tempDiv);
      
      console.log('📊 Content dimensions:', {
        width: tempDiv.offsetWidth,
        height: tempDiv.offsetHeight,
        scrollHeight: tempDiv.scrollHeight
      });

      // Generiraj canvas s naprednim opcijama
      const canvas = await generateCanvasWithRetry(tempDiv);
      
      // Kreiraj PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });
      
      const imgData = canvas.toDataURL('image/png', 1.0);
      pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);
      
      // Dodaj preklopne (overlay) slike poput QR koda iznad pozadine
      await applyOverlayImagesToPdf(pdf, overlayImages, tempDiv, canvas);
      
      // Otvori ili downloaduj
      if (openInViewer && prePopup) {
        try {
          await pipePdfToPreOpenedViewer(pdf, prePopup);
        } catch (e) {
          console.warn('⚠️ Failed to pipe PDF into pre-opened viewer, using fallback:', e);
          await handlePDFOutput(pdf, filename, true);
        }
      } else {
        await handlePDFOutput(pdf, filename, openInViewer);
      }
      
      console.log('✅ PDF generation completed successfully');
      
    } catch (error) {
      console.error('❌ PDF generation failed:', error);
      throw new Error(`Greška pri generiranju PDF-a: ${error instanceof Error ? error.message : 'Nepoznata greška'}`);
    } finally {
      // Cleanup
      // Vrati originalne position vrijednosti
      if (fixedNodes && fixedNodes.length) {
        try { fixedNodes.forEach(({ el, prevPosition }) => { el.style.position = prevPosition; }); } catch {}
      }
      if (tempDiv && document.body.contains(tempDiv)) {
        document.body.removeChild(tempDiv);
      }
      if (overlayTimeout !== null) {
        try { clearTimeout(overlayTimeout); } catch {}
      }
      if (overlayDiv && document.body.contains(overlayDiv)) {
        document.body.removeChild(overlayDiv);
      }
      if (typeof prevBodyOverflow === 'string') {
        document.body.style.overflow = prevBodyOverflow;
      }
    }
  }
  
  
  
  // ==================== PONUDE ====================
  
  /**
   * Generiraj PDF ponude i otvori u viewer-u
   */
  static async generateQuotePDF(
    quote: Quote,
    client: Client | null,
    products: Product[],
    processes: Process[],
    inventory: InventoryItem[],
    user?: any,
    workOrder?: WorkOrder | null,
    deliveryNote?: DeliveryNote | null
  ): Promise<void> {
    // Generiraj PDF417 (HUB3) ako imamo IBAN; fallback na generički QR
    let qrCodeDataUrl = '';
    try {
      const paymentInfos = Array.isArray(quote.paymentInfo)
        ? (quote.paymentInfo as any[])
        : (quote.paymentInfo ? [quote.paymentInfo] : []);
      const primary = paymentInfos[0];
      if (primary && primary.iban) {
        const description = primary.description || `PONUDA ${quote.quoteNumber}`;
        const payerName = client?.name || '';
        const payerAddress = client?.address || '';
        qrCodeDataUrl = await generateHub3Pdf417({
          amountEur: quote.grandTotal,
          payerName,
          payerAddress,
          receiverName: primary.companyName || 'PRIMATELJ',
          receiverAddress: '',
          receiverCity: '',
          iban: primary.iban,
          model: primary.model,
          reference: primary.reference,
          purposeCode: primary.purposeCode,
          description
        });
      } else {
        qrCodeDataUrl = await generateQRCode(quote.quoteNumber);
      }
    } catch (e) {
      console.warn('⚠️ PDF417 generation error, using generic QR. Error:', e);
      qrCodeDataUrl = await generateQRCode(quote.quoteNumber);
    }
    const htmlContent = QuoteTemplate.generate(
      quote, client, products, processes, inventory, user, workOrder, deliveryNote, qrCodeDataUrl
    );
    
    await this.generatePDFFromHTML(
      htmlContent, 
      `Ponuda-${quote.quoteNumber}.pdf`, 
      true
    );
  }
  
  /**
   * Download PDF ponude direktno
   */
  static async downloadQuotePDF(
    quote: Quote,
    client: Client | null,
    products: Product[],
    processes: Process[],
    inventory: InventoryItem[],
    user?: any,
    workOrder?: WorkOrder | null,
    deliveryNote?: DeliveryNote | null
  ): Promise<void> {
    // Generiraj PDF417 (HUB3) ako imamo IBAN; fallback na generički QR
    let qrCodeDataUrl = '';
    try {
      const paymentInfos = Array.isArray(quote.paymentInfo)
        ? (quote.paymentInfo as any[])
        : (quote.paymentInfo ? [quote.paymentInfo] : []);
      const primary = paymentInfos[0];
      if (primary && primary.iban) {
        const description = primary.description || `PONUDA ${quote.quoteNumber}`;
        const payerName = client?.name || '';
        const payerAddress = client?.address || '';
        qrCodeDataUrl = await generateHub3Pdf417({
          amountEur: quote.grandTotal,
          payerName,
          payerAddress,
          receiverName: primary.companyName || 'PRIMATELJ',
          receiverAddress: '',
          receiverCity: '',
          iban: primary.iban,
          model: primary.model,
          reference: primary.reference,
          purposeCode: primary.purposeCode,
          description
        });
      } else {
        qrCodeDataUrl = await generateQRCode(quote.quoteNumber);
      }
    } catch (e) {
      console.warn('⚠️ PDF417 generation error, using generic QR. Error:', e);
      qrCodeDataUrl = await generateQRCode(quote.quoteNumber);
    }
    const htmlContent = QuoteTemplate.generate(
      quote, client, products, processes, inventory, user, workOrder, deliveryNote, qrCodeDataUrl
    );
    
    await this.generatePDFFromHTML(
      htmlContent, 
      `Ponuda-${quote.quoteNumber}.pdf`, 
      false
    );
  }
  
  // ==================== RADNI NALOZI ====================
  
  /**
   * Generiraj PDF radnog naloga i otvori u viewer-u
   */
  static async generateWorkOrderPDF(
    order: WorkOrder,
    client: Client | null,
    products: Product[],
    inventory: InventoryItem[],
    processes: Process[],
    user?: any
  ): Promise<void> {
    try {
      console.log('Starting Work Order PDF generation for:', order.orderNumber);
      const qrCodeDataUrl = await generateQRCode(order.orderNumber);
      console.log('QR code generated, generating HTML template...');
      
      const htmlContent = WorkOrderTemplate.generate(
        order, client, products, inventory, processes, user, qrCodeDataUrl
      );
      
      console.log('HTML template generated, length:', htmlContent.length);
      console.log('QR code in template:', htmlContent.includes(qrCodeDataUrl) ? 'Found' : 'NOT FOUND');
      console.log('QR code data URL preview:', qrCodeDataUrl.substring(0, 50) + '...');
      
      await this.generatePDFFromHTML(
        htmlContent, 
        `Radni-nalog-${order.orderNumber}.pdf`, 
        true
      );
    } catch (error) {
      console.error('Error in generateWorkOrderPDF:', error);
      throw error;
    }
  }
  
  /**
   * Download PDF radnog naloga direktno
   */
  static async downloadWorkOrderPDF(
    order: WorkOrder,
    client: Client | null,
    products: Product[],
    inventory: InventoryItem[],
    processes: Process[],
    user?: any
  ): Promise<void> {
    const qrCodeDataUrl = await generateQRCode(order.orderNumber);
    const htmlContent = WorkOrderTemplate.generate(
      order, client, products, inventory, processes, user, qrCodeDataUrl
    );
    
    await this.generatePDFFromHTML(
      htmlContent, 
      `Radni-nalog-${order.orderNumber}.pdf`, 
      false
    );
  }
  
  // ==================== OTPREMNICE ====================
  
  /**
   * Generiraj PDF otpremnice i otvori u viewer-u
   */
  static async generateDeliveryNotePDF(
    deliveryNote: DeliveryNote,
    workOrder: WorkOrder,
    client: Client,
    products: Product[],
    user?: any
  ): Promise<void> {
    const htmlContent = DeliveryNoteTemplate.generate(
      deliveryNote, workOrder, client, products, user
    );
    
    await this.generatePDFFromHTML(
      htmlContent, 
      `Otpremnica-${deliveryNote.deliveryNumber}.pdf`, 
      true
    );
  }
  
  /**
   * Download PDF otpremnice direktno
   */
  static async downloadDeliveryNotePDF(
    deliveryNote: DeliveryNote,
    workOrder: WorkOrder,
    client: Client,
    products: Product[],
    user?: any
  ): Promise<void> {
    const htmlContent = DeliveryNoteTemplate.generate(
      deliveryNote, workOrder, client, products, user
    );
    
    await this.generatePDFFromHTML(
      htmlContent, 
      `Otpremnica-${deliveryNote.deliveryNumber}.pdf`, 
      false
    );
  }
  
  // ==================== NALJEPNICE STAKLA ====================
  
  /**
   * Generiraj PDF naljepnica stakla i otvori u viewer-u
   */
  static async generateGlassLabelsPDF(
    workOrder: WorkOrder,
    companyName: string,
    customerName: string,
    products: Product[]
  ): Promise<void> {
    const htmlContent = GlassLabelsTemplate.generate(
      workOrder, companyName, customerName, products
    );
    
    await this.generatePDFFromHTML(
      htmlContent, 
      `Naljepnice-${workOrder.orderNumber}.pdf`, 
      true
    );
  }
  
  /**
   * Download PDF naljepnica stakla direktno
   */
  static async generateGlassLabelsDirectPrint(
    workOrder: WorkOrder,
    companyName: string,
    customerName: string,
    products: Product[]
  ): Promise<void> {
    const htmlContent = GlassLabelsTemplate.generate(
      workOrder, companyName, customerName, products
    );
    
    await this.generatePDFFromHTML(
      htmlContent, 
      `Naljepnice-${workOrder.orderNumber}.pdf`, 
      false
    );
  }
  
  // ==================== UTILITY METODE ====================
  
  /**
   * Provjeri da li browser podržava PDF generiranje
   */
  static isPDFSupported(): boolean {
    return typeof window !== 'undefined' && 
           typeof document !== 'undefined' && 
           'createElement' in document;
  }
}

export default PDFService;
