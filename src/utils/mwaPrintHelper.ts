import { ReportRecord, RecorderInfo, ExecutiveInfo, CommunicationTopicItem, FeedbackInfo } from '../types/mwa';
import { formatFullName, formatSpeakerInfo, formatChannels, formatAudiences } from './pdfLayout';
import { recordToPrintPayload, PrintPayload } from './mwaPrintConverter';

/**
 * Helper to check if a file is an image based on its name, URL, or mime type
 */
function isImageFile(file: {
  name?: string;
  url?: string;
  fileUrl?: string;
  dataUrl?: string;
  previewUrl?: string;
  mimeType?: string;
  fileType?: string;
}): boolean {
  const target = (
    file.url ||
    file.fileUrl ||
    file.dataUrl ||
    file.previewUrl ||
    file.name ||
    ''
  ).toLowerCase();
  const mime = (file.mimeType || file.fileType || '').toLowerCase();

  if (mime.startsWith('image/')) return true;
  if (target.startsWith('data:image')) return true;

  const cleanPath = target.split('?')[0];
  const ext = cleanPath.split('.').pop() || '';
  return (
    ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'svg'].includes(ext) ||
    target.includes('image') ||
    target.includes('photo')
  );
}

/**
 * Generates the complete A4 Landscape HTML document for browser printing.
 * This is standalone, cleanly formatted, and identical to the PDF Preview.
 */
