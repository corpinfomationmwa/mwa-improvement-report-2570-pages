import React, { useState, useEffect } from 'react';
import { ReportRecord, RecorderInfo, ExecutiveInfo, CommunicationTopicItem, FeedbackInfo } from '../types/mwa';
import { useFormOptions } from '../hooks/useFormOptions';
import { mwaService } from '../services/mwaService';
import { openNativePrintPreview } from '../utils/mwaPrintHelper';
import { Eye, Printer, Search, FileText, ChevronLeft, ChevronRight } from 'lucide-react';

interface DataTabContentProps {
  onPrintRecord?: (record: ReportRecord) => void;
}

const ITEMS_PER_PAGE = 15;

export const DataTabContent: React.FC<DataTabContentProps> = ({ onPrintRecord }) => {
  const { months, affiliations, getDepartments } = useFormOptions();
  const [data, setData] = useState<ReportRecord[]>([]);
  const [monthFilter, setMonthFilter] = useState('');
  const [affiliationFilter, setAffiliationFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [searchText, setSearchText] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<ReportRecord | null>(null);

  // Pagination state (15 items per page)
  const [currentPage, setCurrentPage] = useState<number>(1);

  const departments = getDepartments(affiliationFilter);

  const handlePrintRecord = (record: ReportRecord) => {
    console.log('PDF PRINT BUTTON CLICKED:', record);
    if (onPrintRecord) {
      onPrintRecord(record);
    } else {
      openNativePrintPreview(record);
    }
  };

  const handleSearch = async () => {
    // Reset to page 1 on new search or filter execution
    setCurrentPage(1);
    const records = await mwaService.getCommunicationData({
      month: monthFilter,
      affiliation: affiliationFilter,
      department: departmentFilter,
      searchText: searchText
    });
    setData(records);
  };

  useEffect(() => {
    handleSearch();
  }, []);

  // Compute pagination values dynamically from current data
  const totalItems = data.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));

  // Guard against currentPage out-of-bounds when data changes
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentItems = data.slice(startIndex, endIndex);

  const startItemDisplay = totalItems > 0 ? startIndex + 1 : 0;
  const endItemDisplay = Math.min(startIndex + ITEMS_PER_PAGE, totalItems);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Filter Section */}
      <div className="mwa-form-section">
        <h3>ค้นหาและกรองข้อมูล</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="mwa-form-group">
            <label htmlFor="search-month">เลือกเดือน</label>
            <select
              id="search-month"
              value={monthFilter}
              onChange={(e) => {
                setMonthFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">ทุกเดือน</option>
              {months.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="mwa-form-group">
            <label htmlFor="search-affiliation">สายงาน</label>
            <select
              id="search-affiliation"
              value={affiliationFilter}
              onChange={(e) => {
                setAffiliationFilter(e.target.value);
                setDepartmentFilter('');
                setCurrentPage(1);
              }}
            >
              <option value="">ทุกสายงาน</option>
              {affiliations.map((aff) => (
                <option key={aff} value={aff}>
                  {aff}
                </option>
              ))}
            </select>
          </div>

          <div className="mwa-form-group">
            <label htmlFor="search-department">หน่วยงาน</label>
            <select
              id="search-department"
              disabled={!affiliationFilter}
              value={departmentFilter}
              onChange={(e) => {
                setDepartmentFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">ทุกหน่วยงาน</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          <div className="mwa-form-group">
            <label htmlFor="search-text">ค้นหาข้อมูล</label>
            <input
              type="text"
              id="search-text"
              placeholder="ค้นหาจากชื่อผู้บริหาร, ประเด็น..."
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value);
                setCurrentPage(1);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
            />
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '15px' }}>
          <button
            type="button"
            className="mwa-btn mwa-btn-primary"
            onClick={handleSearch}
          >
            <Search className="w-4 h-4" />
            <span>ค้นหา</span>
          </button>
        </div>
      </div>

      {/* Table & Pagination Container */}
      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-2xs">
        <div className="overflow-x-auto" style={{ minHeight: '300px' }}>
          <table className="w-full text-left text-xs border-collapse min-w-[1100px]">
            <thead style={{ background: '#34495e', color: 'white' }}>
              <tr>
                <th className="py-3 px-3 text-center w-14">ลำดับ</th>
                <th className="py-3 px-3 text-center min-w-[110px]">เดือน</th>
                <th className="py-3 px-4 min-w-[180px]">ผู้ถ่ายทอดสาร</th>
                <th className="py-3 px-4 min-w-[220px]">ประเด็นการสื่อสาร</th>
                <th className="py-3 px-4 min-w-[170px]">ช่องทาง</th>
                <th className="py-3 px-4 min-w-[170px]">ผู้รับสาร</th>
                <th className="py-3 px-3 text-center min-w-[110px]">หลักฐาน</th>
                <th className="py-3 px-4 min-w-[140px]">ผู้บันทึก</th>
                <th className="py-3 px-3 text-center min-w-[100px]">วันที่บันทึก</th>
                <th className="py-3 px-3 text-center min-w-[110px]">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500">
                    <h4 className="text-sm font-semibold mb-1">ไม่พบข้อมูลที่ค้นหา</h4>
                    <p className="text-xs text-slate-400">ลองปรับเปลี่ยนเงื่อนไขการค้นหาแล้วกดปุ่มค้นหา</p>
                  </td>
                </tr>
              ) : (
                currentItems.map((row, idx) => (
                  <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-3 text-center font-medium text-slate-600">
                      {startIndex + idx + 1}
                    </td>
                    <td className="py-3 px-3 text-center whitespace-nowrap text-slate-700">
                      {row.month}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900">
                      <div>{row.speaker}</div>
                      <div className="text-[11px] text-slate-500">{row.speakerPosition}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-800">
                      {row.topics}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {row.channel}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {row.audience}
                    </td>
                    <td className="py-3 px-3 text-center text-sky-700 whitespace-nowrap">
                      {row.evidence}
                    </td>
                    <td className="py-3 px-4 text-slate-700 whitespace-nowrap">
                      {row.recorder}
                    </td>
                    <td className="py-3 px-3 text-center font-mono text-slate-500 whitespace-nowrap">
                      {row.recordDate}
                    </td>
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5 justify-center">
                        <button
                          type="button"
                          onClick={() => setSelectedRecord(row)}
                          className="p-1.5 bg-[#17a2b8] text-white rounded hover:opacity-90 transition-opacity"
                          title="ดูรายละเอียด"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePrintRecord(row)}
                          className="p-1.5 bg-[#2c3e50] text-white rounded hover:opacity-90 transition-opacity"
                          title="ดูตัวอย่าง PDF / พิมพ์รายงาน"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar Controls */}
        <div className="p-3.5 border-t border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600 gap-3">
          {/* ข้อ 4: แสดงจำนวนรายการ เช่น “แสดง 1–15 จากทั้งหมด 32 รายการ” */}
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

          {/* ข้อ 3 & ข้อ 5: เพิ่มปุ่ม “ก่อนหน้า” และ “ถัดไป” พร้อมแสดงเลขหน้าปัจจุบัน เช่น “หน้า 1 จาก 3” */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors font-medium shadow-2xs"
              title="ก่อนหน้า"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>ก่อนหน้า</span>
            </button>

            <span className="px-3 py-1.5 text-slate-700 font-medium whitespace-nowrap bg-white rounded border border-slate-200 shadow-2xs">
              หน้า <strong className="text-slate-900 font-semibold">{currentPage}</strong> จาก{' '}
              <strong className="text-slate-900 font-semibold">{totalPages}</strong>
            </span>

            <button
              type="button"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages || totalItems === 0}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors font-medium shadow-2xs"
              title="ถัดไป"
            >
              <span>ถัดไป</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Detail Modal Preview */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-base text-[#2c3e50]">
                รายละเอียดการสื่อสาร - ประจำเดือน {selectedRecord.month}
              </h3>
              <button
                onClick={() => setSelectedRecord(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded">
                <div>
                  <span className="font-semibold block text-slate-500">ผู้ถ่ายทอดสาร:</span>
                  <span className="font-medium text-slate-900">{selectedRecord.speaker}</span> ({selectedRecord.speakerPosition})
                </div>
                <div>
                  <span className="font-semibold block text-slate-500">สังกัด:</span>
                  <span>{selectedRecord.speakerAffiliation} / {selectedRecord.speakerDepartment}</span>
                </div>
              </div>

              <div>
                <span className="font-semibold block text-slate-500 mb-1">ประเด็นการสื่อสาร:</span>
                <p className="p-2.5 bg-sky-50 text-sky-900 rounded font-medium">{selectedRecord.topics}</p>
              </div>

              <div>
                <span className="font-semibold block text-slate-500 mb-1">รายละเอียดเนื้อหา:</span>
                <p className="p-2.5 bg-slate-50 rounded leading-relaxed">{selectedRecord.details || '-'}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="font-semibold block text-slate-500">ช่องทางการสื่อสาร:</span>
                  <span>{selectedRecord.channel}</span>
                </div>
                <div>
                  <span className="font-semibold block text-slate-500">กลุ่มผู้รับสาร:</span>
                  <span>{selectedRecord.audience}</span>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-3">
                <span className="font-semibold block text-slate-500">ปัญหาและอุปสรรค:</span>
                <p className="text-slate-600">{selectedRecord.problems || '-'}</p>
              </div>

              <div>
                <span className="font-semibold block text-slate-500">ข้อเสนอแนะ:</span>
                <p className="text-slate-600">{selectedRecord.suggestions || '-'}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <button
                type="button"
                className="mwa-btn bg-[#2c3e50] hover:bg-[#1a252f] text-white flex items-center gap-1.5"
                onClick={() => handlePrintRecord(selectedRecord)}
              >
                <Printer className="w-3.5 h-3.5 text-sky-400" />
                <span>ดูตัวอย่าง PDF / พิมพ์</span>
              </button>

              <button
                type="button"
                className="mwa-btn mwa-btn-primary"
                onClick={() => setSelectedRecord(null)}
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
