import { Quote, Client, QuoteItem, Product, Process, InventoryItem } from '../../../types';
import { calculateProcessPrice } from '../../processUtils';

/**
 * Template za generiranje HTML sadržaja za ispis ponude
 */
export class QuoteTemplate {
  static generate(
    quote: Quote,
    client: Client | null,
    products: Product[],
    processes: Process[],
    _inventory: InventoryItem[],
    user?: any,
    workOrder?: any,
    deliveryNote?: any,
    qrCodeDataUrl?: string
  ): string {
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('hr-HR', {
        style: 'currency',
        currency: 'EUR'
      }).format(amount);
    };

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('hr-HR');
    };

    const formatIban = (iban: string) => {
      if (!iban) return '';
      return iban.replace(/\s+/g, '').replace(/(.{4})/g, '$1 ').trim();
    };

    const getProductName = (productId: string) => {
      const product = products.find(p => p.id === productId);
      return product ? product.name : 'Nepoznat proizvod';
    };

    const currentDate = new Date().toLocaleDateString('hr-HR');
    const currentTime = new Date().toLocaleTimeString('hr-HR', { hour: '2-digit', minute: '2-digit' });

    // Podaci tvrtke: prioritet user.user_metadata.company -> fallback na localStorage -> generički
    let companyData: any;
    try {
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

      if (!companyData) {
        const storedBankAccounts = localStorage.getItem('bank_accounts');
        let primaryBankAccount = null as any;
        if (storedBankAccounts) {
          const bankAccounts = JSON.parse(storedBankAccounts);
          primaryBankAccount = bankAccounts.length > 0 ? bankAccounts[0] : null;
        }
        if (primaryBankAccount) {
          companyData = {
            name: primaryBankAccount.accountName || 'Vaša tvrtka',
            address: 'Put Čikole 9, 23230 Drniš',
            oib: '88719816339',
            mb: '05354501',
            iban: primaryBankAccount.iban || '',
            email: 'info@vasatvrtka.hr',
            website: 'www.vasatvrtka.hr',
            phone: '+385 22 123 456'
          };
        } else {
          const storedCompany = localStorage.getItem('company_settings');
          if (storedCompany) {
            const company = JSON.parse(storedCompany);
            companyData = {
              name: company.name || 'Vaša tvrtka',
              address: `${company.address || ''}, ${company.postalCode || ''} ${company.city || ''}`.trim(),
              oib: company.oib || '',
              mb: company.mb || '',
              iban: company.iban || '',
              email: company.email || '',
              website: company.website || '',
              phone: company.phone || ''
            };
          } else {
            companyData = { name: 'Vaša tvrtka', address: '', oib: '', mb: '', iban: '', email: '', website: '', phone: '' };
          }
        }
      }
    } catch (_e) {
      companyData = { name: 'Vaša tvrtka', address: '', oib: '', mb: '', iban: '', email: '', website: '', phone: '' };
    }

    // Normaliziraj payment info na array
    const paymentInfos = Array.isArray(quote.paymentInfo) ? quote.paymentInfo as any[] : (quote.paymentInfo ? [quote.paymentInfo] : []);

    const primaryPayment = paymentInfos[0] || null;
    const additionalPayments = paymentInfos.length > 1 ? paymentInfos.slice(1) : [];

    const renderItems = () => {
      return quote.items.map((item: QuoteItem, index: number) => {
        const productName = item.isService ? (item.productName || 'Usluga') : getProductName(item.productId);

        // Grupiiraj procese kao pod-retke s ukupnom cijenom po procesu
        const processMap: Record<string, { name: string; total: number }> = {};
        if (item.materials && item.materials.length > 0) {
          item.materials.forEach((material: any) => {
            const inv = _inventory.find((iv: InventoryItem) => iv.id === material.inventoryItemId) as any;
            const thickness = inv?.type === 'glass' ? inv.glassThickness : undefined;
            (material.processSteps || []).forEach((step: any) => {
              const proc = processes.find((p: Process) => p.id === step.processId);
              if (!proc) return;
              const base = calculateProcessPrice(proc as any, thickness as any);
              let price = 0;
              switch (proc.priceType) {
                case 'square_meter':
                  price = base * (item.dimensions.area || 0) * (item.quantity || 0);
                  break;
                case 'linear_meter': {
                  const perimeter = 2 * ((item.dimensions.width || 0) + (item.dimensions.height || 0)) / 1000; // mm -> m
                  price = base * perimeter * (item.quantity || 0);
                  break;
                }
                case 'piece':
                  price = base * (item.quantity || 0);
                  break;
                case 'hour':
                  price = base;
                  break;
                default:
                  price = base;
              }
              if (!processMap[proc.id]) processMap[proc.id] = { name: proc.name, total: 0 };
              processMap[proc.id].total += price;
            });
          });
        }

        const processRows = Object.values(processMap).map(p => `
          <tr>
            <td class="text-center" style="color:#666;font-size:12px;">${index + 1}</td>
            <td style="font-size:12px;">— Proces: ${p.name}</td>
            <td class="text-center" style="color:#666;font-size:12px;">-</td>
            <td class="text-center" style="color:#666;font-size:12px;">-</td>
            <td class="text-right" style="color:#666;font-size:12px;">-</td>
            <td class="text-right" style="font-size:12px;">${formatCurrency(p.total)}</td>
          </tr>
        `).join('');

        return `
          <tr>
            <td class="text-center" style="font-size: 13px; font-weight: 600;">${index + 1}</td>
            <td style="font-size: 13px;">
              <div style="font-weight: 600;">${productName}</div>
              ${item.productCode ? `<div style=\"font-size: 12px; color: #666;\">Kod: ${item.productCode}</div>` : ''}
              ${item.notes ? `<div style=\"font-size: 12px; color: #666; margin-top: 4px;\">${item.notes}</div>` : ''}
            </td>
            <td class="text-center" style="font-size: 13px;">${item.quantity}</td>
            <td class="text-center" style="font-size: 13px;">${!item.isService ? `${item.dimensions.width} × ${item.dimensions.height} mm` : '-'}</td>
            <td class="text-right" style="font-size: 13px;">${formatCurrency(item.unitPrice)}</td>
            <td class="text-right" style="font-size: 13px;">${formatCurrency(item.totalPrice)}</td>
          </tr>
          ${processRows}
        `;
      }).join('');
    };

    return `
      <style>
        @media print {
          body { margin: 0; padding: 0; }
          .page-content { 
            width: 210mm;
            margin: 0;
            padding: 20mm 20mm 60px 20mm; /* prostor za footer */
            font-family: Arial, sans-serif;
            font-size: 11px;
            line-height: 1.4;
            color: #000;
            background: white;
          }
          .no-break { page-break-inside: avoid; }
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
        }
        .page-content { 
          width: 210mm;
          margin: 0;
          padding: 20mm 20mm 60px 20mm;
          font-family: Arial, sans-serif;
          font-size: 13px;
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
        /* Jednostavna tabela bez teških bordera */
        .quote-table { width: 100%; border-collapse: collapse; }
        .quote-table th { text-align: left; font-size: 13px; font-weight: 600; padding: 8px 6px; border-bottom: 1px solid #bbb; }
        .quote-table td { padding: 8px 6px; font-size: 12px; border-bottom: 1px solid #eee; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        /* Payment section - minimal corporate */
        .payment-card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 4mm 4mm 6mm 4mm; background: #fff; margin-bottom: 6mm; }
        .payment-header { font-size: 13px; font-weight: 700; margin: 0 0 6px 0; color: #000; }
        .payment-note { font-size: 11px; color: #555; margin: 0 0 6px 0; }
        .payment-content { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; }
        .payment-details { flex: 1; font-size: 11px; color: #111; }
        .payment-details .iban { font-size: 14px; font-weight: 700; letter-spacing: 0.5px; margin: 4px 0; }
        .payment-meta { color: #555; font-size: 11px; line-height: 1.5; }
        .kv { display: grid; grid-template-columns: 90px 1fr; column-gap: 8px; row-gap: 2px; }
        .kv .k { color: #555; }
        .kv .v { color: #111; }
        .divider { border-top: 1px solid #eee; margin: 6px 0; }
        .qr-box { width: 200px; height: 70px; border: 1px dashed #e5e7eb; display: flex; align-items: center; justify-content: center; border-radius: 6px; }
        .qr-box img { width: 100%; height: 100%; object-fit: contain; }
        .additional-accounts { margin-top: 6px; color: #555; font-size: 10px; }
        .payment-footer-note { margin-top: 4px; font-size: 10px; color: #666; }
      </style>
      <div class="page-content">
        <!-- HEADER: PONUDA + linije s brojevima, kao na otpremnici -->
        <div style="margin-bottom: 14px;">
          <h1 style="font-size: 28px; font-weight: bold; margin: 0; color: #000;">PONUDA</h1>
          <div style="font-size: 14px; margin-top: 6px; line-height: 1.5;">
            <div><strong>Broj ponude:</strong> ${quote.quoteNumber}</div>
            ${workOrder?.orderNumber ? `<div><strong>Radni nalog:</strong> ${workOrder.orderNumber}</div>` : ''}
            ${deliveryNote?.deliveryNumber ? `<div><strong>Broj otpremnice:</strong> ${deliveryNote.deliveryNumber}</div>` : ''}
            <div><strong>Datum:</strong> ${formatDate(quote.createdAt)}</div>
          </div>
        </div>

        <!-- Okvir s podacima tvrtke i kupca/preuzima -->
        <div style="border: 1px solid #000; padding: 14px; margin-bottom: 16px;">
          <div style="display:flex; justify-content: space-between; gap: 16px;">
            <div style="flex:1;">
              <div style="font-weight: bold; font-size: 14px;">${companyData.name}</div>
              <div style="font-size: 12px; color: #555; margin-top: 4px;">
                ${companyData.address ? `<div>${companyData.address}</div>` : ''}
                ${companyData.email ? `<div>${companyData.email}</div>` : ''}
                ${companyData.website ? `<div>Web: ${companyData.website}</div>` : ''}
              </div>
            </div>
            <div style="flex:1; text-align: right;">
              <div style="font-weight: bold; font-size: 14px;">Kupac / Preuzima</div>
              <div style="font-size: 12px; color: #555; margin-top: 4px;">
                ${client ? `
                  <div style=\"font-weight:600; color:#000;\">${client.name || 'Klijent'}</div>
                  ${client.address ? `<div>${client.address}</div>` : ''}
                  ${client.oib ? `<div>OIB: ${client.oib}</div>` : ''}
                ` : '<div>Klijent</div>'}
              </div>
            </div>
          </div>
        </div>

        <!-- KLIJENT I INFO O PONUDI (jednostavno) -->
        <div class="no-break" style="margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-between;">
            <div>
              <h3 style="font-size: 16px; font-weight: bold; margin: 0; color: #000;">Klijent</h3>
              ${client ? `
              <div style=\"font-size: 12px; color: #666; margin-top: 4px;\">
                <div>${client.name}</div>
                <div>${client.address || ''}</div>
                <div>OIB: ${client.oib || ''}</div>
                ${client.phone ? `<div>Tel: ${client.phone}</div>` : ''}
                ${client.email ? `<div>Email: ${client.email}</div>` : ''}
              </div>
              ` : '<div style="font-size: 12px; color: #666; margin-top: 5px;">Podaci o klijentu nisu dostupni</div>'}
            </div>
            <div style="text-align: right;">
              <h3 style="font-size: 16px; font-weight: bold; margin: 0; color: #000;">Informacije</h3>
              <div style="font-size: 12px; color: #666; margin-top: 4px; text-align: right;">
                <div>Datum kreiranja: ${formatDate(quote.createdAt)}</div>
                <div>Vrijedi do: ${formatDate(quote.validUntil)}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- STAVKE PONUDE (jednostavno) -->
        <div style="margin-bottom: 20px;">
          <table class="quote-table">
            <thead>
              <tr>
                <th style="text-align: center; width: 50px;">R.br.</th>
                <th>Opis</th>
                <th style="text-align: center; width: 80px;">Kol.</th>
                <th style="text-align: center; width: 140px;">Dimenzije</th>
                <th style="text-align: right; width: 120px;">Jed. cijena</th>
                <th style="text-align: right; width: 140px;">Ukupno</th>
              </tr>
            </thead>
            <tbody>
              ${renderItems()}
            </tbody>
          </table>
        </div>

        <!-- SAŽETAK (jednostavno) -->
        <div class="no-break" style="margin-top: 10px;">
          <table style="width: 100%; border-collapse: collapse; max-width: 380px; margin-left: auto;">
            <tbody>
              <tr>
                <td style="padding:6px;text-align:right;">Proizvodi:</td>
                <td style="padding:6px;text-align:right;font-weight:600;">${formatCurrency(quote.productAmount || 0)}</td>
              </tr>
              <tr>
                <td style="padding:6px;text-align:right;">Procesi:</td>
                <td style="padding:6px;text-align:right;font-weight:600;">${formatCurrency(quote.processAmount || 0)}</td>
              </tr>
              <tr>
                <td style="padding:6px;text-align:right;">Ukupno bez PDV-a:</td>
                <td style="padding:6px;text-align:right;font-weight:600;">${formatCurrency(quote.totalAmount)}</td>
              </tr>
              <tr>
                <td style="padding:6px;text-align:right;">PDV (${quote.vatRate}%):</td>
                <td style="padding:6px;text-align:right;font-weight:600;">${formatCurrency(quote.vatAmount)}</td>
              </tr>
              <tr>
                <td style="padding:8px;text-align:right;font-weight:bold;border-top:1px solid #bbb;">UKUPNO:</td>
                <td style="padding:8px;text-align:right;font-weight:bold;border-top:1px solid #bbb;">${formatCurrency(quote.grandTotal)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- PODACI ZA PLAĆANJE (redizajn + 2D barcode) -->
        ${paymentInfos.length > 0 ? `
          <div class="no-break" style="margin-top: 16px;">
            <div class="payment-card">
              <div class="payment-header">Podaci za plaćanje</div>
              <div class="payment-note">Uplatu možete izvršiti na bilo koji od navedenih računa.</div>
              <div class="payment-content">
                <div class="payment-details">
                  ${primaryPayment?.companyName ? `<div style="font-weight:600; font-size:13px;">${primaryPayment.companyName}</div>` : ''}
                  <div class="iban">${primaryPayment?.iban ? formatIban(primaryPayment.iban) : ''}</div>
                  <div class="payment-meta">
                    ${primaryPayment?.bankName ? `<div>Banka: ${primaryPayment.bankName}${primaryPayment.swift ? `, SWIFT: ${primaryPayment.swift}` : ''}</div>` : (primaryPayment?.swift ? `<div>SWIFT: ${primaryPayment.swift}</div>` : '')}
                    ${(primaryPayment?.model || primaryPayment?.reference) ? `<div>Model/poziv: ${primaryPayment.model || ''}${primaryPayment?.reference ? ` / ${primaryPayment.reference}` : ''}</div>` : ''}
                    ${quote.grandTotal ? `<div>Iznos: ${formatCurrency(quote.grandTotal)}</div>` : ''}
                    ${primaryPayment?.description ? `<div>Opis: ${primaryPayment.description}</div>` : ''}
                  </div>
                  ${additionalPayments && additionalPayments.length ? `
                    <div class="additional-accounts">
                      <div class="divider"></div>
                      <div style="font-weight:600; margin-bottom:4px;">Dodatni računi</div>
                      ${additionalPayments.map((pi: any) => `
                        <div style="margin-bottom:4px;">
                          ${pi.companyName ? `<div style=\"font-weight:600;\">${pi.companyName}</div>` : ''}
                          ${pi.bankName ? `<div style=\"color:#555;\">Banka: ${pi.bankName}${pi.swift ? `, SWIFT: ${pi.swift}` : ''}</div>` : (pi.swift ? `<div style=\"color:#555;\">SWIFT: ${pi.swift}</div>` : '')}
                          ${pi.iban ? `<div class=\"iban\">${formatIban(pi.iban)}</div>` : ''}
                        </div>
                      `).join('')}
                    </div>
                  ` : ''}
                </div>
                ${qrCodeDataUrl ? `
                  <div class="qr-box">
                    <img src="${qrCodeDataUrl}" alt="PDF417 (HUB3) za plaćanje" data-pdf-overlay="true" id="quote-payment-barcode" />
                  </div>
                ` : ''}
              </div>
              ${quote.quoteNumber ? `<div class="payment-footer-note">Molimo u pozivu na broj navesti broj ponude: <strong>${quote.quoteNumber}</strong>.</div>` : ''}
            </div>
          </div>
        ` : ''}

        <!-- Notes -->
        ${quote.notes ? `
          <div style="margin-bottom: 30px;">
            <h3 style="margin: 0 0 15px 0; color: #374151; font-size: 16px;">Napomene</h3>
            <div style="background: #f9fafb; padding: 15px; border-radius: 8px; border-left: 4px solid #6366f1;">
              ${quote.notes.replace(/\n/g, '<br>')}
            </div>
          </div>
        ` : ''}

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

export default QuoteTemplate;
