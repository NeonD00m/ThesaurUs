import { BookOpen, Sparkles, Sliders, ArrowRight, CheckCircle2, Cpu, BarChart3, HelpCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { ViewTab } from '../types';

interface HomeViewProps {
  onStart: (tab: ViewTab) => void;
}

export default function HomeView({ onStart }: HomeViewProps) {
  // Demo text to instantly showcase the highlighting and hover animation
  const sampleWords = [
    { text: "Wordiness", rating: "none" },
    { text: "and", rating: "none" },
    { text: "unnecessary", rating: "none" },
    { text: "repetition", rating: "heavy" },
    { text: "can", rating: "none" },
    { text: "make", rating: "none" },
    { text: "your", rating: "none" },
    { text: "essays", rating: "none" },
    { text: "feel", rating: "slight" },
    { text: "extremely", rating: "heavy" },
    { text: "bland", rating: "none" },
    { text: "and", rating: "none" },
    { text: "very", rating: "heavy" },
    { text: "tiresome.", rating: "none" }
  ];

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 md:py-16">
      {/* Hero Section */}
      <div className="relative text-center">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center space-x-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold text-indigo-300 animate-fade-in"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>Interactive Text Optimization Interface</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-6 font-sans text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl"
        >
          Polish Your Writing with <span className="bg-gradient-to-r from-indigo-400 to-violet-500 bg-clip-text text-transparent">Contextual Synonyms</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-300"
        >
          Identify overused vocabulary in real-time. Replace repetitive words with precise, grammatically perfect alternatives tailored to your exact sentence structure.
        </motion.p>

        {/* Call to Actions */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4 animate-fade-in"
        >
          <button
            onClick={() => onStart('minimalist')}
            className="group flex items-center space-x-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-6 py-3.5 text-base font-medium text-white shadow-lg shadow-indigo-500/20 transition-all cursor-pointer"
            id="start-minimalist"
          >
            <span>Launch Minimalist Editor</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
          
          <button
            onClick={() => onStart('analytical')}
            className="flex items-center space-x-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-6 py-3.5 text-base font-medium text-white transition-all cursor-pointer"
            id="start-analytical"
          >
            <Sliders className="h-4 w-4 text-indigo-400" />
            <span>Launch Analytical Editor</span>
          </button>
        </motion.div>
      </div>

      {/* Mini Interactive Demo Component */}
      <div className="mt-16 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-lg px-8 py-10 shadow-xl">
        <h3 className="mb-4 text-center font-mono text-[11px] uppercase tracking-wider text-slate-400">Live Visual Highlight Reference</h3>
        <p className="mx-auto max-w-xl text-center text-slate-200 leading-relaxed text-lg flex flex-wrap justify-center gap-x-2 gap-y-3">
          {sampleWords.map((word, i) => (
            <span
              key={i}
              className={`relative inline-block px-1 rounded transition-all cursor-help select-none ${
                word.rating === 'heavy'
                  ? 'bg-red-500/20 text-white font-medium border-b-2 border-red-550'
                  : word.rating === 'slight'
                  ? 'bg-yellow-500/20 text-white font-medium border-b-2 border-yellow-500'
                  : 'text-slate-350 hover:text-white'
              } group`}
            >
              <span className="relative">
                {word.text}
                {/* Hover underline slide-in effect */}
                <span className="absolute bottom-0 left-0 h-[2px] w-full scale-x-0 bg-indigo-400 transition-transform duration-300 origin-left group-hover:scale-x-100" />
              </span>
              
              {/* Tooltip highlighting nature */}
              <span className="absolute bottom-full left-1/2 mb-2 w-max -translate-x-1/2 scale-95 rounded-lg bg-slate-900 border border-white/10 px-2 py-1 text-[11px] font-normal text-white pointer-events-none opacity-0 shadow-md transition-all group-hover:scale-100 group-hover:opacity-100">
                {word.rating === 'heavy' && "🚨 Heavily Overused Word"}
                {word.rating === 'slight' && "⚠️ Slightly Overused Word"}
                {word.rating === 'none' && "✓ Dynamic Token"}
              </span>
            </span>
          ))}
        </p>
      </div>

      {/* Two Interface Variations Description */}
      <div className="mt-20">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white block">Choose Your Workflow Variation</h2>
          <p className="mt-4 text-slate-400">ThesaurUs offers two fully realized interfaces tailored to different writing styles.</p>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-2">
          {/* Variation A: Minimalist UI */}
          <div className="flex flex-col rounded-3xl border border-white/10 bg-white/5 backdrop-blur-lg p-8 transition-all hover:border-indigo-500/40 hover:bg-white/10">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/25">
              <Sparkles className="h-6 w-6" />
            </div>
            <h3 className="mt-6 text-xl font-bold text-white">Option 1: The Minimalist Popover</h3>
            <p className="mt-3 leading-relaxed text-slate-300 flex-grow">
              Ideal for fast drafting and undisturbed prose composition. Clicking any highlighted word triggers an intuitive inline popover dropdown. Instantly select alternatives, context-checked by server-side NLP, right at the cursor.
            </p>
            <ul className="mt-6 space-y-2 text-slate-300 text-sm">
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                <span>Zero screen real-estate overhead</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                <span>Instant drop-down synonym menus</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                <span>Fluid inline substitution layout</span>
              </li>
            </ul>
            <button
              onClick={() => onStart('minimalist')}
              className="mt-8 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 py-3 text-sm font-semibold text-indigo-300 transition-all text-center cursor-pointer"
            >
              Activate Minimalist View
            </button>
          </div>

          {/* Variation B: Analytical Sidebar */}
          <div className="flex flex-col rounded-3xl border border-white/10 bg-white/5 backdrop-blur-lg p-8 transition-all hover:border-violet-500/40 hover:bg-white/10">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/25">
              <Sliders className="h-6 w-6" />
            </div>
            <h3 className="mt-6 text-xl font-bold text-white">Option 2: The Analytical Sidebar</h3>
            <p className="mt-3 leading-relaxed text-slate-300 flex-grow">
              Tailored for deep editors, philologists, and language specialists. Clicking any token launches a slide-out drawer containing word-use metrics, grammatical part-of-speech context, tense tracking, lemmas, and synonym tables.
            </p>
            <ul className="mt-6 space-y-2 text-slate-300 text-sm">
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                <span>Comprehensive Part-of-Speech & tense metrics</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                <span>Base form (lemma) tracing</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                <span>Sentence context analyzer map</span>
              </li>
            </ul>
            <button
              onClick={() => onStart('analytical')}
              className="mt-8 rounded-xl bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 py-3 text-sm font-semibold text-violet-300 transition-all text-center cursor-pointer"
            >
              Activate Analytical View
            </button>
          </div>
        </div>
      </div>

      {/* Tech Stack Decoded: SQLite + Qdrant + BERT */}
      <div className="mt-24 border-t border-white/10 pt-16">
        <div className="mx-auto max-w-3xl text-center">
          <Cpu className="mx-auto h-12 w-12 text-slate-400 animate-pulse" />
          <h3 className="mt-4 text-2xl font-bold text-white">How the Backend Pipeline Operates</h3>
          <p className="mt-3 text-slate-400">ThesaurUs employs a hybrid model of relational and semantic vectors to fulfill requests.</p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6">
            <span className="font-mono text-xs font-bold text-indigo-400 uppercase">Stage 1 & 2</span>
            <h4 className="mt-2 font-bold text-white">Word Count Engine</h4>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              Tokenizes input documents securely, parses punctuation, and maps lexical frequencies instantly. Words exceeding density thresholds are highlighted automatically.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6">
            <span className="font-mono text-xs font-bold text-violet-400 uppercase">Stage 3</span>
            <h4 className="mt-2 font-bold text-white">Semantic Embedding Cache</h4>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              Converts selected words into multi-dimensional vectors. Matches them against Qdrant indices via cosine distance rules, yielding contextually relevant equivalents.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6">
            <span className="font-mono text-xs font-bold text-emerald-400 uppercase">Stage 4</span>
            <h4 className="mt-2 font-bold text-white">Masked Language Modeling</h4>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              Substitutes the chosen word with an AI mask and analyzes the sentence. Resolves tenses and conjugations, ensuring the suggested synonyms fit perfectly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
