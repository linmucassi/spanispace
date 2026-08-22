'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface CalendarItem {
  id: string;
  date: string; // ISO datetime
  label: string;
  sublabel?: string;
  color: 'brand' | 'green' | 'amber' | 'slate';
  href?: string;
}

const DOT_COLORS: Record<CalendarItem['color'], string> = {
  brand: 'bg-brand-500',
  green: 'bg-green-500',
  amber: 'bg-amber-500',
  slate: 'bg-slate-400',
};

const BADGE_COLORS: Record<CalendarItem['color'], string> = {
  brand: 'bg-brand-50 text-brand-700 border-brand-100',
  green: 'bg-green-50 text-green-700 border-green-100',
  amber: 'bg-amber-50 text-amber-700 border-amber-100',
  slate: 'bg-slate-50 text-slate-600 border-slate-200',
};

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Hand-rolled month grid -- plain date math, no calendar library, matching
// this codebase's existing preference for hand-rolled UI over adding
// dependencies for something this contained.
export default function CalendarView({ items }: { items: CalendarItem[] }) {
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const byDay = useMemo(() => {
    const map = new Map<string, CalendarItem[]>();
    for (const item of items) {
      const key = ymd(new Date(item.date));
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return map;
  }, [items]);

  const monthLabel = cursor.toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' });

  const cells = useMemo(() => {
    const firstOfMonth = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const startWeekday = firstOfMonth.getDay(); // 0=Sun
    const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const out: (Date | null)[] = [];
    for (let i = 0; i < startWeekday; i++) out.push(null);
    for (let d = 1; d <= daysInMonth; d++) out.push(new Date(cursor.getFullYear(), cursor.getMonth(), d));
    return out;
  }, [cursor]);

  const today = ymd(new Date());

  const upcoming = useMemo(
    () =>
      items
        .filter((i) => new Date(i.date) >= new Date(new Date().setHours(0, 0, 0, 0)))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 10),
    [items],
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <button
            type="button"
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <p className="font-bold text-slate-900">{monthLabel}</p>
          <button
            type="button"
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
            aria-label="Next month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-slate-400 uppercase mb-1">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => <div key={d}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((date, i) => {
            if (!date) return <div key={i} className="aspect-square" />;
            const key = ymd(date);
            const dayItems = byDay.get(key) ?? [];
            const isToday = key === today;
            return (
              <div
                key={i}
                className={`aspect-square rounded-lg border p-1 flex flex-col ${isToday ? 'border-brand-400 bg-brand-50/50' : 'border-slate-100'}`}
              >
                <span className={`text-xs ${isToday ? 'font-bold text-brand-700' : 'text-slate-500'}`}>{date.getDate()}</span>
                <div className="flex flex-wrap gap-0.5 mt-auto">
                  {dayItems.slice(0, 4).map((item) => (
                    <span key={item.id} className={`w-1.5 h-1.5 rounded-full ${DOT_COLORS[item.color]}`} title={item.label} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <p className="font-bold text-slate-900 mb-3">Upcoming</p>
        {upcoming.length === 0 ? (
          <p className="text-sm text-slate-400">Nothing scheduled.</p>
        ) : (
          <div className="space-y-2">
            {upcoming.map((item) => {
              const content = (
                <div className={`rounded-xl border px-3 py-2.5 ${BADGE_COLORS[item.color]}`}>
                  <p className="text-sm font-semibold">{item.label}</p>
                  <p className="text-xs opacity-80">
                    {new Date(item.date).toLocaleString('en-ZA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    {item.sublabel ? ` · ${item.sublabel}` : ''}
                  </p>
                </div>
              );
              return item.href ? (
                <Link key={item.id} href={item.href} className="block hover:opacity-80 transition-opacity">
                  {content}
                </Link>
              ) : (
                <div key={item.id}>{content}</div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
