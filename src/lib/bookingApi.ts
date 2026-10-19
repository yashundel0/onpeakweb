import { supabase } from '@/lib/supabase';
import type {
  Location,
  Sport,
  Court,
  AvailableSlot,
  CreateBookingResult,
  BookingWithDetails,
} from '@/types/booking';

export async function fetchLocations(): Promise<Location[]> {
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');
  if (error) throw error;
  return data as Location[];
}

export async function fetchSports(): Promise<Sport[]> {
  const { data, error } = await supabase
    .from('sports')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');
  if (error) throw error;
  return data as Sport[];
}

export async function fetchCourts(locationId: string, sportId: string): Promise<Court[]> {
  const { data, error } = await supabase
    .from('courts')
    .select('*')
    .eq('location_id', locationId)
    .eq('sport_id', sportId)
    .eq('is_active', true)
    .order('sort_order');
  if (error) throw error;
  return data as Court[];
}

export async function fetchAvailableSlots(
  courtId: string,
  date: string
): Promise<AvailableSlot[]> {
  const { data, error } = await supabase.rpc('get_available_slots', {
    p_court_id: courtId,
    p_booking_date: date,
  });
  if (error) throw error;
  return data as AvailableSlot[];
}

export async function createBooking(params: {
  courtId: string;
  bookingDate: string;
  startTime: string;
  durationMinutes: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  promoCode?: string;
  notes?: string;
}): Promise<CreateBookingResult> {
  const { data, error } = await supabase.rpc('create_booking', {
    p_court_id: params.courtId,
    p_booking_date: params.bookingDate,
    p_start_time: params.startTime,
    p_duration_minutes: params.durationMinutes,
    p_customer_name: params.customerName,
    p_customer_email: params.customerEmail,
    p_customer_phone: params.customerPhone,
    p_promo_code: params.promoCode ?? null,
    p_notes: params.notes ?? null,
  });
  if (error) throw error;
  if (!data || data.length === 0) {
    return {
      booking_id: '',
      booking_code: '',
      price_aed: 0,
      discount_aed: 0,
      final_price_aed: 0,
      success: false,
      error_message: 'No response from server',
    };
  }
  return data[0] as CreateBookingResult;
}

export async function confirmBookingPayment(bookingId: string): Promise<{ success: boolean; error_message: string }> {
  const { data, error } = await supabase.rpc('confirm_booking_payment', {
    p_booking_id: bookingId,
  });
  if (error) throw error;
  return data?.[0] ?? { success: false, error_message: 'No response' };
}

export async function cancelBooking(bookingId: string, reason?: string): Promise<{ success: boolean; error_message: string }> {
  const { data, error } = await supabase.rpc('cancel_booking', {
    p_booking_id: bookingId,
    p_reason: reason ?? null,
  });
  if (error) throw error;
  return data?.[0] ?? { success: false, error_message: 'No response' };
}

export async function fetchMyBookings(): Promise<BookingWithDetails[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select(
      `
        *,
        locations:location_id (name, address),
        sports:sport_id (name, slug),
        courts:court_id (name, court_type)
      `
    )
    .order('booking_date', { ascending: false })
    .order('start_time', { ascending: false });
  if (error) throw error;
  return data as BookingWithDetails[];
}

export async function fetchAllBookings(): Promise<BookingWithDetails[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select(
      `
        *,
        locations:location_id (name, address),
        sports:sport_id (name, slug),
        courts:court_id (name, court_type)
      `
    )
    .order('booking_date', { ascending: false })
    .order('start_time', { ascending: false });
  if (error) throw error;
  return data as BookingWithDetails[];
}

export async function fetchCourtPricing(courtId: string) {
  const { data, error } = await supabase
    .from('court_pricing')
    .select('*')
    .eq('court_id', courtId)
    .eq('is_active', true)
    .order('duration_minutes')
    .order('day_type')
    .order('time_band');
  if (error) throw error;
  return data;
}

export async function fetchAllCourts(): Promise<(Court & { locations: { name: string } | null; sports: { name: string } | null })[]> {
  const { data, error } = await supabase
    .from('courts')
    .select(
      `
        *,
        locations:location_id (name),
        sports:sport_id (name)
      `
    )
    .order('sort_order');
  if (error) throw error;
  return data as (Court & { locations: { name: string } | null; sports: { name: string } | null })[];
}

export async function fetchBlockedSlots(courtId?: string) {
  let query = supabase.from('blocked_slots').select('*, courts:court_id (name)').order('date', { ascending: false });
  if (courtId) {
    query = query.eq('court_id', courtId);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function createBlockedSlot(courtId: string, date: string, startTime: string, endTime: string, reason: string) {
  const { data, error } = await supabase.rpc('create_blocked_slot', {
    p_court_id: courtId,
    p_date: date,
    p_start_time: startTime,
    p_end_time: endTime,
    p_reason: reason || null,
  });
  if (error) throw error;
  return data?.[0];
}

export async function removeBlockedSlot(blockedId: string) {
  const { data, error } = await supabase.rpc('remove_blocked_slot', {
    p_blocked_id: blockedId,
  });
  if (error) throw error;
  return data?.[0];
}

export async function completeBooking(bookingId: string) {
  const { data, error } = await supabase.rpc('complete_booking', {
    p_booking_id: bookingId,
  });
  if (error) throw error;
  return data?.[0];
}

export async function updateCourtPricing(pricingId: string, priceAed: number) {
  const { error } = await supabase
    .from('court_pricing')
    .update({ price_aed: priceAed })
    .eq('id', pricingId);
  if (error) throw error;
}
