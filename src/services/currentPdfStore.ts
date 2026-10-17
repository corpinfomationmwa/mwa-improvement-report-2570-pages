/**
 * Single Source of Truth for the generated MWA Report PDF document.
 * Ensures the exact same PDF is shared across:
 * 1. PDF Preview
 * 2. PDF Download
 * 3. Email Attachment
 */

export interface ActivePdfDocument {
  blob: Blob;
  base64: string;
  fileName: string;
  fileUrl: string;
  sizeBytes: number;
  recordId?: number | string;
  submissionId?: string;
  createdAt: string;
}

// Central variables holding the single authoritative PDF
let currentPdfBlob: Blob | null = null;
let currentPdfBase64: string | null = null;
let currentPdfFileName: string | null = null;
let currentPdfFileUrl: string | null = null;
let currentActiveDocument: ActivePdfDocument | null = null;

/**
 * Stores the freshly generated PDF document as the single authoritative copy.
 */
export function setCurrentPdf(doc: {
  blob: Blob;
  base64: string;
  fileName: string;
  recordId?: number | string;
  submissionId?: string;
}): ActivePdfDocument {
  currentPdfBlob = doc.blob;
  currentPdfFileName = doc.fileName;

  // Ensure base64 has no data URI prefix and no whitespace
  let cleanB64 = doc.base64 || '';
  if (cleanB64.includes('base64,')) {
    cleanB64 = cleanB64.split('base64,')[1];
  }
  currentPdfBase64 = cleanB64.replace(/\s/g, '').trim();

  // Manage Blob URL for Preview & Download
  if (currentPdfFileUrl && typeof URL !== 'undefined' && URL.revokeObjectURL) {
    try {
      URL.revokeObjectURL(currentPdfFileUrl);
    } catch {
      // Ignore cleanup error
    }
  }

  currentPdfFileUrl =
    typeof URL !== 'undefined' && URL.createObjectURL ? URL.createObjectURL(doc.blob) : '';

  currentActiveDocument = {
    blob: doc.blob,
    base64: currentPdfBase64,
    fileName: doc.fileName,
    fileUrl: currentPdfFileUrl,
    sizeBytes: doc.blob.size,
    recordId: doc.recordId,
    submissionId: doc.submissionId,
    createdAt: new Date().toISOString()
  };

  return currentActiveDocument;
}

export function getCurrentPdfBlob(): Blob | null {
  return currentPdfBlob;
}

export function getCurrentPdfBase64(): string | null {
  return currentPdfBase64;
}

export function getCurrentPdfFileName(): string | null {
  return currentPdfFileName;
}

export function getCurrentPdfFileUrl(): string | null {
  return currentPdfFileUrl;
}

export function getCurrentPdfDocument(): ActivePdfDocument | null {
  return currentActiveDocument;
}

/**
 * Clears current PDF state (e.g. when user starts a fresh form).
 */
export function clearCurrentPdf(): void {
  if (currentPdfFileUrl && typeof URL !== 'undefined' && URL.revokeObjectURL) {
    try {
      URL.revokeObjectURL(currentPdfFileUrl);
    } catch {
      // Ignore
    }
  }
  currentPdfBlob = null;
  currentPdfBase64 = null;
  currentPdfFileName = null;
  currentPdfFileUrl = null;
  currentActiveDocument = null;
}

/**
 * Utility to convert Blob to clean Base64 string without data URI prefix.
 */
export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      let res = (reader.result as string) || '';
      if (res.includes('base64,')) {
        res = res.split('base64,')[1];
      }
      resolve(res.replace(/\s/g, '').trim());
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Downloads the current authoritative PDF blob directly in the browser.
 */
export function downloadCurrentPdf(fileNameOverride?: string): boolean {
  if (!currentPdfBlob) {
    console.warn('[PDF DOWNLOAD] No active PDF blob found to download.');
    return false;
  }

  const name = fileNameOverride || currentPdfFileName || 'MWA_Report.pdf';

  if (typeof window !== 'undefined' && window.document) {
    const url = currentPdfFileUrl || (URL.createObjectURL ? URL.createObjectURL(currentPdfBlob) : '');
    if (!url) return false;

    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  }

  return false;
}
