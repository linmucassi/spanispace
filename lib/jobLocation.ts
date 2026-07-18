// Shared, dependency-free helper: is this job located in South Africa?
// Used server-side (publicJobs ranks SA jobs first) and client-side
// (JobBoard location filter), so it must not import any Supabase code.
//
// Three-step classification, because several SA town names are also famous
// non-SA places (East London, George, Kimberley, Springs, North West...):
//   1. an unambiguous SA token anywhere → South African
//   2. a foreign-country marker → not South African
//   3. otherwise an ambiguous SA town name → South African

const SA_UNAMBIGUOUS = new RegExp(
  '\\b(?:' +
    [
      'south africa',
      // Provinces (except the ambiguous 'north west')
      'gauteng', 'western cape', 'kwazulu', 'eastern cape', 'free state',
      'limpopo', 'mpumalanga', 'northern cape',
      // Cities and major towns
      'johannesburg', 'cape town', 'durban', 'pretoria', 'bloemfontein',
      'gqeberha', 'port elizabeth', 'polokwane', 'nelspruit', 'mbombela',
      'pietermaritzburg', 'stellenbosch', 'rustenburg', 'welkom',
      'vereeniging', 'vanderbijlpark', 'potchefstroom',
      // Metro areas, suburbs and townships
      'sandton', 'midrand', 'centurion', 'randburg', 'roodepoort', 'benoni',
      'boksburg', 'germiston', 'kempton park', 'soweto', 'tembisa',
      'katlehong', 'soshanguve', 'mamelodi', 'khayelitsha',
      'mitchells plain', 'gugulethu', 'milnerton', 'bellville',
      'umlazi', 'umhlanga', 'pinetown',
    ].join('|') +
    ')\\b',
  'i'
)

// Town names that exist in SA but also famously elsewhere — only trusted
// when no foreign marker is present.
const SA_AMBIGUOUS = new RegExp(
  '\\b(?:' +
    [
      'east london', 'george', 'kimberley', 'claremont', 'springs',
      'north west', 'alexandra', 'chatsworth',
    ].join('|') +
    ')\\b',
  'i'
)

const NON_SA_MARKER =
  /\b(?:uk|u\.k\.|united kingdom|england|scotland|wales|britain|ireland|usa|u\.s\.a?\.?|united states|america|canada|australia|new zealand|europe|emea|india|germany|netherlands|france|spain|portugal|italy|malaysia|singapore|philippines|nigeria|kenya|ghana|egypt|uae|dubai|worldwide|global|anywhere)\b/i

export function isSouthAfricanJob(location: string | null | undefined): boolean {
  if (!location) return false
  if (SA_UNAMBIGUOUS.test(location)) return true
  if (NON_SA_MARKER.test(location)) return false
  return SA_AMBIGUOUS.test(location)
}
