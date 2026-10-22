export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
export type PaymentStatus = 'pending' | 'pay_at_venue' | 'paid' | 'failed' | 'refunded' | 'cancelled' | 'partially_paid';

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface Location {
  id: string;
  name: string;
  slug: string;
  address: string;
  city: string;
  is_active: boolean;
  sort_order: number | null;
}

export interface Sport {
  id: string;
  name: string;
  slug: string;
  icon_name: string | null;
  is_active: boolean;
  sort_order: number | null;
}

export interface Court {
  id: string;
  location_id: string;
  sport_id: string;
  name: string;
  court_type: string;
  is_active: boolean;
  sort_order: number | null;
  is_indoor: boolean;
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
  admin_notes: string | null;
  players_count: number | null;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string | null;
  booking_id: string | null;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}
