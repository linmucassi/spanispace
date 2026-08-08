import Link from 'next/link';

export default function CVAuditBanner() {
  return (
    <div className="bg-gradient-to-r from-brand-600 to-violet-600 py-5 px-4">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex-shrink-0 h-9 w-9 rounded-full bg-white/20 flex items-center justify-center text-lg">
            ✨
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white font-semibold text-sm">AI-Driven CV Audit</span>
              <span className="px-2 py-0.5 bg-white/20 text-white text-[10px] font-bold rounded-full uppercase tracking-wide">
                New
              </span>
            </div>
            <p className="text-brand-100 text-xs mt-0.5">
              Get instant feedback on your CV from our AI career coach — tailored for the South African job market.
            </p>
          </div>
        </div>
        <Link
          href="/candidate/cv-audit"
          className="flex-shrink-0 px-5 py-2.5 bg-white text-brand-700 text-sm font-bold rounded-xl hover:bg-brand-50 transition-colors shadow-sm"
        >
          Audit My CV
        </Link>
      </div>
    </div>
  );
}
