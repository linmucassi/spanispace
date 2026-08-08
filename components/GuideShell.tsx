import Link from 'next/link';
import T from './T';

/**
 * The frame every reference page shares: where you are, the way back, and one
 * sentence of context. Kept in one place so five guides cannot drift apart.
 */
export default function GuideShell({
  title,
  lede,
  children,
}: {
  title: string;
  lede: string;
  children: React.ReactNode;
}) {
  return (
    <div className="pt-16">
      <section className="bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-4 py-12 md:py-14">
          <Link
            href="/training"
            className="text-sm text-slate-400 hover:text-white transition-colors"
          >
            &larr; <T k="course.back" />
          </Link>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mt-4">{title}</h1>
          <p className="text-slate-300 mt-3 max-w-2xl">{lede}</p>
        </div>
      </section>
      <section className="max-w-4xl mx-auto px-4 py-10 md:py-14">{children}</section>
    </div>
  );
}
