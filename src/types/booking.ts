export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';
export type DayType = 'weekday' | 'weekend';
export type TimeBand = 'off_peak' | 'standard' | 'peak';

export interface Location {
  id: string;
  name: string;
  slug: string;
  address: string;
  city: string;
  google_maps: string | null;
  google_maps_embed: string | null;
  description: string | null;
  image_url: string | null;
  opening_hours: Record<string, { open: string; close: string }> | null;
  is_active: boolean;
  sort_order: number;
}

export interface Sport {
  id: string;
  name: string;
  slug: string;
  icon_name: string;
  is_active: boolean;
  sort_order: number;
}

export interface Court {
  id: string;
  location_id: string;
  sport_id: string;
  name: string;
  court_type: string;
  is_active: boolean;
  sort_order: number;
}

export interface CourtPricing {
  id: string;
  court_id: string;
  duration_minutes: number;
  day_type: DayType;
  time_band: TimeBand;
  price_aed: number;
  is_active: boolean;
}

export interface Booking {
  id: string;
  booking_code: string;
  user_id: string | null;
  location_id: string;
  sport_id: string;
  court_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  price_aed: number;
  discount_aed: number;
  final_price_aed: number;
  payment_status: PaymentStatus;
  booking_status: BookingStatus;
  cancellation_reason: string | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface BookingWithDetails extends Booking {
  locations?: { name: string; address: string };
  sports?: { name: string; slug: string };
  courts?: { name: string; court_type: string };
}

export interface AvailableSlot {
  start_time: string;
  end_time: string;
  duration_minutes: number;
  is_available: boolean;
  status: string;
  price_aed: number;
}

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateBookingResult {
  booking_id: string;
  booking_code: string;
  price_aed: number;
  discount_aed: number;
  final_price_aed: number;
  success: boolean;
  error_message: string;
}
