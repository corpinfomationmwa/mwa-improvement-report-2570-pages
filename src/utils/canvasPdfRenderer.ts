import { CommunicationTopicItem } from '../types/mwa';
import { PrintPayload } from './mwaPrintConverter';
import { formatAudiences, formatChannels, formatFullName, formatSpeakerInfo } from './pdfLayout';

const PAGE_WIDTH = 1754;
const PAGE_HEIGHT = 1240;
const PAGE_MARGIN = 58;
// The reference PDF embeds Sarabun Regular, SemiBold, and Bold. Keep Sarabun
// first and explicit so the browser does not silently substitute another Thai face.
const FONT_FAMILY = '"Sarabun", sans-serif';

interface EvidencePreview {
  name: string;
  image?: HTMLImageElement;
}

interface MeasuredRow {
  topic: CommunicationTopicItem;
  columns: string[][];
  boldTopicLineCount: number;
  evidence: EvidencePreview[];
  height: number;
}

interface PageChunk {
  rows: MeasuredRow[];
  firstPage: boolean;
}

function waitForImage(src: string): Promise<HTMLImageElement | undefined> {
  return new Promise((resolve) => {
    const image = new Image();
    if (/^https?:/i.test(src)) image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => resolve(undefined);
    image.src = src;
    if (image.complete) resolve(image.naturalWidth ? image : undefined);
  });
}

async function ensureSarabunLoaded(): Promise<void> {
  if (!document.getElementById('mwa-pdf-sarabun-font')) {
    const link = document.createElement('link');
    link.id = 'mwa-pdf-sarabun-font';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap';
    document.head.appendChild(link);
    await new Promise<void>((resolve) => {
      link.onload = () => resolve();
      link.onerror = () => resolve();
      window.setTimeout(resolve, 4000);
    });
  }
  if (document.fonts) {
    try {
      await Promise.all([
        document.fonts.load('400 22px "Sarabun"'),
        document.fonts.load('600 23px "Sarabun"'),
        document.fonts.load('700 34px "Sarabun"'),
        document.fonts.ready
      ]);
    } catch {
      // Canvas still has Thai-capable browser fallback fonts if Google Fonts is unavailable.
    }
  }
}

function graphemes(text: string): string[] {
  const Segmenter = (Intl as any).Segmenter;
  if (Segmenter) {
    return Array.from(new Segmenter('th', { granularity: 'grapheme' }).segment(text), (part: any) => part.segment);
  }
  return Array.from(text);
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const paragraphs = String(text || '-').split('\n');
  const lines: string[] = [];

  paragraphs.forEach((paragraph) => {
    if (!paragraph) {
      lines.push('');
      return;
    }
    let line = '';
    let lastSpace = -1;
    for (const part of graphemes(paragraph)) {
      const candidate = line + part;
      if (line && ctx.measureText(candidate).width > maxWidth) {
        if (lastSpace >= 0) {
          lines.push(line.slice(0, lastSpace).trimEnd());
          line = line.slice(lastSpace + 1).trimStart() + part;
        } else {
          lines.push(line);
          line = part;
        }
        lastSpace = line.lastIndexOf(' ');
      } else {
        line = candidate;
        if (/\s/.test(part)) lastSpace = line.length - part.length;
      }
    }
    if (line) lines.push(line.trimEnd());
  });

  return lines.length ? lines : ['-'];
}

