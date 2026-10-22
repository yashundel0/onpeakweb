import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Booking, Location, Sport, Court, Notification, Profile } from '@/lib/types';

export function useAdminData() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newBookingToast, setNewBookingToast] = useState<Booking | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [bk, loc, sp, ct, nf, pr] = await Promise.all([
      supabase.from('bookings').select('*').order('created_at', { ascending: false }).limit(500),
      supabase.from('locations').select('*').order('sort_order'),
      supabase.from('sports').select('*').order('sort_order'),
      supabase.from('courts').select('*').order('sort_order'),
      supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(100),
      supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(500),
    ]);
    if (bk.error) { setError(bk.error.message); setLoading(false); return; }
    setBookings((bk.data as Booking[]) || []);
    setLocations((loc.data as Location[]) || []);
    setSports((sp.data as Sport[]) || []);
    setCourts((ct.data as Court[]) || []);
    setNotifications((nf.data as Notification[]) || []);
    setProfiles((pr.data as Profile[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Realtime subscriptions
  useEffect(() => {
    const channel = supabase
      .channel('admin-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bookings' }, (payload) => {
        const newB = payload.new as Booking;
        setBookings((prev) => [newB, ...prev]);
        setNewBookingToast(newB);
        playNotifSound();
        window.setTimeout(() => setNewBookingToast(null), 8000);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'bookings' }, (payload) => {
        const upd = payload.new as Booking;
        setBookings((prev) => prev.map((b) => (b.id === upd.id ? upd : b)));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'bookings' }, (payload) => {
        const old = payload.old as Booking;
        setBookings((prev) => prev.filter((b) => b.id !== old.id));
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
        const newN = payload.new as Notification;
        setNotifications((prev) => [newN, ...prev]);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'notifications' }, (payload) => {
        const upd = payload.new as Notification;
        setNotifications((prev) => prev.map((n) => (n.id === upd.id ? upd : n)));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const locName = useCallback((id: string) => locations.find((l) => l.id === id)?.name || '—', [locations]);
  const courtName = useCallback((id: string) => courts.find((c) => c.id === id)?.name || '—', [courts]);
  const sportName = useCallback((id: string) => sports.find((s) => s.id === id)?.name || '—', [sports]);
  const sportSlug = useCallback((id: string) => sports.find((s) => s.id === id)?.slug || '', [sports]);

  const unreadNotifs = notifications.filter((n) => !n.is_read).length;

  return {
    bookings, locations, sports, courts, notifications, profiles,
    loading, error, load,
    locName, courtName, sportName, sportSlug,
    newBookingToast, unreadNotifs,
  };
}

function playNotifSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(660, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  } catch {
    // Audio not supported or blocked
  }
}
