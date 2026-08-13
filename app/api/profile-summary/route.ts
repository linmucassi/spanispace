// Turns a candidate's work history — piece jobs, informal work, hustles —
// into a professional profile summary. This is the heart of Spanispace's
// promise: informal work counts, and it reads professionally here.
//
// Auth-gated: only signed-in candidates can call it (each request costs
// Gemini API quota), and it only ever reads the caller's own rows through
// their RLS-scoped session.
//
// Runs on Gemini (gemini-2.5-flash), not Claude -- see the note at the top of
// app/api/cv-extract/route.ts for why (13 Aug 2026 changelog has the detail).

import { GoogleGenAI, ApiError } from '@google/genai';
import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

const MODEL = 'gemini-2.5-flash';

export async function POST() {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: 'The profile builder is not configured yet. Please try again later.' },
      { status: 503 },
    );
  }

  const supabase = await createServerSupabase();
  if (!supabase) {
    return NextResponse.json({ error: 'Service unavailable.' }, { status: 503 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Sign in to build your professional profile.' }, { status: 401 });
  }

  const [profileRes, experiencesRes] = await Promise.all([
    supabase
      .from('candidate_profiles')
      .select('full_name, location, skills')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('work_experiences')
      .select('job_title, employer, work_type, location, duration_text, duties, skills_gained')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20),
  ]);

  const experiences = experiencesRes.data ?? [];
  if (experiencesRes.error) {
    return NextResponse.json(
      { error: 'Could not load your work experience. Please try again.' },
      { status: 500 },
    );
  }
  if (experiences.length === 0) {
    return NextResponse.json(
      { error: 'Add at least one work experience first, then build your profile.' },
      { status: 400 },
    );
  }

  const profile = profileRes.data;
  const experienceLines = experiences
    .map((e) => {
      const parts = [
        `Work: ${e.job_title}`,
        e.employer ? `for ${e.employer}` : null,
        `(${e.work_type.replace('_', ' ')})`,
        e.location ? `in ${e.location}` : null,
        e.duration_text ? `lasting ${e.duration_text}` : null,
        e.duties ? `duties: ${e.duties}` : null,
        e.skills_gained?.length ? `skills: ${e.skills_gained.join(', ')}` : null,
      ];
      return parts.filter(Boolean).join(' ');
    })
    .join('\n')
    .slice(0, 6000);

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: `You are a South African career coach who specialises in helping people present informal work, piece jobs, part time work and side hustles as real professional experience. Many employers undervalue this work; your job is to make it read the way it deserves to.

Write a professional profile for this candidate based on their real work history below. Rules:
- First person, confident but honest. Never invent employers, dates or qualifications.
- Treat informal work with full respect: a car wash attendant manages customer relationships and cash; a spaza assistant runs stock and sales.
- Plain professional English a local hiring manager respects. No jargon, no em dashes.
- Return ONLY a valid JSON object in this exact shape:
{
  "headline": "<one line professional headline, max 10 words>",
  "summary": "<a professional summary of 80 to 130 words>",
  "keySkills": ["<skill 1>", "<skill 2>", "<skill 3>", "<skill 4>", "<skill 5>"]
}

Candidate:
Name: ${profile?.full_name ?? 'Not given'}
Location: ${profile?.location ?? 'South Africa'}
Self-listed skills: ${profile?.skills?.length ? profile.skills.join(', ') : 'None listed'}

Work history:
${experienceLines}`,
      config: {
        maxOutputTokens: 2000,
        responseMimeType: 'application/json',
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    const raw = (response.text ?? '').trim();
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: 'Could not build your profile this time. Please try again.' },
        { status: 500 },
      );
    }

    try {
      const parsed = JSON.parse(jsonMatch[0]);
      return NextResponse.json(parsed);
    } catch {
      return NextResponse.json(
        { error: 'Could not build your profile this time. Please try again.' },
        { status: 500 },
      );
    }
  } catch (err) {
    const status = err instanceof ApiError ? err.status : undefined;
    console.error('[profile-summary] provider error:', err instanceof Error ? err.message : err);
    if (status === 429) {
      return NextResponse.json(
        { error: 'The profile builder has hit its free-tier limit for now. Please try again shortly.' },
        { status: 503 },
      );
    }
    return NextResponse.json(
      { error: 'The profile builder ran into a problem. Please try again shortly.' },
      { status: 503 },
    );
  }
}
