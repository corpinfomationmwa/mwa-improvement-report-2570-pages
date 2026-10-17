// Configuration for PDF and Print Preview according to MWA Official Master Template

export interface PdfPrintSettings {
  destination: string;
  pages: string;
  customPageRange?: string;
  pagesPerSheet: number;
  margins: 'default' | 'narrow' | 'wide' | 'none';
  includeHeaderFooter: boolean;
  backgroundGraphics: boolean;
  scale: number;
}

export const defaultPdfSettings: PdfPrintSettings = {
  destination: 'บันทึกเป็น PDF',
  pages: 'all',
  pagesPerSheet: 1,
  margins: 'default',
  includeHeaderFooter: false,
  backgroundGraphics: true,
  scale: 100
};

export const pdfDestinations = [
  'บันทึกเป็น PDF',
  'Microsoft Print to PDF',
  'เครื่องพิมพ์เริ่มต้น (Default Printer)'
];

export const pdfMarginOptions = [
  { id: 'default', label: 'ค่าเริ่มต้น' },
  { id: 'narrow', label: 'แคบ' },
  { id: 'wide', label: 'กว้าง' },
  { id: 'none', label: 'ไม่มี' }
];

export const pdfPagesPerSheetOptions = [1, 2, 4];

export const mwaOrganizationInfo = {
  nameTh: 'การประปานครหลวง',
  reportTitleTh: 'รายงานการสื่อสารตามแผนการสื่อสารภายในและภายนอกองค์กรของผู้บริหาร',
  fiscalYear: '2570'
};

export const mockPlaceholderImages = [
  'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=500&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=500&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=500&auto=format&fit=crop&q=60'
];
