import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Best-effort, in-memory rate limit. This resets per serverless instance and is
// not a hard guarantee, but it blunts a runaway loop from a single caller. For a
// durable limit across instances, back this with Upstash Ratelimit or Netlify KV.
const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_PER_WINDOW = 8;
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
  // Require an authenticated session. This endpoint calls a paid model, so it
  // must sit behind the same trust boundary as the /candidate/cv-audit page.
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
  if (!body || typeof body.cvText !== 'string') {
    return NextResponse.json({ error: 'Missing cvText.' }, { status: 400 });
  }

  const { cvText } = body;

  if (cvText.trim().length < 50) {
    return NextResponse.json({ error: 'CV text is too short (minimum 50 characters).' }, { status: 400 });
  }
  if (cvText.length > 8000) {
    return NextResponse.json({ error: 'CV text is too long (maximum 8,000 characters).' }, { status: 400 });
  }

  try {
    const stream = await client.messages.stream({
      model: 'claude-opus-4-8',
      max_tokens: 1500,
      thinking: { type: 'adaptive' },
      messages: [
        {
          role: 'user',
          content: `You are an expert South African career coach and CV reviewer specialising in the local job market.

Analyse the CV below and return ONLY a valid JSON object — no markdown, no explanation, no code fences. Use this exact shape:
{
  "score": <integer 1–10>,
  "headline": "<one sentence overall verdict>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "improvements": [
    {"area": "<area>", "suggestion": "<actionable suggestion>"},
    {"area": "<area>", "suggestion": "<actionable suggestion>"},
    {"area": "<area>", "suggestion": "<actionable suggestion>"}
  ],
  "quickWins": ["<quick win 1>", "<quick win 2>", "<quick win 3>"]
}

CV:
${cvText.trim()}`,
        },
      ],
    });

    const message = await stream.finalMessage();
    const textBlock = message.content.find((b) => b.type === 'text');
    const raw = textBlock?.type === 'text' ? textBlock.text.trim() : '';

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Analysis failed — could not parse response.' }, { status: 502 });
    }

    try {
      const parsed = JSON.parse(jsonMatch[0]);
      return NextResponse.json(parsed);
    } catch {
      return NextResponse.json({ error: 'Analysis failed — invalid JSON in response.' }, { status: 502 });
    }
  } catch (err) {
    console.error('[cv-audit] provider error:', err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: 'The CV audit is temporarily unavailable. Please try again shortly.' },
      { status: 503 },
    );
  }
}
