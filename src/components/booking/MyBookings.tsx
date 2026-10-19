import { useState, useEffect, useCallback } from 'react';
import { Calendar, Clock, MapPin, Check, X, Loader2, ChevronLeft, Banknote } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { fetchMyBookings, cancelBooking } from '@/lib/bookingApi';
import type { BookingWithDetails } from '@/types/booking';

export default function MyBookings({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [filter, setFilter] = useState<'upcoming' | 'past'>('upcoming');

  const loadBookings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchMyBookings();
      setBookings(data);
    } catch {
      // error state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const handleCancel = async (bookingId: string) => {
    setCancelling(bookingId);
    try {
      await cancelBooking(bookingId, 'Cancelled by user');
      await loadBookings();
    } catch {
      // error
    } finally {
      setCancelling(null);
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const upcoming = bookings.filter(
    (b) => b.booking_date >= today && b.booking_status !== 'cancelled'
  );
  const past = bookings.filter(
    (b) => b.booking_date < today || b.booking_status === 'cancelled'
  );

  const display = filter === 'upcoming' ? upcoming : past;

  const statusColors: Record<string, string> = {
    pending: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-300',
    confirmed: 'border-forest-glow/30 bg-forest-glow/10 text-forest-soft',
    cancelled: 'border-red-500/30 bg-red-500/10 text-red-300',
    completed: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
  };

  return (
    <div className="min-h-screen bg-forest-darkest pt-24 pb-16">
      <div className="mx-auto max-w-4xl px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-extrabold text-white sm:text-4xl">
              MY <span className="text-gradient-green">BOOKINGS</span>
            </h1>
            <p className="mt-2 text-sm text-white-soft/50">Manage your upcoming and past bookings</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white-soft/60 transition-colors hover:bg-white/5 hover:text-white"
          >
            Back to site
          </button>
        </div>

        {/* Filter tabs */}
        <div className="mb-6 flex gap-2">
          <button
            onClick={() => setFilter('upcoming')}
            className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${
              filter === 'upcoming'
                ? 'bg-forest-glow text-forest-darkest'
                : 'border border-white/10 text-white-soft/50 hover:text-white'
            }`}
          >
            Upcoming ({upcoming.length})
          </button>
          <button
            onClick={() => setFilter('past')}
            className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${
              filter === 'past'
                ? 'bg-forest-glow text-forest-darkest'
                : 'border border-white/10 text-white-soft/50 hover:text-white'
            }`}
          >
            Past ({past.length})
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-forest-glow" />
          </div>
        ) : display.length === 0 ? (
          <div className="glass rounded-3xl border border-forest-glow/15 py-16 text-center">
            <Calendar className="mx-auto mb-4 h-12 w-12 text-white-soft/20" />
            <p className="text-white-soft/40">
              {filter === 'upcoming' ? 'No upcoming bookings yet.' : 'No past bookings.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {display.map((booking) => (
              <div
                key={booking.id}
                className="glass rounded-2xl border border-forest-glow/15 p-5 transition-all duration-300 hover:border-forest-glow/30"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-display text-lg font-bold text-white">
                        {booking.booking_code}
                      </span>
                      <span className={`rounded-full border px-3 py-0.5 text-xs font-semibold uppercase ${statusColors[booking.booking_status] ?? ''}`}>
                        {booking.booking_status}
                      </span>
                      <span className={`rounded-full border px-3 py-0.5 text-xs font-semibold uppercase ${
                        booking.payment_status === 'paid' ? 'border-forest-glow/30 bg-forest-glow/10 text-forest-soft' :
                        booking.payment_status === 'pending' ? 'border-yellow-500/30 bg-yellow-500/10 text-yellow-300' :
                        'border-red-500/30 bg-red-500/10 text-red-300'
                      }`}>
                        {booking.payment_status === 'paid' && <Banknote className="mr-1 inline h-3 w-3" />}
                        {booking.payment_status}
                      </span>
                    </div>

                    <div className="mt-3 grid gap-2 text-sm text-white-soft/60 sm:grid-cols-2">
                      <div className="flex items-center gap-2">
                        <span className="text-white-soft/40">Sport:</span>
                        <span className="font-medium text-white">{booking.sports?.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-white-soft/40">{booking.sports?.slug === 'football' ? 'Field:' : 'Court:'}</span>
                        <span className="font-medium text-white">{booking.courts?.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-forest-glow" />
                        <span className="font-medium text-white">{booking.locations?.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-forest-glow" />
                        <span className="font-medium text-white">
                          {new Date(booking.booking_date + 'T00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-forest-glow" />
                        <span className="font-medium text-white">
                          {booking.start_time.substring(0, 5)} – {booking.end_time.substring(0, 5)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-white-soft/40">Duration:</span>
                        <span className="font-medium text-white">{booking.duration_minutes} min</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-3">
                    <div className="text-right">
                      <div className="font-display text-2xl font-bold text-white">
                        AED {Number(booking.final_price_aed).toFixed(0)}
                      </div>
                      {Number(booking.discount_aed) > 0 && (
                        <div className="text-xs text-forest-soft">Saved AED {Number(booking.discount_aed).toFixed(0)}</div>
                      )}
                    </div>
                    {filter === 'upcoming' && booking.booking_status !== 'cancelled' && booking.booking_status !== 'completed' && (
                      <button
                        onClick={() => handleCancel(booking.id)}
                        disabled={cancelling === booking.id}
                        className="flex items-center gap-1.5 rounded-full border border-red-500/30 px-4 py-2 text-xs font-semibold text-red-300 transition-all hover:bg-red-500/10 disabled:opacity-50"
                      >
                        {cancelling === booking.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <X className="h-3 w-3" />
                        )}
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
