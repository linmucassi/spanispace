'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link'; // ← Use Next.js Link for better perf (even with hash)

const Navbar: React.FC = () => {
  const [activeRoute, setActiveRoute] = useState('home');

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '') || 'home';
      setActiveRoute(hash);
    };

    // Run once on mount + on hash change
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const navItems = [
    { name: 'Jobs', href: '#jobs' },
    { name: 'Training', href: '#training' },
    { name: 'Academic', href: '#academic' },
    { name: 'Success Stories', href: '#success-stories' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center h-full">  {/* Use Link for better Next.js routing */}
  <div className="relative h-10 w-32 md:h-12 md:w-40">  {/* ← Add explicit width: w-32 = 128px, adjust to your logo's natural scale */}
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
          <div className="hidden md:flex space-x-8">
            {navItems.map((item) => (
              <a
                key={item.name}
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
          <div className="flex items-center space-x-4">
            <button className="text-sm font-semibold text-slate-700 hover:text-indigo-600">
              Login
            </button>
            <button className="bg-indigo-600 text-white px-5 py-2 rounded-full text-sm font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all hover:scale-105">
              Enroll Now
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;