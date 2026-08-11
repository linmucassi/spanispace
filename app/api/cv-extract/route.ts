// Reads an already-uploaded CV (a candidate_documents row, PDF only) and asks
// Claude to pull structured profile fields out of it. Returns the parsed
// fields only -- it never writes to candidate_profiles or work_experiences
// itself. The candidate reviews and edits the result client side, and their
// own existing profile/onboarding save flow is what actually persists it.
//
// PDF only for v1: Claude reads a PDF natively as a document content block,
// so there is no text-extraction library to add for that format. DOCX/DOC
// still upload fine through components/candidate/DocumentLibrary.tsx for
// storage, just not through this endpoint.

import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

// Same per-instance, best-effort limiter pattern as /api/cv-audit. Tighter
// window here since this call also attaches a full PDF, a heavier request.
const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();

function rateLimited(key: string): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    hits.set(key, recent);
    return true;
  }
  recent.push(now);
  hits.set(key, recent);
  return false;
}

export async function POST(request: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: 'CV autofill is not configured yet. Please try again later.' },
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
    return NextResponse.json({ error: 'Sign in to use CV autofill.' }, { status: 401 });
  }

  if (rateLimited(user.id)) {
    return NextResponse.json(
      { error: 'You have reached the CV autofill limit for now. Please try again later.' },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body.documentId !== 'string') {
    return NextResponse.json({ error: 'Missing documentId.' }, { status: 400 });
  }

  // RLS ("Candidates manage own documents") means this simply returns nothing
  // if the row belongs to someone else -- no separate ownership check needed,
  // the same trust boundary the rest of the app already relies on.
  const { data: document, error: docError } = await supabase
    .from('candidate_documents')
    .select('name, file_url')
    .eq('id', body.documentId)
    .maybeSingle();

  if (docError || !document) {
    return NextResponse.json({ error: 'Could not find that document.' }, { status: 404 });
  }

  const isPdf = document.file_url.toLowerCase().endsWith('.pdf') || document.name.toLowerCase().endsWith('.pdf');
  if (!isPdf) {
    return NextResponse.json(
      { error: 'CV autofill currently only reads PDF files. Please upload your CV as a PDF.' },
      { status: 400 },
    );
  }

  let base64: string;
  try {
    const fileRes = await fetch(document.file_url);
    if (!fileRes.ok) throw new Error(`storage fetch failed: ${fileRes.status}`);
    const bytes = await fileRes.arrayBuffer();
    base64 = Buffer.from(bytes).toString('base64');
  } catch (err) {
    console.error('[cv-extract] could not read uploaded file:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Could not read your uploaded CV. Please try again.' }, { status: 502 });
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  try {
    // max_tokens is shared between adaptive thinking and the answer, so leave
    // generous headroom, the same reasoning as /api/profile-summary.
    const stream = await client.messages.stream({
      model: 'claude-opus-4-8',
      max_tokens: 4000,
      thinking: { type: 'adaptive' },
      output_config: { effort: 'low' },
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: { type: 'base64', media_type: 'application/pdf', data: base64 },
            },
            {
              type: 'text',
              text: `Read this CV and extract what is actually written in it. Never invent a name, employer, date or skill that is not present.

Return ONLY a valid JSON object, no markdown, no code fences, in this exact shape:
{
  "full_name": "<string or null>",
  "phone": "<string or null>",
  "location": "<string or null, city/town and province if given>",
  "linkedin_url": "<string or null, only if a LinkedIn URL is actually printed on the CV>",
  "github_url": "<string or null, only if a GitHub URL is actually printed on the CV>",
  "skills": ["<skill>", ...],
  "professional_summary": "<a short professional summary in 2 to 3 sentences, or null if there is not enough to summarise>",
  "work_experience": [
    {
      "job_title": "<string>",
      "employer": "<string or null>",
      "work_type": "<one of: formal, informal, piece_job, part_time, volunteer, self_employed, your best judgement if not explicit>",
      "location": "<string or null>",
      "duration_text": "<string or null, as written, e.g. 'Jan 2022 to Mar 2023' or '3 months'>",
      "duties": "<string or null, one or two sentences>",
      "skills_gained": ["<skill>", ...]
    }
  ]
}

If a field is not present in the CV, use null (or an empty array for lists). Do not guess a phone number or name that is not on the page.`,
            },
          ],
        },
      ],
    });

    const message = await stream.finalMessage();
    if (message.stop_reason === 'max_tokens') {
      return NextResponse.json(
        { error: 'Your CV produced more than we could read in one go. Please try again.' },
        { status: 502 },
      );
    }

    const textBlock = message.content.find((b) => b.type === 'text');
    const raw = textBlock?.type === 'text' ? textBlock.text.trim() : '';
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: 'Could not read your CV this time. Please try again.' },
        { status: 502 },
      );
    }

    try {
      const parsed = JSON.parse(jsonMatch[0]);
      return NextResponse.json(parsed);
    } catch {
      return NextResponse.json(
        { error: 'Could not read your CV this time. Please try again.' },
        { status: 502 },
      );
    }
  } catch (err) {
    console.error('[cv-extract] provider error:', err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: 'CV autofill is temporarily unavailable. Please try again shortly.' },
      { status: 503 },
    );
  }
}
