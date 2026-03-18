import React, { useState, useEffect } from 'react';
import { ChevronRight, Upload, Download } from 'lucide-react';
import { Book } from '../types';

interface SettingsModalProps {
  onClose: () => void;
  books: Book[];
  onImportBooks: (books: Book[]) => void;
}

export default function SettingsModal({ onClose, books, onImportBooks }: SettingsModalProps) {
  const [apiBaseUrl, setApiBaseUrl] = useState('https://api.openai.com/v1');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('gpt-4o-mini');

  useEffect(() => {
    setApiBaseUrl(localStorage.getItem('openai_api_base_url') || 'https://api.openai.com/v1');
    setApiKey(localStorage.getItem('openai_api_key') || '');
    setModel(localStorage.getItem('openai_model') || 'gpt-4o-mini');
  }, []);

  const handleSave = () => {
    localStorage.setItem('openai_api_base_url', apiBaseUrl);
    localStorage.setItem('openai_api_key', apiKey);
    localStorage.setItem('openai_model', model);
    onClose();
  };

  const arrayBufferToBase64 = async (buffer: ArrayBuffer): Promise<string> => {
    return new Promise((resolve, reject) => {
      const blob = new Blob([buffer]);
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const base64 = dataUrl.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const base64ToArrayBuffer = async (base64: string): Promise<ArrayBuffer> => {
    const res = await fetch(`data:application/octet-stream;base64,${base64}`);
    return await res.arrayBuffer();
  };

  const handleExport = async () => {
    try {
      const booksWithBase64 = await Promise.all(books.map(async b => ({
        ...b,
        data: await arrayBufferToBase64(b.data)
      })));

      const backup = {
        version: 1,
        timestamp: new Date().toISOString(),
        books: booksWithBase64
      };

      const blob = new Blob([JSON.stringify(backup)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `AIEpub_Backup_${new Date().toISOString().split('T')[0]}.aiepub`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Export failed', e);
      alert('Failed to export library.');
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const backup = JSON.parse(content);
        
        if (!backup.books || !Array.isArray(backup.books)) {
          throw new Error('Invalid backup format');
        }

        const importedBooks: Book[] = await Promise.all(backup.books.map(async (b: any) => ({
          ...b,
          data: await base64ToArrayBuffer(b.data)
        })));

        onImportBooks(importedBooks);
        alert('Library imported successfully!');
        onClose();
      } catch (err) {
        console.error('Import failed', err);
        alert('Failed to import library. Invalid file format.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4 animate-in fade-in">
      <div className="bg-[#F2F2F7] w-full sm:max-w-md sm:rounded-2xl overflow-hidden flex flex-col max-h-[90vh] rounded-t-2xl shadow-2xl">
        <div className="flex items-center justify-between p-4 bg-white border-b border-[#C6C6C8]">
          <button onClick={onClose} className="text-[#007AFF] text-[17px] font-normal">Cancel</button>
          <h2 className="text-[17px] font-semibold text-black">Settings</h2>
          <button onClick={handleSave} className="text-[#007AFF] text-[17px] font-semibold">Done</button>
        </div>

        <div className="p-4 overflow-y-auto flex-1 space-y-6">
          {/* AI Configuration */}
          <section>
            <h3 className="text-[13px] font-normal text-[#6D6D72] uppercase tracking-wide ml-4 mb-2">AI Configuration</h3>
            <div className="bg-white rounded-xl overflow-hidden border border-[#C6C6C8]/50">
              <div className="flex items-center p-3 border-b border-[#C6C6C8]/50">
                <span className="w-24 text-[17px] text-black">Base URL</span>
                <input 
                  type="text" 
                  value={apiBaseUrl}
                  onChange={(e) => setApiBaseUrl(e.target.value)}
                  placeholder="https://api.openai.com/v1"
                  className="flex-1 text-[17px] text-[#8E8E93] outline-none bg-transparent"
                />
              </div>
              <div className="flex items-center p-3 border-b border-[#C6C6C8]/50">
                <span className="w-24 text-[17px] text-black">API Key</span>
                <input 
                  type="password" 
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="flex-1 text-[17px] text-[#8E8E93] outline-none bg-transparent"
                />
              </div>
              <div className="flex items-center p-3">
                <span className="w-24 text-[17px] text-black">Model</span>
                <input 
                  type="text" 
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="gpt-4o-mini"
                  className="flex-1 text-[17px] text-[#8E8E93] outline-none bg-transparent"
                />
              </div>
            </div>
            <p className="text-[13px] text-[#6D6D72] mt-2 ml-4">Supports any OpenAI-compatible API format.</p>
          </section>

          {/* iCloud / Data Sync */}
          <section>
            <h3 className="text-[13px] font-normal text-[#6D6D72] uppercase tracking-wide ml-4 mb-2">Data Sync</h3>
            <div className="bg-white rounded-xl overflow-hidden border border-[#C6C6C8]/50">
              <button 
                onClick={handleExport}
                className="w-full flex items-center justify-between p-3 border-b border-[#C6C6C8]/50 active:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-[#007AFF] p-1.5 rounded-md">
                    <Upload size={16} className="text-white" />
                  </div>
                  <span className="text-[17px] text-black">Save to Files...</span>
                </div>
                <ChevronRight size={20} className="text-[#C6C6C8]" />
              </button>
              
              <label className="w-full flex items-center justify-between p-3 active:bg-gray-100 transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="bg-[#34C759] p-1.5 rounded-md">
                    <Download size={16} className="text-white" />
                  </div>
                  <span className="text-[17px] text-black">Import from Files...</span>
                </div>
                <ChevronRight size={20} className="text-[#C6C6C8]" />
                <input 
                  type="file" 
                  accept=".aiepub,.json" 
                  onChange={handleImport}
                  className="hidden" 
                />
              </label>
            </div>
            <p className="text-[13px] text-[#6D6D72] mt-2 ml-4">Export your library to iCloud Drive to sync across devices.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
