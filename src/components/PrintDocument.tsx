import React from 'react';
import {
  RecorderInfo,
  ExecutiveInfo,
  CommunicationTopicItem,
  FeedbackInfo
} from '../types/mwa';
import { formatFullName, formatSpeakerInfo, formatChannels, formatAudiences } from '../utils/pdfLayout';

export interface PrintDocumentProps {
  recorder: RecorderInfo;
  executive: ExecutiveInfo;
  topics: CommunicationTopicItem[];
  feedback: FeedbackInfo;
  isInteractivePreview?: boolean;
  recordId?: number;
  submissionId?: string;
  showHeaderAndMeta?: boolean;
  showFeedbackAndSignoff?: boolean;
}

export const PrintDocument: React.FC<PrintDocumentProps> = ({
  recorder,
  executive,
  topics,
  feedback,
  isInteractivePreview = false,
  recordId,
  submissionId,
  showHeaderAndMeta = true,
  showFeedbackAndSignoff = true
}) => {
  const monthDisplay = /\d{4}/.test(executive.month || '')
    ? executive.month
    : `${executive.month || 'มกราคม'} 2570`;

  const authorFullName = formatFullName(recorder.title, recorder.name, recorder.surname);
  const executiveFullName = formatFullName(executive.title, executive.name, executive.surname);
  const affiliationDept = [recorder.affiliation, recorder.department].filter(Boolean).join(' / ') || '-';
  const speaker = formatSpeakerInfo(executive);

  const isImageFile = (file: { name?: string; url?: string; type?: string }) => {
    if (file.type?.toLowerCase().startsWith('image/')) return true;
    if (file.url?.startsWith('data:image')) return true;
    const target = (file.url || file.name || '').toLowerCase();
    const cleanPath = target.split('?')[0];
    const ext = cleanPath.split('.').pop() || '';
    return (
      ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext) ||
      target.includes('photo') ||
      target.includes('img') ||
      target.includes('image')
    );
  };

  return (
    <div
      {...(!isInteractivePreview ? { id: 'mwa-print-root' } : {})}
      className="print-document bg-white text-black text-[10pt] leading-normal w-full"
      data-record-id={recordId}
      data-submission-id={submissionId}
      data-verified="true"
      style={{
        fontFamily: "'Sarabun', 'TH Sarabun New', sans-serif",
        backgroundColor: '#ffffff',
        color: '#000000',
        fontSize: '10pt',
        lineHeight: 1.5,
        width: '100%',
        height: 'auto',
        minHeight: 0,
        boxSizing: 'border-box'
      }}
    >
      {showHeaderAndMeta && (
        <>
          {/* 1. Header (Centered, Clean Government Format) */}
          <div className="text-center mb-3" style={{ textAlign: 'center', marginBottom: '12px' }}>
            <h1
              className="text-[13pt] font-bold text-black m-0 leading-tight"
              style={{
                fontSize: '13pt',
                fontWeight: 700,
                color: '#000000',
                margin: 0,
                lineHeight: 1.25
              }}
            >
              รายงานการสื่อสารตามแผนการสื่อสารภายในและภายนอกองค์กรของผู้บริหาร ประจำปีงบประมาณ 2570
            </h1>
            <p
              className="text-[11.5pt] font-semibold text-black m-0 mt-1"
              style={{
                fontSize: '11.5pt',
                fontWeight: 600,
                color: '#000000',
                margin: '4px 0 0 0'
              }}
            >
              ประจำเดือน {monthDisplay}
            </p>
          </div>

          {/* 2. Document Creator Metadata (2-Column official government layout) */}
          <div
            className="document-meta mb-3.5 text-[10pt] leading-normal text-black"
            style={{
              display: 'grid',
              gridTemplateColumns: '1.25fr 1fr',
              columnGap: '28px',
              rowGap: '5px',
              marginBottom: '14px',
              fontSize: '10pt',
              lineHeight: 1.5,
              color: '#000000'
            }}
          >
            <div className="flex items-baseline gap-1.5" style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <strong className="font-semibold text-black shrink-0" style={{ fontWeight: 600, color: '#000000', flexShrink: 0 }}>
                ผู้จัดทำเอกสาร:
              </strong>
              <span className="font-normal text-black" style={{ fontWeight: 400, color: '#000000' }}>
                {authorFullName || 'นาย สมศักดิ์ สุขประเสริฐ'}
              </span>
            </div>
            <div className="flex items-baseline gap-1.5" style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <strong className="font-semibold text-black shrink-0" style={{ fontWeight: 600, color: '#000000', flexShrink: 0 }}>
                ตำแหน่ง:
              </strong>
              <span className="font-normal text-black" style={{ fontWeight: 400, color: '#000000' }}>
                {recorder.position || 'รองผู้ว่าการ (เทคโนโลยีดิจิทัล)'}
              </span>
            </div>

            <div className="flex items-baseline gap-1.5" style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <strong className="font-semibold text-black shrink-0" style={{ fontWeight: 600, color: '#000000', flexShrink: 0 }}>
                สายงาน/หน่วยงาน:
              </strong>
              <span className="font-normal text-black" style={{ fontWeight: 400, color: '#000000' }}>
                {affiliationDept}
              </span>
            </div>
            <div className="flex items-baseline gap-1.5" style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <strong className="font-semibold text-black shrink-0" style={{ fontWeight: 600, color: '#000000', flexShrink: 0 }}>
                โทรศัพท์:
              </strong>
              <span className="font-normal text-black" style={{ fontWeight: 400, color: '#000000' }}>
                {recorder.phone || '02-504-0123 ต่อ 4821'}
              </span>
            </div>

            <div className="flex items-baseline gap-1.5" style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <strong className="font-semibold text-black shrink-0" style={{ fontWeight: 600, color: '#000000', flexShrink: 0 }}>
                อีเมล:
              </strong>
              <span className="font-normal text-black" style={{ fontWeight: 400, color: '#000000' }}>
                {recorder.email || 'recorder@mwa.co.th'}
              </span>
            </div>
            <div></div>
          </div>
        </>
      )}

      {/* 3. Main 5-Column Dynamic Table (Repeating thead on each page) */}
      <table
        className="mwa-print-table w-full border-collapse border border-black text-black mb-3.5"
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          border: '1px solid #000000',
          color: '#000000',
          backgroundColor: '#ffffff',
          marginBottom: '14px'
        }}
      >
        <thead>
          <tr
            className="border-b-2 border-black bg-white"
            style={{
              borderBottom: '2px solid #000000',
              backgroundColor: '#ffffff',
              pageBreakInside: 'avoid',
              breakInside: 'avoid'
            }}
          >
            <th
              className="border border-black p-2 text-center font-bold text-[10pt] w-[16%]"
              style={{
                border: '1px solid #000000',
                padding: '8px',
                textAlign: 'center',
                fontWeight: 700,
                fontSize: '10pt',
                width: '16%',
                color: '#000000',
                backgroundColor: '#ffffff'
              }}
            >
              ผู้ถ่ายทอดสาร
            </th>
            <th
              className="border border-black p-2 text-center font-bold text-[10pt] w-[40%]"
              style={{
                border: '1px solid #000000',
                padding: '8px',
                textAlign: 'center',
                fontWeight: 700,
                fontSize: '10pt',
                width: '40%',
                color: '#000000',
                backgroundColor: '#ffffff'
              }}
            >
              ประเด็นการสื่อสาร
            </th>
            <th
              className="border border-black p-2 text-center font-bold text-[10pt] w-[15%]"
              style={{
                border: '1px solid #000000',
                padding: '8px',
                textAlign: 'center',
                fontWeight: 700,
                fontSize: '10pt',
                width: '15%',
                color: '#000000',
                backgroundColor: '#ffffff'
              }}
            >
              ช่องทางการสื่อสาร
            </th>
            <th
              className="border border-black p-2 text-center font-bold text-[10pt] w-[15%]"
              style={{
                border: '1px solid #000000',
                padding: '8px',
                textAlign: 'center',
                fontWeight: 700,
                fontSize: '10pt',
                width: '15%',
                color: '#000000',
                backgroundColor: '#ffffff'
              }}
            >
              ผู้รับสาร
            </th>
            <th
              className="border border-black p-2 text-center font-bold text-[10pt] w-[14%]"
              style={{
                border: '1px solid #000000',
                padding: '8px',
                textAlign: 'center',
                fontWeight: 700,
                fontSize: '10pt',
                width: '14%',
                color: '#000000',
                backgroundColor: '#ffffff'
              }}
            >
              หลักฐาน (ถ้ามี)
            </th>
          </tr>
        </thead>
        <tbody>
          {topics.length === 0 ? (
            <tr>
              <td
                colSpan={5}
                className="border border-black p-6 text-center text-gray-500 italic text-[10pt]"
                style={{
                  border: '1px solid #000000',
                  padding: '24px',
                  textAlign: 'center',
                  color: '#6b7280',
                  fontStyle: 'italic',
                  fontSize: '10pt'
                }}
              >
                - ไม่มีรายการรายละเอียดการสื่อสาร -
              </td>
            </tr>
          ) : (
            topics.map((item, idx) => {
              const channels = formatChannels(item);
              const audiences = formatAudiences(item);

              return (
                <tr
                  key={item.id || idx}
                  className="border-b border-black align-top"
                  style={{
                    borderBottom: '1px solid #000000',
                    pageBreakInside: 'avoid',
                    breakInside: 'avoid',
                    verticalAlign: 'top'
                  }}
                >
                  {/* 1. ผู้ถ่ายทอดสาร */}
                  <td
                    className="border border-black p-2 align-top text-[9.5pt] leading-snug"
                    style={{
                      border: '1px solid #000000',
                      padding: '8px',
                      verticalAlign: 'top',
                      fontSize: '9.5pt',
                      lineHeight: 1.375,
                      color: '#000000'
                    }}
                  >
                    <div className="font-bold text-black" style={{ fontWeight: 700, color: '#000000' }}>
                      {speaker.fullName}
                    </div>
                    <div className="text-[9pt] text-gray-800 mt-0.5" style={{ fontSize: '9pt', color: '#1f2937', marginTop: '2px' }}>
                      {speaker.position}
                    </div>
                    {speaker.affiliationAndDept !== '-' && (
                      <div className="text-[8.5pt] text-gray-600 mt-0.5" style={{ fontSize: '8.5pt', color: '#4b5563', marginTop: '2px' }}>
                        {speaker.affiliationAndDept}
                      </div>
                    )}
                  </td>

                  {/* 2. ประเด็นการสื่อสาร (ประเด็น + รายละเอียด - กว้างที่สุด) */}
                  <td
                    className="border border-black p-2 align-top text-[9.5pt] leading-relaxed"
                    style={{
                      border: '1px solid #000000',
                      padding: '8px',
                      verticalAlign: 'top',
                      fontSize: '9.5pt',
                      lineHeight: 1.5,
                      color: '#000000'
                    }}
                  >
                    {/* Selected Topics */}
                    {item.selectedTopics && item.selectedTopics.length > 0 ? (
                      <div className="font-bold text-black mb-1 space-y-0.5" style={{ fontWeight: 700, color: '#000000', marginBottom: '4px' }}>
                        {item.selectedTopics.map((topic, tIdx) => (
                          <div key={tIdx} className="leading-snug" style={{ lineHeight: 1.375, marginBottom: '2px' }}>
                            • {topic}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="font-bold text-gray-500 mb-1 italic" style={{ fontWeight: 700, color: '#6b7280', marginBottom: '4px', fontStyle: 'italic' }}>
                        - ไม่ได้ระบุหัวข้อประเด็น -
                      </div>
                    )}

                    {/* Details Text */}
                    <div
                      className="text-black text-[9pt] leading-relaxed whitespace-pre-wrap mt-1"
                      style={{
                        color: '#000000',
                        fontSize: '9pt',
                        lineHeight: 1.5,
                        whiteSpace: 'pre-wrap',
                        marginTop: '4px'
                      }}
                    >
                      {item.details ? (
                        item.details
                      ) : (
                        <span className="text-gray-400 italic" style={{ color: '#9ca3af', fontStyle: 'italic' }}>
                          - ไม่มีรายละเอียด -
                        </span>
                      )}
                    </div>

                    {/* Additional Details */}
                    {item.additionalDetails && (
                      <div
                        className="mt-2 pt-1 border-t border-gray-300 text-[8.5pt] text-gray-700"
                        style={{
                          marginTop: '8px',
                          paddingTop: '4px',
                          borderTop: '1px solid #d1d5db',
                          fontSize: '8.5pt',
                          color: '#374151'
                        }}
                      >
                        <span className="font-semibold" style={{ fontWeight: 600 }}>ข้อมูลเพิ่มเติม:</span>{' '}
                        {item.additionalDetails}
                      </div>
                    )}
                  </td>

                  {/* 3. ช่องทางการสื่อสาร */}
                  <td
                    className="border border-black p-2 align-top text-[9pt]"
                    style={{
                      border: '1px solid #000000',
                      padding: '8px',
                      verticalAlign: 'top',
                      fontSize: '9pt',
                      color: '#000000'
                    }}
                  >
                    {channels.length > 0 ? (
                      <ul className="list-disc list-inside space-y-1 pl-0" style={{ margin: 0, paddingLeft: '14px', listStyleType: 'disc' }}>
                        {channels.map((ch, cIdx) => (
                          <li key={cIdx} className="leading-snug" style={{ lineHeight: 1.375, marginBottom: '3px' }}>
                            {ch}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-gray-400 italic" style={{ color: '#9ca3af', fontStyle: 'italic' }}>-</span>
                    )}
                  </td>

                  {/* 4. ผู้รับสาร */}
                  <td
                    className="border border-black p-2 align-top text-[9pt]"
                    style={{
                      border: '1px solid #000000',
                      padding: '8px',
                      verticalAlign: 'top',
                      fontSize: '9pt',
                      color: '#000000'
                    }}
                  >
                    {audiences.length > 0 ? (
                      <ul className="list-disc list-inside space-y-1 pl-0" style={{ margin: 0, paddingLeft: '14px', listStyleType: 'disc' }}>
                        {audiences.map((aud, aIdx) => (
                          <li key={aIdx} className="leading-snug" style={{ lineHeight: 1.375, marginBottom: '3px' }}>
                            {aud}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-gray-400 italic" style={{ color: '#9ca3af', fontStyle: 'italic' }}>-</span>
                    )}
                  </td>

                  {/* 5. หลักฐาน (ถ้ามี) - Thumbnails with aspect ratio preserved */}
                  <td
                    className="border border-black p-2 align-top text-center text-[9pt]"
                    style={{
                      border: '1px solid #000000',
                      padding: '8px',
                      verticalAlign: 'top',
                      textAlign: 'center',
                      fontSize: '9pt',
                      color: '#000000'
                    }}
                  >
                    {item.evidenceFiles && item.evidenceFiles.length > 0 ? (
                      <div
                        className="flex flex-wrap gap-1.5 justify-center items-center py-0.5"
                        style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center', alignItems: 'center', padding: '2px 0' }}
                      >
                        {item.evidenceFiles.map((file, fIdx) => {
                          const imageSrc = file.previewUrl || (isImageFile(file) || Boolean(file.url?.startsWith('data:image')) ? file.url : undefined);
                          if (imageSrc) {
                            return (
                              <div
                                key={fIdx}
                                className="flex flex-col items-center text-center max-w-[75px]"
                                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', maxWidth: '75px' }}
                              >
                                <img
                                  src={imageSrc}
                                  alt={`ภาพตัวอย่าง ${file.name || 'หลักฐาน'}`}
                                  className="w-[70px] h-[52px] object-cover border border-gray-300 p-0.5 bg-white rounded"
                                  style={{
                                    width: '70px',
                                    height: '52px',
                                    objectFit: 'cover',
                                    border: '1px solid #d1d5db',
                                    padding: '2px',
                                    backgroundColor: '#ffffff',
                                    borderRadius: '4px',
                                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
                                  }}
                                />
                                <div
                                  className="text-[7pt] text-gray-700 truncate max-w-[70px] mt-0.5"
                                  style={{
                                    fontSize: '7pt',
                                    color: '#374151',
                                    maxWidth: '70px',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    marginTop: '2px'
                                  }}
                                >
                                  {file.name}
                                </div>
                              </div>
                            );
                          }
                          return (
                            <div
                              key={fIdx}
                              className="border border-gray-300 p-1 bg-gray-50 text-[8pt] text-black rounded max-w-full my-0.5 text-left"
                              style={{
                                border: '1px solid #d1d5db',
                                padding: '4px',
                                backgroundColor: '#f9fafb',
                                fontSize: '8pt',
                                color: '#000000',
                                borderRadius: '4px',
                                maxWidth: '100%',
                                margin: '2px 0',
                                textAlign: 'left'
                              }}
                            >
                              <div
                                className="font-semibold truncate max-w-[80px]"
                                style={{ fontWeight: 600, maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                              >
                                📄 {file.name}
                              </div>
                              {file.size && (
                                <div className="text-[7pt] text-gray-500" style={{ fontSize: '7pt', color: '#6b7280' }}>
                                  ({file.size})
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <span className="text-gray-400 italic" style={{ color: '#9ca3af', fontStyle: 'italic' }}>-</span>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {showFeedbackAndSignoff && (
        <>
          {/* 4. Section: Problems and Suggestions (Dynamic height, breaks cleanly) */}
          <div
            className="print-avoid-break mt-3.5 space-y-2.5 text-[10pt]"
            style={{
              pageBreakInside: 'avoid',
              breakInside: 'avoid',
              marginTop: '14px',
              fontSize: '10pt',
              color: '#000000'
            }}
          >
            <div style={{ marginBottom: '10px' }}>
              <p className="font-bold text-black mb-0.5" style={{ fontWeight: 700, color: '#000000', margin: '0 0 2px 0' }}>
                ปัญหาและอุปสรรคในการสื่อสาร:
              </p>
              <div
                className="pl-3 leading-relaxed whitespace-pre-wrap text-black text-[9.5pt]"
                style={{
                  paddingLeft: '12px',
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap',
                  color: '#000000',
                  fontSize: '9.5pt'
                }}
              >
                {feedback.problemsObstacles && feedback.problemsObstacles.trim().length > 0 ? (
                  feedback.problemsObstacles
                ) : (
                  <span className="text-gray-500 italic" style={{ color: '#6b7280', fontStyle: 'italic' }}>
                    - ไม่มี -
                  </span>
                )}
              </div>
            </div>

            <div>
              <p className="font-bold text-black mb-0.5" style={{ fontWeight: 700, color: '#000000', margin: '0 0 2px 0' }}>
                ข้อเสนอแนะของผู้บริหารในการสื่อสาร:
              </p>
              <div
                className="pl-3 leading-relaxed whitespace-pre-wrap text-black text-[9.5pt]"
                style={{
                  paddingLeft: '12px',
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap',
                  color: '#000000',
                  fontSize: '9.5pt'
                }}
              >
                {feedback.executiveSuggestions && feedback.executiveSuggestions.trim().length > 0 ? (
                  feedback.executiveSuggestions
                ) : (
                  <span className="text-gray-500 italic" style={{ color: '#6b7280', fontStyle: 'italic' }}>
                    - ไม่มี -
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 5. Section: Executive Signoff (Aligned Right at the very end of final page) */}
          <div
            className="print-avoid-break mt-4 flex justify-end"
            style={{
              pageBreakInside: 'avoid',
              breakInside: 'avoid',
              marginTop: '16px',
              display: 'flex',
              justifyContent: 'flex-end'
            }}
          >
            <div
              className="text-center min-w-[220px] max-w-[320px] mr-2"
              style={{ textAlign: 'center', minWidth: '220px', maxWidth: '320px', marginRight: '8px' }}
            >
              <div className="h-6" style={{ height: '24px' }}></div>
              <div className="font-bold text-[10pt] text-black" style={{ fontWeight: 700, fontSize: '10pt', color: '#000000' }}>
                ({executiveFullName || 'นายสุรชัย วงศ์ปัญญา'})
              </div>
              <div className="text-[9.5pt] text-black mt-0.5" style={{ fontSize: '9.5pt', color: '#000000', marginTop: '2px' }}>
                {executive.position || 'รองผู้ว่าการ (เทคโนโลยีดิจิทัล)'}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
