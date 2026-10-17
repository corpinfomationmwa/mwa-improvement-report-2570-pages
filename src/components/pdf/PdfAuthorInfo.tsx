import React from 'react';
import { RecorderInfo } from '../../types/mwa';
import { formatFullName } from '../../utils/pdfLayout';

interface PdfAuthorInfoProps {
  recorder: RecorderInfo;
}

export const PdfAuthorInfo: React.FC<PdfAuthorInfoProps> = ({ recorder }) => {
  const authorFullName = formatFullName(recorder.title, recorder.name, recorder.surname);
  const affiliationDept = [recorder.affiliation, recorder.department].filter(Boolean).join(' / ') || '-';

  return (
    <div className="mb-4 text-xs text-black leading-relaxed font-serif space-y-1 select-text">
      <div className="flex flex-wrap gap-x-6 gap-y-1">
        <div>
          <span className="font-bold">ผู้จัดทำเอกสาร:</span> {authorFullName}
        </div>
        <div>
          <span className="font-bold">ตำแหน่ง:</span> {recorder.position || '-'}
        </div>
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-1">
        <div>
          <span className="font-bold">สายงาน/หน่วยงาน:</span> {affiliationDept}
        </div>
        <div>
          <span className="font-bold">โทรศัพท์:</span> {recorder.phone || '-'}
        </div>
        {recorder.email && (
          <div>
            <span className="font-bold">อีเมล:</span> {recorder.email}
          </div>
        )}
      </div>
    </div>
  );
};
