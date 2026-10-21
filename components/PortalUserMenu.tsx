'use client';

/**
 * Top-right profile menu in every portal (candidate, company, admin), so you
 * can get back to the public site from anywhere in a dashboard (Linda,
 * 20 Oct 2026). Shows the person's picture (candidate avatar, company logo,
 * or initials) and a dropdown: Home, the main site sections, this portal's
 * dashboard and profile, and Sign out.
 */

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Briefcase, CalendarDays, ChevronDown, GraduationCap, Hammer, Home, LayoutDashboard, LogOut, School, User } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import { createClient } from '@/lib/supabase/client';
import { usePortalIdentity, type Portal } from '@/lib/portal/usePortalIdentity';

const SITE_LINKS = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Jobs', href: '/jobs', icon: Briefcase },
  { name: 'PieceJobs', href: '/piecejobs', icon: Hammer },
  { name: 'Training', href: '/training', icon: GraduationCap },
  { name: 'University', href: '/university', icon: School },
  { name: 'Events', href: '/events', icon: CalendarDays },
];

const PORTAL_LINKS: Record<Portal, { dashboard: string; profile: string | null; profileLabel: string }> = {
  candidate: { dashboard: '/candidate/dashboard', profile: '/candidate/profile', profileLabel: 'My profile' },
  company: { dashboard: '/company/dashboard', profile: '/company/profile', profileLabel: 'Company profile' },
  admin: { dashboard: '/admin/dashboard', profile: null, profileLabel: '' },
};

export default function PortalUserMenu({ portal, tone = 'light' }: { portal: Portal; tone?: 'light' | 'dark' }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { name, picture, email } = usePortalIdentity(portal);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close on outside click and Escape (links close it on click).
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!rootRef.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpen(false); buttonRef.current?.focus(); } };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  async function signOut() {
    const supabase = createClient();
    if (supabase) await supabase.auth.signOut();
    router.push('/login');
  }

  const links = PORTAL_LINKS[portal];
  const itemClass = 'flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-slate-900';

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(!open)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account and site menu"
        className={`flex items-center gap-2 rounded-full p-1 transition-colors ${
          tone === 'dark' ? 'pr-2 hover:bg-slate-800 text-white' : 'pr-3 bg-white border border-white hover:border-ink-200 text-ink-700 shadow-sm'
        }`}
      >
        {name ? <Avatar key={picture ?? 'none'} src={picture} name={name} size="sm" /> : <span className="h-8 w-8 rounded-full bg-slate-200" aria-hidden />}
        {tone === 'light' && name && <span className="hidden lg:block max-w-[10rem] truncate text-sm font-semibold">{name}</span>}
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
      </button>

      {open && (
        <div role="menu" className="absolute right-0 z-50 mt-2 w-64 rounded-3xl border border-white bg-white p-2 shadow-xl">
          <div className="px-3 py-2 border-b border-slate-100 mb-1">
            <p className="text-sm font-semibold text-slate-900 truncate">{name}</p>
            {email && <p className="text-xs text-slate-500 truncate">{email}</p>}
          </div>
          {SITE_LINKS.map(({ name: label, href, icon: Icon }) => (
            <Link key={href} href={href} role="menuitem" onClick={() => setOpen(false)} className={itemClass}>
              <Icon className="h-4 w-4 text-slate-400" aria-hidden /> {label}
            </Link>
          ))}
          <div className="my-1 border-t border-slate-100" />
          <Link href={links.dashboard} role="menuitem" onClick={() => setOpen(false)} className={itemClass}>
            <LayoutDashboard className="h-4 w-4 text-slate-400" aria-hidden /> Dashboard
          </Link>
          {links.profile && (
            <Link href={links.profile} role="menuitem" onClick={() => setOpen(false)} className={itemClass}>
              <User className="h-4 w-4 text-slate-400" aria-hidden /> {links.profileLabel}
            </Link>
          )}
          <button type="button" role="menuitem" onClick={signOut} className={`${itemClass} w-full text-left`}>
            <LogOut className="h-4 w-4 text-slate-400" aria-hidden /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}
