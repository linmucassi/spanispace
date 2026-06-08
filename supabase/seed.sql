-- Spanispace seed content
-- Run after schema.sql, after the admin user exists in public.users
-- The admin user_id is referenced for company_profiles ownership

-- ============================================================
-- CURATED COMPANY (owns the seeded job listings)
-- ============================================================
-- Note: replace :admin_user_id with the actual admin's auth.users id
-- This script is parameterized; the Management API runner substitutes it.

INSERT INTO company_profiles (
  user_id, company_name, industry, location, website, subscription_tier
)
VALUES (
  :admin_user_id,
  'Spanispace Curated',
  'Other',
  'Gauteng, South Africa',
  'https://spanispace.com',
  'enterprise'
)
ON CONFLICT (user_id) DO UPDATE SET company_name = EXCLUDED.company_name
RETURNING id;

-- ============================================================
-- JOBS (seed from the original static data set + future-dated)
-- All jobs link to the curated company_profile so they show under one source
-- expiry pushed +180 days from today so they don't show as expired post-launch
-- ============================================================

WITH curated AS (
  SELECT id FROM company_profiles WHERE user_id = :admin_user_id LIMIT 1
)
INSERT INTO jobs (
  company_id, title, description, requirements, location, job_type,
  apply_link, expiry_date, vetted_status, poster_name, status
)
SELECT
  (SELECT id FROM curated),
  title, description, requirements, location, job_type::text,
  apply_link, expiry_date, 'verified', poster_name, 'active'
