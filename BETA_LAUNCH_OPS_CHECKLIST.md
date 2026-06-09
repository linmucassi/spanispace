# Beta Launch Ops Checklist

**Status:** Ready to execute  
**Timeline:** ~0.5 days for all blockers  
**Owner:** DevOps / Infrastructure

---

## 🔴 Beta-Launch Blockers (REQUIRED)

### 1. Create First Admin Account

**Why:** Admin dashboard is unreachable without an admin role.

**Steps:**
1. Go to [Supabase Dashboard](https://app.supabase.com) → Your Project → Authentication
2. Click **Sign up** in the Auth section (or use the test user panel if available)
3. Register a test admin account: `admin@spanispace.com` (or your preferred email)
4. After signup, go to **SQL Editor** in Supabase
5. Run this query:
   ```sql
   UPDATE auth.users 
   SET raw_app_meta_data = jsonb_set(
     COALESCE(raw_app_meta_data, '{}'::jsonb), 
     '{role}', 
     '"admin"'::jsonb
   ) 
   WHERE email = 'admin@spanispace.com';
   ```
6. Alternatively, if you have a custom `users` table, run:
   ```sql
   UPDATE users 
   SET role = 'admin' 
   WHERE email = 'admin@spanispace.com';
   ```
7. Log out and log back in. `/admin` should now be accessible.

---

### 2. Set Netlify Environment Variables

**Why:** Frontend needs Supabase credentials to authenticate.

**Steps:**
1. Go to **Netlify Site Dashboard** → **Site settings** → **Build & deploy** → **Environment**
2. Click **Edit variables**
3. Add two variables:
   - **Key:** `NEXT_PUBLIC_SUPABASE_URL`  
     **Value:** `https://[your-project-id].supabase.co` (from Supabase project settings)
   - **Key:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`  
     **Value:** `[your anon key]` (from Supabase Settings → API Keys → `anon`)
4. **Redeploy** the site (Netlify automatically rebuilds when env vars change, or manually trigger in **Deploys**)

**Verification:** After redeploy, load `https://spanispace.com` and check browser console for Supabase client errors.

---

### 3. Configure Supabase Auth → Redirect URLs

**Why:** Auth callback flow will fail without the exact redirect URL.

**Steps:**
1. Go to **Supabase Dashboard** → **Settings** → **Authentication** → **URL Configuration**
2. Under **Redirect URLs**, add:
   ```
   https://spanispace.com/callback
   ```
   (Include the full `https://` prefix)
3. Under **Site URL**, set:
   ```
   https://spanispace.com
   ```
4. Click **Save**

**Note:** If testing locally, also add `http://localhost:3000/callback` for dev work.

---

### 4. Configure Supabase Email Templates

**Why:** Auth emails must match the expected callback flow.

**Steps:**

#### A. Reset Password Template
1. Go to **Supabase Dashboard** → **Settings** → **Authentication** → **Email Templates**
2. Click **Edit** on the **Reset Password** template
3. In the template, find or add the action link. Change it to:
   ```
   {{ .SiteURL }}/callback?next=/reset-password
   ```
   (Ensure the exact path `/reset-password` is present for the frontend to route correctly)

#### B. Customize Confirmation & Recovery (Optional but Recommended)
- Update email templates to include Spanispace branding (logo, colors, tone)
- Example subject line: `Confirm your Spanispace account`
- Example footer: `Spanispace — Building opportunities for South African youth`

---

### 5. DNS & SSL Cert

**Why:** Users need `https://spanispace.com` to work.

**Steps:**
1. **Point DNS to Netlify:**
   - Go to your domain registrar (e.g., Namecheap, GoDaddy, Google Domains)
   - Update the **A record** or **CNAME** to point to Netlify:
     - Option A (A Record): Point to Netlify's IP (check Netlify docs for current IP)
     - Option B (CNAME, easier): Point to `spanispace.netlify.com`
   - Wait 5–30 minutes for DNS to propagate

2. **SSL Certificate:**
   - Netlify **auto-provisions free SSL** via Let's Encrypt once DNS is pointed correctly
   - No manual action needed; check **Site settings** → **Domain management** for cert status
   - You may see a green checkmark within a few minutes

**Verification:** `https://spanispace.com` should load without security warnings.

---

### 6. Seed Initial Content

**Why:** Homepage and job listings will be empty without seed data.

**Steps:**
1. Log in as admin at `https://spanispace.com/admin`
2. Seed at least:
   - **5–10 verified jobs** (via `/admin/jobs/new`)
   - **2–3 bootcamps** (via `/admin/trainings/new`)
   - **2–3 learnerships** (via `/admin/learnerships/new`)
   - **2–3 late-uni deadlines** (via `/admin/late-uni/new`)

3. Include realistic details:
   - Job title, company, description, salary range, skills required
   - Training name, duration, cost, curriculum
   - University, program, deadline, application link

**Note:** If you skip this, the homepage will show the static fallback (acceptable for beta, but real data is better for visual demos).

---

### 7. End-to-End Smoke Test (Production)

**Why:** Catch integration issues before public launch.

**Checklist:**
- [ ] **Candidate signup** → register a test candidate account
- [ ] **Company signup** → register a test company account
- [ ] **Admin dashboard** → at least one job, training, learnership appears
- [ ] **Post & verify a job** (as company) → appears on public job board
- [ ] **Apply for a job** (as candidate) → application records in database
- [ ] **Upload CV** (candidate profile or application) → file saves successfully
- [ ] **Forgot password** → email arrives, reset link works
- [ ] **isiZulu toggle** → homepage and dashboard switch languages correctly
- [ ] **Mobile sidebar** → drawer opens/closes on mobile viewport
- [ ] **Email notifications** (optional for beta) → application status emails arrive

**How to test:**
1. Use incognito tabs for multiple accounts
2. Test on desktop + mobile (Chrome DevTools device emulation)
3. Check browser console and Netlify logs for errors

---

## 🟡 Important But Not Blockers

### 1. Email Notifications (1–2 days)
- Integrate Resend or SendGrid API
- Create Supabase Edge Function to trigger on application status changes
- Not critical for beta; can ship without and add later

### 2. Google OAuth (1 day)
- Configure Google OAuth in Supabase Auth Providers
- Reduces signup friction for SA youth
- Can be added post-launch

### 3. OG Social Card (design task)
- Currently uses a wide logo; weak on WhatsApp/Twitter/LinkedIn previews
- Requires design + binary image generation (outside code scope)
- Can defer until post-launch

### 4. Move Static Jobs to Supabase (1 day)
- Once real jobs are seeded, delete static fallback in `data/constants.ts`
- Homepage will then show an empty state if no DB jobs exist
- Can defer until after first admin uploads jobs

---

## 📋 Post-Launch (Q3 2026+)

Per ROADMAP:
- Stripe billing integration
- AI matching with pgvector
- In-platform messaging
- Mobile app
- Skill assessments
- Analytics dashboards

**Not in scope for beta.**

---

## Summary

**To launch beta:**
1. ✅ Code is ready (no dev changes needed)
2. ⏱️ Complete blockers 1–7 (~4 hours)
3. 🚀 Go live

**Blockers 1–5** are ~1 hour. **Blockers 6–7** (seeding + testing) are ~3 hours.

**Next step:** Assign ownership and execute in order.
