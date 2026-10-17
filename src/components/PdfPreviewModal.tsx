import React, { useState, useEffect } from 'react';
import {
  RecorderInfo,
  ExecutiveInfo,
  CommunicationTopicItem,
  FeedbackInfo
} from '../types/mwa';
import { PrintDocument } from './PrintDocument';
import { getCurrentPdfBlob, getCurrentPdfFileName } from '../services/currentPdfStore';
import { Printer, X, ZoomIn, ZoomOut, RotateCcw, AlertTriangle, Download } from 'lucide-react';

export interface PdfPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  recorder: RecorderInfo;
  executive: ExecutiveInfo;
  topics: CommunicationTopicItem[];
  feedback: FeedbackInfo;
  onPrint?: () => void;
  recordId?: number;
  submissionId?: string;
  pdfBlob?: Blob | null;
  pdfFilename?: string;
}

export const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({
  isOpen,
  onClose,
  recorder,
  executive,
  topics,
  feedback,
  onPrint,
  recordId,
  submissionId,
  pdfBlob,
  pdfFilename
}) => {
  const [zoom, setZoom] = useState<number>(85); // Default comfortable preview scale for A4 Landscape
  const [showPopupBlockedModal, setShowPopupBlockedModal] = useState<boolean>(false);

  const effectivePdfBlob = pdfBlob || getCurrentPdfBlob();
  const effectivePdfFilename = pdfFilename || getCurrentPdfFileName() || `รายงานการสื่อสาร_${recordId || 'MWA'}.pdf`;

  const handleDownloadPdf = () => {
    if (!effectivePdfBlob) return;
    const url = URL.createObjectURL(effectivePdfBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = effectivePdfFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 10, 150));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 10, 50));
  const handleZoomReset = () => setZoom(85);

  // Architecture: Open a fresh top-level browsing window from the user-initiated click,
  // render the complete A4 Landscape report document, wait for DOM, fonts, and images,
  // then trigger window.print() so Chrome opens the Native Print Dialog reliably.
  const handlePrint = (e: React.MouseEvent<HTMLButtonElement>) => {
    console.log('[PRINT] button clicked');
    console.log('[PRINT] print handler started');

    // 1. Open new window directly from synchronous click event (user gesture prevents popup blocker)
    let printWindow: Window | null = null;
    try {
      printWindow = window.open('', '_blank');
    } catch (err) {
      console.error('[PRINT] window.open error:', err);
    }

    if (!printWindow) {
      console.warn('[PRINT] Pop-up window was blocked or null');
      setShowPopupBlockedModal(true);
      return;
    }

    try {
      // 2. Extract current document content and styles
      const printDocument =
        document.querySelector('.print-document') ||
        document.getElementById('mwa-printable-sheet');
      const contentHtml = printDocument ? printDocument.outerHTML : '';

      const existingStyles = Array.from(
        document.querySelectorAll('style, link[rel="stylesheet"]')
      )
        .map((node) => node.outerHTML)
        .join('\n');

      // 3. Populate printWindow with exact A4 Landscape print template (Height strictly fit-content to prevent empty 2nd page)
      printWindow.document.open();
      printWindow.document.write(`<!DOCTYPE html>
<html lang="th">
  <head>
    <meta charset="utf-8" />
    <title>รายงานการสื่อสารของผู้บริหาร${recordId ? ` (Record #${recordId})` : ''} - การประปานครหลวง</title>
    <meta name="record-id" content="${recordId || ''}" />
    <meta name="submission-id" content="${submissionId || ''}" />
    <meta name="source-of-truth" content="VERIFIED_RECORD" />
    ${existingStyles}
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap');

      @page {
        size: A4 landscape;
        margin: 10mm;
      }

      * {
        box-sizing: border-box;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }

      html,
      body {
        width: 100% !important;
        max-width: 100% !important;
        height: auto !important;
        min-height: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
        color: #000000 !important;
        overflow: visible !important;
        font-family: 'Sarabun', 'TH Sarabun New', sans-serif !important;
      }

      .no-print {
        display: none !important;
      }

      .print-document,
      #mwa-printable-sheet,
      #mwa-print-root {
        width: 100% !important;
        max-width: 100% !important;
        height: auto !important;
        min-height: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
        border: none !important;
        box-shadow: none !important;
        page-break-after: auto !important;
        break-after: auto !important;
      }

      @media screen {
        body {
          display: flex;
          justify-content: center;
          align-items: flex-start;
          padding: 10mm;
          background: #f1f5f9 !important;
        }

        #mwa-printable-sheet {
          background: #ffffff !important;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1) !important;
        }
      }

      @media print {
        @page {
          size: A4 landscape;
          margin: 10mm;
        }

        html,
        body {
          margin: 0 !important;
          padding: 0 !important;
          background: #ffffff !important;
          color: #000000 !important;
          width: 100% !important;
          max-width: 100% !important;
          height: auto !important;
          min-height: 0 !important;
          overflow: visible !important;
        }

        #mwa-printable-sheet,
        .print-document,
        #mwa-print-root {
          box-shadow: none !important;
          border: none !important;
          padding: 0 !important;
          margin: 0 !important;
          width: 100% !important;
          max-width: 100% !important;
          height: auto !important;
          min-height: 0 !important;
          page-break-after: auto !important;
          break-after: auto !important;
        }

        .no-print {
          display: none !important;
        }
      }
    </style>
  </head>
  <body class="bg-white text-black p-0 m-0">
    ${contentHtml}
  </body>
</html>`);
      printWindow.document.close();

      // 4. Wait for fonts, images, and layout before triggering window.print()
      const startPrintWorkflow = async () => {
        try {
          // Wait for fonts ready
          if (printWindow && printWindow.document.fonts && printWindow.document.fonts.ready) {
            await printWindow.document.fonts.ready;
          }

          // Wait for all images in print document to load
          if (printWindow) {
            const images = Array.from(printWindow.document.images);
            if (images.length > 0) {
              await Promise.all(
                images.map((img) => {
                  if (img.complete) return Promise.resolve();
                  return new Promise<void>((resolve) => {
                    img.onload = () => resolve();
                    img.onerror = () => resolve();
                  });
                })
              );
            }

            // Wait 2 requestAnimationFrame cycles for layout
            await new Promise<void>((resolve) =>
              printWindow!.requestAnimationFrame(() => resolve())
            );
            await new Promise<void>((resolve) =>
              printWindow!.requestAnimationFrame(() => resolve())
            );

            // Listen for print completion to close window (do not close prematurely!)
            printWindow.onafterprint = () => {
              try {
                printWindow!.close();
              } catch {
                // Ignore if already closed
              }
            };

            // 5. Trigger Native Print Dialog
            console.log('[PRINT] calling window.print()');
            printWindow.focus();
            printWindow.print();
          }
        } catch (printErr) {
          console.error('[PRINT] Error during print preparation in print window:', printErr);
          if (printWindow) {
            try {
              printWindow.focus();
              printWindow.print();
            } catch (e2) {
              console.error('[PRINT] Fallback print failed:', e2);
              setShowPopupBlockedModal(true);
            }
          }
        }
      };

      startPrintWorkflow();
    } catch (err) {
      console.error('[PRINT] Error populating print document:', err);
      setShowPopupBlockedModal(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex flex-col bg-slate-900/85 backdrop-blur-xs mwa-pdf-preview-backdrop animate-in fade-in duration-200">
      {/* Top Toolbar (Fixed & Clean) */}
      <header className="mwa-pdf-preview-toolbar bg-slate-850 border-b border-slate-700/80 px-4 py-2.5 flex items-center justify-between text-white shrink-0 shadow-md">
        {/* Document Info */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-slate-100">
              ตัวอย่างเอกสารรายงานการสื่อสารของผู้บริหาร
            </span>
            <span className="hidden sm:inline-block text-[11px] font-medium px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800">
              A4 แนวนอน (Landscape • 297mm × 210mm)
            </span>
          </div>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-md px-2 py-1">
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-1 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="ย่อขนาด (-)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono font-medium px-1 text-slate-200 min-w-[42px] text-center select-none">
            {zoom}%
          </span>
          <button
            type="button"
            onClick={handleZoomIn}
            className="p-1 hover:bg-slate-700 rounded text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="ขยายขนาด (+)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleZoomReset}
            className="p-1 hover:bg-slate-700 rounded text-slate-300 hover:text-white ml-1 border-l border-slate-700 pl-1.5 transition-colors cursor-pointer"
            title="ขนาดพอดี (85%)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Action Buttons: Native Chrome Print trigger via printDocument & Direct PDF Download */}
        <div className="flex items-center gap-2">
          {effectivePdfBlob && (
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="mwa-btn bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium shadow-sm transition-all cursor-pointer"
              title="ดาวน์โหลดไฟล์ PDF ต้นฉบับ (Source of Truth)"
            >
              <Download className="w-4 h-4 text-emerald-100" />
              <span>ดาวน์โหลด PDF</span>
            </button>
          )}

          <button
            type="button"
            onClick={handlePrint}
            className="mwa-btn bg-[#005691] hover:bg-[#004070] text-white flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium shadow-sm transition-all cursor-pointer"
            title="พิมพ์เอกสาร หรือ บันทึกเป็น PDF ผ่านเบราว์เซอร์"
          >
            <Printer className="w-4 h-4 text-sky-300" />
            <span>พิมพ์ / Save as PDF</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="mwa-btn bg-slate-700 hover:bg-slate-600 text-slate-200 hover:text-white flex items-center gap-1 px-3 py-1.5 text-xs transition-colors cursor-pointer"
            title="ปิดหน้าต่างตัวอย่าง (Esc)"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">ปิดหน้าต่าง</span>
          </button>
        </div>
      </header>

      {/* Main Preview Viewport */}
      <main className="flex-1 overflow-auto p-4 sm:p-8 flex justify-center items-start bg-slate-900/60">
        <div
          className="transition-transform duration-100 ease-out flex justify-center origin-top pb-12"
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top center'
          }}
        >
          {/* Authentic A4 Landscape White Paper Sheet */}
          <article
            id="mwa-printable-sheet"
            className="bg-white text-black shadow-2xl rounded-xs ring-1 ring-black/10 select-text"
            style={{
              width: '297mm',
              minHeight: '210mm',
              padding: '10mm',
              boxSizing: 'border-box'
            }}
          >
            <PrintDocument
              recorder={recorder}
              executive={executive}
              topics={topics}
              feedback={feedback}
              isInteractivePreview={true}
              recordId={recordId}
              submissionId={submissionId}
            />
          </article>
        </div>
      </main>

      {/* Fail-Safe: Pop-up Blocked Modal */}
      {showPopupBlockedModal && (
        <div className="fixed inset-0 z-60 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 text-center space-y-4 animate-in zoom-in-95 duration-150 border border-slate-100">
            <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-9 h-9 text-amber-600" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-bold text-slate-800">
                ไม่สามารถเปิดหน้าต่างพิมพ์ได้
              </h3>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3.5 text-center">
              <p className="text-xs text-slate-700 leading-relaxed">
                ระบบไม่สามารถเปิดหน้าต่างพิมพ์ของเบราว์เซอร์ได้
                กรุณาอนุญาต Pop-up สำหรับเว็บไซต์นี้ แล้วลองกด
                <span className="font-semibold text-slate-900"> ‘พิมพ์ / Save as PDF’ </span>
                อีกครั้ง
              </p>
            </div>

            <button
              type="button"
              className="mwa-btn bg-[#005691] hover:bg-[#004070] text-white w-full justify-center py-2.5 font-medium cursor-pointer shadow-xs transition-all"
              onClick={() => setShowPopupBlockedModal(false)}
            >
              ตกลง
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
