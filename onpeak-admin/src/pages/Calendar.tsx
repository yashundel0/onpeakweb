import { useState, useMemo } from 'react';
import type { useAdminData } from '@/hooks/useAdminData';
import type { Booking } from '@/lib/types';
import { fmtTime, fmtDate, statusBadgeClass } from '@/lib/utils';
import { navigate } from '@/lib/router';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';

type AdminData = ReturnType<typeof useAdminData>;
type View = 'day' | 'week' | 'month';

export default function Calendar({ adminData }: { adminData: AdminData }) {
  const { bookings, courts, locName, courtName, sportName } = adminData;
  const [view, setView] = useState<View>('week');
  const [cursor, setCursor] = useState(new Date());

  const filtered = useMemo(() => {
    return bookings.filter((b) => b.booking_status !== 'cancelled');
  }, [bookings]);

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold text-brand-cream">Calendar</h2>
          <p className="text-sm text-brand-cream/40">View all bookings across locations</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} className="flex h-8 w-8 items-center justify-center rounded-lg border border-brand-mid/30 text-brand-cream/60 hover:bg-brand-mid/30"><ChevronLeft className="h-4 w-4" /></button>
          <span className="min-w-[140px] text-center text-sm font-semibold text-brand-cream">
            {cursor.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
          </span>
          <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} className="flex h-8 w-8 items-center justify-center rounded-lg border border-brand-mid/30 text-brand-cream/60 hover:bg-brand-mid/30"><ChevronRight className="h-4 w-4" /></button>
          <button onClick={() => setCursor(new Date())} className="rounded-lg border border-brand-mid/30 px-3 py-1 text-xs font-semibold text-brand-cream/60 hover:bg-brand-mid/30">Today</button>
        </div>
        <div className="flex gap-1 rounded-xl border border-brand-mid/30 p-1">
          {(['day', 'week', 'month'] as View[]).map((v) => (
            <button key={v} onClick={() => setView(v)} className={`rounded-lg px-3 py-1 text-xs font-semibold capitalize ${view === v ? 'bg-brand-accent text-brand-deepest' : 'text-brand-cream/60 hover:bg-brand-mid/30'}`}>{v}</button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mb-4 flex flex-wrap gap-3 text-xs">
        {[
          { label: 'Pending', cls: 'bg-yellow-400/80' },
          { label: 'Confirmed', cls: 'bg-green-400/80' },
          { label: 'Completed', cls: 'bg-brand-accent' },
          { label: 'Cancelled', cls: 'bg-red-400/80' },
          { label: 'No-show', cls: 'bg-orange-400/80' },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-full ${s.cls}`} />
            <span className="text-brand-cream/50">{s.label}</span>
          </div>
        ))}
      </div>

      {view === 'day' && <DayView date={cursor} bookings={filtered} courtName={courtName} sportName={sportName} />}
      {view === 'week' && <WeekView cursor={cursor} bookings={filtered} courtName={courtName} sportName={sportName} />}
      {view === 'month' && <MonthView cursor={cursor} bookings={filtered} />}
    </div>
  );
}

function DayView({ date, bookings, courtName, sportName }: { date: Date; bookings: Booking[]; courtName: (id: string) => string; sportName: (id: string) => string }) {
  const iso = date.toISOString().slice(0, 10);
  const dayBookings = bookings.filter((b) => b.booking_date === iso).sort((a, b) => a.start_time.localeCompare(b.start_time));

  return (
    <div className="op-card p-5">
      <h3 className="mb-4 text-sm font-bold text-brand-cream">{date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</h3>
      {dayBookings.length === 0 ? (
        <p className="py-8 text-center text-sm text-brand-cream/40">No bookings for this day.</p>
      ) : (
        <div className="space-y-2">
          {dayBookings.map((b) => (
            <div key={b.id} onClick={() => navigate(`/bookings?id=${b.id}`)} className="flex cursor-pointer items-center gap-4 rounded-xl border border-brand-mid/15 bg-brand-deepest/40 p-3 hover:bg-brand-mid/15">
              <div className="w-20 shrink-0">
                <p className="font-bold text-brand-cream">{fmtTime(b.start_time)}</p>
                <p className="text-[10px] text-brand-cream/40">{b.duration_minutes}m</p>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-brand-cream">{b.customer_name || 'Customer'}</p>
                <p className="text-xs text-brand-cream/50">{sportName(b.sport_id)} · {courtName(b.court_id)}</p>
              </div>
              <span className={`h-3 w-3 rounded-full ${statusDot(b.booking_status)}`} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function WeekView({ cursor, bookings, courtName, sportName }: { cursor: Date; bookings: Booking[]; courtName: (id: string) => string; sportName: (id: string) => string }) {
  const monday = new Date(cursor);
  const day = (monday.getDay() + 6) % 7;
  monday.setDate(monday.getDate() - day);
  monday.setHours(0, 0, 0, 0);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday); d.setDate(d.getDate() + i);
    return d;
  });

  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-7">
      {days.map((d) => {
        const iso = d.toISOString().slice(0, 10);
        const dayBks = bookings.filter((b) => b.booking_date === iso).sort((a, b) => a.start_time.localeCompare(b.start_time));
        const isToday = iso === new Date().toISOString().slice(0, 10);
        return (
          <div key={iso} className={`op-card flex flex-col p-3 ${isToday ? 'border-brand-accent/40' : ''}`}>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-brand-cream/50">{d.toLocaleDateString('en-GB', { weekday: 'short' })}</span>
              <span className={`text-sm font-bold ${isToday ? 'text-brand-accent' : 'text-brand-cream'}`}>{d.getDate()}</span>
            </div>
            <div className="flex-1 space-y-1.5">
              {dayBks.slice(0, 5).map((b) => (
                <div key={b.id} onClick={() => navigate(`/bookings?id=${b.id}`)} className="cursor-pointer rounded-lg border border-brand-mid/15 bg-brand-deepest/50 p-2 hover:bg-brand-mid/20">
                  <div className="flex items-center gap-1">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${statusDot(b.booking_status)}`} />
                    <span className="text-[10px] font-bold text-brand-cream">{fmtTime(b.start_time)}</span>
                  </div>
                  <p className="mt-0.5 truncate text-[10px] text-brand-cream/60">{b.customer_name || 'Customer'}</p>
                  <p className="truncate text-[10px] text-brand-cream/40">{sportName(b.sport_id)} · {courtName(b.court_id)}</p>
                </div>
              ))}
              {dayBks.length > 5 && <p className="text-center text-[10px] text-brand-cream/40">+{dayBks.length - 5} more</p>}
              {dayBks.length === 0 && <p className="py-4 text-center text-[10px] text-brand-cream/30">No bookings</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MonthView({ cursor, bookings }: { cursor: Date; bookings: Booking[] }) {
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date().toISOString().slice(0, 10);

  const cells: (Date | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="op-card overflow-hidden">
      <div className="grid grid-cols-7 border-b border-brand-mid/20 bg-brand-deepest/50">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
          <div key={d} className="px-2 py-2 text-center text-[10px] font-bold uppercase tracking-wider text-brand-cream/40">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((d, i) => {
          if (!d) return <div key={i} className="min-h-[80px] border-b border-r border-brand-mid/10" />;
          const iso = d.toISOString().slice(0, 10);
          const dayBks = bookings.filter((b) => b.booking_date === iso);
          const isToday = iso === today;
          return (
            <div key={i} className={`min-h-[80px] border-b border-r border-brand-mid/10 p-1.5 ${isToday ? 'bg-brand-accent/5' : ''}`}>
              <span className={`text-xs font-bold ${isToday ? 'text-brand-accent' : 'text-brand-cream/60'}`}>{d.getDate()}</span>
              <div className="mt-1 space-y-0.5">
                {dayBks.slice(0, 3).map((b) => (
                  <div key={b.id} onClick={() => navigate(`/bookings?id=${b.id}`)} className="cursor-pointer rounded px-1 py-0.5 text-[9px] hover:bg-brand-mid/30">
                    <span className={`mr-1 inline-block h-1.5 w-1.5 rounded-full ${statusDot(b.booking_status)}`} />
                    <span className="text-brand-cream/60">{b.start_time.slice(0, 5)}</span>
                    <span className="ml-1 text-brand-cream/40">{b.customer_name?.split(' ')[0] || ''}</span>
                  </div>
                ))}
                {dayBks.length > 3 && <p className="text-[9px] text-brand-cream/30">+{dayBks.length - 3} more</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function statusDot(status: string): string {
  if (status === 'confirmed') return 'bg-green-400';
  if (status === 'pending') return 'bg-yellow-400';
  if (status === 'cancelled') return 'bg-red-400';
  if (status === 'completed') return 'bg-brand-accent';
  if (status === 'no_show') return 'bg-orange-400';
  return 'bg-brand-mid';
}
