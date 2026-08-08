# isiZulu review sheet

**Status: awaiting a first language isiZulu speaker. Nothing here has been checked by one.**

Fifty two isiZulu strings were added or changed on 8 August 2026 in
`lib/i18n/zu.ts`, alongside the training rebuild and the visual redesign. They
were written by matching the vocabulary already in that file and by checking
individual terms against online dictionaries. That is not the same thing as a
native check, and this file exists so the real check is a short job rather than
an open ended one.

**How to use this.** Read the isiZulu column. Where it is wrong, write the
correction in the last column. You do not need to touch code, and you do not
need to read the English unless something looks off. Hand it back and the
corrections go straight into `lib/i18n/zu.ts`.

The sections are ordered by where the errors most likely are, so the first
table is worth the most attention and the last one the least.

---

## Start here. Numbers, where the errors most likely are

isiZulu agrees numbers with the noun class, and this is the part written with
the least confidence. Every one of these renders with a real digit substituted
for `{n}`, so a wrong concord shows on screen constantly.

| Key | English | isiZulu as written | Renders as | Correction |
| --- | --- | --- | --- | --- |
| `training.lessonCount` | {n} lessons | izifundo ezingu-{n} | izifundo ezingu-5 | |
| `course.lessons` | {n} lessons | izifundo ezingu-{n} | izifundo ezingu-12 | |
| `training.minutes` | {n} min read | imizuzu engu-{n} yokufunda | imizuzu engu-16 yokufunda | |
| `course.minRead` | {n} min read | imizuzu engu-{n} yokufunda | imizuzu engu-4 yokufunda | |
| `course.min` | {n} min | imizuzu engu-{n} | imizuzu engu-4 | |
| `course.position` | {n} of {total} | {n} kwangu-{total} | 2 kwangu-5 | |
| `course.progressLabel` | Lesson {n} of {total} | Isifundo {n} kwangu-{total} | Isifundo 2 kwangu-5 | |
| `course.roles` | {n} roles | izikhundla ezingu-{n} | izikhundla ezingu-3 | |
| `course.role` | 1 role | isikhundla esi-1 | isikhundla esi-1 | |
| `academic.closesIn` | Closes in {n} days | Ivalwa ezinsukwini ezingu-{n} | Ivalwa ezinsukwini ezingu-7 | |
| `academic.openCount` | {n} still open | ezingu-{n} zisavuliwe | ezingu-9 zisavuliwe | |
| `academic.showClosed` | Show {n} closed deadlines | Bonisa izicelo ezingu-{n} ezivaliwe | Bonisa izicelo ezingu-4 ezivaliwe | |

**One bug this sheet has already caught.** There was a `course.read` key that
took an already formatted English duration, so the course page rendered
"49 min yokufunda", half English and half isiZulu. Nobody spotted it in the
code. Laying the strings out next to each other made it obvious in seconds. It
was removed on 8 August 2026 and the page now uses `course.minRead` with the
raw number, so each language builds its own phrase. That is the argument for
doing this properly rather than assuming the strings are fine.

---

## Phrases written from scratch

| Key | English | isiZulu as written | Correction |
| --- | --- | --- | --- |
| `training.title` | Learn something that pays | Funda Okukhokhelayo | |
| `training.subtitle` | Free courses you can start today. Short lessons, plain words, local examples. | Izifundo zamahhala ongaziqala namuhla. Izifundo ezimfushane, ngolimi olulula, ngezibonelo zalapha ekhaya. | |
| `course.aboutTitle` | A word before you start | Izwi ngaphambi kokuqala | |
| `course.outcomes` | By the end you can | Ekugcineni uzokwazi | |
| `course.keyTerms` | Key words in plain language | Amagama abalulekile ngolimi olulula | |
| `course.activity` | Try this, free | Zama lokhu, mahhala | |
| `course.finished` | You finished {course} | Uqedile {course} | |
| `course.start` | Start lesson 1 | Qala isifundo 1 | |
| `course.howToChoose` | How to choose between them | Ungakhetha kanjani phakathi kwazo | |
| `course.howToRead` | How to read these numbers | Ungazifunda kanjani lezi zibalo | |
| `course.navLabel` | Lesson navigation (screen reader only) | Ukuhamba phakathi kwezifundo | |
| `academic.noneOpen` | Nothing open right now. We check every week, so come back or browse jobs in the meantime. | Ayikho evuliwe njengamanje. Sihlola masonto onke, buya futhi noma ubheke imisebenzi okwamanje. | |
| `academic.closesToday` | Closes today | Ivalwa namuhla | |
| `hero.statJobs` | jobs open now | imisebenzi evulekile manje | |
| `hero.statCourses` | free courses | izifundo zamahhala | |
| `hero.statPrice` | to job seekers, always | kwabafuna umsebenzi, njalo | |
| `jobs.payNotListed` | Pay not listed | Inkokhelo ayishiwongo | |

---

## Single words and short labels

Most of these reuse vocabulary that was already in `zu.ts` before this change,
so they carry the same risk the existing file already carried, no more.

| Key | English | isiZulu as written | Correction |
| --- | --- | --- | --- |
| `nav.university` | University | Inyuvesi | |
| `nav.events` | Events | Imicimbi | |
| `academic.title` | University deadlines | Imikhawulo yenyuvesi | |
| `footer.academicUpdates` | University Deadlines | Imikhawulo Yenyuvesi | |
| `course.back` | Training | Ukuqeqeshwa | |
| `course.free` / `training.filterFree` | Free | Mahhala | |
| `course.paid` / `training.filterPaid` | Paid | Kuyakhokhwa | |
| `training.filterAll` | All | Zonke | |
| `training.filterPartner` | From partners | Kubalingani | |
| `training.partnerCourse` | Partner | Umlingani | |
| `training.filterLabel` | Filter courses | Hlunga izifundo | |
| `training.comingSoon` | Coming soon | Kuyeza maduze | |
| `training.seeAll` | See all courses | Bona zonke izifundo | |
| `training.guidesTitle` | Go deeper | Funda Kabanzi | |
| `training.onProvider` | On {provider} | Ku-{provider} | |
| `course.selfPaced` | Self paced | Uzifundela ngesikhathi sakho | |
| `course.previous` | Previous | Okwedlule | |
| `course.next` | Next | Okulandelayo | |
| `course.browseJobs` | Browse jobs | Bheka imisebenzi | |
| `course.pickTrack` | Pick a career track | Khetha indlela yomsebenzi | |
| `hero.statPriceValue` | Free | Mahhala | |

---

## One term that was already corrected

`course.pickTrack` was first written as **Khetha umkhondo womsebenzi**, taking
`umkhondo`, a track or spoor, as a literal calque of the English "career
track". It was changed to **indlela yomsebenzi**, which dictionary sources
attest as the ordinary phrase for a career path. Still worth a second opinion,
it is a corrected guess rather than a verified idiom.

## What is deliberately not translated

The course content itself, every lesson in `data/academy.ts`, is English only
and unchanged. Only the wrapper around it, the labels and buttons, is
bilingual. Translating 18 000 words of lesson prose is a separate decision and
a much larger job.
