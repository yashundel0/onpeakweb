import { useState, useEffect } from 'react';
import { ShieldCheck, Loader2, AlertCircle, ArrowLeft, Lock, Mail } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { navigate } from '@/lib/router';

export default function AdminLoginPage() {
  const { signIn, user, isAdmin, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user && isAdmin) {
      navigate('/admin');
    }
  }, [user, isAdmin, loading]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setSubmitting(true);
    setError(null);
    const { error: signInError } = await signIn(email.trim(), password);
    setSubmitting(false);
    if (signInError) {
      setError(signInError);
      return;
    }
    // onAuthStateChange will pick up the session and redirect via the effect above
  };

  return (
    <div className="min-h-screen bg-brand-deepest flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <button
          onClick={() => navigate('/')}
          className="mb-6 flex items-center gap-1.5 text-xs text-brand-cream/50 hover:text-brand-cream"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to website
        </button>

        <div className="rounded-3xl border border-brand-mid/30 bg-brand-deep p-8 shadow-2xl">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-accent/15 text-brand-accent">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <h1 className="mt-4 font-display text-2xl font-extrabold text-brand-cream">OnPeak Admin</h1>
            <p className="mt-1 text-xs text-brand-cream/50">Sign in to access the management dashboard</p>
          </div>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-widest text-brand-cream/60">Email</span>
              <div className="relative mt-2">
                <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-cream/40" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="op-input pl-10"
                  placeholder="admin@onpeak.com"
                  autoComplete="email"
                  disabled={submitting}
                />
              </div>
            </label>

            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-widest text-brand-cream/60">Password</span>
              <div className="relative mt-2">
                <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-cream/40" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="op-input pl-10"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={submitting}
                />
              </div>
            </label>

            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || loading}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-accent px-6 py-3 text-sm font-bold text-brand-deepest transition-colors hover:bg-brand-light disabled:opacity-60"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              {submitting ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-[11px] text-brand-cream/40">
          Authorized administrators only. Contact your OnPeak account manager if you need access.
        </p>
      </div>
    </div>
  );
}
