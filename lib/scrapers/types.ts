// Valid job_type values must match the CHECK constraint in schema.sql
// ('Piece Job' and 'Temporary' require supabase/add-informal-jobs.sql —
// db-writer downgrades them gracefully if the migration has not run yet)
export type JobType =
  | 'Remote'
  | 'Hybrid'
  | 'On-site'
  | 'Learnership'
  | 'Internship'
  | 'Contract'
  | 'Full-time'
  | 'Part-time'
  | 'Once-off'
  | 'Piece Job'
  | 'Temporary'

export type EventType =
  | 'webinar'
  | 'workshop'
  | 'hackathon'
  | 'career_fair'
  | 'bootcamp_session'
  | 'networking'
  | 'other'

export type EventFormat = 'online' | 'hybrid' | 'in_person'

export interface ScrapedJob {
  title: string
  description: string
  requirements: string
  location: string
  job_type: JobType
  duration?: string // e.g. '3 months', 'Seasonal' — informal work is often fixed-length
  salary_range: string
  apply_link: string
  expiry_date: string // ISO date YYYY-MM-DD
  poster_name: string
  source: string
}

export interface ScrapedEvent {
  title: string
  description: string
  event_type: EventType
  format: EventFormat
  location: string
  start_date: string // ISO datetime
  end_date: string
  registration_deadline: string // ISO date
  is_public: boolean
  source: string
}

export interface ScraperRunResult {
  source: string
  jobsFound: number
  jobsInserted: number
  jobsRefreshed: number
  eventsFound: number
  eventsInserted: number
  errors: string[]
}
