import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Court, Location, Sport } from '@/lib/types';

interface FacilitiesData {
  locations: Location[];
  sports: Sport[];
  courts: Court[];
  loading: boolean;
  error: string | null;
  reload: () => void;
}

export function useFacilities(): FacilitiesData {
  const [locations, setLocations] = useState<Location[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!supabase) {
        setError('Booking system unavailable.');
        setLoading(false);
        return;
      }
      setLoading(true);
      const [locRes, sportRes, courtRes] = await Promise.all([
        supabase.from('locations').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
        supabase.from('sports').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
        supabase.from('courts').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
      ]);
      if (!mounted) return;
      if (locRes.error || sportRes.error || courtRes.error) {
        setError(locRes.error?.message || sportRes.error?.message || courtRes.error?.message || 'Failed to load facilities');
      } else {
        setLocations((locRes.data as Location[]) || []);
        setSports((sportRes.data as Sport[]) || []);
        setCourts((courtRes.data as Court[]) || []);
        setError(null);
      }
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, [tick]);

  return { locations, sports, courts, loading, error, reload: () => setTick((t) => t + 1) };
}

export function courtsForLocation(courts: Court[], locationId: string, sportId: string): Court[] {
  return courts.filter((c) => c.location_id === locationId && c.sport_id === sportId);
}

export function sportBySlug(sports: Sport[], slug: string): Sport | undefined {
  return sports.find((s) => s.slug === slug);
}
