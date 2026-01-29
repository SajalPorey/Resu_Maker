
import React, { useState } from 'react';
import { ResumeData, AIAnalysis, LiveJob } from '../types';
import { enhanceResume, findLiveJobs } from '../services/geminiService';

interface Props {
  data: ResumeData;
  analysis: AIAnalysis | null;
  onGeneratePortfolio: () => void;
  onSaveToLibrary: () => void;
  isProcessing: boolean;
  onBack: () => void;
}

const ResumePreview: React.FC<Props> = ({ data, analysis: initialAnalysis, onGeneratePortfolio, onSaveToLibrary, isProcessing: initialProcessing, onBack }) => {
  const [proofMode, setProofMode] = useState(false);
  const [saved, setSaved] = useState(false);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(initialAnalysis);
  const [isProcessing, setIsProcessing] = useState(initialProcessing);
  const [jdText, setJdText] = useState('');
  const [showJdPanel, setShowJdPanel] = useState(false);
  const [liveJobs, setLiveJobs] = useState<LiveJob[]>([]);
  const [isSearchingJobs, setIsSearchingJobs] = useState(false);

  const handlePrint = () => window.print();

  const handleSave = () => {
    onSaveToLibrary();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleTargetJob = async () => {
    if (!jdText.trim()) return;
    setIsProcessing(true);
    try {
      const result = await enhanceResume(data, jdText);
      setAnalysis(result);
      setShowJdPanel(false);
    } catch (e) {
      alert("Analysis failed. Try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDiscoverJobs = async () => {
    setIsSearchingJobs(true);
    try {
      const jobs = await findLiveJobs(data.targetRole, data.location || 'Remote');
      setLiveJobs(jobs);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearchingJobs(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score > 85) return 'text-emerald-600';
    if (score > 60) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 grid lg:grid-cols-3 gap-8 items-start">
      <div className="lg:col-span-1 space-y-6 no-print">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors mb-2"
        >
          ← Back to Resume Editor
        </button>
        
        <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <span className="text-indigo-600">✨</span> AI Insights
            </h2>
            <div className="flex gap-2">
               <button 
                onClick={() => setProofMode(!proofMode)}
                className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all border ${proofMode ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-100 text-slate-500'}`}
              >
                PROOF
              </button>
            </div>
          </div>
          
          <div className="space-y-6">
            {/* Target JD Button */}
            <button 
              onClick={() => setShowJdPanel(true)}
              className="w-full py-3 bg-indigo-50 text-indigo-700 rounded-xl font-bold text-sm border border-indigo-100 hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2"
            >
              🎯 Target Specific Job
            </button>

            {/* JD Match Analysis Results */}
            {analysis?.jdMatch && (
              <div className="p-5 bg-indigo-600 text-white rounded-2xl shadow-lg animate-in slide-in-from-top">
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">Job Match Grade</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black">{analysis.jdMatch.matchScore}%</span>
                  <span className="text-xs font-bold px-2 py-0.5 bg-white/20 rounded-full">{analysis.jdMatch.compatibilityLevel} Match</span>
                </div>
                <div className="mt-4 space-y-2">
                   <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Missing from your Resume:</p>
                   <div className="flex flex-wrap gap-1">
                     {analysis.jdMatch.missingKeywords.slice(0, 5).map((kw, i) => (
                       <span key={i} className="px-2 py-1 bg-white/10 rounded text-[10px] border border-white/20">{kw}</span>
                     ))}
                   </div>
                </div>
              </div>
            )}

            {/* ATS Score Gauge */}
            {analysis && (
              <div className="text-center p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">General ATS Score</p>
                <div className={`text-5xl font-black mb-1 ${getScoreColor(analysis.atsScore)}`}>
                  {analysis.atsScore}%
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mt-3">
                  <div 
                    className={`h-full transition-all duration-1000 ${analysis.atsScore > 85 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                    style={{ width: `${analysis.atsScore}%` }}
                  />
                </div>
              </div>
            )}

            {/* Live Job Discovery */}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Live Market Discovery</h3>
                <button 
                  onClick={handleDiscoverJobs}
                  disabled={isSearchingJobs}
                  className="text-[10px] font-bold text-indigo-600 hover:underline disabled:opacity-50"
                >
                  {isSearchingJobs ? 'Searching...' : 'Refresh'}
                </button>
              </div>
              
              <div className="space-y-3">
                {liveJobs.length > 0 ? (
                  liveJobs.map((job, i) => (
                    <a key={i} href={job.url} target="_blank" rel="noreferrer" className="block p-3 bg-white border border-slate-100 rounded-xl hover:border-indigo-200 hover:shadow-sm transition-all group">
                      <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 truncate">{job.title}</p>
                      <p className="text-[10px] text-slate-500">{job.company} · {job.location}</p>
                    </a>
                  ))
                ) : (
                  <button onClick={handleDiscoverJobs} className="w-full py-2 text-[10px] font-bold text-slate-400 border border-dashed rounded-xl border-slate-200 hover:border-indigo-200 hover:text-indigo-600 transition-all">
                    Find active {data.targetRole} roles...
                  </button>
                )}
              </div>
            </div>

            {/* Actionable Checklist */}
            {analysis?.actionableChecklist && (
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Priority Actions</h3>
                <div className="space-y-2">
                  {analysis.actionableChecklist.map((item, i) => (
                    <div key={i} className="flex gap-3 text-xs bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                      <span className={`font-black ${item.priority === 'High' ? 'text-red-500' : 'text-amber-500'}`}>!</span>
                      <p className="text-slate-600 font-medium">{item.task}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-8 pt-6 border-t flex flex-col gap-3">
             <button onClick={handlePrint} className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold shadow-lg text-sm hover:scale-[1.02] active:scale-95 transition-all">Save as PDF</button>
             <button onClick={handleSave} className={`w-full py-3 rounded-xl font-bold text-sm border transition-all ${saved ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                {saved ? 'Saved!' : 'Save to Library'}
             </button>
             <button onClick={onGeneratePortfolio} disabled={isProcessing} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg text-sm disabled:opacity-50 hover:bg-indigo-700 transition-all">
                {isProcessing ? 'Thinking...' : 'Launch Portfolio Site'}
             </button>
          </div>
        </div>
      </div>

      <div className={`lg:col-span-2 bg-white shadow-2xl transition-all duration-500 border border-slate-100 ${proofMode ? 'ring-8 ring-emerald-500/10' : ''}`}>
        {/* Actual Resume Content Rendering remains same as before... */}
        <div className="p-12 md:p-16 text-slate-800">
            <header className="border-b-2 border-slate-900 pb-8 mb-8 flex flex-col md:flex-row justify-between items-baseline gap-4">
                <div>
                    <h1 className="text-4xl font-extrabold text-slate-900 uppercase mb-2 tracking-tight">{data.fullName || "Your Name"}</h1>
                    <p className="text-indigo-600 font-bold tracking-widest uppercase text-sm">{data.targetRole}</p>
                </div>
                <div className="text-right text-sm font-medium text-slate-500">
                    <p>{data.email}</p>
                    <p>{data.location}</p>
                    <p>{data.phone}</p>
                </div>
            </header>

            <section className="mb-10">
                <h2 className="text-sm font-bold text-slate-900 border-b border-slate-200 mb-4 pb-1 uppercase tracking-widest">Executive Summary</h2>
                <p className="leading-relaxed text-slate-700 text-lg italic font-medium">{data.summary}</p>
            </section>

            <section className="mb-10">
                <h2 className="text-sm font-bold text-slate-900 border-b border-slate-200 mb-6 pb-1 uppercase tracking-widest">Professional Experience</h2>
                <div className="space-y-10">
                    {data.experience.map((exp, i) => (
                        <div key={i} className="relative group">
                            <div className="flex justify-between items-baseline mb-1">
                                <h3 className="font-bold text-xl text-slate-900">{exp.company}</h3>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{exp.duration}</span>
                            </div>
                            <p className="text-indigo-600 font-bold mb-3 uppercase text-xs tracking-wider">{exp.role}</p>
                            <div className="text-slate-700 leading-relaxed relative pl-6 border-l-2 border-slate-100 group-hover:border-indigo-200 transition-colors whitespace-pre-line">
                                {exp.description}
                                {proofMode && (exp.metrics || exp.evidenceLink) && (
                                  <div className="mt-4 flex flex-wrap gap-2 animate-in slide-in-from-left-2">
                                    {exp.metrics && (
                                      <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full flex items-center gap-2 border border-emerald-200">
                                        🛡️ Impact Verification: {exp.metrics}
                                      </span>
                                    )}
                                  </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <section className="mb-10">
                <h2 className="text-sm font-bold text-slate-900 border-b border-slate-200 mb-6 pb-1 uppercase tracking-widest">Selected Projects</h2>
                <div className="grid md:grid-cols-2 gap-8">
                    {data.projects.map((proj, i) => (
                        <div key={i} className={`p-8 rounded-3xl transition-all duration-300 border ${proofMode && proj.metrics ? 'bg-emerald-50 border-emerald-200 shadow-xl' : 'bg-slate-50 border-slate-100'}`}>
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-bold text-slate-900 text-lg">{proj.name}</h3>
                            </div>
                            <p className="text-indigo-600 font-bold text-[10px] uppercase mb-4 tracking-widest">{proj.technologies}</p>
                            <p className="text-sm text-slate-600 leading-relaxed mb-4">{proj.description}</p>
                        </div>
                    ))}
                </div>
            </section>
        </div>
      </div>

      {/* JD Target Modal */}
      {showJdPanel && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
           <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl p-8 animate-in zoom-in-95">
              <h3 className="text-2xl font-black text-slate-900 mb-2">Target a Specific Job</h3>
              <p className="text-slate-500 mb-6 text-sm font-medium">Paste the job description below to see how well your resume matches and get tailored suggestions.</p>
              <textarea 
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                className="w-full h-64 p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-sm mb-6"
                placeholder="Paste the job requirements, responsibilities, and about us section here..."
              />
              <div className="flex gap-3">
                <button onClick={() => setShowJdPanel(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all">Cancel</button>
                <button 
                  onClick={handleTargetJob}
                  disabled={isProcessing || !jdText.trim()}
                  className="flex-[2] py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-50"
                >
                  {isProcessing ? 'Analyzing Match...' : 'Calculate Fit Grade'}
                </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ResumePreview;