FROM (VALUES
  ('Customer Service Representative (Remote)',
   'Handle inbound customer queries via phone, email, and chat for our South African client base. Full training provided.',
   'Matric required. Fluent English. Reliable internet. Quiet workspace.',
   'Remote - South Africa', 'Remote',
   'https://za.indeed.com/q-remote-jobs.html',
   (CURRENT_DATE + INTERVAL '180 days')::date,
   'Sigma Group'),

  ('Digital Shift Support (Remote)',
   'Provide first-line digital support across rotating shifts. Suitable for night-owls and graduates.',
   'Grade 12. Basic IT troubleshooting skills. Fast typing.',
   'Remote - Cape Town / Nationwide', 'Remote',
   'https://za.indeed.com/q-remote-jobs.html',
   (CURRENT_DATE + INTERVAL '180 days')::date,
   'Various (Indeed listings)'),

  ('Payroll Administrator (Remote)',
   'Process monthly payroll for SA-based teams. Experience with VIP/Sage Payroll preferred.',
   'Diploma in HR/Finance. 2+ yrs payroll exp. Strong Excel.',
   'Remote - Sandton, Gauteng', 'Remote',
   'https://za.indeed.com/q-remote-jobs.html',
   (CURRENT_DATE + INTERVAL '180 days')::date,
   'Talent Sam'),

  ('Language Manager, Africa (Contract)',
   'Oversee localization of Canva product strings into 5+ African languages. Cross-functional collaboration.',
   'Bachelor degree. Fluency in 2+ African languages incl. isiZulu/Sesotho/Afrikaans.',
   'Johannesburg, Gauteng', 'Contract',
   'https://za.linkedin.com/jobs/remote-work-jobs',
   (CURRENT_DATE + INTERVAL '180 days')::date,
   'Canva'),

  ('Proofreader / Copy Editor (Remote Contract)',
   'Proofread short-form digital content for tone, grammar, and SA English consistency.',
   'Native English fluency. Eagle-eye for detail.',
   'Remote - South Africa', 'Remote',
   'https://za.linkedin.com/jobs/remote-work-jobs',
   (CURRENT_DATE + INTERVAL '180 days')::date,
   'Various (LinkedIn listings)'),

  ('Customer Support & Office Administrator (EST Hours, Remote)',
   'Hybrid support + admin role on US Eastern hours. Stable internet essential.',
   'Matric + admin experience. Comfortable with overnight shifts.',
   'Remote - Johannesburg, Gauteng', 'Remote',
   'https://za.linkedin.com/jobs/remote-work-jobs',
   (CURRENT_DATE + INTERVAL '180 days')::date,
   'Various remote roles'),

  ('Associate Vendor Manager',
   'Manage relationships with third-party vendors on the Amazon retail platform. SA-focused.',
   'Bachelor degree. 2+ yrs procurement/vendor exp. Strong analytics.',
   'Cape Town, Western Cape', 'Hybrid',
   'https://www.amazon.jobs/en/search?base_query=&country=ZAF',
   (CURRENT_DATE + INTERVAL '180 days')::date,
   'Amazon'),

  ('Remote Telephone Admin Specialist',
   'Outbound and inbound telephone admin for UK property law firm. Training provided.',
   'Matric. Strong English. Comfortable on the phone.',
   'Remote - South Africa', 'Remote',
   'https://www.glassdoor.com/Job/south-africa-remote-jobs-SRCH_IL.0,12_IN211_KO13,19.htm',
   (CURRENT_DATE + INTERVAL '180 days')::date,
   'AVRillo'),

  ('Data Entry Clerk (Remote)',
   'Accurate data entry into client CRM. High-volume, deadline-driven.',
   'Matric. 60+ wpm typing. Detail-oriented.',
   'Remote - South Africa', 'Remote',
   'https://www.glassdoor.com/Job/south-africa-remote-jobs-SRCH_IL.0,12_IN211_KO13,19.htm',
   (CURRENT_DATE + INTERVAL '180 days')::date,
   'HireHawk'),

  ('Administrative Support Coordinator (Remote)',
   'Coordinate admin tasks for US-based legal/medical practices. Full WFH.',
   'Matric. Admin or call centre experience. EST-overlapping hours.',
   'Remote - South Africa', 'Remote',
   'https://jobduck.com/',
   (CURRENT_DATE + INTERVAL '180 days')::date,
   'Job Duck'),

  ('Intake Specialist - Client Engagement (Remote)',
   'First point of contact for US client intakes. Empathy + clear communication critical.',
   'Matric + soft-skill experience. Reliable WFH setup.',
   'Remote - South Africa', 'Remote',
   'https://jobduck.com/',
   (CURRENT_DATE + INTERVAL '180 days')::date,
   'Job Duck'),

  ('Sales and Marketing Learnership 2026',
   '12-month structured learnership for matriculants interested in FMCG sales and marketing. NQF Level 4.',
   'Matric (2023 or later). South African citizen. Aged 18-35.',
   'Various - South Africa', 'Learnership',
   'https://www.studentroom.co.za/south-african-breweries-sab-sales-and-marketing-learnerships-2026/',
   (CURRENT_DATE + INTERVAL '180 days')::date,
   'South African Breweries (SAB)'),

  ('Production & Distribution Learnerships 2026',
   '12-month learnership in dairy production and distribution. Stipend + permanent placement opportunities.',
   'Matric with maths. Aged 18-30. Physically able for plant work.',
   'Various - South Africa', 'Learnership',
   'https://www.studentroom.co.za/clover-production-distribution-learnerships-2026/',
   (CURRENT_DATE + INTERVAL '180 days')::date,
   'Clover'),

  ('Call Centre Learnership (12 Months)',
   'Structured call centre learnership with stipend. Pathway to permanent agent roles.',
   'Matric. SA citizen. No prior call-centre experience required.',
   'Centurion, Gauteng', 'Learnership',
   'https://za.linkedin.com/jobs/learnership-jobs',
   (CURRENT_DATE + INTERVAL '180 days')::date,
   'OUTsurance'),

  ('Technical Apprenticeship / Learnership 2026',
   'Technical apprenticeship in aviation engineering. 18-24 months. Pathway to SACAA certification.',
   'Matric with maths and physical science. Aged 18-30.',
   'Various - South Africa', 'Learnership',
   'https://www.studentroom.co.za/south-african-airways-technical-apprenticeships-learnerships-2026/',
   (CURRENT_DATE + INTERVAL '180 days')::date,
   'South African Airways (SAA)')
) AS j(title, description, requirements, location, job_type, apply_link, expiry_date, poster_name);

-- ============================================================
-- TRAININGS
-- ============================================================

