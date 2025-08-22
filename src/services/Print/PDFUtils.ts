import html2canvas from 'html2canvas';

/**
 * Čekaj da se sve slike učitaju
 */
export async function waitForImages(container: HTMLElement): Promise<void> {
  const images = container.querySelectorAll('img');
  const promises = Array.from(images).map(img => {
    return new Promise<void>((resolve) => {
      if ((img as HTMLImageElement).complete) {
        resolve();
      } else {
        (img as HTMLImageElement).onload = () => resolve();
        (img as HTMLImageElement).onerror = () => resolve();
        setTimeout(() => resolve(), 2000);
      }
    });
  });
  await Promise.all(promises);
  console.log(`📷 Loaded ${images.length} images`);
}

/**
 * Generiraj canvas s retry logikom
 */
export async function generateCanvasWithRetry(element: HTMLElement): Promise<HTMLCanvasElement> {
  const options: Parameters<typeof html2canvas>[1][] = [
    {
      scale: 3,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      height: element.scrollHeight || 1123,
      width: 794
    },
    {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      height: element.scrollHeight || 1123,
      width: 794
    },
    {
      scale: 1,
      useCORS: false,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false
    }
  ];

  for (let i = 0; i < options.length; i++) {
    try {
      console.log(`🎨 Attempting canvas generation with option ${i + 1}...`);
      const canvas = await html2canvas(element, options[i]);
      if (canvas.width > 0 && canvas.height > 0) {
        console.log(`✅ Canvas generated successfully: ${canvas.width}x${canvas.height}`);
        return canvas;
      }
    } catch (error) {
      console.warn(`⚠️ Canvas option ${i + 1} failed:`, error);
      if (i === options.length - 1) throw error;
    }
  }
  throw new Error('Sve opcije za generiranje canvas-a su neuspješne');
}

/**
 * Osigura PNG data URL. Ako je izvor već PNG, vraća ga.
 * Ako je SVG ili drugi format, renderira ga u canvas i vraća PNG data URL.
 */
export async function ensurePngDataUrl(src: string): Promise<string> {
  try {
    if (typeof src === 'string' && src.startsWith('data:image/png')) {
      return src;
    }
    return await new Promise<string>((resolve) => {
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          try {
            const w = (img as HTMLImageElement).naturalWidth || 200;
            const h = (img as HTMLImageElement).naturalHeight || 200;
            const canvas = document.createElement('canvas');
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, w, h);
              const out = canvas.toDataURL('image/png');
              resolve(out);
            } else {
              resolve(src);
            }
          } catch {
            resolve(src);
          }
        };
        img.onerror = () => resolve(src);
        img.src = src;
      } catch {
        resolve(src);
      }
    });
  } catch {
    return src;
  }
}
