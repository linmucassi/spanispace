'use client';

/**
 * The one sidebar behind all three portals (21 Oct 2026, from the soft-UI
 * references in docs/dashboard ui). A floating white panel with labelled
 * sections, a brand pill plus side marker for the active page, collapsible
 * groups drawn as a tree, and a second small panel underneath for the person
 * signed in, "Back to site" and Sign out. On phones it is a drawer behind a
 * light top bar that also holds the profile menu.
 *
 * Each portal's sidebar file only declares its nav, because icons are
 * components and can't cross from a server layout into a client component.
 */

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft, ChevronDown, LogOut, Menu, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Avatar from '@/components/ui/Avatar';
import PortalUserMenu from '@/components/PortalUserMenu';
import { usePortalIdentity, type Portal } from '@/lib/portal/usePortalIdentity';

export type NavLink = {
  name: string;
  href: string;
  icon: React.ElementType;
  isNew?: boolean;
  // Paths under href that belong to a sibling instead (e.g. /candidate/piecejobs
  // vs /candidate/piecejobs/hire), so only one item lights up.
  exclude?: string[];
};
export type NavGroup = { group: string; icon: React.ElementType; items: NavLink[] };
export type NavEntry = NavLink | NavGroup;
export type NavSection = { label?: string; entries: NavEntry[] };

function isGroup(entry: NavEntry): entry is NavGroup {
  return 'group' in entry;
}

function linkActive(item: NavLink, pathname: string): boolean {
  if (item.exclude?.some((p) => pathname === p || pathname.startsWith(p + '/'))) return false;
  return pathname === item.href || pathname.startsWith(item.href + '/');
}

function NewBadge() {
  return <span className="rounded-full bg-brand-50 px-1.5 py-0.5 text-[10px] font-bold leading-none text-brand-600">NEW</span>;
}

function NavItem({ item, pathname, nested = false }: { item: NavLink; pathname: string; nested?: boolean }) {
  const Icon = item.icon;
  const active = linkActive(item, pathname);
  return (
    <Link
      href={item.href}
      aria-current={active ? 'page' : undefined}
      className={`relative flex items-center gap-3 rounded-xl text-sm transition-colors ${nested ? 'px-3 py-2' : 'px-3 py-2.5'} ${
        active ? 'bg-brand-50 font-semibold text-brand-700' : 'font-medium text-ink-500 hover:bg-ink-50 hover:text-ink-900'
      }`}
    >
      {active && !nested && <span className="absolute -left-3 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-brand-500" aria-hidden />}
      {!nested && <Icon className={`h-[18px] w-[18px] shrink-0 ${active ? 'text-brand-600' : 'text-ink-400'}`} aria-hidden />}
      <span className="flex-1 truncate">{item.name}</span>
      {item.isNew && !active && <NewBadge />}
    </Link>
  );
}

