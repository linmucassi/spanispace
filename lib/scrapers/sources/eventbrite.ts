// Eventbrite API — free API key required (private token)
// Register at: https://www.eventbrite.com/platform/api
// Fetches publicly listed career events in South Africa
// Set env: EVENTBRITE_API_KEY

import type { ScrapedEvent, EventType, EventFormat } from '../types'

interface EBVenueAddress {
  localized_address_display?: string
  country?: string
}

interface EBVenue {
  name?: string
  address?: EBVenueAddress
}

interface EBEvent {
  id: string
  name: { text: string }
  description: { text: string }
  url: string
  start: { utc: string }
  end: { utc: string }
  format?: { name: string }
  venue?: EBVenue
  is_online_event: boolean
  capacity?: number
  status: string // 'live' | 'draft' | 'completed' | 'cancelled'
}

interface EBResponse {
  events: EBEvent[]
  pagination: { has_more_items: boolean }
}

const SEARCH_QUERIES = ['career fair', 'job fair', 'networking careers', 'tech careers']

function guessEventType(title: string, description: string): EventType {
  const text = `${title} ${description}`.toLowerCase()
  if (text.includes('hackathon')) return 'hackathon'
  if (text.includes('career fair') || text.includes('job fair') || text.includes('expo')) return 'career_fair'
  if (text.includes('bootcamp')) return 'bootcamp_session'
  if (text.includes('workshop')) return 'workshop'
  if (text.includes('webinar') || text.includes('online talk')) return 'webinar'
  if (text.includes('networking') || text.includes('mixer')) return 'networking'
  return 'other'
}

function guessFormat(event: EBEvent): EventFormat {
  if (event.is_online_event) return 'online'
  if (!event.venue) return 'online'
  return 'in_person'
}

function isoDateOnly(iso: string): string {
  return iso.split('T')[0]
}

export async function fetchEventbriteEvents(): Promise<ScrapedEvent[]> {
  const token = process.env.EVENTBRITE_API_KEY

  if (!token) {
    console.log('[eventbrite] Skipped — EVENTBRITE_API_KEY not set')
    return []
  }

  const results: ScrapedEvent[] = []
  const seen = new Set<string>()

  for (const q of SEARCH_QUERIES) {
    try {
      const url = new URL('https://www.eventbriteapi.com/v3/events/search/')
      url.searchParams.set('q', q)
      url.searchParams.set('location.address', 'South Africa')
      url.searchParams.set('location.within', '500km')
      url.searchParams.set('start_date.keyword', 'this_week')
      url.searchParams.set('expand', 'venue')
      url.searchParams.set('status', 'live')

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) continue

      const data: EBResponse = await res.json()

      for (const e of data.events ?? []) {
        if (!e.url || seen.has(e.id) || e.status !== 'live') continue
        seen.add(e.id)

        const title = e.name?.text?.trim() || ''
        const description = e.description?.text?.trim() || title

        results.push({
          title: title.slice(0, 200),
          description: description.slice(0, 2000),
          event_type: guessEventType(title, description),
          format: guessFormat(e),
          location: e.venue?.address?.localized_address_display || (e.is_online_event ? 'Online' : 'South Africa'),
          start_date: e.start.utc,
          end_date: e.end.utc,
          registration_deadline: isoDateOnly(e.start.utc), // deadline = event start
          is_public: true,
          source: 'eventbrite',
        })
      }

      await new Promise((r) => setTimeout(r, 500))
    } catch {
      // Continue with remaining queries
    }
  }

  return results
}
