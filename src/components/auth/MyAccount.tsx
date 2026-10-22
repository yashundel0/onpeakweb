import { useEffect, useState } from 'react';
import { X, Loader2, Calendar, Clock, MapPin, CircleDot, AlertCircle, Trash2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Booking, Location, Court, Sport } from '@/lib/types';

export default function MyAccount({ onClose, onOpenAdmin }: { onClose: () => void; onOpenAdmin: () => void }) {
  const { user, profile, isAdmin, signOut } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);

  const load = async () => {
    if (!supabase || !user) return;
    setLoading(true);
    const [bk, loc, ct, sp] = await Promise.all([
      supabase.from('bookings').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('locations').select('*'),
      supabase.from('courts').select('*'),
      supabase.from('sports').select('*'),
    ]);
    if (bk.error) setError(bk.error.message);
    setBookings((bk.data as Booking[]) || []);
    setLocations((loc.data as Location[]) || []);
    setCourts((ct.data as Court[]) || []);
    setSports((sp.data as Sport[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const cancel = async (id: string) => {
    if (!supabase) return;
    setCancelling(id);
    const { data, error } = await supabase.rpc('cancel_booking', { p_booking_id: id });
    setCancelling(null);
    if (error) { setError(error.message); return; }
    const r = (data as any)?.[0] || (data as any);
    if (r && r.success === false) { setError(r.error_message || 'Could not cancel booking.'); return; }
    load();
  };

  const locName = (id: string) => locations.find((l) => l.id === id)?.name || '—';
  const courtName = (id: string) => courts.find((c) => c.id === id)?.name || '—';
  const sportName = (id: string) => sports.find((s) => s.id === id)?.name || '—';
  const fmtTime = (t: string) => { if (!t) return ''; const [h, m] = t.split(':').map(Number); const hh = ((h + 11) % 12) + 1; return `${hh}:${m.toString().padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`; };
  const fmtDate = (d: string) => d ? new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : '';

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-brand-deepest/90 backdrop-blur-md p-4" onClick={onClose}>
      <div className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-brand-mid/30 bg-brand-deep shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-brand-mid/20 px-6 py-4">
          <div>
            <h2 className="font-display text-lg font-bold text-brand-cream">My account</h2>
            <p className="text-xs text-brand-cream/50">{profile?.full_name || user?.email}</p>
          </div>
          <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-lg text-brand-cream/60 hover:bg-brand-mid/40" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {error && <ErrorNote>{error}</ErrorNote>}

          <div className="mb-5 flex flex-wrap gap-2">
            {isAdmin && (
              <button onClick={onOpenAdmin} className="rounded-full bg-brand-accent px-4 py-2 text-xs font-bold text-brand-deepest hover:bg-brand-light">
                Admin dashboard
              </button>
            )}
            <button onClick={async () => { await signOut(); onClose(); }} className="rounded-full border border-brand-mid/30 px-4 py-2 text-xs font-semibold text-brand-cream/70 hover:border-brand-accent/40">
              Sign out
            </button>
          </div>

          <h3 className="font-display text-sm font-bold uppercase tracking-widest text-brand-cream/60">My bookings</h3>

          {loading && <div className="flex items-center py-8 text-brand-cream/60"><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading…</div>}

          {!loading && bookings.length === 0 && (
            <div className="mt-3 rounded-2xl border border-brand-mid/20 bg-brand-deepest/40 p-6 text-center text-sm text-brand-cream/50">
              You have no bookings yet.
            </div>
          )}

          <div className="mt-3 space-y-3">
            {bookings.map((b) => (
              <div key={b.id} className="rounded-2xl border border-brand-mid/20 bg-brand-deepest/40 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-brand-accent">{b.booking_code}</span>
                      <StatusBadge status={b.booking_status} />
                      <PaymentBadge status={b.payment_status} />
                    </div>
                    <div className="mt-2 grid gap-1 text-xs text-brand-cream/70 sm:grid-cols-2">
                      <span className="flex items-center gap-1"><CircleDot className="h-3.5 w-3.5 text-brand-accent" /> {sportName(b.sport_id)} · {courtName(b.court_id)}</span>
                      <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-brand-accent" /> {locName(b.location_id)}</span>
                      <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5 text-brand-accent" /> {fmtDate(b.booking_date)}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-brand-accent" /> {fmtTime(b.start_time)} · {b.duration_minutes} min</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-base font-bold text-brand-cream">AED {Number(b.final_price_aed).toFixed(2)}</p>
                    {(b.booking_status === 'pending' || b.booking_status === 'confirmed') && (
                      <button
                        onClick={() => cancel(b.id)}
                        disabled={cancelling === b.id}
                        className="mt-2 inline-flex items-center gap-1 rounded-full border border-red-400/30 px-3 py-1 text-[11px] font-semibold text-red-200 hover:bg-red-400/10 disabled:opacity-60"
                      >
                        {cancelling === b.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />} Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: 'border-yellow-400/40 text-yellow-300',
    confirmed: 'border-brand-accent/50 text-brand-accent',
    completed: 'border-blue-400/40 text-blue-300',
    cancelled: 'border-red-400/40 text-red-300',
    no_show: 'border-orange-400/40 text-orange-300',
    expired: 'border-brand-cream/30 text-brand-cream/60',
  };
  return <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${map[status] || 'border-brand-cream/30 text-brand-cream/60'}`}>{status}</span>;
}

function PaymentBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: 'border-yellow-400/30 text-yellow-200/80',
    paid: 'border-brand-accent/40 text-brand-accent',
    failed: 'border-red-400/40 text-red-300',
    refunded: 'border-purple-400/40 text-purple-300',
    partially_refunded: 'border-purple-400/40 text-purple-300',
    partially_paid: 'border-yellow-400/40 text-yellow-300',
  };
  return <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${map[status] || 'border-brand-cream/30 text-brand-cream/60'}`}>{status.replace('_', ' ')}</span>;
}

function ErrorNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{children}</span>
    </div>
  );
}
