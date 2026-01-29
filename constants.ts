
import { ResumeData } from './types';

export const INITIAL_RESUME_DATA: ResumeData = {
  fullName: '',
  email: '',
  phone: '',
  location: '',
  targetRole: 'Frontend Engineer',
  summary: '',
  skills: [],
  experience: [{ company: '', role: '', duration: '', description: '' }],
  education: [{ school: '', degree: '', year: '' }],
  projects: [{ name: '', technologies: '', description: '' }],
};

export const TARGET_ROLES = [
  'Frontend Engineer',
  'Backend Engineer',
  'Fullstack Developer',
  'Data Scientist',
  'Product Manager',
  'UX/UI Designer',
  'DevOps Engineer',
  'Other'
];

export const MOCK_RESUME: ResumeData = {
  fullName: 'Alex Rivera',
  email: 'alex.rivera@example.com',
  phone: '+1 (555) 000-1111',
  location: 'San Francisco, CA',
  targetRole: 'Frontend Engineer',
  summary: 'Experienced developer passionate about building scalable web applications with high performance and accessibility.',
  skills: ['React', 'TypeScript', 'Tailwind CSS', 'Next.js', 'Node.js'],
  experience: [
    {
      company: 'TechFlow Solutions',
      role: 'Senior Developer',
      duration: '2021 - Present',
      description: 'Led the development of the primary customer dashboard using React and Redux. Reduced load times by 40% through code-splitting and optimization.'
    }
  ],
  education: [
    {
      school: 'University of California, Berkeley',
      degree: 'B.S. in Computer Science',
      year: '2019'
    }
  ],
  projects: [
    {
      name: 'ResuMaster AI',
      technologies: 'React, Gemini API, Tailwind',
      description: 'An AI-driven platform to help job seekers build optimized resumes and portfolios.'
    }
  ]
};
