
import React, { useState, useEffect } from 'react';
import { ResumeData, AppView, AIAnalysis, PortfolioData, SavedResume } from './types';
import { INITIAL_RESUME_DATA, MOCK_RESUME } from './constants';
import LandingPage from './components/LandingPage';
import ResumeForm from './components/ResumeForm';
import ResumePreview from './components/ResumePreview';
import PortfolioPreview from './components/PortfolioPreview';
import LibraryView from './components/LibraryView';
import MockInterview from './components/MockInterview';
import { enhanceResume, generatePortfolioContent } from './services/geminiService';
import { storageService } from './services/storageService';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('landing');
  const [resumeData, setResumeData] = useState<ResumeData>(INITIAL_RESUME_DATA);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [savedResumes, setSavedResumes] = useState<SavedResume[]>([]);

  useEffect(() => {
    setSavedResumes(storageService.getAll());
  }, [view]);

  const handleEnhance = async (data: ResumeData) => {
    setIsProcessing(true);
    try {
      const result = await enhanceResume(data);
      setAiAnalysis(result);
      setResumeData({ 
        ...data, 
        summary: result.summary, 
        experience: result.optimizedExperience, 
        projects: result.optimizedProjects 
      });
      setView('preview');
    } catch (error: any) {
      alert(`API Error: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGeneratePortfolio = async () => {
    setIsProcessing(true);
    try {
      const result = await generatePortfolioContent(resumeData);
      setPortfolioData(result);
      setView('portfolio');
    } catch (error: any) {
      alert(`Portfolio Error: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-50 no-print">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('landing')}>
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">R</div>
            <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">ResuMaster AI</span>
          </div>
          
          <div className="flex items-center gap-4">
            {view === 'preview' && (
                <button 
                  onClick={() => setView('interview')}
                  className="bg-slate-900 text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-slate-800 transition-all"
                >
                  🎙️ Start Interview
                </button>
            )}
            <button onClick={() => setView('library')} className="font-medium text-slate-600 hover:text-indigo-600 px-4 py-2 transition-colors">📚 Library</button>
            {view !== 'landing' && <button onClick={() => setView('builder')} className="text-slate-600 hover:text-indigo-600 font-medium px-4 py-2">Builder</button>}
          </div>
        </div>
      </nav>

      <main className="flex-grow">
        {view === 'landing' && (
          <LandingPage 
            onStart={() => setView('builder')} 
            onDemo={() => { setResumeData(MOCK_RESUME); setView('builder'); }} 
            recentResumes={savedResumes.slice(0, 3)} 
            onLoadResume={(s) => { 
              setResumeData(s.data); 
              setAiAnalysis(s.analysis); 
              setView('preview'); 
            }} 
          />
        )}
        {view === 'builder' && (
          <ResumeForm 
            initialData={resumeData} 
            onSubmit={handleEnhance} 
            isProcessing={isProcessing} 
            onBack={() => setView('landing')} 
          />
        )}
        {view === 'preview' && (
          <ResumePreview 
            data={resumeData} 
            analysis={aiAnalysis} 
            onGeneratePortfolio={handleGeneratePortfolio} 
            onSaveToLibrary={() => storageService.saveResume(resumeData, aiAnalysis)} 
            isProcessing={isProcessing} 
            onBack={() => setView('builder')} 
          />
        )}
        {view === 'portfolio' && (
          <PortfolioPreview 
            resumeData={resumeData} 
            portfolioData={portfolioData} 
            onBack={() => setView('preview')} 
          />
        )}
        {view === 'library' && (
          <LibraryView 
            onLoad={(s) => { 
              setResumeData(s.data); 
              setAiAnalysis(s.analysis); 
              setView('preview'); 
            }} 
            onEdit={(s) => { 
              setResumeData(s.data); 
              setView('builder'); 
            }} 
            onBack={() => setView('landing')} 
          />
        )}
        {view === 'interview' && (
          <MockInterview 
            resume={resumeData} 
            onClose={() => setView('preview')} 
          />
        )}
      </main>

      <footer className="bg-slate-50 border-t py-12 no-print text-center">
          <p className="text-slate-500 font-medium">© 2024 ResuMaster AI. Powered by Google Gemini.</p>
      </footer>
    </div>
  );
};

export default App;
