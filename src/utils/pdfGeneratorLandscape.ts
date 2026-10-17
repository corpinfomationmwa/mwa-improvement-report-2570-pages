import React from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { ReportRecord, CommunicationTopicItem } from '../types/mwa';
import { registerNotoSansThaiFonts } from '../fonts/notoSansThaiFonts';
import {
  formatFullName,
  formatSpeakerInfo,
  formatChannels,
  formatAudiences
} from './pdfLayout';
import { recordToPrintPayload, PrintPayload } from './mwaPrintConverter';
import { PrintDocument } from '../components/PrintDocument';
import { setCurrentPdf } from '../services/currentPdfStore';
import { sanitizeElementColors, sanitizeClonedDocument } from './cssColorSanitizer';

export interface GeneratedLandscapePdf {
  blob: Blob;
  base64: string;
  filename: string;
  sizeBytes: number;
}

/**
 * Converts ArrayBuffer directly to standard Base64 string without data URI prefix.
 * Compatible with both Browser (btoa) and Node.js (Buffer) runtimes.
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(buffer).toString('base64');
  }
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const len = bytes.byteLength;
  const chunkSize = 8192;
  for (let i = 0; i < len; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, len));
    binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
  }
  return btoa(binary);
}

/**
 * Builds filename according to specification:
 * รายงานการสื่อสาร_{เดือนที่สื่อสาร}_{Record ID}.pdf
 * Example: รายงานการสื่อสาร_มกราคม2570_15.pdf
 */
export function buildPdfFilename(record: ReportRecord): string {
  const monthRaw = (record.month || record.executiveMonth || 'มกราคม2570').trim();
  const cleanMonth = monthRaw.replace(/\s+/g, '');
  return `รายงานการสื่อสาร_${cleanMonth}_${record.id}.pdf`;
}

// A4 Landscape dimensions at 96 DPI (297mm × 210mm with 10mm padding)
const A4_LANDSCAPE_WIDTH_PX = 1122;
const A4_LANDSCAPE_HEIGHT_PX = 794;
const A4_LANDSCAPE_PADDING_PX = 38;

/**
 * Waits for fonts and all images inside a DOM container to finish loading.
 */
async function waitForAssetsReady(container: HTMLElement): Promise<void> {
  if (typeof document !== 'undefined' && (document as any).fonts) {
    try {
      const fontSet = (document as any).fonts;
      // Request the exact font faces used by PrintDocument before measuring text.
      // This avoids a fallback font being captured while the web font is still loading.
      await Promise.all([
        fontSet.load('10pt Sarabun'),
        fontSet.load('bold 13pt Sarabun'),
        fontSet.load('600 11.5pt Sarabun')
      ]);
      await fontSet.ready;
    } catch {
      // Continue with the browser fallback if the font provider is unavailable.
    }
  }

  const images = Array.from(container.querySelectorAll('img'));
  if (images.length > 0) {
    await Promise.all(
      images.map((img) => {
        if (img.complete) return Promise.resolve();
        return new Promise<void>((resolve) => {
          img.onload = () => resolve();
          img.onerror = () => resolve();
        });
      })
    );
  }

  // Wait one animation frame for layout stabilization
  if (typeof window !== 'undefined' && window.requestAnimationFrame) {
    await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
  }
}

/**
 * Creates an offscreen A4 Landscape sheet element and renders the exact <PrintDocument /> component into it.
 */
async function renderPrintDocumentSheet(
  payload: PrintPayload,
  topicsChunk: CommunicationTopicItem[],
  showHeaderAndMeta: boolean,
  showFeedbackAndSignoff: boolean
): Promise<{ sheetEl: HTMLDivElement; cleanup: () => void }> {
  const wrapper = document.createElement('div');
  wrapper.style.position = 'fixed';
  wrapper.style.left = '-10000px';
  wrapper.style.top = '0';
  wrapper.style.width = `${A4_LANDSCAPE_WIDTH_PX}px`;
  wrapper.style.minHeight = `${A4_LANDSCAPE_HEIGHT_PX}px`;
  wrapper.style.padding = `${A4_LANDSCAPE_PADDING_PX}px`;
  wrapper.style.backgroundColor = '#ffffff';
  wrapper.style.color = '#000000';
  wrapper.style.boxSizing = 'border-box';
  wrapper.style.fontFamily = "'Sarabun', 'TH Sarabun New', sans-serif";
  wrapper.style.zIndex = '-9999';
  wrapper.setAttribute('data-pdf-capture-sheet', 'true');

  document.body.appendChild(wrapper);

  const root = createRoot(wrapper);
  flushSync(() => {
    root.render(
      React.createElement(PrintDocument, {
        recorder: payload.recorder,
        executive: payload.executive,
        topics: topicsChunk,
        feedback: payload.feedback,
        isInteractivePreview: true,
        recordId: payload.recordId,
        submissionId: payload.submissionId,
        showHeaderAndMeta,
        showFeedbackAndSignoff
      })
    );
  });

  await waitForAssetsReady(wrapper);

  const cleanup = () => {
    try {
      root.unmount();
    } catch {
      // Ignore unmount errors
    }
    if (wrapper.parentNode) {
      wrapper.parentNode.removeChild(wrapper);
    }
  };

  return { sheetEl: wrapper, cleanup };
}

