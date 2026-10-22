import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  X, Calendar, Users, Building2, Ban, BarChart3, Loader2, AlertCircle,
  Search, MapPin, CircleDot, Clock, Check, Trash2, ShieldAlert, CreditCard,
  Plus, ChevronLeft, ChevronRight, CalendarDays, TrendingUp, Bell, Edit3,
  StickyNote, RefreshCw, Phone, Mail,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Booking, Location, Court, Sport, Profile, BlockedSlot, Payment, Notification } from '@/lib/types';

type Tab = 'overview' | 'bookings' | 'calendar' | 'resources' | 'customers' | 'revenue' | 'blocked' | 'notifications';

type DateFilter = 'all' | 'today' | 'tomorrow' | 'week' | 'custom';

interface NewBookingDraft {
  courtId: string;
  locationId: string;
  sportId: string;
  date: string;
  startTime: string;
  durationMinutes: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  paymentStatus: 'pay_at_venue' | 'paid' | 'pending';
  notes: string;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function fmtTime(t: string): string {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const hh = ((h + 11) % 12) + 1;
  return `${hh}:${m.toString().padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

function fmtDate(d: string): string {
  if (!d) return '';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function addMinutesTime(t: string, mins: number): string {
  const [h, m] = t.split(':').map(Number);
  const total = h * 60 + m + mins;
  const nh = Math.floor(total / 60) % 24;
  const nm = total % 60;
  return `${nh.toString().padStart(2, '0')}:${nm.toString().padStart(2, '0')}`;
}

function startOfWeek(d: Date): Date {
  const r = new Date(d);
  const day = (r.getDay() + 6) % 7;
  r.setDate(r.getDate() - day);
  r.setHours(0, 0, 0, 0);
  return r;
}

export default function AdminDashboard({ route = 'overview', onClose }: { route?: Tab; onClose?: () => void }) {
  const { isAdmin, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<Tab>(route);

  // Sync internal tab when the route prop changes
  useEffect(() => { setTab(route); }, [route]);

  const [locations, setLocations] = useState<Location[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [blocked, setBlocked] = useState<BlockedSlot[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!supabase) { setError('Backend unavailable'); setLoading(false); return; }
    setLoading(true);
    const [bk, loc, ct, sp, pr, pm, bl, nf] = await Promise.all([
      supabase.from('bookings').select('*').order('created_at', { ascending: false }).limit(500),
      supabase.from('locations').select('*').order('sort_order'),
      supabase.from('courts').select('*').order('sort_order'),
      supabase.from('sports').select('*').order('sort_order'),
      supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(500),
      supabase.from('payments').select('*').order('created_at', { ascending: false }).limit(500),
      supabase.from('blocked_slots').select('*').order('date', { ascending: false }).limit(500),
      supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(100),
    ]);
    if (bk.error) setError(bk.error.message);
    setBookings((bk.data as Booking[]) || []);
    setLocations((loc.data as Location[]) || []);
    setCourts((ct.data as Court[]) || []);
    setSports((sp.data as Sport[]) || []);
    setProfiles((pr.data as Profile[]) || []);
    setPayments((pm.data as Payment[]) || []);
    setBlocked((bl.data as BlockedSlot[]) || []);
    setNotifications((nf.data as Notification[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Realtime subscription for new bookings
  useEffect(() => {
    if (!supabase) return;
    const channel = supabase
      .channel('admin-bookings-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bookings' }, (payload) => {
        const newB = payload.new as Booking;
        setBookings((prev) => [newB, ...prev]);
        setToast(`New booking: ${newB.booking_code} — ${newB.customer_name || 'Customer'}`);
        window.setTimeout(() => setToast(null), 5000);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'bookings' }, (payload) => {
        const upd = payload.new as Booking;
        setBookings((prev) => prev.map((b) => (b.id === upd.id ? upd : b)));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'bookings' }, (payload) => {
        const old = payload.old as Booking;
        setBookings((prev) => prev.filter((b) => b.id !== old.id));
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
        const newN = payload.new as Notification;
        setNotifications((prev) => [newN, ...prev]);
      })
      .subscribe();
    return () => { supabase?.removeChannel(channel); };
  }, []);

  if (!authLoading && !isAdmin) {
    return (
      <div className="fixed inset-0 z-[95] flex items-center justify-center bg-brand-deepest/90 p-4" onClick={onClose}>
        <div className="max-w-md rounded-2xl border border-red-400/30 bg-brand-deep p-8 text-center" onClick={(e) => e.stopPropagation()}>
          <ShieldAlert className="mx-auto h-10 w-10 text-red-300" />
          <h2 className="mt-4 font-display text-xl font-bold text-brand-cream">Admin access required</h2>
          <p className="mt-2 text-sm text-brand-cream/60">Your account is not authorized to view the admin dashboard.</p>
          <button onClick={onClose} className="mt-6 rounded-full bg-brand-accent px-6 py-2.5 text-sm font-bold text-brand-deepest hover:bg-brand-light">Close</button>
        </div>
      </div>
    );
  }

  const locName = (id: string) => locations.find((l) => l.id === id)?.name || '—';
  const courtName = (id: string) => courts.find((c) => c.id === id)?.name || '—';
  const sportName = (id: string) => sports.find((s) => s.id === id)?.name || '—';
  const sportSlug = (id: string) => sports.find((s) => s.id === id)?.slug || '';
  const today = todayISO();

  const todayBookings = bookings.filter((b) => b.booking_date === today);
  const todaysRevenue = bookings
    .filter((b) => b.booking_date === today && b.payment_status === 'paid')
    .reduce((sum, b) => sum + Number(b.final_price_aed), 0);
  const confirmedCount = bookings.filter((b) => b.booking_status === 'confirmed').length;
  const pendingCount = bookings.filter((b) => b.booking_status === 'pending').length;
  const cancelledCount = bookings.filter((b) => b.booking_status === 'cancelled').length;
  const activeCourts = courts.filter((c) => c.is_active).length;
  const unreadNotifs = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="fixed inset-0 z-[95] flex items-stretch justify-center bg-brand-deepest/95 backdrop-blur-md" onClick={onClose}>
      <div className="flex w-full max-w-6xl flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-brand-mid/20 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-accent/15 text-brand-accent">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-brand-cream">OnPeak Admin</h2>
              <p className="text-xs text-brand-cream/50">Sports club management</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={load} className="flex h-9 w-9 items-center justify-center rounded-lg text-brand-cream/60 hover:bg-brand-mid/40" aria-label="Refresh">
              <RefreshCw className="h-5 w-5" />
            </button>
            <button onClick={() => setTab('notifications')} className="relative flex h-9 w-9 items-center justify-center rounded-lg text-brand-cream/60 hover:bg-brand-mid/40" aria-label="Notifications">
              <Bell className="h-5 w-5" />
              {unreadNotifs > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-accent px-1 text-[10px] font-bold text-brand-deepest">{unreadNotifs > 9 ? '9+' : unreadNotifs}</span>
              )}
            </button>
            <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-lg text-brand-cream/60 hover:bg-brand-mid/40" aria-label="Close">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1 overflow-x-auto border-b border-brand-mid/20 px-4 py-2">
          {([
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'bookings', label: 'Bookings', icon: Calendar },
            { id: 'calendar', label: 'Calendar', icon: CalendarDays },
            { id: 'resources', label: 'Facilities', icon: Building2 },
            { id: 'customers', label: 'Customers', icon: Users },
            { id: 'revenue', label: 'Revenue', icon: TrendingUp },
            { id: 'blocked', label: 'Blocked', icon: Ban },
            { id: 'notifications', label: `Notifications${unreadNotifs > 0 ? ' (' + unreadNotifs + ')' : ''}`, icon: Bell },
          ] as { id: Tab; label: string; icon: typeof BarChart3 }[]).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors whitespace-nowrap ${
                tab === t.id ? 'bg-brand-accent text-brand-deepest' : 'text-brand-cream/70 hover:bg-brand-mid/40'
              }`}
            >
              <t.icon className="h-4 w-4" /> {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto bg-brand-deepest/40 p-6">
          {loading && (
            <div className="flex items-center py-12 text-brand-cream/60">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading admin data…
            </div>
          )}
          {error && !loading && (
            <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!loading && tab === 'overview' && (
            <OverviewTab todayBookings={todayBookings} allBookings={bookings} revenue={todaysRevenue} confirmed={confirmedCount} pending={pendingCount} cancelled={cancelledCount} activeCourts={activeCourts} locName={locName} courtName={courtName} sportName={sportName} />
          )}
          {!loading && tab === 'bookings' && (
            <BookingsTab bookings={bookings} locations={locations} sports={sports} courts={courts} locName={locName} courtName={courtName} sportName={sportName} sportSlug={sportSlug} fmtDate={fmtDate} fmtTime={fmtTime} onChanged={load} />
          )}
          {!loading && tab === 'calendar' && (
            <CalendarTab bookings={bookings} courts={courts} locations={locations} locName={locName} courtName={courtName} sportName={sportName} fmtTime={fmtTime} />
          )}
          {!loading && tab === 'resources' && (
            <ResourcesTab locations={locations} sports={sports} courts={courts} />
          )}
          {!loading && tab === 'customers' && (
            <CustomersTab profiles={profiles} bookings={bookings} fmtDate={fmtDate} />
          )}
          {!loading && tab === 'revenue' && (
            <RevenueTab bookings={bookings} locations={locations} sports={sports} courts={courts} locName={locName} sportName={sportName} courtName={courtName} />
          )}
          {!loading && tab === 'blocked' && (
            <BlockedTab courts={courts} blocked={blocked} courtName={courtName} fmtDate={fmtDate} onChanged={load} />
          )}
          {!loading && tab === 'notifications' && (
            <NotificationsTab notifications={notifications} onChanged={load} />
          )}
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 z-[100] flex items-center gap-3 rounded-2xl border border-brand-accent/40 bg-brand-deep px-5 py-3 shadow-2xl">
          <Bell className="h-5 w-5 text-brand-accent" />
          <span className="text-sm font-semibold text-brand-cream">{toast}</span>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Overview
// ---------------------------------------------------------------------------
function OverviewTab({ todayBookings, allBookings, revenue, confirmed, pending, cancelled, activeCourts, locName, courtName, sportName }: {
  todayBookings: Booking[]; allBookings: Booking[]; revenue: number; confirmed: number; pending: number; cancelled: number; activeCourts: number;
  locName: (id: string) => string; courtName: (id: string) => string; sportName: (id: string) => string;
}) {
  const sorted = [...todayBookings].sort((a, b) => a.start_time.localeCompare(b.start_time));
  const today = todayISO();
  const upcoming = allBookings
    .filter((b) => b.booking_date > today && b.booking_status !== 'cancelled')
    .sort((a, b) => a.booking_date.localeCompare(b.booking_date) || a.start_time.localeCompare(b.start_time))
    .slice(0, 5);

  // 7-day revenue trend
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const iso = d.toISOString().slice(0, 10);
    const dayRev = allBookings
      .filter((b) => b.booking_date === iso && b.payment_status === 'paid')
      .reduce((sum, b) => sum + Number(b.final_price_aed), 0);
    return { label: d.toLocaleDateString('en-GB', { weekday: 'short' }), value: dayRev };
  });
  const maxRev = Math.max(...last7.map((x) => x.value), 1);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Metric label="Today's bookings" value={todayBookings.length} />
        <Metric label="Today's revenue" value={`AED ${revenue.toFixed(0)}`} />
        <Metric label="Total bookings" value={allBookings.length} />
        <Metric label="Confirmed" value={confirmed} />
        <Metric label="Pending" value={pending} />
        <Metric label="Cancelled" value={cancelled} />
      </div>

      {/* 7-day revenue trend */}
      <div className="rounded-2xl border border-brand-mid/20 bg-brand-deep p-5">
        <h3 className="font-display text-sm font-bold uppercase tracking-widest text-brand-cream/60">Revenue — last 7 days</h3>
        <div className="mt-4 flex items-end justify-between gap-2" style={{ height: 120 }}>
          {last7.map((d, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-[9px] font-semibold text-brand-cream/50">{d.value > 0 ? `AED ${d.value.toFixed(0)}` : ''}</span>
              <div className="flex w-full items-end justify-center" style={{ height: 80 }}>
                <div
                  className="w-full max-w-[40px] rounded-t bg-brand-accent/70 transition-all hover:bg-brand-accent"
                  style={{ height: `${Math.max((d.value / maxRev) * 80, 2)}px` }}
                />
              </div>
              <span className="text-[10px] text-brand-cream/40">{d.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="font-display text-sm font-bold uppercase tracking-widest text-brand-cream/60">Today's bookings</h3>
          <div className="mt-3">
            {sorted.length === 0 ? (
              <EmptyState>No bookings scheduled for today.</EmptyState>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-brand-mid/20">
                <table className="w-full text-left text-xs">
                  <thead className="bg-brand-deep text-brand-cream/60">
                    <tr><Th>Time</Th><Th>Customer</Th><Th>Facility</Th><Th>Court/Field</Th><Th>Status</Th><Th>Payment</Th></tr>
                  </thead>
                  <tbody>
                    {sorted.map((b) => (
                      <tr key={b.id} className="border-t border-brand-mid/15">
                        <Td><span className="font-bold text-brand-cream">{fmtTime(b.start_time)}</span><br /><span className="text-brand-cream/40">{b.duration_minutes}m</span></Td>
                        <Td>{b.customer_name || '—'}</Td>
                        <Td>{sportName(b.sport_id)}<br /><span className="text-brand-cream/40">{locName(b.location_id)}</span></Td>
                        <Td>{courtName(b.court_id)}</Td>
                        <Td><span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusBadgeClass(b.booking_status)}`}>{b.booking_status}</span></Td>
                        <Td><span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${paymentBadgeClass(b.payment_status)}`}>{paymentLabel(b.payment_status)}</span></Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div>
          <h3 className="font-display text-sm font-bold uppercase tracking-widest text-brand-cream/60">Upcoming bookings</h3>
          <div className="mt-3 space-y-2">
            {upcoming.length === 0 ? (
              <EmptyState>No upcoming bookings.</EmptyState>
            ) : (
              upcoming.map((b) => (
                <div key={b.id} className="flex items-center justify-between rounded-xl border border-brand-mid/20 bg-brand-deep p-3 text-xs">
                  <div>
                    <span className="font-mono font-bold text-brand-accent">{b.booking_code}</span>
                    <span className="ml-2 text-brand-cream">{b.customer_name || '—'}</span>
                  </div>
                  <div className="text-brand-cream/60">
                    {courtName(b.court_id)} · {fmtDate(b.booking_date)} · {fmtTime(b.start_time)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Bookings — table with filters, search, actions
// ---------------------------------------------------------------------------
function BookingsTab({ bookings, locations, sports, courts, locName, courtName, sportName, sportSlug, fmtDate, fmtTime, onChanged }: {
  bookings: Booking[]; locations: Location[]; sports: Sport[]; courts: Court[];
  locName: (id: string) => string; courtName: (id: string) => string; sportName: (id: string) => string; sportSlug: (id: string) => string;
  fmtDate: (d: string) => string; fmtTime: (t: string) => string; onChanged: () => void;
}) {
  const [q, setQ] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [customDate, setCustomDate] = useState('');
  const [fLocation, setFLocation] = useState('');
  const [fSport, setFSport] = useState('');
  const [fStatus, setFStatus] = useState('');
  const [fPayment, setFPayment] = useState('');
  const [selected, setSelected] = useState<Booking | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const today = todayISO();
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowISO = tomorrow.toISOString().slice(0, 10);
  const weekStart = startOfWeek(new Date());
  const weekEnd = new Date(weekStart); weekEnd.setDate(weekEnd.getDate() + 6);

  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      if (q) {
        const ql = q.toLowerCase();
        if (!b.booking_code.toLowerCase().includes(ql) &&
            !(b.customer_name || '').toLowerCase().includes(ql) &&
            !(b.customer_phone || '').toLowerCase().includes(ql) &&
            !(b.customer_email || '').toLowerCase().includes(ql)) return false;
      }
      if (dateFilter === 'today' && b.booking_date !== today) return false;
      if (dateFilter === 'tomorrow' && b.booking_date !== tomorrowISO) return false;
      if (dateFilter === 'week') {
        const bd = new Date(b.booking_date + 'T00:00:00');
        if (bd < weekStart || bd > weekEnd) return false;
      }
      if (dateFilter === 'custom' && customDate && b.booking_date !== customDate) return false;
      if (fLocation && b.location_id !== fLocation) return false;
      if (fSport && sportSlug(b.sport_id) !== fSport) return false;
      if (fStatus && b.booking_status !== fStatus) return false;
      if (fPayment && b.payment_status !== fPayment) return false;
      return true;
    });
  }, [bookings, q, dateFilter, customDate, fLocation, fSport, fStatus, fPayment, today, tomorrowISO, weekStart, weekEnd, sportSlug]);

  const setStatus = async (b: Booking, status: string) => {
    if (!supabase) return;
    setBusy(b.id);
    const { data, error } = await supabase.rpc('update_booking_admin', {
      p_booking_id: b.id, p_booking_status: status,
    });
    setBusy(null);
    if (error || (data && (data as any)?.[0]?.success === false)) {
      alert(error?.message || (data as any)?.[0]?.error_message || 'Failed');
      return;
    }
    onChanged();
  };

  const setPayment = async (b: Booking, payment: string) => {
    if (!supabase) return;
    setBusy(b.id);
    const { data, error } = await supabase.rpc('update_booking_admin', {
      p_booking_id: b.id, p_payment_status: payment,
    });
    setBusy(null);
    if (error || (data && (data as any)?.[0]?.success === false)) {
      alert(error?.message || (data as any)?.[0]?.error_message || 'Failed');
      return;
    }
    onChanged();
  };

  const deleteBooking = async (b: Booking) => {
    if (!supabase) return;
    if (!confirm(`Delete booking ${b.booking_code}? This cannot be undone.`)) return;
    setBusy(b.id);
    const { error } = await supabase.from('bookings').delete().eq('id', b.id);
    setBusy(null);
    if (error) { alert(error.message); return; }
    onChanged();
  };

  if (selected) {
    return <BookingDetail booking={selected} locations={locations} sports={sports} courts={courts} locName={locName} courtName={courtName} sportName={sportName} fmtDate={fmtDate} fmtTime={fmtTime} onBack={() => setSelected(null)} onChanged={onChanged} />;
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-cream/40" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, phone, ref" className="op-input pl-9" />
        </div>
        <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value as DateFilter)} className="op-input max-w-[120px]">
          <option value="all">All dates</option>
          <option value="today">Today</option>
          <option value="tomorrow">Tomorrow</option>
          <option value="week">This week</option>
          <option value="custom">Custom</option>
        </select>
        {dateFilter === 'custom' && <input type="date" value={customDate} onChange={(e) => setCustomDate(e.target.value)} className="op-input max-w-[150px]" />}
        <select value={fLocation} onChange={(e) => setFLocation(e.target.value)} className="op-input max-w-[140px]">
          <option value="">All locations</option>
          {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
        <select value={fSport} onChange={(e) => setFSport(e.target.value)} className="op-input max-w-[110px]">
          <option value="">All sports</option>
          <option value="padel">Padel</option>
          <option value="football">Football</option>
        </select>
        <select value={fStatus} onChange={(e) => setFStatus(e.target.value)} className="op-input max-w-[130px]">
          <option value="">Any status</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="cancelled">Cancelled</option>
          <option value="completed">Completed</option>
          <option value="no_show">No-show</option>
        </select>
        <select value={fPayment} onChange={(e) => setFPayment(e.target.value)} className="op-input max-w-[130px]">
          <option value="">Any payment</option>
          <option value="pay_at_venue">Pay at venue</option>
          <option value="paid">Paid</option>
          <option value="partially_paid">Partially paid</option>
          <option value="pending">Unpaid</option>
          <option value="refunded">Refunded</option>
        </select>
        <button onClick={() => setShowNew(true)} className="flex items-center gap-1.5 rounded-full bg-brand-accent px-4 py-2 text-sm font-bold text-brand-deepest hover:bg-brand-light">
          <Plus className="h-4 w-4" /> Add Booking
        </button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState>No bookings match your filters.</EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-brand-mid/20">
          <table className="w-full text-left text-xs">
            <thead className="bg-brand-deep text-brand-cream/60">
              <tr>
                <Th>Booking #</Th><Th>Customer</Th><Th>Phone</Th><Th>Location</Th><Th>Sport</Th><Th>Court/Field</Th><Th>Date</Th><Th>Time</Th><Th>Price</Th><Th>Payment</Th><Th>Status</Th><Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr key={b.id} className="border-t border-brand-mid/15 hover:bg-brand-mid/10">
                  <Td><span className="font-mono font-bold text-brand-accent">{b.booking_code}</span></Td>
                  <Td>{b.customer_name || '—'}</Td>
                  <Td>{b.customer_phone || '—'}</Td>
                  <Td>{locName(b.location_id)}</Td>
                  <Td>{sportName(b.sport_id)}</Td>
                  <Td>{courtName(b.court_id)}</Td>
                  <Td>{fmtDate(b.booking_date)}</Td>
                  <Td>{fmtTime(b.start_time)}<br /><span className="text-brand-cream/40">{b.duration_minutes}m</span></Td>
                  <Td>{Number(b.final_price_aed).toFixed(0)}</Td>
                  <Td>
                    <select
                      value={b.payment_status}
                      onChange={(e) => setPayment(b, e.target.value)}
                      disabled={busy === b.id}
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${paymentBadgeClass(b.payment_status)}`}
                    >
                      <option value="pay_at_venue">Pay at venue</option>
                      <option value="paid">Paid</option>
                      <option value="partially_paid">Partially paid</option>
                      <option value="pending">Unpaid</option>
                      <option value="refunded">Refunded</option>
                    </select>
                  </Td>
                  <Td>
                    <select
                      value={b.booking_status}
                      onChange={(e) => setStatus(b, e.target.value)}
                      disabled={busy === b.id}
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusBadgeClass(b.booking_status)}`}
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="completed">Completed</option>
                      <option value="no_show">No-show</option>
                    </select>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-1">
                      <button onClick={() => setSelected(b)} className="rounded-lg p-1.5 text-brand-cream/60 hover:bg-brand-mid/40 hover:text-brand-accent" title="View / Edit">
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      {busy === b.id && <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-cream/40" />}
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showNew && (
        <NewBookingModal
          locations={locations}
          sports={sports}
          courts={courts}
          onClose={() => setShowNew(false)}
          onCreated={() => { setShowNew(false); onChanged(); }}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Booking detail — view, edit, reschedule, admin notes
// ---------------------------------------------------------------------------
function BookingDetail({ booking, locations, sports, courts, locName, courtName, sportName, fmtDate, fmtTime, onBack, onChanged }: {
  booking: Booking;
  locations: Location[]; sports: Sport[]; courts: Court[];
  locName: (id: string) => string; courtName: (id: string) => string; sportName: (id: string) => string;
  fmtDate: (d: string) => string; fmtTime: (t: string) => string;
  onBack: () => void; onChanged: () => void;
}) {
  const [adminNotes, setAdminNotes] = useState(booking.admin_notes || '');
  const [customerNotes, setCustomerNotes] = useState(booking.notes || '');
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [newDate, setNewDate] = useState(booking.booking_date);
  const [newStart, setNewStart] = useState(booking.start_time);
  const [newCourt, setNewCourt] = useState(booking.court_id);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (!supabase) return null;
  const sb = supabase;

  const saveNotes = async () => {
    setSaving(true);
    const { error } = await sb.rpc('update_booking_admin', {
      p_booking_id: booking.id, p_admin_notes: adminNotes, p_notes: customerNotes,
    });
    setSaving(false);
    if (error) { setErr(error.message); return; }
    onChanged();
    onBack();
  };

  const doReschedule = async () => {
    if (!newDate || !newStart) { setErr('Date and start time required.'); return; }
    const endTime = addMinutesTime(newStart, booking.duration_minutes);
    setSaving(true); setErr(null);
    const { data, error } = await sb.rpc('reschedule_booking', {
      p_booking_id: booking.id,
      p_new_date: newDate,
      p_new_start_time: newStart,
      p_new_end_time: endTime,
      p_new_court_id: newCourt !== booking.court_id ? newCourt : null,
    });
    setSaving(false);
    if (error) { setErr(error.message); return; }
    const r = (data as any)?.[0] || (data as any);
    if (r && r.success === false) { setErr(r.error_message || 'Reschedule failed.'); return; }
    onChanged();
    onBack();
  };

  return (
    <div>
      <button onClick={onBack} className="mb-4 flex items-center gap-1 text-xs text-brand-accent hover:underline">
        <ChevronLeft className="h-3.5 w-3.5" /> Back to bookings
      </button>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-brand-mid/20 bg-brand-deep p-5">
          <h3 className="font-display text-lg font-bold text-brand-cream">{booking.booking_code}</h3>
          <div className="mt-3 space-y-2 text-sm">
            <Row label="Customer" value={booking.customer_name || '—'} />
            <Row label="Phone" value={booking.customer_phone || '—'} />
            <Row label="Email" value={booking.customer_email || '—'} />
            <Row label="Location" value={locName(booking.location_id)} />
            <Row label="Sport" value={sportName(booking.sport_id)} />
            <Row label="Court/Field" value={courtName(booking.court_id)} />
            <Row label="Date" value={fmtDate(booking.booking_date)} />
            <Row label="Start" value={fmtTime(booking.start_time)} />
            <Row label="End" value={fmtTime(booking.end_time)} />
            <Row label="Duration" value={`${booking.duration_minutes} min`} />
            <Row label="Price" value={`AED ${Number(booking.final_price_aed).toFixed(2)}`} />
            <Row label="Payment" value={paymentLabel(booking.payment_status)} />
            <Row label="Status" value={booking.booking_status} />
          </div>
        </div>

        <div className="space-y-4">
          {/* Reschedule */}
          <div className="rounded-2xl border border-brand-mid/20 bg-brand-deep p-5">
            <button onClick={() => setRescheduleOpen((v) => !v)} className="flex w-full items-center justify-between">
              <span className="flex items-center gap-2 font-display text-sm font-bold text-brand-cream">
                <RefreshCw className="h-4 w-4 text-brand-accent" /> Reschedule
              </span>
              <ChevronRight className={`h-4 w-4 text-brand-cream/40 transition-transform ${rescheduleOpen ? 'rotate-90' : ''}`} />
            </button>
            {rescheduleOpen && (
              <div className="mt-4 space-y-3">
                <label className="block text-xs text-brand-cream/60">Date
                  <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="op-input mt-1" />
                </label>
                <label className="block text-xs text-brand-cream/60">Start time
                  <input type="time" value={newStart} onChange={(e) => setNewStart(e.target.value)} className="op-input mt-1" />
                </label>
                <label className="block text-xs text-brand-cream/60">Court/Field
                  <select value={newCourt} onChange={(e) => setNewCourt(e.target.value)} className="op-input mt-1">
                    <option value="">Keep current</option>
                    {courtsForBooking(booking).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </label>
                {err && <p className="text-xs text-red-300">{err}</p>}
                <button onClick={doReschedule} disabled={saving} className="flex items-center gap-2 rounded-full bg-brand-accent px-5 py-2 text-sm font-bold text-brand-deepest hover:bg-brand-light disabled:opacity-60">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Apply reschedule
                </button>
              </div>
            )}
          </div>

          {/* Admin notes — internal only */}
          <div className="rounded-2xl border border-brand-mid/20 bg-brand-deep p-5">
            <p className="flex items-center gap-2 font-display text-sm font-bold text-brand-cream">
              <StickyNote className="h-4 w-4 text-brand-accent" /> Admin notes (internal)
            </p>
            <textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} rows={3} className="op-input mt-3" placeholder="Internal notes not visible to customer" />
            <p className="mt-3 flex items-center gap-2 font-display text-xs font-bold text-brand-cream/60">Customer notes</p>
            <textarea value={customerNotes} onChange={(e) => setCustomerNotes(e.target.value)} rows={2} className="op-input mt-2" placeholder="Notes shown to customer" />
            {err && <p className="mt-2 text-xs text-red-300">{err}</p>}
            <button onClick={saveNotes} disabled={saving} className="mt-3 flex items-center gap-2 rounded-full bg-brand-accent px-5 py-2 text-sm font-bold text-brand-deepest hover:bg-brand-light disabled:opacity-60">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Save notes
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  function courtsForBooking(b: Booking) {
    return courts.filter((c) => c.location_id === b.location_id && c.sport_id === b.sport_id && c.is_active && c.id !== b.court_id);
  }
}

// ---------------------------------------------------------------------------
// New manual booking modal
// ---------------------------------------------------------------------------
function NewBookingModal({ locations, sports, courts, onClose, onCreated }: {
  locations: Location[]; sports: Sport[]; courts: Court[];
  onClose: () => void; onCreated: () => void;
}) {
  const [d, setD] = useState<NewBookingDraft>({
    courtId: '', locationId: '', sportId: '', date: todayISO(),
    startTime: '', durationMinutes: 60,
    customerName: '', customerPhone: '', customerEmail: '',
    paymentStatus: 'pay_at_venue', notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const availableCourts = courts.filter((c) => c.location_id === d.locationId && c.sport_id === d.sportId && c.is_active);

  const create = async () => {
    if (!supabase) return;
    if (!d.courtId || !d.locationId || !d.sportId || !d.date || !d.startTime || !d.customerName || !d.customerPhone) {
      setErr('Please fill all required fields.'); return;
    }
    setSaving(true); setErr(null);
    const { data, error } = await supabase.rpc('admin_create_booking', {
      p_court_id: d.courtId,
      p_location_id: d.locationId,
      p_sport_id: d.sportId,
      p_booking_date: d.date,
      p_start_time: d.startTime,
      p_duration_minutes: d.durationMinutes,
      p_customer_name: d.customerName,
      p_customer_email: d.customerEmail || null,
      p_customer_phone: d.customerPhone,
      p_payment_status: d.paymentStatus,
      p_notes: d.notes || null,
    });
    setSaving(false);
    if (error) { setErr(error.message); return; }
    const r = (data as any)?.[0] || (data as any);
    if (!r || r.success === false) { setErr(r?.error_message || 'Could not create booking.'); return; }
    onCreated();
  };

  return (
    <div className="fixed inset-0 z-[96] flex items-center justify-center bg-brand-deepest/80 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl border border-brand-mid/30 bg-brand-deep p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-brand-cream">New manual booking</h3>
          <button onClick={onClose} className="text-brand-cream/60 hover:text-brand-cream"><X className="h-5 w-5" /></button>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="text-xs text-brand-cream/60">Location*
            <select value={d.locationId} onChange={(e) => setD({ ...d, locationId: e.target.value, courtId: '' })} className="op-input mt-1">
              <option value="">Select…</option>
              {locations.filter((l) => l.is_active).map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </label>
          <label className="text-xs text-brand-cream/60">Sport*
            <select value={d.sportId} onChange={(e) => setD({ ...d, sportId: e.target.value, courtId: '' })} className="op-input mt-1">
              <option value="">Select…</option>
              {sports.filter((s) => s.is_active).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
          <label className="text-xs text-brand-cream/60 md:col-span-2">Court/Field*
            <select value={d.courtId} onChange={(e) => setD({ ...d, courtId: e.target.value })} className="op-input mt-1" disabled={availableCourts.length === 0}>
              <option value="">Select…</option>
              {availableCourts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label className="text-xs text-brand-cream/60">Date*
            <input type="date" min={todayISO()} value={d.date} onChange={(e) => setD({ ...d, date: e.target.value })} className="op-input mt-1" />
          </label>
          <label className="text-xs text-brand-cream/60">Start time*
            <input type="time" value={d.startTime} onChange={(e) => setD({ ...d, startTime: e.target.value })} className="op-input mt-1" />
          </label>
          <label className="text-xs text-brand-cream/60">Duration
            <select value={d.durationMinutes} onChange={(e) => setD({ ...d, durationMinutes: Number(e.target.value) })} className="op-input mt-1">
              <option value={60}>60 min</option>
              <option value={90}>90 min</option>
              <option value={120}>120 min</option>
            </select>
          </label>
          <label className="text-xs text-brand-cream/60">Payment
            <select value={d.paymentStatus} onChange={(e) => setD({ ...d, paymentStatus: e.target.value as any })} className="op-input mt-1">
              <option value="pay_at_venue">Pay at venue</option>
              <option value="paid">Paid</option>
              <option value="pending">Unpaid</option>
            </select>
          </label>
          <label className="text-xs text-brand-cream/60">Customer name*
            <input value={d.customerName} onChange={(e) => setD({ ...d, customerName: e.target.value })} className="op-input mt-1" />
          </label>
          <label className="text-xs text-brand-cream/60">Phone*
            <input value={d.customerPhone} onChange={(e) => setD({ ...d, customerPhone: e.target.value })} className="op-input mt-1" placeholder="+971…" />
          </label>
          <label className="text-xs text-brand-cream/60 md:col-span-2">Email
            <input value={d.customerEmail} onChange={(e) => setD({ ...d, customerEmail: e.target.value })} className="op-input mt-1" placeholder="optional" />
          </label>
          <label className="text-xs text-brand-cream/60 md:col-span-2">Notes
            <input value={d.notes} onChange={(e) => setD({ ...d, notes: e.target.value })} className="op-input mt-1" placeholder="optional" />
          </label>
        </div>
        {err && <p className="mt-3 text-xs text-red-300">{err}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-full border border-brand-mid/30 px-4 py-2 text-sm text-brand-cream/70">Cancel</button>
          <button onClick={create} disabled={saving} className="flex items-center gap-2 rounded-full bg-brand-accent px-5 py-2 text-sm font-bold text-brand-deepest hover:bg-brand-light disabled:opacity-60">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Create booking
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Calendar — day/week/month views
// ---------------------------------------------------------------------------
function CalendarTab({ bookings, courts, locations, locName, courtName, sportName, fmtTime }: {
  bookings: Booking[]; courts: Court[]; locations: Location[];
  locName: (id: string) => string; courtName: (id: string) => string; sportName: (id: string) => string;
  fmtTime: (t: string) => string;
}) {
  const [view, setView] = useState<'day' | 'week' | 'month'>('day');
  const [cursor, setCursor] = useState(new Date());

  const activeBookings = bookings.filter((b) => b.booking_status !== 'cancelled');

  if (view === 'day') {
    const iso = cursor.toISOString().slice(0, 10);
    const dayBookings = activeBookings.filter((b) => b.booking_date === iso).sort((a, b) => a.start_time.localeCompare(b.start_time));
    return (
      <div>
        <CalendarHeader view={view} setView={setView} cursor={cursor} setCursor={setCursor} />
        <div className="mt-4 grid gap-2">
          {dayBookings.length === 0 && <EmptyState>No bookings on this day.</EmptyState>}
          {dayBookings.map((b) => (
            <div key={b.id} className={`flex items-center justify-between rounded-xl border p-3 text-xs ${statusBorderClass(b.booking_status)}`}>
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-center rounded-lg bg-brand-mid/30 px-3 py-1">
                  <span className="font-bold text-brand-cream">{fmtTime(b.start_time)}</span>
                  <span className="text-[10px] text-brand-cream/40">{b.duration_minutes}m</span>
                </div>
                <div>
                  <p className="font-semibold text-brand-cream">{courtName(b.court_id)} · {sportName(b.sport_id)}</p>
                  <p className="text-brand-cream/60">{b.customer_name || '—'} · {locName(b.location_id)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${paymentBadgeClass(b.payment_status)}`}>{paymentLabel(b.payment_status)}</span>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusBadgeClass(b.booking_status)}`}>{b.booking_status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (view === 'week') {
    const ws = startOfWeek(cursor);
    const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(ws); d.setDate(d.getDate() + i); return d; });
    return (
      <div>
        <CalendarHeader view={view} setView={setView} cursor={cursor} setCursor={setCursor} />
        <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-7">
          {days.map((d) => {
            const iso = d.toISOString().slice(0, 10);
            const dayBks = activeBookings.filter((b) => b.booking_date === iso).sort((a, b) => a.start_time.localeCompare(b.start_time));
            return (
              <div key={iso} className={`rounded-xl border p-2 ${iso === todayISO() ? 'border-brand-accent/40 bg-brand-accent/5' : 'border-brand-mid/20 bg-brand-deep/40'}`}>
                <p className="text-[10px] font-bold uppercase text-brand-cream/50">{d.toLocaleDateString('en-GB', { weekday: 'short' })}</p>
                <p className="font-display text-sm font-bold text-brand-cream">{d.getDate()}</p>
                <div className="mt-1 space-y-1">
                  {dayBks.slice(0, 4).map((b) => (
                    <div key={b.id} className="rounded bg-brand-mid/30 px-1.5 py-0.5 text-[9px] text-brand-cream/80">
                      {fmtTime(b.start_time)} {courtName(b.court_id)}
                    </div>
                  ))}
                  {dayBks.length > 4 && <p className="text-[9px] text-brand-cream/40">+{dayBks.length - 4} more</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // month view
  const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
  const startDay = (monthStart.getDay() + 6) % 7;
  const totalDays = monthEnd.getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let i = 1; i <= totalDays; i++) cells.push(new Date(cursor.getFullYear(), cursor.getMonth(), i));
  return (
    <div>
      <CalendarHeader view={view} setView={setView} cursor={cursor} setCursor={setCursor} />
      <div className="mt-4 grid grid-cols-7 gap-1">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
          <div key={d} className="text-center text-[10px] font-bold uppercase text-brand-cream/40">{d}</div>
        ))}
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const iso = d.toISOString().slice(0, 10);
          const count = activeBookings.filter((b) => b.booking_date === iso).length;
          return (
            <div key={i} className={`min-h-[60px] rounded-lg border p-1 ${iso === todayISO() ? 'border-brand-accent/40 bg-brand-accent/5' : 'border-brand-mid/15 bg-brand-deep/30'}`}>
              <p className="text-[10px] font-bold text-brand-cream/60">{d.getDate()}</p>
              {count > 0 && <p className="mt-0.5 text-[9px] text-brand-accent">{count} booking{count > 1 ? 's' : ''}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CalendarHeader({ view, setView, cursor, setCursor }: {
  view: 'day' | 'week' | 'month'; setView: (v: 'day' | 'week' | 'month') => void;
  cursor: Date; setCursor: (d: Date) => void;
}) {
  const shift = (dir: number) => {
    const d = new Date(cursor);
    if (view === 'day') d.setDate(d.getDate() + dir);
    else if (view === 'week') d.setDate(d.getDate() + dir * 7);
    else d.setMonth(d.getMonth() + dir);
    setCursor(d);
  };
  const label = view === 'day'
    ? cursor.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : view === 'week'
    ? `Week of ${startOfWeek(cursor).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`
    : cursor.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <button onClick={() => shift(-1)} className="rounded-lg border border-brand-mid/30 p-2 text-brand-cream/70 hover:bg-brand-mid/40"><ChevronLeft className="h-4 w-4" /></button>
        <span className="font-display text-sm font-bold text-brand-cream">{label}</span>
        <button onClick={() => shift(1)} className="rounded-lg border border-brand-mid/30 p-2 text-brand-cream/70 hover:bg-brand-mid/40"><ChevronRight className="h-4 w-4" /></button>
        <button onClick={() => setCursor(new Date())} className="ml-2 rounded-full border border-brand-mid/30 px-3 py-1 text-xs text-brand-cream/60 hover:bg-brand-mid/40">Today</button>
      </div>
      <div className="flex gap-1">
        {(['day', 'week', 'month'] as const).map((v) => (
          <button key={v} onClick={() => setView(v)} className={`rounded-full px-3 py-1 text-xs font-semibold ${view === v ? 'bg-brand-accent text-brand-deepest' : 'text-brand-cream/60 hover:bg-brand-mid/40'}`}>
            {v.charAt(0).toUpperCase() + v.slice(1)}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Revenue
// ---------------------------------------------------------------------------
function RevenueTab({ bookings, locations, sports, courts, locName, sportName, courtName }: {
  bookings: Booking[]; locations: Location[]; sports: Sport[]; courts: Court[];
  locName: (id: string) => string; sportName: (id: string) => string; courtName: (id: string) => string;
}) {
  const paid = bookings.filter((b) => b.payment_status === 'paid' && b.booking_status !== 'cancelled');
  const today = todayISO();
  const now = new Date();
  const weekStart = startOfWeek(now);
  const weekEnd = new Date(weekStart); weekEnd.setDate(weekEnd.getDate() + 6);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const sum = (list: Booking[]) => list.reduce((s, b) => s + Number(b.final_price_aed), 0);

  const todayRev = sum(paid.filter((b) => b.booking_date === today));
  const weekRev = sum(paid.filter((b) => { const d = new Date(b.booking_date + 'T00:00:00'); return d >= weekStart && d <= weekEnd; }));
  const monthRev = sum(paid.filter((b) => { const d = new Date(b.booking_date + 'T00:00:00'); return d >= monthStart; }));

  const byLocation = locations.map((l) => ({
    name: l.name,
    total: sum(paid.filter((b) => b.location_id === l.id)),
    count: paid.filter((b) => b.location_id === l.id).length,
  })).filter((x) => x.count > 0);

  const bySport = sports.map((s) => ({
    name: s.name,
    total: sum(paid.filter((b) => b.sport_id === s.id)),
    count: paid.filter((b) => b.sport_id === s.id).length,
  })).filter((x) => x.count > 0);

  const byCourt = courts.map((c) => ({
    name: c.name,
    total: sum(paid.filter((b) => b.court_id === c.id)),
    count: paid.filter((b) => b.court_id === c.id).length,
  })).filter((x) => x.count > 0).sort((a, b) => b.total - a.total);

  const maxLoc = Math.max(...byLocation.map((x) => x.total), 1);
  const maxSport = Math.max(...bySport.map((x) => x.total), 1);
  const maxCourt = Math.max(...byCourt.map((x) => x.total), 1);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="Today" value={`AED ${todayRev.toFixed(0)}`} />
        <Metric label="This week" value={`AED ${weekRev.toFixed(0)}`} />
        <Metric label="This month" value={`AED ${monthRev.toFixed(0)}`} />
        <Metric label="Total bookings" value={paid.length} />
      </div>

      {byLocation.length > 0 && (
        <div>
          <h3 className="font-display text-sm font-bold uppercase tracking-widest text-brand-cream/60">Revenue by location</h3>
          <div className="mt-3 space-y-2">
            {byLocation.map((x) => (
              <div key={x.name}>
                <div className="flex justify-between text-xs"><span className="text-brand-cream/70">{x.name}</span><span className="font-semibold text-brand-cream">AED {x.total.toFixed(0)} · {x.count} bookings</span></div>
                <div className="mt-1 h-2 rounded-full bg-brand-mid/20"><div className="h-2 rounded-full bg-brand-accent" style={{ width: `${(x.total / maxLoc) * 100}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {bySport.length > 0 && (
        <div>
          <h3 className="font-display text-sm font-bold uppercase tracking-widest text-brand-cream/60">Revenue by sport</h3>
          <div className="mt-3 space-y-2">
            {bySport.map((x) => (
              <div key={x.name}>
                <div className="flex justify-between text-xs"><span className="text-brand-cream/70">{x.name}</span><span className="font-semibold text-brand-cream">AED {x.total.toFixed(0)} · {x.count} bookings</span></div>
                <div className="mt-1 h-2 rounded-full bg-brand-mid/20"><div className="h-2 rounded-full bg-brand-accent" style={{ width: `${(x.total / maxSport) * 100}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {byCourt.length > 0 && (
        <div>
          <h3 className="font-display text-sm font-bold uppercase tracking-widest text-brand-cream/60">Revenue by court/field</h3>
          <div className="mt-3 space-y-2">
            {byCourt.map((x) => (
              <div key={x.name}>
                <div className="flex justify-between text-xs"><span className="text-brand-cream/70">{x.name}</span><span className="font-semibold text-brand-cream">AED {x.total.toFixed(0)} · {x.count} bookings</span></div>
                <div className="mt-1 h-2 rounded-full bg-brand-mid/20"><div className="h-2 rounded-full bg-brand-accent" style={{ width: `${(x.total / maxCourt) * 100}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {paid.length === 0 && <EmptyState>No paid bookings yet. Revenue appears here once bookings are marked paid.</EmptyState>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Resources, Customers, Blocked (existing, kept intact)
// ---------------------------------------------------------------------------
function ResourcesTab({ locations, sports, courts }: { locations: Location[]; sports: Sport[]; courts: Court[] }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-display text-sm font-bold uppercase tracking-widest text-brand-cream/60">Locations</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {locations.map((l) => (
            <div key={l.id} className="rounded-2xl border border-brand-mid/20 bg-brand-deep p-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-brand-accent" />
                <h4 className="font-display text-sm font-bold text-brand-cream">{l.name}</h4>
                {!l.is_active && <span className="text-[10px] text-red-300">inactive</span>}
              </div>
              {l.address && <p className="mt-1 text-xs text-brand-cream/50">{l.address}</p>}
              <p className="mt-2 text-xs text-brand-cream/40">Courts: {courts.filter((c) => c.location_id === l.id).length}</p>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h3 className="font-display text-sm font-bold uppercase tracking-widest text-brand-cream/60">Resources (courts & fields)</h3>
        <div className="mt-3 overflow-x-auto rounded-2xl border border-brand-mid/20">
          <table className="w-full text-left text-xs">
            <thead className="bg-brand-deep text-brand-cream/60">
              <tr><Th>Name</Th><Th>Location</Th><Th>Sport</Th><Th>Type</Th><Th>Indoor</Th><Th>Active</Th></tr>
            </thead>
            <tbody>
              {courts.map((c) => {
                const loc = locations.find((l) => l.id === c.location_id);
                const sp = sports.find((s) => s.id === c.sport_id);
                const isPink = c.special_marker === 'pink' || c.name.toLowerCase().includes('pink');
                return (
                  <tr key={c.id} className="border-t border-brand-mid/15">
                    <Td><span className="flex items-center gap-1.5"><CircleDot className={`h-3.5 w-3.5 ${isPink ? 'text-pink-300' : 'text-brand-accent'}`} />{c.name}{isPink && <span className="rounded-full border border-pink-400/40 px-1.5 py-0 text-[9px] font-bold uppercase text-pink-300">pink</span>}</span></Td>
                    <Td>{loc?.name || '—'}</Td>
                    <Td>{sp?.name || '—'}</Td>
                    <Td>{c.court_type || '—'}</Td>
                    <Td>{c.is_indoor ? 'Yes' : 'No'}</Td>
                    <Td>{c.is_active ? <Check className="h-3.5 w-3.5 text-brand-accent" /> : <span className="text-red-300">off</span>}</Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function CustomersTab({ profiles, bookings, fmtDate }: { profiles: Profile[]; bookings: Booking[]; fmtDate: (d: string) => string }) {
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<Profile | null>(null);

  const filtered = useMemo(() => {
    if (!q) return profiles;
    const ql = q.toLowerCase();
    return profiles.filter((p) => (p.full_name || '').toLowerCase().includes(ql) || (p.id || '').toLowerCase().includes(ql));
  }, [profiles, q]);

  const bookingsFor = (id: string) => bookings.filter((b) => b.user_id === id);

  if (selected) {
    const list = bookingsFor(selected.id);
    const total = list.reduce((sum, b) => sum + Number(b.final_price_aed), 0);
    return (
      <div>
        <button onClick={() => setSelected(null)} className="mb-4 text-xs text-brand-accent hover:underline">← Back to customers</button>
        <div className="rounded-2xl border border-brand-mid/20 bg-brand-deep p-5">
          <h3 className="font-display text-lg font-bold text-brand-cream">{selected.full_name || '—'}</h3>
          <p className="text-xs text-brand-cream/50">Joined {fmtDate(selected.created_at.slice(0, 10))}</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <Metric label="Total bookings" value={list.length} />
            <Metric label="Total spend" value={`AED ${total.toFixed(2)}`} />
            <Metric label="Account" value={selected.is_admin ? 'Admin' : 'Customer'} />
          </div>
        </div>
        <div className="mt-4 space-y-2">
          {list.length === 0 && <EmptyState>No bookings for this customer.</EmptyState>}
          {list.map((b) => (
            <div key={b.id} className="rounded-xl border border-brand-mid/15 bg-brand-deep/60 p-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-brand-accent">{b.booking_code}</span>
                <span className="rounded-full border border-brand-mid/30 px-2 py-0.5 text-[10px] uppercase">{b.booking_status}</span>
              </div>
              <p className="mt-1 text-brand-cream/60">{fmtDate(b.booking_date)} · {b.duration_minutes}m · AED {Number(b.final_price_aed).toFixed(2)}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-cream/40" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name" className="op-input pl-9" />
      </div>
      {filtered.length === 0 ? (
        <EmptyState>No customers yet. Registrations will appear here.</EmptyState>
      ) : (
        <div className="grid gap-2">
          {filtered.map((p) => {
            const list = bookingsFor(p.id);
            const total = list.reduce((s, b) => s + Number(b.final_price_aed), 0);
            return (
              <button key={p.id} onClick={() => setSelected(p)} className="flex items-center justify-between rounded-2xl border border-brand-mid/20 bg-brand-deep p-4 text-left hover:border-brand-accent/40">
                <div>
                  <p className="font-display text-sm font-bold text-brand-cream">{p.full_name || 'Unnamed'}</p>
                  <p className="text-xs text-brand-cream/50">{p.is_admin ? 'Admin' : 'Customer'}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-brand-cream/60">{list.length} bookings</p>
                  <p className="text-xs text-brand-cream/40">AED {total.toFixed(2)}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function BlockedTab({ courts, blocked, courtName, fmtDate, onChanged }: {
  courts: Court[]; blocked: BlockedSlot[]; courtName: (id: string) => string; fmtDate: (d: string) => string; onChanged: () => void;
}) {
  const [courtId, setCourtId] = useState('');
  const [date, setDate] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const create = async () => {
    if (!supabase || !courtId || !date || !start || !end) { setErr('Fill all fields.'); return; }
    setBusy(true); setErr(null);
    const { data, error } = await supabase.rpc('create_blocked_slot', {
      p_court_id: courtId, p_date: date, p_start_time: start, p_end_time: end, p_reason: reason || null,
    });
    setBusy(false);
    if (error) { setErr(error.message); return; }
    const r = (data as any)?.[0] || (data as any);
    if (r && r.success === false) { setErr(r.error_message || 'Could not block slot.'); return; }
    setCourtId(''); setDate(''); setStart(''); setEnd(''); setReason('');
    onChanged();
  };

  const remove = async (id: string) => {
    if (!supabase) return;
    await supabase.rpc('remove_blocked_slot', { p_blocked_id: id });
    onChanged();
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-brand-mid/20 bg-brand-deep p-5">
        <h3 className="font-display text-sm font-bold uppercase tracking-widest text-brand-cream/60">Block a slot</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="text-xs text-brand-cream/60">Court
            <select value={courtId} onChange={(e) => setCourtId(e.target.value)} className="op-input mt-1">
              <option value="">Select…</option>
              {courts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label className="text-xs text-brand-cream/60">Date
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="op-input mt-1" />
          </label>
          <label className="text-xs text-brand-cream/60">Start
            <input type="time" value={start} onChange={(e) => setStart(e.target.value)} className="op-input mt-1" />
          </label>
          <label className="text-xs text-brand-cream/60">End
            <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} className="op-input mt-1" />
          </label>
          <label className="text-xs text-brand-cream/60 md:col-span-2">Reason
            <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Maintenance / event" className="op-input mt-1" />
          </label>
        </div>
        {err && <p className="mt-2 text-xs text-red-300">{err}</p>}
        <button onClick={create} disabled={busy} className="mt-4 flex items-center gap-2 rounded-full bg-brand-accent px-5 py-2.5 text-sm font-bold text-brand-deepest hover:bg-brand-light disabled:opacity-60">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />} Block slot
        </button>
      </div>
      <div>
        <h3 className="font-display text-sm font-bold uppercase tracking-widest text-brand-cream/60">Current blocks</h3>
        {blocked.length === 0 ? (
          <EmptyState>No blocked slots.</EmptyState>
        ) : (
          <div className="mt-3 grid gap-2">
            {blocked.map((b) => (
              <div key={b.id} className="flex items-center justify-between rounded-xl border border-brand-mid/20 bg-brand-deep/60 p-3 text-xs">
                <div>
                  <p className="font-semibold text-brand-cream">{courtName(b.court_id)} · {fmtDate(b.date)}</p>
                  <p className="text-brand-cream/50">{b.start_time}–{b.end_time} {b.reason ? `· ${b.reason}` : ''}</p>
                </div>
                <button onClick={() => remove(b.id)} className="flex items-center gap-1 rounded-full border border-red-400/30 px-3 py-1 text-[11px] font-semibold text-red-200 hover:bg-red-400/10">
                  <Trash2 className="h-3 w-3" /> Unblock
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Notifications — admin alert panel for new bookings
// ---------------------------------------------------------------------------
function NotificationsTab({ notifications, onChanged }: {
  notifications: Notification[]; onChanged: () => void;
}) {
  const [busy, setBusy] = useState<string | null>(null);

  const markRead = async (id: string) => {
    if (!supabase) return;
    setBusy(id);
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setBusy(null);
    if (error) { alert(error.message); return; }
    onChanged();
  };

  const markAllRead = async () => {
    if (!supabase) return;
    const unread = notifications.filter((n) => !n.is_read);
    if (unread.length === 0) return;
    setBusy('all');
    const { error } = await supabase.from('notifications').update({ is_read: true }).in('id', unread.map((n) => n.id));
    setBusy(null);
    if (error) { alert(error.message); return; }
    onChanged();
  };

  const fmtRelative = (ts: string) => {
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  const unread = notifications.filter((n) => !n.is_read);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-display text-sm font-bold uppercase tracking-widest text-brand-cream/60">
            Notifications {unread.length > 0 && <span className="text-brand-accent">({unread.length} unread)</span>}
          </h3>
        </div>
        {unread.length > 0 && (
          <button
            onClick={markAllRead}
            disabled={busy === 'all'}
            className="flex items-center gap-1.5 rounded-full border border-brand-mid/30 px-4 py-2 text-xs font-semibold text-brand-cream/70 hover:border-brand-accent/40 hover:text-brand-accent disabled:opacity-60"
          >
            {busy === 'all' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            Mark all as read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState>No notifications yet. New bookings will appear here in real time.</EmptyState>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`flex items-start gap-3 rounded-2xl border p-4 transition-colors ${
                n.is_read ? 'border-brand-mid/15 bg-brand-deepest/30' : 'border-brand-accent/30 bg-brand-accent/5'
              }`}
            >
              <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${n.is_read ? 'bg-brand-mid/30 text-brand-cream/40' : 'bg-brand-accent/15 text-brand-accent'}`}>
                <Bell className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`text-sm font-bold ${n.is_read ? 'text-brand-cream/60' : 'text-brand-cream'}`}>{n.title}</p>
                  {!n.is_read && <span className="h-2 w-2 rounded-full bg-brand-accent" />}
                </div>
                <p className="mt-0.5 text-xs text-brand-cream/60">{n.message}</p>
                <p className="mt-1 text-[10px] text-brand-cream/30">{fmtRelative(n.created_at)}</p>
              </div>
              {!n.is_read && (
                <button
                  onClick={() => markRead(n.id)}
                  disabled={busy === n.id}
                  className="shrink-0 rounded-full border border-brand-mid/30 px-3 py-1 text-[11px] font-semibold text-brand-cream/60 hover:border-brand-accent/40 hover:text-brand-accent disabled:opacity-60"
                >
                  {busy === n.id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Mark read'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------
function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-brand-mid/20 bg-brand-deep p-5">
      <p className="text-xs font-semibold uppercase tracking-widest text-brand-cream/50">{label}</p>
      <p className="mt-2 font-display text-2xl font-extrabold text-brand-cream">{value}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-brand-mid/10 pb-1">
      <span className="text-brand-cream/50">{label}</span>
      <span className="font-semibold text-brand-cream">{value}</span>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-3 py-2 font-semibold uppercase tracking-wider whitespace-nowrap">{children}</th>;
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-3 py-2 align-top text-brand-cream/80">{children}</td>;
}
function EmptyState({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-brand-mid/20 bg-brand-deep/40 p-6 text-center text-sm text-brand-cream/50">{children}</div>;
}

function paymentLabel(status: string): string {
  switch (status) {
    case 'pay_at_venue': return 'Pay at venue';
    case 'paid': return 'Paid';
    case 'partially_paid': return 'Partially paid';
    case 'pending': return 'Unpaid';
    case 'refunded': return 'Refunded';
    default: return status.replace(/_/g, ' ');
  }
}

function paymentBadgeClass(status: string): string {
  if (status === 'paid') return 'border-green-400/40 bg-green-400/10 text-green-300';
  if (status === 'pay_at_venue') return 'border-yellow-400/40 bg-yellow-400/10 text-yellow-200';
  if (status === 'refunded') return 'border-blue-400/40 bg-blue-400/10 text-blue-200';
  if (status === 'partially_paid') return 'border-blue-400/40 bg-blue-400/10 text-blue-200';
  return 'border-brand-mid/30 text-brand-cream/50';
}

function statusBadgeClass(status: string): string {
  if (status === 'confirmed') return 'border-green-400/40 bg-green-400/10 text-green-300';
  if (status === 'pending') return 'border-yellow-400/40 bg-yellow-400/10 text-yellow-200';
  if (status === 'cancelled') return 'border-red-400/40 bg-red-400/10 text-red-300';
  if (status === 'completed') return 'border-brand-accent/40 bg-brand-accent/10 text-brand-accent';
  if (status === 'no_show') return 'border-red-400/40 bg-red-400/10 text-red-300';
  return 'border-brand-mid/30 text-brand-cream/50';
}

function statusBorderClass(status: string): string {
  if (status === 'confirmed') return 'border-green-400/30';
  if (status === 'cancelled') return 'border-red-400/30';
  if (status === 'completed') return 'border-brand-accent/30';
  return 'border-brand-mid/20';
}
