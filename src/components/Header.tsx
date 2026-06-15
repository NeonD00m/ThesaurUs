import { BookOpen, Sparkles, Sliders, PlayCircle } from 'lucide-react';
import { ViewTab } from '../types';

interface HeaderProps {
  currentTab: ViewTab;
  setCurrentTab: (tab: ViewTab) => void;
  hasApiKey: boolean;
}

export default function Header({ currentTab, setCurrentTab, hasApiKey }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-white/5 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Brand Logo */}
        <div 
          className="flex cursor-pointer items-center space-x-2.5" 
          onClick={() => setCurrentTab('home')}
          id="logo-brand"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/20">
            <span className="font-mono text-xl font-bold tracking-tight text-white">T</span>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white">ThesaurUs</h1>
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Semantic Word Replacer</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center space-x-1 p-1 bg-black/20 rounded-full border border-white/5">
          <button
            id="tab-home"
            onClick={() => setCurrentTab('home')}
            className={`flex items-center space-x-2 rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
              currentTab === 'home'
                ? 'bg-white/10 text-white shadow-sm border border-white/10'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <BookOpen className="h-4 w-4" />
            <span>Home</span>
          </button>

          <button
            id="tab-minimalist"
            onClick={() => setCurrentTab('minimalist')}
            className={`flex items-center space-x-2 rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
              currentTab === 'minimalist'
                ? 'bg-white/10 text-white shadow-sm border border-white/10'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            <span>Minimalist UI</span>
          </button>

          <button
            id="tab-analytical"
            onClick={() => setCurrentTab('analytical')}
            className={`flex items-center space-x-2 rounded-full px-4 py-1.5 text-sm font-medium transition-all ${
              currentTab === 'analytical'
                ? 'bg-white/10 text-white shadow-sm border border-white/10'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sliders className="h-4 w-4" />
            <span>Analytical UI</span>
          </button>
        </nav>

        {/* API Key Status Indicator */}
        <div className="flex items-center space-x-3">
          <div className="hidden sm:flex items-center space-x-1.5 rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs font-medium text-slate-300">
            <span className={`h-2 w-2 rounded-full ${hasApiKey ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span>{hasApiKey ? 'Gemini AI Live' : 'Offline Mode'}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
