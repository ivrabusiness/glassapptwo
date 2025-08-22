/**
 * HTML template za radne naloge
 * Profesionalan template bez emojija, s podacima tvrtke iz baze
 */
export class WorkOrderTemplate {
  static generate(
    order: any,
    client: any,
    products: any[],
    inventory: any[],
    processes: any[],
    user?: any,
    qrCodeDataUrl?: string
  ): string {
    console.log('WorkOrderTemplate.generate called with QR code:', qrCodeDataUrl ? 'YES' : 'NO');
    console.log('QR code preview in template:', qrCodeDataUrl ? qrCodeDataUrl.substring(0, 50) + '...' : 'NONE');
    const currentDate = new Date().toLocaleDateString('hr-HR');
    const currentTime = new Date().toLocaleTimeString('hr-HR', { hour: '2-digit', minute: '2-digit' });
    
    // Izračunaj ukupne vrijednosti
    const totalItems = order.items.length;
    const totalQuantity = order.items.reduce((sum: number, item: any) => sum + item.quantity, 0);
    const totalArea = order.items.reduce((sum: number, item: any) => sum + (item.dimensions.area * item.quantity), 0);
    
    // Podaci tvrtke - prvo iz user metadata, zatim fallback na localStorage
    let companyData;
    try {
      // Prvo koristi podatke iz user metadata
      if (user?.user_metadata?.company) {
        companyData = {
          name: user.user_metadata.company,
          address: user.user_metadata.address || 'Put Čikole 9, 23230 Drniš',
          oib: '88719816339', // Ovo treba doći iz profila
          mb: '05354501', // Ovo treba doći iz profila
          iban: '', // Ovo treba doći iz bankovnih računa
          email: user.email || 'info@vasatvrtka.hr',
          website: user.user_metadata.website || 'www.vasatvrtka.hr',
          phone: user.user_metadata.phone || '+385 22 123 456'
        };
      } else {
        // Fallback - pokušaj naći podatke iz bankovnih računa
        const storedBankAccounts = localStorage.getItem('bank_accounts');
        let primaryBankAccount = null;
        
        if (storedBankAccounts) {
          const bankAccounts = JSON.parse(storedBankAccounts);
          primaryBankAccount = bankAccounts.length > 0 ? bankAccounts[0] : null;
        }
        
        // Ako ima bankovni račun, koristi te podatke
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
          // Fallback - pokušaj naći company settings
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
          // Krajnji fallback
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
      }
    }
    } catch (error) {
      // Fallback u slučaju greške
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
      </style>
      <div class="page-content">
        
        <!-- HEADER -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px;">
          <!-- Lijeva strana: Broj naloga i datum -->
          <div style="flex: 1;">
            <h1 style="font-size: 36px; font-weight: bold; margin: 0; color: #000;">RADNI NALOG</h1>
            <div style="font-size: 16px; margin-top: 8px; font-weight: bold;">
              <div>Broj: ${order.orderNumber}</div>
              <div>Datum: ${new Date(order.createdAt).toLocaleDateString('hr-HR')}</div>
            </div>
          </div>
          
          <!-- Desna strana: QR Kod -->
          <div style="text-align: center; flex-shrink: 0;">
            <div style="display: inline-block; padding: 5px; border: 3px solid #000; background: white; border-radius: 5px;">
              <img id="workorder-qr" src="${qrCodeDataUrl || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjRkZGRkZGIiBzdHJva2U9IiNDQ0NDQ0MiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWRhc2hhcnJheT0iNSA1Ii8+Cjx0ZXh0IHg9IjQwIiB5PSI0MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEwIiBmaWxsPSIjOTk5OTk5Ij5RUjwvdGV4dD4KPHN2Zz4K'}" 
                   style="width: 80px; height: 80px; display: block;" alt="QR Code" />
            </div>
            <div style="font-size: 10px; margin-top: 5px; font-weight: bold;">Broj: ${order.orderNumber}</div>
          </div>
        </div>

        <!-- FIRMA I NARUČITELJ -->
        <div class="no-break" style="margin-bottom: 25px; border: 1px solid #000; padding: 15px;">
          <div style="display: flex; justify-content: space-between;">
            <div>
              <h3 style="font-size: 18px; font-weight: bold; margin: 0; color: #000;">${companyData.name}</h3>
              <div style="font-size: 12px; color: #666; margin-top: 5px;">
                <div>${companyData.address}</div>
                <div>OIB: ${companyData.oib} | MB: ${companyData.mb} | Email: ${companyData.email}</div>
              </div>
            </div>
            <div style="text-align: right;">
              <h3 style="font-size: 18px; font-weight: bold; margin: 0; color: #000;">${client ? client.name : 'N/A'}</h3>
              ${client ? `
              <div style="font-size: 12px; color: #666; margin-top: 5px; text-align: right;">
                <div>${client.address || 'N/A'}</div>
                <div>Tel: ${client.phone || 'N/A'} | Email: ${client.email || 'N/A'}</div>
              </div>
              ` : ''}
            </div>
          </div>
        </div>

        <!-- STAVKE NALOGA -->
        <div style="margin-bottom: 25px;">
          <h3 style="font-size: 14px; font-weight: bold; margin: 0 0 15px 0; color: #000; border-bottom: 2px solid #000; padding-bottom: 5px;">Stavke radnog naloga</h3>
          
          <!-- Tabela -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
            <thead>
              <tr style="background: #f5f5f5;">
                <th style="border: 1px solid #000; padding: 12px; text-align: center; font-size: 15px; font-weight: bold;">R.br.</th>
                <th style="border: 1px solid #000; padding: 12px; text-align: left; font-size: 15px; font-weight: bold;">Proizvod</th>
                <th style="border: 1px solid #000; padding: 12px; text-align: center; font-size: 15px; font-weight: bold;">Količina</th>
                <th style="border: 1px solid #000; padding: 12px; text-align: center; font-size: 15px; font-weight: bold;">Dimenzije</th>
                <th style="border: 1px solid #000; padding: 12px; text-align: center; font-size: 15px; font-weight: bold;">Površina</th>
              </tr>
            </thead>
            <tbody>
              ${order.items.map((item: any, index: number) => {
                const product = products.find((p: any) => p.id === item.productId);
                const productName = item.isService ? item.productName : (product?.name || 'Nepoznat proizvod');
                
                // Prikaz materijala — svaki materijal na svoj red, s #brojem i njegovim procesima ispod
                let materialsBlockHtml = '';
                if (item.materials && item.materials.length > 0) {
                  materialsBlockHtml = item.materials.map((m: any, mi: number) => {
                    const inv = inventory.find((i: any) => i.id === m.inventoryItemId);
                    const name = m.inventoryName || inv?.name || 'Nepoznat materijal';
                    const thickness = inv?.type === 'glass' && inv?.glassThickness ? `${inv.glassThickness} mm` : '';
                    const label = `${name}${thickness ? ' ' + thickness : ''} #${mi + 1}`;
                    const matNotes = m.notes ? `<div style=\"font-size: 13px; color: #333; margin-left: 12px; margin-top: 2px;\">Napomena: ${m.notes}</div>` : '';
                    
                    // Procesi dodijeljeni ovom materijalu
                    let matProcesses = '';
                    if (m.processSteps && m.processSteps.length > 0) {
                      const names = m.processSteps
                        .map((step: any) => {
                          const proc = processes.find((p: any) => p.id === step.processId);
                          return proc ? proc.name : null;
                        })
                        .filter(Boolean);
                      if (names.length > 0) {
                        matProcesses = `
                          <ul style=\"margin: 4px 0 6px 18px; padding: 0;\">
                            ${names.map((n: any) => `<li style=\"font-size: 14px;\">${n}</li>`).join('')}
                          </ul>
                        `;
                      }
                    }
                    
                    return `
                      <div style=\"margin-top: 6px;\">
                        <div style=\"font-size: 16px; font-weight: bold;\">${label}</div>
                        ${matNotes}
                        ${matProcesses}
                      </div>
                    `;
                  }).join('');
                }

                // Ako nema materijala, prikaži procese na razini stavke
                let itemLevelProcessesHtml = '';
                if ((!item.materials || item.materials.length === 0) && item.processSteps && item.processSteps.length > 0) {
                  const processNames = item.processSteps.map((step: any) => {
                    const process = processes.find((p: any) => p.id === step.processId);
                    return process ? process.name : 'Nepoznat proces';
                  }).join(', ');
                  itemLevelProcessesHtml = `<br><small style=\"color: #666; font-size: 16px;\">Procesi: ${processNames}</small>`;
                }

                // Napomena na razini stavke
                const itemNotesHtml = item.notes ? `<br><small style=\"color: #333; font-size: 16px;\">Napomena: ${item.notes}</small>` : '';
                
                return `
                  <tr>
                    <td style="border: 1px solid #000; padding: 12px; text-align: center; font-size: 18px; font-weight: bold;">${index + 1}</td>
                    <td style=\"border: 1px solid #000; padding: 12px; text-align: left; font-size: 18px; font-weight: bold;\">${productName}${itemNotesHtml}${materialsBlockHtml}${itemLevelProcessesHtml}</td>
                    <td style="border: 1px solid #000; padding: 12px; text-align: center; font-size: 18px; font-weight: bold;">${item.quantity}</td>
                    <td style="border: 1px solid #000; padding: 12px; text-align: center; font-size: 18px; font-weight: bold;">${item.dimensions.width} × ${item.dimensions.height} mm</td>
                    <td style="border: 1px solid #000; padding: 12px; text-align: center; font-size: 18px; font-weight: bold;">${(item.dimensions.area * item.quantity).toFixed(4)} m²</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
          
          <!-- Sažetak -->
          <div class="no-break" style="margin-top: 15px; padding: 10px; background: #f5f5f5; border: 1px solid #000;">
            <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: bold;">
              <div>Ukupno stavki: ${totalItems}</div>
              <div>Ukupno komada: ${totalQuantity}</div>
              <div>Ukupna površina: ${totalArea.toFixed(4)} m²</div>
            </div>
          </div>
        </div>

        ${order.notes ? `
        <!-- NAPOMENE -->
        <div class="no-break" style="margin-bottom: 25px; border: 1px solid #000; padding: 15px;">
          <h3 style="font-size: 18px; font-weight: bold; margin: 0 0 15px 0; color: #000;">Napomene:</h3>
          <div style="font-size: 15px; line-height: 1.4;">${order.notes}</div>
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

export default WorkOrderTemplate;

