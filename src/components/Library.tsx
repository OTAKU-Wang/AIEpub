import React, { useRef, useState } from 'react';
import ePub from 'epubjs';
import { Book } from '../types';
import { Plus, BookOpen, Settings } from 'lucide-react';
import SettingsModal from './SettingsModal';

interface LibraryProps {
  books: Book[];
  onAddBook: (book: Book) => void;
  onOpenBook: (book: Book) => void;
  onDeleteBook: (id: string) => void;
  onImportBooks: (books: Book[]) => void;
}

export default function Library({ books, onAddBook, onOpenBook, onDeleteBook, onImportBooks }: LibraryProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const buffer = await file.arrayBuffer();
      const book = ePub(buffer);
      const metadata = await book.loaded.metadata;
      
      let coverUrl = undefined;
      try {
        const coverUrlObj = await book.coverUrl();
        if (coverUrlObj) {
            coverUrl = coverUrlObj;
        }
      } catch (e) {
        console.warn('Could not load cover', e);
      }

      const newBook: Book = {
        id: Math.random().toString(36).substr(2, 9),
        title: metadata.title || file.name,
        author: metadata.creator || 'Unknown Author',
        coverUrl,
        data: buffer,
      };

      onAddBook(newBook);
    } catch (error) {
      console.error('Error loading book:', error);
      alert('Failed to load EPUB file.');
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] p-4 sm:p-8 font-sans pb-24 pt-safe">
      <div className="max-w-6xl mx-auto sm:pt-4">
        <header className="flex justify-between items-end mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-[#1D1D1F] tracking-tight">Library</h1>
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center justify-center w-10 h-10 sm:w-auto sm:h-auto sm:px-4 sm:py-2 bg-white text-[#1D1D1F] border border-black/5 rounded-full font-medium hover:bg-black/5 transition-colors shadow-sm"
              title="Settings & Sync"
            >
              <Settings size={20} className="sm:mr-1" />
              <span className="hidden sm:inline">Settings</span>
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="flex items-center justify-center w-10 h-10 sm:w-auto sm:h-auto sm:px-4 sm:py-2 bg-[#007AFF] text-white rounded-full font-medium hover:bg-[#0066CC] transition-colors disabled:opacity-50 shadow-sm"
            >
              <Plus size={24} className="sm:mr-1" />
              <span className="hidden sm:inline">{loading ? 'Importing...' : 'Import EPUB'}</span>
            </button>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".epub"
            className="hidden"
          />
        </header>

        {books.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-[#86868B]">
            <BookOpen size={48} className="mb-4 opacity-50" />
            <p className="text-lg font-medium text-[#1D1D1F]">Your library is empty</p>
            <p className="mt-2 text-sm">Import an EPUB file to start reading</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-8">
            {books.map((book) => (
              <div
                key={book.id}
                onClick={() => onOpenBook(book)}
                className="group cursor-pointer flex flex-col items-center"
              >
                <div className="w-full aspect-[2/3] bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden relative border border-black/5">
                  {book.coverUrl ? (
                    <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                      <BookOpen size={32} className="text-gray-400" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                </div>
                <div className="mt-3 w-full px-1 flex flex-col items-start">
                  <h3 className="font-semibold text-[#1D1D1F] text-sm sm:text-base line-clamp-2 leading-tight w-full text-left">{book.title}</h3>
                  {book.progress !== undefined && book.progress > 0 ? (
                    <div className="w-full mt-2 flex flex-col items-start gap-1.5">
                      <div className="w-full bg-black/5 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-[#007AFF] h-full rounded-full" style={{ width: `${Math.min(100, book.progress * 100)}%` }} />
                      </div>
                      <p className="text-[10px] text-[#86868B] font-medium uppercase tracking-wider">
                        {Math.round(book.progress * 100)}% Read
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs sm:text-sm text-[#86868B] truncate mt-1 w-full text-left">{book.author}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showSettings && (
        <SettingsModal 
          onClose={() => setShowSettings(false)} 
          books={books}
          onImportBooks={onImportBooks}
        />
      )}
    </div>
  );
}
