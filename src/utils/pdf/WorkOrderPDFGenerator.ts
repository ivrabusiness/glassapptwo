import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { WorkOrder, Product, Client, InventoryItem, Process } from '../../types';
import { sanitizeObject, createSafePrintContent } from '../sanitize';

export class WorkOrderPDFGenerator {
  static async generatePDF(
    order: WorkOrder,
    client: Client | null,
    products: Product[],
    inventory: InventoryItem[],
    processes: Process[]
  ): Promise<void> {
    // Create a temporary container for the PDF content
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '794px'; // A4 width in pixels at 96 DPI
    container.style.height = '1123px'; // A4 height in pixels at 96 DPI
    container.style.backgroundColor = 'white';
    container.style.fontFamily = 'Arial, sans-serif';
    container.style.fontSize = '11px';
    container.style.lineHeight = '1.3';
    container.style.color = '#000';
    container.style.padding = '20px';
    container.style.boxSizing = 'border-box';
    container.style.overflow = 'hidden';
    
    // Generate HTML content for PDF with sanitization
    const htmlContent = this.generateCompactHTMLContent(order, client, products, inventory, processes);
    
    // Sanitize all data before setting innerHTML
    const sanitizedData = {
      order: sanitizeObject(order),
      client: client ? sanitizeObject(client) : null,
      products: sanitizeObject(products),
      inventory: sanitizeObject(inventory),
      processes: sanitizeObject(processes)
    };
    
    container.innerHTML = createSafePrintContent(htmlContent, sanitizedData);
    
    // Add to DOM temporarily
    document.body.appendChild(container);
    
    try {
      // Convert HTML to canvas with high quality
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 794,
        height: 1123,
        logging: false
      });
      
      // Create PDF in A4 format
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Calculate dimensions to fit A4
      const imgWidth = 210; // A4 width in mm
      const imgHeight = 297; // A4 height in mm
      
