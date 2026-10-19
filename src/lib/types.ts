export type SportSlug = 'padel' | 'football';

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'expired';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded';

export interface Sport {
  id: string;
  name: string;
  slug: string;
  icon_name: string | null;
  is_active: boolean;
  sort_order: number;
}

export interface Location {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  city: string | null;
  google_maps: string | null;
  google_maps_embed: string | null;
  description: string | null;
  image_url: string | null;
  opening_hours: Record<string, { open: string; close: string }> | null;
  is_active: boolean;
  sort_order: number;
}

export interface Court {
  id: string;
  location_id: string;
  sport_id: string;
  name: string;
  court_type: string | null;
  is_active: boolean;
  is_indoor: boolean;
  special_marker: string | null;
  sort_order: number;
}

export interface Slot {
  start_time: string;
  end_time: string;
  duration_minutes: number;
  is_available: boolean;
  status: string;
  price_aed: number;
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
  discount_aed: number | null;
  final_price_aed: number;
  promo_code_id: string | null;
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

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface BlockedSlot {
  id: string;
  court_id: string;
  date: string;
  start_time: string;
  end_time: string;
  reason: string | null;
  created_by: string | null;
  created_at: string;
}

export interface CourtPricing {
  id: string;
  court_id: string;
  duration_minutes: number;
  day_type: 'weekday' | 'weekend' | 'holiday';
  time_band: 'off_peak' | 'peak' | 'evening';
  price_aed: number;
  is_active: boolean;
  created_at: string;
}

export interface Payment {
  id: string;
  booking_id: string;
  amount_aed: number;
  currency: string;
  provider: string | null;
  provider_reference: string | null;
  status: PaymentStatus;
  paid_at: string | null;
  failed_at: string | null;
  refunded_at: string | null;
  created_at: string;
}

export interface PromoCode {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  max_uses: number | null;
  used_count: number;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
  location_restriction: string | null;
  sport_restriction: string | null;
  created_at: string;
}
