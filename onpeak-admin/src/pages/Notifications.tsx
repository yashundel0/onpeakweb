import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { useAdminData } from '@/hooks/useAdminData';
import { fmtRelative } from '@/lib/utils';
import { navigate } from '@/lib/router';
import { Bell, Check, Loader2 } from 'lucide-react';

type AdminData = ReturnType<typeof useAdminData>;

export default function Notifications({ adminData }: { adminData: AdminData }) {
  const { notifications, load } = adminData;
  const [busy, setBusy] = useState<string | null>(null);

  const markRead = async (id: string) => {
    setBusy(id);
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setBusy(null);
    if (error) { alert(error.message); return; }
    load();
  };

  const markAllRead = async () => {
    const unread = notifications.filter((n) => !n.is_read);
    if (unread.length === 0) return;
    setBusy('all');
    const { error } = await supabase.from('notifications').update({ is_read: true }).in('id', unread.map((n) => n.id));
    setBusy(null);
    if (error) { alert(error.message); return; }
    load();
  };

  const unread = notifications.filter((n) => !n.is_read);

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-brand-cream">Notifications</h2>
          <p className="text-sm text-brand-cream/40">{unread.length > 0 ? `${unread.length} unread` : 'All caught up'}</p>
        </div>
        {unread.length > 0 && (
          <button onClick={markAllRead} disabled={busy === 'all'} className="op-btn-ghost flex items-center gap-1.5">
            {busy === 'all' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            Mark all as read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="rounded-2xl border border-brand-mid/20 bg-brand-deep/40 p-8 text-center text-sm text-brand-cream/40">
          No notifications yet. New bookings will appear here in real time.
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`flex items-start gap-3 rounded-2xl border p-4 transition-colors ${
                n.is_read ? 'border-brand-mid/15 bg-brand-deepest/30' : 'border-brand-accent/30 bg-brand-accent/5'
              }`}
            >
              <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${n.is_read ? 'bg-brand-mid/30 text-brand-cream/40' : 'bg-brand-accent/15 text-brand-accent'}`}>
                <Bell className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`text-sm font-bold ${n.is_read ? 'text-brand-cream/60' : 'text-brand-cream'}`}>{n.title}</p>
                  {!n.is_read && <span className="h-2 w-2 rounded-full bg-brand-accent" />}
                </div>
                <p className="mt-0.5 text-xs text-brand-cream/60">{n.message}</p>
                <div className="mt-2 flex items-center gap-3">
                  <p className="text-[10px] text-brand-cream/30">{fmtRelative(n.created_at)}</p>
                  {n.booking_id && (
                    <button onClick={() => navigate(`/bookings?id=${n.booking_id}`)} className="text-[10px] font-semibold text-brand-accent hover:text-brand-light">
                      View booking →
                    </button>
                  )}
                </div>
              </div>
              {!n.is_read && (
                <button
                  onClick={() => markRead(n.id)}
                  disabled={busy === n.id}
                  className="shrink-0 rounded-full border border-brand-mid/30 px-3 py-1 text-[11px] font-semibold text-brand-cream/60 hover:border-brand-accent/40 hover:text-brand-accent disabled:opacity-60"
                >
                  {busy === n.id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Mark read'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
