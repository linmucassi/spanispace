'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from '../lib/i18n/context';
import { createClient } from '../lib/supabase/client';

const CTASection: React.FC = () => {
  const { t } = useTranslation();
  const [postJobHref, setPostJobHref] = useState<string>('/login');

  useEffect(() => {
    async function resolvePostJobLink() {
      const supabase = createClient();
      if (!supabase) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return; // stays /login

      const { data } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      const role = (data as { role?: string } | null)?.role;
      if (role === 'company' || role === 'admin') {
        setPostJobHref('/company/jobs/new');
      }
      // candidates and others stay on /login so they see the company sign-up prompt
    }
    resolvePostJobLink();
  }, []);

  return (
    <section className="py-20 bg-brand-50">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <h2 className="text-4xl font-bold text-ink-900 mb-4">{t('cta.title')}</h2>
        <p className="text-lg text-ink-600 max-w-2xl mx-auto mb-10">{t('cta.subtitle')}</p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link
            href="/register"
            className="px-8 py-4 bg-brand-600 text-white rounded-2xl font-bold shadow-xl hover:bg-brand-700 transition-all"
          >
            {t('cta.getStarted')}
          </Link>
          <Link
            href={postJobHref}
            className="px-8 py-4 bg-white border border-ink-200 text-ink-900 rounded-2xl font-bold shadow-sm hover:border-brand-300 transition-all"
          >
            {t('cta.postJob')}
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
