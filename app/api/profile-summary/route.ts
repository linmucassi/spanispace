// Turns a candidate's work history — piece jobs, informal work, hustles —
// into a professional profile summary. This is the heart of Spanispace's
// promise: informal work counts, and it reads professionally here.
//
// Auth-gated: only signed-in candidates can call it (each request costs
// Anthropic API credit), and it only ever reads the caller's own rows
// through their RLS-scoped session.

import Anthropic from '@anthropic-ai/sdk';
import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

export async function POST() {
  if (!process.env.ANTHROPIC_API_KEY) {
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

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  // max_tokens is shared between adaptive thinking and the answer, so leave
  // generous headroom or the JSON can truncate mid-object.
  const stream = await client.messages.stream({
    model: 'claude-opus-4-8',
    max_tokens: 4000,
    thinking: { type: 'adaptive' },
    output_config: { effort: 'low' },
    messages: [
      {
        role: 'user',
        content: `You are a South African career coach who specialises in helping people present informal work, piece jobs, part time work and side hustles as real professional experience. Many employers undervalue this work; your job is to make it read the way it deserves to.

Write a professional profile for this candidate based on their real work history below. Rules:
- First person, confident but honest. Never invent employers, dates or qualifications.
- Treat informal work with full respect: a car wash attendant manages customer relationships and cash; a spaza assistant runs stock and sales.
- Plain professional English a local hiring manager respects. No jargon, no em dashes.
- Return ONLY a valid JSON object, no markdown, no code fences, in this exact shape:
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
      },
    ],
  });

  const message = await stream.finalMessage();
  if (message.stop_reason === 'max_tokens') {
    return NextResponse.json(
      { error: 'The profile builder ran out of space. Please try again.' },
      { status: 502 },
    );
  }
  const textBlock = message.content.find((b) => b.type === 'text');
  const raw = textBlock?.type === 'text' ? textBlock.text.trim() : '';

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
}
