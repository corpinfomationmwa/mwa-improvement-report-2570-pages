import React from 'react';

interface PdfSuggestionSectionProps {
  suggestions?: string;
}

export const PdfSuggestionSection: React.FC<PdfSuggestionSectionProps> = ({ suggestions }) => {
  return (
    <div className="mb-4 text-xs text-black font-serif select-text">
      <p className="font-bold text-black mb-1">
        ข้อเสนอแนะของผู้บริหารในการสื่อสาร:
      </p>
      <div className="pl-4 leading-relaxed whitespace-pre-line text-black">
        {suggestions && suggestions.trim().length > 0 ? (
          suggestions
        ) : (
          <span className="text-gray-500 italic">- ไม่มี -</span>
        )}
      </div>
    </div>
  );
};
