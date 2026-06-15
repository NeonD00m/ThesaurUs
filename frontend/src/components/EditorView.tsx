import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  FileText, Upload, Sparkles, Sliders, RefreshCw, 
  Trash2, HelpCircle, Check, Loader2, Info, ArrowRightLeft, BookOpen, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Token, GlobalStats, ViewTab } from '../types';
import { analyzeWordContext } from '../services/apiClient';

interface EditorViewProps {
  viewMode: 'minimalist' | 'analytical';
  hasApiKey: boolean;
}

// Stop words we filter out to prevent highlighting "the", "and", "is" etc.
const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'to', 'of', 'in', 'it', 'is', 'was', 'were', 'be', 'been', 'being',
  'for', 'with', 'as', 'at', 'by', 'on', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'they', 
  'we', 'my', 'your', 'his', 'her', 'their', 'our', 'its', 'me', 'him', 'them', 'us', 'there', 'here',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'shall', 'should', 'can', 'could', 'may', 'might', 'must'
]);

// Local fallback dictionary when server is offline or Gemini API key is missing
const LOCAL_FALLBACK_THESAURUS: Record<string, string[]> = {
  very: ['extremely', 'exceedingly', 'remarkably', 'highly', 'profoundly', 'intensely', 'exceptionally'],
  extremely: ['highly', 'immensely', 'supremely', 'exceedingly', 'profoundly', 'intensely'],
  repetition: ['recurrence', 'redundancy', 'iteration', 'duplication', 'echo'],
  feel: ['experience', 'perceive', 'sense', 'detect', 'discern'],
  bland: ['monotonous', 'dull', 'tedious', 'uninspired', 'dreary', 'insipid'],
  good: ['excellent', 'superb', 'exemplary', 'magnificent', 'outstanding', 'beneficial'],
  bad: ['substandard', 'deficient', 'detrimental', 'unfavorable', 'dreadful', 'adverse'],
  happy: ['joyful', 'elate', 'ecstatic', 'jubilant', 'contented', 'cheerful'],
  sad: ['melancholy', 'sorrowful', 'despondent', 'disconsolate', 'gloomy', 'dejected'],
  write: ['compose', 'draft', 'author', 'pen', 'describe', 'record'],
  say: ['articulate', 'express', 'state', 'declare', 'mutter', 'vocalize'],
  do: ['execute', 'perform', 'accomplish', 'enact', 'undertake'],
  look: ['gaze', 'peer', 'glance', 'scrutinize', 'observe', 'behold'],
  important: ['paramount', 'crucial', 'vital', 'significant', 'essential', 'imperative'],
  smart: ['intelligent', 'clever', 'brilliant', 'astute', 'sharp-witted'],
  difficult: ['arduous', 'challenging', 'laborious', 'strenuous', 'intractable'],
  easy: ['effortless', 'straightforward', 'uncomplicated', 'facile', 'painless'],
  make: ['generate', 'construct', 'synthesize', 'fabricate', 'originate']
};

