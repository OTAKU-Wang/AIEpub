import React, { useEffect, useRef, useState } from 'react';
import ePub, { Book as EpubBook, Rendition, Location } from 'epubjs';
import { Book, Concept, KnowledgeGraph, TocItem, Highlight } from '../types';
import { extractConcepts, generateKnowledgeMap } from '../lib/ai';
import { ChevronLeft, ChevronRight, Menu, MessageSquare, Network, ArrowLeft, Loader2, PenTool, X, Lightbulb, List } from 'lucide-react';
import Sidebar from './Sidebar';

interface ReaderProps {
  book: Book;
  onClose: () => void;
  onUpdateBook: (book: Book) => void;
}

export type SidebarView = 'none' | 'toc' | 'chat' | 'map' | 'concept' | 'notes' | 'edit-note';

const HIGHLIGHT_COLORS = [
  { id: 'yellow', value: 'rgba(255, 204, 0, 0.4)', bgClass: 'bg-[#FFCC00]' },
  { id: 'green', value: 'rgba(52, 199, 89, 0.4)', bgClass: 'bg-[#34C759]' },
  { id: 'blue', value: 'rgba(0, 122, 255, 0.4)', bgClass: 'bg-[#007AFF]' },
  { id: 'pink', value: 'rgba(255, 45, 85, 0.4)', bgClass: 'bg-[#FF2D55]' },
  { id: 'purple', value: 'rgba(175, 82, 222, 0.4)', bgClass: 'bg-[#AF52DE]' }
];

