import React, { useState, useRef, useEffect } from 'react';
import { RecorderInfo, RecorderProfile } from '../types/mwa';
import { useFormOptions } from '../hooks/useFormOptions';
import { mockRecorderProfiles } from '../mock/recorderProfiles';
import { UserCheck, AlertCircle, Sparkles } from 'lucide-react';

interface FormStep1RecorderProps {
  data: RecorderInfo;
  onChange: (field: keyof RecorderInfo, value: string) => void;
  onProfileSelect: (profile: RecorderProfile) => void;
  onNext: () => void;
}

export const FormStep1Recorder: React.FC<FormStep1RecorderProps> = ({
  data,
  onChange,
  onProfileSelect,
  onNext
}) => {
  const { affiliations, getDepartments, recorderPositions, executiveTitles } = useFormOptions();
  const availableDepartments = getDepartments(data.affiliation);

  // Name Autocomplete state
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<RecorderProfile[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Position Autocomplete / Word Suggestion state
  const [showPositionSuggestions, setShowPositionSuggestions] = useState(false);
  const [positionSuggestions, setPositionSuggestions] = useState<string[]>([]);
  const [highlightedPositionIndex, setHighlightedPositionIndex] = useState<number>(-1);
  const positionDropdownRef = useRef<HTMLDivElement>(null);

  // Inline Validation Errors
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
      if (positionDropdownRef.current && !positionDropdownRef.current.contains(event.target as Node)) {
        setShowPositionSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange('name', val);
    if (errors.name) {
      setErrors((prev) => ({ ...prev, name: '' }));
    }

    if (val.trim().length > 0) {
      const q = val.trim().toLowerCase();
      const filtered = mockRecorderProfiles.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.surname.toLowerCase().includes(q) ||
          `${p.name} ${p.surname}`.toLowerCase().includes(q)
      );
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectProfile = (profile: RecorderProfile) => {
    onProfileSelect(profile);
    setShowSuggestions(false);
    setShowPositionSuggestions(false);
    setErrors({});
  };

  const handlePositionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange('position', val);
    if (errors.position) {
      setErrors((prev) => ({ ...prev, position: '' }));
    }

    if (val.trim().length > 0) {
      const q = val.trim().toLowerCase();
      const filtered = recorderPositions.filter((pos) =>
        pos.toLowerCase().includes(q)
      );
      setPositionSuggestions(filtered);
      setShowPositionSuggestions(filtered.length > 0);
      setHighlightedPositionIndex(0);
    } else {
      setPositionSuggestions(recorderPositions.slice(0, 10));
      setShowPositionSuggestions(true);
      setHighlightedPositionIndex(-1);
    }
  };

  const handlePositionFocus = () => {
    const val = data.position.trim();
    if (val.length > 0) {
      const q = val.toLowerCase();
      const filtered = recorderPositions.filter((pos) =>
        pos.toLowerCase().includes(q)
      );
      setPositionSuggestions(filtered);
      setShowPositionSuggestions(filtered.length > 0);
      setHighlightedPositionIndex(0);
    } else {
      setPositionSuggestions(recorderPositions.slice(0, 10));
      setShowPositionSuggestions(true);
      setHighlightedPositionIndex(-1);
    }
  };

  const handleSelectPosition = (pos: string) => {
    onChange('position', pos);
    setShowPositionSuggestions(false);
    setHighlightedPositionIndex(-1);
    if (errors.position) {
      setErrors((prev) => ({ ...prev, position: '' }));
    }
  };

  const handlePositionKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showPositionSuggestions || positionSuggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedPositionIndex((prev) =>
        prev < positionSuggestions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedPositionIndex((prev) =>
        prev > 0 ? prev - 1 : positionSuggestions.length - 1
      );
    } else if (e.key === 'Enter') {
      if (highlightedPositionIndex >= 0 && highlightedPositionIndex < positionSuggestions.length) {
        e.preventDefault();
        handleSelectPosition(positionSuggestions[highlightedPositionIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowPositionSuggestions(false);
    }
  };

  const handleAffiliationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newAffiliation = e.target.value;
    onChange('affiliation', newAffiliation);
    onChange('department', ''); // reset department when affiliation changes
    if (errors.affiliation) {
      setErrors((prev) => ({ ...prev, affiliation: '', department: '' }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    if (!data.name.trim()) newErrors.name = 'กรุณากรอกชื่อผู้บันทึก';
    if (!data.surname.trim()) newErrors.surname = 'กรุณากรอกนามสกุล';
    if (!data.position.trim()) newErrors.position = 'กรุณากรอกตำแหน่ง';
    if (!data.affiliation) newErrors.affiliation = 'กรุณาเลือกสายงาน';
    if (!data.department) newErrors.department = 'กรุณาเลือกหน่วยงาน';
    if (!data.phone.trim()) newErrors.phone = 'กรุณากรอกเบอร์โทรศัพท์';
    if (!data.email.trim()) newErrors.email = 'กรุณากรอกอีเมล';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    onNext();
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="mwa-form-section">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 mb-3 border-b border-slate-100 gap-2">
          <h3 className="mb-0">1. ข้อมูลผู้บันทึก</h3>
          <div className="text-[11px] text-sky-700 bg-sky-50 px-2.5 py-1 rounded border border-sky-200 inline-flex items-center gap-1.5 self-start sm:self-auto font-medium">
            <Sparkles className="w-3.5 h-3.5 text-sky-600 shrink-0" />
            <span>พิมพ์ชื่อเพื่อเลือก Profile ข้อมูลผู้บันทึกอัตโนมัติ</span>
          </div>
        </div>

        {/* Global inline alert if errors exist */}
        {Object.keys(errors).length > 0 && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>กรุณากรอกข้อมูลผู้บันทึกให้ครบถ้วนทุกช่องที่มีเครื่องหมายดอกจัน (*) ก่อนดำเนินการต่อ</span>
          </div>
        )}

        {/* Row 1: คำนำหน้า, ชื่อผู้บันทึก, นามสกุลผู้บันทึก */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4">
          {/* คำนำหน้า */}
          <div className="md:col-span-3">
            <label htmlFor="recorder-title" className="block text-xs font-bold text-slate-800 mb-1.5">
              คำนำหน้า
            </label>
            <select
              id="recorder-title"
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

            {/* ชื่อผู้บันทึก (with Autocomplete) */}
          <div className="md:col-span-4 relative" ref={dropdownRef}>
            <label htmlFor="recorder-name" className="block text-xs font-bold text-slate-800 mb-1.5">
              ชื่อผู้บันทึกข้อมูล *
            </label>
            <input
              type="text"
              id="recorder-name"
              placeholder="กรุณาพิมพ์ชื่อ"
              required
              autoComplete="off"
              className={`w-full text-xs p-2.5 border rounded bg-white text-slate-800 placeholder:text-slate-400 placeholder:opacity-80 focus:outline-none ${
                errors.name ? 'border-rose-400 focus:border-rose-500' : 'border-slate-300 focus:border-[#0054a6]'
              }`}
              value={data.name}
              onChange={handleNameChange}
              onFocus={() => {
                if (data.name.trim().length > 0 && suggestions.length > 0) {
                  setShowSuggestions(true);
                }
              }}
            />
            {errors.name && <span className="text-[11px] text-rose-600 mt-1 block">{errors.name}</span>}

            {/* Autocomplete Dropdown */}
            {showSuggestions && (
              <div className="absolute z-30 left-0 right-0 top-full mt-1 bg-white border border-sky-300 rounded-lg shadow-xl overflow-hidden text-xs max-h-60 overflow-y-auto">
                <div className="px-3 py-1.5 bg-sky-50 border-b border-sky-100 text-[11px] font-semibold text-sky-800 flex items-center justify-between">
                  <span>เลือกโปรไฟล์ผู้บันทึก (Mock Profile)</span>
                  <span className="text-slate-400 font-normal">คลิกเพื่อเติมข้อมูล</span>
                </div>
                {suggestions.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectProfile(p)}
                    className="w-full text-left px-3 py-2.5 hover:bg-sky-50 border-b border-slate-100 last:border-b-0 transition-colors flex items-start gap-2.5"
                  >
                    <div className="w-7 h-7 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                      <UserCheck className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-800">
                        {p.title ? `${p.title} ` : ''}{p.name} {p.surname}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {p.position} • {p.department}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {p.affiliation} • {p.phone}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* นามสกุลผู้บันทึก */}
          <div className="md:col-span-5">
            <label htmlFor="recorder-surname" className="block text-xs font-bold text-slate-800 mb-1.5">
              นามสกุลผู้บันทึกข้อมูล *
            </label>
            <input
              type="text"
              id="recorder-surname"
              placeholder="กรุณาพิมพ์นามสกุล"
              required
              className={`w-full text-xs p-2.5 border rounded bg-white text-slate-800 placeholder:text-slate-400 placeholder:opacity-80 focus:outline-none ${
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

        {/* Row 2: ตำแหน่ง, สายงาน */}
        <div className="mwa-form-row">
          <div className="mwa-form-group relative" ref={positionDropdownRef}>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="recorder-position" className="text-xs font-bold text-slate-800 mb-0">
                ตำแหน่งผู้บันทึกข้อมูล *
              </label>
              <span className="text-[10px] font-normal text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                ผู้ใช้กรอกเอง • มีระบบช่วยสะกดคำ
              </span>
            </div>
            <input
              type="text"
              id="recorder-position"
              placeholder="พิมพ์ตำแหน่ง เช่น นักประชาสัมพันธ์, นักวิชาการคอมพิวเตอร์, วิศวกร"
              required
              autoComplete="off"
              className={`w-full text-xs p-2.5 border rounded bg-white text-slate-800 focus:outline-none ${
                errors.position ? 'border-rose-400 focus:border-rose-500' : 'border-slate-300 focus:border-[#0054a6]'
              }`}
              value={data.position}
              onChange={handlePositionChange}
              onFocus={handlePositionFocus}
              onKeyDown={handlePositionKeyDown}
            />
            {errors.position && <span className="text-[11px] text-rose-600 mt-1 block">{errors.position}</span>}

            {/* Position Word Suggestion / Autocomplete Dropdown */}
            {showPositionSuggestions && positionSuggestions.length > 0 && (
              <div className="absolute z-30 left-0 right-0 top-full mt-1 bg-white border border-sky-300 rounded-lg shadow-xl overflow-hidden text-xs max-h-56 overflow-y-auto">
                <div className="px-3 py-1.5 bg-sky-50 border-b border-sky-100 text-[11px] font-semibold text-sky-800 flex items-center justify-between">
                  <span>คำแนะนำตำแหน่ง (ช่วยสะกดคำ)</span>
                  <span className="text-slate-400 font-normal text-[10px]">คลิกเลือก หรือพิมพ์ตำแหน่งเอง</span>
                </div>
                {positionSuggestions.map((pos, idx) => (
                  <button
                    key={pos}
                    type="button"
                    onClick={() => handleSelectPosition(pos)}
                    onMouseEnter={() => setHighlightedPositionIndex(idx)}
                    className={`w-full text-left px-3 py-2 border-b border-slate-100 last:border-b-0 transition-colors flex items-center justify-between text-xs cursor-pointer ${
                      highlightedPositionIndex === idx
                        ? 'bg-sky-100 text-sky-900 font-semibold'
                        : 'hover:bg-sky-50 text-slate-700'
                    }`}
                  >
                    <span>{pos}</span>
                    <span className="text-[10px] text-slate-400">เลือก</span>
                  </button>
                ))}
                <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-500">
                  <span>💡 สามารถพิมพ์ตำแหน่งที่ไม่มีในรายการได้ตามจริง ไม่จำกัดระดับตำแหน่ง</span>
                </div>
              </div>
            )}

            <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-sky-600 shrink-0" />
              <span>ผู้ใช้กรอกตำแหน่งเอง มีระบบช่วยสะกดคำแนะนำตำแหน่ง (สามารถพิมพ์ตำแหน่งอื่น ๆ ได้อย่างอิสระ)</span>
            </p>
          </div>

          <div className="mwa-form-group">
            <label htmlFor="recorder-affiliation">สายงานของผู้บันทึกข้อมูล *</label>
            <select
              id="recorder-affiliation"
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
        </div>

        {/* Row 3: หน่วยงาน, เบอร์โทรศัพท์ */}
        <div className="mwa-form-row">
          <div className="mwa-form-group">
            <label htmlFor="recorder-department">หน่วยงานของผู้บันทึกข้อมูล *</label>
            <select
              id="recorder-department"
              required
              disabled={!data.affiliation}
              className={errors.department ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200' : ''}
              value={data.department}
              onChange={(e) => {
                onChange('department', e.target.value);
                if (errors.department) setErrors((prev) => ({ ...prev, department: '' }));
              }}
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

          <div className="mwa-form-group">
            <label htmlFor="recorder-phone">เบอร์โทรศัพท์ *</label>
            <input
              type="tel"
              id="recorder-phone"
              placeholder="เช่น 02-504-0123 ต่อ 4821 หรือ 081-xxx-xxxx"
              required
              className={errors.phone ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200' : ''}
              value={data.phone}
              onChange={(e) => {
                onChange('phone', e.target.value);
                if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' }));
              }}
            />
            {errors.phone && <span className="text-[11px] text-rose-600 mt-1 block">{errors.phone}</span>}
          </div>
        </div>

        {/* Row 4: อีเมล */}
        <div className="mwa-form-group">
          <label htmlFor="recorder-email">อีเมล *</label>
          <input
            type="email"
            id="recorder-email"
            placeholder="example@mwa.co.th"
            required
            className={errors.email ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200' : ''}
            value={data.email}
            onChange={(e) => {
              onChange('email', e.target.value);
              if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
            }}
          />
          {errors.email && <span className="text-[11px] text-rose-600 mt-1 block">{errors.email}</span>}
        </div>
      </div>

      {/* Button */}
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <button type="submit" className="mwa-btn mwa-btn-primary">
          ถัดไป
        </button>
      </div>
    </form>
  );
};
