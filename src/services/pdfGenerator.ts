import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { sanitizeElementColors, sanitizeClonedDocument } from '../utils/cssColorSanitizer';
import { registerNotoSansThaiFonts } from '../fonts/notoSansThaiFonts';
import {
  RecorderInfo,
  ExecutiveInfo,
  CommunicationTopicItem,
  FeedbackInfo
} from '../types/mwa';
import { PdfPrintSettings } from '../config/pdfConfig';
import { paginateDocument } from '../utils/pdfPagination';
import { formatFullName, formatSpeakerInfo, formatChannels, formatAudiences } from '../utils/pdfLayout';

export interface GeneratedPdfResult {
  blob: Blob;
  blobUrl: string;
  pageImages: string[];
  pageCount: number;
}

/**
 * Builds an offscreen DOM element representing an A4 page, then captures it to a canvas.
 */
function createPageElement(contentHtml: string, pageNum: number, totalPages: number): HTMLDivElement {
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '794px'; // 210mm at 96 DPI
  container.style.minHeight = '1123px'; // 297mm at 96 DPI
  container.style.height = '1123px';
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#000000';
  container.style.padding = '50px 60px 40px 60px';
  container.style.fontFamily = "'Sarabun', 'TH Sarabun New', sans-serif";
  container.style.boxSizing = 'border-box';
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.justifyContent = 'space-between';
  container.style.zIndex = '-9999';

  container.innerHTML = `
    <div style="flex: 1; display: flex; flex-direction: column;">
      ${contentHtml}
    </div>
    <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #d1d5db; padding-top: 8px; font-size: 11px; color: #4b5563; font-family: 'Sarabun', sans-serif;">
      <span>เอกสารทางการ การประปานครหลวง (กปน.)</span>
      <span style="font-weight: bold;">หน้า ${pageNum} จาก ${totalPages}</span>
    </div>
  `;

  document.body.appendChild(container);
  return container;
}

/**
 * Builds HTML for Page 1 Header and Author Info
 */
function buildHeaderAndAuthorHtml(recorder: RecorderInfo, executive: ExecutiveInfo): string {
  const monthDisplay = executive.month?.includes('2570')
    ? executive.month
    : `${executive.month || 'มกราคม'} 2570`;

  const authorFullName = formatFullName(recorder.title, recorder.name, recorder.surname);
  const affiliationDept = [recorder.affiliation, recorder.department].filter(Boolean).join(' / ') || '-';

  return `
    <div style="text-align: center; margin-bottom: 20px;">
      <h1 style="font-size: 15px; font-weight: bold; margin: 0 0 4px 0; color: #000; line-height: 1.4;">
        รายงานการสื่อสารตามแผนการสื่อสารภายในและภายนอกองค์กรของผู้บริหาร
      </h1>
      <h2 style="font-size: 14px; font-weight: bold; margin: 0 0 4px 0; color: #000;">
        ประจำปีงบประมาณ 2570
      </h2>
      <p style="font-size: 13px; font-weight: 600; margin: 0; color: #000;">
        ประจำเดือน ${monthDisplay}
      </p>
    </div>

    <div style="margin-bottom: 16px; font-size: 12px; color: #000; line-height: 1.6;">
      <div style="display: flex; justify-content: space-between; flex-wrap: wrap; margin-bottom: 4px;">
        <div><span style="font-weight: bold;">ผู้จัดทำเอกสาร:</span> ${authorFullName}</div>
        <div><span style="font-weight: bold;">ตำแหน่ง:</span> ${recorder.position || '-'}</div>
      </div>
      <div style="display: flex; justify-content: space-between; flex-wrap: wrap;">
        <div><span style="font-weight: bold;">สายงาน/หน่วยงาน:</span> ${affiliationDept}</div>
        <div><span style="font-weight: bold;">โทรศัพท์:</span> ${recorder.phone || '-'}</div>
      </div>
    </div>
  `;
}

/**
 * Builds HTML for Continuation Header (Page 2+)
 */
