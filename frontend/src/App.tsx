import { useState, useEffect } from 'react';
import { ViewTab } from './types';
import Header from './components/Header';
import HomeView from './components/HomeView';
import EditorView from './components/EditorView';
import { motion, AnimatePresence } from 'motion/react';
import { HelpCircle, RefreshCw, Layers2, Sparkles, Sliders } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<ViewTab>('home');
  const [hasApiKey, setHasApiKey] = useState<boolean>(true); // default to true, updated on ping
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Ping server health to check environment variables structure
  useEffect(() => {
    async function checkHealth() {
      try {
        const res = await fetch('/api/health');
        if (res.ok) {
          const data = await res.json();
          setHasApiKey(data.hasApiKey);
        } else {
          setHasApiKey(false);
        }
      } catch (err) {
        console.warn("Could not reach backend health check. Operating in client-fallback offline mode.");
        setHasApiKey(false);
      } finally {
        setIsLoading(false);
      }
    }
    checkHealth();
  }, []);

  const handleStartEditing = (tab: ViewTab) => {
    setCurrentTab(tab);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased relative overflow-hidden">
      {/* Decorative Blur Blobs representing the signature Frosted Glass background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-600/10 rounded-full blur-[120px]" />
      </div>

      {/* Top persistent header */}
      <Header 
        currentTab={currentTab} 
        setCurrentTab={setCurrentTab} 
        hasApiKey={hasApiKey} 
      />

      {/* Main Container */}
      <main className="flex-grow relative z-10">
        {isLoading ? (
          <div className="flex h-[300px] flex-col items-center justify-center p-12 text-center text-slate-400">
            <RefreshCw className="h-8 w-8 text-indigo-550 animate-spin mb-3" />
            <p className="text-sm font-semibold text-slate-300">Powering up ThesaurUs workspace...</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {currentTab === 'home' && (
              <motion.div
                key="home"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
              >
                <HomeView onStart={handleStartEditing} />
              </motion.div>
            )}

            {currentTab === 'minimalist' && (
              <motion.div
                key="minimalist"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
              >
                {/* Header title specifically for minimalist view */}
                <div className="mx-auto max-w-7xl px-6 pt-10 pb-2 text-center sm:text-left">
                  <div className="flex items-center space-x-2 justify-center sm:justify-start">
                    <Sparkles className="h-5 w-5 text-indigo-400" />
                    <h2 className="text-2xl font-black text-white tracking-tight">Minimalist Workspace</h2>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">A focused editing pad that replaces overused vocabulary with inline dropdown alternatives.</p>
                </div>
                <EditorView viewMode="minimalist" hasApiKey={hasApiKey} />
              </motion.div>
            )}

            {currentTab === 'analytical' && (
              <motion.div
                key="analytical"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
              >
                {/* Header title specifically for analytical view */}
                <div className="mx-auto max-w-7xl px-6 pt-10 pb-2 text-center sm:text-left">
                  <div className="flex items-center space-x-2 justify-center sm:justify-start">
                    <Sliders className="h-5 w-5 text-indigo-400" />
                    <h2 className="text-2xl font-black text-white tracking-tight">Analytical Workspace</h2>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">A complete linguistic panel showcasing Part-of-Speech, verb tenses, and overall density breakdowns.</p>
                </div>
                <EditorView viewMode="analytical" hasApiKey={hasApiKey} />
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>

      {/* Footer Details */}
      <footer className="mt-16 border-t border-white/10 bg-black/30 py-10 text-center text-xs text-slate-500 font-mono relative z-10">
        <div className="mx-auto max-w-7xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 ThesaurUs Vocabulary Enhancer. All rights reserved.</p>
          <div className="flex items-center space-x-4">
            <span className="hover:text-indigo-400 cursor-help" title="Express backend on Port 3000">Node v22 + Vite</span>
            <span>•</span>
            <span className="hover:text-violet-400 cursor-help" title="Gemini 3.5 Flash Model integration">Gemini SDK v2.4</span>
            <span>•</span>
            <span className="hover:text-emerald-450 cursor-help" title="Dynamic highlight layers">Tailwind 4.1</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
