
import React, { useState, useEffect, useRef } from 'react';
import { ResumeData, PortfolioData } from '../types';
import { generateBrandImage, generateElevatorPitch, generateContactReply } from '../services/geminiService';
import MockInterview from './MockInterview';

interface Props {
  resumeData: ResumeData;
  portfolioData: PortfolioData | null;
  onBack: () => void;
}

// PCM Audio Helper Functions
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const PortfolioPreview: React.FC<Props> = ({ resumeData, portfolioData: initialData, onBack }) => {
  const [data, setData] = useState(initialData);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle');
  const [isPlayingPitch, setIsPlayingPitch] = useState(false);
  const [isMeetingOpen, setIsMeetingOpen] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [isSending, setIsSending] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('reveal-active');
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal').forEach(el => observerRef.current?.observe(el));

    const handleScroll = () => {
      const scrollY = window.scrollY;
      if (scrollY < 500) setActiveSection('hero');
      else if (scrollY < 1200) setActiveSection('about');
      else if (scrollY < 2200) setActiveSection('projects');
      else setActiveSection('contact');
    };
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      observerRef.current?.disconnect();
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, [data]);

  const handleEnhanceBranding = async () => {
    setIsGenerating(true);
    try {
      const [img, audio] = await Promise.all([
        generateBrandImage(resumeData.targetRole, resumeData.fullName),
        generateElevatorPitch(resumeData.summary)
      ]);
      setData({ ...data, brandImageUrl: img, pitchAudioData: audio } as PortfolioData);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const playPitch = async () => {
    if (!data?.pitchAudioData || isPlayingPitch) return;
    
    setIsPlayingPitch(true);
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    
    const audioData = decode(data.pitchAudioData);
    const audioBuffer = await decodeAudioData(audioData, audioContextRef.current, 24000, 1);
    
    const source = audioContextRef.current.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContextRef.current.destination);
    source.onended = () => setIsPlayingPitch(false);
    source.start(0);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.message) return;
    
    setIsSending(true);
    try {
      const reply = await generateContactReply(
        resumeData.fullName, 
        contactForm.name, 
        contactForm.message, 
        resumeData.summary
      );
      setSuccessMessage(reply);
      setContactForm({ name: '', email: '', message: '' });
    } catch (err) {
      setSuccessMessage("Your message has been received! I'll get back to you personally very soon.");
    } finally {
      setIsSending(false);
    }
  };

  const copyEmail = () => {
    navigator.clipboard.writeText(resumeData.email);
    setCopyStatus('copied');
    setTimeout(() => setCopyStatus('idle'), 2000);
  };

  const triggerEmail = () => {
    window.location.href = `mailto:${resumeData.email}?subject=Collaboration Inquiry&body=Hi ${resumeData.fullName.split(' ')[0]},`;
  };

  if (isMeetingOpen) return (
    <MockInterview 
      resume={resumeData} 
      onClose={() => setIsMeetingOpen(false)} 
    />
  );

  if (!data) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="flex flex-col items-center gap-6">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="font-black text-indigo-400 uppercase tracking-[0.3em] animate-pulse text-xs">Architecting Portfolio...</p>
      </div>
    </div>
  );

  return (
    <div className="bg-slate-950 min-h-screen text-white selection:bg-indigo-500/30 selection:text-white font-['Inter'] scroll-smooth">
      
      {/* Premium Glass Nav */}
      <nav className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] w-[95%] max-w-4xl no-print">
        <div className="bg-slate-900/40 backdrop-blur-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-3xl px-8 py-4 flex items-center justify-between">
          <div className="font-black text-white tracking-tighter text-xl flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-xs">AI</div>
            {resumeData.fullName.split(' ')[0]}<span className="text-indigo-500">.</span>
          </div>
          <div className="flex gap-6 items-center">
            {['About', 'Projects', 'Contact'].map((item) => (
              <button 
                key={item}
                onClick={() => document.getElementById(item.toLowerCase())?.scrollIntoView({ behavior: 'smooth' })}
                className={`text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 hidden sm:block ${activeSection === item.toLowerCase() ? 'text-indigo-400' : 'text-slate-500 hover:text-white'}`}
              >
                {item}
              </button>
            ))}
            <button 
              onClick={() => setIsMeetingOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-lg shadow-indigo-500/20"
            >
              Start Chat
            </button>
            <button 
              onClick={onBack}
              className="text-slate-400 hover:text-white border border-white/10 hover:border-white/30 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
            >
              Exit
            </button>
          </div>
        </div>
      </nav>

      {/* Cinematic Hero */}
      <div id="hero" className="relative h-screen overflow-hidden flex items-center justify-center">
         {data.brandImageUrl ? (
             <img src={data.brandImageUrl} className="absolute inset-0 w-full h-full object-cover opacity-50 scale-105 animate-slow-zoom" alt="Brand Background" />
         ) : (
             <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-slate-900 to-black animate-gradient-shift"></div>
         )}
         
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(2,6,23,0.8)_100%)]"></div>

         <div className="relative z-10 text-center px-6 max-w-6xl">
             <div className="inline-block px-6 py-2 bg-indigo-500/10 backdrop-blur-xl border border-indigo-500/30 rounded-full text-indigo-400 text-[10px] font-black uppercase tracking-[0.4em] mb-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
               Engineering Excellence
             </div>
             
             <h1 className="text-6xl md:text-[9rem] font-black text-white mb-8 tracking-tighter leading-[0.8] drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)] animate-in fade-in slide-in-from-bottom-8 duration-1000">
               {resumeData.fullName}
             </h1>
             
             <p className="text-lg md:text-3xl font-light text-slate-300 mb-14 max-w-4xl mx-auto leading-tight opacity-90 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300 tracking-tight">
               {data.heroText}
             </p>
             
             <div className="flex flex-col sm:flex-row gap-8 items-center justify-center animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-500">
                {!data.brandImageUrl && (
                  <button 
                    onClick={handleEnhanceBranding}
                    disabled={isGenerating}
                    className="group relative px-12 py-6 bg-white text-slate-950 rounded-2xl font-black text-xl transition-all hover:bg-indigo-50 hover:scale-105 active:scale-95 disabled:opacity-50 overflow-hidden"
                  >
                    <span className="relative z-10">{isGenerating ? 'Synthesizing...' : '✨ Create AI Brand Assets'}</span>
                    <div className="absolute inset-0 bg-indigo-600 translate-y-full group-hover:translate-y-0 transition-transform duration-300 opacity-10"></div>
                  </button>
                )}
                
                {data.pitchAudioData && (
                    <button 
                      onClick={playPitch}
                      disabled={isPlayingPitch}
                      className="bg-white/5 backdrop-blur-3xl p-6 rounded-3xl border border-white/10 flex items-center gap-6 shadow-2xl animate-in zoom-in-95 hover:bg-white/10 transition-all group"
                    >
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isPlayingPitch ? 'bg-indigo-600 animate-pulse' : 'bg-white/10 group-hover:bg-indigo-600'}`}>
                           {isPlayingPitch ? '🔊' : '▶️'}
                        </div>
                        <div className="text-left">
                          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 mb-1">AI Pitch Preview</p>
                          <p className="text-xs font-bold text-white opacity-80">{isPlayingPitch ? 'Speaking...' : 'Listen to Elevator Pitch'}</p>
                        </div>
                    </button>
                )}

                <button 
                  onClick={() => setIsMeetingOpen(true)}
                  className="px-10 py-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-3xl font-black text-xl transition-all flex items-center gap-4 shadow-2xl shadow-indigo-500/20"
                >
                  🎙️ Live Coffee Chat
                </button>
             </div>
         </div>
      </div>

      {/* About Section */}
      <section id="about" className="py-40 px-4 max-w-7xl mx-auto reveal">
        <div className="grid lg:grid-cols-12 gap-24 items-start">
            <div className="lg:col-span-5 space-y-10">
                <div className="space-y-4">
                  <h2 className="text-xs font-black text-indigo-500 uppercase tracking-[0.4em]">The Vision</h2>
                  <h3 className="text-6xl font-black leading-[0.9] tracking-tighter text-white">Logic meets <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">creativity.</span></h3>
                </div>
                <p className="text-3xl text-slate-400 leading-tight font-medium tracking-tight italic">"{data.aboutMe}"</p>
                <div className="pt-8 flex flex-wrap gap-4">
                  <div className="px-6 py-4 bg-white/5 border border-white/10 rounded-2xl">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Role</p>
                    <p className="font-bold text-white">{resumeData.targetRole}</p>
                  </div>
                  <div className="px-6 py-4 bg-white/5 border border-white/10 rounded-2xl">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Location</p>
                    <p className="font-bold text-white">{resumeData.location || 'Remote'}</p>
                  </div>
                </div>
            </div>
            <div className="lg:col-span-7 grid sm:grid-cols-2 gap-8">
                {data.techStacks.map((s, i) => (
                    <div key={i} className="group p-10 bg-white/5 hover:bg-white/[0.08] rounded-[3rem] border border-white/10 hover:border-indigo-500/30 transition-all duration-700 reveal">
                        <div className="w-16 h-16 bg-indigo-900/20 group-hover:bg-indigo-600 text-indigo-400 group-hover:text-white rounded-[1.5rem] flex items-center justify-center text-3xl mb-10 transition-all duration-500 shadow-xl">
                          {i === 0 ? '💻' : i === 1 ? '⚡' : i === 2 ? '🎨' : '🛠️'}
                        </div>
                        <h3 className="font-black text-white text-xl mb-8 uppercase tracking-[0.2em]">{s.category}</h3>
                        <div className="flex flex-wrap gap-3">
                            {s.skills.map((skill, j) => (
                                <span key={j} className="px-5 py-2.5 bg-black/40 text-slate-300 text-[11px] font-black rounded-xl border border-white/5 group-hover:border-indigo-500/20 transition-all">{skill}</span>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </section>

      {/* Projects Grid */}
      <section id="projects" className="py-40 bg-slate-900/30">
          <div className="max-w-7xl mx-auto px-4">
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-24 gap-12 reveal">
                <div className="space-y-4">
                  <h2 className="text-xs font-black text-indigo-500 uppercase tracking-[0.4em]">Selected Work</h2>
                  <h3 className="text-7xl font-black tracking-tighter text-white">Featured Projects</h3>
                </div>
                <p className="max-w-md text-slate-400 text-xl font-medium leading-relaxed">Engineered for performance and scale. Every line of code serves a purpose.</p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-16">
                  {resumeData.projects.map((p, i) => (
                      <div key={i} className="group relative bg-white/5 rounded-[4rem] p-6 border border-white/10 hover:border-indigo-500/40 transition-all duration-700 reveal">
                          <div className="aspect-[16/10] bg-slate-800 rounded-[3rem] mb-10 overflow-hidden relative shadow-2xl">
                              <img src={`https://picsum.photos/seed/${p.name}/1200/800`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 ease-out opacity-70 group-hover:opacity-100" alt={p.name} />
                              <div className="absolute inset-0 bg-indigo-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center backdrop-blur-md transition-all duration-500">
                                <a href={p.link || "#"} target="_blank" rel="noreferrer" className="px-12 py-4 bg-white text-slate-950 font-black rounded-2xl transform translate-y-8 group-hover:translate-y-0 transition-all duration-500 shadow-3xl text-lg">View Source</a>
                              </div>
                          </div>
                          <div className="px-4 pb-4">
                            <div className="flex justify-between items-start mb-6">
                              <h3 className="text-4xl font-black text-white tracking-tighter">{p.name}</h3>
                              <span className="text-[10px] font-black text-indigo-400 uppercase bg-indigo-500/10 border border-indigo-500/30 px-4 py-2 rounded-full">Project 0{i+1}</span>
                            </div>
                            <p className="text-indigo-400 font-black text-[10px] mb-8 uppercase tracking-[0.3em]">{p.technologies}</p>
                            <p className="text-slate-400 leading-relaxed text-lg font-medium opacity-80 line-clamp-3">{p.description}</p>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-40 bg-slate-950 relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/10 rounded-full blur-[150px] -z-10 animate-pulse"></div>
          
          <div className="max-w-5xl mx-auto px-4 text-center reveal">
              <div className="mb-20 space-y-4">
                <h2 className="text-xs font-black text-indigo-500 uppercase tracking-[0.4em]">Get In Touch</h2>
                <h3 className="text-6xl md:text-8xl font-black tracking-tighter text-white leading-tight">Interested in <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-500">collaboration?</span></h3>
              </div>
              
              <div className="grid lg:grid-cols-12 gap-16 items-start text-left">
                <div className="lg:col-span-4 space-y-8">
                  <div className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] space-y-4 group hover:bg-white/[0.08] transition-all duration-500 cursor-pointer" onClick={triggerEmail}>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Reach Me Directly</p>
                    <p className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors break-all">{resumeData.email}</p>
                    <div className="pt-2">
                       <span className="text-[10px] px-3 py-1 bg-indigo-500/20 text-indigo-400 rounded-full font-black uppercase tracking-widest">Click to Email</span>
                    </div>
                  </div>
                  <div className="p-8 bg-white/5 border border-white/10 rounded-[2.5rem] space-y-4 group hover:bg-white/[0.08] transition-all duration-500 cursor-pointer" onClick={copyEmail}>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Digital Identity</p>
                    <p className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors uppercase tracking-widest">{copyStatus === 'copied' ? 'Copied! ✅' : 'Copy Email'}</p>
                  </div>
                  <button 
                    onClick={() => setIsMeetingOpen(true)}
                    className="w-full p-8 bg-white/5 border border-white/10 rounded-[2.5rem] space-y-4 hover:bg-indigo-600 group transition-all duration-500 text-left"
                  >
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 group-hover:text-white/70">Virtual Assistant</p>
                    <p className="text-lg font-bold text-white group-hover:text-white tracking-tight">Meet my AI Twin</p>
                  </button>
                </div>

                <div className="lg:col-span-8">
                  {successMessage ? (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 p-12 md:p-16 rounded-[4rem] text-center animate-in zoom-in-95 duration-700">
                       <div className="w-20 h-20 bg-emerald-500 text-white rounded-3xl flex items-center justify-center text-4xl mx-auto mb-10 shadow-2xl shadow-emerald-500/40">✨</div>
                       <h4 className="text-3xl font-black text-white mb-6 tracking-tight">AI Generated Reply</h4>
                       <p className="text-2xl text-emerald-300 font-medium leading-tight italic max-w-2xl mx-auto">"{successMessage}"</p>
                       <button 
                        onClick={() => setSuccessMessage(null)}
                        className="mt-12 px-10 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-sm font-black uppercase tracking-[0.2em] transition-all"
                       >
                         Send Another Message
                       </button>
                    </div>
                  ) : (
                    <form onSubmit={handleSendMessage} className="bg-white/5 backdrop-blur-3xl border border-white/10 p-10 md:p-16 rounded-[4rem] shadow-2xl space-y-10 reveal">
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Sender Name</label>
                                <input 
                                  required
                                  value={contactForm.name}
                                  onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
                                  className="w-full bg-black/40 border border-white/10 px-8 py-5 rounded-2xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-bold text-lg placeholder:text-slate-700"
                                  placeholder="Your Full Name"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Email Address</label>
                                <input 
                                  type="email"
                                  required
                                  value={contactForm.email}
                                  onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                                  className="w-full bg-black/40 border border-white/10 px-8 py-5 rounded-2xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-bold text-lg placeholder:text-slate-700"
                                  placeholder="you@example.com"
                                />
                            </div>
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Your Message</label>
                            <textarea 
                              required
                              value={contactForm.message}
                              onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                              className="w-full bg-black/40 border border-white/10 px-8 py-8 rounded-[2.5rem] focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-bold text-lg min-h-[220px] placeholder:text-slate-700"
                              placeholder="What's on your mind?..."
                            />
                        </div>
                        <button 
                            type="submit"
                            disabled={isSending}
                            className="group w-full py-8 bg-indigo-600 text-white rounded-[2rem] font-black text-2xl hover:bg-indigo-500 hover:scale-[1.01] active:scale-95 transition-all shadow-3xl shadow-indigo-600/20 disabled:opacity-50 overflow-hidden relative"
                        >
                            <span className="relative z-10">{isSending ? 'Personalizing Reply...' : 'Send Inquiry'}</span>
                            <div className="absolute inset-0 bg-gradient-to-r from-indigo-400 to-violet-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </button>
                    </form>
                  )}
                </div>
              </div>
          </div>
      </section>

      <footer className="py-20 bg-black border-t border-white/5 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-700">
              Personal Brand System © {new Date().getFullYear()} · Created with ResuMaster AI
          </p>
      </footer>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes slow-zoom {
          from { transform: scale(1.0); }
          to { transform: scale(1.15); }
        }
        .animate-gradient-shift {
          background-size: 300% 300%;
          animation: gradient-shift 20s ease infinite;
        }
        .animate-slow-zoom {
          animation: slow-zoom 45s infinite alternate ease-in-out;
        }
        .reveal {
          opacity: 0;
          transform: translateY(40px);
          transition: all 1.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .reveal-active {
          opacity: 1 !important;
          transform: translateY(0) !important;
        }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #020617; }
        ::-webkit-scrollbar-thumb { background: #1e1b4b; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #312e81; }
        body { overflow-x: hidden; background: #020617; }
      `}} />
    </div>
  );
};

export default PortfolioPreview;