function isImageEvidence(file: { name?: string; type?: string; url?: string }): boolean {
  const type = (file.type || '').toLowerCase();
  const source = (file.url || '').toLowerCase();
  const ext = ((file.name || source).split('?')[0].split('.').pop() || '').toLowerCase();
  return type.startsWith('image/') || source.startsWith('data:image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext);
}

async function measureRows(payload: PrintPayload, ctx: CanvasRenderingContext2D): Promise<MeasuredRow[]> {
  const speaker = formatSpeakerInfo(payload.executive);
  const prepared = await Promise.all(payload.topics.map(async (topic) => {
    const files = (topic.evidenceFiles || []).map((file, index) => {
      const imageUrl = file.previewUrl || (isImageEvidence(file) ? file.url : undefined);
      return { name: file.name || `ไฟล์แนบ ${index + 1}`, imageUrl };
    });
    const evidence = await Promise.all(files.map(async (file) => ({
      name: file.name,
      image: file.imageUrl ? await waitForImage(file.imageUrl) : undefined
    })));

    const widths = [0.16, 0.40, 0.15, 0.15, 0.14].map((ratio) => (PAGE_WIDTH - PAGE_MARGIN * 2) * ratio);
    const contentWidth = (index: number) => widths[index] - 24;
    const c1: string[] = [];
    ctx.font = `700 23px ${FONT_FAMILY}`;
    c1.push(...wrapText(ctx, speaker.fullName, contentWidth(0)));
    ctx.font = `400 21px ${FONT_FAMILY}`;
    c1.push(...wrapText(ctx, speaker.position, contentWidth(0)));
    if (speaker.affiliationAndDept !== '-') c1.push(...wrapText(ctx, speaker.affiliationAndDept, contentWidth(0)));

    const c2: string[] = [];
    const selected = topic.selectedTopics?.length ? topic.selectedTopics : ['ไม่ได้ระบุประเด็น'];
    ctx.font = `700 23px ${FONT_FAMILY}`;
    selected.forEach((entry) => c2.push(...wrapText(ctx, `• ${entry}`, contentWidth(1))));
    const boldTopicLineCount = c2.length;
    ctx.font = `400 22px ${FONT_FAMILY}`;
    c2.push(...wrapText(ctx, topic.details || '- ไม่มีรายละเอียด -', contentWidth(1)));
    if (topic.additionalDetails) c2.push(...wrapText(ctx, `ข้อมูลเพิ่มเติม: ${topic.additionalDetails}`, contentWidth(1)));

    ctx.font = `400 21px ${FONT_FAMILY}`;
    const c3 = formatChannels(topic).flatMap((entry) => wrapText(ctx, `• ${entry}`, contentWidth(2)));
    const c4 = formatAudiences(topic).flatMap((entry) => wrapText(ctx, `• ${entry}`, contentWidth(3)));
    const lineHeight = 31;
    const textHeight = Math.max(c1.length, c2.length, c3.length, c4.length) * lineHeight + 28;
    const evidenceHeight = evidence.length ? evidence.length * 122 + 16 : 0;

    return {
      topic,
      columns: [c1, c2, c3, c4, []],
      boldTopicLineCount,
      evidence,
      height: Math.max(68, textHeight, evidenceHeight)
    };
  }));
  return prepared;
}

function firstPageTableY(payload: PrintPayload, ctx: CanvasRenderingContext2D): number {
  ctx.font = `700 34px ${FONT_FAMILY}`;
  const titleLines = wrapText(ctx, 'รายงานการสื่อสารตามแผนการสื่อสารภายในและภายนอกองค์กรของผู้บริหาร ประจำปีงบประมาณ 2570', PAGE_WIDTH - PAGE_MARGIN * 2);
  let y = PAGE_MARGIN + titleLines.length * 40 + 32;
  y += 42; // month
  y += 3 * 38 + 40; // author metadata and spacing
  return y;
}

function wrapTextByCharacter(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const part of graphemes(text)) {
    const candidate = line + part;
    if (line && ctx.measureText(candidate).width > maxWidth) {
      lines.push(line.trimEnd());
      line = part.trimStart();
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line.trimEnd());
  return lines.length ? lines : [''];
}

function continuationTableY(): number {
  return PAGE_MARGIN + 90;
}

function feedbackHeight(payload: PrintPayload, ctx: CanvasRenderingContext2D, maxWidth: number): number {
  ctx.font = `400 22px ${FONT_FAMILY}`;
  const problems = wrapText(ctx, payload.feedback.problemsObstacles || '- ไม่มี -', maxWidth - 390);
  const suggestions = wrapText(ctx, payload.feedback.executiveSuggestions || '- ไม่มี -', maxWidth - 390);
  return 34 + Math.max(problems.length, 1) * 31 + Math.max(suggestions.length, 1) * 31 + 92;
}

function paginateRows(rows: MeasuredRow[], firstY: number, nextY: number, reserve: number): PageChunk[] {
  const chunks: PageChunk[] = [];
  let page: PageChunk = { rows: [], firstPage: true };
  let y = firstY + 55;
  let limit = PAGE_HEIGHT - PAGE_MARGIN - reserve;

  rows.forEach((row) => {
    if (page.rows.length && y + row.height > limit) {
      chunks.push(page);
      page = { rows: [], firstPage: false };
      y = nextY + 55;
      limit = PAGE_HEIGHT - PAGE_MARGIN - reserve;
    }
    page.rows.push(row);
    y += row.height;
  });
  if (page.rows.length || chunks.length === 0) chunks.push(page);
  return chunks;
}

function drawTextLines(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  x: number,
  y: number,
  fontSize: number,
  maxLines = Number.POSITIVE_INFINITY,
  bold = false
): void {
  ctx.font = `${bold ? '700' : '400'} ${fontSize}px ${FONT_FAMILY}`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  lines.slice(0, maxLines).forEach((line, index) => ctx.fillText(line, x, y + index * 31));
}

function drawHeader(ctx: CanvasRenderingContext2D, payload: PrintPayload, firstPage: boolean): number {
  const contentWidth = PAGE_WIDTH - PAGE_MARGIN * 2;
  ctx.fillStyle = '#000000';
  if (firstPage) {
    const title = 'รายงานการสื่อสารตามแผนการสื่อสารภายในและภายนอกองค์กรของผู้บริหาร ประจำปีงบประมาณ 2570';
    ctx.font = `700 34px ${FONT_FAMILY}`;
    ctx.textAlign = 'center';
    const titleLines = wrapText(ctx, title, contentWidth);
    titleLines.forEach((line, index) => ctx.fillText(line, PAGE_WIDTH / 2, PAGE_MARGIN + 34 + index * 40));
    ctx.font = `700 28px ${FONT_FAMILY}`;
    ctx.fillText(`ประจำเดือน ${payload.executive.month}`, PAGE_WIDTH / 2, PAGE_MARGIN + 42 + titleLines.length * 40);

    const metaY = PAGE_MARGIN + 96 + titleLines.length * 40;
    ctx.textAlign = 'left';
    ctx.font = `400 22px ${FONT_FAMILY}`;
    const leftWidth = PAGE_WIDTH / 2 - PAGE_MARGIN - 28;
    const rightWidth = leftWidth;
    const leftMeta = [
      `ผู้จัดทำเอกสาร: ${formatFullName(payload.recorder.title, payload.recorder.name, payload.recorder.surname)}`,
      `สายงาน/หน่วยงาน: ${[payload.recorder.affiliation, payload.recorder.department].filter(Boolean).join(' / ') || '-'}`,
      `อีเมล: ${payload.recorder.email || '-'}`
    ];
    const rightMeta = [
      `ตำแหน่ง: ${payload.recorder.position || '-'}`,
      `โทรศัพท์: ${payload.recorder.phone || '-'}`
    ];
    leftMeta.forEach((text, index) => {
      wrapTextByCharacter(ctx, text, leftWidth).forEach((line, lineIndex) =>
        ctx.fillText(line, PAGE_MARGIN, metaY + index * 38 + lineIndex * 26)
      );
    });
    rightMeta.forEach((text, index) => {
      wrapTextByCharacter(ctx, text, rightWidth).forEach((line, lineIndex) =>
        ctx.fillText(line, PAGE_WIDTH / 2 + 20, metaY + index * 38 + lineIndex * 26)
      );
    });
    return metaY + 112;
  }

  const speaker = formatSpeakerInfo(payload.executive);
  ctx.textAlign = 'center';
  ctx.font = `700 28px ${FONT_FAMILY}`;
  ctx.fillText('รายงานการสื่อสารตามแผนการสื่อสารภายในและภายนอกองค์กรของผู้บริหาร (ต่อ)', PAGE_WIDTH / 2, PAGE_MARGIN + 32);
  ctx.font = `600 23px ${FONT_FAMILY}`;
  ctx.fillText(`ประจำเดือน ${payload.executive.month}`, PAGE_WIDTH / 2, PAGE_MARGIN + 68);
  ctx.textAlign = 'left';
  ctx.font = `400 20px ${FONT_FAMILY}`;
  ctx.fillText(`ผู้ถ่ายทอดสาร: ${speaker.fullName} (${speaker.position})`, PAGE_MARGIN, PAGE_MARGIN + 105);
  ctx.fillText(`สังกัด: ${speaker.affiliationAndDept}`, PAGE_WIDTH / 2 + 20, PAGE_MARGIN + 105);
  return continuationTableY();
}

function drawTableHeader(ctx: CanvasRenderingContext2D, y: number): number {
  const x = PAGE_MARGIN;
  const widths = [0.16, 0.40, 0.15, 0.15, 0.14].map((ratio) => (PAGE_WIDTH - PAGE_MARGIN * 2) * ratio);
  const height = 64;
  const labels = ['ผู้ถ่ายทอดสาร', 'ประเด็นการสื่อสาร', 'ช่องทางการสื่อสาร', 'ผู้รับสาร', 'หลักฐาน (ถ้ามี)'];
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1.5;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x, y, PAGE_WIDTH - PAGE_MARGIN * 2, height);
  ctx.strokeRect(x, y, PAGE_WIDTH - PAGE_MARGIN * 2, height);
  ctx.fillStyle = '#000000';
  ctx.font = `700 23px ${FONT_FAMILY}`;
  ctx.textAlign = 'center';
  let currentX = x;
  labels.forEach((label, index) => {
    ctx.fillText(label, currentX + widths[index] / 2, y + 42);
    currentX += widths[index];
    if (index < labels.length - 1) {
      ctx.beginPath();
      ctx.moveTo(currentX, y);
      ctx.lineTo(currentX, y + height);
      ctx.stroke();
    }
  });
  return y + height;
}

