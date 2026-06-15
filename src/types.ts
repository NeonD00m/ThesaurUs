export type OveruseLevel = 'none' | 'slight' | 'heavy';

export interface Token {
  id: string;
  text: string; // The token string as it appears (e.g., "word", "word,", " ")
  cleanWord: string; // Lowercased, alphanumeric-only for statistics
  isWord: boolean;
  frequency: number;
  density: number; // percentage of total words
  overuseLevel: OveruseLevel;
  
  // Advanced features loaded either locally or via Gemini API
  pos?: string; // Part of Speech (Noun, Verb, Adjective, etc.)
  tense?: string; // Grammatical tense or form (Past, Present, Plural, etc.)
  baseForm?: string; // Root word/lemma
  synonyms?: string[]; // Recommended contextual synonyms
  sentenceContext?: string; // The parent sentence
}

export interface GlobalStats {
  totalTokens: number;
  totalWords: number;
  uniqueWords: number;
  heavyOverusedCount: number;
  slightOverusedCount: number;
  vocabularyDiversity: number; // unique / total
  readabilityGrade: string; // e.g. "8th Grade"
}

export type ViewTab = 'home' | 'minimalist' | 'analytical';
