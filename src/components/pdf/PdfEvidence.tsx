import React from 'react';

export interface EvidenceFileItem {
  name: string;
  size?: string;
  url?: string;
  fileUrl?: string;
  driveUrl?: string;
  driveFileId?: string;
  previewUrl?: string;
  type?: string;
  mimeType?: string;
}

interface PdfEvidenceProps {
  files?: EvidenceFileItem[];
}

const getExtension = (name: string) => {
  const cleanName = String(name || '').split('?')[0];
  return cleanName.includes('.') ? cleanName.split('.').pop()!.toLowerCase() : '';
};

const getFileKind = (file: EvidenceFileItem) => {
  const mime = String(file.mimeType || file.type || '').toLowerCase();
  const ext = getExtension(file.name);
  if (mime.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext)) return 'รูปภาพ';
  if (mime === 'application/pdf' || ext === 'pdf') return 'PDF';
  if (['doc', 'docx'].includes(ext) || mime.includes('wordprocessingml') || mime.includes('msword')) return 'Word';
  if (['xls', 'xlsx', 'csv'].includes(ext) || mime.includes('spreadsheet') || mime.includes('excel')) return 'Excel';
  if (['ppt', 'pptx'].includes(ext) || mime.includes('presentation') || mime.includes('powerpoint')) return 'PowerPoint';
  return 'ไฟล์แนบ';
};

export const PdfEvidence: React.FC<PdfEvidenceProps> = ({ files }) => {
  if (!files || files.length === 0) {
    return <span className="text-[11px] text-gray-500 italic block text-center">-</span>;
  }

  return (
    <div className="space-y-2 py-1">
      <div className="flex flex-col gap-2 items-center">
        {files.map((file, idx) => {
          const isImage = getFileKind(file) === 'รูปภาพ';
          // Use only a real preview generated from the selected file; never show unrelated placeholder images.
          const imageSrc = file.previewUrl || (isImage && String(file.url || '').startsWith('data:image') ? file.url : undefined);
          const driveUrl = file.driveUrl || file.fileUrl || (String(file.url || '').startsWith('http') ? file.url : undefined);
          const kind = getFileKind(file);

          return (
            <div
              key={`${file.name}-${idx}`}
              className="w-full max-w-[140px] border border-black p-1 bg-white flex flex-col items-center break-inside-avoid"
            >
              {imageSrc ? (
                <img
                  src={imageSrc}
                  alt={`ภาพตัวอย่าง ${file.name}`}
                  className="w-full h-auto max-h-32 object-contain bg-white"
                  loading="eager"
                />
              ) : (
                <div className="w-full h-20 flex flex-col items-center justify-center bg-gray-50 border border-gray-200">
                  <span className="text-2xl" aria-hidden="true">
                    {kind === 'PDF' ? '📕' : kind === 'Word' ? '📘' : kind === 'Excel' ? '📗' : kind === 'PowerPoint' ? '📙' : '📎'}
                  </span>
                  <span className="text-[9px] font-semibold">{kind}</span>
                  <span className="text-[8px] text-gray-500">ไม่มีภาพตัวอย่าง</span>
                </div>
              )}
              <span className="text-[9px] text-black font-sans break-words w-full text-center mt-1" title={file.name}>
                {file.name}
              </span>
              {file.size && <span className="text-[8px] text-gray-500">{file.size}</span>}
              {driveUrl && (
                <span className="text-[8px] text-blue-700 break-all text-center mt-0.5">
                  เปิดไฟล์ใน Google Drive
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
