import React, { useState, useEffect, useRef } from 'react';
import { DashboardStats } from '../types/mwa';
import { affiliationsConfig, monthsConfig } from '../config/optionsData';
import { departmentData } from '../mock/departmentData';
import { mwaService } from '../services/mwaService';
import { CheckCircle2, Clock, Search, ChevronDown, Check } from 'lucide-react';

// Use the canonical fiscal-year month labels (month + Buddhist year).
// This prevents the Dashboard from mixing the same month across different years.
const standardMonths: string[] = monthsConfig;

// Match status records against the exact names supplied by the cascading Dropdown.
// A boolean/set-style match means repeated submissions never increase a unit's status count.
const normalizeStatusValue = (value?: string) =>
  (value || '').normalize('NFC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('th');

export const DashboardTabContent: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [affiliationFilter, setAffiliationFilter] = useState('');
  const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [statusRecords, setStatusRecords] = useState<Awaited<ReturnType<typeof mwaService.getCommunicationData>>>([]);
  const [statusLoadError, setStatusLoadError] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const affiliations = affiliationsConfig;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsMonthDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch stats on initial load
  useEffect(() => {
    handleSearch();
  }, []);

  const handleSearch = async () => {
    setIsSearching(true);
    try {
      const statsPromise = mwaService.getDashboardStats(selectedMonths, affiliationFilter);
      const statusPromise = mwaService.getDashboardStatusRecords();
      const [statsResult, statusResult] = await Promise.allSettled([statsPromise, statusPromise]);

      if (statsResult.status === 'fulfilled') {
        setStats(statsResult.value);
      } else {
        console.error('Failed to fetch dashboard stats:', statsResult.reason);
      }

      if (statusResult.status === 'fulfilled') {
        setStatusRecords(statusResult.value);
        setStatusLoadError(false);
      } else {
        console.error('Failed to fetch department submission status:', statusResult.reason);
        setStatusLoadError(true);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
      setStatusLoadError(true);
    } finally {
      setIsSearching(false);
    }
  };

  const toggleMonth = (month: string) => {
    setSelectedMonths((prev) =>
      prev.includes(month) ? prev.filter((m) => m !== month) : [...prev, month]
    );
  };

  const isAllSelected = selectedMonths.length === standardMonths.length;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedMonths([]);
    } else {
      setSelectedMonths([...standardMonths]);
    }
  };

  const selectQuarter = (qNumber: 1 | 2 | 3 | 4) => {
    // Fiscal year 2570: Q1 = Oct-Dec 2569, Q2 = Jan-Mar 2570,
    // Q3 = Apr-Jun 2570, Q4 = Jul-Sep 2570.
    const quarterMonths: Record<1 | 2 | 3 | 4, string[]> = {
      1: ['ตุลาคม 2569', 'พฤศจิกายน 2569', 'ธันวาคม 2569'],
      2: ['มกราคม 2570', 'กุมภาพันธ์ 2570', 'มีนาคม 2570'],
      3: ['เมษายน 2570', 'พฤษภาคม 2570', 'มิถุนายน 2570'],
      4: ['กรกฎาคม 2570', 'สิงหาคม 2570', 'กันยายน 2570']
    };
    setSelectedMonths(quarterMonths[qNumber]);
  };

  // Label for the month filter dropdown (conforms to Requirement 9)
  const getMonthFilterLabel = () => {
    if (selectedMonths.length === 0) {
      return 'เลือกเดือน';
    }
    if (selectedMonths.length === 1) {
      return selectedMonths[0];
    }
    if (selectedMonths.length === 2) {
      return `${selectedMonths[0]}, ${selectedMonths[1]}`;
    }
    if (selectedMonths.length === 3) {
      return '3 เดือนที่เลือก';
    }
    return `เลือกแล้ว ${selectedMonths.length} เดือน`;
  };

  return (
    <div className="space-y-6">
      {/* Dashboard Title Header */}
      <div className="bg-[#0054a6] text-white p-6 rounded-xl text-center shadow-xs">
        <h2 className="text-2xl font-bold m-0">
          📊 Dashboard - สรุปข้อมูลการสื่อสาร
        </h2>
      </div>

      {/* Controls: Multi-Month Filter, Affiliation Filter, and Search Button */}
      <div className="bg-[#f8f9fa] p-5 rounded-xl border border-slate-200">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
          {/* 1. Multi-Select Month Filter */}
          <div className="sm:col-span-5 relative" ref={dropdownRef}>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              เลือกเดือน
              {selectedMonths.length > 0 && (
                <span className="ml-2 text-xs font-normal text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
                  {selectedMonths.length} เดือน
                </span>
              )}
            </label>

            <button
              type="button"
              onClick={() => setIsMonthDropdownOpen((prev) => !prev)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-left text-sm flex items-center justify-between shadow-xs hover:border-slate-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 cursor-pointer"
            >
              <span className="truncate font-medium text-slate-800">
                {getMonthFilterLabel()}
              </span>
              <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isMonthDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Popover */}
            {isMonthDropdownOpen && (
              <div className="absolute top-full left-0 mt-1.5 w-full sm:w-[380px] bg-white border border-slate-200 rounded-xl shadow-xl z-30 p-3 animate-in fade-in zoom-in-95 duration-100">
                {/* Quick Presets */}
                <div className="flex flex-wrap gap-1.5 pb-2.5 mb-2 border-b border-slate-100">
                  <button
                    type="button"
                    onClick={() => selectQuarter(1)}
                    className="text-[11px] px-2 py-1 rounded bg-slate-100 hover:bg-sky-50 hover:text-sky-700 text-slate-700 font-medium transition-colors cursor-pointer"
                  >
                    ไตรมาส 1
                  </button>
                  <button
                    type="button"
                    onClick={() => selectQuarter(2)}
                    className="text-[11px] px-2 py-1 rounded bg-slate-100 hover:bg-sky-50 hover:text-sky-700 text-slate-700 font-medium transition-colors cursor-pointer"
                  >
                    ไตรมาส 2
                  </button>
                  <button
                    type="button"
                    onClick={() => selectQuarter(3)}
                    className="text-[11px] px-2 py-1 rounded bg-slate-100 hover:bg-sky-50 hover:text-sky-700 text-slate-700 font-medium transition-colors cursor-pointer"
                  >
                    ไตรมาส 3
                  </button>
                  <button
                    type="button"
                    onClick={() => selectQuarter(4)}
                    className="text-[11px] px-2 py-1 rounded bg-slate-100 hover:bg-sky-50 hover:text-sky-700 text-slate-700 font-medium transition-colors cursor-pointer"
                  >
                    ไตรมาส 4
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedMonths([])}
                    className="text-[11px] px-2 py-1 rounded bg-rose-50 text-rose-700 font-medium hover:bg-rose-100 transition-colors ml-auto cursor-pointer"
                  >
                    ล้างค่า
                  </button>
                </div>

                {/* Checkbox เลือกทั้งหมด (ตามข้อกำหนด 9) */}
                <label className="flex items-center gap-2.5 p-2 mb-1.5 border-b border-slate-100 rounded cursor-pointer text-xs font-semibold text-slate-800 hover:bg-slate-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleToggleSelectAll}
                    className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500 cursor-pointer"
                  />
                  <span>เลือกทั้งหมด</span>
                </label>

                {/* 12 Months Grid Checkboxes */}
                <div className="grid grid-cols-2 gap-1 max-h-56 overflow-y-auto pr-1">
                  {standardMonths.map((m) => {
                    const isChecked = selectedMonths.includes(m);
                    return (
                      <label
                        key={m}
                        className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer text-xs transition-colors ${
                          isChecked ? 'bg-sky-50 text-sky-900 font-semibold' : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleMonth(m)}
                          className="w-3.5 h-3.5 text-sky-600 rounded border-slate-300 focus:ring-sky-500 cursor-pointer"
                        />
                        <span>{m}</span>
                      </label>
                    );
                  })}
                </div>

                {/* Bottom Close */}
                <div className="mt-2.5 pt-2 border-t border-slate-100 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsMonthDropdownOpen(false)}
                    className="text-xs font-medium px-3.5 py-1.5 bg-[#0054a6] text-white rounded-md hover:bg-[#004080] cursor-pointer"
                  >
                    ตกลง
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 2. Affiliation Filter */}
          <div className="sm:col-span-4">
            <label htmlFor="dashboard-affiliation-filter" className="block text-sm font-semibold text-slate-700 mb-1.5">
              สายงาน
            </label>
            <select
              id="dashboard-affiliation-filter"
              value={affiliationFilter}
              onChange={(e) => setAffiliationFilter(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-sm font-medium text-slate-800 shadow-xs focus:ring-2 focus:ring-sky-500/20 cursor-pointer"
            >
              <option value="">ทุกสายงาน</option>
              {affiliations.map((aff) => (
                <option key={aff} value={aff}>
                  {aff}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Search Button (ปุ่มค้นหา พร้อมไอคอน Search ตามข้อกำหนด 6) */}
          <div className="sm:col-span-3">
            <button
              type="button"
              className="mwa-btn bg-[#0054a6] hover:bg-[#004080] text-white w-full flex items-center justify-center gap-2 py-2.5 px-4 shadow-sm font-semibold cursor-pointer"
              onClick={handleSearch}
              disabled={isSearching}
            >
              <Search className="w-4 h-4" />
              <span>{isSearching ? 'กำลังค้นหา...' : 'ค้นหา'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Summary Cards (คำนวณใหม่ตามตัวกรองจริง) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div
          className="text-white p-6 rounded-xl text-center shadow-md transition-transform hover:-translate-y-1"
          style={{ background: 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)' }}
        >
          <div className="text-3xl mb-2">📊</div>
          <div className="text-3xl font-bold mb-1 font-mono">{stats?.totalReports ?? 0}</div>
          <div className="text-sm opacity-90">รายงานทั้งหมด</div>
        </div>

        {/* Card 2 */}
        <div
          className="text-white p-6 rounded-xl text-center shadow-md transition-transform hover:-translate-y-1"
          style={{ background: 'linear-gradient(135deg, #27ae60 0%, #229954 100%)' }}
        >
          <div className="text-3xl mb-2">✅</div>
          <div className="text-3xl font-bold mb-1 font-mono">{stats?.completedDepartments ?? 0}</div>
          <div className="text-sm opacity-90">สายงานที่ส่งรายงาน</div>
        </div>

        {/* Card 3 */}
        <div
          className="text-white p-6 rounded-xl text-center shadow-md transition-transform hover:-translate-y-1"
          style={{ background: 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)' }}
        >
          <div className="text-3xl mb-2">⏳</div>
          <div className="text-3xl font-bold mb-1 font-mono">{stats?.pendingDepartments ?? 0}</div>
          <div className="text-sm opacity-90">สายงานที่ยังไม่ส่ง</div>
        </div>

        {/* Card 4 */}
        <div
          className="text-white p-6 rounded-xl text-center shadow-md transition-transform hover:-translate-y-1"
          style={{ background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)' }}
        >
          <div className="text-3xl mb-2">📈</div>
          <div className="text-3xl font-bold mb-1 font-mono">{stats?.completionRate ?? '0.0%'}</div>
          <div className="text-sm opacity-90">อัตราการส่งรายงาน</div>
        </div>
      </div>

      {/* Popular Topics */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <h3 className="font-semibold text-slate-800 text-base mb-4 pb-2 border-b border-slate-100">
            ประเด็นการสื่อสารยอดนิยม
          </h3>
          <div className="space-y-3">
            {stats?.topicStats && stats.topicStats.length > 0 ? (
              stats.topicStats.map((top, idx) => (
                <div key={top.topic} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-[#0054a6] text-white flex items-center justify-center text-xs font-bold font-mono">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-medium text-slate-800 truncate max-w-[280px]">
                      {top.topic}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded shrink-0">
                    {top.count} ครั้ง
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-slate-400 text-xs italic">
                - ไม่มีข้อมูลประเด็นสำหรับตัวกรองที่เลือก -
              </div>
            )}
          </div>
      </div>

      {/* Department Status List */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <h3 className="font-semibold text-slate-800 text-base mb-4 pb-2 border-b border-slate-100">
          สถานะการส่งรายหน่วยงาน (ตาม Filter)
        </h3>
        {statusLoadError ? (
          <div role="alert" className="py-6 text-center text-sm text-red-600">
            ไม่สามารถโหลดสถานะจากข้อมูลรายงานได้ กรุณากดค้นหาอีกครั้ง
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto pr-2 divide-y divide-slate-100">
            {(affiliationFilter ? [affiliationFilter] : affiliations).map((aff) => {
              const depts = departmentData[aff] || [];
              return (
                <div key={aff} className="py-3">
                  <div className="font-semibold text-xs text-[#0054a6] mb-2">{aff}</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {depts.map((department) => {
                      // Use Dropdown's canonical affiliation/department labels. A department is
                      // marked submitted once if any matching report exists in the selected month(s).
                      const departmentKey = normalizeStatusValue(department);
                      const affiliationKey = normalizeStatusValue(aff);
                      const selectedMonthKeys = new Set(selectedMonths.map(normalizeStatusValue));
                      const isSubmitted = statusRecords.some((record) => {
                        const matchesAffiliation = normalizeStatusValue(record.recorderAffiliation) === affiliationKey;
                        const matchesDepartment = normalizeStatusValue(record.recorderDepartment) === departmentKey;
                        const matchesMonth = selectedMonthKeys.size === 0 || selectedMonthKeys.has(normalizeStatusValue(record.month));
                        return matchesAffiliation && matchesDepartment && matchesMonth;
                      });

                      return (
                        <div key={department} className="flex items-center gap-2 text-xs py-1">
                          {isSubmitted ? (
                            <CheckCircle2 aria-label="ส่งแล้ว" className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <Clock aria-label="รอส่ง" className="w-4 h-4 text-amber-500 shrink-0" />
                          )}
                          <span className={isSubmitted ? 'text-slate-800' : 'text-slate-400 italic'}>
                            {department}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
