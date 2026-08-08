# isiZulu review sheet

**Status: grammar checked against sources, not yet checked by a first language speaker.**

Fifty two isiZulu strings were added or changed on 8 August 2026 in
`lib/i18n/zu.ts`, alongside the training rebuild and the visual redesign. They
were written by matching the vocabulary already in that file. Since then two
passes have been done: individual terms checked against dictionaries, and the
number agreement checked against the Wiktionary Zulu concord appendix, which
found and fixed four wrong forms. That is a grammar check, not a native check.
A source can confirm a concord is legal. It cannot tell you the phrase sounds
like something a person would actually say. This file exists so that last step
is a short job rather than an open ended one.

**How to use this.** Read the isiZulu column. Where it is wrong, write the
correction in the last column. You do not need to touch code, and you do not
need to read the English unless something looks off. Hand it back and the
corrections go straight into `lib/i18n/zu.ts`.

The sections are ordered by where the errors most likely are, so the first
table is worth the most attention and the last one the least.

---

## Numbers. Checked against a concord table, but still worth your eye

isiZulu agrees numbers with the noun class. These were written with the least
confidence, so on 8 August they were checked against the Wiktionary Zulu
concord appendix and an attested example, and four were corrected. The concord
column below shows the working, so you can see whether the reasoning holds
rather than just whether the string looks right.

The rule applied: relative concord for the noun's class, plus the copulative
`ngu-`. Class 4 `imi-` takes `e-`, class 7 `isi-` takes `esi-`, classes 8 `izi-`
and 10 `izin-` both take `ezi-`. Attested example, `izinsuku ezingu-8`, 8 days.

| Key | English | isiZulu as written | Noun and class | Correction |
| --- | --- | --- | --- | --- |
| `training.lessonCount` | {n} lessons | izifundo ezingu-{n} | izifundo, cl 8 → ezi- | |
| `course.lessons` | {n} lessons | izifundo ezingu-{n} | izifundo, cl 8 → ezi- | |
| `training.minutes` | {n} min read | imizuzu engu-{n} yokufunda | imizuzu, cl 4 → e- | |
| `course.minRead` | {n} min read | imizuzu engu-{n} yokufunda | imizuzu, cl 4 → e- | |
| `course.min` | {n} min | imizuzu engu-{n} | imizuzu, cl 4 → e- | |
| `course.roles` | {n} roles | izikhundla ezingu-{n} | izikhundla, cl 8 → ezi- | |
| `academic.openCount` | {n} still open | ezingu-{n} zisavuliwe | izicelo, cl 8 → ezi- | |
| `academic.showClosed` | Show {n} closed deadlines | Bonisa izicelo ezingu-{n} ezivaliwe | izicelo, cl 8 → ezi- | |

**The four that were corrected on 8 August.** These were wrong. They are the
ones most worth a second opinion, because they were changed on grammar
reasoning rather than on an attested example.

| Key | English | Was | Now | Why | Correction |
| --- | --- | --- | --- | --- | --- |
| `course.position` | {n} of {total} | {n} kwangu-{total} | {n} kwezingu-{total} | `kwangu-` is not a form. Partitive is kwa- plus the class 8 relative ezi- | |
| `course.progressLabel` | Lesson {n} of {total} | Isifundo {n} kwangu-{total} | Isifundo {n} kwezingu-{total} | same | |
| `course.role` | 1 role | isikhundla esi-1 | isikhundla esisodwa | isiZulu does not count one with a digit, it uses the -odwa stem | |
| `academic.closesIn` | Closes in {n} days | Ivalwa ezinsukwini ezingu-{n} | Kusele izinsuku ezingu-{n} | concord was right, phrasing was marked. Now matches the attested izinsuku ezingu-8, and says what is left | |

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