/**
 * Captures a rendered A4 Landscape sheet element into a high-resolution Canvas using html2canvas,
 * sanitizing any Tailwind v4 oklch/oklab/color-mix rules in the element and cloned document to standard RGB/RGBA.
 */
async function captureSheetToCanvas(sheetEl: HTMLElement): Promise<HTMLCanvasElement> {
  // Pre-sanitize the offscreen sheet element before cloning to convert any oklch/oklab to RGB inline
  sanitizeElementColors(sheetEl, typeof window !== 'undefined' ? window : ({} as Window));

  return html2canvas(sheetEl, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    logging: false,
    backgroundColor: '#ffffff',
    width: A4_LANDSCAPE_WIDTH_PX,
    windowWidth: A4_LANDSCAPE_WIDTH_PX,
    onclone: async (clonedDoc, clonedEl) => {
      sanitizeClonedDocument(clonedDoc, clonedEl);
      // Ensure the cloned document has loaded the same Sarabun font before html2canvas
      // computes text layout. The Google Fonts stylesheet is preserved above.
      try {
        const fontSet = (clonedDoc as any).fonts;
        if (fontSet) {
          await Promise.all([
            fontSet.load('10pt Sarabun'),
            fontSet.load('bold 13pt Sarabun'),
            fontSet.load('600 11.5pt Sarabun')
          ]);
          await fontSet.ready;
        }
      } catch {
        // Do not fail PDF generation if the external font provider is temporarily unavailable.
      }
    }
  });
}

/**
 * Generates the A4 Landscape PDF directly from the web page's <PrintDocument /> DOM ("PDF หน้าเว็บ")
 * so that Preview, Download, Base64, Apps Script, and Email all use the exact same PDF document.
 */
