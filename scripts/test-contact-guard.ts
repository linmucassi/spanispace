// Run: npx tsx scripts/test-contact-guard.ts
// Exits non-zero if any case fails. See lib/services/contactGuard.ts.

import { scanText, scanWithHistory, type ContactReason } from '../lib/services/contactGuard';
import { parseSaId, ageOn } from '../lib/services/saId';

// Every one of these must be blocked, with at least the listed reason.
const MUST_BLOCK: [string, ContactReason][] = [
  // Phone numbers, plain and formatted
  ['0821234567', 'phone'],
  ['082 123 4567', 'phone'],
  ['082-123-4567', 'phone'],
  ['(082) 123.4567', 'phone'],
  ['+27 82 123 4567', 'phone'],
  ['27821234567', 'phone'],
  ['+27821234567', 'phone'],
  ['011 234 5678', 'phone'],
  ['0 8 2 1 2 3 4 5 6 7', 'phone'],
  ['08 21 23 45 67', 'phone'],
  ['082/123/4567', 'phone'],
  ['082_123_4567', 'phone'],
  ['my no is 5 082 123 4567', 'phone'],
  ['90821234567', 'phone'],
  // Number words and look-alikes
  ['zero eight two one two three four five six seven', 'phone'],
  ['oh eight two one two three four five six seven', 'phone'],
  ['zero eight two one double two three four five six', 'phone'],
  ['o82 l23 4567', 'phone'],
  ['O82l234567', 'phone'],
  ['iqanda isishiyagalombili kubili kunye kubili kuthathu kune kuhlanu isithupha isikhombisa', 'phone'],
  ['０８２１２３４５６７', 'phone'],
  // Emails
  ['thandi@gmail.com', 'email'],
  ['thandi.m@outlook.co.za', 'email'],
  ['thandi at gmail dot com', 'email'],
  ['thandi [at] gmail [dot] com', 'email'],
  ['thandi(at)yahoo(dot)com', 'email'],
  ['thandi @ gmail', 'email'],
  ['thandi at gmail', 'email'],
  // Links
  ['https://thandipaints.co.za', 'link'],
  ['www.thandipaints.com', 'link'],
  ['thandipaints.co.za', 'link'],
  ['thandipaints . com', 'link'],
  ['wa.me/27821234567', 'link'],
  ['linktr.ee/thandi', 'link'],
  ['thandipaints dot com', 'link'],
  // Handles and apps
  ['find me @thandi_paints', 'handle'],
  ['message me on WhatsApp', 'off_platform'],
  ['Whats App me', 'off_platform'],
  ['I am on Facebook as Thandi Paints', 'off_platform'],
  ['add me on insta', 'off_platform'],
  ['ping me on signal', 'off_platform'],
  // Off-platform asks
  ['call me tomorrow', 'off_platform'],
  ['send me your number', 'off_platform'],
  ['what is your cell?', 'off_platform'],
  ['drop your digits', 'off_platform'],
  ['let us deal directly', 'off_platform'],
  ['pay me directly and skip the fee', 'off_platform'],
  ['we can do this outside the app', 'off_platform'],
  ['book me direct next time', 'off_platform'],
  ['ngishayele kusasa', 'off_platform'],
  ['nginike inombolo yakho', 'off_platform'],
];

// Ordinary job chat and profile text: none of these may be blocked.
const MUST_ALLOW: string[] = [
  'Lounge and 2 bedrooms, walls only, paint supplied.',
  'About 35 m2 in total, 2 coats.',
  'My rate is R45 per m2, minimum R500.',
  'Prices: 1500 2000 2500 3000 depending on size',
  'R1 500 for the lounge, R1 200 per bedroom',
  'R 12 500 for the whole house',
  'Can you start on 2026/10/20 and finish 2026/10/22?',
  'Available 20/10/2026 - 22/10/2026',
  'I can come at 08:00 and work until 17:00',
  'Meet @8am at the gate',
  'Job done in 3 days. Online payment is fine.',
  'Cash on the day is fine with me.',
  'I travel to your address within 20 km.',
  '10 years experience, references available on request.',
  'Laundry R80 per load, ironing R10 per item.',
  'I have 3 kids so I understand childminding.',
  'Unit 12, 4 rooms, 2 bathrooms, 1 kitchen.',
  'One room needs a second coat, the other is fine.',
  'Can I see a photo of the wall first?',
  'I will bring my own ladder and tools.',
  'Oh nice, that works for me.',
  'Ngiyabonga, ngizofika ngo-8.',
];

let failures = 0;

for (const [text, reason] of MUST_BLOCK) {
  const result = scanText(text);
  if (!result.blocked || !result.reasons.includes(reason)) {
    failures++;
    console.error(`FAIL (should block as ${reason}): ${JSON.stringify(text)} -> ${JSON.stringify(result.reasons)}`);
  }
}

for (const text of MUST_ALLOW) {
  const result = scanText(text);
  if (result.blocked) {
    failures++;
    console.error(`FAIL (false positive ${JSON.stringify(result.reasons)}): ${JSON.stringify(text)}`);
  }
}

// Split across messages: previous messages (oldest first) + the new one.
const HISTORY_BLOCK: [string[], string][] = [
  [['my no is 082'], '123 4567'],
  [['082', '123'], '4567'],
  [['zero eight two', 'one two three'], 'four five six seven'],
  [['thandi'], '@gmail.com'],
];
const HISTORY_ALLOW: [string[], string][] = [
  [['Price is R350 for the room'], '2 rooms then'],
  [['Can you come on 2026/10/20?'], 'Or 2026/10/22 works too'],
  [['call me when you arrive'], 'I will be at the gate'], // old phrase must not keep blocking
  [['Lounge is 35 m2', 'bedrooms 12 m2 each'], 'so about 59 m2 total'],
];
for (const [previous, body] of HISTORY_BLOCK) {
  if (scanWithHistory(previous, body).length === 0) {
    failures++;
    console.error(`FAIL (history should block): ${JSON.stringify(previous)} + ${JSON.stringify(body)}`);
  }
}
for (const [previous, body] of HISTORY_ALLOW) {
  const reasons = scanWithHistory(previous, body);
  if (reasons.length > 0) {
    failures++;
    console.error(`FAIL (history false positive ${JSON.stringify(reasons)}): ${JSON.stringify(previous)} + ${JSON.stringify(body)}`);
  }
}

// SA ID parsing. 8001015009087 is the widely used valid sample number.
const today = new Date(2026, 9, 20);
const sample = parseSaId('8001015009087', today);
if (!sample.ok || sample.dateOfBirth !== '1980-01-01') {
  failures++;
  console.error('FAIL: valid sample SA ID did not parse to 1980-01-01', sample);
}
if (parseSaId('8001015009088', today).ok) {
  failures++;
  console.error('FAIL: bad Luhn check digit accepted');
}
if (parseSaId('8013015009087', today).ok) {
  failures++;
  console.error('FAIL: impossible month accepted');
}
if (ageOn('2008-10-21', today) !== 17 || ageOn('2008-10-20', today) !== 18) {
  failures++;
  console.error('FAIL: ageOn boundary');
}

const total = MUST_BLOCK.length + MUST_ALLOW.length + HISTORY_BLOCK.length + HISTORY_ALLOW.length + 4;
if (failures > 0) {
  console.error(`\n${failures} of ${total} checks failed.`);
  process.exit(1);
}
console.log(`All ${total} checks passed (${MUST_BLOCK.length} must-block, ${MUST_ALLOW.length} must-allow, ${HISTORY_BLOCK.length + HISTORY_ALLOW.length} split-message, 4 SA ID).`);