export default function EditorView({ viewMode, hasApiKey }: EditorViewProps) {
  const [inputText, setInputText] = useState<string>(
    "Wordiness and unnecessary repetition can make your essays feel extremely bland and very tiresome.\n\nWhen you repeat the same word very frequently, your readers get very bored. To make an impact, you should write with precise verbs and unique descriptors instead of using weak modifiers very often."
  );
  
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [isAnalyzingWord, setIsAnalyzingWord] = useState<boolean>(false);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Highlighting thresholds
  const [heavyThreshold, setHeavyThreshold] = useState<number>(4);
  const [slightThreshold, setSlightThreshold] = useState<number>(2);

  // Currently selected token for synonym replacement
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);
  
  // Advanced synonym metrics returned by Gemini Server API
  const [apiWordDetails, setApiWordDetails] = useState<{
    pos: string;
    tense: string;
    baseForm: string;
    synonyms: string[];
    nuanceExplanation: string;
    usageFrequencyAdvice: string;
  } | null>(null);

  // File Upload Ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper: Tokenize raw text while preserving spaces and carriage returns
  const tokens: Token[] = useMemo(() => {
    if (!inputText) return [];
    
    // Split by whitespaces but keep delimiters
    const parts = inputText.split(/(\s+)/);
    
    // First, count frequencies of clean content words
    const cleanCounts: Record<string, number> = {};
    parts.forEach(part => {
      const clean = part.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (clean && !STOP_WORDS.has(clean)) {
        cleanCounts[clean] = (cleanCounts[clean] || 0) + 1;
      }
    });

    const totalWords = Object.values(cleanCounts).reduce((a, b) => a + b, 0);

    // Build final Token array
    let wordIndex = 0;
    return parts.map((part, index) => {
      const id = `token-${index}`;
      const isSpace = /^\s+$/.test(part);
      const cleanWord = part.toLowerCase().replace(/[^a-z0-9]/g, '');
      const isWord = !isSpace && cleanWord.length > 0;
      
      const frequency = isWord ? (cleanCounts[cleanWord] || 0) : 0;
      const density = isWord && totalWords > 0 ? (frequency / totalWords) * 100 : 0;

      let overuseLevel: 'none' | 'slight' | 'heavy' = 'none';
      if (isWord && !STOP_WORDS.has(cleanWord)) {
        if (frequency >= heavyThreshold) {
          overuseLevel = 'heavy';
        } else if (frequency >= slightThreshold) {
          overuseLevel = 'slight';
        }
      }

      return {
        id,
        text: part,
        cleanWord,
        isWord,
        frequency,
        density,
        overuseLevel
      };
    });
  }, [inputText, heavyThreshold, slightThreshold]);

  // Global Text Stats Calculated Client-side
  const stats: GlobalStats = useMemo(() => {
    const wordTokens = tokens.filter(t => t.isWord);
    const uniqueWordSet = new Set(wordTokens.map(t => t.cleanWord));
    const heavyCount = wordTokens.filter(t => t.overuseLevel === 'heavy').length;
    const slightCount = wordTokens.filter(t => t.overuseLevel === 'slight').length;
    
    // Naive readability grader (Flesch-Kincaid general proxy)
    const totalWords = wordTokens.length;
    let readability = "Simple";
    if (totalWords > 0) {
      const syllablesEstimate = wordTokens.reduce((acc, current) => {
        const len = current.cleanWord.length;
        return acc + Math.max(1, Math.round(len / 3));
      }, 0);
      const avgSentenceLength = totalWords / Math.max(1, inputText.split(/[.!?]+/).filter(Boolean).length);
      const avgSyllablesPerWord = syllablesEstimate / totalWords;
      const score = 206.835 - 1.015 * avgSentenceLength - 84.6 * avgSyllablesPerWord;

      if (score > 90) readability = "5th Grade (Very Easy)";
      else if (score > 80) readability = "6th Grade (Easy)";
      else if (score > 70) readability = "7th Grade (Fairly Easy)";
      else if (score > 60) readability = "8th-9th Grade (Standard)";
      else if (score > 50) readability = "High School (Fairly Hard)";
      else if (score > 30) readability = "College Level (Hard)";
      else readability = "Graduate (Very Scientific)";
    }

    return {
      totalTokens: tokens.length,
      totalWords,
      uniqueWords: uniqueWordSet.size,
      heavyOverusedCount: heavyCount,
      slightOverusedCount: slightCount,
      vocabularyDiversity: totalWords > 0 ? parseFloat(((uniqueWordSet.size / totalWords) * 100).toFixed(1)) : 100,
      readabilityGrade: readability
    };
  }, [tokens, inputText]);

  // Extract sentence context of a specific token
  const getSentenceContext = (tokenId: string): string => {
    const tokenIndex = tokens.findIndex(t => t.id === tokenId);
    if (tokenIndex === -1) return '';

    // Walk backwards and forwards to find punctuation boundaries
    let startIdx = tokenIndex;
    while (startIdx > 0) {
      if (/[.!?\n]/.test(tokens[startIdx - 1].text)) break;
      startIdx--;
    }

    let endIdx = tokenIndex;
    while (endIdx < tokens.length - 1) {
      if (/[.!?\n]/.test(tokens[endIdx].text)) break;
      endIdx++;
    }

    return tokens.slice(startIdx, endIdx + 1).map(t => t.text).join('').trim();
  };

  // Find clicked token data
  const selectedToken = useMemo(() => {
    return tokens.find(t => t.id === selectedTokenId) || null;
  }, [tokens, selectedTokenId]);

  // Query high-fidelity language client adapter details on word click
  const handleWordClick = async (token: Token) => {
    if (!token.isWord) return;
    setErrorMessage(null);
    setSelectedTokenId(token.id);
    setApiWordDetails(null);
    setIsAnalyzingWord(true);

    const sentence = getSentenceContext(token.id);
    const targetWord = token.text.replace(/[^a-zA-Z0-9]/g, '');

    try {
      const data = await analyzeWordContext(targetWord, sentence, inputText);
      
      // Enforce local token metrics into final advice
      const updatedData = {
        ...data,
        usageFrequencyAdvice: data.usageFrequencyAdvice.replace(
          /times/g, 
          `times (specifically ${token.frequency} occurrences in this draft)`
        )
      };

      setApiWordDetails(updatedData);
    } catch (err: any) {
      console.error("Linguistic analysis error:", err);
      setErrorMessage("Linguistic verification sandbox is initializing. Please try again.");
    } finally {
      setIsAnalyzingWord(false);
    }
  };

  // Replace a word inside input text with the selected synonym
  const handleSwapSynonym = (synonym: string) => {
    if (!selectedToken) return;

    // We replace the text matches while conserving the punctuation around the word
    const originalText = selectedToken.text;
    const wordOnly = originalText.replace(/[^a-zA-Z0-9]/g, '');
    
    // Retain matching case structure
    let formattedSynonym = synonym;
    if (wordOnly && wordOnly[0] === wordOnly[0].toUpperCase()) {
      formattedSynonym = synonym.charAt(0).toUpperCase() + synonym.slice(1);
    }

    const replacement = originalText.replace(wordOnly, formattedSynonym);

    // Reconstruct input text
    const updatedTokens = tokens.map(t => {
      if (t.id === selectedTokenId) {
        return replacement;
      }
      return t.text;
    });

    setInputText(updatedTokens.join(''));
    setSelectedTokenId(null);
    setApiWordDetails(null);
  };

  // Convert files to base64 for server OCR text capture
  const processUploadedFile = async (file: File) => {
    setErrorMessage(null);
    setIsExtracting(true);

    try {
      if (!hasApiKey) {
        // Safe, basic local.txt text file reader without AI if offline
        if (file.type === "text/plain") {
          const text = await file.text();
          setInputText(text);
          setIsExtracting(false);
          return;
        } else {
          throw new Error("Offline state: Only .txt files are supported. Please secure a Gemini API Key to unlock structural multi-format (PDF, DOCX, PNG) OCR extraction!");
        }
      }

      const reader = new FileReader();
      reader.onload = async () => {
        const base64String = (reader.result as string).split(',')[1];
        
        try {
          const response = await fetch('/api/extract-text', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              base64Data: base64String,
              mimeType: file.type,
              fileName: file.name
            })
          });

          if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || "File parsing failed.");
          }

          const result = await response.json();
          if (result.text && result.text.trim()) {
            setInputText(result.text);
          } else {
            throw new Error("No readable text found in document.");
          }
        } catch (uploadErr: any) {
          setErrorMessage(uploadErr.message || "Failure compiling cloud doc contents.");
        } finally {
          setIsExtracting(false);
        }
      };

      reader.readAsDataURL(file);

    } catch (err: any) {
      setErrorMessage(err.message || "File upload error.");
      setIsExtracting(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processUploadedFile(e.dataTransfer.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processUploadedFile(e.target.files[0]);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-8">
      {/* Upper Information Banner */}
      <div className="mb-6 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 p-4 text-sm text-indigo-200 flex items-start gap-3 relative z-10">
        <Info className="h-5 w-5 text-indigo-400 mt-0.5 flex-shrink-0" />
        <div>
          <span className="font-semibold text-indigo-300">Interactive Optimization:</span> Paste write-ups or drop files below.
          ThesaurUs automatically screens word density. Click any word highlighted to instantly replace it.
          Currently displaying <strong className="underline decoration-indigo-400 font-bold">{viewMode === 'minimalist' ? 'Variation A (Minimalist Inline Synonyms)' : 'Variation B (Linguistic sidebar)'}</strong>.
        </div>
      </div>

      {/* Main Sandbox Workspace Grid */}
      <div className="grid gap-8 lg:grid-cols-12 items-start relative z-10">
        
        {/* Editor Main Board Column */}
        <div className={`space-y-6 ${viewMode === 'analytical' ? 'lg:col-span-8' : 'lg:col-span-12'}`}>
          
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-4 shadow-xl">
            
            {/* File drag selector */}
            <div className="flex items-center space-x-3">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".txt,.pdf,.png,.jpg,.jpeg"
                className="hidden"
                id="doc-upload-raw"
              />
              <button
                onClick={triggerFileInput}
                disabled={isExtracting}
                className="flex items-center space-x-2 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-xs font-semibold text-slate-255 hover:bg-white/10 transition-all cursor-pointer text-white"
                id="upload-button"
              >
                <Upload className="h-3.5 w-3.5 text-slate-400" />
                <span>Upload Document (.txt, .pdf, image)</span>
              </button>
              
              {isExtracting && (
                <div className="flex items-center space-x-1.5 text-xs text-indigo-400 font-medium">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Deep parsing text...</span>
                </div>
              )}
            </div>

            {/* Threshold Adjusters Bar */}
            <div className="flex items-center space-x-6 text-white">
              <div className="flex items-center space-x-2">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                <span className="text-xs font-medium text-slate-300">Heavy Overuse:</span>
                <input
                  type="number"
                  min="2"
                  max="20"
                  value={heavyThreshold}
                  onChange={(e) => setHeavyThreshold(Math.max(2, parseInt(e.target.value) || 2))}
                  className="w-12 rounded border border-white/10 bg-black/40 px-1 py-0.5 text-center text-xs font-bold text-white focus:outline-none"
                  id="heavy-threshold-selector"
                />
              </div>

              <div className="flex items-center space-x-2">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                <span className="text-xs font-medium text-slate-300">Slight Overuse:</span>
                <input
                  type="number"
                  min="1"
                  max="19"
                  value={slightThreshold}
                  onChange={(e) => setSlightThreshold(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-12 rounded border border-white/10 bg-black/40 px-1 py-0.5 text-center text-xs font-bold text-white focus:outline-none"
                  id="slight-threshold-selector"
                />
              </div>

              <button
                onClick={() => setInputText("")}
                className="text-xs font-semibold text-slate-400 hover:text-white flex items-center space-x-1 transition-colors"
                id="clear-workspace"
                title="Clear Workspace"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Error Message banner */}
          {errorMessage && (
            <div className="rounded-2xl border border-red-500/35 bg-red-500/10 p-4 text-xs font-medium text-red-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-red-405" />
                <span>{errorMessage}</span>
              </div>
              <button 
                onClick={() => setErrorMessage(null)} 
                className="font-bold underline cursor-pointer hover:text-white"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Two-part Editor Window (Editable input & Interactive Reader Mode) */}
          <div className="grid gap-6 md:grid-cols-2">
            
            {/* Input Pad left */}
            <div className="flex flex-col h-[480px] rounded-3xl border border-white/10 bg-white/5 backdrop-blur-lg shadow-xl overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-400">
              <div className="bg-black/30 px-4 py-3 border-b border-white/5 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-450 tracking-wider uppercase font-mono">1. Original Draft Pad</span>
                <span className="text-[11px] text-slate-500 font-mono">Paste text here</span>
              </div>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type or paste your write-up here. Click 'Analyze text' or drop any text document..."
                className="w-full flex-grow resize-none border-0 bg-transparent p-5 text-sm text-slate-100 leading-relaxed focus:outline-none placeholder-slate-500"
                id="editor-textarea"
              />
            </div>

            {/* Analytical Tokenized Output Right */}
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative flex flex-col h-[480px] rounded-3xl border transition-all overflow-hidden bg-white/5 backdrop-blur-lg shadow-xl ${
                dragActive ? 'border-indigo-500 bg-indigo-500/5 ring-2 ring-indigo-500/20' : 'border-white/10'
              }`}
            >
              <div className="bg-black/30 px-4 py-3 border-b border-white/5 flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-400 tracking-wider uppercase font-mono">2. Smart Highlight Panel</span>
                <div className="flex items-center space-x-1.5 text-[10px] text-slate-500 font-mono">
                  <span>Click highlighted words</span>
                </div>
              </div>

              {/* Text Output Render area with interactive span markers */}
              <div className="flex-grow overflow-y-auto p-5 leading-relaxed text-sm text-slate-200">
                {tokens.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-6 text-slate-400">
                    <FileText className="h-10 w-10 mb-2 stroke-1 text-slate-500" />
                    <p className="text-xs">No analysis text available yet.</p>
                    <p className="text-[11px] mt-1 text-slate-500">Paste your raw text into the draft pad on the left, and watch the highlighter identify wordiness automatically!</p>
                  </div>
                ) : (
                  <div className="relative whitespace-pre-wrap">
                    {tokens.map((token) => {
                      if (!token.isWord) {
                        return <span key={token.id}>{token.text}</span>;
                      }

                      const val = token.text;
                      const cleanWordOnly = val.replace(/[^a-zA-Z0-9]/g, '');
                      const punctuations = val.replace(cleanWordOnly, '');

                      return (
                        <span key={token.id} className="inline-block relative">
                          <span
                            onClick={() => handleWordClick(token)}
                            id={`word-token-${token.id}`}
                            className={`relative cursor-pointer transition-all duration-200 select-none pb-0.5 px-0.5 rounded group font-sans ${
                              token.overuseLevel === 'heavy'
                                ? 'bg-red-500/20 text-white border-b-2 border-red-500 font-medium'
                                : token.overuseLevel === 'slight'
                                ? 'bg-yellow-500/20 text-white border-b-2 border-yellow-500 font-medium'
                                : selectedTokenId === token.id
                                ? 'bg-indigo-500/20 text-white border-b-2 border-indigo-400 font-medium'
                                : 'hover:bg-white/10 text-slate-350 hover:text-white'
                            }`}
                          >
                            <span className="relative">
                              {cleanWordOnly}
                              {/* Hover underline animation */}
                              <span className="absolute bottom-0 left-0 h-[2px] w-full scale-x-0 bg-indigo-400 transition-transform duration-300 origin-left group-hover:scale-x-100" />
                            </span>

                            {/* Minimalist Dropdown Inline overlay (Only in Minimalist Mode) */}
                            {viewMode === 'minimalist' && selectedTokenId === token.id && (
                              <div 
                                className="absolute left-1/2 top-full mt-2.5 z-40 w-64 -translate-x-1/2 rounded-2xl border border-white/15 bg-slate-900/95 backdrop-blur-xl p-3.5 shadow-2xl"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
                                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider font-mono">Context Synonyms</span>
                                  <button 
                                    className="text-[10px] text-slate-450 hover:text-white"
                                    onClick={() => setSelectedTokenId(null)}
                                  >
                                    Close
                                  </button>
                                </div>

                                {isAnalyzingWord ? (
                                  <div className="flex flex-col items-center justify-center py-4 text-center">
                                    <Loader2 className="h-5 w-5 text-indigo-400 animate-spin mb-1.5" />
                                    <span className="text-[11px] text-slate-400 font-mono">Analyzing tense context...</span>
                                  </div>
                                ) : apiWordDetails?.synonyms && apiWordDetails.synonyms.length > 0 ? (
                                  <div className="space-y-1">
                                    <div className="grid grid-cols-2 gap-1.5">
                                      {apiWordDetails.synonyms.map((syn, idx) => (
                                        <button
                                          key={idx}
                                          onClick={() => handleSwapSynonym(syn)}
                                          className="text-left text-xs font-semibold text-slate-200 bg-white/5 hover:bg-indigo-600 hover:text-white px-2 py-1.5 rounded-lg border border-white/5 transition-all cursor-pointer truncate"
                                        >
                                          {syn}
                                        </button>
                                      ))}
                                    </div>
                                    <p className="text-[10px] text-slate-400 leading-normal mt-2.5 border-t border-white/10 pt-2 italic">
                                      💡 Replace word instantly.
                                    </p>
                                  </div>
                                ) : (
                                  <div className="text-center text-xs text-slate-400 py-3">
                                    No direct suggestions found.
                                  </div>
                                )}
                              </div>
                            )}
                          </span>
                          {/* Tack punctuation at the end of token */}
                          {punctuations && <span>{punctuations}</span>}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Drag drop hint block */}
              {dragActive && (
                <div className="absolute inset-x-0 bottom-0 top-0 bg-slate-900/80 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center border-2 border-dashed border-indigo-500 m-3 rounded-2xl transition-all">
                  <Upload className="h-10 w-10 text-indigo-400 animate-bounce mb-2" />
                  <p className="text-sm font-semibold text-white">Release document to upload!</p>
                  <p className="text-xs text-indigo-300 mt-1">Accepts plain text, doc, PDF, or image OCR sheets</p>
                </div>
              )}
            </div>

          </div>

          {/* Desktop Summary stats band of global document state */}
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-4 shadow-lg text-white">
              <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase font-mono flex items-center space-x-1.5">
                <FileText className="h-3 w-3 text-slate-400" />
                <span>Vocabulary Diversity</span>
              </span>
              <p className="mt-1 text-2xl font-black text-white">{stats.vocabularyDiversity}%</p>
              <div className="mt-1.5 h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-500" 
                  style={{ width: `${stats.vocabularyDiversity}%` }}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-4 shadow-lg text-white">
              <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase font-mono flex items-center space-x-1.5">
                <Info className="h-3 w-3 text-slate-400" />
                <span>Readability Grade</span>
              </span>
              <p className="mt-1 text-base font-extrabold text-indigo-300 truncate">{stats.readabilityGrade}</p>
              <span className="text-[9px] text-slate-500 font-mono">Flesch Grade Score</span>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-4 shadow-lg text-white">
              <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase font-mono flex items-center space-x-1.5">
                <AlertCircle className="h-3 w-3 text-red-400" />
                <span>Heavy Repetitions</span>
              </span>
              <p className="mt-1 text-2xl font-black text-rose-450">{stats.heavyOverusedCount}</p>
              <p className="text-[9px] text-slate-500">Words with &ge;{heavyThreshold} entries</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-4 shadow-lg text-white">
              <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase font-mono flex items-center space-x-1.5">
                <Info className="h-3 w-3 text-amber-400" />
                <span>Slight Repetitions</span>
              </span>
              <p className="mt-1 text-2xl font-black text-amber-400">{stats.slightOverusedCount}</p>
              <p className="text-[9px] text-slate-500">Words with &ge;{slightThreshold} entries</p>
            </div>
          </div>

        </div>

        {/* Dynamic Sidebar Column (Only active in Variation B Analytical Workspace) */}
        {viewMode === 'analytical' && (
          <div className="lg:col-span-4 space-y-6">
            
            {/* Main Sidebar Wrapper */}
            <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-lg p-6 shadow-xl min-h-[480px] flex flex-col text-white">
              
              {selectedTokenId ? (
                // Active token metrics display
                <div className="flex-grow flex flex-col space-y-5">
                  <div className="border-b border-white/10 pb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-indigo-400 font-mono uppercase tracking-widest bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">Linguistic Node</span>
                      <button 
                        onClick={() => {
                          setSelectedTokenId(null);
                          setApiWordDetails(null);
                        }}
                        className="text-xs font-semibold text-slate-400 hover:text-white border border-white/10 rounded-lg px-2 py-1 transition-colors"
                      >
                        Clear Focus
                      </button>
                    </div>
                    <h3 className="text-3xl font-black text-white tracking-tight mt-3">"{selectedToken?.text.replace(/[^a-zA-Z0-9]/g, '')}"</h3>
                    <p className="text-xs text-slate-300 mt-1 italic font-serif">"{getSentenceContext(selectedTokenId)}"</p>
                  </div>

                  {isAnalyzingWord ? (
                    <div className="flex-grow flex flex-col items-center justify-center py-12 text-center">
                      <Loader2 className="h-8 w-8 text-indigo-400 animate-spin mb-3" />
                      <p className="text-sm font-semibold text-slate-350">Connecting to Gemini AI...</p>
                      <p className="text-xs text-slate-500 mt-1 max-w-[200px]">Extracting Parts of Speech, Base form, and grammatical tense structure</p>
                    </div>
                  ) : apiWordDetails ? (
                    <div className="flex-grow space-y-5">
                      
                      {/* Grid representing word stats */}
                      <div className="grid grid-cols-2 gap-3.5">
                        <div className="bg-white/5 border border-white/5 rounded-2xl p-3">
                          <span className="text-[9px] font-bold text-slate-400 font-mono uppercase">Part of Speech</span>
                          <p id="pos-value" className="text-sm font-bold text-white mt-0.5">{apiWordDetails.pos || "Determiner"}</p>
                        </div>
                        <div className="bg-white/5 border border-white/5 rounded-2xl p-3">
                          <span className="text-[9px] font-bold text-slate-400 font-mono uppercase">Form / Tense</span>
                          <p id="tense-value" className="text-sm font-semibold text-white mt-0.5 truncate">{apiWordDetails.tense || "Present Tense"}</p>
                        </div>
                        <div className="bg-white/5 border border-white/5 rounded-2xl p-3">
                          <span className="text-[9px] font-bold text-slate-400 font-mono uppercase">Root Word</span>
                          <p id="lemma-value" className="text-sm font-bold text-indigo-300 mt-0.5">{apiWordDetails.baseForm || selectedToken?.cleanWord}</p>
                        </div>
                        <div className="bg-white/5 border border-white/5 rounded-2xl p-3">
                          <span className="text-[9px] font-bold text-slate-400 font-mono uppercase">Text Density</span>
                          <p id="density-value" className="text-sm font-bold text-white mt-0.5">{selectedToken?.density.toFixed(1)}% ({selectedToken?.frequency}x)</p>
                        </div>
                      </div>

                      {/* AI advice paragraph */}
                      <div className="bg-violet-500/10 border border-violet-500/20 rounded-2xl p-4">
                        <span className="text-[9px] font-bold text-violet-400 font-mono uppercase">Semantic Insight</span>
                        <p id="nuance-explanation" className="text-xs text-slate-300 leading-normal mt-1">{apiWordDetails.nuanceExplanation}</p>
                      </div>

                      {/* Synonyms selection card */}
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider block mb-2">Contextual Synonyms</span>
                        <div className="grid grid-cols-2 gap-2" id="synonyms-list">
                          {apiWordDetails.synonyms && apiWordDetails.synonyms.length > 0 ? (
                            apiWordDetails.synonyms.map((syn, idx) => (
                              <button
                                key={idx}
                                onClick={() => handleSwapSynonym(syn)}
                                className="group flex items-center justify-between text-left text-xs font-semibold text-slate-200 bg-white/5 border border-white/5 rounded-xl px-2.5 py-2 hover:border-indigo-500 hover:bg-white/10 transition-all cursor-pointer"
                              >
                                <span className="truncate">{syn}</span>
                                <ArrowRightLeft className="h-3 w-3 text-slate-400 group-hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </button>
                            ))
                          ) : (
                            <div className="col-span-2 text-center text-xs text-slate-500 py-3">No suggestions found.</div>
                          )}
                        </div>
                      </div>

                      {/* Usage advice paragraph */}
                      <div className="bg-white/5 border border-white/5 rounded-2xl p-3 text-xs text-slate-400 leading-normal flex items-start gap-2.5">
                        <Info className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <strong className="text-slate-300">Editorial Tip: </strong>
                          {apiWordDetails.usageFrequencyAdvice}
                        </div>
                      </div>

                    </div>
                  ) : (
                    <div className="flex-grow flex flex-col items-center justify-center text-center py-6">
                      <HelpCircle className="h-10 w-10 text-slate-500 stroke-1" />
                      <p className="text-xs font-medium text-slate-400 mt-1">Failed to analyze target word.</p>
                    </div>
                  )}

                </div>
              ) : (
                // Sidebar Default Global metrics display (when no word token is focused)
                <div className="flex-grow flex flex-col space-y-6">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-widest">Workspace Insights</span>
                    <h3 className="text-xl font-bold text-white tracking-tight mt-1">Global Vocabulary Metrics</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Statistical metrics on current text structure.</p>
                  </div>

                  {stats.totalWords > 0 ? (
                    <div className="space-y-6 flex-grow flex flex-col justify-between">
                      {/* Big circle metric representing density diversity */}
                      <div className="flex flex-col items-center justify-center py-6 border border-white/10 rounded-3xl bg-white/5">
                        <div className="relative flex items-center justify-center">
                          {/* Circle progress mockup using inline SVG */}
                          <svg className="w-28 h-28 transform -rotate-90">
                            <circle cx="56" cy="56" r="48" stroke="rgba(255,255,255,0.05)" strokeWidth="8" fill="transparent" />
                            <circle cx="56" cy="56" r="48" stroke="#818CF8" strokeWidth="8" fill="transparent" 
                                    strokeDasharray="301" 
                                    strokeDashoffset={301 - (301 * stats.vocabularyDiversity) / 100}
                                    strokeLinecap="round"
                                    className="transition-all duration-1000" />
                          </svg>
                          <div className="absolute flex flex-col items-center">
                            <span className="text-2xl font-black text-white">{stats.vocabularyDiversity}%</span>
                            <span className="text-[9px] text-slate-400 uppercase font-mono font-bold tracking-wider">Diversity</span>
                          </div>
                        </div>
                        <p className="text-xs text-slate-300 mt-4 text-center px-4 leading-normal">
                          High numbers signal richer vocabulary. Repetitive filler words diminish grade readability quickly.
                        </p>
                      </div>

                      {/* Stat grid entries */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/5 border border-white/5 p-3.5 rounded-2xl">
                          <span className="text-[9px] font-bold text-slate-400 uppercase font-mono block">Total Words</span>
                          <span className="text-lg font-black text-white">{stats.totalWords}</span>
                        </div>
                        <div className="bg-white/5 border border-white/5 p-3.5 rounded-2xl">
                          <span className="text-[9px] font-bold text-slate-400 uppercase font-mono block">Unique Words</span>
                          <span className="text-lg font-black text-white">{stats.uniqueWords}</span>
                        </div>
                      </div>

                      {/* Action callout banner */}
                      <div className="border border-indigo-500/25 bg-indigo-500/10 rounded-2xl p-4 flex items-start gap-2">
                        <Sparkles className="h-4 w-4 text-indigo-400 mt-0.5 flex-shrink-0 animate-pulse" />
                        <div className="text-xs text-slate-300 leading-normal">
                          <span className="font-semibold text-slate-200">Word Analysis Hook:</span> Click on any highlighted word inside the editor. The sidebar will dynamically lock onto the word tenses and synonyms.
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-grow flex flex-col items-center justify-center text-center p-6 text-slate-500">
                      <BookOpen className="h-12 w-12 text-slate-400 mb-2 stroke-1" />
                      <p className="text-xs text-slate-300">Your analysis will unfold here.</p>
                      <p className="text-[11px] text-slate-400 mt-1 max-w-[200px]">Begin typing or loading a file to reveal semantic metrics and grammar distributions.</p>
                    </div>
                  )}

                </div>
              )}

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
