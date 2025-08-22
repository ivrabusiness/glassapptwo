import { DeliveryNote, WorkOrder, Client, Product } from '../../../types';

class DeliveryNoteTemplateGenerator {
  static generate(deliveryNote: DeliveryNote, workOrder: WorkOrder, client?: Client, products?: Product[]): string {
    const currentDate = new Date().toLocaleDateString('hr-HR');
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Otpremnica ${deliveryNote.deliveryNumber}</title>
        <style>
          @page { 
            margin: 10mm; 
            size: A4; 
          }
          body { 
            font-family: Arial, sans-serif; 
            font-size: 10pt; 
            line-height: 1.3; 
            color: #000;
            margin: 0;
            padding: 0;
          }
          .header { 
            border-bottom: 2px solid #2563eb; 
            padding-bottom: 10px; 
            margin-bottom: 15px; 
          }
          .header h1 { 
            font-size: 24pt; 
            margin: 0 0 5px 0; 
            color: #000;
          }
          .header-info { 
            display: flex; 
            justify-content: space-between; 
            align-items: flex-start;
          }
          .company-info { 
            text-align: right; 
          }
          .company-info h2 { 
            color: #2563eb; 
            margin: 0 0 3px 0; 
            font-size: 16pt;
          }
          .section { 
            margin-bottom: 15px; 
          }
          .section h3 { 
            font-size: 11pt; 
            margin-bottom: 5px; 
            border-bottom: 1px solid #e5e7eb; 
            padding-bottom: 3px;
          }
          .grid { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 15px; 
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 10px 0;
            font-size: 9pt;
          }
          th, td { 
            border: 1px solid #000; 
            padding: 4px; 
            text-align: left;
          }
          th { 
            background-color: #f3f4f6; 
            font-weight: bold;
          }
          .text-center { 
            text-align: center; 
          }
          .text-right { 
            text-align: right; 
          }
          .font-bold { 
            font-weight: bold; 
          }
          .signatures { 
            margin-top: 20px; 
            border-top: 1px solid #e5e7eb; 
            padding-top: 15px;
          }
          .signature-box { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 30px;
          }
          .signature-line { 
            border-bottom: 1px solid #000; 
            height: 25px; 
            margin-bottom: 3px;
          }
          .footer { 
            margin-top: 15px; 
            text-align: center; 
            font-size: 8pt; 
            color: #6b7280;
          }
          .summary-box {
            border: 1px solid #ddd;
            padding: 5px;
            margin-bottom: 10px;
          }
          .summary-title {
            font-weight: bold;
            margin-bottom: 5px;
            border-bottom: 1px solid #eee;
            padding-bottom: 3px;
          }
          .summary-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 3px;
          }
          .summary-value {
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="header-info">
            <div>
              <h1>OTPREMNICA</h1>
              <div>
                <p class="font-bold">Broj: ${deliveryNote.deliveryNumber}</p>
                <p>Datum: ${currentDate}</p>
              </div>
            </div>
            <div class="company-info">
              <h2>TolicApp</h2>
              <p>Sustav za upravljanje proizvodnjom</p>
              <p style="font-size: 8pt;">info@tolicapp.hr | +385 1 234 5678</p>
            </div>
          </div>
        </div>

        <div class="grid">
          <div class="section">
            <h3>KUPAC / PRIMATELJ:</h3>
            <p class="font-bold">${client?.name || 'Nepoznat klijent'}</p>
            <p>${client?.address || ''}</p>
            <p><strong>OIB:</strong> ${client?.oib || ''}</p>
            ${client?.contactPerson ? `<p><strong>Kontakt:</strong> ${client.contactPerson}</p>` : ''}
            ${client?.phone ? `<p><strong>Telefon:</strong> ${client.phone}</p>` : ''}
          </div>
          
          <div class="section">
            <h3>PODACI O OTPREMI:</h3>
            <p><strong>Datum otpreme:</strong> ${currentDate}</p>
            <p><strong>Radni nalog:</strong> ${workOrder.orderNumber}</p>
            <p><strong>Status naloga:</strong> ${
              workOrder.status === 'completed' ? 'Završen' :
              workOrder.status === 'in-progress' ? 'U tijeku' :
              workOrder.status === 'pending' ? 'Na čekanju' : workOrder.status
            }</p>
          </div>
        </div>

        <div class="section">
          <h3>STAVKE ZA OTPREMU:</h3>
          <table>
            <thead>
              <tr>
                <th style="width: 5%;">Rb.</th>
                <th style="width: 30%;">PROIZVOD</th>
                <th style="width: 10%;" class="text-center">KOL.</th>
                <th style="width: 15%;" class="text-center">DIMENZIJE</th>
                <th style="width: 15%;" class="text-center">POVRŠINA</th>
                <th style="width: 25%;">NAPOMENA</th>
              </tr>
            </thead>
            <tbody>
              ${deliveryNote.items.map((item, index) => `
                <tr>
                  <td class="text-center font-bold">${index + 1}</td>
                  <td>
                    <div class="font-bold">${item.productName}</div>
                    ${item.productCode ? `<div style="font-size: 8pt;">Kod: ${item.productCode}</div>` : ''}
                  </td>
                  <td class="text-center font-bold">${item.quantity} kom</td>
                  <td class="text-center">
                    <div class="font-bold">${item.dimensions.width} × ${item.dimensions.height} mm</div>
                    <div style="font-size: 8pt;">${item.dimensions.area.toFixed(4)} m² / kom</div>
                  </td>
                  <td class="text-center font-bold">${item.totalArea.toFixed(4)} m²</td>
                  <td>${item.notes || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="grid">
          <div class="summary-box">
            <div class="summary-title">SAŽETAK OTPREME:</div>
            <div class="summary-row">
              <span>Ukupno stavki:</span>
              <span class="summary-value">${deliveryNote.items.length}</span>
            </div>
            <div class="summary-row">
              <span>Ukupno komada:</span>
              <span class="summary-value">${deliveryNote.items.reduce((total, item) => total + item.quantity, 0)} kom</span>
            </div>
            <div class="summary-row" style="border-top: 1px solid #eee; padding-top: 3px; margin-top: 3px;">
              <span>Ukupna površina:</span>
              <span class="summary-value">${deliveryNote.items.reduce((total, item) => total + item.totalArea, 0).toFixed(4)} m²</span>
            </div>
          </div>
          
          ${(workOrder.notes || deliveryNote.notes) ? `
          <div class="summary-box">
            <div class="summary-title">NAPOMENE:</div>
            ${workOrder.notes ? `<p style="margin: 0 0 3px 0;"><strong>Nalog:</strong> ${workOrder.notes}</p>` : ''}
            ${deliveryNote.notes ? `<p style="margin: 0;"><strong>Otpremnica:</strong> ${deliveryNote.notes}</p>` : ''}
          </div>
          ` : ''}
        </div>

        ${deliveryNote.status === 'delivered' ? `
        <div class="section" style="border: 1px solid #22c55e; padding: 5px; background-color: #f0fdf4;">
          <h3>PODACI O ISPORUCI:</h3>
          ${deliveryNote.deliveredAt ? `<p><strong>Datum isporuke:</strong> ${new Date(deliveryNote.deliveredAt).toLocaleDateString('hr-HR')}</p>` : ''}
          ${deliveryNote.deliveredBy ? `<p><strong>Isporučio:</strong> ${deliveryNote.deliveredBy}</p>` : ''}
          ${deliveryNote.receivedBy ? `<p><strong>Primio:</strong> ${deliveryNote.receivedBy}</p>` : ''}
        </div>
        ` : ''}

        <div class="signatures">
          <div class="signature-box">
            <div>
              <h4 style="margin: 0 0 10px 0;">ROBU PREDAO:</h4>
              <div class="signature-line"></div>
              <p style="text-align: center; font-size: 8pt; margin: 0;">(ime, prezime i potpis)</p>
              <p style="margin: 10px 0 5px 0;"><strong>Datum i vrijeme predaje:</strong></p>
              <div class="signature-line"></div>
            </div>
            
            <div>
              <h4 style="margin: 0 0 10px 0;">ROBU PRIMIO:</h4>
              <div class="signature-line"></div>
              <p style="text-align: center; font-size: 8pt; margin: 0;">(ime, prezime i potpis)</p>
              <p style="margin: 10px 0 5px 0;"><strong>Datum i vrijeme primitka:</strong></p>
              <div class="signature-line"></div>
            </div>
          </div>
        </div>

        <div class="footer">
          <p>Dokument generiran automatski putem TolicApp sustava | ${currentDate}</p>
          <p>TolicApp v1.0 - Sustav za upravljanje proizvodnjom</p>
        </div>
      </body>
      </html>
    `;
  }
}

export default DeliveryNoteTemplateGenerator;