      // Add the image to PDF, fitting exactly to A4
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, imgWidth, imgHeight);
      
      // Save the PDF
      pdf.save(`Radni-nalog-${order.orderNumber}.pdf`);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Greška pri generiranju PDF-a. Molimo pokušajte ponovo.');
    } finally {
      // Remove temporary container
      document.body.removeChild(container);
    }
  }
  
  private static generateCompactHTMLContent(
    order: WorkOrder,
    client: Client | null,
    products: Product[],
    inventory: InventoryItem[],
    processes: Process[]
  ): string {
    const currentDate = new Date().toLocaleDateString('hr-HR');
    const currentTime = new Date().toLocaleTimeString('hr-HR', { hour: '2-digit', minute: '2-digit' });
    
    // Calculate totals
    const totalItems = order.items.length;
    const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0);
    const totalArea = order.items.reduce((sum, item) => sum + (item.dimensions.area * item.quantity), 0);
    
    return `
      <div style="width: 754px; height: 1083px; margin: 0; padding: 0; font-family: Arial, sans-serif; font-size: 10px; line-height: 1.2; color: #000;">
        
        <!-- HEADER -->
        <div style="border-bottom: 3px solid #1f2937; padding-bottom: 8px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <h1 style="font-size: 28px; font-weight: bold; margin: 0 0 4px 0; color: #1f2937;">RADNI NALOG</h1>
            <div style="font-size: 12px; color: #374151;">
              <div style="margin: 2px 0;"><strong>Broj:</strong> <span style="color: #2563eb; font-weight: bold;">${order.orderNumber}</span></div>
              <div style="margin: 2px 0;"><strong>Datum:</strong> ${currentDate}</div>
              <div style="margin: 2px 0;"><strong>Status:</strong> ${this.getStatusText(order.status)}</div>
            </div>
          </div>
          <div style="text-align: right;">
            <div style="background: #2563eb; color: white; padding: 8px 12px; border-radius: 6px; margin-bottom: 6px;">
              <h2 style="font-size: 18px; font-weight: bold; margin: 0;">TolicApp</h2>
              <div style="font-size: 10px; opacity: 0.9;">Upravljanje proizvodnjom</div>
            </div>
            <div style="font-size: 8px; color: #6b7280; line-height: 1.3;">
              <div>info@tolicapp.hr</div>
              <div>+385 1 234 5678</div>
              <div>www.tolicapp.hr</div>
            </div>
          </div>
        </div>

        <!-- KLIJENT I SAŽETAK -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
          ${client ? `
          <div style="border: 1px solid #d1d5db; border-radius: 6px; padding: 8px; background: #f9fafb;">
            <h3 style="font-size: 11px; font-weight: bold; margin: 0 0 6px 0; color: #374151; border-bottom: 1px solid #e5e7eb; padding-bottom: 3px;">
              👤 KLIJENT
            </h3>
            <div style="font-size: 9px; line-height: 1.4;">
              <div style="font-weight: bold; margin-bottom: 2px;">${client.name}</div>
              <div style="margin-bottom: 1px;">${client.address}</div>
              <div style="margin-bottom: 1px;">OIB: ${client.oib}</div>
              ${client.contactPerson ? `<div style="margin-bottom: 1px;">Kontakt: ${client.contactPerson}</div>` : ''}
              ${client.phone ? `<div>Tel: ${client.phone}</div>` : ''}
            </div>
          </div>
          ` : '<div></div>'}
          
          <div style="border: 1px solid #d1d5db; border-radius: 6px; padding: 8px; background: #f0f9ff;">
            <h3 style="font-size: 11px; font-weight: bold; margin: 0 0 6px 0; color: #374151; border-bottom: 1px solid #e5e7eb; padding-bottom: 3px;">
              📊 SAŽETAK NALOGA
            </h3>
            <div style="font-size: 9px; line-height: 1.4;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                <span>Proizvoda:</span>
                <span style="font-weight: bold;">${totalItems}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                <span>Komada:</span>
                <span style="font-weight: bold;">${totalQuantity}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
                <span>Ukupna površina:</span>
                <span style="font-weight: bold; color: #2563eb;">${totalArea.toFixed(2)} m²</span>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span>Kreiran:</span>
                <span style="font-weight: bold;">${new Date(order.createdAt).toLocaleDateString('hr-HR')}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- PROIZVODNI ZADACI -->
        <div style="margin-bottom: 12px;">
          <h3 style="font-size: 12px; font-weight: bold; margin: 0 0 8px 0; color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 4px;">
            🔧 PROIZVODNI ZADACI
          </h3>
          
          <div style="display: grid; gap: 8px;">
            ${order.items.map((item, index) => {
              const product = products.find(p => p.id === item.productId);
              
              return `
                <div style="border: 1px solid #d1d5db; border-radius: 6px; padding: 8px; background: #fafafa;">
                  <!-- Zaglavlje zadatka -->
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; padding-bottom: 4px; border-bottom: 1px solid #e5e7eb;">
                    <div>
                      <span style="background: #2563eb; color: white; padding: 2px 6px; border-radius: 3px; font-size: 8px; font-weight: bold; margin-right: 6px;">${index + 1}</span>
                      <span style="font-size: 11px; font-weight: bold; color: #1f2937;">${item.isService ? item.productName : (product?.name || 'Nepoznat proizvod')}</span>
                    </div>
                    ${item.isService ? 
                      '<span style="background: #ddd6fe; color: #7c3aed; padding: 2px 6px; border-radius: 10px; font-size: 8px; font-weight: bold;">USLUGA</span>' :
                      (product?.code ? `<span style="font-size: 8px; color: #6b7280; background: #f3f4f6; padding: 2px 4px; border-radius: 3px;">${product.code}</span>` : '')
                    }
                  </div>

                  <!-- Osnovni podaci -->
                  <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-bottom: 6px;">
                    <div style="text-align: center; background: white; padding: 4px; border-radius: 3px; border: 1px solid #e5e7eb;">
                      <div style="font-size: 8px; color: #6b7280; margin-bottom: 1px;">KOLIČINA</div>
                      <div style="font-size: 10px; font-weight: bold; color: #1f2937;">${item.quantity} ${item.isService && item.serviceUnit === 'hour' ? 'sati' : 'kom'}</div>
                    </div>
                    ${!item.isService ? `
                    <div style="text-align: center; background: white; padding: 4px; border-radius: 3px; border: 1px solid #e5e7eb;">
                      <div style="font-size: 8px; color: #6b7280; margin-bottom: 1px;">DIMENZIJE</div>
                      <div style="font-size: 10px; font-weight: bold; color: #1f2937;">${item.dimensions.width}×${item.dimensions.height} cm</div>
                    </div>
                    <div style="text-align: center; background: white; padding: 4px; border-radius: 3px; border: 1px solid #e5e7eb;">
                      <div style="font-size: 8px; color: #6b7280; margin-bottom: 1px;">POVRŠINA/KOM</div>
                      <div style="font-size: 10px; font-weight: bold; color: #1f2937;">${item.dimensions.area.toFixed(4)} m²</div>
                    </div>
                    <div style="text-align: center; background: white; padding: 4px; border-radius: 3px; border: 1px solid #e5e7eb;">
                      <div style="font-size: 8px; color: #6b7280; margin-bottom: 1px;">UKUPNO</div>
                      <div style="font-size: 10px; font-weight: bold; color: #2563eb;">${(item.dimensions.area * item.quantity).toFixed(2)} m²</div>
                    </div>
                    ` : '<div></div><div></div><div></div>'}
                  </div>

                  ${!item.isService && item.materials && item.materials.length > 0 ? `
                  <!-- Materijali -->
                  <div style="margin-bottom: 6px;">
                    <h4 style="font-size: 9px; font-weight: bold; margin: 0 0 4px 0; color: #374151;">🧱 POTREBNI MATERIJALI:</h4>
                    <div style="display: grid; gap: 4px;">
                      ${item.materials.map((material, materialIndex) => {
                        const inventoryItem = inventory.find(inv => inv.id === material.inventoryItemId);
                        const usedQuantity = material.quantity * item.quantity * item.dimensions.area;
                        
                        return `
                          <div style="background: white; border: 1px solid #e5e7eb; border-radius: 4px; padding: 4px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">
                              <span style="font-size: 8px; font-weight: bold; color: #374151;">
                                ${inventoryItem?.name || 'Nepoznat materijal'} #${materialIndex + 1}
                                ${inventoryItem?.type === 'glass' && inventoryItem.glassThickness ? 
                                  `<span style="color: #2563eb; margin-left: 2px;">(${inventoryItem.glassThickness}mm)</span>` : ''}
                              </span>
                              <span style="font-size: 8px; font-weight: bold; color: #dc2626; background: #fef2f2; padding: 1px 4px; border-radius: 3px;">
                                ${usedQuantity.toFixed(3)} ${material.unit}
                              </span>
                            </div>
                            
                            ${material.processSteps && material.processSteps.length > 0 ? `
                            <div style="border-top: 1px solid #f3f4f6; padding-top: 3px;">
                              <div style="font-size: 7px; font-weight: bold; margin-bottom: 2px; color: #6b7280;">
                                PROCESI ZA MATERIJAL #${materialIndex + 1}:
                              </div>
                              <div style="display: grid; gap: 2px;">
                                ${material.processSteps.map(step => {
                                  const process = processes.find(p => p.id === step.processId);
                                  return `
                                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 2px 4px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 3px;">
                                      <span style="font-size: 7px; font-weight: bold; color: #374151;">${process?.name || 'Nepoznat proces'}</span>
                                      <div style="width: 10px; height: 10px; border: 1.5px solid #6b7280; border-radius: 2px;"></div>
                                    </div>
                                  `;
                                }).join('')}
                              </div>
                            </div>
                            ` : ''}
                          </div>
                        `;
                      }).join('')}
                    </div>
                  </div>
                  ` : ''}

                  ${item.notes ? `
                  <div style="padding: 4px 6px; background: #fef3c7; border: 1px solid #f59e0b; border-radius: 4px; margin-top: 4px;">
                    <div style="font-size: 8px; font-weight: bold; margin-bottom: 1px; color: #92400e;">📝 NAPOMENE ZADATKA:</div>
                    <div style="font-size: 8px; color: #92400e; line-height: 1.3;">${item.notes}</div>
                  </div>
                  ` : ''}
                </div>
              `;
            }).join('')}
          </div>
        </div>

        ${order.notes ? `
        <!-- NAPOMENE NALOGA -->
        <div style="margin-bottom: 12px; padding: 8px; background: #dbeafe; border: 1px solid #3b82f6; border-radius: 6px;">
          <h4 style="font-size: 11px; font-weight: bold; margin: 0 0 4px 0; color: #1e40af;">📋 NAPOMENE NALOGA:</h4>
          <div style="font-size: 9px; color: #1e40af; line-height: 1.4;">${order.notes}</div>
        </div>
        ` : ''}

        <!-- POTPISI -->
        <div style="margin-top: auto; padding-top: 12px; border-top: 2px solid #374151;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div>
              <h4 style="font-size: 10px; font-weight: bold; margin: 0 0 8px 0; color: #374151;">✅ ZADATAK PREUZEO:</h4>
              <div style="border-bottom: 2px solid #374151; height: 20px; margin-bottom: 3px;"></div>
              <div style="font-size: 7px; color: #6b7280; text-align: center;">(ime, prezime i potpis)</div>
              <div style="margin-top: 8px;">
                <div style="font-size: 8px; font-weight: bold; margin-bottom: 2px; color: #374151;">Datum i vrijeme preuzimanja:</div>
                <div style="border-bottom: 1px solid #6b7280; height: 12px;"></div>
              </div>
            </div>
            
            <div>
              <h4 style="font-size: 10px; font-weight: bold; margin: 0 0 8px 0; color: #374151;">🏁 ZADATAK ZAVRŠIO:</h4>
              <div style="border-bottom: 2px solid #374151; height: 20px; margin-bottom: 3px;"></div>
              <div style="font-size: 7px; color: #6b7280; text-align: center;">(ime, prezime i potpis)</div>
              <div style="margin-top: 8px;">
                <div style="font-size: 8px; font-weight: bold; margin-bottom: 2px; color: #374151;">Datum i vrijeme završetka:</div>
                <div style="border-bottom: 1px solid #6b7280; height: 12px;"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- FOOTER -->
        <div style="position: absolute; bottom: 8px; left: 20px; right: 20px; text-align: center; font-size: 7px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 4px;">
          <div>Generirano: ${currentDate} ${currentTime} | TolicApp v1.0 - Sustav za upravljanje proizvodnjom</div>
          <div style="margin-top: 2px;">TolicApp d.o.o. | info@tolicapp.hr | +385 1 234 5678 | www.tolicapp.hr</div>
        </div>
      </div>
    `;
  }
  
  private static getStatusText(status: string): string {
    switch (status) {
      case 'draft': return 'Nacrt';
      case 'pending': return 'Na čekanju';
      case 'in-progress': return 'U tijeku';
      case 'completed': return 'Završen';
      case 'cancelled': return 'Otkazan';
      default: return status;
    }
  }
}