INSERT INTO trainings (title, description, category, start_date, duration_weeks, format, skills_covered, is_free, status)
VALUES
  ('Modern AI for Devs', 'Master LLMs, RAG, and AI integration in 12 weeks. Hands-on with Python and modern AI tooling.',
   'Bootcamp', (CURRENT_DATE + INTERVAL '30 days')::date, 12, 'online',
   ARRAY['AI', 'Python', 'LLMs', 'RAG', 'DevOps'], TRUE, 'active'),

  ('CV Mastery & Interview Prep', 'One-day intensive event: expert feedback on your CV plus live mock interviews with hiring managers.',
   'Event', (CURRENT_DATE + INTERVAL '14 days')::date, 1, 'hybrid',
   ARRAY['Soft Skills', 'Careers', 'Communication'], TRUE, 'active'),

  ('Cloud Foundations (AWS / Azure)', 'Short course on cloud fundamentals, infrastructure-as-code, and deploying production workloads.',
   'Short Course', (CURRENT_DATE + INTERVAL '21 days')::date, 6, 'online',
   ARRAY['Cloud', 'AWS', 'Azure', 'Terraform', 'CI/CD'], TRUE, 'active'),

  ('Excel & Data Literacy', 'Become job-ready with practical Excel: pivots, lookups, dashboards, and basic data analysis.',
   'Short Course', (CURRENT_DATE + INTERVAL '7 days')::date, 4, 'online',
   ARRAY['Excel', 'Data Analysis', 'Reporting'], TRUE, 'active'),

  ('Tech Sales Bootcamp', '8-week bootcamp covering SDR fundamentals, CRM tooling, and modern outbound for tech companies.',
   'Bootcamp', (CURRENT_DATE + INTERVAL '45 days')::date, 8, 'hybrid',
   ARRAY['Sales', 'CRM', 'Communication', 'Negotiation'], TRUE, 'active');

-- ============================================================
-- LEARNERSHIPS (curated, public)
-- ============================================================

INSERT INTO learnerships (title, provider, location, stipend, duration, apply_link, expiry_date, vetted_status)
VALUES
  ('Sales and Marketing Learnership 2026', 'South African Breweries (SAB)', 'Various - SA',
   'R5,000 - R6,500 / month', '12 months',
   'https://www.studentroom.co.za/south-african-breweries-sab-sales-and-marketing-learnerships-2026/',
   (CURRENT_DATE + INTERVAL '60 days')::date, 'verified'),

  ('Production & Distribution Learnerships 2026', 'Clover', 'Various - SA',
   'Stipend (not disclosed)', '12 months',
   'https://www.studentroom.co.za/clover-production-distribution-learnerships-2026/',
   (CURRENT_DATE + INTERVAL '45 days')::date, 'verified'),

  ('Call Centre Learnership (12 Months)', 'OUTsurance', 'Centurion, Gauteng',
   'R4,500 / month', '12 months',
   'https://za.linkedin.com/jobs/learnership-jobs',
   (CURRENT_DATE + INTERVAL '30 days')::date, 'verified'),

  ('Technical Apprenticeship / Learnership 2026', 'South African Airways (SAA)', 'Various - SA',
   'Stipend + accommodation', '18-24 months',
   'https://www.studentroom.co.za/south-african-airways-technical-apprenticeships-learnerships-2026/',
   (CURRENT_DATE + INTERVAL '60 days')::date, 'verified'),

  ('Banking Learnership 2026', 'Capitec Bank', 'National',
   'R6,500 / month', '12 months',
   'https://www.capitecbank.co.za/careers/',
   (CURRENT_DATE + INTERVAL '90 days')::date, 'verified');

-- ============================================================
-- LATE UNIVERSITY APPLICATIONS
-- ============================================================

INSERT INTO late_uni_apps (institution, programs, application_type, closing_date, notes, apply_link, status)
VALUES
  ('University of Cape Town (UCT)', 'Selected undergraduate programmes with available seats', 'Late Application',
   (CURRENT_DATE + INTERVAL '21 days')::date,
   'Late applications open for selected programmes only. Check faculty-specific deadlines.',
   'https://www.uct.ac.za/apply', 'open'),

  ('Wits University', 'Engineering, Commerce, Humanities (limited seats)', 'Late Application',
   (CURRENT_DATE + INTERVAL '14 days')::date,
   'Walk-in applications accepted at the Wits Admissions Office.',
   'https://www.wits.ac.za/apply/', 'open'),

  ('University of Pretoria (UP)', 'Selected programmes', 'Standard',
   (CURRENT_DATE + INTERVAL '30 days')::date,
   'Standard window still open for several faculties.',
   'https://www.up.ac.za/apply', 'open'),

  ('University of Johannesburg (UJ)', 'Undergraduate diplomas + selected degrees', 'Late Application',
   (CURRENT_DATE + INTERVAL '28 days')::date,
   'Application fee waived for students applying via the Spanispace partnership.',
   'https://www.uj.ac.za/apply/', 'open'),

  ('UNISA', 'Distance learning - all undergraduate qualifications', 'Standard',
   (CURRENT_DATE + INTERVAL '120 days')::date,
   'Year-round flexible enrolment for distance learning.',
   'https://www.unisa.ac.za/', 'open');
