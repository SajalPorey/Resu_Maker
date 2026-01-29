
export type TargetRole = 
  | 'Frontend Engineer' 
  | 'Backend Engineer' 
  | 'Fullstack Developer' 
  | 'Data Scientist' 
  | 'Product Manager' 
  | 'UX/UI Designer' 
  | 'DevOps Engineer' 
  | 'Other';

export interface Education {
  school: string;
  degree: string;
  year: string;
}

export interface Experience {
  company: string;
  role: string;
  duration: string;
  description: string;
  metrics?: string;
  evidenceLink?: string;
}

export interface Project {
  name: string;
  technologies: string;
  description: string;
  link?: string;
  metrics?: string;
}

export interface ResumeData {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  targetRole: TargetRole;
  summary: string;
  skills: string[];
  experience: Experience[];
  education: Education[];
  projects: Project[];
}

export interface AIAnalysis {
  summary: string;
  missingSkills: string[];
  optimizedProjects: Project[];
  optimizedExperience: Experience[];
  improvementSuggestions: string[];
  proofQuestions: { id: string; question: string; context: string }[];
  atsScore: number;
  topKeywords: string[];
  actionableChecklist: { task: string; priority: 'High' | 'Medium' | 'Low' }[];
  jdMatch?: {
    matchScore: number;
    missingKeywords: string[];
    tailoringAdvice: string[];
    compatibilityLevel: string;
  };
}

export interface PortfolioData {
  aboutMe: string;
  tagline: string;
  heroText: string;
  techStacks: { category: string; skills: string[] }[];
  brandImageUrl?: string;
  pitchAudioData?: string;
}

// Added missing SavedResume interface
export interface SavedResume {
  id: string;
  timestamp: number;
  data: ResumeData;
  analysis: AIAnalysis | null;
}

// Added missing LiveJob interface for search grounding
export interface LiveJob {
  title: string;
  company: string;
  location: string;
  url: string;
}

export type AppView = 'landing' | 'builder' | 'preview' | 'portfolio' | 'library' | 'interview';