function drawRow(ctx: CanvasRenderingContext2D, row: MeasuredRow, y: number): number {
  const x = PAGE_MARGIN;
  const widths = [0.16, 0.40, 0.15, 0.15, 0.14].map((ratio) => (PAGE_WIDTH - PAGE_MARGIN * 2) * ratio);
  const rowHeight = row.height;
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1.25;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x, y, PAGE_WIDTH - PAGE_MARGIN * 2, rowHeight);
  ctx.strokeRect(x, y, PAGE_WIDTH - PAGE_MARGIN * 2, rowHeight);
  let currentX = x;
  widths.slice(0, -1).forEach((width) => {
    currentX += width;
    ctx.beginPath();
    ctx.moveTo(currentX, y);
    ctx.lineTo(currentX, y + rowHeight);
    ctx.stroke();
  });

  ctx.fillStyle = '#000000';
  const padding = 12;
  drawTextLines(ctx, row.columns[0], x + padding, y + 30, 21, undefined, true);
  drawTextLines(ctx, row.columns[1].slice(0, row.boldTopicLineCount), x + widths[0] + padding, y + 30, 23, undefined, true);
  drawTextLines(ctx, row.columns[1].slice(row.boldTopicLineCount), x + widths[0] + padding, y + 30 + row.boldTopicLineCount * 31, 21);
  drawTextLines(ctx, row.columns[2], x + widths[0] + widths[1] + padding, y + 30, 21);
  drawTextLines(ctx, row.columns[3], x + widths[0] + widths[1] + widths[2] + padding, y + 30, 21);

  const evidenceX = x + widths.slice(0, 4).reduce((sum, item) => sum + item, 0);
  if (row.evidence.length === 0) {
    ctx.font = `400 21px ${FONT_FAMILY}`;
    ctx.textAlign = 'center';
    ctx.fillText('-', evidenceX + widths[4] / 2, y + 34);
  } else {
    row.evidence.forEach((item, index) => {
      const blockY = y + 9 + index * 122;
      const boxX = evidenceX + 12;
      const boxWidth = widths[4] - 24;
      ctx.strokeStyle = '#cbd5e1';
      ctx.strokeRect(boxX, blockY, boxWidth, 86);
      if (item.image) {
        const scale = Math.min((boxWidth - 8) / item.image.naturalWidth, 78 / item.image.naturalHeight);
        const imageWidth = item.image.naturalWidth * scale;
        const imageHeight = item.image.naturalHeight * scale;
        ctx.drawImage(item.image, boxX + (boxWidth - imageWidth) / 2, blockY + (86 - imageHeight) / 2, imageWidth, imageHeight);
      } else {
        ctx.font = `400 18px ${FONT_FAMILY}`;
        ctx.textAlign = 'center';
        ctx.fillText('ไฟล์แนบ', boxX + boxWidth / 2, blockY + 48);
      }
      ctx.fillStyle = '#000000';
      ctx.font = `400 16px ${FONT_FAMILY}`;
      ctx.textAlign = 'center';
      ctx.fillText(item.name.slice(0, 28), boxX + boxWidth / 2, blockY + 104);
    });
  }
  return y + rowHeight;
}

