import { useEffect, useMemo, useState } from 'react';
import {
  X, Calendar, Clock, MapPin, ChevronRight, ChevronLeft, Check,
  Loader2, AlertCircle, Tag, CircleDot, Building2, ShieldCheck, CreditCard,
} from 'lucide-react';
import { useBooking } from '@/context/BookingContext';
import { useFacilities, courtsForLocation, sportBySlug } from '@/hooks/useFacilities';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Slot } from '@/lib/types';

type Step = 'location' | 'sport' | 'court' | 'datetime' | 'slot' | 'duration' | 'details' | 'review' | 'confirm';

interface StepState {
  locationId: string | null;
  sportSlug: 'padel' | 'football' | null;
  courtId: string | null;
  date: string;
  selectedSlot: Slot | null;
  durationMinutes: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  promoCode: string;
  notes: string;
}

const DURATIONS_BY_SPORT: Record<'padel' | 'football', number[]> = {
  padel: [60, 90],
  football: [60, 90, 120],
};

function todayISO(): string {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function formatDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

function formatTime(t: string): string {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const hh = ((h + 11) % 12) + 1;
  return `${hh}:${m.toString().padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = h * 60 + m + minutes;
  const nh = Math.floor(total / 60) % 24;
  const nm = total % 60;
  return `${nh.toString().padStart(2, '0')}:${nm.toString().padStart(2, '0')}`;
}

export default function BookingModal() {
  const { isOpen, preset, closeBooking } = useBooking();
  const { locations, sports, courts, loading: facLoading, error: facError } = useFacilities();
  const { user, profile } = useAuth();

  const [step, setStep] = useState<Step>('location');
  const [s, setS] = useState<StepState>({
    locationId: null, sportSlug: null, courtId: null,
    date: todayISO(), selectedSlot: null, durationMinutes: 60,
    customerName: profile?.full_name || '', customerEmail: user?.email || '', customerPhone: profile?.phone || '',
    promoCode: '', notes: '',
  });
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [priceQuote, setPriceQuote] = useState<number | null>(null);
  const [priceLoading, setPriceLoading] = useState(false);
  const [promoDiscount, setPromoDiscount] = useState<{ discount: number; promoId: string | null; error: string | null }>({ discount: 0, promoId: null, error: null });
  const [submitting, setSubmitting] = useState(false);
  const [confirmData, setConfirmData] = useState<{ code: string; final: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setConfirmData(null);
    setS((prev) => ({
      ...prev,
      locationId: preset.locationId ?? prev.locationId,
      sportSlug: preset.sport ?? prev.sportSlug,
      customerName: profile?.full_name || prev.customerName,
      customerEmail: user?.email || prev.customerEmail,
      customerPhone: profile?.phone || prev.customerPhone,
    }));
    if (preset.locationId && preset.sport) setStep('court');
    else if (preset.sport) setStep('location');
    else setStep('location');
  }, [isOpen, preset, profile, user]);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const padelSport = useMemo(() => sportBySlug(sports, 'padel'), [sports]);
  const footballSport = useMemo(() => sportBySlug(sports, 'football'), [sports]);

  const currentSport = s.sportSlug === 'padel' ? padelSport : s.sportSlug === 'football' ? footballSport : null;
  const currentLocation = locations.find((l) => l.id === s.locationId) || null;
  const currentCourt = courts.find((c) => c.id === s.courtId) || null;
  const availableCourts = useMemo(() => {
    if (!s.locationId || !currentSport) return [];
    return courtsForLocation(courts, s.locationId, currentSport.id);
  }, [courts, s.locationId, currentSport]);

  // Load slots when entering the slot step
  useEffect(() => {
    if (step !== 'slot') return;
    if (!s.courtId || !s.date) return;
    setSlotsLoading(true);
    setSlotsError(null);
    (async () => {
      if (!supabase) { setSlotsError('Booking system unavailable.'); setSlotsLoading(false); return; }
      const { data, error } = await supabase.rpc('get_available_slots', {
        p_court_id: s.courtId, p_booking_date: s.date,
      });
      if (error) { setSlotsError(error.message); setSlotsLoading(false); return; }
      setSlots((data as Slot[]) || []);
      setSlotsLoading(false);
    })();
  }, [step, s.courtId, s.date]);

  // Compute price when slot + duration are known
  useEffect(() => {
    if (!s.selectedSlot || !s.courtId || !s.durationMinutes) {
      setPriceQuote(null);
      return;
    }
    setPriceLoading(true);
    (async () => {
      if (!supabase) { setPriceLoading(false); return; }
      const { data, error } = await supabase.rpc('get_court_price', {
        p_court_id: s.courtId,
        p_duration: s.durationMinutes,
        p_slot_start: s.selectedSlot.start_time,
        p_booking_date: s.date,
      });
      if (error) { setPriceQuote(null); setPriceLoading(false); return; }
      const price = typeof data === 'number' ? Number(data) : Number((data as any)?.price_aed || (data as any) || 0);
      setPriceQuote(price);
      setPriceLoading(false);
    })();
  }, [s.selectedSlot, s.courtId, s.durationMinutes, s.date]);

  // Validate promo code
  useEffect(() => {
    if (!s.promoCode || !priceQuote || !s.locationId || !currentSport) {
      setPromoDiscount({ discount: 0, promoId: null, error: null });
      return;
    }
    (async () => {
      if (!supabase) return;
      const { data, error } = await supabase.rpc('validate_promo_code', {
        p_code: s.promoCode, p_location_id: s.locationId, p_sport_id: currentSport.id, p_price: priceQuote,
      });
      if (error || !data) {
        setPromoDiscount({ discount: 0, promoId: null, error: error?.message || 'Promo code invalid' });
        return;
      }
      const r = (Array.isArray(data) ? data[0] : data) as {
        is_valid: boolean; discount_amount: number; promo_code_id: string; error_message: string | null;
      } | undefined;
      if (!r || !r.is_valid) {
        setPromoDiscount({ discount: 0, promoId: null, error: r?.error_message || 'Promo code invalid' });
      } else {
        setPromoDiscount({ discount: Number(r.discount_amount || 0), promoId: r.promo_code_id, error: null });
      }
    })();
  }, [s.promoCode, priceQuote, s.locationId, currentSport]);

  if (!isOpen) return null;

  const set = (patch: Partial<StepState>) => setS((prev) => ({ ...prev, ...patch }));

  const stepIndex: Step[] = ['location', 'sport', 'court', 'datetime', 'slot', 'duration', 'details', 'review', 'confirm'];
  const currentIdx = stepIndex.indexOf(step);
  const totalSteps = 9;

  const goNext = () => {
    setError(null);
    if (step === 'location') {
      if (!s.locationId) { setError('Please select a location.'); return; }
      setStep('sport');
    } else if (step === 'sport') {
      if (!s.sportSlug) { setError('Please select a sport.'); return; }
      setStep('court');
    } else if (step === 'court') {
      if (!s.courtId) { setError('Please select a court or field.'); return; }
      setStep('datetime');
    } else if (step === 'datetime') {
      if (!s.date) { setError('Please select a date.'); return; }
      setStep('slot');
    } else if (step === 'slot') {
      if (!s.selectedSlot) { setError('Please select a start time.'); return; }
      setStep('duration');
    } else if (step === 'duration') {
      if (!s.durationMinutes) { setError('Please select a duration.'); return; }
      setStep('details');
    } else if (step === 'details') {
      if (!user) {
        setError('Please sign in to continue. Click the "Sign In" button at the top of the page.');
        return;
      }
      if (!s.customerName.trim() || !s.customerEmail.trim() || !s.customerPhone.trim()) {
        setError('Please provide your name, email and phone number.');
        return;
      }
      setStep('review');
    } else if (step === 'review') {
      submitBooking();
    }
  };

  const goBack = () => {
    setError(null);
    if (currentIdx > 0) setStep(stepIndex[currentIdx - 1]);
  };

  const submitBooking = async () => {
    if (!supabase || !s.courtId || !s.date || !s.selectedSlot || !s.durationMinutes || !currentSport) {
      setError('Missing booking details. Please go back and complete the form.');
      return;
    }
    setSubmitting(true);
    setError(null);
    const { data, error: rpcError } = await supabase.rpc('create_booking', {
      p_court_id: s.courtId,
      p_booking_date: s.date,
      p_start_time: s.selectedSlot.start_time,
      p_duration_minutes: s.durationMinutes,
      p_customer_name: s.customerName,
      p_customer_email: s.customerEmail,
      p_customer_phone: s.customerPhone,
      p_promo_code: s.promoCode || null,
      p_notes: s.notes || null,
    });
    setSubmitting(false);
    if (rpcError) { setError(rpcError.message); return; }
    const row = (data as any)?.[0] || (data as any);
    if (!row || row.success === false) {
      setError(row?.error_message || 'Could not create booking. The slot may have just been taken.');
      return;
    }
    setConfirmData({ code: row.booking_code, final: Number(row.final_price_aed) });
    setStep('confirm');
  };

  const close = () => {
    closeBooking();
    setStep('location');
    setSlots([]);
    setPriceQuote(null);
    setPromoDiscount({ discount: 0, promoId: null, error: null });
    setConfirmData(null);
    setError(null);
  };

  const finalPrice = priceQuote ? Math.max(0, priceQuote - promoDiscount.discount) : 0;

  // Determine if the Continue button should be enabled
  const canContinue = (): boolean => {
    switch (step) {
      case 'location': return !!s.locationId;
      case 'sport': return !!s.sportSlug;
      case 'court': return !!s.courtId;
      case 'datetime': return !!s.date;
      case 'slot': return !!s.selectedSlot;
      case 'duration': return !!s.durationMinutes;
      case 'details': return !!s.customerName.trim() && !!s.customerEmail.trim() && !!s.customerPhone.trim();
      case 'review': return !submitting;
      default: return false;
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-brand-deepest/90 backdrop-blur-md p-4" onClick={close}>
      <div
        className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-brand-mid/30 bg-brand-deep shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-brand-mid/20 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-accent/15 text-brand-accent">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-brand-cream">Book a session</h2>
              <p className="text-xs text-brand-cream/50">Step {Math.min(currentIdx + 1, totalSteps)} of {totalSteps}</p>
            </div>
          </div>
          <button
            onClick={close}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-brand-cream/60 hover:bg-brand-mid/40 hover:text-brand-cream"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 w-full bg-brand-mid/20">
          <div
            className="h-full bg-brand-accent transition-all duration-500"
            style={{ width: `${((currentIdx + 1) / totalSteps) * 100}%` }}
          />
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {/* Loading state for location step */}
          {facLoading && step === 'location' && (
            <div className="flex items-center justify-center py-12 text-brand-cream/60">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading facilities…
            </div>
          )}

          {/* Error state for facility loading */}
          {facError && (step === 'location') && !facLoading && (
            <div className="space-y-4">
              <div className="flex items-start gap-2 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="font-semibold">Unable to load booking data</p>
                  <p className="mt-1 text-xs text-red-200/70">{facError}</p>
                </div>
              </div>
            </div>
          )}

          {/* STEP: location */}
          {step === 'location' && !facLoading && !facError && (
            <Step title="Select Location" subtitle="Pick the OnPeak location you want to play at.">
              <div className="grid gap-3">
                {locations.length === 0 && (
                  <ErrorNote>No locations are currently active.</ErrorNote>
                )}
                {locations.map((loc) => {
                  const padelCount = courtsForLocation(courts, loc.id, padelSport?.id || '').length;
                  const footballCount = courtsForLocation(courts, loc.id, footballSport?.id || '').length;
                  const selected = s.locationId === loc.id;
                  return (
                    <button
                      key={loc.id}
                      onClick={() => { set({ locationId: loc.id }); setStep('sport'); }}
                      className={`flex items-start gap-4 rounded-2xl border p-5 text-left transition-all ${
                        selected ? 'border-brand-accent bg-brand-mid/40' : 'border-brand-mid/20 bg-brand-deepest/40 hover:border-brand-accent/40'
                      }`}
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-accent/10 text-brand-accent">
                        <MapPin className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-display text-base font-bold text-brand-cream">{loc.name}</h3>
                        {loc.address && <p className="mt-1 text-xs text-brand-cream/50">{loc.address}</p>}
                        <div className="mt-3 flex flex-wrap gap-2">
                          {padelCount > 0 && <Pill>{padelCount} padel {padelCount === 1 ? 'court' : 'courts'}</Pill>}
                          {footballCount > 0 && <Pill>{footballCount} football {footballCount === 1 ? 'field' : 'fields'}</Pill>}
                        </div>
                      </div>
                      <ChevronRight className="mt-1 h-5 w-5 text-brand-cream/30" />
                    </button>
                  );
                })}
              </div>
            </Step>
          )}

          {/* STEP: sport */}
          {step === 'sport' && (
            <Step title="Select Sport" subtitle="Choose what you want to play.">
              <div className="grid gap-3 sm:grid-cols-2">
                {padelSport && (
                  <SportCard
                    label="Padel" desc="Premium padel courts"
                    selected={s.sportSlug === 'padel'}
                    onClick={() => { set({ sportSlug: 'padel', courtId: null, selectedSlot: null }); setStep('court'); }}
                  />
                )}
                {footballSport && (
                  <SportCard
                    label="Football" desc="Football fields & pitches"
                    selected={s.sportSlug === 'football'}
                    onClick={() => { set({ sportSlug: 'football', courtId: null, selectedSlot: null }); setStep('court'); }}
                  />
                )}
              </div>
            </Step>
          )}

          {/* STEP: court */}
          {step === 'court' && (
            <Step title={`Select ${s.sportSlug === 'football' ? 'Field' : 'Court'}`} subtitle={`Available ${s.sportSlug} resources at ${currentLocation?.name || 'this location'}.`}>
              {availableCourts.length === 0 ? (
                <ErrorNote>No {s.sportSlug} resources found at this location.</ErrorNote>
              ) : (
                <div className="grid gap-3">
                  {availableCourts.map((c) => {
                    const selected = s.courtId === c.id;
                    const isPink = c.special_marker === 'pink' || c.name.toLowerCase().includes('pink');
                    return (
                      <button
                        key={c.id}
                        onClick={() => { set({ courtId: c.id, selectedSlot: null }); setStep('datetime'); }}
                        className={`flex items-center gap-4 rounded-2xl border p-5 text-left transition-all ${
                          isPink ? 'border-pink-400/40' : selected ? 'border-brand-accent bg-brand-mid/40' : 'border-brand-mid/20 bg-brand-deepest/40 hover:border-brand-accent/40'
                        } ${selected && isPink ? 'bg-pink-500/10' : ''}`}
                      >
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                          isPink ? 'bg-pink-400/15 text-pink-300' : 'bg-brand-accent/10 text-brand-accent'
                        }`}>
                          <CircleDot className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-display text-base font-bold text-brand-cream">{c.name}</h3>
                            {isPink && (
                              <span className="rounded-full border border-pink-400/50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-pink-300">
                                Pink Court
                              </span>
                            )}
                            {c.is_indoor && (
                              <span className="rounded-full border border-brand-accent/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-accent">
                                Indoor / Covered
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-brand-cream/50">
                            {s.sportSlug === 'football' ? 'Football field' : 'Padel court'} · {c.is_indoor ? 'Indoor' : 'Outdoor'}
                          </p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-brand-cream/30" />
                      </button>
                    );
                  })}
                </div>
              )}
            </Step>
          )}

          {/* STEP: datetime — date only */}
          {step === 'datetime' && (
            <Step title="Select Date" subtitle={`Booking ${currentCourt?.name} at ${currentLocation?.name}.`}>
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-widest text-brand-cream/60">Date</span>
                <input
                  type="date"
                  min={todayISO()}
                  value={s.date}
                  onChange={(e) => set({ date: e.target.value, selectedSlot: null })}
                  className="mt-2 w-full rounded-xl border border-brand-mid/30 bg-brand-deepest/60 px-4 py-3 text-brand-cream outline-none focus:border-brand-accent"
                />
              </label>
              <p className="mt-4 text-xs text-brand-cream/40">
                Selected: {formatDate(s.date)}
              </p>
            </Step>
          )}

          {/* STEP: slot — start time */}
          {step === 'slot' && (
            <Step title="Select Start Time" subtitle={`Available times for ${formatDate(s.date)} at ${currentCourt?.name}.`}>
              {slotsLoading && (
                <div className="flex items-center justify-center py-8 text-brand-cream/60">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Checking live availability…
                </div>
              )}
              {slotsError && <ErrorNote>{slotsError}</ErrorNote>}
              {!slotsLoading && !slotsError && (
                <>
                  {slots.filter((sl) => sl.is_available).length === 0 ? (
                    <ErrorNote>No available time slots for this date. Please try another date.</ErrorNote>
                  ) : (
                    <div className="grid gap-2 sm:grid-cols-3">
                      {slots.filter((sl) => sl.is_available).map((sl) => {
                        const sel = s.selectedSlot?.start_time === sl.start_time;
                        return (
                          <button
                            key={sl.start_time}
                            onClick={() => set({ selectedSlot: sl })}
                            className={`rounded-xl border px-3 py-3 text-center transition-all ${
                              sel ? 'border-brand-accent bg-brand-accent text-brand-deepest' : 'border-brand-mid/30 bg-brand-deepest/40 text-brand-cream hover:border-brand-accent/40'
                            }`}
                          >
                            <div className="text-sm font-bold">{formatTime(sl.start_time)}</div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </Step>
          )}

          {/* STEP: duration */}
          {step === 'duration' && (
            <Step title="Select Duration" subtitle={`Starting at ${formatTime(s.selectedSlot?.start_time || '')} on ${formatDate(s.date)}.`}>
              <div className="grid grid-cols-3 gap-2">
                {(DURATIONS_BY_SPORT[s.sportSlug!] || [60]).map((d) => {
                  const sel = s.durationMinutes === d;
                  return (
                    <button
                      key={d}
                      onClick={() => set({ durationMinutes: d })}
                      className={`rounded-xl border px-3 py-4 text-sm font-bold transition-all ${
                        sel ? 'border-brand-accent bg-brand-accent text-brand-deepest' : 'border-brand-mid/30 bg-brand-deepest/40 text-brand-cream hover:border-brand-accent/40'
                      }`}
                    >
                      {d} min
                      {sel && s.selectedSlot && (
                        <div className="mt-1 text-[10px] font-normal opacity-80">
                          until {formatTime(addMinutes(s.selectedSlot.start_time, d))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
              {priceLoading && (
                <p className="mt-4 flex items-center gap-2 text-xs text-brand-cream/50">
                  <Loader2 className="h-3 w-3 animate-spin" /> Calculating price…
                </p>
              )}
              {priceQuote !== null && !priceLoading && (
                <div className="mt-4 rounded-xl border border-brand-mid/20 bg-brand-deepest/40 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-widest text-brand-cream/50">Estimated price</span>
                    <span className="font-display text-lg font-extrabold text-brand-accent">AED {priceQuote.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </Step>
          )}

          {/* STEP: details */}
          {step === 'details' && (
            <Step title="Customer Details" subtitle="We need your details to confirm the booking.">
              {!user && (
                <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-brand-accent/30 bg-brand-accent/10 p-4 text-sm text-brand-cream/80">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-accent" />
                  <div>
                    <p className="font-semibold text-brand-cream">Sign in required</p>
                    <p className="mt-1 text-xs text-brand-cream/60">
                      You need an account to confirm your booking. Please use the "Sign In" button at the top of the page to register or log in, then come back here.
                    </p>
                  </div>
                </div>
              )}
              <div className="grid gap-4">
                <Field label="Full name">
                  <input value={s.customerName} onChange={(e) => set({ customerName: e.target.value })} className="op-input" placeholder="Jane Doe" />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Email">
                    <input type="email" value={s.customerEmail} onChange={(e) => set({ customerEmail: e.target.value })} className="op-input" placeholder="you@example.com" />
                  </Field>
                  <Field label="Phone">
                    <input value={s.customerPhone} onChange={(e) => set({ customerPhone: e.target.value })} className="op-input" placeholder="+971 ..." />
                  </Field>
                </div>
                <Field label="Notes (optional)">
                  <textarea value={s.notes} onChange={(e) => set({ notes: e.target.value })} rows={2} className="op-input" placeholder="Any special requests" />
                </Field>
              </div>
              <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-forest-glow/20 bg-forest-glow/5 p-3 text-xs text-forest-soft/80">
                <CreditCard className="mt-0.5 h-4 w-4 shrink-0 text-forest-glow" />
                <span>Payment is collected at the venue on arrival. No online payment is required.</span>
              </div>
            </Step>
          )}

          {/* STEP: review */}
          {step === 'review' && (
            <Step title="Booking Summary" subtitle="Please review and confirm your booking.">
              <div className="rounded-2xl border border-brand-mid/20 bg-brand-deepest/40 p-5">
                <ReviewRow icon={<MapPin className="h-4 w-4" />} label="Location" value={currentLocation?.name || '-'} />
                <ReviewRow icon={<CircleDot className="h-4 w-4" />} label={s.sportSlug === 'football' ? 'Field' : 'Court'} value={currentCourt?.name || '-'} />
                <ReviewRow icon={<Calendar className="h-4 w-4" />} label="Date" value={formatDate(s.date)} />
                {s.selectedSlot && (
                  <>
                    <ReviewRow icon={<Clock className="h-4 w-4" />} label="Start time" value={formatTime(s.selectedSlot.start_time)} />
                    <ReviewRow icon={<Clock className="h-4 w-4" />} label="End time" value={formatTime(addMinutes(s.selectedSlot.start_time, s.durationMinutes))} />
                    <ReviewRow icon={<Clock className="h-4 w-4" />} label="Duration" value={`${s.durationMinutes} minutes`} />
                    <div className="my-3 h-px bg-brand-mid/20" />
                    {priceQuote !== null && (
                      <>
                        <PriceRow label="Price" value={`AED ${priceQuote.toFixed(2)}`} />
                        {promoDiscount.discount > 0 && <PriceRow label="Discount" value={`-AED ${promoDiscount.discount.toFixed(2)}`} highlight />}
                        <div className="my-2 h-px bg-brand-mid/20" />
                        <PriceRow label="Total" value={`AED ${finalPrice.toFixed(2)}`} bold />
                      </>
                    )}
                  </>
                )}
                <div className="my-3 h-px bg-brand-mid/20" />
                <ReviewRow icon={<CreditCard className="h-4 w-4" />} label="Payment" value="Pay at Venue" />
              </div>

              <div className="mt-4">
                <Field label="Promo code (optional)">
                  <div className="flex gap-2">
                    <input value={s.promoCode} onChange={(e) => set({ promoCode: e.target.value.toUpperCase() })} className="op-input" placeholder="SAVE10" />
                  </div>
                </Field>
                {promoDiscount.error && <p className="mt-1 text-xs text-red-300">{promoDiscount.error}</p>}
                {promoDiscount.discount > 0 && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-brand-accent">
                    <Check className="h-3 w-3" /> Promo applied - you save AED {promoDiscount.discount.toFixed(2)}.
                  </p>
                )}
              </div>

              {error && <ErrorNote>{error}</ErrorNote>}
            </Step>
          )}

          {/* STEP: confirm */}
          {step === 'confirm' && confirmData && (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-accent/15 text-brand-accent">
                <Check className="h-8 w-8" />
              </div>
              <h3 className="mt-4 font-display text-2xl font-extrabold text-brand-cream">Booking Confirmed!</h3>
              <p className="mt-2 text-sm text-brand-cream/60">
                Your reservation code is{' '}
                <span className="font-mono font-bold text-brand-accent">{confirmData.code}</span>
              </p>
              <div className="mt-4 flex w-full max-w-xs flex-col items-center gap-1 rounded-2xl border border-forest-glow/30 bg-forest-glow/10 px-6 py-4">
                <span className="text-xs font-semibold uppercase tracking-widest text-forest-soft/60">Payment</span>
                <span className="mt-1 font-display text-xl font-extrabold text-forest-glow">Pay at Venue</span>
                <span className="mt-1 text-xs text-brand-cream/50">Total: AED {confirmData.final.toFixed(2)}</span>
                <p className="mt-2 text-center text-[11px] text-brand-cream/40">Please pay when you arrive at the OnPeak location.</p>
              </div>
              <p className="mt-4 max-w-sm text-[11px] text-brand-cream/40">
                Your booking is saved to your account. You can view or cancel it from "My Bookings".
              </p>
              <button
                onClick={close}
                className="mt-6 rounded-full bg-brand-accent px-6 py-3 text-sm font-bold text-brand-deepest transition-colors hover:bg-brand-light"
              >
                Done
              </button>
            </div>
          )}

          {error && step !== 'review' && step !== 'confirm' && <div className="mt-4"><ErrorNote>{error}</ErrorNote></div>}
        </div>

        {/* Footer nav - Always show Continue button except on confirm step */}
        {step !== 'confirm' && (
          <div className="flex items-center justify-between gap-3 border-t border-brand-mid/20 px-6 py-4">
            <button
              onClick={goBack}
              disabled={currentIdx === 0}
              className="flex items-center gap-1 rounded-full border border-brand-mid/30 px-4 py-2 text-sm font-semibold text-brand-cream/70 transition-colors hover:border-brand-accent/40 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" /> Back
            </button>
            {step === 'review' ? (
              <button
                onClick={goNext}
                disabled={!canContinue()}
                className="flex items-center gap-2 rounded-full bg-brand-accent px-6 py-2.5 text-sm font-bold text-brand-deepest transition-colors hover:bg-brand-light disabled:opacity-60"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                {submitting ? 'Confirming...' : 'Confirm Booking'}
              </button>
            ) : (
              <button
                onClick={goNext}
                disabled={!canContinue()}
                className="flex items-center gap-2 rounded-full bg-brand-accent px-6 py-2.5 text-sm font-bold text-brand-deepest transition-colors hover:bg-brand-light disabled:opacity-50"
              >
                Continue <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Step({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="font-display text-xl font-bold text-brand-cream">{title}</h3>
      <p className="mt-1 text-xs text-brand-cream/50">{subtitle}</p>
      <div className="mt-5">{children}</div>
    </div>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-brand-mid/40 px-2.5 py-1 text-[11px] font-semibold text-brand-cream/80">{children}</span>;
}

function SportCard({ label, desc, selected, onClick }: { label: string; desc: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col gap-1 rounded-2xl border p-6 text-left transition-all ${
        selected ? 'border-brand-accent bg-brand-mid/40' : 'border-brand-mid/20 bg-brand-deepest/40 hover:border-brand-accent/40'
      }`}
    >
      <div className="flex items-center gap-2">
        <Building2 className="h-5 w-5 text-brand-accent" />
        <h4 className="font-display text-lg font-bold text-brand-cream">{label}</h4>
      </div>
      <p className="text-xs text-brand-cream/50">{desc}</p>
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-widest text-brand-cream/60">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}

function ReviewRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="flex items-center gap-2 text-xs uppercase tracking-wider text-brand-cream/50">
        {icon} {label}
      </span>
      <span className="text-sm font-semibold text-brand-cream">{value}</span>
    </div>
  );
}

function PriceRow({ label, value, bold, highlight }: { label: string; value: string; bold?: boolean; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className={`text-xs ${bold ? 'font-bold text-brand-cream' : 'text-brand-cream/60'}`}>{label}</span>
      <span className={`text-sm ${bold ? 'font-extrabold text-brand-cream' : highlight ? 'font-semibold text-brand-accent' : 'font-semibold text-brand-cream/80'}`}>{value}</span>
    </div>
  );
}

function ErrorNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{children}</span>
    </div>
  );
}
