import { useEffect } from 'react';
import { Loader2, ShieldAlert, BarChart3, LogOut, ExternalLink } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, navigate } from '@/lib/router';
import AdminDashboard from '@/components/admin/AdminDashboard';

const VALID_SECTIONS = ['overview', 'bookings', 'calendar', 'facilities', 'customers', 'revenue', 'blocked'];

function sectionFromPath(path: string): string {
  const parts = path.replace(/^\/admin\/?/, '').split('/').filter(Boolean);
  let sec = parts[0] || 'overview';
  if (sec === 'facilities') sec = 'resources';
  if (sec === 'settings') sec = 'overview';
  return VALID_SECTIONS.includes(sec) || sec === 'resources' ? sec : 'overview';
}

export default function AdminApp() {
  const { user, isAdmin, loading, signOut } = useAuth();
  const path = useRouter();
  const section = sectionFromPath(path);

  // Redirect unauthenticated users to /admin/login
  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate('/admin/login');
    }
  }, [user, isAdmin, loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-deepest flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-brand-accent" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-brand-deepest flex items-center justify-center p-4">
        <div className="max-w-md rounded-2xl border border-red-400/30 bg-brand-deep p-8 text-center">
          <ShieldAlert className="mx-auto h-10 w-10 text-red-300" />
          <h2 className="mt-4 font-display text-xl font-bold text-brand-cream">Admin access required</h2>
          <p className="mt-2 text-sm text-brand-cream/60">You must sign in with an authorized admin account.</p>
          <button
            onClick={() => navigate('/admin/login')}
            className="mt-6 rounded-full bg-brand-accent px-6 py-2.5 text-sm font-bold text-brand-deepest hover:bg-brand-light"
          >
            Go to login
          </button>
        </div>
      </div>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-brand-deepest">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-brand-mid/20 bg-brand-deepest/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-accent/15 text-brand-accent">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-brand-cream">OnPeak Admin</h2>
              <p className="text-[11px] text-brand-cream/50">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1.5 rounded-full border border-brand-mid/30 px-3 py-1.5 text-xs font-semibold text-brand-cream/70 hover:bg-brand-mid/40"
            >
              <ExternalLink className="h-3.5 w-3.5" /> View site
            </button>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 rounded-full border border-brand-mid/30 px-3 py-1.5 text-xs font-semibold text-brand-cream/70 hover:bg-red-400/10 hover:text-red-200"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          </div>
        </div>

        {/* Section nav */}
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 pb-2 md:px-6">
          {([
            { id: 'overview', label: 'Overview' },
            { id: 'bookings', label: 'Bookings' },
            { id: 'calendar', label: 'Calendar' },
            { id: 'facilities', label: 'Facilities' },
            { id: 'customers', label: 'Customers' },
            { id: 'revenue', label: 'Revenue' },
            { id: 'blocked', label: 'Blocked' },
          ]).map((t) => (
            <button
              key={t.id}
              onClick={() => navigate(`/admin/${t.id === 'overview' ? '' : t.id}`)}
              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                section === t.id ? 'bg-brand-accent text-brand-deepest' : 'text-brand-cream/70 hover:bg-brand-mid/40'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      {/* Routed dashboard content */}
      <main className="mx-auto max-w-6xl px-4 py-6 md:px-6">
        <AdminDashboard route={section as any} />
      </main>
    </div>
  );
}
