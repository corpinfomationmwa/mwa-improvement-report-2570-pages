import React from 'react';

interface PdfPageProps {
  pageNumber: number;
  totalPages: number;
  children: React.ReactNode;
  margins?: 'default' | 'narrow' | 'wide' | 'none';
  includeHeaderFooter?: boolean;
}

export const PdfPage: React.FC<PdfPageProps> = ({
  pageNumber,
  totalPages,
  children,
  margins = 'default',
  includeHeaderFooter = false
}) => {
  // Margin style (physical A4 margin approximation)
  const getMarginStyle = () => {
    switch (margins) {
      case 'narrow':
        return { padding: '12mm 15mm' };
      case 'wide':
        return { padding: '25mm 25mm' };
      case 'none':
        return { padding: '6mm 6mm' };
      case 'default':
      default:
        return { padding: '18mm 20mm' };
    }
  };

  return (
    <div
      className="mwa-pdf-a4-page relative mx-auto mb-8 bg-white text-black flex flex-col justify-between print:mb-0 print:shadow-none print:w-full print:max-w-none print:min-h-0 print:h-auto"
      style={{
        width: '297mm',
        minHeight: 'auto',
        backgroundColor: '#ffffff',
        color: '#000000',
        boxShadow: '0 20px 30px -10px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.1)',
        fontFamily: "'Sarabun', 'TH Sarabun New', 'Prompt', 'Noto Sans Thai', sans-serif"
      }}
    >
      {/* Optional Top Browser Header */}
      {includeHeaderFooter && (
        <div className="px-8 pt-3 pb-1 text-[10px] text-gray-400 flex justify-between items-center border-b border-gray-200">
          <span>รายงานการสื่อสารตามแผนการสื่อสารของผู้บริหาร (กปน.)</span>
          <span>{new Date().toLocaleDateString('th-TH')}</span>
        </div>
      )}

      {/* Main A4 Document Body */}
      <div className="flex-1 flex flex-col justify-between" style={getMarginStyle()}>
        <div>{children}</div>

        {/* Page Footer */}
        <div className="mt-6 pt-2 border-t border-gray-200 flex items-center justify-between text-[10px] text-gray-500 font-serif">
          <span>เอกสารทางการ การประปานครหลวง</span>
          <span className="font-semibold">
            หน้า {pageNumber} จาก {totalPages}
          </span>
        </div>
      </div>
    </div>
  );
};
