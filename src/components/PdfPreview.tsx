import React, { useState, useEffect, useRef } from 'react';
import {
  RecorderInfo,
  ExecutiveInfo,
  CommunicationTopicItem,
  FeedbackInfo
} from '../types/mwa';
import { defaultPdfSettings, PdfPrintSettings } from '../config/pdfConfig';
import { generatePdf, GeneratedPdfResult } from '../services/pdfGenerator';
import { PdfViewer } from './PdfViewer';
import { PrintControls } from './PrintControls';
import { Printer, X } from 'lucide-react';

interface PdfPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  recorder: RecorderInfo;
  executive: ExecutiveInfo;
  topics: CommunicationTopicItem[];
  feedback: FeedbackInfo;
}

export const PdfPreview: React.FC<PdfPreviewProps> = ({
  isOpen,
  onClose,
  recorder,
  executive,
  topics,
  feedback
}) => {
  const [settings, setSettings] = useState<PdfPrintSettings>(defaultPdfSettings);
  const [scale, setScale] = useState<number>(100);
  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfResult, setPdfResult] = useState<GeneratedPdfResult | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const printIframeRef = useRef<HTMLIFrameElement | null>(null);

  // Generate real PDF whenever modal is opened
  useEffect(() => {
    if (!isOpen) {
      if (pdfResult?.blobUrl) {
        URL.revokeObjectURL(pdfResult.blobUrl);
      }
      setPdfResult(null);
      return;
    }

    let isMounted = true;
    setIsGenerating(true);

    generatePdf(recorder, executive, topics, feedback, settings)
      .then((res) => {
        if (isMounted) {
          setPdfResult(res);
          setIsGenerating(false);
        }
      })
      .catch((err) => {
        console.error('Error generating PDF:', err);
        if (isMounted) {
          setIsGenerating(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, recorder, executive, topics, feedback, settings.margins, settings.includeHeaderFooter]);

  // Handle ESC and Ctrl+P keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        handlePrint();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, pdfResult]);

  if (!isOpen) return null;

  const handleSettingsChange = (updated: Partial<PdfPrintSettings>) => {
    setSettings((prev) => ({ ...prev, ...updated }));
  };

  const handleZoomIn = () => setScale((prev) => Math.min(prev + 10, 150));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 10, 50));
  const handleZoomReset = () => setScale(100);

  // Action: Open real PDF in new browser tab / native viewer
  const handleOpenInNewWindow = () => {
    if (!pdfResult?.blobUrl) return;
    window.open(pdfResult.blobUrl, '_blank');
  };

  // Action: Print real PDF
  const handlePrint = () => {
    if (!pdfResult?.blobUrl) return;

    if (!printIframeRef.current) {
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);
      printIframeRef.current = iframe;
    }

    const iframe = printIframeRef.current;
    iframe.src = pdfResult.blobUrl;
    iframe.onload = () => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (err) {
        window.open(pdfResult.blobUrl, '_blank');
      }
    };
  };

  // Action: Save / Download real PDF
  const handleSaveAsPdf = () => {
    if (!pdfResult?.blob) return;

    const fileName = 'MWA_Executive_Communication_Report.pdf';
    const a = document.createElement('a');
    a.href = pdfResult.blobUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setToastMessage('ดาวน์โหลดเอกสาร PDF เรียบร้อยแล้ว');
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden flex flex-col bg-[#202124] text-slate-100 select-none animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
    >
      {/* Top Bar: MWA_Executive_Communication_Report.pdf    พิมพ์    X */}
      <div className="h-12 bg-[#202124] text-slate-200 px-4 flex items-center justify-between border-b border-slate-700/80 shadow-md select-none shrink-0 z-10">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span className="text-xs font-medium text-slate-100 truncate max-w-xs sm:max-w-md">
            MWA_Executive_Communication_Report.pdf
          </span>
          <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700 hidden sm:inline">
            PDF จริง (A4)
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Top Print Button */}
          <button
            type="button"
            onClick={handlePrint}
            disabled={isGenerating || !pdfResult}
            className="flex items-center gap-1.5 bg-[#0054a6] hover:bg-[#004284] text-white px-3 py-1.5 rounded text-xs font-medium transition-colors shadow-xs cursor-pointer disabled:opacity-50"
            title="พิมพ์เอกสาร PDF (Ctrl+P)"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>พิมพ์</span>
          </button>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors cursor-pointer"
            title="ยกเลิก / ปิดหน้าต่าง (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Preview Area: Left (PdfViewer) | Right (PrintControls) */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Left Side: Real PDF Viewer */}
        <PdfViewer
          pageImages={pdfResult?.pageImages || []}
          scale={scale}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onZoomReset={handleZoomReset}
          isGenerating={isGenerating}
        />

        {/* Right Side: Print Controls */}
        <PrintControls
          settings={settings}
          onSettingsChange={handleSettingsChange}
          onPrint={handlePrint}
          onSaveAsPdf={handleSaveAsPdf}
          onOpenInNewWindow={handleOpenInNewWindow}
          onClose={onClose}
          isGenerating={isGenerating}
        />
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-white text-xs px-4 py-2.5 rounded-lg shadow-2xl border border-slate-700 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
