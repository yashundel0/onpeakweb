import { useEffect, useState, useCallback } from 'react';

export function useData<T>(
  fetcher: () => Promise<{ data: T | null; error: string | null }>,
  deps: unknown[] = []
): { data: T | null; error: string | null; loading: boolean; reload: () => void } {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await fetcher();
    setData(result.data);
    setError(result.error);
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => { load(); }, [load]);

  return { data, error, loading, reload: load };
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function fmtTime(t: string): string {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const hh = ((h + 11) % 12) + 1;
  return `${hh}:${m.toString().padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

export function fmtDate(d: string): string {
  if (!d) return '';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function fmtDateTime(ts: string): string {
  if (!ts) return '';
  return new Date(ts).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function fmtRelative(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function statusBadgeClass(status: string): string {
  if (status === 'confirmed') return 'border-green-400/40 bg-green-400/10 text-green-300';
  if (status === 'pending') return 'border-yellow-400/40 bg-yellow-400/10 text-yellow-200';
  if (status === 'cancelled') return 'border-red-400/40 bg-red-400/10 text-red-300';
  if (status === 'completed') return 'border-brand-accent/40 bg-brand-accent/10 text-brand-accent';
  if (status === 'no_show') return 'border-orange-400/40 bg-orange-400/10 text-orange-300';
  return 'border-brand-mid/30 text-brand-cream/50';
}

export function paymentBadgeClass(status: string): string {
  if (status === 'paid') return 'border-green-400/40 bg-green-400/10 text-green-300';
  if (status === 'pay_at_venue') return 'border-yellow-400/40 bg-yellow-400/10 text-yellow-200';
  if (status === 'partially_paid') return 'border-blue-400/40 bg-blue-400/10 text-blue-200';
  if (status === 'refunded') return 'border-purple-400/40 bg-purple-400/10 text-purple-200';
  if (status === 'failed') return 'border-red-400/40 bg-red-400/10 text-red-300';
  return 'border-brand-mid/30 text-brand-cream/50';
}

export function paymentLabel(status: string): string {
  switch (status) {
    case 'pay_at_venue': return 'Pay at venue';
    case 'partially_paid': return 'Partially paid';
    case 'pending': return 'Unpaid';
    default: return status.replace(/_/g, ' ');
  }
}
