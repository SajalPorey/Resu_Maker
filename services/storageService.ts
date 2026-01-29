
import { SavedResume, ResumeData, AIAnalysis } from '../types';

const STORAGE_KEY = 'resumaster_db';

export const storageService = {
  saveResume: (data: ResumeData, analysis: AIAnalysis | null): SavedResume => {
    const saved = storageService.getAll();
    const newEntry: SavedResume = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      data,
      analysis
    };
    
    saved.unshift(newEntry);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    return newEntry;
  },

  getAll: (): SavedResume[] => {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  },

  getById: (id: string): SavedResume | undefined => {
    return storageService.getAll().find(r => r.id === id);
  },

  delete: (id: string) => {
    const saved = storageService.getAll().filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  }
};
