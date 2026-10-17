import React, { useState, useEffect } from 'react';
import {
  RecorderInfo,
  ExecutiveInfo,
  CommunicationTopicItem,
  FeedbackInfo
} from '../../types/mwa';
import { defaultPdfSettings, PdfPrintSettings } from '../../config/pdfConfig';
import { PdfToolbar } from './PdfToolbar';
import { PdfControlPanel } from './PdfControlPanel';
import { PdfDocument } from './PdfDocument';

interface PdfPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  recorder: RecorderInfo;
  executive: ExecutiveInfo;
  topics: CommunicationTopicItem[];
  feedback: FeedbackInfo;
}

export const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({
  isOpen,
  onClose,
  recorder,
  executive,
  topics,
  feedback
}) => {
  const [settings, setSettings] = useState<PdfPrintSettings>(defaultPdfSettings);
  const [scale, setScale] = useState<number>(100);
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

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
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSettingsChange = (updated: Partial<PdfPrintSettings>) => {
    setSettings((prev) => ({ ...prev, ...updated }));
  };

  const handleZoomIn = () => setScale((prev) => Math.min(prev + 10, 150));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 10, 60));
  const handleZoomReset = () => setScale(100);

  const handlePrint = () => {
    window.focus();
    window.print();
  };

  const handleSaveAsPdf = () => {
    window.focus();
    window.print();
  };

  const handleOpenInNewWindow = () => {
    window.focus();
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden flex flex-col bg-[#202124] text-slate-100 select-none"
      role="dialog"
      aria-modal="true"
    >
      {/* 1. Top PDF Toolbar */}
      <PdfToolbar
        scale={scale}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onZoomReset={handleZoomReset}
        onPrint={handlePrint}
        onClose={onClose}
      />

      {/* 2. Main Workspace (Viewer on Left/Center, Control Panel on Right) */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        {/* Document Viewer Canvas (Dark Background like Chrome PDF viewer) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-[#323639] flex flex-col items-center">
          <div
            className="w-full flex justify-center transition-transform duration-150"
            style={{
              transform: `scale(${scale / 100})`,
              transformOrigin: 'top center'
            }}
          >
            <PdfDocument
              recorder={recorder}
              executive={executive}
              topics={topics}
              feedback={feedback}
              settings={settings}
            />
          </div>
        </div>

        {/* Control Panel (Browser Print Preview Sidebar) */}
        <div className="w-full lg:w-80 shrink-0 border-t lg:border-t-0 border-slate-700 bg-white">
          <PdfControlPanel
            settings={settings}
            onSettingsChange={handleSettingsChange}
            onPrint={handlePrint}
            onSaveAsPdf={handleSaveAsPdf}
            onOpenInNewWindow={handleOpenInNewWindow}
            onClose={onClose}
            isSaving={isSaving}
          />
        </div>
      </div>

      {/* Notification Toast */}
      {showToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-white text-xs px-4 py-2.5 rounded-lg shadow-2xl border border-slate-700 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
