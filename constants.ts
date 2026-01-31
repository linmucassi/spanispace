
import React from 'react';
import { Job, VettedStatus, Training, UniversityUpdate } from './types';

export const JOBS: Job[] = [
  {
    id: '1',
    role: 'Junior Frontend Developer',
    company: 'TechFlow Solutions',
    location: 'Johannesburg',
    type: 'Hybrid',
    applyLink: '#',
    expiryDate: '2024-12-15',
    vettedStatus: VettedStatus.VERIFIED,
  },
  {
    id: '2',
    role: 'Cloud Security Intern',
    company: 'Nexus Global',
    location: 'Remote',
    type: 'Remote',
    applyLink: '#',
    expiryDate: '2024-11-30',
    vettedStatus: VettedStatus.SKILLS_ASSESSED,
  },
  {
    id: '3',
    role: 'Data Analyst Trainee',
    company: 'FinCorp Dynamics',
    location: 'Cape Town',
    type: 'On-site',
    applyLink: '#',
    expiryDate: '2024-12-05',
    vettedStatus: VettedStatus.ELITE,
  },
  {
    id: '4',
    role: 'Junior AI Engineer',
    company: 'Synthetix AI',
    location: 'Pretoria',
    type: 'Remote',
    applyLink: '#',
    expiryDate: '2024-12-20',
    vettedStatus: VettedStatus.VERIFIED,
  },
];

export const TRAININGS: Training[] = [
  {
    id: 't1',
    title: 'Modern AI for Devs',
    category: 'Bootcamp',
    date: 'Jan 15, 2025',
    description: 'Master LLMs, RAG, and AI integration in 12 weeks.',
    tags: ['AI', 'Python', 'DevOps'],
  },
  {
    id: 't2',
    title: 'CV Mastery & Interview Prep',
    category: 'Event',
    date: 'Dec 10, 2024',
    description: 'Expert feedback on your resume and live mock interviews.',
    tags: ['Soft Skills', 'Careers'],
  },
  {
    id: 't3',
    title: 'Cloud Foundations (AWS/Azure)',
    category: 'Short Course',
    date: 'Feb 1, 2025',
    description: 'Learn infrastructure as code and cloud deployment.',
    tags: ['Cloud', 'AWS', 'Azure'],
  },
];

export const ACADEMIC_UPDATES: UniversityUpdate[] = [
  { institution: 'University of Cape Town', deadline: '2024-12-31', type: 'Late Application' },
  { institution: 'Wits University', deadline: '2024-11-25', type: 'Learnership' },
  { institution: 'University of Pretoria', deadline: '2025-01-15', type: 'Standard' },
];