function drawFeedbackAndSignoff(ctx: CanvasRenderingContext2D, payload: PrintPayload, y: number): void {
  const maxWidth = PAGE_WIDTH - PAGE_MARGIN * 2;
  y += 24;

  ctx.fillStyle = '#000000';
  ctx.font = `700 22px ${FONT_FAMILY}`;
  ctx.textAlign = 'left';
  ctx.fillText('ปัญหาและอุปสรรคในการสื่อสาร:', PAGE_MARGIN, y);
  ctx.font = `400 21px ${FONT_FAMILY}`;
  const problems = wrapText(ctx, payload.feedback.problemsObstacles || '- ไม่มี -', maxWidth - 370);
  problems.forEach((line, index) => ctx.fillText(line, PAGE_MARGIN + 350, y + index * 31));
  y += Math.max(38, problems.length * 31 + 8);

  ctx.font = `700 22px ${FONT_FAMILY}`;
  ctx.fillText('ข้อเสนอแนะของผู้บริหารในการสื่อสาร:', PAGE_MARGIN, y);
  ctx.font = `400 21px ${FONT_FAMILY}`;
  const suggestions = wrapText(ctx, payload.feedback.executiveSuggestions || '- ไม่มี -', maxWidth - 370);
  suggestions.forEach((line, index) => ctx.fillText(line, PAGE_MARGIN + 350, y + index * 31));
  y += Math.max(38, suggestions.length * 31 + 12);

  const author = formatFullName(payload.recorder.title, payload.recorder.name, payload.recorder.surname);
  ctx.textAlign = 'center';
  ctx.font = `700 21px ${FONT_FAMILY}`;
  ctx.fillText(`(${author})`, PAGE_WIDTH - PAGE_MARGIN - 170, y + 28);
  ctx.font = `400 20px ${FONT_FAMILY}`;
  ctx.fillText(payload.recorder.position || '', PAGE_WIDTH - PAGE_MARGIN - 170, y + 55);
}

