'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslation } from '../lib/i18n/context';
import { createClient } from '../lib/supabase/client';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check auth state for conditional sign-in link
  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;

    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session?.user);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setNewsletterStatus('loading');

    try {
      const supabase = createClient();
      if (!supabase) {
        setNewsletterStatus('error');
        return;
      }

      const { error } = await supabase
        .from('newsletter')
        .insert({ email: email.trim() });

      if (error) {
        // Handle duplicate email gracefully
        if (error.code === '23505') {
          setNewsletterStatus('success');
          setEmail('');
          return;
        }
        setNewsletterStatus('error');
        return;
      }

      setNewsletterStatus('success');
      setEmail('');
    } catch {
      setNewsletterStatus('error');
    }
  };

  return (
    <footer className="bg-slate-900 text-slate-400 py-12 px-4 mb-20 md:mb-0">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="col-span-1 md:col-span-1">
          <div className="flex items-center space-x-2 mb-6">
            <div className="bg-indigo-600 w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold">
              S
            </div>
            <span className="text-xl font-extrabold text-white tracking-tight italic">
              spanispace
            </span>
          </div>
          <p className="text-sm leading-relaxed">{t('footer.tagline')}</p>
        </div>
        <div>
          <h4 className="text-white font-bold mb-6">{t('footer.platform')}</h4>
          <ul className="space-y-4 text-sm">
            <li>
              <a href="#jobs" className="hover:text-white transition-colors">
                {t('footer.jobBoard')}
              </a>
            </li>
            <li>
              <a href="#training" className="hover:text-white transition-colors">
                {t('footer.trainingPortal')}
              </a>
            </li>
            <li>
              <a href="#academic" className="hover:text-white transition-colors">
                {t('footer.academicUpdates')}
              </a>
            </li>
            <li>
              <Link href="/events" className="hover:text-white transition-colors">
                Events
              </Link>
            </li>
            {!isLoggedIn && (
              <li>
                <Link href="/login" className="hover:text-white transition-colors">
                  Sign In
                </Link>
              </li>
            )}
          </ul>
        </div>
        <div>
          <h4 className="text-white font-bold mb-6">{t('footer.companyLabel')}</h4>
          <ul className="space-y-4 text-sm">
            <li>
              <a href="#" className="hover:text-white transition-colors">
                {t('footer.aboutUs')}
              </a>
            </li>
            <li>
              <a href="#" className="hover:text-white transition-colors">
                {t('footer.partnerships')}
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-bold mb-6">{t('footer.getNotified')}</h4>
          <p className="text-sm mb-4">{t('footer.newsletterText')}</p>
          <form onSubmit={handleNewsletter} className="flex">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="bg-slate-800 border-none rounded-l-xl px-4 py-2 w-full focus:ring-1 focus:ring-indigo-500 outline-none text-white"
            />
            <button
              type="submit"
              disabled={newsletterStatus === 'loading'}
              className="bg-indigo-600 text-white px-4 py-2 rounded-r-xl hover:bg-indigo-700 transition-colors font-bold disabled:opacity-50"
            >
              {newsletterStatus === 'loading' ? '...' : t('footer.join')}
            </button>
          </form>
          {newsletterStatus === 'success' && (
            <p className="text-green-400 text-xs mt-2">Subscribed!</p>
          )}
          {newsletterStatus === 'error' && (
            <p className="text-red-400 text-xs mt-2">Failed. Try again.</p>
          )}
        </div>
      </div>
      <div className="max-w-7xl mx-auto border-t border-slate-800 mt-12 pt-8 flex flex-col md:flex-row justify-between text-xs font-medium uppercase tracking-widest gap-4">
        <p>
          &copy; {currentYear} SPANISPACE. {t('footer.allRightsReserved')}
        </p>
        <div className="flex space-x-6">
          <Link href="/privacy" className="hover:text-white transition-colors">
            {t('footer.privacy')}
          </Link>
          <Link href="/terms" className="hover:text-white transition-colors">
            {t('footer.terms')}
          </Link>
        </div>
      </div>
     
    </footer>
  );
};

export default Footer;
