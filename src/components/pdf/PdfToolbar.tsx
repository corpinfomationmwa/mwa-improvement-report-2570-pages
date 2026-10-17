import React from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Printer, Download, X, Maximize2 } from 'lucide-react';

interface PdfToolbarProps {
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onPrint: () => void;
  onClose: () => void;
}

export const PdfToolbar: React.FC<PdfToolbarProps> = ({
  scale,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onPrint,
  onClose
}) => {
  return (
    <div className="h-12 bg-[#202124] text-slate-200 px-4 flex items-center justify-between border-b border-slate-700/80 shadow-md select-none shrink-0 z-10">
      {/* Left: Document Info */}
      <div className="flex items-center gap-3">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
        <div className="text-xs font-medium text-slate-100 truncate max-w-xs sm:max-w-md">
          MWA_Executive_Communication_Report.pdf
        </div>
        <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
          ตัวอย่างเอกสารก่อนพิมพ์
        </span>
      </div>

      {/* Center/Right: Zoom & Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Zoom Controls */}
        <div className="flex items-center bg-slate-800 rounded border border-slate-700 p-0.5">
          <button
            type="button"
            onClick={onZoomOut}
            disabled={scale <= 60}
            className="p-1 hover:bg-slate-700 rounded text-slate-300 disabled:opacity-30 transition-colors"
            title="ย่อขนาด (-)"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-mono px-2 text-slate-200 min-w-[44px] text-center">
            {scale}%
          </span>
          <button
            type="button"
            onClick={onZoomIn}
            disabled={scale >= 150}
            className="p-1 hover:bg-slate-700 rounded text-slate-300 disabled:opacity-30 transition-colors"
            title="ขยายขนาด (+)"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onZoomReset}
            className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors border-l border-slate-700 ml-0.5"
            title="ขนาดดั้งเดิม 100%"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>

        {/* Print Button */}
        <button
          type="button"
          onClick={onPrint}
          className="flex items-center gap-1 bg-[#0054a6] hover:bg-[#004284] text-white px-2.5 py-1.5 rounded text-xs font-medium transition-colors shadow-xs ml-1"
          title="พิมพ์เอกสาร (Ctrl+P)"
        >
          <Printer className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">พิมพ์</span>
        </button>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors ml-1"
          title="ปิดหน้าต่าง (Esc)"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
