import React from 'react';
import { mwaOrganizationInfo } from '../../config/pdfConfig';

interface PdfHeaderProps {
  month: string;
}

export const PdfHeader: React.FC<PdfHeaderProps> = ({ month }) => {
  const monthDisplay = month.includes('2570') ? month : `${month || 'มกราคม'} 2570`;

  return (
    <div className="text-center mb-6 text-black select-text">
      <h1 className="text-base font-bold leading-normal text-black font-serif tracking-tight">
        {mwaOrganizationInfo.reportTitleTh}
      </h1>
      <p className="text-base font-bold leading-normal text-black font-serif">
        ประจำปีงบประมาณ {mwaOrganizationInfo.fiscalYear}
      </p>
      <p className="text-sm font-semibold text-black font-serif mt-1">
        ประจำเดือน {monthDisplay}
      </p>
    </div>
  );
};
