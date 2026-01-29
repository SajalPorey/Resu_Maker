
import React, { useState } from 'react';
import { ResumeData, TargetRole } from '../types';
import { TARGET_ROLES } from '../constants';

interface Props {
  initialData: ResumeData;
  onSubmit: (data: ResumeData) => void;
  isProcessing: boolean;
  onBack: () => void;
}

const ResumeForm: React.FC<Props> = ({ initialData, onSubmit, isProcessing, onBack }) => {
  const [data, setData] = useState<ResumeData>(initialData);
  const [step, setStep] = useState(1);
  const [proofMode, setProofMode] = useState(false);

  const handleChange = (field: keyof ResumeData, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const addItem = (field: 'experience' | 'education' | 'projects') => {
    const newItem = field === 'experience' 
      ? { company: '', role: '', duration: '', description: '', metrics: '', evidenceLink: '' }
      : field === 'education' 
      ? { school: '', degree: '', year: '' }
      : { name: '', technologies: '', description: '', metrics: '', link: '' };
    
    setData(prev => ({ ...prev, [field]: [...prev[field], newItem] }));
  };

  const updateItem = (field: 'experience' | 'education' | 'projects', index: number, subField: string, value: any) => {
    const newList = [...data[field]] as any[];
    newList[index][subField] = value;
    setData(prev => ({ ...prev, [field]: newList }));
  };

  const removeItem = (field: 'experience' | 'education' | 'projects', index: number) => {
    const newList = [...data[field]];
    newList.splice(index, 1);
    setData(prev => ({ ...prev, [field]: newList }));
  };

  const steps = [
    { title: 'Personal', id: 1 },
    { title: 'Experience', id: 2 },
    { title: 'Projects', id: 3 },
    { title: 'Skills', id: 4 },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div className="flex gap-4">
          {steps.map((s) => (
            <div key={s.id} className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${step === s.id ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}>{s.id}</div>
            </div>
          ))}
        </div>
        
        <button 
          onClick={() => setProofMode(!proofMode)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm transition-all border ${proofMode ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}
        >
          {proofMode ? '✅ Proof Mode Active' : '🔬 Enable Proof Mode'}
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in">
            <h2 className="text-2xl font-bold">Personal Information</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Input label="Full Name" value={data.fullName} onChange={(val) => handleChange('fullName', val)} />
              <Input label="Email" type="email" value={data.email} onChange={(val) => handleChange('email', val)} />
              <Input label="Phone" value={data.phone} onChange={(val) => handleChange('phone', val)} />
              <Input label="Location" value={data.location} onChange={(val) => handleChange('location', val)} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8 animate-in slide-in-from-right">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Experience</h2>
              <button onClick={() => addItem('experience')} className="text-indigo-600 font-bold">+ Add</button>
            </div>
            {data.experience.map((exp, i) => (
              <div key={i} className="p-6 bg-slate-50 rounded-2xl relative space-y-4">
                <button onClick={() => removeItem('experience', i)} className="absolute top-4 right-4 text-slate-400">✕</button>
                <div className="grid md:grid-cols-2 gap-4">
                  <Input label="Company" value={exp.company} onChange={(val) => updateItem('experience', i, 'company', val)} />
                  <Input label="Role" value={exp.role} onChange={(val) => updateItem('experience', i, 'role', val)} />
                </div>
                <Input label="Duration" value={exp.duration} onChange={(val) => updateItem('experience', i, 'duration', val)} />
                <textarea 
                  value={exp.description} 
                  onChange={(e) => updateItem('experience', i, 'description', e.target.value)}
                  className="w-full p-4 rounded-xl border border-slate-200 min-h-[100px]"
                  placeholder="Key accomplishments..."
                />
                {proofMode && (
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 space-y-4 animate-in zoom-in-95">
                    <p className="text-xs font-bold text-emerald-700 uppercase tracking-widest">🔬 Evidence (Proof Mode)</p>
                    <Input label="Key Metrics (e.g. 20% increase in speed)" value={exp.metrics || ''} onChange={(val) => updateItem('experience', i, 'metrics', val)} />
                    <Input label="Verification Link (Github/Portfolio)" value={exp.evidenceLink || ''} onChange={(val) => updateItem('experience', i, 'evidenceLink', val)} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-8 animate-in slide-in-from-right">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Projects</h2>
              <button onClick={() => addItem('projects')} className="text-indigo-600 font-bold">+ Add</button>
            </div>
            {data.projects.map((proj, i) => (
              <div key={i} className="p-6 bg-slate-50 rounded-2xl relative space-y-4">
                <button onClick={() => removeItem('projects', i)} className="absolute top-4 right-4 text-slate-400">✕</button>
                <Input label="Name" value={proj.name} onChange={(val) => updateItem('projects', i, 'name', val)} />
                <Input label="Tech Stack" value={proj.technologies} onChange={(val) => updateItem('projects', i, 'technologies', val)} />
                <textarea 
                  value={proj.description} 
                  onChange={(e) => updateItem('projects', i, 'description', e.target.value)}
                  className="w-full p-4 rounded-xl border border-slate-200 min-h-[80px]"
                  placeholder="Project details..."
                />
                {proofMode && (
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 space-y-4 animate-in zoom-in-95">
                    <p className="text-xs font-bold text-emerald-700 uppercase tracking-widest">🔬 Proof & Metrics</p>
                    <Input label="Specific Metrics (e.g. 95+ Lighthouse score)" value={proj.metrics || ''} onChange={(val) => updateItem('projects', i, 'metrics', val)} />
                    <Input label="Source/Live Link" value={proj.link || ''} onChange={(val) => updateItem('projects', i, 'link', val)} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-8 animate-in slide-in-from-right">
            <h2 className="text-2xl font-bold">Skills & Role</h2>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">TARGET ROLE</label>
              <select value={data.targetRole} onChange={(e) => handleChange('targetRole', e.target.value)} className="w-full p-4 rounded-xl border border-slate-200">
                {TARGET_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <textarea 
              value={data.skills.join(', ')}
              onChange={(e) => handleChange('skills', e.target.value.split(',').map(s => s.trim()))}
              className="w-full p-4 rounded-xl border border-slate-200 min-h-[100px]"
              placeholder="Skills (comma separated)..."
            />
          </div>
        )}

        <div className="flex justify-between mt-12 pt-8 border-t">
          {step > 1 ? (
            <button onClick={() => setStep(s => s - 1)} className="px-6 py-3 border rounded-xl font-bold">Back</button>
          ) : (
            <button onClick={onBack} className="px-6 py-3 border border-slate-200 rounded-xl font-bold text-slate-500 hover:bg-slate-50">← Exit to Home</button>
          )}
          
          {step < 4 ? (
            <button onClick={() => setStep(s => s + 1)} className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold">Next</button>
          ) : (
            <button 
              onClick={() => onSubmit(data)}
              disabled={isProcessing}
              className="px-10 py-3 bg-indigo-600 text-white rounded-xl font-bold disabled:opacity-50"
            >
              {isProcessing ? 'AI Analyzing...' : 'Analyze & Optimize'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const Input = ({ label, value, onChange, type = "text", placeholder = "" }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) => (
  <div>
    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-widest">{label}</label>
    <input 
      type={type} 
      value={value} 
      onChange={(e) => onChange(e.target.value)} 
      placeholder={placeholder}
      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
    />
  </div>
);

export default ResumeForm;
