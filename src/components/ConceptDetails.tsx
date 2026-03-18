import React, { useState, useEffect } from 'react';
import { Concept, RelatedConcept } from '../types';
import { expandConcept } from '../lib/ai';
import { BookOpen, Network, Loader2, ChevronRight } from 'lucide-react';

interface ConceptDetailsProps {
  concept: Concept;
  context: string;
}

export default function ConceptDetails({ concept, context }: ConceptDetailsProps) {
  const [related, setRelated] = useState<RelatedConcept[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setRelated([]);
    setExpanded(false);
  }, [concept]);

  const handleExpand = async () => {
    setLoading(true);
    setExpanded(true);
    try {
      const results = await expandConcept(concept.term, context);
      setRelated(results);
    } catch (e) {
      console.error('Failed to expand concept', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 font-sans bg-white h-full overflow-y-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4 text-[#007AFF]">
          <div className="p-2 bg-[#007AFF]/10 rounded-lg">
            <BookOpen size={24} />
          </div>
          <h2 className="text-2xl font-semibold text-[#1D1D1F] tracking-tight">{concept.term}</h2>
        </div>
        
        <div className="prose prose-sm text-[#1D1D1F] leading-relaxed">
          <p className="text-[15px]">{concept.definition}</p>
        </div>
      </div>

      <div className="border-t border-black/5 pt-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-[#1D1D1F] flex items-center gap-2">
            <Network size={18} className="text-[#86868B]" />
            Knowledge Expansion
          </h3>
          
          {!expanded && (
            <button
              onClick={handleExpand}
              className="text-sm font-medium text-[#007AFF] hover:text-[#0066CC] transition-colors flex items-center gap-1"
            >
              Expand
              <ChevronRight size={16} />
            </button>
          )}
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12 text-[#86868B]">
            <Loader2 size={24} className="animate-spin" />
            <span className="ml-3 text-sm font-medium">Building knowledge graph...</span>
          </div>
        )}

        {expanded && !loading && related.length > 0 && (
          <div className="space-y-4">
            {related.map((rel, idx) => (
              <div 
                key={idx} 
                className="p-4 rounded-xl bg-[#F5F5F7] border border-black/5 hover:border-black/10 transition-colors"
              >
                <h4 className="font-semibold text-[#1D1D1F] mb-2">{rel.relatedTerm}</h4>
                <p className="text-sm text-[#86868B] leading-relaxed">{rel.relationExplanation}</p>
              </div>
            ))}
          </div>
        )}
        
        {expanded && !loading && related.length === 0 && (
          <p className="text-sm text-[#86868B] text-center py-8">No related concepts found.</p>
        )}
      </div>
    </div>
  );
}
