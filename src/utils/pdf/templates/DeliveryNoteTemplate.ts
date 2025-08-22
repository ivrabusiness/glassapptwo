import { DeliveryNote, WorkOrder, Client, Product } from '../../../types';

/**
 * Generator HTML predloška za otpremnice
 * Koristi se za generiranje HTML-a koji se može printati ili pretvoriti u PDF
 */
class DeliveryNoteTemplate {
  /**
   * Generira HTML za otpremnicu
   */
  static generate(deliveryNote: DeliveryNote, workOrder: WorkOrder, client: Client, products: Product[], user?: any): string {
    const currentDate = new Date().toLocaleDateString('hr-HR');
    const currentTime = new Date().toLocaleTimeString('hr-HR', { hour: '2-digit', minute: '2-digit' });

    // Izračun sažetka
    const totalItems = deliveryNote.items.length;
    const totalQuantity = deliveryNote.items.reduce((sum, item) => sum + item.quantity, 0);
    const totalArea = deliveryNote.items.reduce((sum, item) => sum + item.totalArea, 0);

    // Podaci tvrtke: prioritet user.user_metadata.company -> fallback
    let companyData: any;
    try {
      // 1) Pokušaj iz user metadata
      const metaCompany = user?.user_metadata?.company;
      if (metaCompany && typeof metaCompany === 'object') {
        companyData = {
          name: metaCompany.name || 'Vaša tvrtka',
          address: [metaCompany.address, metaCompany.postalCode, metaCompany.city].filter(Boolean).join(', ').trim(),
          oib: metaCompany.oib || '',
          mb: metaCompany.mb || '',
          iban: metaCompany.iban || '',
          email: metaCompany.email || '',
          website: metaCompany.website || '',
          phone: metaCompany.phone || ''
        };
      } else if (typeof metaCompany === 'string') {
        // WorkOrderTemplate koristi string za company; koristi ostala polja iz user_metadata
        companyData = {
          name: metaCompany || 'Vaša tvrtka',
          address: [user?.user_metadata?.address, user?.user_metadata?.postalCode, user?.user_metadata?.city].filter(Boolean).join(', ').trim(),
          oib: user?.user_metadata?.oib || '',
          mb: user?.user_metadata?.mb || '',
          iban: user?.user_metadata?.iban || '',
          email: user?.user_metadata?.email || user?.email || '',
          website: user?.user_metadata?.website || '',
          phone: user?.user_metadata?.phone || ''
        };
      }

      // 2) Fallback na generičke podatke ako nema u user metadata
      if (!companyData) {
        companyData = {
          name: 'Vaša tvrtka',
          address: '',
          oib: '',
          mb: '',
          iban: '',
          email: '',
          website: '',
          phone: ''
        };
      }
    } catch (e) {
      companyData = {
        name: 'Vaša tvrtka',
        address: '',
        oib: '',
        mb: '',
        iban: '',
        email: '',
        website: '',
        phone: ''
      };
    }

    // Odredi broj ponude: deliveryNote.quoteNumber -> workOrder.quoteNumber -> localStorage lookup po quoteId
    let resolvedQuoteNumber: string | null = null;
    try {
      const dnAny = deliveryNote as any;
      const woAny = workOrder as any;
      resolvedQuoteNumber = dnAny?.quoteNumber || woAny?.quoteNumber || null;
      if (!resolvedQuoteNumber) {
        const quotesRaw = localStorage.getItem('quotes');
        if (quotesRaw) {
          const quotes = JSON.parse(quotesRaw);
          const q = quotes.find((q: any) => q.id === dnAny?.quoteId || q.id === woAny?.quoteId);
          if (q?.quoteNumber) resolvedQuoteNumber = q.quoteNumber;
        }
      }
    } catch {}

    return `
      <style>
        @media print {
          body { margin: 0; padding: 0; }
          .page-content { 
            width: 210mm;
            margin: 0;
            padding: 20mm 20mm 60px 20mm; /* bottom padding za footer */
            font-family: Arial, sans-serif;
            font-size: 11px;
            line-height: 1.4;
            color: #000;
            background: white;
          }
          .footer-area { 
            position: fixed;
            bottom: 20mm;
            left: 20mm;
            right: 20mm;
            text-align: center;
            font-size: 12px;
            font-weight: bold;
            color: #666;
            border-top: 1px solid #ccc;
            padding-top: 10px;
            background: white;
          }
          .no-break { page-break-inside: avoid; }
        }
        .page-content { 
          width: 210mm;
          margin: 0;
          padding: 20mm 20mm 60px 20mm;
          font-family: Arial, sans-serif;
          font-size: 12px;
          line-height: 1.5;
          color: #000;
          background: white;
        }
        .footer-area { 
          position: fixed;
          bottom: 20mm;
          left: 20mm;
          right: 20mm;
          text-align: center;
          font-size: 9px;
          color: #666;
          border-top: 1px solid #ccc;
          padding-top: 10px;
          background: white;
        }
      </style>
      <div class="page-content">
        <!-- HEADER -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px;">
          <!-- Lijeva strana: Otpremnica broj i datum -->
          <div style="flex: 1;">
            <h1 style="font-size: 24px; font-weight: bold; margin: 0; color: #000;">OTPREMNICA</h1>
            <div style="font-size: 12px; margin-top: 8px; font-weight: bold;">
              <div>Broj otpremnice: ${deliveryNote.deliveryNumber}</div>
              <div>Radni nalog: ${workOrder.orderNumber}</div>
              ${resolvedQuoteNumber ? `<div>Broj ponude: ${resolvedQuoteNumber}</div>` : ''}
              <div>Datum: ${currentDate}</div>
            </div>
          </div>
        </div>

        <!-- KLIJENT I PODACI O OTPREMI -->
        <div class="no-break" style="margin-bottom: 25px; border: 1px solid #000; padding: 15px;">
          <div style="display: flex; justify-content: space-between;">
            <div>
              <h3 style="font-size: 14px; font-weight: bold; margin: 0; color: #000;">${companyData.name}</h3>
              <div style="font-size: 12px; color: #666; margin-top: 5px;">
                ${companyData.address ? `<div>${companyData.address}</div>` : ''}
                ${(companyData.oib || companyData.mb) ? `<div>OIB: ${companyData.oib || ''}${companyData.mb ? ' | MB: ' + companyData.mb : ''}</div>` : ''}
                ${(companyData.email || companyData.phone) ? `<div>${companyData.email || ''}${companyData.phone ? ' | ' + companyData.phone : ''}</div>` : ''}
                ${companyData.website ? `<div>Web: ${companyData.website}</div>` : ''}
                ${companyData.iban ? `<div>IBAN: ${companyData.iban}</div>` : ''}
              </div>
            </div>
            <div style="text-align: right;">
              <h3 style="font-size: 14px; font-weight: bold; margin: 0; color: #000;">Kupac / Preuzima</h3>
              <div style="font-size: 12px; color: #666; margin-top: 5px; text-align: right;">
                <div>${client ? client.name : 'N/A'}</div>
                ${client?.address ? `<div>${client.address}</div>` : ''}
                ${client?.phone || client?.email ? `<div>Tel: ${client?.phone || 'N/A'}${client?.email ? ' | Email: ' + client.email : ''}</div>` : ''}
                ${client?.oib ? `<div>OIB: ${client.oib}</div>` : ''}
              </div>
            </div>
          </div>
        </div>

        <!-- STAVKE OTPREMNICE -->
        <div style="margin-bottom: 25px;">
          <h3 style="font-size: 14px; font-weight: bold; margin: 0 0 15px 0; color: #000; border-bottom: 2px solid #000; padding-bottom: 5px;">Stavke za otpremu</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
            <thead>
              <tr style="background: #f5f5f5;">
                <th style="border: 1px solid #000; padding: 10px; text-align: center; font-size: 12px; font-weight: bold;">R.br.</th>
                <th style="border: 1px solid #000; padding: 10px; text-align: left; font-size: 12px; font-weight: bold;">Proizvod</th>
                <th style="border: 1px solid #000; padding: 10px; text-align: center; font-size: 12px; font-weight: bold;">Količina</th>
                <th style="border: 1px solid #000; padding: 10px; text-align: center; font-size: 12px; font-weight: bold;">Dimenzije</th>
                <th style="border: 1px solid #000; padding: 10px; text-align: center; font-size: 12px; font-weight: bold;">Površina</th>
                <th style="border: 1px solid #000; padding: 10px; text-align: left; font-size: 12px; font-weight: bold;">Napomena</th>
              </tr>
            </thead>
            <tbody>
              ${deliveryNote.items.map((item, index) => {
                const product = products.find(p => p.id === item.productId);
                const productName = item.productName || product?.name || 'Nepoznat proizvod';
                return `
                  <tr>
                    <td style="border: 1px solid #000; padding: 10px; text-align: center; font-size: 12px; font-weight: bold;">${index + 1}</td>
                    <td style="border: 1px solid #000; padding: 10px; text-align: left; font-size: 12px; font-weight: bold;">
                      ${productName}
                      ${item.productCode ? `<br><small style=\"color: #666; font-size: 11px; font-weight: normal;\">Kod: ${item.productCode}</small>` : ''}
                    </td>
                    <td style="border: 1px solid #000; padding: 10px; text-align: center; font-size: 12px; font-weight: bold;">${item.quantity}</td>
                    <td style="border: 1px solid #000; padding: 10px; text-align: center; font-size: 12px; font-weight: bold;">${item.dimensions.width} × ${item.dimensions.height} mm</td>
                    <td style="border: 1px solid #000; padding: 10px; text-align: center; font-size: 12px; font-weight: bold;">${item.totalArea.toFixed(4)} m²</td>
                    <td style="border: 1px solid #000; padding: 10px; text-align: left; font-size: 12px;">${item.notes || '-'}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>

          <!-- Sažetak -->
          <div class="no-break" style="margin-top: 15px; padding: 10px; background: #f5f5f5; border: 1px solid #000;">
            <div style="display: flex; justify-content: space-between; font-size: 12px; font-weight: bold;">
              <div>Ukupno stavki: ${totalItems}</div>
              <div>Ukupno komada: ${totalQuantity}</div>
              <div>Ukupna površina: ${totalArea.toFixed(4)} m²</div>
            </div>
          </div>
        </div>

        ${workOrder.notes || deliveryNote.notes ? `
        <!-- NAPOMENE -->
        <div class="no-break" style="margin-bottom: 25px; border: 1px solid #000; padding: 15px;">
          <h3 style="font-size: 14px; font-weight: bold; margin: 0 0 15px 0; color: #000;">Napomene:</h3>
          ${workOrder.notes ? `<div style=\"font-size: 12px; line-height: 1.4; margin-bottom: 6px;\"><strong>Nalog:</strong> ${workOrder.notes}</div>` : ''}
          ${deliveryNote.notes ? `<div style=\"font-size: 12px; line-height: 1.4;\"><strong>Otpremnica:</strong> ${deliveryNote.notes}</div>` : ''}
        </div>
        ` : ''}

        <!-- POTPISI -->
        <div class="no-break" style="margin-top: 10px; display: flex; justify-content: space-between; gap: 20px;">
          <div style="flex: 1;">
            <div style="border-bottom: 1px solid #000; height: 40px;"></div>
            <div style="font-size: 12px; color: #666; text-align: center; margin-top: 6px;">Robu predao (ime, prezime i potpis)</div>
          </div>
          <div style="flex: 1;">
            <div style="border-bottom: 1px solid #000; height: 40px;"></div>
            <div style="font-size: 12px; color: #666; text-align: center; margin-top: 6px;">Robu primio (ime, prezime i potpis)</div>
          </div>
        </div>
      </div>

      <!-- FOOTER -->
      <div class="footer-area">
        <div>Generirano: ${currentDate} ${currentTime} | Glass Management System</div>
        <div style="margin-top: 3px;">${companyData.name} | ${companyData.email} | ${companyData.phone} | ${companyData.website}</div>
        <div style="margin-top: 5px; font-size: 11px; color: #999; font-weight: normal;">erpglass.com - sustavi za upravljanje proizvodnjom</div>
      </div>
    `;
  }
}

export default DeliveryNoteTemplate;
