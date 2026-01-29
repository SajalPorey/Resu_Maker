
import React from 'react';
import { SavedResume } from '../types';

interface Props {
  onStart: () => void;
  onDemo: () => void;
  recentResumes: SavedResume[];
  onLoadResume: (resume: SavedResume) => void;
}

const LandingPage: React.FC<Props> = ({ onStart, onDemo, recentResumes, onLoadResume }) => {
  return (
    <div className="relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-100/50 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-violet-100/50 rounded-full blur-3xl -z-10"></div>

      <div className="max-w-7xl mx-auto px-4 pt-20 pb-32">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 mb-6 leading-tight">
            Build a Resume that <span className="text-indigo-600">Actually</span> Lands Interviews
          </h1>
          
          <p className="text-xl text-slate-600 mb-10 leading-relaxed max-w-3xl mx-auto">
            Stop guessing what recruiters want. Our AI analyzes your experience, optimizes your content for ATS, and generates a matching portfolio website in seconds.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <button 
              onClick={onStart}
              className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 hover:scale-105 active:scale-95"
            >
              Start Building Now
            </button>
            <button 
              onClick={onDemo}
              className="px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-2xl font-bold text-lg hover:bg-slate-50 transition-all shadow-sm active:scale-95"
            >
              Try with Demo Data
            </button>
          </div>

          {recentResumes.length > 0 && (
            <div className="max-w-3xl mx-auto mb-20 text-left">
              <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <span className="text-indigo-600">⚡</span> Jump Back In
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentResumes.map(resume => (
                  <div 
                    key={resume.id} 
                    onClick={() => onLoadResume(resume)}
                    className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md hover:border-indigo-200 cursor-pointer transition-all group"
                  >
                    <p className="font-bold text-slate-900 truncate mb-1">{resume.data.fullName || 'Untitled'}</p>
                    <p className="text-xs text-indigo-600 font-bold uppercase mb-3">{resume.data.targetRole}</p>
                    <p className="text-xs text-slate-400">
                      Saved {new Date(resume.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard 
            icon="🚀"
            title="ATS Optimization"
            desc="Gemini-powered keyword insertion and summary generation tailored to your target job role."
          />
          <FeatureCard 
            icon="🎨"
            title="Instant Portfolio"
            desc="One click converts your resume into a clean, modern personal portfolio website ready to share."
          />
          <FeatureCard 
            icon="🧠"
            title="AI Skill Gap Analysis"
            desc="Identifies missing industry-standard skills to help you understand where to grow next."
          />
        </div>
      </div>
    </div>
  );
};

const FeatureCard = ({ icon, title, desc }: { icon: string; title: string; desc: string }) => (
  <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
    <div className="text-4xl mb-4">{icon}</div>
    <h3 className="text-xl font-bold mb-2 text-slate-900">{title}</h3>
    <p className="text-slate-600 leading-relaxed">{desc}</p>
  </div>
);

export default LandingPage;
