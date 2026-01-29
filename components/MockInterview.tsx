
import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { ResumeData } from '../types';

interface Props {
  resume: ResumeData;
  onClose: () => void;
}

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

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

const MockInterview: React.FC<Props> = ({ resume, onClose }) => {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [transcript, setTranscript] = useState<{role: 'user' | 'ai', text: string}[]>([]);
  const [timer, setTimer] = useState(0);
  
  const sessionRef = useRef<any>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const timerIntervalRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const terminateSession = () => {
    if (sessionRef.current) {
      try { sessionRef.current.close(); } catch (e) {}
      sessionRef.current = null;
    }
    if (inputAudioContextRef.current) {
      try { inputAudioContextRef.current.close(); } catch (e) {}
      inputAudioContextRef.current = null;
    }
    if (outputAudioContextRef.current) {
      try { outputAudioContextRef.current.close(); } catch (e) {}
      outputAudioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setStatus('idle');
  };

  const startInterview = async () => {
    terminateSession();
    setStatus('connecting');
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: async () => {
            setStatus('connected');
            timerIntervalRef.current = setInterval(() => setTimer(prev => prev + 1), 1000);
            
            try {
              const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
              streamRef.current = stream;
              const source = inputAudioContextRef.current!.createMediaStreamSource(stream);
              const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
              
              scriptProcessor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                const int16 = new Int16Array(inputData.length);
                for (let i = 0; i < inputData.length; i++) {
                  int16[i] = inputData[i] * 32768;
                }
                
                sessionPromise.then((session) => {
                  if (session) {
                    session.sendRealtimeInput({ 
                      media: { 
                        data: encode(new Uint8Array(int16.buffer)), 
                        mimeType: 'audio/pcm;rate=16000' 
                      } 
                    });
                  }
                }).catch(() => {});
              };
              source.connect(scriptProcessor);
              scriptProcessor.connect(inputAudioContextRef.current!.destination);
            } catch (err) {
              console.error("Microphone failed", err);
              setStatus('error');
            }
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.outputTranscription) {
              const text = message.serverContent.outputTranscription.text;
              if (text) setTranscript(prev => [...prev, {role: 'ai', text}]);
            }
            
            const audioBase64 = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioBase64 && outputAudioContextRef.current) {
              const audioData = decode(audioBase64);
              const audioBuffer = await decodeAudioData(
                audioData,
                outputAudioContextRef.current,
                24000,
                1
              );

              const source = outputAudioContextRef.current.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputAudioContextRef.current.destination);
              
              const currentTime = outputAudioContextRef.current.currentTime;
              const startAt = Math.max(nextStartTimeRef.current, currentTime);
              source.start(startAt);
              nextStartTimeRef.current = startAt + audioBuffer.duration;
            }

            if (message.serverContent?.interrupted) {
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e) => {
            console.error("API error", e);
            setStatus('error');
          },
          onclose: () => {
            setStatus('idle');
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          outputAudioTranscription: {},
          systemInstruction: `You are the AI Recruiter for ${resume.fullName}. Ground your talk in this resume: ${JSON.stringify(resume)}. Be sharp, professional, and friendly. Ask technical and behavioral questions.`
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (error) {
      console.error("Session failed:", error);
      setStatus('error');
    }
  };

  const handleClose = () => {
    terminateSession();
    onClose();
  };

  useEffect(() => {
    return () => terminateSession();
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-[200] bg-slate-950/98 backdrop-blur-3xl flex flex-col items-center justify-center p-6 text-white font-['Inter']">
      {/* Absolute Emergency Exit */}
      <button 
        onClick={handleClose}
        className="absolute top-10 right-10 p-5 bg-white/5 hover:bg-red-500/20 rounded-full text-slate-400 hover:text-red-500 transition-all z-[210] border border-white/10 group shadow-2xl"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 group-hover:rotate-90 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="w-full max-w-5xl text-center space-y-12">
        <div className="flex flex-col items-center gap-4">
           <div className="flex items-center gap-3 bg-white/5 px-6 py-2 rounded-full border border-white/10">
              <div className={`w-3 h-3 rounded-full ${status === 'connected' ? 'bg-red-500 animate-pulse' : 'bg-slate-600'}`}></div>
              <h2 className="text-[10px] font-black tracking-[0.5em] uppercase text-slate-400">Secure Live Link</h2>
              {status === 'connected' && (
                <span className="text-white font-black text-xs ml-2 tabular-nums">{formatTime(timer)}</span>
              )}
           </div>
        </div>
        
        {status === 'idle' && (
          <div className="space-y-12 py-24 bg-white/5 border border-white/10 rounded-[5rem] p-16 shadow-inner relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            <div className="flex justify-center -space-x-6 mb-8 relative">
                <div className="w-24 h-24 bg-indigo-600 rounded-[2rem] border-4 border-slate-950 flex items-center justify-center text-4xl shadow-2xl">👤</div>
                <div className="w-24 h-24 bg-indigo-500 rounded-[2rem] border-4 border-slate-950 flex items-center justify-center text-4xl shadow-2xl animate-bounce">🤖</div>
            </div>
            <h3 className="text-5xl font-black tracking-tight text-white mb-6">Start AI Interview</h3>
            <p className="text-2xl text-slate-400 max-w-2xl mx-auto leading-relaxed font-light">Prepare with a high-stakes technical screening powered by Gemini Live.</p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center relative z-10">
              <button 
                onClick={startInterview} 
                className="px-20 py-8 bg-white text-slate-950 rounded-[2.5rem] font-black text-2xl hover:bg-indigo-50 transition-all shadow-white/10 shadow-2xl hover:scale-105 active:scale-95"
              >
                Join Meeting
              </button>
              <button onClick={onClose} className="px-12 py-8 bg-transparent text-slate-500 hover:text-white rounded-[2.5rem] font-black text-lg transition-all border border-white/5 hover:border-white/20">
                Exit Console
              </button>
            </div>
          </div>
        )}

        {status === 'connecting' && (
          <div className="flex flex-col items-center gap-10 py-32">
            <div className="relative w-24 h-24">
              <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full animate-pulse"></div>
              <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="font-black text-indigo-400 uppercase tracking-[0.8em] animate-pulse text-xs">Establishing Neural Bridge...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-10 py-24 bg-red-500/5 border border-red-500/10 rounded-[5rem] p-20 text-center">
            <h3 className="text-4xl font-black text-red-500 tracking-tighter">Bridge Error</h3>
            <p className="text-slate-400 text-xl max-w-lg mx-auto mb-8">Audio link failed. Please refresh and check your mic permissions.</p>
            <div className="flex gap-6 justify-center">
               <button onClick={() => setStatus('idle')} className="px-12 py-5 bg-white/10 rounded-3xl font-black text-sm uppercase tracking-widest hover:bg-white/20 transition-all">Retry</button>
               <button onClick={handleClose} className="px-12 py-5 text-slate-500 font-black text-sm uppercase tracking-widest hover:text-white transition-all">Exit</button>
            </div>
          </div>
        )}

        {status === 'connected' && (
          <div className="space-y-12 w-full animate-in fade-in zoom-in-95 duration-1000">
            {/* Immersive Waveform */}
            <div className="flex justify-center gap-4 h-56 items-center">
                {[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20].map(i => (
                    <div key={i} className="w-2.5 bg-indigo-500 rounded-full animate-pulse transition-all duration-300" 
                        style={{
                            height: `${20 + Math.random()*80}%`, 
                            opacity: 0.2 + (Math.random()*0.8),
                            animationDuration: `${0.2 + Math.random()*0.8}s`
                        }}
                    ></div>
                ))}
            </div>
            
            {/* Transcript Console */}
            <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[4rem] p-12 h-[450px] overflow-y-auto text-left space-y-10 no-scrollbar shadow-3xl relative ring-1 ring-white/10">
                {transcript.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                        <p className="text-slate-500 font-black uppercase tracking-[0.4em] text-xs">Waiting for opening statement...</p>
                    </div>
                ) : (
                    transcript.map((t, i) => (
                        <div key={i} className={`flex flex-col ${t.role === 'ai' ? 'items-start' : 'items-end'} animate-in slide-in-from-bottom-4 duration-500`}>
                            <span className={`text-[10px] font-black uppercase tracking-widest mb-2 ${t.role === 'ai' ? 'text-indigo-400' : 'text-slate-500'}`}>
                                {t.role === 'ai' ? 'AI INTERVIEWER' : 'YOU'}
                            </span>
                            <div className={`max-w-[75%] p-8 rounded-[2.5rem] text-xl font-medium leading-relaxed tracking-tight ${t.role === 'ai' ? 'bg-indigo-600 text-white rounded-tl-none shadow-2xl' : 'bg-white/5 text-slate-300 rounded-tr-none border border-white/10'}`}>
                                {t.text}
                            </div>
                        </div>
                    ))
                )}
            </div>
            
            {/* Big Red End Meeting Button */}
            <div className="flex flex-col items-center gap-6 pt-10">
                <button 
                    onClick={handleClose} 
                    className="group relative w-32 h-32 bg-red-600 text-white rounded-full flex flex-col items-center justify-center transition-all duration-500 shadow-2xl hover:shadow-red-500/40 hover:scale-110 active:scale-95 border-8 border-slate-950"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span className="text-[10px] font-black uppercase tracking-widest">End Meeting</span>
                </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MockInterview;
