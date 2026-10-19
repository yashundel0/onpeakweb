import { useState, useEffect, useCallback } from 'react';
import {
  MapPin, CircleDot, Trophy, Clock, Calendar, Tag,
  Loader2, Check, ChevronLeft, User, Mail, Phone, ArrowRight,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import {
  fetchLocations, fetchSports, fetchCourts, fetchAvailableSlots, createBooking, confirmBookingPayment,
} from '@/lib/bookingApi';
import type { Location, Sport, Court, AvailableSlot, CreateBookingResult } from '@/types/booking';
import AuthModal from '@/components/auth/AuthModal';

const STEPS = ['Location', 'Sport', 'Court', 'Date', 'Time', 'Duration', 'Details', 'Payment', 'Confirmation'] as const;
type Step = typeof STEPS[number];

const DURATIONS = [60, 90, 120];

export default function BookingFlow({
  preselectedSport,
  onClose,
}: {
  preselectedSport?: 'padel' | 'football';
  onClose?: () => void;
}) {
  const { user, profile } = useAuth();
  const [step, setStep] = useState<Step>(preselectedSport ? 'Court' : 'Location');
  const [authOpen, setAuthOpen] = useState(false);

  const [locations, setLocations] = useState<Location[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [slots, setSlots] = useState<AvailableSlot[]>([]);

  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [selectedSport, setSelectedSport] = useState<string>('');
  const [selectedCourt, setSelectedCourt] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<number>(60);

  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingResult, setBookingResult] = useState<CreateBookingResult | null>(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  useEffect(() => {
    fetchLocations().then(setLocations).catch(() => {});
    fetchSports().then(setSports).catch(() => {});
  }, []);

  useEffect(() => {
    if (profile?.full_name) setCustomerName(profile.full_name);
    if (profile?.phone) setCustomerPhone(profile.phone);
    if (user?.email) setCustomerEmail(user.email);
  }, [profile, user]);

  const loadCourts = useCallback(async () => {
    if (!selectedLocation || !selectedSport) return;
    setLoading(true);
    try {
      const c = await fetchCourts(selectedLocation, selectedSport);
      setCourts(c);
    } catch {
      setError('Failed to load courts');
    } finally {
      setLoading(false);
    }
  }, [selectedLocation, selectedSport]);

  const loadSlots = useCallback(async () => {
    if (!selectedCourt || !selectedDate) return;
    setLoading(true);
    setError(null);
    try {
      const s = await fetchAvailableSlots(selectedCourt, selectedDate);
      setSlots(s);
    } catch {
      setError('Failed to load availability');
    } finally {
      setLoading(false);
    }
  }, [selectedCourt, selectedDate]);

  useEffect(() => {
    if (step === 'Court') loadCourts();
  }, [step, loadCourts]);

  useEffect(() => {
    if (step === 'Time') loadSlots();
  }, [step, loadSlots]);

  // If sport preselected, set it and skip to court selection after location is picked
  useEffect(() => {
    if (preselectedSport && sports.length > 0) {
      const sport = sports.find((s) => s.slug === preselectedSport);
      if (sport) setSelectedSport(sport.id);
    }
  }, [preselectedSport, sports]);

  const stepIndex = STEPS.indexOf(step);

  const goNext = () => {
    const next = STEPS[stepIndex + 1];
    if (next) setStep(next);
  };

  const goBack = () => {
    if (stepIndex === 0) return;
    const prev = STEPS[stepIndex - 1];
    if (prev) setStep(prev);
  };

  const handleSelectLocation = (id: string) => {
    setSelectedLocation(id);
    if (preselectedSport && selectedSport) {
      setStep('Court');
    } else {
      goNext();
    }
  };

  const handleSelectSport = (id: string) => {
    setSelectedSport(id);
    goNext();
  };

  const handleSelectCourt = (id: string) => {
    setSelectedCourt(id);
    goNext();
  };

  const todayStr = new Date().toISOString().split('T')[0];

  const handleSelectSlot = (slot: AvailableSlot) => {
    if (!slot.is_available) return;
    setSelectedSlot(slot);
    setSelectedDuration(slot.duration_minutes);
    setStep('Duration');
  };

  const handleConfirmBooking = async () => {
    if (!user) {
      setAuthOpen(true);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await createBooking({
        courtId: selectedCourt,
        bookingDate: selectedDate,
        startTime: selectedSlot!.start_time,
        durationMinutes: selectedDuration,
        customerName,
        customerEmail,
        customerPhone,
        promoCode: promoCode || undefined,
        notes: notes || undefined,
      });
      if (result.success) {
        setBookingResult(result);
        setStep('Payment');
      } else {
        setError(result.error_message);
        if (result.error_message.includes('slot')) {
          loadSlots();
          setStep('Time');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!bookingResult) return;
    setPaymentProcessing(true);
    setError(null);
    try {
      // Payment gateway integration point — currently manual/cash
      // In production, this is where a UAE payment gateway (e.g. Telr, PayTabs, Stripe) would be called
      const result = await confirmBookingPayment(bookingResult.booking_id);
      if (result.success) {
        setStep('Confirmation');
      } else {
        setError(result.error_message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setPaymentProcessing(false);
    }
  };

  const selectedLocationObj = locations.find((l) => l.id === selectedLocation);
  const selectedSportObj = sports.find((s) => s.id === selectedSport);
  const selectedCourtObj = courts.find((c) => c.id === selectedCourt);
  const availableDurations = DURATIONS;

  return (
    <div className="min-h-screen bg-forest-darkest pt-24 pb-16">
      <div className="mx-auto max-w-4xl px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-extrabold text-white sm:text-4xl">
              BOOK A <span className="text-gradient-green">COURT</span>
            </h1>
            <p className="mt-2 text-sm text-white-soft/50">
              Real-time availability · Instant confirmation
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white-soft/60 transition-colors hover:bg-white/5 hover:text-white"
            >
              Back to site
            </button>
          )}
        </div>

        {/* Progress bar */}
        {step !== 'Confirmation' && (
          <div className="mb-8 flex flex-wrap gap-2">
            {STEPS.slice(0, 8).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
                    i < stepIndex
                      ? 'bg-forest-glow text-forest-darkest'
                      : i === stepIndex
                      ? 'bg-forest-glow text-forest-darkest ring-4 ring-forest-glow/20'
                      : 'bg-white/5 text-white-soft/30'
                  }`}
                >
                  {i < stepIndex ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                <span className={`hidden text-xs font-medium sm:block ${i <= stepIndex ? 'text-white-soft/80' : 'text-white-soft/30'}`}>
                  {s}
                </span>
                {i < 7 && <div className={`h-px w-4 ${i < stepIndex ? 'bg-forest-glow' : 'bg-white/10'}`} />}
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Step content */}
        <div className="glass rounded-3xl border border-forest-glow/15 p-6 lg:p-8">
          {/* LOCATION */}
          {step === 'Location' && (
            <div>
              <h2 className="mb-5 font-display text-xl font-bold text-white">Select a location</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {locations.map((loc) => (
                  <button
                    key={loc.id}
                    onClick={() => handleSelectLocation(loc.id)}
                    className="group rounded-2xl border border-white/10 bg-forest-dark/30 p-6 text-left transition-all duration-300 hover:border-forest-glow/40 hover:bg-forest-dark/50"
                  >
                    <MapPin className="mb-3 h-6 w-6 text-forest-glow" />
                    <h3 className="font-display text-lg font-bold text-white">{loc.name}</h3>
                    <p className="mt-1 text-sm text-white-soft/50">{loc.address}</p>
                    <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-forest-glow opacity-0 transition-opacity group-hover:opacity-100">
                      Select <ArrowRight className="h-3 w-3" />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* SPORT */}
          {step === 'Sport' && (
            <div>
              <h2 className="mb-5 font-display text-xl font-bold text-white">Choose a sport</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {sports.map((sport) => {
                  const Icon = sport.slug === 'padel' ? CircleDot : Trophy;
                  return (
                    <button
                      key={sport.id}
                      onClick={() => handleSelectSport(sport.id)}
                      className="group rounded-2xl border border-white/10 bg-forest-dark/30 p-8 text-center transition-all duration-300 hover:border-forest-glow/40 hover:bg-forest-dark/50"
                    >
                      <Icon className="mx-auto mb-3 h-10 w-10 text-forest-glow" />
                      <h3 className="font-display text-xl font-bold text-white">{sport.name}</h3>
                      <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-forest-glow opacity-0 transition-opacity group-hover:opacity-100">
                        Select <ArrowRight className="h-3 w-3" />
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* COURT */}
          {step === 'Court' && (
            <div>
              <h2 className="mb-5 font-display text-xl font-bold text-white">
                Select a {selectedSportObj?.slug === 'football' ? 'field' : 'court'}
              </h2>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-forest-glow" />
                </div>
              ) : courts.length === 0 ? (
                <p className="py-8 text-center text-white-soft/40">
                  No {selectedSportObj?.slug === 'football' ? 'fields' : 'courts'} available at this location yet.
                </p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {courts.map((court) => (
                    <button
                      key={court.id}
                      onClick={() => handleSelectCourt(court.id)}
                      className="group rounded-2xl border border-white/10 bg-forest-dark/30 p-6 text-left transition-all duration-300 hover:border-forest-glow/40 hover:bg-forest-dark/50"
                    >
                      <h3 className="font-display text-lg font-bold text-white">{court.name}</h3>
                      <p className="mt-1 text-sm capitalize text-white-soft/50">{court.court_type}</p>
                      <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-forest-glow opacity-0 transition-opacity group-hover:opacity-100">
                        Select <ArrowRight className="h-3 w-3" />
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* DATE */}
          {step === 'Date' && (
            <div>
              <h2 className="mb-5 font-display text-xl font-bold text-white">Select a date</h2>
              <div className="flex flex-col gap-4">
                <input
                  type="date"
                  min={todayStr}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-forest-dark/50 px-4 py-3.5 text-sm text-white outline-none transition-colors focus:border-forest-glow/50 [color-scheme:dark]"
                />
                <button
                  disabled={!selectedDate}
                  onClick={goNext}
                  className="btn-shine flex items-center justify-center gap-2 rounded-full bg-forest-glow px-6 py-3.5 text-sm font-bold text-forest-darkest transition-all duration-300 hover:bg-forest-soft disabled:opacity-30"
                >
                  See available times <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* TIME */}
          {step === 'Time' && (
            <div>
              <h2 className="mb-5 font-display text-xl font-bold text-white">
                Available times — {new Date(selectedDate + 'T00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </h2>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-forest-glow" />
                </div>
              ) : slots.length === 0 ? (
                <p className="py-8 text-center text-white-soft/40">No time slots available for this date.</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {slots.map((slot, i) => {
                    const time = slot.start_time.substring(0, 5);
                    const isAvailable = slot.is_available;
                    return (
                      <button
                        key={i}
                        disabled={!isAvailable}
                        onClick={() => handleSelectSlot(slot)}
                        className={`rounded-xl border px-4 py-3.5 text-center text-sm font-semibold transition-all duration-200 ${
                          isAvailable
                            ? 'border-forest-glow/30 bg-forest-dark/30 text-white hover:border-forest-glow hover:bg-forest-glow/10'
                            : 'border-red-500/20 bg-red-500/5 text-red-300/50 cursor-not-allowed'
                        }`}
                      >
                        <div className="flex items-center justify-center gap-1.5">
                          <Clock className="h-4 w-4" />
                          {time}
                        </div>
                        <span className={`mt-1 block text-[10px] uppercase tracking-wider ${isAvailable ? 'text-forest-glow' : 'text-red-300/40'}`}>
                          {slot.status === 'available' ? 'Available' : slot.status === 'booked' ? 'Booked' : 'Past'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* DURATION */}
          {step === 'Duration' && (
            <div>
              <h2 className="mb-5 font-display text-xl font-bold text-white">Select duration</h2>
              <div className="grid gap-4 sm:grid-cols-3">
                {availableDurations.map((dur) => (
                  <button
                    key={dur}
                    onClick={() => setSelectedDuration(dur)}
                    className={`rounded-2xl border p-6 text-center transition-all duration-300 ${
                      selectedDuration === dur
                        ? 'border-forest-glow bg-forest-glow/10'
                        : 'border-white/10 bg-forest-dark/30 hover:border-forest-glow/40'
                    }`}
                  >
                    <Clock className="mx-auto mb-2 h-6 w-6 text-forest-glow" />
                    <div className="font-display text-lg font-bold text-white">{dur} min</div>
                  </button>
                ))}
              </div>
              <button
                disabled={!selectedDuration}
                onClick={() => setStep('Details')}
                className="btn-shine mt-6 flex items-center justify-center gap-2 rounded-full bg-forest-glow px-6 py-3.5 text-sm font-bold text-forest-darkest transition-all duration-300 hover:bg-forest-soft disabled:opacity-30"
              >
                Continue <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* DETAILS */}
          {step === 'Details' && (
            <div>
              <h2 className="mb-5 font-display text-xl font-bold text-white">Your details</h2>
              {!user && (
                <div className="mb-5 rounded-xl border border-forest-glow/30 bg-forest-glow/10 px-4 py-3 text-sm text-forest-soft">
                  You'll need to sign in or create an account to complete this booking.
                </div>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="relative">
                  <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white-soft/30" />
                  <input type="text" required placeholder="Full name" value={customerName} onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-forest-dark/50 py-3.5 pl-12 pr-4 text-sm text-white placeholder-white-soft/30 outline-none focus:border-forest-glow/50" />
                </div>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white-soft/30" />
                  <input type="tel" required placeholder="Phone" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-forest-dark/50 py-3.5 pl-12 pr-4 text-sm text-white placeholder-white-soft/30 outline-none focus:border-forest-glow/50" />
                </div>
                <div className="relative sm:col-span-2">
                  <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white-soft/30" />
                  <input type="email" required placeholder="Email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-forest-dark/50 py-3.5 pl-12 pr-4 text-sm text-white placeholder-white-soft/30 outline-none focus:border-forest-glow/50" />
                </div>
                <div className="relative sm:col-span-2">
                  <Tag className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white-soft/30" />
                  <input type="text" placeholder="Promo code (optional)" value={promoCode} onChange={(e) => setPromoCode(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-forest-dark/50 py-3.5 pl-12 pr-4 text-sm text-white placeholder-white-soft/30 outline-none focus:border-forest-glow/50" />
                </div>
                <textarea placeholder="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
                  className="w-full rounded-xl border border-white/10 bg-forest-dark/50 px-4 py-3 text-sm text-white placeholder-white-soft/30 outline-none focus:border-forest-glow/50 sm:col-span-2" />
              </div>

              {/* Summary */}
              <div className="mt-6 rounded-2xl border border-white/10 bg-forest-dark/30 p-5">
                <h3 className="mb-3 text-sm font-bold uppercase tracking-widest text-forest-glow">Booking Summary</h3>
                <div className="space-y-2 text-sm text-white-soft/70">
                  <div className="flex justify-between"><span>Location</span><span className="font-medium text-white">{selectedLocationObj?.name}</span></div>
                  <div className="flex justify-between"><span>Sport</span><span className="font-medium text-white">{selectedSportObj?.name}</span></div>
                  <div className="flex justify-between"><span>{selectedSportObj?.slug === 'football' ? 'Field' : 'Court'}</span><span className="font-medium text-white">{selectedCourtObj?.name}</span></div>
                  <div className="flex justify-between"><span>Date</span><span className="font-medium text-white">{new Date(selectedDate + 'T00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span></div>
                  <div className="flex justify-between"><span>Time</span><span className="font-medium text-white">{selectedSlot?.start_time.substring(0, 5)}</span></div>
                  <div className="flex justify-between"><span>Duration</span><span className="font-medium text-white">{selectedDuration} min</span></div>
                </div>
              </div>

              <button
                disabled={loading || !customerName || !customerEmail || !customerPhone}
                onClick={handleConfirmBooking}
                className="btn-shine mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-forest-glow px-6 py-3.5 text-sm font-bold text-forest-darkest transition-all duration-300 hover:bg-forest-soft disabled:opacity-30"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Booking'}
              </button>
            </div>
          )}

          {/* PAYMENT */}
          {step === 'Payment' && bookingResult && (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-forest-glow/15 text-forest-glow">
                <Calendar className="h-8 w-8" />
              </div>
              <h2 className="font-display text-2xl font-bold text-white">Payment</h2>
              <p className="mt-2 text-sm text-white-soft/50">Booking code: <span className="font-bold text-forest-glow">{bookingResult.booking_code}</span></p>

              <div className="mx-auto mt-6 max-w-sm space-y-3 rounded-2xl border border-white/10 bg-forest-dark/30 p-5 text-left">
                <div className="flex justify-between text-sm text-white-soft/70"><span>Price</span><span>AED {Number(bookingResult.price_aed).toFixed(0)}</span></div>
                {Number(bookingResult.discount_aed) > 0 && (
                  <div className="flex justify-between text-sm text-forest-soft"><span>Discount</span><span>-AED {Number(bookingResult.discount_aed).toFixed(0)}</span></div>
                )}
                <div className="border-t border-white/10 pt-3 flex justify-between font-bold text-white"><span>Total</span><span>AED {Number(bookingResult.final_price_aed).toFixed(0)}</span></div>
              </div>

              <div className="mx-auto mt-6 max-w-sm rounded-xl border border-forest-glow/20 bg-forest-glow/5 p-4 text-xs text-white-soft/50">
                Payment is currently processed as cash at the venue. Online payment gateway integration is prepared and will be activated soon.
              </div>

              <button
                disabled={paymentProcessing}
                onClick={handlePayment}
                className="btn-shine mt-6 flex w-full max-w-sm mx-auto items-center justify-center gap-2 rounded-full bg-forest-glow px-6 py-3.5 text-sm font-bold text-forest-darkest transition-all duration-300 hover:bg-forest-soft disabled:opacity-50"
              >
                {paymentProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm & Pay at Venue'}
              </button>
            </div>
          )}

          {/* CONFIRMATION */}
          {step === 'Confirmation' && bookingResult && (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-forest-glow/15 text-forest-glow">
                <Check className="h-10 w-10" />
              </div>
              <h2 className="font-display text-3xl font-extrabold text-white">Booking Confirmed!</h2>
              <p className="mt-2 text-sm text-white-soft/50">OnPeak Sports Club</p>

              <div className="mx-auto mt-6 max-w-md space-y-3 rounded-2xl border border-forest-glow/20 bg-forest-dark/30 p-6 text-left">
                <div className="flex justify-between text-sm"><span className="text-white-soft/50">Booking ID</span><span className="font-bold text-forest-glow">{bookingResult.booking_code}</span></div>
                <div className="flex justify-between text-sm"><span className="text-white-soft/50">Sport</span><span className="font-medium text-white">{selectedSportObj?.name}</span></div>
                <div className="flex justify-between text-sm"><span className="text-white-soft/50">{selectedSportObj?.slug === 'football' ? 'Field' : 'Court'}</span><span className="font-medium text-white">{selectedCourtObj?.name}</span></div>
                <div className="flex justify-between text-sm"><span className="text-white-soft/50">Location</span><span className="font-medium text-white">{selectedLocationObj?.name}</span></div>
                <div className="flex justify-between text-sm"><span className="text-white-soft/50">Date</span><span className="font-medium text-white">{new Date(selectedDate + 'T00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span></div>
                <div className="flex justify-between text-sm"><span className="text-white-soft/50">Time</span><span className="font-medium text-white">{selectedSlot?.start_time.substring(0, 5)} – {selectedSlot?.end_time.substring(0, 5)}</span></div>
                <div className="border-t border-white/10 pt-3 flex justify-between font-bold"><span className="text-white">Total</span><span className="text-white">AED {Number(bookingResult.final_price_aed).toFixed(0)}</span></div>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <button
                  onClick={() => { onClose?.(); }}
                  className="rounded-full border border-white/15 px-6 py-3 text-sm font-semibold text-white transition-all hover:border-forest-glow/40 hover:bg-forest-glow/10"
                >
                  View My Bookings
                </button>
                <button
                  onClick={() => {
                    setStep('Location');
                    setSelectedLocation(''); setSelectedSport(''); setSelectedCourt('');
                    setSelectedDate(''); setSelectedSlot(null); setBookingResult(null);
                    setPromoCode(''); setNotes('');
                  }}
                  className="btn-shine rounded-full bg-forest-glow px-6 py-3 text-sm font-bold text-forest-darkest transition-all hover:bg-forest-soft"
                >
                  Book Another
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Back button */}
        {stepIndex > 0 && step !== 'Confirmation' && step !== 'Payment' && (
          <button
            onClick={goBack}
            className="mt-6 flex items-center gap-2 text-sm text-white-soft/40 transition-colors hover:text-forest-glow"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </button>
        )}
      </div>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} initialMode="signup" />
    </div>
  );
}
