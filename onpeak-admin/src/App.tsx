import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, navigate } from '@/lib/router';
import { useAdminData } from '@/hooks/useAdminData';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Bookings from '@/pages/Bookings';
import Calendar from '@/pages/Calendar';
import Customers from '@/pages/Customers';
import Notifications from '@/pages/Notifications';
import Settings from '@/pages/Settings';
import {
  LayoutDashboard, CalendarDays, Users, Bell, Settings as SettingsIcon,
  LogOut, BarChart3, X, ExternalLink,
} from 'lucide-react';

export default function App() {
  const { user, isAdmin, loading, signOut } = useAuth();
  const path = useRouter();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-deepest">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-mid border-t-brand-accent" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Login />;
  }

  return <Shell path={path} onSignOut={signOut} />;
}

function Shell({ path, onSignOut }: { path: string; onSignOut: () => Promise<void> }) {
  const adminData = useAdminData();
  const segment = path.replace(/^\//, '').split('/')[0] || 'dashboard';

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'bookings', label: 'Bookings', icon: CalendarDays },
    { id: 'calendar', label: 'Calendar', icon: BarChart3 },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <div className="flex min-h-screen bg-brand-deepest">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-brand-mid/20 bg-brand-deep lg:static lg:translate-x-0 -translate-x-full transition-transform">
        <div className="flex items-center gap-3 border-b border-brand-mid/20 px-6 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-accent/15 text-brand-accent">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-base font-extrabold text-brand-cream">OnPeak Admin</h1>
            <p className="text-[10px] text-brand-cream/40">Sports Club Management</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const active = segment === item.id;
            return (
              <button
                key={item.id}
                onClick={() => navigate(`/${item.id}`)}
                className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors ${
                  active ? 'bg-brand-accent text-brand-deepest' : 'text-brand-cream/60 hover:bg-brand-mid/30 hover:text-brand-cream'
                }`}
              >
                <item.icon className="h-4.5 w-4.5" />
                {item.label}
                {item.id === 'notifications' && adminData.unreadNotifs > 0 && (
                  <span className={`ml-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${
                    active ? 'bg-brand-deepest text-brand-accent' : 'bg-brand-accent text-brand-deepest'
                  }`}>
                    {adminData.unreadNotifs > 9 ? '9+' : adminData.unreadNotifs}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-brand-mid/20 px-3 py-4">
          <a
            href="https://onpeakweb.github.io/onpeakweb/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-brand-cream/50 hover:bg-brand-mid/30 hover:text-brand-cream"
          >
            <ExternalLink className="h-4 w-4" /> View customer site
          </a>
          <button
            onClick={() => { onSignOut(); navigate('/login'); }}
            className="flex w-full items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-red-300/70 hover:bg-red-400/10 hover:text-red-300"
          >
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="flex flex-1 flex-col lg:pl-0">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-brand-mid/20 bg-brand-deepest/95 px-4 py-3 backdrop-blur lg:hidden">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-accent/15 text-brand-accent">
              <BarChart3 className="h-4 w-4" />
            </div>
            <span className="font-display text-sm font-bold text-brand-cream">OnPeak Admin</span>
          </div>
          <MobileNav items={navItems} segment={segment} unread={adminData.unreadNotifs} />
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {adminData.error && (
            <div className="mb-4 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">
              {adminData.error}
            </div>
          )}

          {segment === 'dashboard' && <Dashboard adminData={adminData} />}
          {segment === 'bookings' && <Bookings adminData={adminData} />}
          {segment === 'calendar' && <Calendar adminData={adminData} />}
          {segment === 'customers' && <Customers adminData={adminData} />}
          {segment === 'notifications' && <Notifications adminData={adminData} />}
          {segment === 'settings' && <Settings adminData={adminData} />}
        </main>
      </div>

      {/* New booking toast */}
      {adminData.newBookingToast && (
        <NewBookingToast booking={adminData.newBookingToast} locName={adminData.locName} courtName={adminData.courtName} sportName={adminData.sportName} />
      )}
    </div>
  );
}

function MobileNav({ items, segment, unread }: { items: { id: string; label: string; icon: typeof BarChart3 }[]; segment: string; unread: number }) {
  const [open, setOpen] = useState(false);
  useEffect(() => { setOpen(false); }, [segment]);

  return (
    <>
      <button onClick={() => setOpen(!open)} className="flex h-9 w-9 items-center justify-center rounded-lg text-brand-cream/60 hover:bg-brand-mid/40">
        {open ? <X className="h-5 w-5" /> : <BarChart3 className="h-5 w-5" />}
      </button>
      {open && (
        <div className="absolute inset-x-0 top-full border-b border-brand-mid/20 bg-brand-deep p-3">
          <div className="space-y-1">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => { navigate(`/${item.id}`); setOpen(false); }}
                className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold ${
                  segment === item.id ? 'bg-brand-accent text-brand-deepest' : 'text-brand-cream/60 hover:bg-brand-mid/30'
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
                {item.id === 'notifications' && unread > 0 && (
                  <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-accent px-1.5 text-[10px] font-bold text-brand-deepest">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function NewBookingToast({ booking, locName, courtName, sportName }: {
  booking: Booking; locName: (id: string) => string; courtName: (id: string) => string; sportName: (id: string) => string;
}) {
  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm animate-fade-in rounded-2xl border border-brand-accent/40 bg-brand-deep p-5 shadow-2xl">
      <div className="flex items-center gap-2">
        <span className="flex h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
        <span className="text-xs font-bold uppercase tracking-widest text-red-400">New Booking</span>
      </div>
      <p className="mt-3 text-sm font-bold text-brand-cream">{booking.customer_name || 'Customer'}</p>
      <p className="mt-1 text-xs text-brand-cream/60">
        {sportName(booking.sport_id)} — {courtName(booking.court_id)}<br />
        {booking.booking_date} at {booking.start_time.slice(0, 5)}<br />
        {locName(booking.location_id)}
      </p>
      <button
        onClick={() => navigate('/bookings')}
        className="mt-3 rounded-lg bg-brand-accent px-4 py-1.5 text-xs font-bold text-brand-deepest hover:bg-brand-light"
      >
        View Booking
      </button>
    </div>
  );
}

// Type alias to avoid importing Booking twice
import type { Booking } from '@/lib/types';