function buildContinuationHeaderHtml(executive: ExecutiveInfo): string {
  const speaker = formatSpeakerInfo(executive);
  const monthDisplay = executive.month?.includes('2570')
    ? executive.month
    : `${executive.month || 'มกราคม'} 2570`;

  return `
    <div style="margin-bottom: 16px; border-bottom: 1px solid #000; padding-bottom: 8px;">
      <div style="text-align: center; font-size: 13px; font-weight: bold; margin-bottom: 2px;">
        รายงานการสื่อสารตามแผนการสื่อสารภายในและภายนอกองค์กรของผู้บริหาร (ต่อ)
      </div>
      <div style="text-align: center; font-size: 11px; font-weight: 600; color: #374151; margin-bottom: 6px;">
        ประจำเดือน ${monthDisplay}
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 11px; color: #000;">
        <div><span style="font-weight: bold;">ผู้ถ่ายทอดสาร:</span> ${speaker.fullName} (${speaker.position})</div>
        <div><span style="font-weight: bold;">สังกัด:</span> ${speaker.affiliationAndDept}</div>
      </div>
    </div>
  `;
}

/**
 * Builds HTML for 5-Column Communication Table
 */
function buildTableHtml(items: CommunicationTopicItem[], executive: ExecutiveInfo): string {
  const speaker = formatSpeakerInfo(executive);

  const rowsHtml = items.map((item) => {
    const channels = formatChannels(item);
    const audiences = formatAudiences(item);

    // Topics list
    const topicsHtml = item.selectedTopics && item.selectedTopics.length > 0
      ? item.selectedTopics.map((t) => `<div style="font-weight: bold; margin-bottom: 2px;">• ${t}</div>`).join('')
      : '<div style="font-weight: bold; color: #6b7280; font-style: italic;">• ไม่ได้ระบุประเด็น</div>';

    // Details text
    const detailsHtml = item.details
      ? `<div style="font-size: 11px; color: #000; line-height: 1.4; margin-top: 4px; white-space: pre-wrap;">${item.details}</div>`
      : '<div style="font-size: 11px; color: #9ca3af; font-style: italic; margin-top: 4px;">- ไม่มีรายละเอียด -</div>';

    // Channels list
    const channelsHtml = channels.map((c) => `<li style="margin-bottom: 2px;">${c}</li>`).join('');

    // Audiences list
    const audiencesHtml = audiences.map((a) => `<li style="margin-bottom: 2px;">${a}</li>`).join('');

    // Evidence
    let evidenceHtml = '<div style="font-size: 11px; color: #6b7280; font-style: italic;">-</div>';
    if (item.evidenceFiles && item.evidenceFiles.length > 0) {
      evidenceHtml = item.evidenceFiles.map((file) => `
        <div style="border: 1px solid #000; padding: 3px; margin-bottom: 4px; background: #fff; font-size: 10px; text-align: center; break-inside: avoid;">
          ${file.previewUrl || (file.url?.startsWith('data:image') ? file.url : '') ? `<img src="${file.previewUrl || file.url}" alt="ภาพตัวอย่างเอกสาร" style="display:block;width:82px;height:96px;object-fit:contain;margin:0 auto 3px;border:1px solid #d1d5db;background:#fff;" />` : `<div style="width:82px;height:96px;margin:0 auto 3px;border:1px solid #d1d5db;display:flex;align-items:center;justify-content:center;color:#64748b;font-size:9px;">ไม่พบภาพตัวอย่าง</div>`}
          <div style="font-weight: 600; overflow-wrap:anywhere; max-width: 95px; margin: 0 auto; font-size:8px;">${file.name}</div>
        </div>
      `).join('');
    }

    return `
      <tr style="border-bottom: 1px solid #000; vertical-align: top; font-size: 11px;">
        <td style="border: 1px solid #000; padding: 6px; width: 18%; vertical-align: top;">
          <div style="font-weight: bold; color: #000;">${speaker.fullName}</div>
          <div style="font-size: 10px; color: #111; margin-top: 2px;">${speaker.position}</div>
          ${speaker.affiliationAndDept !== '-' ? `<div style="font-size: 9px; color: #4b5563; margin-top: 2px;">${speaker.affiliationAndDept}</div>` : ''}
        </td>
        <td style="border: 1px solid #000; padding: 6px; width: 33%; vertical-align: top;">
          ${topicsHtml}
          ${detailsHtml}
        </td>
        <td style="border: 1px solid #000; padding: 6px; width: 17%; vertical-align: top;">
          <ul style="margin: 0; padding-left: 14px;">${channelsHtml}</ul>
        </td>
        <td style="border: 1px solid #000; padding: 6px; width: 17%; vertical-align: top;">
          <ul style="margin: 0; padding-left: 14px;">${audiencesHtml}</ul>
        </td>
        <td style="border: 1px solid #000; padding: 6px; width: 15%; vertical-align: top; text-align: center;">
          ${evidenceHtml}
        </td>
      </tr>
    `;
  }).join('');

  return `
    <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; margin-bottom: 14px; background: #fff;">
      <thead>
        <tr style="border-bottom: 2px solid #000; background: #fff; font-size: 11px;">
          <th style="border: 1px solid #000; padding: 6px; text-align: center; font-weight: bold; width: 18%;">ผู้ถ่ายทอดสาร</th>
          <th style="border: 1px solid #000; padding: 6px; text-align: center; font-weight: bold; width: 33%;">ประเด็นการสื่อสาร</th>
          <th style="border: 1px solid #000; padding: 6px; text-align: center; font-weight: bold; width: 17%;">ช่องทางการสื่อสาร</th>
          <th style="border: 1px solid #000; padding: 6px; text-align: center; font-weight: bold; width: 17%;">ผู้รับสาร</th>
          <th style="border: 1px solid #000; padding: 6px; text-align: center; font-weight: bold; width: 15%;">หลักฐาน (ถ้ามี)</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml || `<tr><td colspan="5" style="border: 1px solid #000; padding: 14px; text-align: center; color: #6b7280; font-style: italic;">- ไม่มีรายการรายละเอียดการสื่อสาร -</td></tr>`}
      </tbody>
    </table>
  `;
}

