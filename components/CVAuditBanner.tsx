import Link from 'next/link';

/**
 * Three tells lived in this one strip: a sparkle emoji, an em dash, and a blue
 * to violet gradient. Sparkles are the universal shorthand for "an AI wrote
 * this", the dash breaks house rule one, and violet is nowhere in the logo.
 *
 * A document mark instead of the sparkle, brand blue instead of the gradient,
 * and the sentence split at the full stop.
 */
export default function CVAuditBanner() {
  return (
    <div className="bg-brand-600 py-5 px-4">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex-shrink-0 h-9 w-9 rounded-lg bg-white/15 flex items-center justify-center">
            <svg viewBox="0 0 20 20" className="h-4 w-4 fill-white" aria-hidden>
              <path d="M4 1h8l4 4v14H4zm8 1.5V6h3.5zM6.5 10h7v1.4h-7zm0 3h7v1.4h-7z" />
            </svg>
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white font-semibold text-sm">AI CV Audit</span>
              <span className="px-2 py-0.5 bg-white/20 text-white text-[10px] font-bold rounded uppercase tracking-wide">
                New
              </span>
            </div>
            <p className="text-brand-100 text-xs mt-0.5">
              Instant feedback on your CV, written for the South African job market.
            </p>
          </div>
        </div>
        <Link
          href="/candidate/cv-audit"
          className="flex-shrink-0 px-5 py-2.5 bg-white text-brand-700 text-sm font-bold rounded-xl hover:bg-brand-50 transition-colors"
        >
          Audit My CV
        </Link>
      </div>
    </div>
  );
}
