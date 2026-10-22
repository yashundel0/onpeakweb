import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { navigate } from '@/lib/router';
import { BarChart3, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const { signIn, user, isAdmin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (user && isAdmin) {
    navigate('/dashboard');
    return null;
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error: err } = await signIn(email, password);
    setLoading(false);
    if (err) { setError(err); return; }
    // AuthContext will re-render; redirect handled by App
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-deepest px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-accent/15 text-brand-accent">
            <BarChart3 className="h-7 w-7" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-extrabold text-brand-cream">OnPeak Admin</h1>
          <p className="mt-1 text-sm text-brand-cream/40">Sports Club Management Dashboard</p>
        </div>

        <form onSubmit={submit} className="op-card space-y-4 p-6">
          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {user && !isAdmin && (
            <div className="flex items-start gap-2 rounded-xl border border-orange-400/30 bg-orange-400/10 p-3 text-sm text-orange-200">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>Access denied. Your account does not have admin privileges.</span>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-brand-cream/50">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@onpeak.ae"
              className="op-input w-full"
              autoFocus
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-brand-cream/50">Password</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="op-input w-full pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-cream/40 hover:text-brand-cream"
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="op-btn w-full">
            {loading ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : 'Login'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-brand-cream/30">
          Authorized personnel only. All actions are logged.
        </p>
      </div>
    </div>
  );
}
