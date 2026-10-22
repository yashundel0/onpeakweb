import { useState, useMemo, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, navigate } from '@/lib/router';
import type { useAdminData } from '@/hooks/useAdminData';
import type { Booking } from '@/lib/types';
import { todayISO, fmtTime, fmtDate, fmtDateTime, statusBadgeClass, paymentBadgeClass, paymentLabel } from '@/lib/utils';
import { Search, Loader2, Edit3, X, MapPin, Calendar, Clock, Phone, Mail, CircleDot, User, RefreshCw } from 'lucide-react';

type AdminData = ReturnType<typeof useAdminData>;

type DateFilter = 'all' | 'today' | 'tomorrow' | 'week' | 'custom';

export default function Bookings({ adminData }: { adminData: AdminData }) {
  const { bookings, locations, sports, courts, locName, courtName, sportName, sportSlug, loading, load } = adminData;
  const path = useRouter();

  const [q, setQ] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [customDate, setCustomDate] = useState('');
  const [fLocation, setFLocation] = useState('');
  const [fSport, setFSport] = useState('');
  const [fStatus, setFStatus] = useState('');
  const [fPayment, setFPayment] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  // Open detail from URL param ?id=
  useEffect(() => {
    const params = new URLSearchParams(path.split('?')[1] || '');
    const id = params.get('id');
    if (id) setSelectedId(id);
  }, [path]);

  const today = todayISO();
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowISO = tomorrow.toISOString().slice(0, 10);
  const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart); weekEnd.setDate(weekEnd.getDate() + 6);

  const filtered = useMemo(() => bookings.filter((b) => {
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
  }), [bookings, q, dateFilter, customDate, fLocation, fSport, fStatus, fPayment, today, tomorrowISO, weekStart, weekEnd, sportSlug]);

  const selected = selectedId ? bookings.find((b) => b.id === selectedId) || null : null;

  const updateStatus = async (b: Booking, status: string) => {
    setBusy(b.id);
    const { data, error } = await supabase.rpc('update_booking_admin', {
      p_booking_id: b.id, p_booking_status: status, p_payment_status: null, p_admin_notes: null, p_notes: null,
    });
    setBusy(null);
    if (error || (data && (data as any)?.[0]?.success === false)) {
      alert(error?.message || 'Failed to update'); return;
    }
    load();
  };

  const updatePayment = async (b: Booking, payment: string) => {
    setBusy(b.id);
    const { data, error } = await supabase.rpc('update_booking_admin', {
      p_booking_id: b.id, p_booking_status: null, p_payment_status: payment, p_admin_notes: null, p_notes: null,
    });
    setBusy(null);
    if (error || (data && (data as any)?.[0]?.success === false)) {
      alert(error?.message || 'Failed to update'); return;
    }
    load();
  };

  if (selected) {
    return <BookingDetail booking={selected} locName={locName} courtName={courtName} sportName={sportName} onBack={() => { setSelectedId(null); navigate('/bookings'); }} onChanged={load} busy={busy} onStatus={updateStatus} onPayment={updatePayment} />;
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-brand-cream">Bookings</h2>
          <p className="text-sm text-brand-cream/40">{filtered.length} of {bookings.length} bookings</p>
        </div>
        <button onClick={load} className="op-btn-ghost flex items-center gap-1.5"><RefreshCw className="h-4 w-4" /> Refresh</button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[180px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-cream/40" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, phone, email, booking ID" className="op-input pl-9" />
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
          {sports.map((s) => <option key={s.id} value={s.slug}>{s.name}</option>)}
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
      </div>

      {loading ? (
        <div className="flex items-center py-16 text-brand-cream/40"><div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-mid border-t-brand-accent" /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-brand-mid/20 bg-brand-deep/40 p-8 text-center text-sm text-brand-cream/40">No bookings match your filters.</div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-brand-mid/20">
          <table className="w-full text-left text-xs">
            <thead className="bg-brand-deep text-brand-cream/50">
              <tr>
                {['Booking #', 'Customer', 'Phone', 'Location', 'Sport', 'Court', 'Date', 'Time', 'Duration', 'Price', 'Payment', 'Status', 'Created', ''].map((h, i) => (
                  <th key={i} className="whitespace-nowrap px-3 py-2 font-semibold uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr key={b.id} className="border-t border-brand-mid/15 hover:bg-brand-mid/10">
                  <td className="px-3 py-2 font-mono font-bold text-brand-accent">{b.booking_code}</td>
                  <td className="px-3 py-2 text-brand-cream/80">{b.customer_name || '—'}</td>
                  <td className="px-3 py-2 text-brand-cream/60">{b.customer_phone || '—'}</td>
                  <td className="px-3 py-2 text-brand-cream/60">{locName(b.location_id)}</td>
                  <td className="px-3 py-2 text-brand-cream/60">{sportName(b.sport_id)}</td>
                  <td className="px-3 py-2 text-brand-cream/60">{courtName(b.court_id)}</td>
                  <td className="px-3 py-2 text-brand-cream/60">{fmtDate(b.booking_date)}</td>
                  <td className="px-3 py-2 text-brand-cream/80">{fmtTime(b.start_time)}</td>
                  <td className="px-3 py-2 text-brand-cream/50">{b.duration_minutes}m</td>
                  <td className="px-3 py-2 text-brand-cream/80">{Number(b.final_price_aed).toFixed(0)}</td>
                  <td className="px-3 py-2">
                    <select
                      value={b.payment_status}
                      onChange={(e) => updatePayment(b, e.target.value)}
                      disabled={busy === b.id}
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${paymentBadgeClass(b.payment_status)}`}
                    >
                      <option value="pay_at_venue">Pay at venue</option>
                      <option value="paid">Paid</option>
                      <option value="partially_paid">Partially paid</option>
                      <option value="pending">Unpaid</option>
                      <option value="refunded">Refunded</option>
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={b.booking_status}
                      onChange={(e) => updateStatus(b, e.target.value)}
                      disabled={busy === b.id}
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusBadgeClass(b.booking_status)}`}
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="completed">Completed</option>
                      <option value="no_show">No-show</option>
                    </select>
                  </td>
                  <td className="px-3 py-2 text-brand-cream/40">{new Date(b.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</td>
                  <td className="px-3 py-2">
                    <button onClick={() => { setSelectedId(b.id); navigate(`/bookings?id=${b.id}`); }} className="rounded-lg p-1.5 text-brand-cream/50 hover:bg-brand-mid/40 hover:text-brand-accent" title="View details">
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    {busy === b.id && <Loader2 className="ml-1 h-3.5 w-3.5 animate-spin text-brand-cream/40" />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function BookingDetail({ booking, locName, courtName, sportName, onBack, onChanged, busy, onStatus, onPayment }: {
  booking: Booking;
  locName: (id: string) => string; courtName: (id: string) => string; sportName: (id: string) => string;
  onBack: () => void; onChanged: () => void;
  busy: string | null;
  onStatus: (b: Booking, status: string) => void;
  onPayment: (b: Booking, payment: string) => void;
}) {
  const [adminNotes, setAdminNotes] = useState(booking.admin_notes || '');
  const [saving, setSaving] = useState(false);

  const saveNotes = async () => {
    setSaving(true);
    const { error } = await supabase.rpc('update_booking_admin', {
      p_booking_id: booking.id, p_booking_status: null, p_payment_status: null, p_admin_notes: adminNotes, p_notes: null,
    });
    setSaving(false);
    if (error) { alert(error.message); return; }
    onChanged();
  };

  return (
    <div>
      <button onClick={onBack} className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-brand-cream/60 hover:text-brand-cream">
        <X className="h-4 w-4" /> Back to bookings
      </button>

      <div className="op-card overflow-hidden">
        {/* Header */}
        <div className="border-b border-brand-mid/20 bg-brand-deepest/50 px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="font-mono text-lg font-bold text-brand-accent">#{booking.booking_code}</span>
            <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusBadgeClass(booking.booking_status)}`}>{booking.booking_status}</span>
            <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${paymentBadgeClass(booking.payment_status)}`}>{paymentLabel(booking.payment_status)}</span>
          </div>
          <p className="mt-2 text-xs text-brand-cream/40">Created {fmtDateTime(booking.created_at)}</p>
        </div>

        {/* Details grid */}
        <div className="grid gap-6 p-6 md:grid-cols-2">
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-brand-cream/50">Customer</h3>
            <DetailRow icon={<User className="h-4 w-4" />} label="Name" value={booking.customer_name || '—'} />
            <DetailRow icon={<Phone className="h-4 w-4" />} label="Phone" value={booking.customer_phone || '—'} />
            <DetailRow icon={<Mail className="h-4 w-4" />} label="Email" value={booking.customer_email || '—'} />
            {booking.players_count && <DetailRow icon={<User className="h-4 w-4" />} label="Players" value={String(booking.players_count)} />}
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-brand-cream/50">Booking</h3>
            <DetailRow icon={<MapPin className="h-4 w-4" />} label="Location" value={locName(booking.location_id)} />
            <DetailRow icon={<CircleDot className="h-4 w-4" />} label="Sport" value={sportName(booking.sport_id)} />
            <DetailRow icon={<CircleDot className="h-4 w-4" />} label="Court / Field" value={courtName(booking.court_id)} />
            <DetailRow icon={<Calendar className="h-4 w-4" />} label="Date" value={fmtDate(booking.booking_date)} />
            <DetailRow icon={<Clock className="h-4 w-4" />} label="Time" value={`${fmtTime(booking.start_time)} - ${fmtTime(booking.end_time)}`} />
            <DetailRow icon={<Clock className="h-4 w-4" />} label="Duration" value={`${booking.duration_minutes} minutes`} />
          </div>
        </div>

        {/* Price */}
        <div className="border-t border-brand-mid/20 px-6 py-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-brand-cream/50">Original price</span>
            <span className="text-brand-cream/60">AED {Number(booking.price_aed).toFixed(2)}</span>
          </div>
          {booking.discount_aed && Number(booking.discount_aed) > 0 && (
            <div className="mt-1 flex items-center justify-between text-sm">
              <span className="text-brand-cream/50">Discount</span>
              <span className="text-green-300">- AED {Number(booking.discount_aed).toFixed(2)}</span>
            </div>
          )}
          <div className="mt-2 flex items-center justify-between border-t border-brand-mid/15 pt-2">
            <span className="font-display font-bold text-brand-cream">Total</span>
            <span className="font-display text-lg font-bold text-brand-accent">AED {Number(booking.final_price_aed).toFixed(2)}</span>
          </div>
        </div>

        {/* Admin actions */}
        <div className="border-t border-brand-mid/20 px-6 py-5">
          <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-brand-cream/50">Admin Actions</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-brand-cream/60">Booking Status</label>
              <select
                value={booking.booking_status}
                onChange={(e) => onStatus(booking, e.target.value)}
                disabled={busy === booking.id}
                className={`op-input ${statusBadgeClass(booking.booking_status)}`}
              >
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="no_show">No-show</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-brand-cream/60">Payment Status</label>
              <select
                value={booking.payment_status}
                onChange={(e) => onPayment(booking, e.target.value)}
                disabled={busy === booking.id}
                className={`op-input ${paymentBadgeClass(booking.payment_status)}`}
              >
                <option value="pay_at_venue">Pay at venue</option>
                <option value="paid">Paid</option>
                <option value="partially_paid">Partially paid</option>
                <option value="pending">Unpaid</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="mb-1.5 block text-xs font-semibold text-brand-cream/60">Admin Notes</label>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={3}
              placeholder="Internal notes about this booking..."
              className="op-input w-full resize-none"
            />
            <button onClick={saveNotes} disabled={saving} className="op-btn mt-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Notes'}
            </button>
          </div>

          {booking.notes && (
            <div className="mt-4 rounded-xl border border-brand-mid/20 bg-brand-deepest/40 p-3">
              <p className="text-xs font-semibold text-brand-cream/50">Customer Notes</p>
              <p className="mt-1 text-sm text-brand-cream/70">{booking.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-brand-cream/40">{icon}</span>
      <span className="text-brand-cream/50">{label}</span>
      <span className="ml-auto font-semibold text-brand-cream">{value}</span>
    </div>
  );
}
