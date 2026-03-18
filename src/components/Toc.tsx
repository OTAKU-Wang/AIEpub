import React from 'react';
import { TocItem } from '../types';
import { ChevronRight } from 'lucide-react';

interface TocProps {
  toc: TocItem[];
  onNavigate: (href: string) => void;
}

export default function Toc({ toc, onNavigate }: TocProps) {
  const renderItem = (item: TocItem, depth = 0) => (
    <div key={item.id} className="flex flex-col">
      <button
        onClick={() => onNavigate(item.href)}
        className="text-left py-3.5 px-4 hover:bg-black/5 transition-colors text-[#1D1D1F] text-[15px] border-b border-black/5 flex items-center justify-between"
        style={{ paddingLeft: `${depth * 1 + 1}rem` }}
      >
        <span className="truncate pr-4">{item.label}</span>
        <ChevronRight size={16} className="text-[#C7C7CC] shrink-0" />
      </button>
      {item.subitems && item.subitems.length > 0 && (
        <div className="flex flex-col">
          {item.subitems.map(sub => renderItem(sub, depth + 1))}
        </div>
      )}
    </div>
  );

  return (
    <div className="overflow-y-auto h-full bg-white">
      {toc.length === 0 ? (
        <div className="p-4 text-center text-[#86868B] text-[15px] mt-10">No Table of Contents found.</div>
      ) : (
        <div className="border-t border-black/5">
          {toc.map(item => renderItem(item))}
        </div>
      )}
    </div>
  );
}
