import React, { useState, useEffect } from 'react';
import localforage from 'localforage';
import { Book } from './types';
import Library from './components/Library';
import Reader from './components/Reader';

export default function App() {
  const [books, setBooks] = useState<Book[]>([]);
  const [currentBook, setCurrentBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBooks = async () => {
      try {
        const storedBooks = await localforage.getItem<Book[]>('aiepub_books');
        if (storedBooks) {
          setBooks(storedBooks);
        }
      } catch (e) {
        console.error('Failed to load books from localforage', e);
      } finally {
        setLoading(false);
      }
    };
    loadBooks();
  }, []);

  const saveBooks = async (newBooks: Book[]) => {
    setBooks(newBooks);
    try {
      await localforage.setItem('aiepub_books', newBooks);
    } catch (e) {
      console.error('Failed to save books to localforage', e);
    }
  };

  const handleAddBook = (book: Book) => {
    saveBooks([...books, book]);
  };

  const handleOpenBook = (book: Book) => {
    setCurrentBook(book);
  };

  const handleCloseReader = () => {
    setCurrentBook(null);
  };

  const handleUpdateBook = (updatedBook: Book) => {
    const newBooks = books.map(b => b.id === updatedBook.id ? updatedBook : b);
    saveBooks(newBooks);
    if (currentBook?.id === updatedBook.id) {
      setCurrentBook(updatedBook);
    }
  };

  const handleDeleteBook = (id: string) => {
    const newBooks = books.filter(b => b.id !== id);
    saveBooks(newBooks);
  };

  const handleImportBooks = async (importedBooks: Book[]) => {
    // Merge imported books, updating existing ones
    const bookMap = new Map(books.map(b => [b.id, b]));
    for (const b of importedBooks) {
      bookMap.set(b.id, b); // Overwrite or add
    }
    await saveBooks(Array.from(bookMap.values()));
  };

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#F5F5F7]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#007AFF]"></div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-[#F5F5F7] text-[#1D1D1F] font-sans">
      {currentBook ? (
        <Reader book={currentBook} onClose={handleCloseReader} onUpdateBook={handleUpdateBook} />
      ) : (
        <Library 
          books={books} 
          onAddBook={handleAddBook} 
          onOpenBook={handleOpenBook} 
          onDeleteBook={handleDeleteBook}
          onImportBooks={handleImportBooks}
        />
      )}
    </div>
  );
}