function renderPage(payload: PrintPayload, chunk: PageChunk, pageNumber: number, totalPages: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = PAGE_WIDTH;
  canvas.height = PAGE_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('สร้างหน้ารายงาน PDF ไม่สำเร็จ');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT);
  ctx.fillStyle = '#000000';

  let y = drawHeader(ctx, payload, chunk.firstPage);
  y = drawTableHeader(ctx, y);
  chunk.rows.forEach((row) => { y = drawRow(ctx, row, y); });
  const allRowsOnLast = pageNumber === totalPages;
  if (allRowsOnLast) drawFeedbackAndSignoff(ctx, payload, y + 18);

  ctx.strokeStyle = '#9ca3af';
  ctx.beginPath();
  ctx.moveTo(PAGE_MARGIN, PAGE_HEIGHT - PAGE_MARGIN + 5);
  ctx.lineTo(PAGE_WIDTH - PAGE_MARGIN, PAGE_HEIGHT - PAGE_MARGIN + 5);
  ctx.stroke();
  ctx.fillStyle = '#4b5563';
  ctx.font = `400 14px ${FONT_FAMILY}`;
  ctx.textAlign = 'left';
  ctx.fillText('เอกสารทางการ การประปานครหลวง (กปน.)', PAGE_MARGIN, PAGE_HEIGHT - PAGE_MARGIN + 26);
  ctx.textAlign = 'right';
  ctx.fillText(`หน้า ${pageNumber} จาก ${totalPages}`, PAGE_WIDTH - PAGE_MARGIN, PAGE_HEIGHT - PAGE_MARGIN + 26);
  return canvas;
}

export async function renderReportCanvasPages(payload: PrintPayload): Promise<HTMLCanvasElement[]> {
  await ensureSarabunLoaded();
  const measureCanvas = document.createElement('canvas');
  const ctx = measureCanvas.getContext('2d');
  if (!ctx) throw new Error('ไม่สามารถวัดข้อความ PDF ได้');
  const rows = await measureRows(payload, ctx);
  const firstY = firstPageTableY(payload, ctx);
  const nextY = continuationTableY();
  const reserve = feedbackHeight(payload, ctx, PAGE_WIDTH - PAGE_MARGIN * 2) + 70;
  const chunks = paginateRows(rows, firstY, nextY, reserve);
  return chunks.map((chunk, index) => renderPage(payload, chunk, index + 1, chunks.length));
}
