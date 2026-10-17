import html2canvas from 'html2canvas';
import { sanitizeElementColors, sanitizeClonedDocument } from './cssColorSanitizer';

declare global {
  interface Window {
    pdfjsLib?: any;
    mammoth?: any;
  }
}

const scriptPromises: Record<string, Promise<void> | undefined> = {};
function loadScript(src: string): Promise<void> {
  const existingPromise = scriptPromises[src];
  if (existingPromise) return existingPromise;
  scriptPromises[src] = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[data-mwa-src="${src}"]`) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error(`โหลดไลบรารีไม่สำเร็จ: ${src}`)), { once: true });
      if ((src.includes('pdf.min.js') && window.pdfjsLib) || (src.includes('mammoth') && window.mammoth)) resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.dataset.mwaSrc = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`โหลดไลบรารีไม่สำเร็จ: ${src}`));
    document.head.appendChild(script);
  });
  return scriptPromises[src];
}

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(',')[1] || '';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function pdfFirstPage(dataUrl: string): Promise<string> {
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js');
  if (!window.pdfjsLib) throw new Error('ไม่พบ PDF.js');
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  const pdf = await window.pdfjsLib.getDocument({ data: dataUrlToBytes(dataUrl) }).promise;
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 1.2 });
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('ไม่สามารถสร้างภาพตัวอย่าง PDF');
  await page.render({ canvasContext: ctx, viewport }).promise;
  return makeCompactPreview(canvas);
}

async function wordFirstPage(dataUrl: string): Promise<string> {
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.8.0/mammoth.browser.min.js');
  if (!window.mammoth) throw new Error('ไม่พบตัวแปลง Word');
  const result = await window.mammoth.convertToHtml({ arrayBuffer: dataUrlToBytes(dataUrl).buffer });
  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'position:fixed;left:-10000px;top:0;width:794px;height:1123px;overflow:hidden;background:#fff;color:#111;padding:48px;box-sizing:border-box;font-family:Arial,sans-serif;font-size:14px;line-height:1.45;';
  wrapper.innerHTML = result.value || '<p>เอกสาร Word</p>';
  document.body.appendChild(wrapper);
  try {
    sanitizeElementColors(wrapper, typeof window !== 'undefined' ? window : ({} as Window));
    const canvas = await html2canvas(wrapper, {
      backgroundColor: '#ffffff',
      scale: 1,
      useCORS: true,
      logging: false,
      onclone: (clonedDoc, clonedEl) => {
        sanitizeClonedDocument(clonedDoc, clonedEl);
      }
    });
    return makeCompactPreview(canvas);
  } finally {
    wrapper.remove();
  }
}


function makeCompactPreview(sourceCanvas: HTMLCanvasElement): string {
  // Small preview only; the original document is uploaded separately and remains unchanged in Drive.
  const maxWidth = 360;
  const maxHeight = 460;
  const ratio = Math.min(1, maxWidth / sourceCanvas.width, maxHeight / sourceCanvas.height);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(sourceCanvas.width * ratio));
  canvas.height = Math.max(1, Math.round(sourceCanvas.height * ratio));
  const ctx = canvas.getContext('2d');
  if (!ctx) return sourceCanvas.toDataURL('image/jpeg', 0.68);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(sourceCanvas, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.68);
}

export async function createDocumentPreview(file: File, dataUrl: string): Promise<string | undefined> {
  const name = file.name.toLowerCase();
  if (file.type === 'application/pdf' || name.endsWith('.pdf')) return pdfFirstPage(dataUrl);
  if (name.endsWith('.docx') || file.type.includes('wordprocessingml')) return wordFirstPage(dataUrl);
  // Legacy .doc binary cannot be rendered reliably in-browser without a conversion service.
  return undefined;
}