export default function Reader({ book, onClose, onUpdateBook }: ReaderProps) {
  const viewerRef = useRef<HTMLDivElement>(null);
  const epubBook = useRef<EpubBook | null>(null);
  const rendition = useRef<Rendition | null>(null);
  const currentChapterHref = useRef<string | null>(null);

  const [sidebarView, setSidebarView] = useState<SidebarView>('none');
  const [currentChapterText, setCurrentChapterText] = useState('');
  const [concepts, setConcepts] = useState<Concept[]>(book.concepts || []);
  const [selectedConcept, setSelectedConcept] = useState<Concept | null>(null);
  const [selectedText, setSelectedText] = useState('');
  const [knowledgeGraph, setKnowledgeGraph] = useState<KnowledgeGraph | null>(book.knowledgeGraph || null);
  const [loadingConcepts, setLoadingConcepts] = useState(false);
  const [loadingMap, setLoadingMap] = useState(false);

  const [toc, setToc] = useState<TocItem[]>([]);
  const [highlights, setHighlights] = useState<Highlight[]>(book.highlights || []);
  const [draftHighlight, setDraftHighlight] = useState<Highlight | null>(null);
  const [selection, setSelection] = useState<{cfiRange: string, text: string} | null>(null);
  const highlightsRef = useRef<Highlight[]>([]);
  const bookRef = useRef<Book>(book);

  useEffect(() => {
    highlightsRef.current = highlights;
  }, [highlights]);

  useEffect(() => {
    bookRef.current = book;
  }, [book]);

  useEffect(() => {
    if (
      bookRef.current.highlights !== highlights ||
      bookRef.current.concepts !== concepts ||
      bookRef.current.knowledgeGraph !== knowledgeGraph
    ) {
      const updatedBook = {
        ...bookRef.current,
        highlights,
        concepts,
        knowledgeGraph
      };
      bookRef.current = updatedBook;
      onUpdateBook(updatedBook);
    }
  }, [highlights, concepts, knowledgeGraph]);

  useEffect(() => {
    if (!viewerRef.current) return;

    epubBook.current = ePub(book.data);
    rendition.current = epubBook.current.renderTo(viewerRef.current, {
      width: '100%',
      height: '100%',
      spread: 'none',
      manager: 'continuous',
      flow: 'paginated',
    });

    epubBook.current.loaded.navigation.then(nav => {
      setToc(nav.toc as any);
    });

    epubBook.current.ready.then(() => {
      // Apply existing highlights
      bookRef.current.highlights?.forEach(hl => {
        rendition.current?.annotations.highlight(
          hl.cfiRange,
          { type: 'highlight', id: hl.id },
          (e: Event) => {
            const currentHl = highlightsRef.current.find(h => h.id === hl.id);
            if (currentHl) {
              setDraftHighlight(currentHl);
              setSidebarView('edit-note');
            }
          },
          'user-highlight',
          { fill: hl.color || 'rgba(255, 204, 0, 0.4)' }
        );
      });

      return epubBook.current!.locations.generate(1600);
    }).catch(err => console.warn('Locations generation failed', err));

    rendition.current.display(bookRef.current.lastLocation || undefined);

    rendition.current.on('relocated', async (location: Location) => {
      if (!epubBook.current) return;
      
      let progress = bookRef.current.progress || 0;
      try {
        if (epubBook.current.locations.length() > 0) {
          progress = epubBook.current.locations.percentageFromCfi(location.start.cfi);
        }
      } catch (e) {
        console.warn('Could not calculate progress', e);
      }
      onUpdateBook({ ...bookRef.current, lastLocation: location.start.cfi, progress });
      
      const href = location.start.href;
      if (currentChapterHref.current === href) {
        return; // Already loaded this chapter
      }
      currentChapterHref.current = href;
      
      // Get chapter text
      try {
        const spineItem = epubBook.current.spine.get(href);
        if (spineItem) {
          const doc = await spineItem.load();
          const text = doc?.body?.textContent || doc?.documentElement?.textContent || '';
          setCurrentChapterText(text);
          
          // Clear previous concepts and map
          setConcepts([]);
          setKnowledgeGraph(null);
          
          // Concept extraction is now user-triggered to save AI tokens
        }
      } catch (e) {
        console.error('Error loading chapter text', e);
      }
    });

    rendition.current.on('selected', (cfiRange: string, contents: any) => {
      if (!rendition.current) return;
      const range = rendition.current.getRange(cfiRange);
      const text = range.toString();
      setSelectedText(text);
      
      setSelection({ cfiRange, text });
      
      // Do NOT clear selection here, let the native browser selection stay until the user acts
    });

    // Handle clicks on highlights
    rendition.current.on('markClicked', (cfiRange: string, data: any) => {
      if (data && data.type === 'concept') {
        setSelectedConcept(data.concept);
        setSidebarView('concept');
      } else if (data && data.type === 'highlight') {
        const hl = highlightsRef.current.find(h => h.id === data.id);
        if (hl) {
          setDraftHighlight(hl);
          setSidebarView('edit-note');
        }
      } else {
        // Fallback for old concept highlights without data
        const concept = concepts.find(c => c.cfi === cfiRange);
        if (concept) {
          setSelectedConcept(concept);
          setSidebarView('concept');
        }
      }
    });

    return () => {
      epubBook.current?.destroy();
    };
  }, [book.id]);

  const extractAndHighlightConcepts = async (text: string, spineItem: any) => {
    setLoadingConcepts(true);
    try {
      const extracted = await extractConcepts(text);
      const conceptsWithCfi: Concept[] = [];
      
      for (const concept of extracted) {
        try {
          const results = await spineItem.find(concept.term);
          if (results && results.length > 0) {
            const cfi = results[0].cfi;
            conceptsWithCfi.push({ ...concept, cfi });
            
            // Highlight
            if (rendition.current) {
              rendition.current.annotations.highlight(
                cfi,
                { type: 'concept', concept },
                (e: Event) => {
                  setSelectedConcept({ ...concept, cfi });
                  setSidebarView('concept');
                },
                'concept-highlight',
                { fill: 'rgba(255, 204, 0, 0.4)' }
              );
            }
          } else {
             conceptsWithCfi.push(concept);
          }
        } catch (e) {
          console.warn('Could not find CFI for', concept.term);
          conceptsWithCfi.push(concept);
        }
      }
      setConcepts(conceptsWithCfi);
    } catch (e) {
      console.error('Extraction failed', e);
    } finally {
      setLoadingConcepts(false);
    }
  };

  const handleGenerateMap = async () => {
    if (!currentChapterText) return;
    setSidebarView('map');
    if (knowledgeGraph) return; // Already generated
    
    setLoadingMap(true);
    try {
      const graph = await generateKnowledgeMap(currentChapterText);
      setKnowledgeGraph(graph);
    } catch (e) {
      console.error('Map generation failed', e);
    } finally {
      setLoadingMap(false);
    }
  };

  const handleExtractConcepts = async () => {
    if (!currentChapterText || !epubBook.current || !currentChapterHref.current) return;
    if (concepts.length > 0) {
      setSidebarView('concept');
      return; // Already extracted
    }
    
    const spineItem = epubBook.current.spine.get(currentChapterHref.current);
    if (!spineItem) return;
    
    await extractAndHighlightConcepts(currentChapterText, spineItem);
    setSidebarView('concept');
  };

  const clearNativeSelection = () => {
    if (rendition.current) {
      const contents = rendition.current.getContents();
      contents.forEach(content => {
        content.window.getSelection()?.removeAllRanges();
      });
    }
  };

  const handleSaveHighlight = (hl: Highlight) => {
    if (!hl.id) {
      const newHl = { ...hl, id: Date.now().toString() };
      setHighlights(prev => [...prev, newHl]);
      rendition.current?.annotations.highlight(
        newHl.cfiRange,
        { type: 'highlight', id: newHl.id },
        (e: Event) => {
          const currentHl = highlightsRef.current.find(h => h.id === newHl.id);
          if (currentHl) {
            setDraftHighlight(currentHl);
            setSidebarView('edit-note');
          }
        },
        'user-highlight',
        { fill: newHl.color || 'rgba(255, 204, 0, 0.4)' }
      );
    } else {
      setHighlights(prev => prev.map(h => h.id === hl.id ? hl : h));
    }
    setSidebarView('notes');
  };

  const handleDeleteHighlight = (id: string) => {
    const hl = highlights.find(h => h.id === id);
    if (hl) {
      rendition.current?.annotations.remove(hl.cfiRange, 'user-highlight');
      setHighlights(prev => prev.filter(h => h.id !== id));
    }
    setSidebarView('notes');
  };

  const handleNavigate = (hrefOrCfi: string) => {
    rendition.current?.display(hrefOrCfi);
  };

  const handleEditHighlight = (hl: Highlight) => {
    setDraftHighlight(hl);
    setSidebarView('edit-note');
  };

  const handleQuickHighlight = (color: string) => {
    if (!selection) return;
    const newHl: Highlight = { id: Date.now().toString(), cfiRange: selection.cfiRange, text: selection.text, note: '', color };
    setHighlights(prev => [...prev, newHl]);
    rendition.current?.annotations.highlight(
      newHl.cfiRange,
      { type: 'highlight', id: newHl.id },
      (e: Event) => {
        const currentHl = highlightsRef.current.find(h => h.id === newHl.id);
        if (currentHl) {
          setDraftHighlight(currentHl);
          setSidebarView('edit-note');
        }
      },
      'user-highlight',
      { fill: color }
    );
    clearNativeSelection();
    setSelection(null);
  };

  const handleAddNote = () => {
    if (!selection) return;
    setDraftHighlight({
      id: '',
      cfiRange: selection.cfiRange,
      text: selection.text,
      note: ''
    });
    clearNativeSelection();
    setSidebarView('edit-note');
    setSelection(null);
  };

  const handleCloseSelection = () => {
    clearNativeSelection();
    setSelection(null);
  };

  const next = () => {
    try {
      if (rendition.current && (rendition.current as any).manager) {
        rendition.current.next();
      }
    } catch (e) {
      console.warn('Could not go to next page', e);
    }
  };
  
  const prev = () => {
    try {
      if (rendition.current && (rendition.current as any).manager) {
        rendition.current.prev();
      }
    } catch (e) {
      console.warn('Could not go to previous page', e);
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-[#F5F5F7] overflow-hidden font-sans relative">
      {/* Main Reader Area */}
      <div className="flex-1 flex flex-col relative z-0">
        {/* Top Navigation */}
        <header className="bg-white/90 backdrop-blur-xl border-b border-black/5 flex items-center justify-between px-4 pt-safe pb-2 min-h-[56px] z-10 shrink-0">
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="p-2 -ml-2 hover:bg-black/5 rounded-full transition-colors text-[#007AFF]">
              <ArrowLeft size={24} />
            </button>
            <h1 className="font-semibold text-[17px] text-[#1D1D1F] truncate max-w-[200px] sm:max-w-[300px]">{book.title}</h1>
          </div>
          
          <div className="flex items-center">
            <button 
              onClick={handleExtractConcepts}
              disabled={loadingConcepts}
              className={`p-2 rounded-full transition-colors ${sidebarView === 'concept' ? 'text-[#007AFF]' : 'text-[#1D1D1F] hover:bg-black/5'} ${loadingConcepts ? 'animate-pulse text-[#007AFF]' : ''}`}
              title="Scan Chapter Concepts"
            >
              <Lightbulb size={22} />
            </button>
          </div>
        </header>

        {/* EPUB Viewer */}
        <div className="flex-1 relative flex items-center justify-center bg-white overflow-hidden">
          <button onClick={prev} className="absolute left-2 sm:left-4 z-10 p-2 sm:p-3 rounded-full bg-white/80 hover:bg-white backdrop-blur-md shadow-sm border border-black/5 transition-all text-[#1D1D1F]">
            <ChevronLeft size={24} />
          </button>
          
          <div ref={viewerRef} className="w-full h-full max-w-3xl mx-auto py-4 px-12 sm:py-8 sm:px-16" />
          
          <button onClick={next} className="absolute right-2 sm:right-4 z-10 p-2 sm:p-3 rounded-full bg-white/80 hover:bg-white backdrop-blur-md shadow-sm border border-black/5 transition-all text-[#1D1D1F]">
            <ChevronRight size={24} />
          </button>

          {/* Floating Selection Menu */}
          {selection && (
            <div className="absolute bottom-20 sm:bottom-8 left-1/2 transform -translate-x-1/2 bg-white/95 backdrop-blur-xl shadow-2xl rounded-2xl px-4 py-3 flex flex-col gap-3 z-50 border border-black/10 animate-in slide-in-from-bottom-4 w-[90%] max-w-[360px]">
              <div className="text-sm text-[#1D1D1F] max-h-[60px] overflow-hidden relative">
                <span className="italic line-clamp-2">"{selection.text}"</span>
              </div>
              
              <div className="h-px w-full bg-black/5" />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {HIGHLIGHT_COLORS.map(color => (
                    <button
                      key={color.id}
                      onClick={() => handleQuickHighlight(color.value)}
                      className={`w-6 h-6 rounded-full ${color.bgClass} hover:scale-110 transition-transform shadow-sm border border-black/5`}
                      title={`Highlight ${color.id}`}
                    />
                  ))}
                </div>
                
                <div className="flex items-center gap-1 sm:gap-2 border-l border-black/10 pl-2 sm:pl-3">
                  <button 
                    onClick={handleAddNote} 
                    className="p-1.5 text-[#86868B] hover:text-[#007AFF] transition-colors rounded-full hover:bg-black/5"
                    title="Add Note"
                  >
                    <MessageSquare size={18} />
                  </button>
                  <button 
                    onClick={handleCloseSelection} 
                    className="p-1.5 text-[#86868B] hover:text-[#1D1D1F] transition-colors rounded-full hover:bg-black/5"
                    title="Close"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Bottom Tab Bar (iOS Style) */}
        <div className="bg-white/90 backdrop-blur-xl border-t border-black/5 flex items-start justify-around px-2 pt-2 pb-safe shrink-0 z-20">
          <button 
            onClick={() => setSidebarView(sidebarView === 'toc' ? 'none' : 'toc')}
            className={`flex flex-col items-center gap-1 p-2 min-w-[64px] ${sidebarView === 'toc' ? 'text-[#007AFF]' : 'text-[#86868B]'}`}
          >
            <List size={24} />
            <span className="text-[10px] font-medium">Contents</span>
          </button>
          <button 
            onClick={() => setSidebarView(sidebarView === 'notes' ? 'none' : 'notes')}
            className={`flex flex-col items-center gap-1 p-2 min-w-[64px] ${sidebarView === 'notes' || sidebarView === 'edit-note' ? 'text-[#007AFF]' : 'text-[#86868B]'}`}
          >
            <PenTool size={24} />
            <span className="text-[10px] font-medium">Notes</span>
          </button>
          <button 
            onClick={() => setSidebarView(sidebarView === 'chat' ? 'none' : 'chat')}
            className={`flex flex-col items-center gap-1 p-2 min-w-[64px] ${sidebarView === 'chat' ? 'text-[#007AFF]' : 'text-[#86868B]'}`}
          >
            <MessageSquare size={24} />
            <span className="text-[10px] font-medium">AI Tutor</span>
          </button>
          <button 
            onClick={handleGenerateMap}
            className={`flex flex-col items-center gap-1 p-2 min-w-[64px] ${sidebarView === 'map' ? 'text-[#007AFF]' : 'text-[#86868B]'}`}
          >
            <Network size={24} />
            <span className="text-[10px] font-medium">Map</span>
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <Sidebar 
        view={sidebarView} 
        setView={setSidebarView}
        book={epubBook.current}
        rendition={rendition.current}
        selectedText={selectedText}
        setSelectedText={setSelectedText}
        currentChapterText={currentChapterText}
        selectedConcept={selectedConcept}
        concepts={concepts}
        loadingConcepts={loadingConcepts}
        setSelectedConcept={setSelectedConcept}
        knowledgeGraph={knowledgeGraph}
        loadingMap={loadingMap}
        toc={toc}
        highlights={highlights}
        draftHighlight={draftHighlight}
        onSaveHighlight={handleSaveHighlight}
        onDeleteHighlight={handleDeleteHighlight}
        onNavigate={handleNavigate}
        onEditHighlight={handleEditHighlight}
      />
    </div>
  );
}
