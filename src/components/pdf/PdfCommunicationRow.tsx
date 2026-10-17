import React from 'react';
import { CommunicationTopicItem, ExecutiveInfo } from '../../types/mwa';
import { formatSpeakerInfo, formatChannels, formatAudiences } from '../../utils/pdfLayout';
import { PdfEvidence } from './PdfEvidence';

interface PdfCommunicationRowProps {
  item: CommunicationTopicItem;
  executive: ExecutiveInfo;
  rowIndex: number;
}

export const PdfCommunicationRow: React.FC<PdfCommunicationRowProps> = ({
  item,
  executive,
  rowIndex
}) => {
  const speaker = formatSpeakerInfo(executive);
  const channels = formatChannels(item);
  const audiences = formatAudiences(item);

  return (
    <tr className="border-b border-black align-top break-inside-avoid text-black text-xs font-serif">
      {/* 1. ผู้ถ่ายทอดสาร */}
      <td className="p-2 border border-black w-[18%] align-top leading-relaxed">
        <p className="font-bold text-black">{speaker.fullName}</p>
        <p className="text-[11px] text-black mt-0.5">{speaker.position}</p>
        {speaker.affiliationAndDept !== '-' && (
          <p className="text-[10px] text-gray-700 mt-0.5">{speaker.affiliationAndDept}</p>
        )}
      </td>

      {/* 2. ประเด็นการสื่อสาร (รวม ประเด็น + รายละเอียด ตาม Section 4) */}
      <td className="p-2 border border-black w-[32%] align-top leading-relaxed whitespace-pre-line">
        {/* ชื่อประเด็น */}
        {item.selectedTopics && item.selectedTopics.length > 0 ? (
          <div className="font-bold text-black mb-2 space-y-1">
            {item.selectedTopics.map((topic, idx) => (
              <div key={idx} className="leading-snug">
                • {topic}
              </div>
            ))}
          </div>
        ) : (
          <div className="font-bold text-gray-500 italic mb-2">• ไม่ได้ระบุประเด็น</div>
        )}

        {/* รายละเอียดเนื้อหาที่ทำการสื่อสาร */}
        <div className="text-black text-xs leading-relaxed font-normal">
          {item.details ? (
            item.details
          ) : (
            <span className="text-gray-400 italic">- ไม่มีรายละเอียด -</span>
          )}
        </div>

        {/* รายละเอียดเพิ่มเติม ถ้ามี */}
        {item.additionalDetails && (
          <div className="mt-2 pt-1 border-t border-gray-300 text-[11px] text-gray-800">
            <span className="font-semibold">ข้อมูลเพิ่มเติม:</span> {item.additionalDetails}
          </div>
        )}
      </td>

      {/* 3. ช่องทางการสื่อสาร */}
      <td className="p-2 border border-black w-[17%] align-top leading-relaxed">
        <ul className="list-disc list-inside space-y-1 text-xs">
          {channels.map((ch, idx) => (
            <li key={idx} className="leading-snug">
              {ch}
            </li>
          ))}
        </ul>
      </td>

      {/* 4. ผู้รับสาร */}
      <td className="p-2 border border-black w-[18%] align-top leading-relaxed">
        <ul className="list-disc list-inside space-y-1 text-xs">
          {audiences.map((aud, idx) => (
            <li key={idx} className="leading-snug">
              {aud}
            </li>
          ))}
        </ul>
      </td>

      {/* 5. หลักฐาน (ถ้ามี) */}
      <td className="p-2 border border-black w-[15%] align-top text-center">
        <PdfEvidence files={item.evidenceFiles} />
      </td>
    </tr>
  );
};
