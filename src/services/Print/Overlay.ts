import jsPDF from 'jspdf';
import { ensurePngDataUrl } from './PDFUtils';

export type OverlayImage = {
  src: string;
  left: number; // CSS px relative to container
  top: number;  // CSS px relative to container
  width: number; // CSS px
  height: number; // CSS px
};

/**
 * Prikupi slike koje treba dodati kao overlay u PDF (npr. QR kod)
 * - Traži #workorder-qr
 * - Traži sve <img data-pdf-overlay="true">
 * Elementi se privremeno sakrivaju (visibility: hidden) da ne dupliraju u canvas-u
 */
export function collectOverlayImages(container: HTMLElement): OverlayImage[] {
  const items: OverlayImage[] = [];

  const pushEl = (el: HTMLImageElement | null) => {
    if (!el || !el.src) return;
    const containerRect = container.getBoundingClientRect();
    const rect = el.getBoundingClientRect();
    const left = rect.left - containerRect.left;
    const top = rect.top - containerRect.top;
    items.push({ src: el.src, left, top, width: rect.width, height: rect.height });
    el.style.visibility = 'hidden';
  };

  // 1) Specifični QR element
  pushEl(container.querySelector('#workorder-qr') as HTMLImageElement | null);

  // 2) Svi označeni overlay elementi
  const overlays = container.querySelectorAll('img[data-pdf-overlay="true"]');
  overlays.forEach(el => pushEl(el as HTMLImageElement));

  if (items.length > 0) {
    console.log('🧭 Captured overlay images:', items.map(i => ({ ...i, src: i.src.substring(0, 30) + '...' })));
  } else {
    console.log('ℹ️ No overlay images found in container');
  }

  return items;
}

/**
 * Primijeni overlay slike na PDF koristeći koordinate iz HTML-a
 * Automatski mapira CSS px u mm ovisno o stvarnom renderu (html2canvas).
 */
export async function applyOverlayImagesToPdf(
  pdf: jsPDF,
  overlayImages: OverlayImage[],
  container: HTMLElement,
  canvas: HTMLCanvasElement
): Promise<void> {
  if (!overlayImages.length) return;

  // Izračun mape CSS px -> mm koristeći stvarno renderirane dimenzije
  const containerCssWidth = container.offsetWidth; // očekivano 794 px
  const scaleUsed = canvas.width / containerCssWidth; // html2canvas scale
  const cssHeightUsed = canvas.height / scaleUsed;
  const mmPerCssPxX = 210 / containerCssWidth;
  const mmPerCssPxY = 297 / cssHeightUsed;
  console.log('📐 Overlay mapping factors:', { containerCssWidth, cssHeightUsed, scaleUsed, mmPerCssPxX, mmPerCssPxY });

  for (const ov of overlayImages) {
    const pngUrl = await ensurePngDataUrl(ov.src);
    const x = ov.left * mmPerCssPxX;
    const y = ov.top * mmPerCssPxY;
    const w = ov.width * mmPerCssPxX;
    const h = ov.height * mmPerCssPxY;
    pdf.addImage(pngUrl, 'PNG', x, y, w, h);
    console.log('🖼️ Added overlay image to PDF (mm):', { x, y, w, h });
  }
}
