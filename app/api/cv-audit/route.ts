import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: NextRequest) {
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
    return NextResponse.json({ error: 'Analysis failed — could not parse response.' }, { status: 500 });
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json({ error: 'Analysis failed — invalid JSON in response.' }, { status: 500 });
  }
}
