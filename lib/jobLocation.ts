// Shared, dependency-free helper: is this job located in South Africa?
// Used server-side (publicJobs ranks SA jobs first) and client-side
// (JobBoard location filter), so it must not import any Supabase code.

const SA_LOCATION_PATTERN = new RegExp(
  [
    'south africa',
    // Provinces
    'gauteng', 'western cape', 'kwazulu', 'eastern cape', 'free state',
    'limpopo', 'mpumalanga', 'north west', 'northern cape',
    // Cities and major towns
    'johannesburg', 'cape town', 'durban', 'pretoria', 'bloemfontein',
    'gqeberha', 'port elizabeth', 'east london', 'polokwane', 'nelspruit',
    'mbombela', 'kimberley', 'pietermaritzburg', 'stellenbosch', 'george',
    'rustenburg', 'welkom', 'vereeniging', 'vanderbijlpark', 'potchefstroom',
    // Metro areas, suburbs and townships
    'sandton', 'midrand', 'centurion', 'randburg', 'roodepoort', 'benoni',
    'boksburg', 'germiston', 'kempton park', 'springs', 'soweto', 'tembisa',
    'alexandra', 'katlehong', 'soshanguve', 'mamelodi', 'khayelitsha',
    'mitchells plain', 'gugulethu', 'milnerton', 'bellville', 'claremont',
    'umlazi', 'umhlanga', 'pinetown', 'chatsworth',
  ].join('|'),
  'i'
)

export function isSouthAfricanJob(location: string | null | undefined): boolean {
  if (!location) return false
  return SA_LOCATION_PATTERN.test(location)
}
