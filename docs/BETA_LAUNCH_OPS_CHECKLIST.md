# Beta Launch Ops Checklist

**Status:** Ready to execute  
**Timeline:** ~0.5 days for all blockers  
**Owner:** DevOps / Infrastructure

---

## 🔴 Beta-Launch Blockers (REQUIRED)

### 1. Create First Admin Account

**Why:** Admin dashboard is unreachable without an admin role.

**Steps:**
1. Go to [Supabase Dashboard](https://app.supabase.com) → Your Project → **Authentication** (left sidebar)
2. Click the **Users** tab
3. Click **Add user** → **Create new user**
4. Enter email (e.g. `admin@spanispace.com`) and a password, then click **Create user**
5. Go to **SQL Editor** (left sidebar)
6. Run this query to assign the admin role in the `public.users` table:
   ```sql
   INSERT INTO public.users (id, email, role)
   SELECT id, email, 'admin'
   FROM auth.users
   WHERE email = 'admin@spanispace.com';
   ```
   > If the row already exists (e.g. you signed up through the app), run this instead:
   ```sql
   UPDATE public.users SET role = 'admin' WHERE email = 'admin@spanispace.com';
   ```
7. Log in at `/login` — you should be redirected to `/admin/dashboard`.

---

### 2. Set Environment Variables

#### Local development (`.env.local`)
Create a file called `.env.local` in the project root with:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-api-key-here
```
Restart the dev server after creating this file.

**Where to find these values in Supabase:**
1. Go to [Supabase Dashboard](https://app.supabase.com) → Your Project
2. Click **Settings** (bottom of left sidebar) → **Data API**
3. Under **Project URL** — copy the URL
4. Under **Project API keys** — copy the key labelled `anon` (this is the public, client-safe key)

#### Production (Netlify)
1. Go to [Netlify](https://app.netlify.com) → Your Site
2. Click **Site configuration** (left sidebar) → **Environment variables**
3. Click **Add a variable** for each:
   - `NEXT_PUBLIC_SUPABASE_URL` → your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → your Supabase API key (anon/public)
4. **Redeploy:** Go to **Deploys** → click **Trigger deploy** → **Deploy site**

**Verification:** After redeploy, open `https://spanispace.com`, open browser DevTools console — no Supabase errors should appear.

---

### 3. Configure Supabase Auth Redirect URLs

**Why:** Auth callback flow (password reset, email confirmation) will fail without the correct redirect URL.

**Steps:**
1. Go to [Supabase Dashboard](https://app.supabase.com) → Your Project
2. Click **Authentication** (left sidebar) → **URL Configuration**
3. Under **Site URL**, set:
   ```
   https://spanispace.com
   ```
4. Under **Redirect URLs**, click **Add URL** and add:
   ```
   https://spanispace.com/callback
   ```
5. Click **Save**

> For local testing also add: `http://localhost:3000/callback`

---

### 4. Configure Supabase Email Templates

**Why:** Auth emails must link back to the correct callback route.

**Steps:**
1. Go to **Authentication** → **Email Templates**
2. Select the **Reset Password** template
3. Set the action URL to:
   ```
   {{ .SiteURL }}/callback?next=/reset-password
   ```
4. Optionally update subject lines and body copy with Spanispace branding:
   - Subject: `Reset your Spanispace password`
   - Footer: `Spanispace — Building opportunities for South African youth`

---

### 5. DNS & SSL

**Why:** Users need `https://spanispace.com` to resolve.

**Steps:**
1. Go to your domain registrar (Namecheap, GoDaddy, etc.)
2. Point DNS to Netlify — easiest option is a CNAME:
   - **Host:** `@` (or `www`)
   - **Value:** `spanispace.netlify.app` (your Netlify subdomain)
3. In Netlify → **Site configuration** → **Domain management** → add your custom domain
4. SSL is auto-provisioned by Netlify via Let's Encrypt — no action needed

**Verification:** `https://spanispace.com` loads without browser security warnings.

---

### 6. Seed Initial Content

**Why:** Homepage and job listings will be empty without data.

**Steps:**
1. Log in as admin at `https://spanispace.com/login`
2. Navigate to the admin dashboard and seed at least:
   - **5–10 jobs** via `/admin/jobs/new`
   - **2–3 bootcamps** via `/admin/trainings/new`
   - **2–3 learnerships** via `/admin/learnerships/new`
   - **2–3 late-uni deadlines** via `/admin/late-uni/new`

---

### 7. End-to-End Smoke Test (Production)

**Checklist:**
- [ ] Candidate signup → registers and lands on `/candidate/dashboard`
- [ ] Company signup → registers and lands on `/company/dashboard`
- [ ] Admin dashboard → jobs, trainings, learnerships appear
- [ ] Post & verify a job (as company) → appears on public job board
- [ ] Apply for a job (as candidate) → application records in database
- [ ] Upload CV (candidate profile) → file saves successfully
- [ ] Forgot password → email arrives, reset link works
- [ ] isiZulu toggle → homepage and dashboard switch languages
- [ ] Mobile sidebar → drawer opens/closes on mobile viewport

**How to test:**
- Use incognito tabs for multiple accounts simultaneously
- Test on desktop + mobile (Chrome DevTools → device emulation)
- Check browser console and Netlify deploy logs for errors

---

## 🟡 Important But Not Blockers

### 1. Email Notifications (1–2 days)
- Integrate Resend or SendGrid
- Trigger emails on application status changes via Supabase Edge Functions

### 2. Google OAuth (1 day)
- Configure in Supabase → **Authentication** → **Providers** → **Google**
- Reduces signup friction

### 3. OG Social Card
- Current logo is wide-format; renders poorly on WhatsApp/Twitter/LinkedIn
- Requires a square or 1200×630 image — design task

### 4. Move Static Jobs to Supabase (1 day)
- Once real jobs are seeded, remove the static fallback in `data/constants.ts`

---

## 📋 Post-Launch (Q3 2026+)

- Stripe billing integration
- AI matching with pgvector
- In-platform messaging
- Mobile app
- Skill assessments
- Analytics dashboards

---

## Summary

**To launch beta:**
1. ✅ Code is ready
2. ⏱️ Complete blockers 1–7 (~4 hours total)
3. 🚀 Go live

**Blockers 1–5** are ~1 hour. **Blockers 6–7** (seeding + smoke test) are ~3 hours.
