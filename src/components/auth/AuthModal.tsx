import { useState } from 'react';
import { X, Mail, Lock, User, Phone, Loader2, Calendar } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
}

export default function AuthModal({ open, onClose, initialMode = 'signin' }: AuthModalProps) {
  const { signIn, signUp, resetPassword } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (mode === 'signin') {
        const { error: err } = await signIn(email, password);
        if (err) {
          setError(err);
        } else {
          onClose();
        }
      } else if (mode === 'signup') {
        const { error: err } = await signUp(email, password, fullName, phone);
        if (err) {
          setError(err);
        } else {
          setSuccess('Account created! You are now logged in.');
          setTimeout(() => onClose(), 1500);
        }
      } else if (mode === 'reset') {
        const { error: err } = await resetPassword(email);
        if (err) {
          setError(err);
        } else {
          setSuccess('Password reset link sent to your email.');
        }
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-forest-darkest/90 backdrop-blur-md"
        onClick={onClose}
      />
      <div className="glass relative w-full max-w-md rounded-3xl border border-forest-glow/20 p-8">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-lg text-white-soft/60 transition-colors hover:bg-white/5 hover:text-white"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-forest-glow/15 text-forest-glow">
            <Calendar className="h-7 w-7" />
          </div>
          <h2 className="font-display text-2xl font-bold text-white">
            {mode === 'signin' ? 'Welcome Back' : mode === 'signup' ? 'Create Account' : 'Reset Password'}
          </h2>
          <p className="mt-1 text-sm text-white-soft/50">
            {mode === 'signin'
              ? 'Sign in to manage your bookings'
              : mode === 'signup'
              ? 'Join OnPeak to book courts and fields'
              : 'Enter your email to receive a reset link'}
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 rounded-xl border border-forest-glow/30 bg-forest-glow/10 px-4 py-3 text-sm text-forest-soft">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <>
              <div className="relative">
                <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white-soft/30" />
                <input
                  type="text"
                  required
                  placeholder="Full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-forest-dark/50 py-3.5 pl-12 pr-4 text-sm text-white placeholder-white-soft/30 outline-none transition-colors focus:border-forest-glow/50"
                />
              </div>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white-soft/30" />
                <input
                  type="tel"
                  required
                  placeholder="Phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-forest-dark/50 py-3.5 pl-12 pr-4 text-sm text-white placeholder-white-soft/30 outline-none transition-colors focus:border-forest-glow/50"
                />
              </div>
            </>
          )}

          <div className="relative">
            <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white-soft/30" />
            <input
              type="email"
              required
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-forest-dark/50 py-3.5 pl-12 pr-4 text-sm text-white placeholder-white-soft/30 outline-none transition-colors focus:border-forest-glow/50"
            />
          </div>

          {mode !== 'reset' && (
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white-soft/30" />
              <input
                type="password"
                required
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-forest-dark/50 py-3.5 pl-12 pr-4 text-sm text-white placeholder-white-soft/30 outline-none transition-colors focus:border-forest-glow/50"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-shine flex w-full items-center justify-center gap-2 rounded-full bg-forest-glow px-6 py-3.5 text-sm font-bold text-forest-darkest transition-all duration-300 hover:bg-forest-soft hover:shadow-xl hover:shadow-forest-glow/25 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : mode === 'signin' ? (
              'Sign In'
            ) : mode === 'signup' ? (
              'Create Account'
            ) : (
              'Send Reset Link'
            )}
          </button>
        </form>

        <div className="mt-5 space-y-2 text-center text-sm">
          {mode === 'signin' && (
            <>
              <p className="text-white-soft/40">
                Don't have an account?{' '}
                <button onClick={() => { setMode('signup'); setError(null); }} className="text-forest-glow hover:underline">
                  Sign up
                </button>
              </p>
              <button onClick={() => { setMode('reset'); setError(null); }} className="text-white-soft/40 hover:text-forest-soft">
                Forgot password?
              </button>
            </>
          )}
          {mode === 'signup' && (
            <p className="text-white-soft/40">
              Already have an account?{' '}
              <button onClick={() => { setMode('signin'); setError(null); }} className="text-forest-glow hover:underline">
                Sign in
              </button>
            </p>
          )}
          {mode === 'reset' && (
            <p className="text-white-soft/40">
              <button onClick={() => { setMode('signin'); setError(null); }} className="text-forest-glow hover:underline">
                Back to sign in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
