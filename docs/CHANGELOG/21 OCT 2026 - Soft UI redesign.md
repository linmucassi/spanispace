# 21 Oct 2026 — Soft UI redesign

## Site-wide visual revamp from Linda's references

Linda collected references in `docs/dashboard ui` (13 images: soft light dashboards, floating sidebars, big-number stat cards) and `docs/infoghraphics ui` (6 images: radial charts, ring gauges, glowing bar charts) and asked for a modern revamp. Her choices: **soft light** look (not dark), **everything in one pass** (portals and public site), and **keep the logo blue** `#0070C8` as the accent, with the reference accents (violet, emerald, amber, rose) only in charts and status chips.

### Design system (`app/globals.css`, `app/layout.tsx`)
- A cool grey canvas `--color-canvas: #eef1f6` behind floating white panels.
- The Tailwind scale is redefined in `@theme`, so all 80 pages shift without edits: larger radii (`rounded-xl` = 16px, `rounded-2xl` = 22px, `rounded-3xl` = 28px), long faint shadows instead of hard ones, and slightly softer slate borders.
- Any white card with a border and `rounded-xl`/`rounded-2xl` gets the soft shadow automatically, so untouched pages float too.
- New classes:
  - `.panel`: a floating white card
  - `.panel-glass`: frosted, for surfaces over a gradient
  - `.stat-number`: big digits that fade from ink to grey
  - `.bg-sky-wash`: the blue sky gradient behind the hero and auth pages
- Headlines use **Plus Jakarta Sans** instead of Archivo, the rounded geometric face the references use. Inter stays for body copy.

### New building blocks (`components/ui/`)
- `RingGauge`: an SVG progress ring.
- `StatCard`: an icon in a soft circle, a label, a big number, and an optional ring and hint; it becomes a link when given `href`.
- `Panel.tsx`:
  - `Panel`: a card with an optional header row
  - `PageHeader`: a two-tone title, "Hiring **overview**"
  - `MeterList`: horizontal bars with a glowing end dot
  - `btnPrimary` and `btnSecondary`: pill buttons

### Portals
- `components/portal/PortalSidebar.tsx` is now the one sidebar for candidate, company and admin. Each portal's sidebar file only declares its nav.
  - A floating white panel with section labels (Menu / Workspace, Menu / Hiring / Company, Overview / Listings / People / PieceJobs).
  - The active page gets a brand pill and a side marker; collapsible groups are drawn as a tree.
  - A second small panel shows the signed-in person, "Site" and "Sign out".
  - On phones: a frosted top bar and a drawer, which closes when you navigate.
- The admin nav moved from inline SVG paths to lucide icons.
- `components/portal/PortalFrame.tsx` replaces the three copies of layout markup (canvas, sidebar offset, desktop top bar with the profile menu).
- `lib/portal/usePortalIdentity.ts` is the signed-in name/picture lookup, shared by the sidebar and `PortalUserMenu`. The menu button now shows the name next to the avatar on wide screens.

### Dashboards
- **Candidate:**
  - Four stat cards: applications; shortlisted (with a ring); profile score (ring); enrollments.
  - A profile checklist card with a ring and a two-column checklist.
  - An "Application pipeline" bar chart by status.
  - Verification and invitations in one panel; training progress as bars; recent applications as a list.
  - Two count queries were replaced by one status read.
- **Company:**
  - Stat cards.
  - A "Job visits and drop-off" panel with a completion ring and bars (views → started → submitted).
  - A pipeline bar chart.
  - Recent applications with initials.
  - The shortlisted, pending and total counts now come from one status read instead of three count queries.
- **Admin:**
  - Stat cards (active jobs with a ring).
  - A review queue (jobs to approve, candidate documents, open invites).
  - A catalogue panel (share of jobs live, plus jobs, learnerships and trainings as bars).
  - The scraped-jobs alert.

### Public site
- **Navbar:** a floating frosted pill, with the current section highlighted as a white pill. The phone menu is a floating panel.
- **Home hero:** rebuilt light, on the sky wash.
  - On the right: a live card (the verified job count, with a by-type bar chart) and the three newest verified jobs.
  - A floating PieceJobs shortcut.
  - **The old hero showed hardcoded, untrue figures** ("2,400+ verified jobs", "12K+ active candidates"). Every number now comes from live data:
    - jobs on the public board
    - courses in `data/courses.ts`
    - PieceJobs categories
  - The Three.js starfield (`components/HeroCanvas.tsx`) is deleted. The `three` package is now unused but still in `package.json`.
- **Job board:** cards are floating panels with a company-initial tile in the work-kind colour (`WORK_KIND_TILE` in `lib/work-type.ts`), replacing the thick coloured left edge. The search box and pagination are pills.
- **Home sections:**
  - The AI CV audit banner is a floating rounded card overlapping the hero.
  - The home training block is a rounded dark panel.
  - The footer is a floating dark panel.
