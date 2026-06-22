
export enum VettedStatus {
  VERIFIED = 'Spanispace Verified',
  SKILLS_ASSESSED = 'Skills Assessed',
  ELITE = 'Elite Candidate Path'
}

export interface Job {
  id: string;
  role: string;
  company: string;
  location: string;
  applyLink: string;
  expiryDate: string;
  vettedStatus: VettedStatus;
  type:
    | 'Remote'
    | 'Hybrid'
    | 'On-site'
    | 'Learnership'
    | 'Internship'
    | 'Hybrid & Remote possible'
    | 'Learnership (Hybrid)'
    | 'Learnership (On-site)'
    | 'Contract'
    | 'Full-time'
    | 'Part-time'
    | 'Once-off';
}

export interface Training {
  id: string;
  title: string;
  category: 'Bootcamp' | 'Short Course' | 'Event';
  date: string;
  description: string;
  tags: string[];
}

export interface UniversityUpdate {
  institution: string;
  deadline: string;
  type: 'Late Application' | 'Standard' | 'Learnership';
  applyLink?: string;
  notes?: string;
}
