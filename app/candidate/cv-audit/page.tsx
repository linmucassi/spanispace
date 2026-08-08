'use client';

import React, { useState } from 'react';
import type { Metadata } from 'next';

// Can't export metadata from a client component; handled at layout level

type AuditResult = {
  score: number;
  headline: string;
  strengths: string[];
  improvements: { area: string; suggestion: string }[];
  quickWins: string[];
};

export default function CVAuditPage() {
  const [cvText, setCvText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch('/api/cv-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cvText }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.');
        return;
      }
      setResult(data as AuditResult);
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  const scoreColor = (score: number) => {
    if (score >= 8) return 'text-emerald-600';
    if (score >= 5) return 'text-amber-500';
    return 'text-red-500';
  };

  const scoreLabel = (score: number) => {
    if (score >= 8) return 'Strong';
    if (score >= 5) return 'Developing';
    return 'Needs Work';
  };

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold text-slate-900">AI CV Audit</h1>
          <span className="px-2 py-0.5 bg-brand-100 text-brand-700 text-xs font-semibold rounded-full uppercase tracking-wide">
            New
          </span>
        </div>
        <p className="text-slate-500 text-sm">
          Paste your CV text below. Our AI career coach will score it, highlight strengths,
          and give you specific improvements tailored to the South African job market.
        </p>
      </div>

      {/* Input form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="cv-text" className="block text-sm font-medium text-slate-700 mb-1.5">
            Your CV text
          </label>
          <textarea
            id="cv-text"
            value={cvText}
            onChange={(e) => setCvText(e.target.value)}
            rows={16}
            maxLength={8000}
            placeholder="Paste your full CV here — including work experience, education, skills, and any other sections..."
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-y"
            required
          />
          <div className="flex justify-between mt-1 text-xs text-slate-400">
            <span>Minimum 50 characters</span>
            <span>{cvText.length} / 8,000</span>
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || cvText.trim().length < 50}
          className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 text-white text-sm font-semibold rounded-xl hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Analysing your CV…
            </>
          ) : (
            'Analyse My CV'
          )}
        </button>
      </form>

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Score card */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 flex items-center gap-6">
            <div className="flex-shrink-0 text-center">
              <div className={`text-5xl font-black ${scoreColor(result.score)}`}>
                {result.score}
              </div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mt-0.5">
                out of 10
              </div>
            </div>
            <div className="w-px self-stretch bg-slate-100" />
            <div>
              <span className={`text-sm font-semibold uppercase tracking-wide ${scoreColor(result.score)}`}>
                {scoreLabel(result.score)}
              </span>
              <p className="text-slate-700 mt-1">{result.headline}</p>
            </div>
          </div>

          {/* Strengths */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <span className="text-emerald-500">✓</span> Strengths
            </h2>
            <ul className="space-y-2">
              {result.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                  <span className="mt-0.5 h-4 w-4 flex-shrink-0 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold">
                    {i + 1}
                  </span>
                  {s}
                </li>
              ))}
            </ul>
          </div>

          {/* Improvements */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <span className="text-amber-500">↑</span> Areas to Improve
            </h2>
            <ul className="space-y-4">
              {result.improvements.map((item, i) => (
                <li key={i} className="text-sm">
                  <span className="font-semibold text-slate-800">{item.area}</span>
                  <p className="text-slate-600 mt-0.5">{item.suggestion}</p>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick wins */}
          <div className="bg-brand-50 rounded-xl border border-brand-100 p-6">
            <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <span className="text-brand-600">⚡</span> Quick Wins
            </h2>
            <ul className="space-y-2">
              {result.quickWins.map((w, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                  <span className="mt-0.5 h-4 w-4 flex-shrink-0 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-xs font-bold">
                    {i + 1}
                  </span>
                  {w}
                </li>
              ))}
            </ul>
          </div>

          {/* Retry button */}
          <button
            onClick={() => { setResult(null); setCvText(''); }}
            className="text-sm text-brand-600 hover:text-brand-700 font-medium transition-colors"
          >
            ← Audit a different CV
          </button>
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-xs text-slate-400 leading-relaxed border-t border-slate-100 pt-4">
        AI-generated feedback is for guidance only and does not guarantee employment outcomes.
        Your CV text is sent to Anthropic&apos;s API for processing and is not stored by Spanispace.
      </p>
    </div>
  );
}
