import React, { useState, useEffect } from 'react';
import { Highlight } from '../types';
import { generateNote } from '../lib/ai';
import { Loader2, Sparkles, Save, Trash2 } from 'lucide-react';

interface NoteEditorProps {
  highlight: Highlight;
  context: string;
  onSave: (highlight: Highlight) => void;
  onDelete: (id: string) => void;
  onCancel: () => void;
}

export default function NoteEditor({ highlight, context, onSave, onDelete, onCancel }: NoteEditorProps) {
  const [note, setNote] = useState(highlight.note || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setNote(highlight.note || '');
  }, [highlight]);

  const handleAIGenerate = async () => {
    setLoading(true);
    try {
      const generated = await generateNote(highlight.text, context);
      setNote(generated);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 flex flex-col h-full font-sans bg-white">
      <div 
        className="mb-4 p-3 bg-[#F5F5F7] rounded-lg border border-black/5 text-sm text-[#1D1D1F] italic max-h-40 overflow-y-auto"
        style={{ borderLeft: `4px solid ${highlight.color ? highlight.color.replace(', 0.4)', ', 1)') : '#FFCC00'}` }}
      >
        "{highlight.text}"
      </div>

      <div className="flex-1 flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <label className="text-sm font-medium text-[#1D1D1F]">Your Note</label>
          <button
            onClick={handleAIGenerate}
            disabled={loading}
            className="flex items-center gap-1 text-xs font-medium text-[#007AFF] hover:text-[#0066CC] disabled:opacity-50 transition-colors"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            AI Generate
          </button>
        </div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Write your thoughts or let AI generate a note..."
          className="flex-1 w-full p-3 bg-[#F5F5F7] rounded-xl border border-black/5 focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF] resize-none text-sm text-[#1D1D1F] outline-none transition-all"
        />
      </div>

      <div className="mt-4 flex gap-2 justify-end pt-4 border-t border-black/5">
        {highlight.id && (
          <button
            onClick={() => onDelete(highlight.id)}
            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors mr-auto"
            title="Delete Highlight"
          >
            <Trash2 size={18} />
          </button>
        )}
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-[#1D1D1F] hover:bg-black/5 rounded-full transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={() => onSave({ ...highlight, note })}
          className="px-4 py-2 text-sm font-medium bg-[#007AFF] text-white hover:bg-[#0066CC] rounded-full transition-colors flex items-center gap-1"
        >
          <Save size={16} />
          Save
        </button>
      </div>
    </div>
  );
}
