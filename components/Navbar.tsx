'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import LanguageToggle from './LanguageToggle';
import { useTranslation } from '../lib/i18n/context';
import { createClient } from '../lib/supabase/client';

type UserRole = 'candidate' | 'company' | 'admin' | null;

const Navbar: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auth state management
  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;

    const fetchRole = async (userId: string) => {
      const { data } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();
      setUserRole((data?.role as UserRole) || 'candidate');
    };

    // Check initial auth state
    supabase.auth.getUser().then(({ data: { user: currentUser } }) => {
      if (currentUser) {
        setUser({ id: currentUser.id, email: currentUser.email ?? undefined });
        fetchRole(currentUser.id);
      }
    });

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email ?? undefined });
        fetchRole(session.user.id);
      } else {
        setUser(null);
        setUserRole(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
    setUserRole(null);
    setDropdownOpen(false);
    setMobileOpen(false);
    router.push('/');
  };

  const getUserInitial = (): string => {
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return 'U';
  };

  const getDashboardHref = (): string => {
    switch (userRole) {
      case 'admin':
        return '/admin/dashboard';
      case 'company':
        return '/company/dashboard';
      case 'candidate':
      default:
        return '/candidate/dashboard';
    }
  };

  const getDashboardLabel = (): string => {
    if (userRole === 'admin') return 'Admin';
    return 'Dashboard';
  };

  // Four items, one meaning each. Training holds everything you learn, courses,
  // bootcamps and certificates. University holds the deadlines you apply to.
  // The old Academy and Academic entries said the same thing three ways.
  const navItems = [
    { name: t('nav.jobs'), href: '/jobs' },
    { name: t('nav.services'), href: '/piecejobs' },
    { name: t('nav.training'), href: '/training' },
    { name: t('nav.university'), href: '/university' },
    { name: t('nav.events'), href: '/events' },
  ];

  return (
    // A floating frosted pill (21 Oct 2026, the soft-UI redesign from
    // docs/dashboard ui). It replaced a solid white bar with a hairline rule,
    // which had in turn replaced a generic .glass-card; this one is opaque
    // enough (white at 80%) that the dark logo mark stays crisp on scroll.
    <nav className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-4">
      <div className="panel-glass mx-auto max-w-7xl rounded-full px-3 sm:px-4">
        <div className="flex h-14 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex h-full items-center pl-2">
            <img
              src="/assets/logo-wordmark.png"
              alt="Spanispace Logo"
              className="h-7 w-auto"
            />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden items-center gap-1 rounded-full bg-ink-100/60 p-1 md:flex">
            {navItems.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                    active ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-900'
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <LanguageToggle />
            {/* Auth-dependent actions */}
            {user ? (
              <>
                {(userRole === 'company' || userRole === 'admin') && (
                  <Link
                    href="/post-job"
                    className="hidden md:inline-block text-sm font-semibold text-ink-700 hover:text-brand-600 transition-colors"
                  >
                    {t('nav.postJob')}
                  </Link>
                )}
                <Link
                  href={getDashboardHref()}
                  className="hidden md:inline-block text-sm font-semibold text-ink-700 hover:text-brand-600 transition-colors"
                >
                  {getDashboardLabel()}
                </Link>
                <div className="relative hidden md:block" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-700 ring-2 ring-white transition-colors hover:bg-brand-100"
                    aria-label="User menu"
                  >
                    {getUserInitial()}
                  </button>
                  {dropdownOpen && (
                    <div className="absolute right-0 z-50 mt-3 w-52 rounded-3xl border border-white bg-white p-2 shadow-xl">
                      <div className="px-4 py-2 border-b border-ink-100">
                        <p className="text-xs text-ink-500 truncate">{user.email}</p>
                      </div>
                      <Link
                        href={getDashboardHref()}
                        onClick={() => setDropdownOpen(false)}
                        className="block rounded-xl px-3 py-2 text-sm text-ink-700 transition-colors hover:bg-ink-50"
                      >
                        {getDashboardLabel()}
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="block w-full rounded-xl px-3 py-2 text-left text-sm text-ink-700 transition-colors hover:bg-ink-50"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden md:inline-block text-sm font-semibold text-ink-700 hover:text-brand-600 transition-colors"
                >
                  {t('nav.login')}
                </Link>
                <Link
                  href="/register"
                  className="hidden md:inline-block rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-brand-600/25 transition-colors hover:bg-brand-700"
                >
                  Get Started
                </Link>
              </>
            )}

            {/* Mobile hamburger */}
            <button
              className="flex h-10 w-10 flex-col items-center justify-center rounded-full transition-colors hover:bg-ink-100 md:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            >
              <span
                className={`block w-5 h-0.5 bg-ink-700 transition-all duration-300 ${mobileOpen ? 'rotate-45 translate-y-[3px]' : ''}`}
              />
              <span
                className={`block w-5 h-0.5 bg-ink-700 mt-1 transition-all duration-300 ${mobileOpen ? 'opacity-0' : ''}`}
              />
              <span
                className={`block w-5 h-0.5 bg-ink-700 mt-1 transition-all duration-300 ${mobileOpen ? '-rotate-45 -translate-y-[7px]' : ''}`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="panel mx-auto mt-2 max-w-7xl md:hidden">
          <div className="space-y-1 p-3">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-3 rounded-xl text-sm font-medium text-ink-600 hover:bg-ink-50 hover:text-brand-500 transition-colors"
              >
                {item.name}
              </Link>
            ))}
            <div className="pt-3 mt-3 border-t border-ink-100 flex flex-col gap-2">
              {user && (userRole === 'company' || userRole === 'admin') && (
                <Link
                  href="/post-job"
                  onClick={() => setMobileOpen(false)}
                  className="text-sm font-semibold text-ink-700 hover:text-brand-600 py-2 px-4"
                >
                  {t('nav.postJob')}
                </Link>
              )}

              {user ? (
                <>
                  <Link
                    href={getDashboardHref()}
                    onClick={() => setMobileOpen(false)}
                    className="text-sm font-semibold text-ink-700 hover:text-brand-600 py-2 px-4"
                  >
                    {getDashboardLabel()}
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="text-sm font-semibold text-ink-700 hover:text-brand-600 py-2 px-4 text-left"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="text-sm font-semibold text-ink-700 hover:text-brand-600 py-2 px-4"
                  >
                    {t('nav.login')}
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileOpen(false)}
                    className="bg-brand-600 text-white px-5 py-3 rounded-full text-sm font-bold shadow-lg shadow-brand-100 hover:bg-brand-700 transition-all text-center"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
