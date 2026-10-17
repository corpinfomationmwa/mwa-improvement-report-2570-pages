import React from 'react';
import {
  PdfPrintSettings,
  pdfDestinations,
  pdfMarginOptions,
  pdfPagesPerSheetOptions
} from '../config/pdfConfig';
import { Printer, Download, ExternalLink, X } from 'lucide-react';

interface PrintControlsProps {
  settings: PdfPrintSettings;
  onSettingsChange: (updated: Partial<PdfPrintSettings>) => void;
  onPrint: () => void;
  onSaveAsPdf: () => void;
  onOpenInNewWindow: () => void;
  onClose: () => void;
  isGenerating?: boolean;
}

export const PrintControls: React.FC<PrintControlsProps> = ({
  settings,
  onSettingsChange,
  onPrint,
  onSaveAsPdf,
  onOpenInNewWindow,
  onClose,
  isGenerating = false
}) => {
  return (
    <div className="w-full lg:w-80 bg-[#f8f9fa] text-slate-800 border-l border-slate-300 h-full flex flex-col justify-between shadow-xl select-none text-xs shrink-0">
      {/* Top Header */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-[#0054a6] text-white flex items-center justify-center">
            <Printer className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-slate-900 leading-tight">พิมพ์</h2>
            <p className="text-[10px] text-slate-500">MWA Print Controls</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
          title="ปิดหน้าต่าง (Esc)"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Settings Form Body */}
      <div className="p-4 space-y-4 overflow-y-auto flex-1">
        {/* 1. ปลายทาง */}
        <div className="space-y-1.5">
          <label className="font-semibold text-slate-700 block text-[11px]">
            ปลายทาง
          </label>
          <select
            value={settings.destination}
            onChange={(e) => onSettingsChange({ destination: e.target.value })}
            className="w-full p-2 border border-slate-300 rounded bg-white text-slate-800 focus:outline-none focus:border-[#0054a6] text-xs cursor-pointer"
          >
            {pdfDestinations.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* 2. หน้า */}
        <div className="space-y-1.5">
          <label className="font-semibold text-slate-700 block text-[11px]">
            หน้า
          </label>
          <select
            value={settings.pages}
            onChange={(e) => onSettingsChange({ pages: e.target.value })}
            className="w-full p-2 border border-slate-300 rounded bg-white text-slate-800 focus:outline-none focus:border-[#0054a6] text-xs cursor-pointer"
          >
            <option value="all">ทั้งหมด</option>
            <option value="1">เฉพาะหน้า 1</option>
            <option value="2">เฉพาะหน้า 2</option>
            <option value="custom">กำหนดเอง (เช่น 1-2)</option>
          </select>
        </div>

        {/* 3. จำนวนหน้าต่อแผ่น */}
        <div className="space-y-1.5">
          <label className="font-semibold text-slate-700 block text-[11px]">
            จำนวนหน้าต่อแผ่น
          </label>
          <select
            value={settings.pagesPerSheet}
            onChange={(e) => onSettingsChange({ pagesPerSheet: Number(e.target.value) })}
            className="w-full p-2 border border-slate-300 rounded bg-white text-slate-800 focus:outline-none focus:border-[#0054a6] text-xs cursor-pointer"
          >
            {pdfPagesPerSheetOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        {/* 4. ระยะขอบ */}
        <div className="space-y-1.5">
          <label className="font-semibold text-slate-700 block text-[11px]">
            ระยะขอบ
          </label>
          <select
            value={settings.margins}
            onChange={(e) => onSettingsChange({ margins: e.target.value as any })}
            className="w-full p-2 border border-slate-300 rounded bg-white text-slate-800 focus:outline-none focus:border-[#0054a6] text-xs cursor-pointer"
          >
            {pdfMarginOptions.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        {/* 5. ตัวเลือก */}
        <div className="space-y-2 pt-2 border-t border-slate-200">
          <label className="font-semibold text-slate-700 block text-[11px]">
            ตัวเลือก
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-slate-700 hover:text-slate-900">
            <input
              type="checkbox"
              checked={settings.includeHeaderFooter}
              onChange={(e) => onSettingsChange({ includeHeaderFooter: e.target.checked })}
              className="rounded border-slate-300 text-[#0054a6] focus:ring-0 w-3.5 h-3.5 cursor-pointer"
            />
            <span className="text-xs">ส่วนหัวและส่วนท้ายกระดาษ</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-slate-700 hover:text-slate-900">
            <input
              type="checkbox"
              checked={settings.backgroundGraphics}
              onChange={(e) => onSettingsChange({ backgroundGraphics: e.target.checked })}
              className="rounded border-slate-300 text-[#0054a6] focus:ring-0 w-3.5 h-3.5 cursor-pointer"
            />
            <span className="text-xs">กราฟิกพื้นหลัง</span>
          </label>
        </div>

        {/* Quick External Actions */}
        <div className="pt-3 border-t border-slate-200 space-y-2">
          <button
            type="button"
            onClick={onOpenInNewWindow}
            disabled={isGenerating}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 border border-slate-300 rounded text-slate-700 bg-white hover:bg-slate-50 transition-colors text-xs font-medium cursor-pointer disabled:opacity-50"
            title="เปิดไฟล์ PDF ในแท็บเบราว์เซอร์ใหม่"
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            <span>เปิด PDF ในหน้าต่างใหม่</span>
          </button>

          <button
            type="button"
            onClick={onPrint}
            disabled={isGenerating}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 border border-slate-300 rounded text-slate-700 bg-white hover:bg-slate-50 transition-colors text-xs font-medium cursor-pointer disabled:opacity-50"
            title="พิมพ์เอกสาร PDF"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>พิมพ์</span>
          </button>
        </div>
      </div>

      {/* Bottom Action Buttons */}
      <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 border border-slate-300 rounded bg-white hover:bg-slate-100 text-slate-700 font-medium transition-colors cursor-pointer text-xs"
        >
          ยกเลิก
        </button>

        <button
          type="button"
          onClick={onSaveAsPdf}
          disabled={isGenerating}
          className="px-4 py-2 bg-[#0054a6] hover:bg-[#004284] text-white rounded font-medium transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer text-xs disabled:opacity-50"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{isGenerating ? 'กำลังสร้าง PDF...' : 'บันทึก'}</span>
        </button>
      </div>
    </div>
  );
};