async function generateWebPageDomPdf(
  record: ReportRecord,
  filename: string
): Promise<GeneratedLandscapePdf> {
  const payload = recordToPrintPayload(record);

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
    compress: true
  });

  const authorFullName = formatFullName(
    payload.recorder.title,
    payload.recorder.name,
    payload.recorder.surname
  );

  doc.setProperties({
    title: `รายงานการสื่อสารของผู้บริหารตามแผนการสื่อสาร ประจำปีงบประมาณ 2570`,
    subject: `รายงานการสื่อสาร ประจำเดือน ${payload.executive.month}`,
    author: authorFullName || 'ผู้จัดทำเอกสาร',
    creator: 'MWA Communication Report System'
  });

  // First, render the complete PrintDocument on a single sheet to measure its height
  const firstPass = await renderPrintDocumentSheet(payload, payload.topics, true, true);

  try {
    const totalScrollHeight = firstPass.sheetEl.scrollHeight;

    // If the entire document fits on 1 A4 Landscape page (<= 815px height), capture it directly as 1 page
    if (totalScrollHeight <= A4_LANDSCAPE_HEIGHT_PX + 20 || payload.topics.length <= 1) {
      const canvas = await captureSheetToCanvas(firstPass.sheetEl);
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      doc.addImage(imgData, 'JPEG', 0, 0, 297, 210, undefined, 'FAST');
    } else {
      // Multi-page pagination: measure each topic row in tbody so no row is cut across pages
      const rowElements = Array.from(
        firstPass.sheetEl.querySelectorAll('table.mwa-print-table tbody tr')
      ) as HTMLElement[];
      const rowHeights = rowElements.map((tr) => Math.max(tr.offsetHeight, 48));

      const maxPrintableHeightFirstPage = A4_LANDSCAPE_HEIGHT_PX - A4_LANDSCAPE_PADDING_PX * 2 - 150; // Leave room for header + metadata + table thead
      const maxPrintableHeightNextPage = A4_LANDSCAPE_HEIGHT_PX - A4_LANDSCAPE_PADDING_PX * 2 - 45; // Leave room for table thead
      const feedbackAndSignoffReserve = 165;

      const chunks: CommunicationTopicItem[][] = [];
      let currentChunk: CommunicationTopicItem[] = [];
      let currentHeight = 0;
      let isFirstPageChunk = true;

      payload.topics.forEach((topic, idx) => {
        const rowH = rowHeights[idx] || 65;
        const limit = isFirstPageChunk ? maxPrintableHeightFirstPage : maxPrintableHeightNextPage;

        if (currentChunk.length > 0 && currentHeight + rowH > limit) {
          chunks.push(currentChunk);
          currentChunk = [topic];
          currentHeight = rowH;
          isFirstPageChunk = false;
        } else {
          currentChunk.push(topic);
          currentHeight += rowH;
        }
      });

      if (currentChunk.length > 0) {
        chunks.push(currentChunk);
      }

      // Check if the last page has enough vertical room for Feedback + Executive Signoff
      const lastLimit = chunks.length === 1 ? maxPrintableHeightFirstPage : maxPrintableHeightNextPage;
      const separateFeedbackPage = currentHeight + feedbackAndSignoffReserve > lastLimit && chunks[chunks.length - 1].length > 1;

      firstPass.cleanup();

      for (let i = 0; i < chunks.length; i++) {
        const isFirst = i === 0;
        const isLast = i === chunks.length - 1 && !separateFeedbackPage;
        const pagePass = await renderPrintDocumentSheet(payload, chunks[i], isFirst, isLast);
        try {
          const canvas = await captureSheetToCanvas(pagePass.sheetEl);
          const imgData = canvas.toDataURL('image/jpeg', 0.95);
          if (i > 0) {
            doc.addPage();
          }
          doc.addImage(imgData, 'JPEG', 0, 0, 297, 210, undefined, 'FAST');
        } finally {
          pagePass.cleanup();
        }
      }

      if (separateFeedbackPage) {
        // Render last topic on the final page along with Feedback & Signoff so the table is never empty
        const lastChunk = chunks[chunks.length - 1];
        const feedbackPass = await renderPrintDocumentSheet(
          payload,
          [lastChunk[lastChunk.length - 1]],
          false,
          true
        );
        try {
          const canvas = await captureSheetToCanvas(feedbackPass.sheetEl);
          const imgData = canvas.toDataURL('image/jpeg', 0.95);
          doc.addPage();
          doc.addImage(imgData, 'JPEG', 0, 0, 297, 210, undefined, 'FAST');
        } finally {
          feedbackPass.cleanup();
        }
      }
    }
  } finally {
    firstPass.cleanup();
  }

  const arrayBuffer = doc.output('arraybuffer');
  const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
  const rawBase64 = arrayBufferToBase64(arrayBuffer);
  const cleanBase64 = rawBase64.replace(/^data:application\/pdf;base64,/, '').trim();

  if (!cleanBase64 || cleanBase64.length <= 1000 || blob.size <= 1000) {
    throw new Error('สร้าง PDF ไม่สำเร็จ จึงยังไม่ส่ง Email');
  }

  // Save into Single Source of Truth store
  setCurrentPdf({
    blob,
    base64: cleanBase64,
    fileName: filename,
    recordId: record.id,
    submissionId: record.submissionId
  });

  return {
    blob,
    base64: cleanBase64,
    filename,
    sizeBytes: blob.size
  };
}

/**
 * Fallback generator for non-browser (Node.js CLI test) environments where DOM/html2canvas is unavailable.
 * Uses the exact same PrintPayload fields and headings as PrintDocument.tsx.
 */
