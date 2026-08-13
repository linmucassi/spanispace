// Reads an already-uploaded CV (a candidate_documents row, PDF only) and asks
// Gemini to pull structured profile fields out of it. Returns the parsed
// fields only -- it never writes to candidate_profiles or work_experiences
// itself. The candidate reviews and edits the result client side, and their
// own existing profile/onboarding save flow is what actually persists it.
//
// PDF only for v1: Gemini reads a PDF natively as inline document data, so
// there is no text-extraction library to add for that format. DOCX/DOC still
// upload fine through components/candidate/DocumentLibrary.tsx for storage,
// just not through this endpoint.
//
// Runs on Gemini (gemini-2.5-flash), not Claude -- Google's Gemini API has a
// genuine free tier (no billing method required) at the request volume this
// app runs at; the AI CV Audit/autofill features previously ran on Claude via
// ANTHROPIC_API_KEY, which has no comparable free tier. See 13 Aug 2026
// changelog for the switch.

import { GoogleGenAI, ApiError } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

const MODEL = 'gemini-2.5-flash';

// Same per-instance, best-effort limiter pattern as the other AI endpoints.
// Kept at the same 5/hour-per-user ceiling as before the provider switch --
// worth remembering this now also has to fit inside Gemini's shared, *project
// wide* free-tier daily cap (around 250 requests/day at the time of writing),
// not just this per-user limit.
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
  if (!process.env.GEMINI_API_KEY) {
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

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [
        {
          role: 'user',
          parts: [
            { inlineData: { mimeType: 'application/pdf', data: base64 } },
            {
              text: `Read this CV and extract what is actually written in it. Never invent a name, employer, date or skill that is not present.

Return ONLY a valid JSON object in this exact shape:
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
      config: {
        maxOutputTokens: 4000,
        responseMimeType: 'application/json',
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    const raw = (response.text ?? '').trim();
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
    const status = err instanceof ApiError ? err.status : undefined;
    console.error('[cv-extract] provider error:', err instanceof Error ? err.message : err);
    if (status === 429) {
      return NextResponse.json(
        { error: 'CV autofill has hit its free-tier limit for now. Please try again shortly.' },
        { status: 503 },
      );
    }
    return NextResponse.json(
      { error: 'CV autofill is temporarily unavailable. Please try again shortly.' },
      { status: 503 },
    );
  }
}