- **Auth pages:** a sky wash with the form on a frosted card.
- **Login accessibility fix:** the labels are now tied to their inputs (`htmlFor`/`id`, plus `autocomplete`), so screen readers announce "Email" and "Password". Flagged on 20 Oct.
- **Spacing and backgrounds:**
  - Pages that sat just under the old bar got `pt-28` (events, the job detail and apply pages, post-job, PieceJobs, privacy, terms).
  - The training page's dark background now runs behind the floating nav.
  - White page backgrounds were dropped on the PieceJobs, privacy and terms pages.
- **New i18n keys:** `hero.statPieceJobs`, `hero.liveNow`, `hero.latestJobs`, `hero.pieceJobsHint`. **The isiZulu strings are Claude's and need a native-speaker check.**

### Verification
- `tsc` and `next build` are clean. ESLint on the changed files shows no new errors; the remaining ones (`any` in the dashboards' carried-over queries, and register's effect) were there before.
- Screenshots via Playwright on a production build (`next start -p 3211`):
  - home, jobs, PieceJobs, training, events, university, login and register at 1366px
  - the home page and candidate dashboard at 390px, including both menus
  - the candidate and company dashboards logged in as the test accounts
- No page errors and no horizontal scroll on phones.
- **Linda's dev server** kept serving the old CSS, because Turbopack doesn't hot-reload `@theme` changes. Restart `npm run dev` to see the redesign.

## PieceJobs PART F confirmed run

A read-only check found the public views (`service_provider_cards` and the other two) are live, and `/piecejobs` now lists the test provider "Test P.". Every PieceJobs migration has now run in production.

## Space hero, account links, Title Case headings, light and dark themes

Linda's follow-ups after reviewing the redesign:

1. **Space art back on the home hero, newer:** `components/SpaceCanvas.tsx` is a 2D canvas, so there's no Three.js:
   - three parallax layers of twinkling stars that drift and follow the pointer slightly
   - a planet with a brand-blue rim light and atmosphere, a dashed orbit and a moving satellite
   - occasional shooting stars
   - Behind it, `.space-backdrop` gives navy with violet and blue nebulae.
   - Device pixel ratio is capped at 2, the planet is pre-rendered per resize, the loop pauses off screen or in a hidden tab, and it draws one still frame under `prefers-reduced-motion`.
   - The hero text is white and the live cards are near-solid white. The hero has rounded bottom corners, and everything below is unchanged.
2. **Public navbar:** "Dashboard" and "Post a job" are no longer in the bar or the phone menu. They live in the profile dropdown (Dashboard, Post a job for company/admin, Sign out), which now shows on phones too.
3. **Title Case headings:** `h1`-`h4` get `text-transform: capitalize` site-wide (`app/globals.css`), so "Hire trusted local help" shows as "Hire Trusted Local Help". This includes translated and database text. CSS capitalises every word, small words too ("Bridging The Gap Between Skills And Career Success"), matching Linda's example. Add `normal-case` to opt a heading out.
4. **Light and dark themes:**
   - **How it works:** a `dark` class on `<html>`. `lib/theme.ts` holds the storage key and a pre-paint script, injected in `app/layout.tsx` (no flash; `suppressHydrationWarning` on `<html>`). With no saved choice it follows the device setting, live.
   - **Switches** (`components/ThemeToggle.tsx`, `useSyncExternalStore`): a sun/moon button in the public navbar and on the auth pages, and a Light | Dark switch in each portal sidebar's account panel. They stay in sync.
   - **The palette** is re-pointed under `.dark` rather than adding `dark:` classes to 80 pages:
     - white, ink, slate and gray are inverted, so `bg-white` becomes the dark panel `#121c2e` and the canvas `#0a111d`
     - brand is re-tuned
     - each accent palette's 50-200 become dark washes (`color-mix`) and 700-900 light text
     - `text-white` stays white
     - dark fills with white text (`bg-slate-900` buttons) invert to light chips
     - brand-700/800 fills (button hovers) stay deep blue
   - `.panel`, `.panel-glass`, the sky wash and the ring-gauge track use variables, and the logo mark (`.logo-mark`) turns white.
   - **Sections that are dark by design** keep the light palette via `.theme-static`: the space hero, the CV audit banner, the training blocks, guide headers, the footer, admin login and the 404 page.
   - The browser `theme-color` has light and dark values.