/**
 * Builds HTML for Problem and Suggestion Sections (Section 8)
 */
function buildFeedbackHtml(feedback: FeedbackInfo): string {
  const problems = feedback.problemsObstacles?.trim() || '- ไม่มี -';
  const suggestions = feedback.executiveSuggestions?.trim() || '- ไม่มี -';

  return `
    <div style="margin-top: 10px; border-top: 1px solid #000; padding-top: 10px; font-size: 11px;">
      <div style="margin-bottom: 8px;">
        <span style="font-weight: bold; display: block; margin-bottom: 2px;">ปัญหาและอุปสรรคในการสื่อสาร:</span>
        <div style="padding-left: 10px; white-space: pre-wrap; line-height: 1.4; color: #111;">${problems}</div>
      </div>
      <div>
        <span style="font-weight: bold; display: block; margin-bottom: 2px;">ข้อเสนอแนะของผู้บริหารในการสื่อสาร:</span>
        <div style="padding-left: 10px; white-space: pre-wrap; line-height: 1.4; color: #111;">${suggestions}</div>
      </div>
    </div>
  `;
}

/**
 * Main Service: Generates real binary PDF from Form State
 */
export async function generatePdf(
  recorder: RecorderInfo,
  executive: ExecutiveInfo,
  topics: CommunicationTopicItem[],
  feedback: FeedbackInfo,
  settings?: PdfPrintSettings
): Promise<GeneratedPdfResult> {
  const pageChunks = paginateDocument(topics, feedback);
  const totalPages = pageChunks.length;

  const pageImages: string[] = [];
  const createdElements: HTMLDivElement[] = [];

  // Create jsPDF instance (A4 Portrait, mm units)
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true
  });
  registerNotoSansThaiFonts(pdf);

  try {
    for (let pIdx = 0; pIdx < totalPages; pIdx++) {
      const chunk = pageChunks[pIdx];
      const isFirstPage = pIdx === 0;

      let contentHtml = '';

      if (isFirstPage) {
        contentHtml += buildHeaderAndAuthorHtml(recorder, executive);
      } else {
        contentHtml += buildContinuationHeaderHtml(executive);
      }

      contentHtml += buildTableHtml(chunk.items, executive);

      if (chunk.hasProblemAndSuggestion) {
        contentHtml += buildFeedbackHtml(feedback);
      }

      // Create DOM element
      const pageEl = createPageElement(contentHtml, pIdx + 1, totalPages);
      createdElements.push(pageEl);

      // Pre-sanitize DOM element before rendering to convert oklch to RGB
      sanitizeElementColors(pageEl, typeof window !== 'undefined' ? window : ({} as Window));

      // Render DOM to high-res Canvas
      const canvas = await html2canvas(pageEl, {
        scale: 2, // High DPI for crisp text
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc, clonedEl) => {
          sanitizeClonedDocument(clonedDoc, clonedEl);
        }
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      pageImages.push(imgData);

      // Add to jsPDF
      if (pIdx > 0) {
        pdf.addPage();
      }
      pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
    }

    // Output real binary Blob
    const blob = pdf.output('blob');
    const blobUrl = URL.createObjectURL(blob);

    return {
      blob,
      blobUrl,
      pageImages,
      pageCount: totalPages
    };
  } finally {
    // Clean up temporary DOM elements
    createdElements.forEach((el) => {
      if (el.parentNode) {
        el.parentNode.removeChild(el);
      }
    });
  }
}
