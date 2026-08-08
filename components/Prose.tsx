// The two ways generated course HTML reaches the page. Both are used by server
// components, so there is no client boundary here on purpose.
//
// The content in data/academy.ts is ours, written and generated in this repo,
// never user submitted, which is the only reason setting it as HTML is safe.
// Never point either of these at anything a visitor or a company can type.

export function Prose({ html, className = '' }: { html: string; className?: string }) {
  return (
    <div
      className={`text-slate-600 leading-relaxed ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export function Inline({ html, className = '' }: { html: string; className?: string }) {
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
