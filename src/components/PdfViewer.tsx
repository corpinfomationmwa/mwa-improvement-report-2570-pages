import React from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Loader2 } from 'lucide-react';

interface PdfViewerProps {
  pageImages: string[];
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  isGenerating?: boolean;
}

export const PdfViewer: React.FC<PdfViewerProps> = ({
  pageImages,
  scale,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  isGenerating = false
}) => {
  return (
    <div className="flex-1 flex flex-col h-full bg-[#323639] overflow-hidden relative">
      {/* Top Floating Mini Toolbar */}
      <div className="h-10 bg-[#282c30]/90 backdrop-blur-xs border-b border-slate-700/80 px-4 flex items-center justify-between text-slate-300 text-xs shrink-0 select-none z-10">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span className="font-mono text-[11px] text-slate-300">
            เอกสาร PDF A4 ({pageImages.length} หน้า)
          </span>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 bg-slate-800 rounded border border-slate-700 p-0.5">
          <button
            type="button"
            onClick={onZoomOut}
            disabled={scale <= 50}
            className="p-1 hover:bg-slate-700 rounded text-slate-300 disabled:opacity-30 transition-colors"
            title="ย่อขนาด (-)"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] font-mono px-2 text-slate-200 min-w-[42px] text-center">
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
            title="รีเซ็ตขนาด 100%"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Main Canvas Scroll Area */}
      <div className="flex-1 overflow-y-auto overflow-x-auto p-4 sm:p-8 flex flex-col items-center">
        {isGenerating ? (
          <div className="flex flex-col items-center justify-center my-auto p-12 text-slate-300 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-sky-400" />
            <p className="text-sm font-medium">กำลังสร้างเอกสาร PDF จริงจากข้อมูลแบบฟอร์ม...</p>
            <p className="text-xs text-slate-400">ระบบกำลังจัดเรียงเลย์เอาต์ A4 และคำนวณการแบ่งหน้าอัตโนมัติ</p>
          </div>
        ) : pageImages.length === 0 ? (
          <div className="flex flex-col items-center justify-center my-auto p-8 text-slate-400">
            <p className="text-sm">ไม่พบข้อมูลหน้าเอกสาร</p>
          </div>
        ) : (
          <div
            className="flex flex-col items-center gap-8 transition-transform duration-150 origin-top pb-12"
            style={{
              transform: `scale(${scale / 100})`
            }}
          >
            {pageImages.map((imgSrc, idx) => (
              <div
                key={idx}
                className="relative bg-white text-black shadow-2xl transition-shadow select-none"
                style={{
                  width: '210mm',
                  minHeight: '297mm',
                  maxHeight: '297mm',
                  boxShadow: '0 15px 35px -5px rgba(0, 0, 0, 0.5), 0 5px 15px rgba(0, 0, 0, 0.2)'
                }}
              >
                {/* Page Number Badge */}
                <div className="absolute -top-6 left-0 text-[10px] text-slate-400 font-mono">
                  หน้า {idx + 1} จาก {pageImages.length}
                </div>

                {/* Rendered High-Res A4 Sheet Image */}
                <img
                  src={imgSrc}
                  alt={`MWA Report Page ${idx + 1}`}
                  className="w-full h-auto block select-none pointer-events-none"
                  style={{
                    width: '210mm',
                    height: '297mm',
                    objectFit: 'contain'
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
