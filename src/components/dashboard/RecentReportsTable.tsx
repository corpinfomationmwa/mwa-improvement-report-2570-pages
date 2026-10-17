import React, { useState, useEffect } from 'react';
import { Eye, Edit3, Search, Filter, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { ReportItem, ReportStatus } from '../../types/report';
import { StatusBadge } from '../common/StatusBadge';

interface RecentReportsTableProps {
  reports: ReportItem[];
  onViewDetail: (report: ReportItem) => void;
  onEdit: (report: ReportItem) => void;
}

const ITEMS_PER_PAGE = 15;

export const RecentReportsTable: React.FC<RecentReportsTableProps> = ({
  reports,
  onViewDetail,
  onEdit
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Filtered reports
  const filteredReports = reports.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.reporter.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Calculate pagination
  const totalItems = filteredReports.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));

  // Auto-adjust page if current page exceeds total pages
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentReports = filteredReports.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const startItemDisplay = totalItems > 0 ? startIndex + 1 : 0;
  const endItemDisplay = Math.min(startIndex + ITEMS_PER_PAGE, totalItems);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs">
      {/* Table Header Controls */}
      <div className="p-4 border-b border-slate-200 bg-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-slate-800">
              รายงานล่าสุด
            </h2>
            <span className="text-xs text-slate-400 font-mono">
              ({filteredReports.length} รายการ)
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="ค้นหาเลขที่, ชื่อเรื่อง, หน่วยงาน..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#005696] focus:border-[#005696]"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="appearance-none bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded px-3 py-1.5 pr-8 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#005696]"
              >
                <option value="all">สถานะทั้งหมด</option>
                <option value="draft">ร่าง</option>
                <option value="submitted">ส่งแล้ว</option>
                <option value="under_review">อยู่ระหว่างตรวจสอบ</option>
                <option value="approved">อนุมัติแล้ว</option>
                <option value="returned">ส่งกลับแก้ไข</option>
              </select>
              <Filter className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Table Surface */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold">
              <th className="py-3 px-4 whitespace-nowrap">เลขที่รายงาน</th>
              <th className="py-3 px-4 min-w-[260px]">ชื่อเรื่อง</th>
              <th className="py-3 px-4 whitespace-nowrap">หน่วยงาน</th>
              <th className="py-3 px-4 whitespace-nowrap">ผู้รายงาน</th>
              <th className="py-3 px-4 whitespace-nowrap">วันที่</th>
              <th className="py-3 px-4 whitespace-nowrap text-center">สถานะ</th>
              <th className="py-3 px-4 whitespace-nowrap text-right">การดำเนินการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredReports.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                  ไม่พบข้อมูลรายงานตามเงื่อนไขที่ระบุ
                </td>
              </tr>
            ) : (
              currentReports.map((report) => (
                <tr
                  key={report.id}
                  className="hover:bg-sky-50/40 transition-colors group"
                >
                  {/* เลขที่รายงาน */}
                  <td className="py-3.5 px-4 font-mono font-medium text-[#005696] whitespace-nowrap">
                    {report.id}
                  </td>

                  {/* ชื่อเรื่อง */}
                  <td className="py-3.5 px-4 font-medium text-slate-900">
                    <span 
                      onClick={() => onViewDetail(report)}
                      className="cursor-pointer hover:text-[#005696] transition-colors line-clamp-2"
                      title={report.title}
                    >
                      {report.title}
                    </span>
                  </td>

                  {/* หน่วยงาน */}
                  <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                    {report.department}
                  </td>

                  {/* ผู้รายงาน */}
                  <td className="py-3.5 px-4 text-slate-700 whitespace-nowrap font-normal">
                    {report.reporter}
                  </td>

                  {/* วันที่ */}
                  <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap font-mono tabular-nums">
                    {report.date}
                  </td>

                  {/* สถานะ */}
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <StatusBadge status={report.status} />
                  </td>

                  {/* การดำเนินการ */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-1.5 justify-end">
                      <button
                        onClick={() => onViewDetail(report)}
                        className="px-2.5 py-1 text-xs font-medium text-[#005696] hover:bg-sky-50 rounded transition-colors inline-flex items-center gap-1"
                        title="ดูรายละเอียด"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>ดูรายละเอียด</span>
                      </button>

                      <button
                        onClick={() => onEdit(report)}
                        className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors inline-flex items-center gap-1"
                        title="แก้ไข"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>แก้ไข</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer info with Pagination */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
        <div>
          {totalItems > 0 ? (
            <span>
              แสดง <strong className="font-semibold text-slate-800">{startItemDisplay}–{endItemDisplay}</strong> จากทั้งหมด{' '}
              <strong className="font-semibold text-slate-800">{totalItems}</strong> รายการ
            </span>
          ) : (
            <span>แสดง 0 รายการ</span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors shadow-2xs"
            title="ก่อนหน้า"
          >
            <ChevronLeft className="w-3 h-3" />
            <span>ก่อนหน้า</span>
          </button>

          <span className="px-2.5 py-1 text-xs text-slate-700 font-medium whitespace-nowrap bg-white rounded border border-slate-200 shadow-2xs">
            หน้า <strong className="text-slate-900 font-semibold">{currentPage}</strong> จาก{' '}
            <strong className="text-slate-900 font-semibold">{totalPages}</strong>
          </span>

          <button
            type="button"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages || totalItems === 0}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors shadow-2xs"
            title="ถัดไป"
          >
            <span>ถัดไป</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
