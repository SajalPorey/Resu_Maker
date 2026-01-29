
import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { SavedResume } from '../types';

interface Props {
  onLoad: (resume: SavedResume) => void;
  onEdit: (resume: SavedResume) => void;
  onBack: () => void;
}

const LibraryView: React.FC<Props> = ({ onLoad, onEdit, onBack }) => {
  const [resumes, setResumes] = useState<SavedResume[]>([]);

  useEffect(() => {
    setResumes(storageService.getAll());
  }, []);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this resume?')) {
      storageService.delete(id);
      setResumes(storageService.getAll());
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors mb-6"
      >
        ← Back to Home
      </button>

      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 mb-2 tracking-tight">Your Resume Library</h1>
          <p className="text-slate-600">Access and manage your AI-optimized career profiles.</p>
        </div>
        <div className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl font-bold text-sm border border-indigo-100">
          {resumes.length} Saved Profiles
        </div>
      </div>

      {resumes.length === 0 ? (
        <div className="text-center py-32 bg-white rounded-3xl border border-dashed border-slate-300">
          <div className="text-6xl mb-6">📁</div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">No saved resumes yet</h3>
          <p className="text-slate-500 mb-8">Start building and optimizing to see your library grow.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {resumes.map(resume => (
            <div 
              key={resume.id}
              onClick={() => onLoad(resume)}
              className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group flex flex-col h-full"
            >
              <div className="p-8 flex-grow">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center text-2xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    📄
                  </div>
                  <button 
                    onClick={(e) => handleDelete(resume.id, e)}
                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  >
                    🗑️
                  </button>
                </div>
                
                <h3 className="text-xl font-bold text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors">
                  {resume.data.fullName || 'Untitled Profile'}
                </h3>
                <p className="text-xs text-indigo-600 font-extrabold uppercase tracking-widest mb-4">
                  {resume.data.targetRole}
                </p>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <span className="text-indigo-500">✨</span>
                    {resume.analysis ? 'AI Optimized' : 'Draft Version'}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <span className="text-indigo-500">🕒</span>
                    Saved {new Date(resume.timestamp).toLocaleDateString()}
                  </div>
                </div>
              </div>
              
              <div className="p-4 border-t border-slate-50 grid grid-cols-2 gap-3">
                 <button 
                  onClick={(e) => { e.stopPropagation(); onEdit(resume); }}
                  className="py-2 bg-slate-50 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-100 transition-all"
                 >
                  Modify
                 </button>
                 <button className="py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs hover:bg-indigo-700 transition-all">
                  Preview
                 </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LibraryView;
