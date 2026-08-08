import type { TrainingLevel } from './lib/training-level';

export type { TrainingLevel };

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
  duration?: string; // e.g. '3 months', 'Weekends' — how long the work lasts
  /**
   * What the job pays, as the employer wrote it: 'R200/day', 'R5000/month',
   * 'Negotiable'. Optional because most scraped listings carry no salary, and
   * a card must never guess or imply a figure that was not published.
   */
  payRange?: string;
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
    | 'Once-off'
    | 'Piece Job'
    | 'Temporary';
}

export interface Training {
  id: string;
  title: string;
  category: 'Bootcamp' | 'Short Course' | 'Event';
  /** Beginner is free, Advanced is paid. See lib/training-level.ts. */
  level: TrainingLevel;
  /** Who runs the course. 'SpaniSpace' for our own, otherwise the partner name. */
  provider: string;
  /** Where the card goes. An internal route, or a full URL for a partner. */
  href: string;
  /**
   * Set when we host the course ourselves and it has lessons on this site, in
   * which case it matches a slug in data/courses.ts and the card can show a
   * real lesson count and reading time instead of a guess.
   */
  courseSlug?: string;
  /**
   * True when a partner hosts and prices the course. We show their name and
   * send candidates to them, and we never quote a price we do not set.
   */
  external?: boolean;
  /** Omit for self paced courses that a candidate can start any day. */
  date?: string;
  description: string;
  tags: string[];
}

export interface UniversityUpdate {
  institution: string;
  deadline: string;
  type: 'Late Application' | 'Standard' | 'Learnership';
  applyLink?: string;
  notes?: string;
  logo?: string;
}
