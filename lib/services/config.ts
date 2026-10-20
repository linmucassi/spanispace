// Spanispace Services constants. Spec: docs/project-details.md §7.

// Bump when the Service Provider Agreement text changes -- providers whose
// terms_version differs must re-accept.
export const SERVICE_TERMS_VERSION = '2026-10-20';

// Flat R10 per booking, always paid online (Linda, 20 Oct 2026). Copied onto
// each booking at offer acceptance (S4) so a later change never rewrites
// past bookings.
export const SERVICE_BOOKING_FEE_CENTS = 1000;

export const POLICE_CLEARANCE_VALID_MONTHS = 12;

export const MIN_PROVIDER_AGE = 18;

export type PricingUnit =
  | 'hour' | 'day' | 'job' | 'm2' | 'room' | 'load'
  | 'kg' | 'item' | 'visit' | 'callout' | 'point' | 'metre';

export const UNIT_LABELS: Record<PricingUnit, string> = {
  hour: 'per hour',
  day: 'per day',
  job: 'per job',
  m2: 'per m²',
  room: 'per room',
  load: 'per load',
  kg: 'per kg',
  item: 'per item',
  visit: 'per visit',
  callout: 'call-out fee',
  point: 'per point',
  metre: 'per metre',
};

export type PaymentMethods = 'cash' | 'online' | 'cash_or_online';

export const PAYMENT_METHOD_LABELS: Record<PaymentMethods, string> = {
  cash: 'Cash only',
  online: 'Online only',
  cash_or_online: 'Cash or online',
};

export type ProviderStatus = 'draft' | 'pending' | 'verified' | 'rejected' | 'suspended';

export type ProviderDocType =
  | 'id_document' | 'passport' | 'work_permit' | 'selfie'
  | 'police_clearance' | 'proof_of_address' | 'trade_certificate';

export const PROVIDER_DOC_LABELS: Record<ProviderDocType, string> = {
  id_document: 'SA ID document / smart ID card',
  passport: 'Passport',
  work_permit: 'Work permit / visa',
  selfie: 'Selfie holding your ID',
  police_clearance: 'SAPS Police Clearance Certificate',
  proof_of_address: 'Proof of address (not older than 3 months)',
  trade_certificate: 'Trade certificate / registration',
};

export const PROVINCES = [
  'Eastern Cape', 'Free State', 'Gauteng', 'KwaZulu-Natal', 'Limpopo',
  'Mpumalanga', 'North West', 'Northern Cape', 'Western Cape',
];

export const WEEKDAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
export type Weekday = (typeof WEEKDAYS)[number];
export const WEEKDAY_LABELS: Record<Weekday, string> = {
  mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun',
};

export function formatRand(cents: number): string {
  return `R${(cents / 100).toLocaleString('en-ZA', { minimumFractionDigits: cents % 100 ? 2 : 0, maximumFractionDigits: 2 })}`;
}

// Which identity documents a submission needs. SA ID holders: ID; everyone
// else: passport + work permit. Everyone: selfie, police clearance, proof
// of address. Trade certificates are per regulated category -- checked
// separately.
export function requiredDocTypes(idKind: 'sa_id' | 'passport' | null): ProviderDocType[] {
  const identity: ProviderDocType[] = idKind === 'passport' ? ['passport', 'work_permit'] : ['id_document'];
  return [...identity, 'selfie', 'police_clearance', 'proof_of_address'];
}
