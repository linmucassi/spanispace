
'use client';

import React, { useState, useEffect } from 'react';

const Navbar: React.FC = () => {
  const [activeRoute, setActiveRoute] = useState('home');

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '') || 'home';
      setActiveRoute(hash);
    };
    window.addEventListener('hashchange', handleHash);
    handleHash();
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
          <a href="#home" className="flex items-center space-x-2 cursor-pointer">
            <div className="bg-indigo-600 w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold">S</div>
            <span className="text-xl font-extrabold tracking-tight text-slate-900 italic">spani<span className="text-indigo-600">space</span></span>
          </a>
          
          <div className="hidden md:flex space-x-8">
            {navItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className={`text-sm font-medium transition-colors ${
                  activeRoute === item.href.replace('#', '') 
                  ? 'text-indigo-600' 
                  : 'text-slate-600 hover:text-indigo-500'
                }`}
              >
                {item.name}
              </a>
            ))}
          </div>

          <div className="flex items-center space-x-4">
            <button className="text-sm font-semibold text-slate-700 hover:text-indigo-600">Login</button>
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
