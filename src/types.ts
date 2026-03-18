export interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl?: string;
  data: ArrayBuffer;
  progress?: number;
  lastLocation?: string;
  highlights?: Highlight[];
  concepts?: Concept[];
  knowledgeGraph?: KnowledgeGraph;
}

export interface Concept {
  term: string;
  definition: string;
  cfi?: string;
}

export interface RelatedConcept {
  relatedTerm: string;
  relationExplanation: string;
}

export interface KnowledgeNode {
  id: string;
  label: string;
}

export interface KnowledgeLink {
  source: string;
  target: string;
  label: string;
}

export interface KnowledgeGraph {
  nodes: KnowledgeNode[];
  links: KnowledgeLink[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  reference?: string;
}

export interface TocItem {
  id: string;
  href: string;
  label: string;
  subitems?: TocItem[];
}

export interface Highlight {
  id: string;
  cfiRange: string;
  text: string;
  note?: string;
  color?: string;
}
