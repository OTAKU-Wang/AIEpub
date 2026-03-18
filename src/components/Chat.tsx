import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { chatWithAI } from '../lib/ai';
import { Send, Loader2, Quote } from 'lucide-react';

interface ChatProps {
  selectedText: string;
  setSelectedText: (text: string) => void;
  context: string;
}

export default function Chat({ selectedText, setSelectedText, context }: ChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() && !selectedText) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      reference: selectedText || undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setSelectedText(''); // Clear selection after sending
    setLoading(true);

    try {
      const response = await chatWithAI(input, context, messages);
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: response,
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (e) {
      console.error('Chat error', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white font-sans">
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.length === 0 && (
          <div className="text-center text-[#86868B] mt-10 text-sm">
            <p>Ask me anything about the book.</p>
            <p className="mt-2">Select text in the book to add it as a reference.</p>
          </div>
        )}
        
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
              msg.role === 'user' 
                ? 'bg-[#007AFF] text-white rounded-br-sm' 
                : 'bg-[#F5F5F7] text-[#1D1D1F] rounded-bl-sm'
            }`}>
              {msg.reference && (
                <div className={`mb-2 pl-3 border-l-2 text-sm italic opacity-80 ${
                  msg.role === 'user' ? 'border-white/50' : 'border-[#86868B]/50'
                }`}>
                  "{msg.reference}"
                </div>
              )}
              <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-start">
            <div className="bg-[#F5F5F7] text-[#1D1D1F] rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2">
              <Loader2 size={16} className="animate-spin text-[#86868B]" />
              <span className="text-sm text-[#86868B]">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-black/5 bg-white">
        {selectedText && (
          <div className="mb-3 p-2 bg-[#F5F5F7] rounded-lg border border-black/5 flex items-start gap-2 text-sm text-[#1D1D1F]">
            <Quote size={14} className="mt-0.5 text-[#007AFF] shrink-0" />
            <div className="flex-1 line-clamp-2 italic opacity-80">"{selectedText}"</div>
            <button 
              onClick={() => setSelectedText('')}
              className="text-[#86868B] hover:text-[#1D1D1F] text-xs font-medium"
            >
              Remove
            </button>
          </div>
        )}
        
        <div className="flex items-end gap-2 bg-[#F5F5F7] rounded-2xl p-2 border border-black/5 focus-within:border-[#007AFF] focus-within:ring-1 focus-within:ring-[#007AFF] transition-all">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask AI Tutor..."
            className="flex-1 max-h-32 min-h-[40px] bg-transparent border-none focus:ring-0 resize-none py-2 px-3 text-[15px] text-[#1D1D1F] placeholder:text-[#86868B]"
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={(!input.trim() && !selectedText) || loading}
            className="p-2.5 bg-[#007AFF] text-white rounded-full hover:bg-[#0066CC] disabled:opacity-50 disabled:bg-[#86868B] transition-colors shrink-0 mb-0.5"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
