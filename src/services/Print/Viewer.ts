import jsPDF from 'jspdf';

/**
 * Pre-otvara viewer prozor s minimalističkom loading stranicom
 */
export function preOpenViewer(): Window | null {
  try {
    const prePopup = window.open('', 'PDFViewer', 'width=1000,height=800,scrollbars=yes,resizable=yes,toolbar=yes,menubar=yes');
    if (prePopup) {
      prePopup.document.open();
      prePopup.document.write(`<!DOCTYPE html><html><head><title>Generiranje PDF-a...</title>
        <style>html,body{height:100%;margin:0} .center{display:flex;height:100%;align-items:center;justify-content:center;font-family:Arial,sans-serif;color:#555}</style>
      </head><body><div class="center">Učitavanje PDF-a...</div></body></html>`);
      prePopup.document.close();
      prePopup.focus();
    }
    return prePopup;
  } catch (e) {
    console.warn('⚠️ Pre-open popup failed or blocked:', e);
    return null;
  }
}

/**
 * Pošalji PDF u već otvoreni viewer koristeći Blob URL
 */
export async function pipePdfToPreOpenedViewer(pdf: jsPDF, prePopup: Window): Promise<void> {
  const pdfBlob = pdf.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);
  prePopup.location.href = pdfUrl;
  const cleanupInterval = setInterval(() => {
    try {
      if (prePopup.closed) {
        clearInterval(cleanupInterval);
        URL.revokeObjectURL(pdfUrl);
        console.log('🧹 Cleaned PDF blob URL after pre-open viewer closed');
      }
    } catch {
      // ignore
    }
  }, 2000);
}

/**
 * Rukovanje PDF output-om (viewer ili direktni download)
 */
export async function handlePDFOutput(
  pdf: jsPDF,
  filename: string,
  openInViewer: boolean
): Promise<void> {
  if (openInViewer) {
    const pdfBlob = pdf.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);

    const popup = window.open(
      pdfUrl,
      'PDFViewer',
      'width=1000,height=800,scrollbars=yes,resizable=yes,toolbar=yes,menubar=yes'
    );

    if (popup) {
      popup.focus();
      const cleanupInterval = setInterval(() => {
        try {
          if (popup.closed) {
            clearInterval(cleanupInterval);
            URL.revokeObjectURL(pdfUrl);
            console.log('🧹 Cleaned PDF blob URL after viewer closed');
          }
        } catch {
          // ignore cross-window access
        }
      }, 2000);
    } else {
      // Popup blokiran – fallback na direktan download
      pdf.save(filename);
      try { URL.revokeObjectURL(pdfUrl); } catch {}
    }
  } else {
    pdf.save(filename);
  }
}
