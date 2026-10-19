import { useEffect, useState, useMemo } from 'react';
import {
  X, Calendar, Users, Building2, Ban, BarChart3, Loader2, AlertCircle,
  Search, MapPin, CircleDot, Clock, Check, Trash2, ShieldAlert,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Booking, Location, Court, Sport, Profile, BlockedSlot, Payment } from '@/lib/types';

type Tab = 'overview' | 'bookings' | 'resources' | 'customers' | 'blocked';

export default function AdminDashboard({ onClose }: { onClose: () => void }) {
  const { isAdmin, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<Tab>('overview');

  const [locations, setLocations] = useState<Location[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [blocked, setBlocked] = useState<BlockedSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!supabase) { setError('Backend unavailable'); setLoading(false); return; }
    setLoading(true);
    const [bk, loc, ct, sp, pr, pm, bl] = await Promise.all([
      supabase.from('bookings').select('*').order('created_at', { ascending: false }).limit(200),
      supabase.from('locations').select('*').order('sort_order'),
      supabase.from('courts').select('*').order('sort_order'),
      supabase.from('sports').select('*').order('sort_order'),
      supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(200),
      supabase.from('payments').select('*').order('created_at', { ascending: false }).limit(200),
      supabase.from('blocked_slots').select('*').order('date', { ascending: false }).limit(200),
    ]);
    if (bk.error) setError(bk.error.message);
    setBookings((bk.data as Booking[]) || []);
    setLocations((loc.data as Location[]) || []);
    setCourts((ct.data as Court[]) || []);
    setSports((sp.data as Sport[]) || []);
    setProfiles((pr.data as Profile[]) || []);
    setPayments((pm.data as Payment[]) || []);
    setBlocked((bl.data as BlockedSlot[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Guard: only admins may view this dashboard. Server-side RLS also enforces this.
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
  const fmtTime = (t: string) => { if (!t) return ''; const [h, m] = t.split(':').map(Number); const hh = ((h + 11) % 12) + 1; return `${hh}:${m.toString().padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`; };
  const fmtDate = (d: string) => d ? new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
  const today = new Date().toISOString().slice(0, 10);

  // Overview metrics
  const todayBookings = bookings.filter((b) => b.booking_date === today);
  const upcomingBookings = bookings.filter((b) => b.booking_date >= today && b.booking_status === 'confirmed');
  const todaysRevenue = bookings
    .filter((b) => b.booking_date === today && b.payment_status === 'paid')
    .reduce((sum, b) => sum + Number(b.final_price_aed), 0);
  const paidCount = bookings.filter((b) => b.payment_status === 'paid').length;
  const pendingCount = bookings.filter((b) => b.payment_status === 'pending').length;
  const footballBookings = bookings.filter((b) => sportName(b.sport_id).toLowerCase() === 'football').length;
  const padelBookings = bookings.filter((b) => sportName(b.sport_id).toLowerCase() === 'padel').length;
  const newCustomers = profiles.length;
  const cancelledCount = bookings.filter((b) => b.booking_status === 'cancelled').length;
  const activeCourts = courts.filter((c) => c.is_active).length;

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
              <h2 className="font-display text-lg font-bold text-brand-cream">Admin dashboard</h2>
              <p className="text-xs text-brand-cream/50">OnPeak Sports Club management</p>
            </div>
          </div>
          <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-lg text-brand-cream/60 hover:bg-brand-mid/40" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1 border-b border-brand-mid/20 px-4 py-2">
          {([
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'bookings', label: 'Bookings', icon: Calendar },
            { id: 'resources', label: 'Resources', icon: Building2 },
            { id: 'customers', label: 'Customers', icon: Users },
            { id: 'blocked', label: 'Blocked slots', icon: Ban },
          ] as { id: Tab; label: string; icon: typeof BarChart3 }[]).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
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
            <div className="grid gap-4 md:grid-cols-3">
              <Metric label="Today's bookings" value={todayBookings.length} />
              <Metric label="Upcoming bookings" value={upcomingBookings.length} />
              <Metric label="Today's revenue" value={`AED ${todaysRevenue.toFixed(2)}`} />
              <Metric label="Paid" value={paidCount} />
              <Metric label="Pending payments" value={pendingCount} />
              <Metric label="Active resources" value={activeCourts} />
              <Metric label="Football bookings" value={footballBookings} />
              <Metric label="Padel bookings" value={padelBookings} />
              <Metric label="New customers" value={newCustomers} />
              <Metric label="Cancelled" value={cancelledCount} />
              <Metric label="Blocked slots" value={blocked.length} />
              <Metric label="Total locations" value={locations.length} />
            </div>
          )}

          {!loading && tab === 'bookings' && <BookingsTab bookings={bookings} locName={locName} courtName={courtName} sportName={sportName} fmtDate={fmtDate} fmtTime={fmtTime} />}

          {!loading && tab === 'resources' && (
            <ResourcesTab locations={locations} sports={sports} courts={courts} />
          )}

          {!loading && tab === 'customers' && (
            <CustomersTab profiles={profiles} bookings={bookings} fmtDate={fmtDate} />
          )}

          {!loading && tab === 'blocked' && (
            <BlockedTab courts={courts} blocked={blocked} courtName={courtName} fmtDate={fmtDate} onChanged={load} />
          )}
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-brand-mid/20 bg-brand-deep p-5">
      <p className="text-xs font-semibold uppercase tracking-widest text-brand-cream/50">{label}</p>
      <p className="mt-2 font-display text-2xl font-extrabold text-brand-cream">{value}</p>
    </div>
  );
}

function BookingsTab({
  bookings, locName, courtName, sportName, fmtDate, fmtTime,
}: {
  bookings: Booking[];
  locName: (id: string) => string;
  courtName: (id: string) => string;
  sportName: (id: string) => string;
  fmtDate: (d: string) => string;
  fmtTime: (t: string) => string;
}) {
  const [q, setQ] = useState('');
  const [locFilter, setLocFilter] = useState('');
  const [sportFilter, setSportFilter] = useState('');

  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      if (locFilter && b.location_id !== locFilter) return false;
      if (sportFilter && b.sport_id !== sportFilter) return false;
      if (q) {
        const ql = q.toLowerCase();
        return (
          b.booking_code.toLowerCase().includes(ql) ||
          (b.customer_name || '').toLowerCase().includes(ql) ||
          (b.customer_email || '').toLowerCase().includes(ql)
        );
      }
      return true;
    });
  }, [bookings, q, locFilter, sportFilter]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-cream/40" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search code, name, email" className="op-input pl-9" />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState>No bookings match your filters.</EmptyState>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-brand-mid/20">
          <table className="w-full text-left text-xs">
            <thead className="bg-brand-deep text-brand-cream/60">
              <tr>
                <Th>Code</Th><Th>Customer</Th><Th>Sport</Th><Th>Court</Th><Th>Date</Th><Th>Time</Th><Th>AED</Th><Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr key={b.id} className="border-t border-brand-mid/15">
                  <Td><span className="font-mono font-bold text-brand-accent">{b.booking_code}</span></Td>
                  <Td>{b.customer_name || '—'}<br /><span className="text-brand-cream/40">{b.customer_email}</span></Td>
                  <Td>{sportName(b.sport_id)}</Td>
                  <Td>{courtName(b.court_id)}</Td>
                  <Td>{fmtDate(b.booking_date)}</Td>
                  <Td>{fmtTime(b.start_time)} · {b.duration_minutes}m</Td>
                  <Td>{Number(b.final_price_aed).toFixed(2)}</Td>
                  <Td>
                    <span className="rounded-full border border-brand-mid/30 px-2 py-0.5 text-[10px] font-semibold uppercase">{b.booking_status}</span>
                    <span className="mt-1 block text-[10px] text-brand-cream/40">{b.payment_status.replace('_', ' ')}</span>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

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
                    <Td>
                      <span className="flex items-center gap-1.5">
                        <CircleDot className={`h-3.5 w-3.5 ${isPink ? 'text-pink-300' : 'text-brand-accent'}`} />
                        {c.name}
                        {isPink && <span className="rounded-full border border-pink-400/40 px-1.5 py-0 text-[9px] font-bold uppercase text-pink-300">pink</span>}
                      </span>
                    </Td>
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
    return profiles.filter((p) =>
      (p.full_name || '').toLowerCase().includes(ql) ||
      (p.id || '').toLowerCase().includes(ql)
    );
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

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-3 py-2 font-semibold uppercase tracking-wider">{children}</th>;
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-3 py-2 align-top text-brand-cream/80">{children}</td>;
}
function EmptyState({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-brand-mid/20 bg-brand-deep/40 p-6 text-center text-sm text-brand-cream/50">{children}</div>;
}