5. **Checked:** with Playwright on a production build, in both themes:
   - home (top and scrolled), jobs, PieceJobs, training and login
   - the company dashboard signed in
   - the signed-in navbar dropdown
   - at 390px, the home page, candidate dashboard and drawer
   - No page errors and no horizontal scroll. `tsc`, `next build` and ESLint on the new files are clean.

## Inspiration images removed, new planet horizon

- **Images removed:** Linda pushed the reference images by mistake, in her commit `6f00d2a` on `lin/dev`: 19 WhatsApp images in `docs/dashboard ui` and `docs/infoghraphics ui`. At her choice they were deleted in a new commit, `ff98092` "Remove UI inspiration images committed by mistake", pushed to `lin/dev`, with no history rewrite. They are also deleted locally. **They are still visible in `6f00d2a`'s history on GitHub.** Removing them from history would mean rewriting that commit and force-pushing.
- **The planet looked bad, so it's gone.** Linda didn't like it (`SpaceCanvas`): a small striped sphere on the right with a dashed orbit and a satellite.
  - **Replaced by a "planet-rise" horizon:** a planet much wider than the screen, so only a flat, glowing arc of its edge shows in the hero's bottom padding.
  - **The arc:** a navy body lit along the top edge, three stacked glow strokes fading out to the sides, a soft atmosphere haze, and a small sun breaking over the edge at the centre.
  - The orbit and satellite are removed.
  - The hero's phone bottom padding went from `pb-20` to `pb-32`, so the arc isn't hidden behind the CV Audit banner.
  - Checked at 1366, 1920 and 390px, with no page errors.

## Home spacing: PieceJobs section and training panel

Linda: "Learn Something That Pays" sat too close to "Hire Trusted Local Help". The home training panel now has `mt-12` (`md:mt-16`) above it and `mb-4` below. The PieceJobs section (`components/ServicesSection.tsx`) also dropped its full-width white background, which left a hard white-to-grey edge; it now sits on the page canvas like the other sections.

## Files changed
- `app/globals.css`, `app/layout.tsx`
- `components/ui/RingGauge.tsx`, `components/ui/StatCard.tsx`, `components/ui/Panel.tsx` (new)
- `components/portal/PortalSidebar.tsx`, `components/portal/PortalFrame.tsx`, `lib/portal/usePortalIdentity.ts` (new)
- `components/candidate/CandidateSidebar.tsx`, `components/company/CompanySidebar.tsx`, `components/admin/AdminSidebar.tsx`, `components/PortalUserMenu.tsx`
- `app/candidate/layout.tsx`, `app/company/layout.tsx`, `app/admin/layout.tsx`
- `app/candidate/dashboard/page.tsx`, `app/company/dashboard/page.tsx`, `app/admin/dashboard/page.tsx`, `components/candidate/ProfileCompletenessCard.tsx`
- `components/Navbar.tsx`, `components/Hero.tsx`, `components/HeroCanvas.tsx` (deleted), `app/(public)/page.tsx`, `components/JobBoard.tsx`, `lib/work-type.ts`, `components/CVAuditBanner.tsx`, `components/Footer.tsx`
- `app/(auth)/layout.tsx`, `app/(auth)/login/page.tsx`
- `app/(public)/training/page.tsx`, `app/(public)/events/page.tsx`, `app/(public)/events/[id]/page.tsx`, `app/(public)/jobs/[id]/JobDetailView.tsx`, `app/(public)/jobs/[id]/apply/ApplyForm.tsx`, `app/(public)/post-job/page.tsx`, `app/(public)/piecejobs/provider/[id]/page.tsx`, `app/(public)/piecejobs/provider-agreement/page.tsx`, `app/(public)/privacy/page.tsx`, `app/(public)/terms/page.tsx`, `components/services/ServicesBrowser.tsx`
- `lib/i18n/en.ts`, `lib/i18n/zu.ts`
- Follow-ups: `components/SpaceCanvas.tsx`, `components/ThemeToggle.tsx`, `lib/theme.ts` (new); `components/Hero.tsx`, `components/Navbar.tsx`, `components/CVAuditBanner.tsx`, `components/Footer.tsx`, `components/TrainingSection.tsx`, `components/GuideShell.tsx`, `components/NotFound404.tsx`, `components/portal/PortalSidebar.tsx`, `components/ui/RingGauge.tsx`, `app/globals.css`, `app/layout.tsx`, `app/(auth)/layout.tsx`, `app/admin/login/page.tsx`, `app/(public)/training/page.tsx`, `app/(public)/training/[course]/page.tsx`, `app/(public)/training/[course]/[lesson]/page.tsx`
- Planet: `components/SpaceCanvas.tsx`, `components/Hero.tsx`; removed `docs/dashboard ui/*`, `docs/infoghraphics ui/*`
- Spacing: `app/(public)/page.tsx`, `components/ServicesSection.tsx`
