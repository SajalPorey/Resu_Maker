
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { ResumeData, AIAnalysis, PortfolioData, LiveJob } from "../types";

const ANALYSIS_MODEL = 'gemini-3-flash-preview';
const IMAGE_MODEL = 'gemini-2.5-flash-image';
const TTS_MODEL = 'gemini-2.5-flash-preview-tts';

export const enhanceResume = async (data: ResumeData, jobDescription?: string): Promise<AIAnalysis> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Rewrite and optimize this resume for a ${data.targetRole}.
  Resume Data: ${JSON.stringify(data)}
  ${jobDescription ? `Tailor it specifically to this Job Description: ${jobDescription}` : 'Optimize for high impact and ATS compatibility.'}`;

  try {
    const response = await ai.models.generateContent({
      model: ANALYSIS_MODEL,
      contents: prompt,
      config: {
        systemInstruction: "You are an Elite Career Strategist. Return ONLY a JSON object. Be concise but impactful. Use the STAR method for bullet points.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            atsScore: { type: Type.INTEGER },
            topKeywords: { type: Type.ARRAY, items: { type: Type.STRING } },
            missingSkills: { type: Type.ARRAY, items: { type: Type.STRING } },
            optimizedProjects: { 
              type: Type.ARRAY, 
              items: { 
                type: Type.OBJECT, 
                properties: { 
                  name: { type: Type.STRING }, 
                  technologies: { type: Type.STRING }, 
                  description: { type: Type.STRING }, 
                  metrics: { type: Type.STRING } 
                } 
              } 
            },
            optimizedExperience: { 
              type: Type.ARRAY, 
              items: { 
                type: Type.OBJECT, 
                properties: { 
                  company: { type: Type.STRING }, 
                  role: { type: Type.STRING }, 
                  duration: { type: Type.STRING }, 
                  description: { type: Type.STRING }, 
                  metrics: { type: Type.STRING } 
                } 
              } 
            },
            improvementSuggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
            actionableChecklist: { 
              type: Type.ARRAY, 
              items: { 
                type: Type.OBJECT, 
                properties: { 
                  task: { type: Type.STRING }, 
                  priority: { type: Type.STRING } 
                } 
              } 
            },
            proofQuestions: { 
              type: Type.ARRAY, 
              items: { 
                type: Type.OBJECT, 
                properties: { 
                  id: { type: Type.STRING }, 
                  question: { type: Type.STRING }, 
                  context: { type: Type.STRING } 
                } 
              } 
            },
            jdMatch: { 
              type: Type.OBJECT, 
              properties: { 
                matchScore: { type: Type.INTEGER }, 
                missingKeywords: { type: Type.ARRAY, items: { type: Type.STRING } }, 
                tailoringAdvice: { type: Type.ARRAY, items: { type: Type.STRING } }, 
                compatibilityLevel: { type: Type.STRING } 
              } 
            }
          },
          required: ["summary", "atsScore", "topKeywords", "missingSkills", "optimizedProjects", "optimizedExperience", "actionableChecklist", "proofQuestions"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("API Error:", error);
    throw new Error("Analysis failed. Please try again.");
  }
};

export const generateBrandImage = async (role: string, name: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: IMAGE_MODEL,
      contents: { parts: [{ text: `A ultra-premium cinematic abstract 3D artwork for a ${role} portfolio named ${name}. High-end minimal luxury aesthetic, deep indigo, charcoal, and brushed silver palette. 8k resolution, ray-traced lighting.` }] },
      config: { 
        imageConfig: { 
          aspectRatio: "16:9"
        } 
      }
    });
    
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    return '';
  } catch (e) {
    return '';
  }
};

export const generateElevatorPitch = async (summary: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: TTS_MODEL,
      contents: [{ parts: [{ text: `Say with extreme professional confidence: ${summary}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } }
      }
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || '';
  } catch (e) {
    return '';
  }
};

export const generatePortfolioContent = async (data: ResumeData): Promise<PortfolioData> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: ANALYSIS_MODEL,
      contents: `Create high-impact cinematic portfolio text for ${data.fullName}, a ${data.targetRole}. Based on: ${data.summary}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tagline: { type: Type.STRING },
            heroText: { type: Type.STRING },
            aboutMe: { type: Type.STRING },
            techStacks: { 
              type: Type.ARRAY, 
              items: { 
                type: Type.OBJECT, 
                properties: { 
                  category: { type: Type.STRING }, 
                  skills: { type: Type.ARRAY, items: { type: Type.STRING } } 
                } 
              } 
            }
          },
          required: ["tagline", "heroText", "aboutMe", "techStacks"]
        }
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (e) {
    throw new Error("Failed to build portfolio content.");
  }
};

export const findLiveJobs = async (role: string, location: string): Promise<LiveJob[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: ANALYSIS_MODEL,
      contents: `Search for 5 high-paying ${role} jobs in ${location} posted in the last 7 days.`,
      config: { tools: [{ googleSearch: {} }] },
    });
    
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    return chunks.filter(c => c.web).map(c => ({
      title: c.web!.title || 'Recent Opening',
      company: "Found via Google Search",
      location: location,
      url: c.web!.uri || "#"
    })).slice(0, 5);
  } catch (error) {
    return [];
  }
};

export const generateContactReply = async (candidateName: string, visitorName: string, visitorMessage: string, resumeSummary: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: ANALYSIS_MODEL,
      contents: `Visitor: ${visitorName}\nMessage: ${visitorMessage}`,
      config: {
        systemInstruction: `You are ${candidateName}. Reply as yourself. Keep it under 2 sentences. Professional and warm. Resume context: ${resumeSummary}`
      }
    });
    return response.text?.trim() || "Thanks for reaching out!";
  } catch (error) {
    return "Thanks for your message! I'll get back to you shortly.";
  }
};
