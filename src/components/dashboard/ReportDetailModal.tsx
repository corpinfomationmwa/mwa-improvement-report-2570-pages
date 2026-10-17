import React from 'react';
import { X, Calendar, User, Building, FileText, CheckCircle2, AlertCircle, Share2, Printer } from 'lucide-react';
import { ReportItem } from '../../types/report';
import { StatusBadge } from '../common/StatusBadge';

interface ReportDetailModalProps {
  report: ReportItem | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (report: ReportItem) => void;
}

export const ReportDetailModal: React.FC<ReportDetailModalProps> = ({
  report,
  isOpen,
  onClose,
  onEdit
}) => {
  if (!isOpen || !report) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        onClick={onClose} 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" 
      />

      {/* Modal Card */}
      <div className="relative bg-white rounded-lg shadow-xl border border-slate-200 w-full max-w-2xl z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-[#003a6b] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-white/10 flex items-center justify-center text-white">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs text-sky-200 font-mono tracking-wide">
                เลขที่: {report.id}
              </span>
              <h2 className="text-base font-semibold leading-tight text-white">
                รายละเอียดรายงานการปรับปรุงงาน
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-sky-200 hover:text-white rounded hover:bg-white/10 transition-colors"
            aria-label="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-5 text-sm">
          {/* Status & Category Bar */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500 font-medium">สถานะปัจจุบัน:</span>
              <StatusBadge status={report.status} size="md" />
            </div>
            <div className="text-xs text-slate-500">
              ประเภท: <span className="font-medium text-slate-800">{report.category}</span>
            </div>
          </div>

          {/* Title */}
          <div>
            <h3 className="text-base font-semibold text-slate-900 leading-snug">
              {report.title}
            </h3>
          </div>

          {/* Summary / Description */}
          <div className="bg-slate-50 rounded-md p-4 border border-slate-200/80">
            <div className="text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#005696]" />
              <span>สรุปรายละเอียดการปรับปรุงและพัฒนางาน</span>
            </div>
            <p className="text-slate-600 leading-relaxed text-xs sm:text-sm">
              {report.summary || 'ไม่มีข้อมูลรายละเอียดเพิ่มเติม'}
            </p>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            <div className="flex items-start gap-2.5 p-3 rounded-md bg-slate-50/60 border border-slate-100">
              <Building className="w-4 h-4 text-[#005696] shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] text-slate-400">หน่วยงานเจ้าของเรื่อง</p>
                <p className="font-medium text-slate-800 text-xs sm:text-sm">{report.department}</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-md bg-slate-50/60 border border-slate-100">
              <User className="w-4 h-4 text-[#005696] shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] text-slate-400">ผู้รายงาน / เจ้าหน้าที่</p>
                <p className="font-medium text-slate-800 text-xs sm:text-sm">
                  {report.reporter} {report.reporterRole ? `(${report.reporterRole})` : ''}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-md bg-slate-50/60 border border-slate-100">
              <Calendar className="w-4 h-4 text-[#005696] shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] text-slate-400">วันที่รายงาน</p>
                <p className="font-medium text-slate-800 text-xs sm:text-sm font-mono">{report.date}</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 rounded-md bg-slate-50/60 border border-slate-100">
              <AlertCircle className="w-4 h-4 text-[#005696] shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] text-slate-400">ระดับผลกระทบ</p>
                <p className="font-medium text-slate-800 text-xs sm:text-sm">
                  {report.impactLevel || 'ปกติ'}
                </p>
              </div>
            </div>
          </div>

          {/* Integration Phase Notice */}
          <div className="text-[11px] text-slate-400 bg-sky-50/60 rounded p-2.5 border border-sky-100 text-center">
            * ระบบในระยะที่ 1 แสดงข้อมูลจำลองภายใน (Mock Data) สำหรับการตรวจสอบโครงสร้างและหน้าจอระบบ
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded transition-colors"
          >
            ปิด
          </button>
          
          <div className="flex items-center gap-2">
            {onEdit && (
              <button
                onClick={() => {
                  onClose();
                  onEdit(report);
                }}
                className="px-4 py-2 text-xs font-medium text-[#005696] bg-white border border-[#005696] hover:bg-sky-50 rounded transition-colors"
              >
                แก้ไขรายงานนี้
              </button>
            )}
            <button
              onClick={() => window.print()}
              className="px-4 py-2 text-xs font-medium text-white bg-[#005696] hover:bg-[#004780] rounded transition-colors flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>พิมพ์รายงาน</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