export function generateA4PrintHtml(payload: PrintPayload): string {
  const { recorder, executive, topics, feedback } = payload;

  const monthDisplay = executive.month?.includes('2570')
    ? executive.month
    : `${executive.month || 'มกราคม'} 2570`;

  const authorFullName = formatFullName(recorder.title, recorder.name, recorder.surname) || 'นาย สมศักดิ์ สุขประเสริฐ';
  const executiveFullName = formatFullName(executive.title, executive.name, executive.surname) || 'นายสุรชัย วงศ์ปัญญา';
  const affiliationDept = [recorder.affiliation, recorder.department].filter(Boolean).join(' / ') || '-';
  const speaker = formatSpeakerInfo(executive);

  // Table rows HTML
  const rowsHtml = topics.length === 0
    ? `<tr><td colspan="5" style="border: 1px solid #000; padding: 18px; text-align: center; color: #666; font-style: italic;">- ไม่มีรายการรายละเอียดการสื่อสาร -</td></tr>`
    : topics.map((item, idx) => {
        const channels = formatChannels(item);
        const audiences = formatAudiences(item);

        // Topics bullets
        const topicsListHtml = item.selectedTopics && item.selectedTopics.length > 0
          ? item.selectedTopics.map(t => `<div style="font-weight: 600; color: #000; margin-bottom: 2px;">• ${t}</div>`).join('')
          : '<div style="color: #666; font-style: italic;">- ไม่ได้ระบุหัวข้อประเด็น -</div>';

        // Details text
        const detailsHtml = item.details
          ? `<div style="margin-top: 4px; line-height: 1.4; white-space: pre-wrap; color: #000; font-size: 9pt;">${item.details}</div>`
          : '<div style="color: #888; font-style: italic; margin-top: 3px;">- ไม่มีรายละเอียด -</div>';

        // Additional details
        const additionalHtml = item.additionalDetails
          ? `<div style="margin-top: 5px; padding-top: 3px; border-top: 1px solid #ddd; font-size: 8.5pt; color: #444;"><strong style="font-weight: 600;">ข้อมูลเพิ่มเติม:</strong> ${item.additionalDetails}</div>`
          : '';

        // Channels HTML
        const channelsHtml = channels.length > 0
          ? `<ul style="margin: 0; padding-left: 14px; list-style-type: disc;">${channels.map(c => `<li style="margin-bottom: 2px;">${c}</li>`).join('')}</ul>`
          : '-';

        // Audiences HTML
        const audiencesHtml = audiences.length > 0
          ? `<ul style="margin: 0; padding-left: 14px; list-style-type: disc;">${audiences.map(a => `<li style="margin-bottom: 2px;">${a}</li>`).join('')}</ul>`
          : '-';

        // Evidence files (Real thumbnails stacked vertically)
        let evidenceHtml = '<div style="text-align: center; color: #888; font-style: italic;">-</div>';
        if (item.evidenceFiles && item.evidenceFiles.length > 0) {
          const filesMarkup = item.evidenceFiles.map(file => {
            const isImg = isImageFile(file) || Boolean(file.url?.startsWith('data:image'));
            if (isImg && file.url) {
              return `
                <div style="display: flex; flex-direction: column; align-items: center; text-align: center; margin: 3px 0; max-width: 90px;">
                  <img
                    src="${file.url}"
                    alt="${file.name || 'รูปภาพหลักฐาน'}"
                    style="max-width: 85px; max-height: 85px; object-fit: contain; border: 1px solid #cbd5e1; padding: 2px; background: #ffffff; border-radius: 3px;"
                  />
                  <div style="font-size: 7.5pt; color: #475569; max-width: 85px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-top: 2px;">
                    ${file.name || 'รูปภาพ'}
                  </div>
                </div>
              `;
            }
            return `
              <div style="font-size: 8pt; color: #1e293b; margin: 2px 0; padding: 3px 6px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 3px; max-width: 95px; word-break: break-all; text-align: left;">
                📄 ${file.name || 'เอกสารแนบ'} ${file.size ? `<span style="color:#64748b; font-size:7pt;">(${file.size})</span>` : ''}
              </div>
            `;
          }).join('');

          evidenceHtml = `<div style="display: flex; flex-direction: column; gap: 4px; justify-content: center; align-items: center;">${filesMarkup}</div>`;
        }

        return `
          <tr style="page-break-inside: avoid; break-inside: avoid; border-bottom: 1px solid #000; vertical-align: top;">
            <td style="border: 1px solid #000; padding: 6px 8px; width: 18%; font-size: 9.5pt;">
              <div style="font-weight: 600; color: #000;">${speaker.fullName}</div>
              <div style="font-size: 9pt; color: #222; margin-top: 2px;">${speaker.position}</div>
              ${speaker.affiliationAndDept !== '-' ? `<div style="font-size: 8.5pt; color: #555; margin-top: 2px;">${speaker.affiliationAndDept}</div>` : ''}
            </td>
            <td style="border: 1px solid #000; padding: 6px 8px; width: 34%; font-size: 9.5pt;">
              ${topicsListHtml}
              ${detailsHtml}
              ${additionalHtml}
            </td>
            <td style="border: 1px solid #000; padding: 6px 8px; width: 16%; font-size: 9pt;">
              ${channelsHtml}
            </td>
            <td style="border: 1px solid #000; padding: 6px 8px; width: 16%; font-size: 9pt;">
              ${audiencesHtml}
            </td>
            <td style="border: 1px solid #000; padding: 6px 8px; width: 16%; text-align: center; font-size: 9pt;">
              ${evidenceHtml}
            </td>
          </tr>
        `;
      }).join('');

  return `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <title>รายงานการสื่อสารของผู้บริหาร ประจำปีงบประมาณ 2570</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A4 landscape;
      margin: 10mm;
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    html, body {
      font-family: 'Sarabun', 'TH Sarabun New', sans-serif;
      color: #000;
      background: #fff;
      margin: 0;
      padding: 0;
      width: 100%;
      font-size: 10pt;
      line-height: 1.35;
    }

    .report-container {
      width: 100%;
      max-width: 100%;
      margin: 0 auto;
      background: #fff;
      color: #000;
    }

    .report-header {
      text-align: center;
      margin-bottom: 12px;
    }

    .report-header h1 {
      font-size: 13pt;
      font-weight: 700;
      margin: 0 0 4px 0;
      color: #000;
      line-height: 1.3;
    }

    .report-header p {
      font-size: 11.5pt;
      font-weight: 600;
      margin: 0;
      color: #000;
    }

    /* Document Metadata (2 Columns, single line per field, no horizontal lines) */
    .document-meta {
      display: grid;
      grid-template-columns: 1.15fr 1fr;
      column-gap: 32px;
      row-gap: 6px;
      font-size: 10pt;
      line-height: 1.4;
      margin-bottom: 14px;
      text-align: left;
    }

    .document-meta-item {
      display: flex;
      align-items: baseline;
      gap: 6px;
      white-space: nowrap;
    }

    .document-meta-item strong {
      font-weight: 600;
      color: #000;
      flex-shrink: 0;
    }

    .document-meta-item span {
      font-weight: 400;
      color: #000;
    }

    /* Table (5 columns, full borders, no separator above or below outside table) */
    table.mwa-table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #000;
      margin-bottom: 12px;
      page-break-inside: auto;
    }

    table.mwa-table thead {
      display: table-header-group;
    }

    table.mwa-table th {
      border: 1px solid #000;
      padding: 6px 8px;
      background-color: #ffffff;
      font-weight: 700;
      text-align: center;
      color: #000;
      font-size: 10pt;
    }

    table.mwa-table td {
      border: 1px solid #000;
      color: #000;
      background-color: #ffffff;
    }

    .avoid-break {
      page-break-inside: avoid;
      break-inside: avoid;
    }

    /* Feedback section (no extra borders) */
    .feedback-section {
      margin-top: 10px;
      font-size: 9.5pt;
      line-height: 1.4;
    }

    .feedback-block {
      margin-bottom: 8px;
    }

    .feedback-title {
      font-weight: 700;
      display: block;
      margin-bottom: 2px;
      color: #000;
    }

    .feedback-content {
      padding-left: 12px;
      white-space: pre-wrap;
      color: #111;
    }

    /* Executive Signature at bottom right */
    .signature-section {
      margin-top: 28px;
      display: flex;
      justify-content: flex-end;
      page-break-inside: avoid;
      break-inside: avoid;
    }

    .signature-box {
      text-align: center;
      min-width: 220px;
      max-width: 320px;
      margin-right: 8px;
    }

    .signature-space {
      height: 32px;
    }

    .signature-name {
      font-weight: 600;
      font-size: 10pt;
      color: #000;
    }

    .signature-pos {
      font-size: 9.5pt;
      color: #222;
      margin-top: 2px;
    }

    .signature-dept {
      font-size: 8.5pt;
      color: #555;
      margin-top: 2px;
    }
  </style>
  <script>
    // Automatically trigger print dialog when document is ready
    window.addEventListener('load', function() {
      setTimeout(function() {
        try {
          window.focus();
          window.print();
        } catch (err) {
          console.error('Print trigger error:', err);
        }
      }, 400);
    });
  </script>
</head>
<body>
  <div class="report-container">
    <!-- Header -->
    <div class="report-header">
      <h1>รายงานการสื่อสารตามแผนการสื่อสารภายในและภายนอกองค์กรของผู้บริหาร ประจำปีงบประมาณ 2570</h1>
      <p>ประจำเดือน ${monthDisplay}</p>
    </div>

    <!-- Document Creator Metadata (2 Columns, single line per field, no extra border) -->
    <div class="document-meta">
      <div class="document-meta-item">
        <strong>ผู้จัดทำเอกสาร:</strong>
        <span>${authorFullName}</span>
      </div>
      <div class="document-meta-item">
        <strong>ตำแหน่ง:</strong>
        <span>${recorder.position || 'รองผู้ว่าการ (เทคโนโลยีดิจิทัล)'}</span>
      </div>

      <div class="document-meta-item">
        <strong>สายงาน/หน่วยงาน:</strong>
        <span>${affiliationDept}</span>
      </div>
      <div class="document-meta-item">
        <strong>โทรศัพท์:</strong>
        <span>${recorder.phone || '02-504-0123 ต่อ 4821'}</span>
      </div>

      <div class="document-meta-item" style="grid-column: span 2;">
        <strong>อีเมล:</strong>
        <span>${recorder.email || 'recorder@mwa.co.th'}</span>
      </div>
    </div>

    <!-- 5-Column Table (No border above or below outside table) -->
    <table class="mwa-table">
      <thead>
        <tr>
          <th style="width: 18%;">ผู้ถ่ายทอดสาร</th>
          <th style="width: 34%;">ประเด็นการสื่อสาร</th>
          <th style="width: 16%;">ช่องทางการสื่อสาร</th>
          <th style="width: 16%;">ผู้รับสาร</th>
          <th style="width: 16%;">หลักฐาน (ถ้ามี)</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>

    <!-- Feedback Section (No extra borders) -->
    <div class="avoid-break feedback-section">
      <div class="feedback-block">
        <span class="feedback-title">ปัญหาและอุปสรรคในการสื่อสาร:</span>
        <div class="feedback-content">${feedback.problemsObstacles && feedback.problemsObstacles.trim().length > 0 ? feedback.problemsObstacles : '- ไม่มี -'}</div>
      </div>
      <div class="feedback-block">
        <span class="feedback-title">ข้อเสนอแนะของผู้บริหารในการสื่อสาร:</span>
        <div class="feedback-content">${feedback.executiveSuggestions && feedback.executiveSuggestions.trim().length > 0 ? feedback.executiveSuggestions : '- ไม่มี -'}</div>
      </div>
    </div>

    <!-- Executive Info Section (Bottom Right Corner) -->
    <div class="signature-section">
      <div class="signature-box">
        <div class="signature-space"></div>
        <div class="signature-name">
          (${executiveFullName})
        </div>
        <div class="signature-pos">
          ${executive.position || 'รองผู้ว่าการ (เทคโนโลยีดิจิทัล)'}
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Triggers native browser print directly from user click (Conforms to Requirement 10)
 */
export function printDocument(_payload?: PrintPayload): void {
  window.print();
}

/**
 * Triggers native browser print preview directly for a Report Record
 */
export function openNativePrintPreview(_record: ReportRecord): void {
  window.print();
}
