'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  Users,
  Building2,
  LogOut,
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', href: '/company/dashboard', icon: LayoutDashboard },
  { name: 'My Jobs', href: '/company/jobs', icon: Briefcase },
  { name: 'Applications', href: '/company/applications', icon: FileText },
  { name: 'Find Candidates', href: '/company/candidates', icon: Users },
  { name: 'Company Profile', href: '/company/profile', icon: Building2 },
];

export default function CompanySidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [companyName, setCompanyName] = useState<string>('');
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    async function fetchCompany() {
      const supabase = createClient();
      if (!supabase) return;

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data } = await supabase
        .from('company_profiles')
        .select('company_name')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setCompanyName(data.company_name);
      }
    }

    fetchCompany();
  }, []);

  const handleLogout = async () => {
    setSigningOut(true);
    const supabase = createClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    router.push('/login');
  };

  return (
    <aside className="fixed top-0 left-0 h-full w-64 bg-slate-900 text-white flex flex-col z-50">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-800">
        <Link href="/company/dashboard" className="flex items-center gap-2">
          <div className="bg-indigo-600 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm">
            S
          </div>
          <div>
            <span className="font-extrabold tracking-tight text-lg">
              spanispace
            </span>
            <span className="block text-[10px] text-slate-400 uppercase tracking-widest -mt-1">
              Company
            </span>
          </div>
        </Link>
      </div>

      {/* Company Name */}
      {companyName && (
        <div className="px-6 py-3 border-b border-slate-800">
          <p className="text-xs text-slate-400 uppercase tracking-wider mb-0.5">
            Signed in as
          </p>
          <p className="text-sm font-semibold text-white truncate">
            {companyName}
          </p>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-slate-800 space-y-3">
        <Link
          href="/"
          className="block text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          &larr; Back to Site
        </Link>
        <button
          onClick={handleLogout}
          disabled={signingOut}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors disabled:opacity-50"
        >
          <LogOut className="w-4 h-4" />
          {signingOut ? 'Signing out...' : 'Logout'}
        </button>
      </div>
    </aside>
  );
}
