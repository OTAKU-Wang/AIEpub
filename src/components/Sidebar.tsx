import React from 'react';
import { Book as EpubBook, Rendition } from 'epubjs';
import { SidebarView } from './Reader';
import { Concept, KnowledgeGraph, TocItem, Highlight } from '../types';
import { X, ArrowLeft, Loader2, Lightbulb } from 'lucide-react';
import Chat from './Chat';
import ConceptDetails from './ConceptDetails';
import KnowledgeMap from './KnowledgeMap';
import Toc from './Toc';
import NoteEditor from './NoteEditor';
import HighlightsList from './HighlightsList';

interface SidebarProps {
  view: SidebarView;
  setView: (view: SidebarView) => void;
  book: EpubBook | null;
  rendition: Rendition | null;
  selectedText: string;
  setSelectedText: (text: string) => void;
  currentChapterText: string;
  selectedConcept: Concept | null;
  concepts: Concept[];
  loadingConcepts: boolean;
  setSelectedConcept: (concept: Concept | null) => void;
  knowledgeGraph: KnowledgeGraph | null;
  loadingMap: boolean;
  toc: TocItem[];
  highlights: Highlight[];
  draftHighlight: Highlight | null;
  onSaveHighlight: (hl: Highlight) => void;
  onDeleteHighlight: (id: string) => void;
  onNavigate: (hrefOrCfi: string) => void;
  onEditHighlight: (hl: Highlight) => void;
}

export default function Sidebar({
  view,
  setView,
  book,
  rendition,
  selectedText,
  setSelectedText,
  currentChapterText,
  selectedConcept,
  concepts,
  loadingConcepts,
  setSelectedConcept,
  knowledgeGraph,
  loadingMap,
  toc,
  highlights,
  draftHighlight,
  onSaveHighlight,
  onDeleteHighlight,
  onNavigate,
  onEditHighlight
}: SidebarProps) {
  if (view === 'none') return null;

  return (
    <>
      {/* Backdrop for mobile */}
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 sm:hidden animate-in fade-in"
        onClick={() => setView('none')}
      />
      
      <div 
        className="mobile-sidebar-top fixed inset-x-0 bottom-0 sm:top-0 sm:left-auto sm:right-0 sm:w-96 bg-white sm:border-l border-black/5 shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out rounded-t-3xl sm:rounded-none animate-in slide-in-from-bottom sm:slide-in-from-right"
        style={{ '--mobile-top': 'calc(56px + env(safe-area-inset-top))' } as React.CSSProperties}
      >
        <style>{`
          @media (max-width: 639px) {
            .mobile-sidebar-top {
              top: var(--mobile-top) !important;
            }
          }
        `}</style>
        {/* Drag handle for mobile */}
        <div className="w-full h-1.5 flex justify-center pt-3 pb-1 sm:hidden shrink-0">
          <div className="w-12 h-1.5 bg-black/20 rounded-full" />
        </div>

        <header className="h-14 border-b border-black/5 flex items-center justify-between px-4 bg-white/80 backdrop-blur-md shrink-0">
          <h2 className="font-semibold text-[#1D1D1F]">
            {view === 'toc' && 'Table of Contents'}
            {view === 'chat' && 'AI Tutor'}
            {view === 'map' && 'Knowledge Map'}
            {view === 'concept' && 'Concept Details'}
            {view === 'notes' && 'Notes & Highlights'}
            {view === 'edit-note' && 'Edit Note'}
          </h2>
          <button 
            onClick={() => setView('none')}
            className="p-1.5 bg-black/5 hover:bg-black/10 rounded-full transition-colors text-[#86868B]"
          >
            <X size={20} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto pb-8 sm:pb-0">
        {view === 'toc' && <Toc toc={toc} onNavigate={onNavigate} />}
        
        {view === 'chat' && (
          <Chat 
            selectedText={selectedText} 
            setSelectedText={setSelectedText}
            context={currentChapterText}
          />
        )}
        
        {view === 'concept' && selectedConcept && (
          <div className="flex flex-col h-full">
            <div className="p-4 border-b border-black/5 bg-[#F5F5F7]">
              <button 
                onClick={() => setSelectedConcept(null)}
                className="flex items-center gap-1 text-sm font-medium text-[#007AFF] hover:text-[#0066CC] transition-colors"
              >
                <ArrowLeft size={16} />
                Back to Concepts
              </button>
            </div>
            <ConceptDetails 
              concept={selectedConcept} 
              context={currentChapterText}
            />
          </div>
        )}

        {view === 'concept' && !selectedConcept && (
          <div className="p-4 h-full overflow-y-auto bg-[#F5F5F7]">
            {loadingConcepts ? (
              <div className="flex flex-col items-center justify-center h-full text-[#86868B]">
                <Loader2 size={32} className="animate-spin mb-4" />
                <p className="text-sm font-medium">Scanning chapter for concepts...</p>
              </div>
            ) : concepts.length > 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-[#86868B] mb-4 px-1">Found {concepts.length} key concepts in this chapter:</p>
                {concepts.map((c, i) => (
                  <div 
                    key={i} 
                    onClick={() => {
                      setSelectedConcept(c);
                      if (c.cfi) onNavigate(c.cfi);
                    }}
                    className="bg-white p-4 rounded-xl border border-black/5 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                  >
                    <h3 className="font-semibold text-[#1D1D1F] mb-1 group-hover:text-[#007AFF] transition-colors">{c.term}</h3>
                    <p className="text-sm text-[#86868B] line-clamp-2">{c.definition}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-[#86868B] text-center px-6">
                <Lightbulb size={32} className="mb-4 opacity-50" />
                <p className="text-sm font-medium mb-2">No concepts extracted yet</p>
                <p className="text-xs">Click the lightbulb icon in the top menu to scan this chapter for key concepts.</p>
              </div>
            )}
          </div>
        )}
        
        {view === 'map' && (
          <KnowledgeMap 
            graph={knowledgeGraph} 
            loading={loadingMap}
            onNodeClick={(nodeId) => {
              // In a real app, we'd find the CFI for the node and navigate
              console.log('Clicked node', nodeId);
            }}
          />
        )}

        {view === 'notes' && (
          <HighlightsList 
            highlights={highlights} 
            onNavigate={onNavigate} 
            onEdit={onEditHighlight} 
          />
        )}

        {view === 'edit-note' && draftHighlight && (
          <NoteEditor 
            highlight={draftHighlight} 
            context={currentChapterText} 
            onSave={onSaveHighlight} 
            onDelete={onDeleteHighlight} 
            onCancel={() => setView('notes')} 
          />
        )}
      </div>
    </div>
    </>
  );
}
