import React from 'react';
import { Highlight } from '../types';
import { BookOpen, Edit3 } from 'lucide-react';

interface HighlightsListProps {
  highlights: Highlight[];
  onNavigate: (cfiRange: string) => void;
  onEdit: (highlight: Highlight) => void;
}

export default function HighlightsList({ highlights, onNavigate, onEdit }: HighlightsListProps) {
  if (highlights.length === 0) {
    return (
      <div className="p-8 text-center text-[#86868B] flex flex-col items-center mt-10">
        <BookOpen size={32} className="mb-3 opacity-50" />
        <p className="text-sm font-medium">No highlights yet</p>
        <p className="text-xs mt-1">Select text while reading to add a highlight and note.</p>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto h-full p-4 space-y-4 bg-[#F5F5F7]">
      {highlights.map(hl => (
        <div key={hl.id} className="bg-white border border-black/5 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
          <div 
            className="text-sm italic text-[#1D1D1F] mb-3 cursor-pointer pl-3 line-clamp-4"
            style={{ borderLeft: `3px solid ${hl.color ? hl.color.replace(', 0.4)', ', 1)') : '#FFCC00'}` }}
            onClick={() => onNavigate(hl.cfiRange)}
            title="Click to go to highlight"
          >
            "{hl.text}"
          </div>
          {hl.note && (
            <div className="text-sm text-[#1D1D1F] bg-[#F5F5F7] p-3 rounded-lg mb-3 whitespace-pre-wrap">
              {hl.note}
            </div>
          )}
          <div className="flex justify-end">
            <button
              onClick={() => onEdit(hl)}
              className="flex items-center gap-1 text-xs font-medium text-[#007AFF] hover:text-[#0066CC] transition-colors"
            >
              <Edit3 size={14} />
              Edit Note
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
