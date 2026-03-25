'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import LanguageToggle from './LanguageToggle';
import { useTranslation } from '../lib/i18n/context';

const Navbar: React.FC = () => {
  const [activeRoute, setActiveRoute] = useState('home');
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '') || 'home';
      setActiveRoute(hash);
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const navItems = [
    { name: t('nav.jobs'), href: '#jobs' },
    { name: t('nav.training'), href: '#training' },
    { name: t('nav.academic'), href: '#academic' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center h-full">
            <div className="relative h-10 w-32 md:h-12 md:w-40">
              <Image
                src="/assets/logo.png"
                alt="Spanispace Logo"
                fill
                priority
                className="object-contain"
              />
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition-colors ${
                  activeRoute === item.href.replace('#', '')
                    ? 'text-indigo-600 font-semibold'
                    : 'text-slate-600 hover:text-indigo-500'
                }`}
              >
                {item.name}
              </a>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-3">
            <LanguageToggle />
            <Link
              href="/post-job"
              className="hidden md:inline-block text-sm font-semibold text-slate-700 hover:text-indigo-600"
            >
              {t('nav.postJob')}
            </Link>
            <Link
              href="/join-waitlist"
              className="hidden md:inline-block bg-indigo-600 text-white px-5 py-2 rounded-full text-sm font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all hover:scale-105"
            >
              {t('nav.enrollNow')}
            </Link>

            {/* Mobile hamburger */}
            <button
              className="md:hidden flex flex-col justify-center items-center w-10 h-10 rounded-lg hover:bg-slate-100 transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            >
              <span
                className={`block w-5 h-0.5 bg-slate-700 transition-all duration-300 ${mobileOpen ? 'rotate-45 translate-y-[3px]' : ''}`}
              />
              <span
                className={`block w-5 h-0.5 bg-slate-700 mt-1 transition-all duration-300 ${mobileOpen ? 'opacity-0' : ''}`}
              />
              <span
                className={`block w-5 h-0.5 bg-slate-700 mt-1 transition-all duration-300 ${mobileOpen ? '-rotate-45 -translate-y-[7px]' : ''}`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white/95 backdrop-blur-md">
          <div className="px-4 py-4 space-y-1">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`block px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  activeRoute === item.href.replace('#', '')
                    ? 'text-indigo-600 bg-indigo-50 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-indigo-500'
                }`}
              >
                {item.name}
              </a>
            ))}
            <div className="pt-3 mt-3 border-t border-slate-100 flex flex-col gap-2">
              <Link
                href="/post-job"
                onClick={() => setMobileOpen(false)}
                className="text-sm font-semibold text-slate-700 hover:text-indigo-600 py-2 px-4"
              >
                {t('nav.postJob')}
              </Link>
              <Link
                href="/join-waitlist"
                onClick={() => setMobileOpen(false)}
                className="bg-indigo-600 text-white px-5 py-3 rounded-full text-sm font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all text-center"
              >
                {t('nav.enrollNow')}
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