function NavGroupItem({ entry, pathname }: { entry: NavGroup; pathname: string }) {
  const containsActive = entry.items.some((item) => linkActive(item, pathname));
  // null = follow the route; true/false = the person toggled it.
  const [toggled, setToggled] = useState<boolean | null>(null);
  const open = toggled ?? containsActive;
  const Icon = entry.icon;
  const id = `nav-group-${entry.group.toLowerCase().replace(/\W+/g, '-')}`;
  const hasNew = entry.items.some((item) => item.isNew);
  return (
    <div>
      <button
        type="button"
        onClick={() => setToggled(!open)}
        aria-expanded={open}
        aria-controls={id}
        className={`relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
          containsActive ? 'font-semibold text-ink-900' : 'font-medium text-ink-500 hover:bg-ink-50 hover:text-ink-900'
        }`}
      >
        {containsActive && !open && <span className="absolute -left-3 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-brand-500" aria-hidden />}
        <Icon className={`h-[18px] w-[18px] shrink-0 ${containsActive ? 'text-brand-600' : 'text-ink-400'}`} aria-hidden />
        <span className="flex-1 text-left">{entry.group}</span>
        {hasNew && !open && <span className="h-1.5 w-1.5 rounded-full bg-brand-500" aria-label="Has new pages" />}
        <ChevronDown className={`h-4 w-4 shrink-0 text-ink-300 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
      </button>
      {open && (
        <div id={id} className="ml-[1.3rem] mt-1 space-y-1 border-l border-ink-100 pl-3">
          {entry.items.map((item) => <NavItem key={item.href} item={item} pathname={pathname} nested />)}
        </div>
      )}
    </div>
  );
}

export default function PortalSidebar({
  portal,
  label,
  homeHref,
  sections,
}: {
  portal: Portal;
  /** Shown next to the logo, e.g. "Candidate". */
  label: string;
  homeHref: string;
  sections: NavSection[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { name, email, picture } = usePortalIdentity(portal);
  // The drawer remembers the page it was opened on, so navigating closes it.
  const [openedOn, setOpenedOn] = useState<string | null>(null);
  const mobileOpen = openedOn === pathname;
  const setMobileOpen = (open: boolean) => setOpenedOn(open ? pathname : null);
  const [signingOut, setSigningOut] = useState(false);

  async function signOut() {
    setSigningOut(true);
    const supabase = createClient();
    if (supabase) await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <>
      {/* Phone top bar */}
      <div className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b border-white/80 bg-white/80 px-4 backdrop-blur-xl md:hidden">
        <Link href={homeHref} className="flex items-center gap-2">
          <img src="/assets/logo-wordmark.png" alt="Spanispace" className="h-7 w-auto" />
        </Link>
        <div className="flex items-center gap-1">
          <PortalUserMenu portal={portal} />
          <button onClick={() => setMobileOpen(true)} aria-label="Open menu" className="rounded-xl p-2 text-ink-600 hover:bg-ink-100">
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {mobileOpen && <div onClick={() => setMobileOpen(false)} className="fixed inset-0 z-40 bg-ink-900/30 backdrop-blur-sm md:hidden" />}

      <aside
        className={`fixed bottom-3 left-3 top-3 z-50 flex w-64 flex-col gap-3 transition-transform duration-200 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-[calc(100%+1rem)] md:translate-x-0'
        }`}
      >
        {/* Main panel */}
        <div className="panel flex min-h-0 flex-1 flex-col">
          <div className="flex items-center justify-between px-5 pb-3 pt-5">
            <Link href={homeHref} className="flex items-center gap-2">
              <img src="/assets/logo-wordmark.png" alt="Spanispace" className="h-8 w-auto" />
              <span className="mt-1 rounded-full bg-ink-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-ink-400">{label}</span>
            </Link>
            <button onClick={() => setMobileOpen(false)} aria-label="Close menu" className="rounded-lg p-1.5 text-ink-500 hover:bg-ink-100 md:hidden">
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-4 pt-2">
            {sections.map((section, i) => (
              <div key={section.label ?? i}>
                {section.label && (
                  <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-ink-300">{section.label}</p>
                )}
                <div className="space-y-1">
                  {section.entries.map((entry) =>
                    isGroup(entry)
                      ? <NavGroupItem key={entry.group} entry={entry} pathname={pathname} />
                      : <NavItem key={entry.href} item={entry} pathname={pathname} />,
                  )}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Account panel */}
        <div className="panel p-2">
          {name && (
            <div className="flex items-center gap-3 rounded-2xl bg-ink-50/70 px-3 py-2.5">
              <Avatar key={picture ?? 'none'} src={picture} name={name} size="sm" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink-900">{name}</p>
                {email && <p className="truncate text-xs text-ink-400">{email}</p>}
              </div>
            </div>
          )}
          <div className="mt-1 grid grid-cols-2 gap-1">
            <Link href="/" className="flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-ink-500 hover:bg-ink-50 hover:text-ink-900">
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden /> Site
            </Link>
            <button
              onClick={signOut}
              disabled={signingOut}
              className="flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold text-ink-500 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
            >
              <LogOut className="h-3.5 w-3.5" aria-hidden /> {signingOut ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
