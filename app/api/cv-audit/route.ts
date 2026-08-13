// Reads an already-uploaded CV (a candidate_documents row, PDF only -- same
// upload path as app/api/cv-extract/route.ts) and asks Gemini for both a
// human-readable audit (score/strengths/improvements/quick wins) and the
// same structured profile fields cv-extract returns, in one call, so a
// single upload can both show feedback and offer to fill the profile.
//
// This endpoint used to take pasted cvText instead of an upload. Changed
// because a paste box can't do the second half of this job -- populating the
// profile needs an actual document, and every other CV-reading flow in the
// app (CvAutofill.tsx, the onboarding page) already works from an upload,
// not pasted text.
//
// Runs on Gemini (gemini-2.5-flash), not Claude -- see the note at the top of
// app/api/cv-extract/route.ts for why (13 Aug 2026 changelog has the detail).

import { GoogleGenAI, ApiError } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

const MODEL = 'gemini-2.5-flash';

// Same per-instance, best-effort limiter pattern as cv-extract. This attaches
// a full PDF like that endpoint does, so it uses the same tighter window
// rather than a looser text-only limit.
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
      { error: 'The CV audit is not configured yet. Please try again later.' },
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
    return NextResponse.json({ error: 'Please sign in to use the CV audit.' }, { status: 401 });
  }

  if (rateLimited(user.id)) {
    return NextResponse.json(
      { error: 'You have reached the CV audit limit for now. Please try again later.' },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body.documentId !== 'string') {
    return NextResponse.json({ error: 'Missing documentId.' }, { status: 400 });
  }

  // RLS ("Candidates manage own documents") means this simply returns nothing
  // if the row belongs to someone else -- no separate ownership check needed.
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
      { error: 'The CV audit currently only reads PDF files. Please upload your CV as a PDF.' },
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
    console.error('[cv-audit] could not read uploaded file:', err instanceof Error ? err.message : err);
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
              text: `You are an expert South African career coach and CV reviewer specialising in the local job market. Do two things with the attached CV:

1. Audit it: score it, highlight strengths, and give specific, actionable improvements.
2. Extract what is actually written in it, for pre-filling a job-seeker profile. Never invent a name, employer, date or skill that is not present -- use null (or an empty array) for anything not on the page.

Return ONLY a valid JSON object in this exact shape:
{
  "score": <integer 1 to 10>,
  "headline": "<one sentence overall verdict>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "improvements": [
    {"area": "<area>", "suggestion": "<actionable suggestion>"},
    {"area": "<area>", "suggestion": "<actionable suggestion>"},
    {"area": "<area>", "suggestion": "<actionable suggestion>"}
  ],
  "quickWins": ["<quick win 1>", "<quick win 2>", "<quick win 3>"],
  "extracted": {
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
}`,
            },
          ],
        },
      ],
      config: {
        maxOutputTokens: 4500,
        responseMimeType: 'application/json',
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    const raw = (response.text ?? '').trim();
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Analysis failed, could not parse the response.' }, { status: 502 });
    }

    try {
      const parsed = JSON.parse(jsonMatch[0]);
      return NextResponse.json(parsed);
    } catch {
      return NextResponse.json({ error: 'Analysis failed, the response was not valid JSON.' }, { status: 502 });
    }
  } catch (err) {
    const status = err instanceof ApiError ? err.status : undefined;
    console.error('[cv-audit] provider error:', err instanceof Error ? err.message : err);
    if (status === 429) {
      return NextResponse.json(
        { error: 'The CV audit has hit its free-tier limit for now. Please try again shortly.' },
        { status: 503 },
      );
    }
    return NextResponse.json(
      { error: 'The CV audit is temporarily unavailable. Please try again shortly.' },
      { status: 503 },
    );
  }
}