function generateNodeFallbackPdf(
  record: ReportRecord,
  filename: string
): GeneratedLandscapePdf {
  const payload = recordToPrintPayload(record);
  const { recorder, executive, topics, feedback } = payload;

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
    compress: true
  });

  registerNotoSansThaiFonts(doc);
  doc.setFont('NotoSansThai', 'normal');

  const monthDisplay = /\d{4}/.test(executive.month || '')
    ? executive.month
    : `${executive.month || 'มกราคม'} 2570`;
  const authorFullName = formatFullName(recorder.title, recorder.name, recorder.surname) || 'นาย สมศักดิ์ สุขประเสริฐ';
  const executiveFullName = formatFullName(executive.title, executive.name, executive.surname) || 'นายสุรชัย วงศ์ปัญญา';
  const affiliationDept = [recorder.affiliation, recorder.department].filter(Boolean).join(' / ') || '-';
  const speaker = formatSpeakerInfo(executive);

  const pageWidth = 297;
  const pageHeight = 210;
  const margin = 10;
  const contentWidth = pageWidth - margin * 2; // 277mm

  // 5 Columns matching PrintDocument.tsx proportions: 16%, 40%, 15%, 15%, 14%
  const colWidths = [44, 111, 42, 42, 38];
  const colX = [
    margin,
    margin + colWidths[0],
    margin + colWidths[0] + colWidths[1],
    margin + colWidths[0] + colWidths[1] + colWidths[2],
    margin + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3]
  ];

  // 1. Header
  doc.setFont('NotoSansThai', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(0, 0, 0);
  doc.text(
    'รายงานการสื่อสารตามแผนการสื่อสารภายในและภายนอกองค์กรของผู้บริหาร ประจำปีงบประมาณ 2570',
    pageWidth / 2,
    16,
    { align: 'center' }
  );
  doc.setFontSize(11.5);
  doc.text(`ประจำเดือน ${monthDisplay}`, pageWidth / 2, 22, { align: 'center' });

  // 2. Document Creator Metadata (2 Columns, matching PrintDocument.tsx)
  doc.setFontSize(10);
  doc.setFont('NotoSansThai', 'normal');
  doc.text(`ผู้จัดทำเอกสาร: ${authorFullName}`, margin, 30);
  doc.text(`ตำแหน่ง: ${recorder.position || '-'}`, margin + 150, 30);
  doc.text(`สายงาน/หน่วยงาน: ${affiliationDept}`, margin, 35.5);
  doc.text(`โทรศัพท์: ${recorder.phone || '-'}`, margin + 150, 35.5);
  doc.text(`อีเมล: ${recorder.email || '-'}`, margin, 41);

  // 3. Table Header
  let currentY = 46;
  const drawTableHeader = (startY: number): number => {
    doc.setDrawColor(0, 0, 0);
    doc.rect(margin, startY, contentWidth, 8, 'S');
    for (let i = 1; i < colX.length; i++) {
      doc.line(colX[i], startY, colX[i], startY + 8);
    }
    doc.setFont('NotoSansThai', 'bold');
    doc.setFontSize(10);
    doc.text('ผู้ถ่ายทอดสาร', colX[0] + colWidths[0] / 2, startY + 5.5, { align: 'center' });
    doc.text('ประเด็นการสื่อสาร', colX[1] + colWidths[1] / 2, startY + 5.5, { align: 'center' });
    doc.text('ช่องทางการสื่อสาร', colX[2] + colWidths[2] / 2, startY + 5.5, { align: 'center' });
    doc.text('ผู้รับสาร', colX[3] + colWidths[3] / 2, startY + 5.5, { align: 'center' });
    doc.text('หลักฐาน (ถ้ามี)', colX[4] + colWidths[4] / 2, startY + 5.5, { align: 'center' });
    return startY + 8;
  };

  currentY = drawTableHeader(currentY);

  for (let idx = 0; idx < topics.length; idx++) {
    const item = topics[idx];
    const col1Lines = [speaker.fullName, speaker.position];
    if (speaker.affiliationAndDept !== '-') col1Lines.push(speaker.affiliationAndDept);

    const col2Lines: string[] = [];
    if (item.selectedTopics && item.selectedTopics.length > 0) {
      item.selectedTopics.forEach((t) => {
        const wrapped = doc.splitTextToSize(`• ${t}`, colWidths[1] - 4) as string[];
        col2Lines.push(...wrapped);
      });
    }
    if (item.details) {
      const wrappedDetails = doc.splitTextToSize(item.details, colWidths[1] - 4) as string[];
      col2Lines.push(...wrappedDetails);
    }

    const col3Lines = formatChannels(item);
    const col4Lines = formatAudiences(item);
    const col5Lines =
      item.evidenceFiles && item.evidenceFiles.length > 0
        ? item.evidenceFiles.map((f) => f.name)
        : ['-'];

    const lineHeight = 4.5;
    const maxLines = Math.max(col1Lines.length, col2Lines.length, col3Lines.length, col4Lines.length, col5Lines.length, 3);
    const rowHeight = Math.max(maxLines * lineHeight + 4, 15);

    if (currentY + rowHeight > pageHeight - margin - 35) {
      doc.addPage();
      currentY = drawTableHeader(margin);
    }

    doc.rect(margin, currentY, contentWidth, rowHeight, 'S');
    for (let i = 1; i < colX.length; i++) {
      doc.line(colX[i], currentY, colX[i], currentY + rowHeight);
    }

    doc.setFont('NotoSansThai', 'normal');
    doc.setFontSize(9);
    col1Lines.forEach((l, i) => doc.text(l, colX[0] + 2, currentY + 4.5 + i * lineHeight));
    col2Lines.forEach((l, i) => doc.text(l, colX[1] + 2, currentY + 4.5 + i * lineHeight));
    col3Lines.forEach((l, i) => doc.text(`• ${l}`, colX[2] + 2, currentY + 4.5 + i * lineHeight));
    col4Lines.forEach((l, i) => doc.text(`• ${l}`, colX[3] + 2, currentY + 4.5 + i * lineHeight));
    col5Lines.forEach((l, i) => doc.text(l, colX[4] + 2, currentY + 4.5 + i * lineHeight));

    currentY += rowHeight;
  }

  // 4. Problems and Suggestions
  currentY += 6;
  doc.setFont('NotoSansThai', 'bold');
  doc.setFontSize(10);
  doc.text('ปัญหาและอุปสรรคในการสื่อสาร:', margin, currentY);
  currentY += 5;
  doc.setFont('NotoSansThai', 'normal');
  doc.setFontSize(9.5);
  doc.text(feedback.problemsObstacles?.trim() || '- ไม่มี -', margin + 4, currentY);

  currentY += 6;
  doc.setFont('NotoSansThai', 'bold');
  doc.setFontSize(10);
  doc.text('ข้อเสนอแนะของผู้บริหารในการสื่อสาร:', margin, currentY);
  currentY += 5;
  doc.setFont('NotoSansThai', 'normal');
  doc.setFontSize(9.5);
  doc.text(feedback.executiveSuggestions?.trim() || '- ไม่มี -', margin + 4, currentY);

  // 5. Executive Signoff
  const signoffX = pageWidth - margin - 40;
  const signoffY = Math.max(currentY + 10, pageHeight - margin - 22);
  doc.setFont('NotoSansThai', 'bold');
  doc.setFontSize(10);
  doc.text(`(${executiveFullName})`, signoffX, signoffY, { align: 'center' });
  doc.setFont('NotoSansThai', 'normal');
  doc.setFontSize(9.5);
  doc.text(executive.position || '', signoffX, signoffY + 5, { align: 'center' });

  const arrayBuffer = doc.output('arraybuffer');
  const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
  const rawBase64 = arrayBufferToBase64(arrayBuffer);
  const cleanBase64 = rawBase64.replace(/^data:application\/pdf;base64,/, '').trim();

  setCurrentPdf({
    blob,
    base64: cleanBase64,
    fileName: filename,
    recordId: record.id,
    submissionId: record.submissionId
  });

  return {
    blob,
    base64: cleanBase64,
    filename,
    sizeBytes: blob.size
  };
}

/**
 * Generates an official A4 Landscape PDF binary blob and pure base64 string strictly from the Web Page PDF (<PrintDocument />).
 * Single Source of Truth:
 * ข้อมูลฟอร์ม -> PDF หน้าเว็บ (<PrintDocument />) -> Preview & Base64 -> Apps Script -> Email
 */
export async function generateLandscapePdfBlob(
  record: ReportRecord,
  simulations?: { simulatePdfFailure?: boolean }
): Promise<GeneratedLandscapePdf> {
  if (simulations?.simulatePdfFailure) {
    throw new Error('จำลองความล้มเหลวในการสร้างไฟล์ PDF (PDF Generation Failed)');
  }

  const filename = buildPdfFilename(record);

  // In the browser, always capture the exact Web Page PDF (<PrintDocument />) so Preview and Email PDF are 100% identical
  if (typeof document !== 'undefined' && typeof window !== 'undefined') {
    return generateWebPageDomPdf(record, filename);
  }

  // Fallback for headless Node.js test scripts
  return generateNodeFallbackPdf(record, filename);
}
