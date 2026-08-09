'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
    { name: t('nav.training'), href: '/training' },
    { name: t('nav.university'), href: '/university' },
    { name: t('nav.events'), href: '/events' },
  ];

  return (
    // Was .glass-card, an 80% white backdrop-blur panel. Glassmorphism is one of
    // the trend tells that makes a generated template look like every other
    // generated template, and it made the dark logo mark muddy on scroll. Solid
    // white with a single hairline rule instead.
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-ink-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center h-full">
            <img
              src="/assets/logo-wordmark.png"
              alt="Spanispace Logo"
              className="h-7 w-auto md:h-8 transition-transform hover:scale-105"
            />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-ink-600 hover:text-brand-500 transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-3">
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
                    className="w-9 h-9 rounded-full bg-brand-600 text-white flex items-center justify-center text-sm font-bold hover:bg-brand-700 transition-colors"
                    aria-label="User menu"
                  >
                    {getUserInitial()}
                  </button>
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-ink-200 py-2 z-50">
                      <div className="px-4 py-2 border-b border-ink-100">
                        <p className="text-xs text-ink-500 truncate">{user.email}</p>
                      </div>
                      <Link
                        href={getDashboardHref()}
                        onClick={() => setDropdownOpen(false)}
                        className="block px-4 py-2 text-sm text-ink-700 hover:bg-ink-50 transition-colors"
                      >
                        {getDashboardLabel()}
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="block w-full text-left px-4 py-2 text-sm text-ink-700 hover:bg-ink-50 transition-colors"
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
                  className="hidden md:inline-block bg-brand-600 text-white px-5 py-2 rounded-full text-sm font-bold shadow-lg shadow-brand-100 hover:bg-brand-700 transition-all hover:scale-105"
                >
                  Get Started
                </Link>
              </>
            )}

            {/* Mobile hamburger */}
            <button
              className="md:hidden flex flex-col justify-center items-center w-10 h-10 rounded-lg hover:bg-ink-100 transition-colors"
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
        <div className="md:hidden border-t border-ink-200 bg-white/95 backdrop-blur-md">
          <div className="px-4 py-4 space-y-1">
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
