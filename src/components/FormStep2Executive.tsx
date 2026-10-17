import React, { useState, useRef } from 'react';
import { ExecutiveInfo } from '../types/mwa';
import { useFormOptions } from '../hooks/useFormOptions';
import { Info, AlertCircle, Sparkles, Check, RotateCcw } from 'lucide-react';
import { getSuggestedExecutivePosition } from '../utils/executivePositionHelper';

interface FormStep2ExecutiveProps {
  data: ExecutiveInfo;
  isDefaultFromRecorder?: boolean;
  onChange: (field: keyof ExecutiveInfo, value: string) => void;
  onPrev: () => void;
  onNext: () => void;
}

export const FormStep2Executive: React.FC<FormStep2ExecutiveProps> = ({
  data,
  isDefaultFromRecorder = false,
  onChange,
  onPrev,
  onNext
}) => {
  const {
    months,
    executiveTitles,
    executivePositions,
    affiliations,
    getDepartments
  } = useFormOptions();

  const availableDepartments = getDepartments(data.affiliation);

  // Track if user has manually typed / customized the executive position
  const [isUserEdited, setIsUserEdited] = useState<boolean>(() => {
    if (!data.position || !data.position.trim()) return false;
    const initialSuggested = getSuggestedExecutivePosition(data.department, data.affiliation);
    return Boolean(initialSuggested && data.position.trim() !== initialSuggested.trim());
  });

  const lastAutoSuggestedRef = useRef<string>(
    getSuggestedExecutivePosition(data.department, data.affiliation)
  );

  // Inline Validation Errors
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleAffiliationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newAffiliation = e.target.value;
    onChange('affiliation', newAffiliation);
    onChange('department', '');
    if (errors.affiliation) {
      setErrors((prev) => ({ ...prev, affiliation: '', department: '' }));
    }

    // If position was an auto-suggested value, adjust for special affiliation like "สายงานผู้ว่าการ"
    if (!isUserEdited || data.position === lastAutoSuggestedRef.current) {
      if (newAffiliation === 'สายงานผู้ว่าการ') {
        onChange('position', 'ผู้ว่าการ');
        lastAutoSuggestedRef.current = 'ผู้ว่าการ';
        setIsUserEdited(false);
      }
    }
  };

  const handleDepartmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDept = e.target.value;
    onChange('department', newDept);
    if (errors.department) {
      setErrors((prev) => ({ ...prev, department: '' }));
    }

    if (newDept) {
      const suggested = getSuggestedExecutivePosition(newDept, data.affiliation);
      // 1. ถ้าผู้ใช้ยังไม่ได้กรอกตำแหน่งผู้บริหาร -> เมื่อเลือกหน่วยงาน ให้ระบบแนะนำ/เติมตำแหน่งให้
      // 2. ถ้าผู้ใช้แก้ไขตำแหน่งผู้บริหารเองแล้ว -> ห้ามเขียนทับค่าที่ผู้ใช้แก้ไข
      // 3. ถ้าผู้ใช้เปลี่ยนหน่วยงานภายหลัง -> หากตำแหน่งเดิมเป็นค่าที่ระบบ Auto Suggest ให้ปรับคำแนะนำตามหน่วยงานใหม่ -> แต่ถ้าผู้ใช้แก้ไขเองแล้ว ห้ามเขียนทับ
      const isCurrentAutoSuggested =
        !data.position.trim() ||
        !isUserEdited ||
        data.position === lastAutoSuggestedRef.current;

      if (isCurrentAutoSuggested && suggested) {
        onChange('position', suggested);
        lastAutoSuggestedRef.current = suggested;
        setIsUserEdited(false);
        if (errors.position) {
          setErrors((prev) => ({ ...prev, position: '' }));
        }
      }
    }
  };

  const handlePositionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange('position', val);
    if (errors.position) {
      setErrors((prev) => ({ ...prev, position: '' }));
    }

    const currentSuggested = getSuggestedExecutivePosition(data.department, data.affiliation);
    if (currentSuggested && val === currentSuggested) {
      setIsUserEdited(false);
      lastAutoSuggestedRef.current = currentSuggested;
    } else {
      setIsUserEdited(true);
    }
  };

  const handleSelectSuggestedPosition = (pos: string) => {
    onChange('position', pos);
    const currentSuggested = getSuggestedExecutivePosition(data.department, data.affiliation);
    if (pos === currentSuggested) {
      setIsUserEdited(false);
      lastAutoSuggestedRef.current = currentSuggested;
    } else {
      setIsUserEdited(true);
    }
    if (errors.position) {
      setErrors((prev) => ({ ...prev, position: '' }));
    }
  };

  const currentSuggested = getSuggestedExecutivePosition(data.department, data.affiliation);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    if (!data.month) newErrors.month = 'กรุณาเลือกเดือนที่ทำการสื่อสาร';
    if (!data.name.trim()) newErrors.name = 'กรุณากรอกชื่อผู้บริหาร';
    if (!data.surname.trim()) newErrors.surname = 'กรุณากรอกนามสกุลผู้บริหาร';
    if (!data.position.trim()) newErrors.position = 'กรุณากรอกตำแหน่งผู้บริหาร';
    if (!data.affiliation) newErrors.affiliation = 'กรุณาเลือกสายงาน';
    if (!data.department) newErrors.department = 'กรุณาเลือกหน่วยงาน';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    onNext();
  };

  // Distinct executive options list
  const allExecutivePositions = Array.from(
    new Set([
      ...(currentSuggested ? [currentSuggested] : []),
      'ผู้อำนวยการฝ่าย',
      'ผู้จัดการสำนักงานประปาสาขา',
      'ผู้ช่วยผู้ว่าการ',
      'รองผู้ว่าการ',
      'ผู้ว่าการ',
      ...executivePositions
    ])
  );

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="mwa-form-section">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 mb-3 border-b border-slate-100 gap-2">
          <h3 className="mb-0">2. ข้อมูลผู้บริหาร</h3>
          {isDefaultFromRecorder && (data.affiliation || data.department) && (
            <div className="text-[11px] text-sky-700 bg-sky-50 px-2.5 py-1 rounded border border-sky-200 inline-flex items-center gap-1.5 self-start sm:self-auto font-medium">
              <Info className="w-3.5 h-3.5 text-sky-600 shrink-0" />
              <span>ค่าเริ่มต้นจากข้อมูลผู้บันทึก สามารถเปลี่ยนแปลงได้</span>
            </div>
          )}
        </div>

        {/* Global inline alert if errors exist */}
        {Object.keys(errors).length > 0 && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>กรุณากรอกข้อมูลผู้บริหารให้ครบถ้วนทุกช่องที่มีเครื่องหมายดอกจัน (*) ก่อนดำเนินการต่อ</span>
          </div>
        )}

        {/* เดือนที่ทำการสื่อสาร */}
        <div className="mwa-form-group">
          <label htmlFor="communication-month">เดือนที่ทำการสื่อสาร *</label>
          <select
            id="communication-month"
            required
            className={errors.month ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200' : ''}
            value={data.month}
            onChange={(e) => {
              onChange('month', e.target.value);
              if (errors.month) setErrors((prev) => ({ ...prev, month: '' }));
            }}
          >
            <option value="">กรุณาเลือกเดือนที่ทำการสื่อสาร</option>
            {months.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          {errors.month && <span className="text-[11px] text-rose-600 mt-1 block">{errors.month}</span>}
        </div>

        {/* Row 1: คำนำหน้า, ชื่อผู้บริหาร, นามสกุลผู้บริหาร */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4">
          {/* คำนำหน้า */}
          <div className="md:col-span-3">
            <label htmlFor="executive-title" className="block text-xs font-bold text-slate-800 mb-1.5">
              คำนำหน้า
            </label>
            <select
              id="executive-title"
              value={data.title || 'นาย'}
              onChange={(e) => onChange('title', e.target.value)}
              className="w-full text-xs p-2.5 border border-slate-300 rounded bg-white text-slate-800 focus:outline-none focus:border-[#0054a6]"
            >
              {executiveTitles.map((title) => (
                <option key={title} value={title}>
                  {title}
                </option>
              ))}
            </select>
          </div>

          {/* ชื่อผู้บริหาร */}
          <div className="md:col-span-4">
            <label htmlFor="executive-name" className="block text-xs font-bold text-slate-800 mb-1.5">
              ชื่อผู้บริหาร *
            </label>
            <input
              type="text"
              id="executive-name"
              placeholder="กรุณากรอกชื่อผู้บริหาร"
              required
              className={`w-full text-xs p-2.5 border rounded bg-white text-slate-800 focus:outline-none ${
                errors.name ? 'border-rose-400 focus:border-rose-500' : 'border-slate-300 focus:border-[#0054a6]'
              }`}
              value={data.name}
              onChange={(e) => {
                onChange('name', e.target.value);
                if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
              }}
            />
            {errors.name && <span className="text-[11px] text-rose-600 mt-1 block">{errors.name}</span>}
          </div>

          {/* นามสกุลผู้บริหาร */}
          <div className="md:col-span-5">
            <label htmlFor="executive-surname" className="block text-xs font-bold text-slate-800 mb-1.5">
              นามสกุลผู้บริหาร *
            </label>
            <input
              type="text"
              id="executive-surname"
              placeholder="กรุณากรอกนามสกุลผู้บริหาร"
              required
              className={`w-full text-xs p-2.5 border rounded bg-white text-slate-800 focus:outline-none ${
                errors.surname ? 'border-rose-400 focus:border-rose-500' : 'border-slate-300 focus:border-[#0054a6]'
              }`}
              value={data.surname}
              onChange={(e) => {
                onChange('surname', e.target.value);
                if (errors.surname) setErrors((prev) => ({ ...prev, surname: '' }));
              }}
            />
            {errors.surname && <span className="text-[11px] text-rose-600 mt-1 block">{errors.surname}</span>}
          </div>
        </div>

        {/* Row 2: สายงาน, หน่วยงาน */}
        <div className="mwa-form-row">
          <div className="mwa-form-group">
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="executive-affiliation" className="mb-0 text-xs font-bold text-slate-800">
                สายงานของผู้บริหาร *
              </label>
              {isDefaultFromRecorder && (data.affiliation || data.department) && (
                <span className="text-[10px] text-slate-500 italic">
                  (ค่าเริ่มต้นจากผู้บันทึก)
                </span>
              )}
            </div>
            <select
              id="executive-affiliation"
              required
              className={errors.affiliation ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200' : ''}
              value={data.affiliation}
              onChange={handleAffiliationChange}
            >
              <option value="">เลือกสายงาน</option>
              {affiliations.map((aff) => (
                <option key={aff} value={aff}>
                  {aff}
                </option>
              ))}
            </select>
            {errors.affiliation && <span className="text-[11px] text-rose-600 mt-1 block">{errors.affiliation}</span>}
          </div>

          <div className="mwa-form-group">
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="executive-department" className="mb-0 text-xs font-bold text-slate-800">
                หน่วยงานของผู้บริหาร *
              </label>
              {isDefaultFromRecorder && (data.affiliation || data.department) && (
                <span className="text-[10px] text-slate-500 italic">
                  (ค่าเริ่มต้นจากผู้บันทึก)
                </span>
              )}
            </div>
            <select
              id="executive-department"
              required
              disabled={!data.affiliation}
              className={errors.department ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200' : ''}
              value={data.department}
              onChange={handleDepartmentChange}
            >
              <option value="">
                {data.affiliation ? 'เลือกหน่วยงาน' : 'เลือกสายงานก่อน'}
              </option>
              {availableDepartments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
            {errors.department && <span className="text-[11px] text-rose-600 mt-1 block">{errors.department}</span>}
          </div>
        </div>

        {/* Row 3: ตำแหน่งผู้บริหาร (Auto Suggest จากหน่วยงาน + ผู้ใช้แก้ไขได้) */}
        <div className="mwa-form-group">
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="executive-position" className="text-xs font-bold text-slate-800 mb-0">
              ตำแหน่งผู้บริหาร *
            </label>
            <span className="text-[10px] font-medium text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
              แนะนำจากหน่วยงาน • แก้ไขได้
            </span>
          </div>
          <input
            type="text"
            id="executive-position"
            list="executive-positions-list"
            placeholder="เช่น ผู้อำนวยการฝ่าย..., ผู้จัดการสำนักงานประปาสาขา..., ผู้ว่าการ"
            required
            autoComplete="off"
            className={`w-full text-xs p-2.5 border rounded bg-white text-slate-800 focus:outline-none ${
              errors.position ? 'border-rose-400 focus:border-rose-500' : 'border-slate-300 focus:border-[#0054a6]'
            }`}
            value={data.position}
            onChange={handlePositionChange}
          />
          <datalist id="executive-positions-list">
            {allExecutivePositions.map((pos) => (
              <option key={pos} value={pos} />
            ))}
          </datalist>
          {errors.position && <span className="text-[11px] text-rose-600 mt-1 block">{errors.position}</span>}

          {/* Auto Suggest Helper Text & Feedback */}
          <div className="mt-2 space-y-1.5">
            <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-sky-600 shrink-0" />
              <span>ระบบแนะนำตำแหน่งผู้บริหารจากหน่วยงานที่เลือก สามารถแก้ไขได้</span>
            </p>

            {/* Status indicator: Auto-suggested vs User-customized */}
            {currentSuggested && !isUserEdited && data.position === currentSuggested && (
              <div className="text-[11px] text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 inline-flex items-center gap-1.5 font-medium">
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>ตำแหน่งแนะนำอัตโนมัติตามหน่วยงาน: <strong>{currentSuggested}</strong></span>
              </div>
            )}

            {isUserEdited && (
              <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] text-amber-800 bg-amber-50 px-2.5 py-1.5 rounded border border-amber-200">
                <span className="flex items-center gap-1">
                  <span>✏️ คุณได้แก้ไขตำแหน่งนี้เอง (ระบบจะไม่เขียนทับค่านี้เมื่อเปลี่ยนหน่วยงาน)</span>
                </span>
                {currentSuggested && data.position !== currentSuggested && (
                  <button
                    type="button"
                    onClick={() => handleSelectSuggestedPosition(currentSuggested)}
                    className="text-sky-700 hover:text-sky-900 underline font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>คืนค่าเป็นตำแหน่งแนะนำ (&ldquo;{currentSuggested}&rdquo;)</span>
                  </button>
                )}
              </div>
            )}

            {/* Quick Suggestions for Executive Ranks */}
            <div className="pt-1 flex flex-wrap items-center gap-1.5 text-[11px]">
              <span className="text-slate-500 text-[10px]">ระดับตำแหน่งผู้บริหาร:</span>
              {['ผู้อำนวยการฝ่าย', 'ผู้จัดการสำนักงานประปาสาขา', 'ผู้ช่วยผู้ว่าการ', 'รองผู้ว่าการ', 'ผู้ว่าการ'].map((rank) => (
                <button
                  key={rank}
                  type="button"
                  onClick={() => handleSelectSuggestedPosition(rank)}
                  className={`px-2 py-0.5 rounded text-[10px] border transition-colors cursor-pointer ${
                    data.position === rank
                      ? 'bg-sky-100 text-sky-800 border-sky-300 font-semibold'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {rank}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <button
          type="button"
          className="mwa-btn mwa-btn-warning"
          onClick={onPrev}
        >
          ย้อนกลับ
        </button>
        <button type="submit" className="mwa-btn mwa-btn-primary">
          ถัดไป
        </button>
      </div>
    </form>
  );
};

