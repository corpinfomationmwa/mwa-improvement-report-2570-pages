import React from 'react';
import { CommunicationTopicItem, ExecutiveInfo } from '../../types/mwa';
import { PdfCommunicationRow } from './PdfCommunicationRow';

interface PdfCommunicationTableProps {
  items: CommunicationTopicItem[];
  executive: ExecutiveInfo;
  startIndex?: number;
  isContinuation?: boolean;
}

export const PdfCommunicationTable: React.FC<PdfCommunicationTableProps> = ({
  items,
  executive,
  startIndex = 0,
  isContinuation = false
}) => {
  return (
    <div className="w-full mb-4">
      {isContinuation && (
        <div className="text-right text-[11px] font-bold text-black font-serif mb-1">
          (ตารางรายละเอียดการสื่อสาร - ต่อ)
        </div>
      )}
      <table className="w-full border-collapse border border-black text-black bg-white select-text">
        {/* Table Header: Black borders, centered, bold, white background */}
        <thead>
          <tr className="border-b-2 border-black bg-white font-serif">
            <th className="p-2 border border-black text-center font-bold text-black text-xs w-[18%]">
              ผู้ถ่ายทอดสาร
            </th>
            <th className="p-2 border border-black text-center font-bold text-black text-xs w-[32%]">
              ประเด็นการสื่อสาร
            </th>
            <th className="p-2 border border-black text-center font-bold text-black text-xs w-[17%]">
              ช่องทางการสื่อสาร
            </th>
            <th className="p-2 border border-black text-center font-bold text-black text-xs w-[18%]">
              ผู้รับสาร
            </th>
            <th className="p-2 border border-black text-center font-bold text-black text-xs w-[15%]">
              หลักฐาน (ถ้ามี)
            </th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={5} className="p-6 text-center text-gray-500 italic text-xs border border-black">
                - ไม่มีรายการรายละเอียดการสื่อสาร -
              </td>
            </tr>
          ) : (
            items.map((item, idx) => (
              <PdfCommunicationRow
                key={item.id || idx}
                item={item}
                executive={executive}
                rowIndex={startIndex + idx}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
