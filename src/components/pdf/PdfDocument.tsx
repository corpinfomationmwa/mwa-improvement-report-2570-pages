import React from 'react';
import {
  RecorderInfo,
  ExecutiveInfo,
  CommunicationTopicItem,
  FeedbackInfo
} from '../../types/mwa';
import { PdfPrintSettings } from '../../config/pdfConfig';
import { paginateDocument } from '../../utils/pdfPagination';
import { formatSpeakerInfo } from '../../utils/pdfLayout';
import { PdfHeader } from './PdfHeader';
import { PdfAuthorInfo } from './PdfAuthorInfo';
import { PdfCommunicationTable } from './PdfCommunicationTable';
import { PdfProblemSection } from './PdfProblemSection';
import { PdfSuggestionSection } from './PdfSuggestionSection';
import { PdfPage } from './PdfPage';

interface PdfDocumentProps {
  recorder: RecorderInfo;
  executive: ExecutiveInfo;
  topics: CommunicationTopicItem[];
  feedback: FeedbackInfo;
  settings: PdfPrintSettings;
}

export const PdfDocument: React.FC<PdfDocumentProps> = ({
  recorder,
  executive,
  topics,
  feedback,
  settings
}) => {
  const pages = paginateDocument(topics, feedback);
  const totalPages = pages.length;
  const speaker = formatSpeakerInfo(executive);

  return (
    <div className="mwa-pdf-document-wrapper mwa-pdf-official-font flex flex-col items-center">
      {pages.map((pageChunk, pIdx) => {
        const isFirstPage = pIdx === 0;
        const isLastPage = pageChunk.isLastPage;

        return (
          <PdfPage
            key={pageChunk.pageIndex}
            pageNumber={pIdx + 1}
            totalPages={totalPages}
            margins={settings.margins}
            includeHeaderFooter={settings.includeHeaderFooter}
          >
            {/* Page 1: Official Header & Author Info */}
            {isFirstPage ? (
              <>
                <PdfHeader month={executive.month || 'มกราคม 2570'} />
                <PdfAuthorInfo recorder={recorder} />
              </>
            ) : (
              /* Page 2+: Continuation Header as per Section 9 */
              <div className="mb-4 pb-2 border-b border-black text-black font-serif">
                <div className="text-center font-bold text-sm">
                  รายงานการสื่อสารตามแผนการสื่อสารภายในและภายนอกองค์กรของผู้บริหาร (ต่อ)
                </div>
                <div className="text-center text-xs font-semibold text-gray-700">
                  ประจำเดือน {executive.month || 'มกราคม 2570'}
                </div>
                <div className="mt-2 text-xs flex justify-between items-center text-black">
                  <div>
                    <span className="font-bold">ผู้ถ่ายทอดสาร:</span> {speaker.fullName} ({speaker.position})
                  </div>
                  <div>
                    <span className="font-bold">สังกัด:</span> {speaker.affiliationAndDept}
                  </div>
                </div>
              </div>
            )}

            {/* 5-Column Communication Table */}
            <PdfCommunicationTable
              items={pageChunk.items}
              executive={executive}
              startIndex={pageChunk.itemStartIndex}
              isContinuation={!isFirstPage}
            />

            {/* Problem and Suggestion Sections on the final page */}
            {pageChunk.hasProblemAndSuggestion && (
              <div className="mt-4 pt-3 border-t border-black space-y-3">
                <PdfProblemSection problems={feedback.problemsObstacles} />
                <PdfSuggestionSection suggestions={feedback.executiveSuggestions} />
              </div>
            )}
          </PdfPage>
        );
      })}
    </div>
  );
};
