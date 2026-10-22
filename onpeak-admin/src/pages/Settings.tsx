import { useAuth } from '@/context/AuthContext';
import type { useAdminData } from '@/hooks/useAdminData';
import { Shield, Mail, Phone, Building2 } from 'lucide-react';

type AdminData = ReturnType<typeof useAdminData>;

export default function Settings({ adminData }: { adminData: AdminData }) {
  const { user, profile } = useAuth();
  const { locations, sports, courts, bookings, notifications } = adminData;

  const activeCourts = courts.filter((c) => c.is_active).length;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold text-brand-cream">Settings</h2>
        <p className="text-sm text-brand-cream/40">Account and system information</p>
      </div>

      {/* Admin account */}
      <div className="op-card p-6">
        <h3 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand-cream/50">
          <Shield className="h-4 w-4" /> Admin Account
        </h3>
        <div className="space-y-3">
          <Row label="Name" value={profile?.full_name || '—'} />
          <Row label="Email" value={user?.email || '—'} icon={<Mail className="h-4 w-4" />} />
          <Row label="Phone" value={profile?.phone || '—'} icon={<Phone className="h-4 w-4" />} />
          <Row label="Role" value="Administrator" />
        </div>
      </div>

      {/* System info */}
      <div className="op-card p-6">
        <h3 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand-cream/50">
          <Building2 className="h-4 w-4" /> System
        </h3>
        <div className="space-y-3">
          <Row label="Locations" value={`${locations.length} active`} />
          <Row label="Sports" value={sports.map((s) => s.name).join(', ')} />
          <Row label="Courts / Fields" value={`${courts.length} total (${activeCourts} active)`} />
          <Row label="Total Bookings" value={String(bookings.length)} />
          <Row label="Notifications" value={String(notifications.length)} />
        </div>
      </div>

      {/* Locations list */}
      <div className="op-card p-6">
        <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-brand-cream/50">Locations</h3>
        <div className="space-y-2">
          {locations.map((l) => (
            <div key={l.id} className="flex items-center justify-between rounded-xl border border-brand-mid/15 bg-brand-deepest/40 p-3 text-sm">
              <div>
                <p className="font-semibold text-brand-cream">{l.name}</p>
                <p className="text-xs text-brand-cream/40">{l.address}, {l.city}</p>
              </div>
              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${l.is_active ? 'border-green-400/40 text-green-300' : 'border-brand-mid/30 text-brand-cream/40'}`}>
                {l.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      {icon && <span className="text-brand-cream/40">{icon}</span>}
      <span className="text-brand-cream/50">{label}</span>
      <span className="ml-auto font-semibold text-brand-cream">{value}</span>
    </div>
  );
}
