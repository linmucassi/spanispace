'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  User,
  FileText,
  BookOpen,
  Sparkles,
  MessageSquare,
  Zap,
  Mail,
  Calendar,
  Wrench,
  Search,
  Briefcase,
  Inbox,
  ChevronDown,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type NavLink = {
  name: string;
  href: string;
  icon: React.ElementType;
  isNew?: boolean;
  // Paths under href that belong to a sibling instead (e.g. /candidate/services
  // vs /candidate/services/hire), so only one item lights up.
  exclude?: string[];
};
type NavGroup = { group: string; icon: React.ElementType; items: NavLink[] };
type NavEntry = NavLink | NavGroup;

// Related pages share a collapsible group (Linda, 20 Oct 2026). A group opens
// by itself when you're on one of its pages.
const nav: NavEntry[] = [
  { name: 'Dashboard', href: '/candidate/dashboard', icon: LayoutDashboard },
  { name: 'Calendar', href: '/candidate/calendar', icon: Calendar, isNew: true },
  { name: 'My Profile', href: '/candidate/profile', icon: User },
  // Studies, not job search, so it stays top-level (Linda, 20 Oct 2026).
  { name: 'Enrollments', href: '/candidate/enrollments', icon: BookOpen },
  {
    group: 'Job search',
    icon: Briefcase,
    items: [
      { name: 'Applications', href: '/candidate/applications', icon: FileText },
      { name: 'Auto-Apply', href: '/candidate/auto-apply', icon: Zap, isNew: true },
      { name: 'AI CV Audit', href: '/candidate/cv-audit', icon: Sparkles, isNew: true },
    ],
  },
  {
    group: 'Inbox',
    icon: Inbox,
    items: [
      { name: 'Messages', href: '/candidate/messages', icon: MessageSquare },
      { name: 'Invitations', href: '/candidate/invites', icon: Mail, isNew: true },
    ],
  },
  {
    group: 'Services',
    icon: Wrench,
    items: [
      // Includes the provider inbox and enrolment; the chat counts as "Services" overall.
      { name: 'My Services', href: '/candidate/services', icon: Wrench, isNew: true, exclude: ['/candidate/services/hire'] },
      { name: 'Hire Services', href: '/candidate/services/hire', icon: Search, isNew: true },
    ],
  },
];

function isGroup(entry: NavEntry): entry is NavGroup {
  return 'group' in entry;
}

function linkActive(item: NavLink, pathname: string): boolean {
  if (item.exclude?.some((p) => pathname === p || pathname.startsWith(p + '/'))) return false;
  return pathname === item.href || pathname.startsWith(item.href + '/');
}

function NavItem({ item, pathname, nested = false }: { item: NavLink; pathname: string; nested?: boolean }) {
  const Icon = item.icon;
  const active = linkActive(item, pathname);
  return (
    <Link
      href={item.href}
      aria-current={active ? 'page' : undefined}
      className={`flex items-center gap-3 rounded-lg text-sm font-medium transition-colors ${nested ? 'pl-11 pr-3 py-2' : 'px-3 py-2.5'} ${
        active ? 'bg-brand-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
      }`}
    >
      {!nested && <Icon className="w-5 h-5 shrink-0" />}
      <span className="flex-1">{item.name}</span>
      {item.isNew && !active && (
        <span className="text-[10px] font-bold bg-brand-500 text-white px-1.5 py-0.5 rounded-full leading-none">NEW</span>
      )}
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
        className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
          containsActive && !open ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
        }`}
      >
        <Icon className="w-5 h-5 shrink-0" />
        <span className="flex-1 text-left">{entry.group}</span>
        {hasNew && !open && <span className="h-1.5 w-1.5 rounded-full bg-brand-400" aria-label="Has new pages" />}
        <ChevronDown className={`w-4 h-4 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
      </button>
      {open && (
        <div id={id} className="mt-1 space-y-1">
          {entry.items.map((item) => <NavItem key={item.href} item={item} pathname={pathname} nested />)}
        </div>
      )}
    </div>
  );
}

export default function CandidateSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [userName, setUserName] = useState<string>('');
  const [loggingOut, setLoggingOut] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    async function fetchProfile() {
      const supabase = createClient();
      if (!supabase) return;

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('candidate_profiles')
        .select('full_name')
        .eq('user_id', user.id)
        .single();

      if (profile?.full_name) {
        setUserName(profile.full_name);
      } else {
        setUserName(user.email?.split('@')[0] ?? 'Candidate');
      }
    }

    fetchProfile();
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    const supabase = createClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    router.push('/login');
  }

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-slate-900 text-white flex items-center justify-between px-4 z-40">
        <Link href="/candidate/dashboard" className="flex items-center">
          <img src="/assets/logo-wordmark.png" alt="Spanispace" className="h-8 w-auto brightness-0 invert" />
        </Link>
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          className="p-2 rounded-lg hover:bg-slate-800"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="md:hidden fixed inset-0 bg-black/50 z-40"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-slate-900 text-white flex flex-col z-50 transition-transform duration-200 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">
          <Link href="/candidate/dashboard" className="flex items-center">
            <img src="/assets/logo-wordmark.png" alt="Spanispace" className="h-10 w-auto brightness-0 invert" />
            <span className="block text-[10px] text-slate-400 uppercase tracking-widest ml-2 mt-1">Candidate</span>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
            className="md:hidden p-1.5 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {nav.map((entry) =>
            isGroup(entry)
              ? <NavGroupItem key={entry.group} entry={entry} pathname={pathname} />
              : <NavItem key={entry.href} item={entry} pathname={pathname} />,
          )}
        </nav>

        {/* User + Logout */}
        <div className="px-4 py-4 border-t border-slate-800 space-y-3">
          {userName && (
            <div className="px-2">
              <p className="text-xs text-slate-400 leading-none">Signed in as</p>
              <p className="text-sm font-medium text-slate-200 truncate mt-1">
                {userName}
              </p>
            </div>
          )}
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-slate-800 hover:text-white transition-colors disabled:opacity-50"
          >
            <LogOut className="w-4 h-4" />
            {loggingOut ? 'Signing out...' : 'Sign Out'}
          </button>
        </div>
      </aside>
    </>
  );
}
