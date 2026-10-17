import React from 'react';
import { FeedbackInfo } from '../types/mwa';
import { Save } from 'lucide-react';

interface FormStep4FeedbackProps {
  data: FeedbackInfo;
  onChange: (field: keyof FeedbackInfo, value: string) => void;
  onPrev: () => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
  submitButtonText?: string;
}

export const FormStep4Feedback: React.FC<FormStep4FeedbackProps> = ({
  data,
  onChange,
  onPrev,
  onSubmit,
  isSubmitting = false,
  submitButtonText
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mwa-form-section">
        <h3>4. ปัญหาและข้อเสนอแนะ</h3>

        {/* 1. ปัญหาและอุปสรรค */}
        <div className="mwa-form-group">
          <label htmlFor="problems-obstacles">ปัญหาและอุปสรรคในการสื่อสาร</label>
          <textarea
            id="problems-obstacles"
            placeholder="กรุณากรอกปัญหาและอุปสรรคที่พบในการสื่อสาร (ถ้ามี)"
            value={data.problemsObstacles}
            onChange={(e) => onChange('problemsObstacles', e.target.value)}
          />
        </div>

        {/* 2. ข้อเสนอแนะของผู้บริหาร */}
        <div className="mwa-form-group">
          <label htmlFor="executive-suggestions">ข้อเสนอแนะของผู้บริหารในการสื่อสาร</label>
          <textarea
            id="executive-suggestions"
            placeholder="กรุณากรอกข้อเสนอแนะของผู้บริหารเกี่ยวกับการสื่อสาร (ถ้ามี)"
            value={data.executiveSuggestions}
            onChange={(e) => onChange('executiveSuggestions', e.target.value)}
          />
        </div>
      </div>

      {/* Buttons: ย้อนกลับ and บันทึกข้อมูล (ห้ามมีปุ่ม PDF/Print ในหน้า 4) */}
      <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
        <button
          type="button"
          className="mwa-btn mwa-btn-warning"
          onClick={onPrev}
          disabled={isSubmitting}
        >
          ย้อนกลับ
        </button>

        <button
          type="submit"
          className="mwa-btn mwa-btn-success"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
          ) : (
            <Save className="w-4 h-4 shrink-0" />
          )}
          <span>
            {isSubmitting
              ? (submitButtonText || 'กำลังบันทึกข้อมูล กรุณารอสักครู่...')
              : 'บันทึกข้อมูล'}
          </span>
        </button>
      </div>
    </form>
  );
};
