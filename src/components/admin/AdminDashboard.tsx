import { useState, useEffect, useCallback } from 'react';
import {
  Calendar, Clock, MapPin, TrendingUp, Users, Search,
  Ban, Check, X, Loader2, ChevronLeft, Banknote, LayoutGrid,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import {
  fetchAllBookings, fetchAllCourts, fetchBlockedSlots,
  createBlockedSlot, removeBlockedSlot, cancelBooking, completeBooking,
  fetchCourtPricing, updateCourtPricing,
} from '@/lib/bookingApi';
import type { BookingWithDetails, Court } from '@/types/booking';

export default function AdminDashboard({ onClose }: { onClose: () => void }) {
  const { signOut } = useAuth();
  const [tab, setTab] = useState<'overview' | 'bookings' | 'schedule' | 'pricing' | 'blocked'>('overview');
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [courts, setCourts] = useState<(Court & { locations: { name: string } | null; sports: { name: string } | null })[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pricingData, setPricingData] = useState<any[]>([]);
  const [selectedPricingCourt, setSelectedPricingCourt] = useState<string>('');

  // Blocked slot form
  const [blockCourt, setBlockCourt] = useState('');
  const [blockDate, setBlockDate] = useState('');
  const [blockStart, setBlockStart] = useState('');
  const [blockEnd, setBlockEnd] = useState('');
  const [blockReason, setBlockReason] = useState('');

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [b, c, bs] = await Promise.all([
        fetchAllBookings(),
        fetchAllCourts(),
        fetchBlockedSlots(),
      ]);
      setBookings(b);
      setCourts(c);
      setBlockedSlots(bs);
    } catch {
      // error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const loadPricing = useCallback(async () => {
    if (!selectedPricingCourt) return;
    try {
      const p = await fetchCourtPricing(selectedPricingCourt);
      setPricingData(p);
    } catch {
      // error
    }
  }, [selectedPricingCourt]);

  useEffect(() => {
    if (tab === 'pricing') loadPricing();
  }, [tab, loadPricing]);

  const today = new Date().toISOString().split('T')[0];
  const todaysBookings = bookings.filter((b) => b.booking_date === today && b.booking_status !== 'cancelled');
  const upcomingBookings = bookings.filter((b) => b.booking_date >= today && b.booking_status !== 'cancelled' && b.booking_date !== today);
  const totalRevenue = bookings
    .filter((b) => b.payment_status === 'paid')
    .reduce((sum, b) => sum + Number(b.final_price_aed), 0);

  const filteredBookings = bookings.filter((b) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      b.booking_code.toLowerCase().includes(q) ||
      b.customer_name?.toLowerCase().includes(q) ||
      b.customer_email?.toLowerCase().includes(q) ||
      b.locations?.name.toLowerCase().includes(q) ||
      b.sports?.name.toLowerCase().includes(q) ||
      b.courts?.name.toLowerCase().includes(q) ||
      b.booking_date.includes(q)
    );
  });

  const handleBlock = async () => {
    if (!blockCourt || !blockDate || !blockStart || !blockEnd) return;
    try {
      await createBlockedSlot(blockCourt, blockDate, blockStart, blockEnd, blockReason);
      setBlockCourt(''); setBlockDate(''); setBlockStart(''); setBlockEnd(''); setBlockReason('');
      const bs = await fetchBlockedSlots();
      setBlockedSlots(bs);
    } catch {
      // error
    }
  };

  const handleUnblock = async (id: string) => {
    try {
      await removeBlockedSlot(id);
      setBlockedSlots(blockedSlots.filter((s) => s.id !== id));
    } catch {
      // error
    }
  };

  const handleCancelBooking = async (id: string) => {
    try {
      await cancelBooking(id, 'Cancelled by admin');
      await loadAll();
    } catch {
      // error
    }
  };

  const handleCompleteBooking = async (id: string) => {
    try {
      await completeBooking(id);
      await loadAll();
    } catch {
      // error
    }
  };

  const handlePriceChange = async (id: string, value: string) => {
    const price = parseFloat(value);
    if (isNaN(price) || price < 0) return;
    try {
      await updateCourtPricing(id, price);
      setPricingData(pricingData.map((p) => p.id === id ? { ...p, price_aed: price } : p));
    } catch {
      // error
    }
  };

  const statusColors: Record<string, string> = {
    pending: 'text-yellow-300',
    confirmed: 'text-forest-soft',
    cancelled: 'text-red-300',
    completed: 'text-blue-300',
  };

  return (
    <div className="min-h-screen bg-forest-darkest pt-24 pb-16">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-extrabold text-white sm:text-4xl">
              ADMIN <span className="text-gradient-green">DASHBOARD</span>
            </h1>
            <p className="mt-2 text-sm text-white-soft/50">Manage bookings, courts, pricing and schedules</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white-soft/60 transition-colors hover:bg-white/5 hover:text-white"
            >
              Back to site
            </button>
            <button
              onClick={() => signOut()}
              className="rounded-xl border border-red-500/30 px-4 py-2 text-sm text-red-300 transition-colors hover:bg-red-500/10"
            >
              Sign out
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex flex-wrap gap-2">
          {([
            { id: 'overview', label: 'Overview', icon: LayoutGrid },
            { id: 'bookings', label: 'Bookings', icon: Calendar },
            { id: 'schedule', label: 'Schedule', icon: Clock },
            { id: 'pricing', label: 'Pricing', icon: Banknote },
            { id: 'blocked', label: 'Blocked Slots', icon: Ban },
          ] as const).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${
                tab === id
                  ? 'bg-forest-glow text-forest-darkest'
                  : 'border border-white/10 text-white-soft/50 hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-forest-glow" />
          </div>
        ) : (
          <>
            {/* OVERVIEW */}
            {tab === 'overview' && (
              <div className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <StatCard icon={Calendar} label="Today's Bookings" value={todaysBookings.length} />
                  <StatCard icon={Clock} label="Upcoming" value={upcomingBookings.length} />
                  <StatCard icon={TrendingUp} label="Total Revenue" value={`AED ${totalRevenue.toFixed(0)}`} />
                  <StatCard icon={Users} label="Total Courts" value={courts.length} />
                </div>

                <div className="glass rounded-2xl border border-forest-glow/15 p-6">
                  <h3 className="mb-4 font-display text-lg font-bold text-white">Today's Bookings</h3>
                  {todaysBookings.length === 0 ? (
                    <p className="py-6 text-center text-white-soft/40">No bookings today.</p>
                  ) : (
                    <div className="space-y-3">
                      {todaysBookings.map((b) => (
                        <BookingRow key={b.id} booking={b} statusColors={statusColors}
                          onCancel={() => handleCancelBooking(b.id)}
                          onComplete={() => handleCompleteBooking(b.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* BOOKINGS */}
            {tab === 'bookings' && (
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white-soft/30" />
                  <input
                    type="text"
                    placeholder="Search by booking ID, customer, date, location, sport, court..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-forest-dark/50 py-3.5 pl-12 pr-4 text-sm text-white placeholder-white-soft/30 outline-none focus:border-forest-glow/50"
                  />
                </div>
                <div className="glass rounded-2xl border border-forest-glow/15 p-6">
                  {filteredBookings.length === 0 ? (
                    <p className="py-6 text-center text-white-soft/40">No bookings found.</p>
                  ) : (
                    <div className="space-y-3">
                      {filteredBookings.slice(0, 50).map((b) => (
                        <BookingRow key={b.id} booking={b} statusColors={statusColors}
                          onCancel={() => handleCancelBooking(b.id)}
                          onComplete={() => handleCompleteBooking(b.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SCHEDULE */}
            {tab === 'schedule' && (
              <div className="glass rounded-2xl border border-forest-glow/15 p-6">
                <h3 className="mb-4 font-display text-lg font-bold text-white">Court Schedule — Today</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="py-3 pr-4 text-left font-semibold text-white-soft/50">Court</th>
                        {Array.from({ length: 15 }, (_, i) => 8 + i).map((h) => (
                          <th key={h} className="px-2 py-3 text-center font-semibold text-white-soft/50">
                            {String(h).padStart(2, '0')}:00
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {courts.map((court) => {
                        const courtBookings = bookings.filter(
                          (b) => b.court_id === court.id && b.booking_date === today && b.booking_status !== 'cancelled'
                        );
                        const courtBlocks = blockedSlots.filter(
                          (s) => s.court_id === court.id && s.date === today
                        );
                        return (
                          <tr key={court.id} className="border-b border-white/5">
                            <td className="py-3 pr-4 font-medium text-white">
                              {court.name}
                              <span className="block text-xs text-white-soft/40">{court.locations?.name}</span>
                            </td>
                            {Array.from({ length: 15 }, (_, i) => 8 + i).map((h) => {
                              const hourStr = String(h).padStart(2, '0') + ':00:00';
                              const isBooked = courtBookings.some(
                                (b) => b.start_time <= hourStr && b.end_time > hourStr
                              );
                              const isBlocked = courtBlocks.some(
                                (s) => s.start_time <= hourStr && s.end_time > hourStr
                              );
                              return (
                                <td key={h} className="px-2 py-3">
                                  <div
                                    className={`mx-auto h-8 w-full rounded-lg ${
                                      isBlocked ? 'bg-orange-500/40' :
                                      isBooked ? 'bg-red-500/30' :
                                      'bg-forest-glow/20'
                                    }`}
                                    title={isBlocked ? 'Blocked' : isBooked ? 'Booked' : 'Available'}
                                  />
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 flex gap-4 text-xs text-white-soft/50">
                  <span className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-forest-glow/20" /> Available</span>
                  <span className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-red-500/30" /> Booked</span>
                  <span className="flex items-center gap-2"><span className="h-3 w-3 rounded bg-orange-500/40" /> Blocked</span>
                </div>
              </div>
            )}

            {/* PRICING */}
            {tab === 'pricing' && (
              <div className="glass rounded-2xl border border-forest-glow/15 p-6">
                <h3 className="mb-4 font-display text-lg font-bold text-white">Court Pricing</h3>
                <select
                  value={selectedPricingCourt}
                  onChange={(e) => setSelectedPricingCourt(e.target.value)}
                  className="mb-4 w-full rounded-xl border border-white/10 bg-forest-dark/50 px-4 py-3 text-sm text-white outline-none focus:border-forest-glow/50"
                >
                  <option value="">Select a court...</option>
                  {courts.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} — {c.locations?.name}</option>
                  ))}
                </select>
                {pricingData.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="py-3 pr-4 text-left font-semibold text-white-soft/50">Duration</th>
                          <th className="px-4 py-3 text-left font-semibold text-white-soft/50">Day Type</th>
                          <th className="px-4 py-3 text-left font-semibold text-white-soft/50">Time Band</th>
                          <th className="px-4 py-3 text-right font-semibold text-white-soft/50">Price (AED)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pricingData.map((p) => (
                          <tr key={p.id} className="border-b border-white/5">
                            <td className="py-3 pr-4 text-white">{p.duration_minutes} min</td>
                            <td className="px-4 py-3 capitalize text-white-soft/70">{p.day_type}</td>
                            <td className="px-4 py-3 capitalize text-white-soft/70">{p.time_band.replace('_', '-')}</td>
                            <td className="px-4 py-3 text-right">
                              <input
                                type="number"
                                defaultValue={Number(p.price_aed)}
                                onBlur={(e) => handlePriceChange(p.id, e.target.value)}
                                className="w-24 rounded-lg border border-white/10 bg-forest-dark/50 px-3 py-1.5 text-right text-sm text-white outline-none focus:border-forest-glow/50"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* BLOCKED SLOTS */}
            {tab === 'blocked' && (
              <div className="space-y-6">
                <div className="glass rounded-2xl border border-forest-glow/15 p-6">
                  <h3 className="mb-4 font-display text-lg font-bold text-white">Block a Time Slot</h3>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    <select value={blockCourt} onChange={(e) => setBlockCourt(e.target.value)}
                      className="rounded-xl border border-white/10 bg-forest-dark/50 px-4 py-3 text-sm text-white outline-none focus:border-forest-glow/50">
                      <option value="">Court</option>
                      {courts.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.locations?.name}</option>)}
                    </select>
                    <input type="date" min={today} value={blockDate} onChange={(e) => setBlockDate(e.target.value)}
                      className="rounded-xl border border-white/10 bg-forest-dark/50 px-4 py-3 text-sm text-white outline-none focus:border-forest-glow/50 [color-scheme:dark]" />
                    <input type="time" value={blockStart} onChange={(e) => setBlockStart(e.target.value)}
                      className="rounded-xl border border-white/10 bg-forest-dark/50 px-4 py-3 text-sm text-white outline-none focus:border-forest-glow/50 [color-scheme:dark]" />
                    <input type="time" value={blockEnd} onChange={(e) => setBlockEnd(e.target.value)}
                      className="rounded-xl border border-white/10 bg-forest-dark/50 px-4 py-3 text-sm text-white outline-none focus:border-forest-glow/50 [color-scheme:dark]" />
                    <input type="text" placeholder="Reason" value={blockReason} onChange={(e) => setBlockReason(e.target.value)}
                      className="rounded-xl border border-white/10 bg-forest-dark/50 px-4 py-3 text-sm text-white placeholder-white-soft/30 outline-none focus:border-forest-glow/50" />
                  </div>
                  <button
                    onClick={handleBlock}
                    disabled={!blockCourt || !blockDate || !blockStart || !blockEnd}
                    className="btn-shine mt-4 flex items-center gap-2 rounded-full bg-forest-glow px-6 py-3 text-sm font-bold text-forest-darkest transition-all hover:bg-forest-soft disabled:opacity-30"
                  >
                    <Ban className="h-4 w-4" /> Block Slot
                  </button>
                </div>

                <div className="glass rounded-2xl border border-forest-glow/15 p-6">
                  <h3 className="mb-4 font-display text-lg font-bold text-white">Blocked Slots</h3>
                  {blockedSlots.length === 0 ? (
                    <p className="py-6 text-center text-white-soft/40">No blocked slots.</p>
                  ) : (
                    <div className="space-y-3">
                      {blockedSlots.map((s) => (
                        <div key={s.id} className="flex items-center justify-between rounded-xl border border-orange-500/20 bg-orange-500/5 p-4">
                          <div className="text-sm">
                            <span className="font-medium text-white">{s.courts?.name}</span>
                            <span className="ml-3 text-white-soft/60">{s.date}</span>
                            <span className="ml-3 text-white-soft/60">{s.start_time?.substring(0, 5)} – {s.end_time?.substring(0, 5)}</span>
                            {s.reason && <span className="ml-3 text-white-soft/40">({s.reason})</span>}
                          </div>
                          <button
                            onClick={() => handleUnblock(s.id)}
                            className="flex items-center gap-1.5 rounded-full border border-red-500/30 px-3 py-1.5 text-xs font-semibold text-red-300 transition-all hover:bg-red-500/10"
                          >
                            <X className="h-3 w-3" /> Unblock
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
  return (
    <div className="glass rounded-2xl border border-forest-glow/15 p-5">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-forest-glow/10 text-forest-glow">
        <Icon className="h-5 w-5" />
      </div>
      <div className="font-display text-2xl font-bold text-white">{value}</div>
      <div className="text-xs uppercase tracking-wider text-white-soft/40">{label}</div>
    </div>
  );
}

function BookingRow({
  booking, statusColors, onCancel, onComplete,
}: {
  booking: BookingWithDetails;
  statusColors: Record<string, string>;
  onCancel: () => void;
  onComplete: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-white/5 bg-forest-dark/20 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold text-forest-glow">{booking.booking_code}</span>
          <span className={`text-xs font-semibold uppercase ${statusColors[booking.booking_status] ?? ''}`}>
            {booking.booking_status}
          </span>
        </div>
        <div className="mt-1 text-sm text-white-soft/60">
          {booking.customer_name} · {booking.sports?.name} · {booking.courts?.name} · {booking.locations?.name}
        </div>
        <div className="text-xs text-white-soft/40">
          {booking.booking_date} · {booking.start_time?.substring(0, 5)}–{booking.end_time?.substring(0, 5)} · {booking.duration_minutes}min · AED {Number(booking.final_price_aed).toFixed(0)} · {booking.payment_status}
        </div>
      </div>
      <div className="flex gap-2">
        {booking.booking_status === 'confirmed' && (
          <button onClick={onComplete}
            className="flex items-center gap-1.5 rounded-full border border-blue-500/30 px-3 py-1.5 text-xs font-semibold text-blue-300 transition-all hover:bg-blue-500/10">
            <Check className="h-3 w-3" /> Complete
          </button>
        )}
        {booking.booking_status !== 'cancelled' && booking.booking_status !== 'completed' && (
          <button onClick={onCancel}
            className="flex items-center gap-1.5 rounded-full border border-red-500/30 px-3 py-1.5 text-xs font-semibold text-red-300 transition-all hover:bg-red-500/10">
            <X className="h-3 w-3" /> Cancel
          </button>
        )}
      </div>
    </div>
  );
}
