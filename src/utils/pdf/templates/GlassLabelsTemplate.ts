import { WorkOrder } from '../../../types';

/**
 * Generator HTML predloška za naljepnice stakala
 * Koristi se za generiranje PDF-a s naljepnicama za stakla
 */
class GlassLabelsTemplate {
  /**
   * Generira HTML za naljepnice stakala
   */
  static generate(
    workOrder: WorkOrder, 
    companyName: string = 'Vaša firma', 
    customerName: string = 'Nepoznat kupac',
    products: any[] = []
  ): string {
    
    // Uzimamo sve proizvode iz naloga
    const allItems = workOrder.items?.map(item => {
      // Pronađi proizvod u bazi (ista logika kao u view order)
      const product = products.find((p: any) => p.id === item.productId);
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

    // Generiraj sve naljepnice (po jedna za svaki komad)
    const allLabels: any[] = [];
    allItems.forEach((item: any, itemIndex: number) => {
      for (let i = 0; i < item.quantity; i++) {
        allLabels.push({
          ...item,
          labelNumber: allLabels.length + 1,
          itemIndex,
          pieceNumber: i + 1
        });
      }
    });

    return `
      <!DOCTYPE html>
      <html lang="hr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Naljepnice stakala - ${workOrder.orderNumber}</title>
        <style>
          @page {
            size: 100mm 80mm;
            margin: 0;
          }
          
          body {
            font-family: Arial, Helvetica, sans-serif;
            margin: 0;
            padding: 0;
            background: white;
          }
          
          html, body {
            width: 100mm;
            height: 80mm;
          }
          
          .page-header {
            text-align: center;
            margin-bottom: 10mm;
            padding-bottom: 5mm;
            border-bottom: 2px solid #2563eb;
          }
          
          .page-header h1 {
            font-size: 18pt;
            margin: 0 0 2mm 0;
            color: #2563eb;
          }
          
          .page-header p {
            font-size: 10pt;
            margin: 1mm 0;
            color: #666;
          }
          
          .labels-container {
            display: flex;
            flex-direction: column;
            gap: 0;
            margin: 0;
          }
          
          .label {
            width: 100mm;
            height: 80mm;
            border: none;
            border-radius: 2mm;
            padding: 2mm 2mm 8mm 25mm;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            page-break-inside: avoid;
            page-break-after: always;
            background: white;
            font-size: 9pt;
            line-height: 1.3;
            margin: 0;
            box-sizing: border-box;
          }
          
          /* Zebra printer optimizacija */
          @media print {
            .label {
              page-break-after: always;
              margin: 0;
            }
            
            .page-header {
              display: none;
            }
            
            body {
              margin: 0;
              padding: 0;
              width: 100mm;
              height: 80mm;
            }
            
            .labels-container {
              gap: 0;
              margin: 0;
            }
            /* Ne forsiraj break nakon zadnje naljepnice kako ne bi stampa praznu etiketu */
            .labels-container .label:last-child {
              page-break-after: auto;
            }
          }
          
          .label-header {
            text-align: center;
            border-bottom: 1px solid #ccc;
            padding-bottom: 2mm;
            margin-bottom: 2mm;
          }
          
          .label-header h3 {
            margin: 0;
            font-size: 10pt;
            font-weight: bold;
            color: #000;
          }
          
          .label-header .order-number {
            font-size: 9pt;
            font-weight: bold;
            color: #000;
          }
          
          .label-header .label-count {
            font-size: 9pt;
            font-weight: bold;
            color: #2563eb;
            margin-top: 1mm;
          }
          
          .label-content {
            flex: 1;
            display: flex;
            justify-content: flex-start;
            position: relative;
          }
          
          .label-left {
            flex: 1;
            margin-right: 15mm;
          }
          
          .vertical-branding {
            position: absolute;
            right: 0;
            top: 50%;
            transform: translateY(-50%) rotate(90deg);
            transform-origin: center;
            font-size: 7pt;
            color: #2563eb;
            font-weight: bold;
            white-space: nowrap;
          }
          
          .glass-info {
            margin-bottom: 2mm;
          }
          
          .glass-info .title {
            font-weight: bold;
            font-size: 8pt;
            color: #666;
            margin-bottom: 0.5mm;
          }
          
          .glass-info .value {
            font-size: 9pt;
            font-weight: bold;
            color: #000;
          }
          
          .processes {
            margin-bottom: 2mm;
          }
          
          .processes .title {
            font-weight: bold;
            font-size: 7pt;
            color: #666;
            margin-bottom: 0.5mm;
          }
          
          .process-item {
            font-size: 7pt;
            padding: 0.5mm 1mm;
            background: #f0f9ff;
            border: 1px solid #bfdbfe;
            border-radius: 1mm;
            margin-bottom: 0.5mm;
            display: inline-block;
          }
          
          
          
          .page-break {
            page-break-before: always;
          }
          
          @media print {
            body { -webkit-print-color-adjust: exact; }
            .page-break { page-break-before: always; }
          }
        </style>
      </head>
      <body>
        <div class="labels-container">
          ${allLabels.map((label) => `
            <div class="label">
              <!-- Label Header -->
              <div class="label-header">
                <h3>${companyName}</h3>
                <div class="label-count">${label.quantity > 1 ? `${label.pieceNumber}/${label.quantity}` : `1/1`}</div>
              </div>
              
              <!-- Label Content -->
              <div class="label-content">
                <div class="label-left">
                  <!-- Order Number -->
                  <div class="glass-info">
                    <div class="value">Nalog: ${workOrder.orderNumber}</div>
                  </div>
                  
                  <!-- Purchase Order (Narudžbenica) -->
                  <div class="glass-info">
                    <div class="value">Narudžbenica: ${workOrder.purchaseOrder || '-'}</div>
                  </div>
                  
                  <!-- Product Info -->
                  <div class="glass-info">
                    <div class="title">PROIZVOD:</div>
                    <div class="value">${label.productName || label.material.inventoryName || 'Nepoznat proizvod'}</div>
                  </div>
                  
                  <!-- Dimensions -->
                  <div class="glass-info">
                    <div class="value">Dimenzije: ${label.dimensions.width} x ${label.dimensions.height} mm</div>
                  </div>
                  
                  <!-- Area -->
                  <div class="glass-info">
                    <div class="value">Kvadratura: ${label.dimensions.area.toFixed(4)} m²</div>
                  </div>
                  
                  <!-- Quantity -->
                  <div class="glass-info">
                    <div class="value">Komada: ${label.quantity} kom</div>
                  </div>
                  
                  <!-- Customer Info -->
                  <div class="glass-info">
                    <div class="title">NARUČITELJ:</div>
                    <div class="value">${customerName}</div>
                  </div>
                </div>
                
                <!-- Vertical Branding -->
                <div class="vertical-branding">erpglass.com</div>
              </div>
              
            </div>
          `).join('')}
        </div>
        
        <!-- Auto Print Script -->
        <script>
          window.onload = function() {
            // Fit to page
            document.body.style.zoom = "100%";
            // Automatski print nakon učitavanja
            setTimeout(() => {
              window.print();
            }, 500);
          }
        </script>
      </body>
      </html>
    `;
  }
}

export default GlassLabelsTemplate;

