import { useMemo } from 'react';
import type { useAdminData } from '@/hooks/useAdminData';
import { todayISO, fmtTime, fmtDate, statusBadgeClass, paymentBadgeClass, paymentLabel } from '@/lib/utils';
import { Calendar, Clock, MapPin, CircleDot, TrendingUp, CheckCircle2, XCircle, Hourglass } from 'lucide-react';
import { navigate } from '@/lib/router';

type AdminData = ReturnType<typeof useAdminData>;

export default function Dashboard({ adminData }: { adminData: AdminData }) {
  const { bookings, locName, courtName, sportName, loading } = adminData;
  const today = todayISO();

  const todayBookings = useMemo(() => bookings.filter((b) => b.booking_date === today), [bookings, today]);
  const upcoming = useMemo(() =>
    bookings.filter((b) => b.booking_date > today && b.booking_status !== 'cancelled')
      .sort((a, b) => a.booking_date.localeCompare(b.booking_date) || a.start_time.localeCompare(b.start_time))
      .slice(0, 5),
    [bookings, today]);

  const todaysRevenue = useMemo(() =>
    bookings.filter((b) => b.booking_date === today && b.payment_status === 'paid')
      .reduce((sum, b) => sum + Number(b.final_price_aed), 0),
    [bookings, today]);

  const confirmed = bookings.filter((b) => b.booking_status === 'confirmed').length;
  const pending = bookings.filter((b) => b.booking_status === 'pending').length;
  const cancelled = bookings.filter((b) => b.booking_status === 'cancelled').length;

  // 7-day revenue trend
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const iso = d.toISOString().slice(0, 10);
    const rev = bookings.filter((b) => b.booking_date === iso && b.payment_status === 'paid')
      .reduce((s, b) => s + Number(b.final_price_aed), 0);
    return { label: d.toLocaleDateString('en-GB', { weekday: 'short' }), value: rev };
  });
  const maxRev = Math.max(...last7.map((x) => x.value), 1);

  if (loading) {
    return <div className="flex items-center py-16 text-brand-cream/40"><div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-mid border-t-brand-accent" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold text-brand-cream">Dashboard</h2>
        <p className="text-sm text-brand-cream/40">Overview of today's activity and key metrics</p>
      </div>

      {/* Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Metric icon={<Calendar className="h-5 w-5" />} label="Total Bookings" value={bookings.length} />
        <Metric icon={<Clock className="h-5 w-5" />} label="Today" value={todayBookings.length} />
        <Metric icon={<TrendingUp className="h-5 w-5" />} label="Today's Revenue" value={`AED ${todaysRevenue.toFixed(0)}`} />
        <Metric icon={<Hourglass className="h-5 w-5" />} label="Pending" value={pending} />
        <Metric icon={<CheckCircle2 className="h-5 w-5" />} label="Confirmed" value={confirmed} />
        <Metric icon={<XCircle className="h-5 w-5" />} label="Cancelled" value={cancelled} />
      </div>

      {/* Revenue chart */}
      <div className="op-card p-5">
        <h3 className="text-xs font-bold uppercase tracking-widest text-brand-cream/50">Revenue — Last 7 Days</h3>
        <div className="mt-4 flex items-end justify-between gap-2" style={{ height: 140 }}>
          {last7.map((d, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-[10px] font-semibold text-brand-cream/40">{d.value > 0 ? `AED ${d.value.toFixed(0)}` : ''}</span>
              <div className="flex w-full items-end justify-center" style={{ height: 90 }}>
                <div
                  className="w-full max-w-[40px] rounded-t bg-brand-accent/70 transition-all hover:bg-brand-accent"
                  style={{ height: `${Math.max((d.value / maxRev) * 90, 3)}px` }}
                />
              </div>
              <span className="text-[10px] text-brand-cream/40">{d.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Today's bookings */}
        <div>
          <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-brand-cream/50">Today's Bookings</h3>
          {todayBookings.length === 0 ? (
            <EmptyState>No bookings scheduled for today.</EmptyState>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-brand-mid/20">
              <table className="w-full text-left text-xs">
                <thead className="bg-brand-deep text-brand-cream/50">
                  <tr>
                    <th className="px-3 py-2 font-semibold uppercase tracking-wider">Time</th>
                    <th className="px-3 py-2 font-semibold uppercase tracking-wider">Customer</th>
                    <th className="px-3 py-2 font-semibold uppercase tracking-wider">Court</th>
                    <th className="px-3 py-2 font-semibold uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {todayBookings.sort((a, b) => a.start_time.localeCompare(b.start_time)).map((b) => (
                    <tr key={b.id} className="cursor-pointer border-t border-brand-mid/15 hover:bg-brand-mid/10" onClick={() => navigate(`/bookings?id=${b.id}`)}>
                      <td className="px-3 py-2 font-bold text-brand-cream">{fmtTime(b.start_time)}</td>
                      <td className="px-3 py-2 text-brand-cream/80">{b.customer_name || '—'}</td>
                      <td className="px-3 py-2 text-brand-cream/60">{sportName(b.sport_id)} · {courtName(b.court_id)}</td>
                      <td className="px-3 py-2">
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusBadgeClass(b.booking_status)}`}>{b.booking_status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Upcoming */}
        <div>
          <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-brand-cream/50">Upcoming Bookings</h3>
          {upcoming.length === 0 ? (
            <EmptyState>No upcoming bookings.</EmptyState>
          ) : (
            <div className="space-y-2">
              {upcoming.map((b) => (
                <div key={b.id} className="flex cursor-pointer items-center justify-between rounded-xl border border-brand-mid/20 bg-brand-deep p-3 text-xs hover:bg-brand-mid/15" onClick={() => navigate(`/bookings?id=${b.id}`)}>
                  <div>
                    <span className="font-mono font-bold text-brand-accent">{b.booking_code}</span>
                    <span className="ml-2 text-brand-cream">{b.customer_name || '—'}</span>
                  </div>
                  <div className="text-brand-cream/50">
                    {courtName(b.court_id)} · {fmtDate(b.booking_date)} · {fmtTime(b.start_time)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <div className="op-card p-5">
      <div className="flex items-center gap-2 text-brand-cream/40">
        {icon}
        <p className="text-[10px] font-semibold uppercase tracking-widest">{label}</p>
      </div>
      <p className="mt-3 font-display text-2xl font-extrabold text-brand-cream">{value}</p>
    </div>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-brand-mid/20 bg-brand-deep/40 p-6 text-center text-sm text-brand-cream/40">{children}</div>;
}
