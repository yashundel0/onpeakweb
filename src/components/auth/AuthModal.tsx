import { useState } from 'react';
import { X, Loader2, AlertCircle, Mail, Lock, User, Phone } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

type Mode = 'signin' | 'signup' | 'reset';

export default function AuthModal({ onClose }: { onClose: () => void }) {
  const { signIn, signUp, resetPassword } = useAuth();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    if (mode === 'signin') {
      const { error } = await signIn(email, password);
      setLoading(false);
      if (error) setError(error);
      else onClose();
    } else if (mode === 'signup') {
      if (!fullName.trim()) { setError('Please enter your name.'); setLoading(false); return; }
      const { error } = await signUp(email, password, fullName, phone);
      setLoading(false);
      if (error) setError(error);
      else onClose();
    } else {
      const { error } = await resetPassword(email);
      setLoading(false);
      if (error) setError(error);
      else setInfo('Password reset email sent. Check your inbox.');
    }
  };

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-brand-deepest/90 backdrop-blur-md p-4" onClick={onClose}>
      <div className="relative w-full max-w-md rounded-3xl border border-brand-mid/30 bg-brand-deep p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-brand-cream">
            {mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Reset password'}
          </h2>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-brand-cream/60 hover:bg-brand-mid/40" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={submit} className="mt-5 space-y-4">
          {mode === 'signup' && (
            <>
              <InputRow icon={<User className="h-4 w-4" />}>
                <input className="op-input" placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </InputRow>
              <InputRow icon={<Phone className="h-4 w-4" />}>
                <input className="op-input" placeholder="Phone (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </InputRow>
            </>
          )}
          <InputRow icon={<Mail className="h-4 w-4" />}>
            <input type="email" className="op-input" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </InputRow>
          {mode !== 'reset' && (
            <InputRow icon={<Lock className="h-4 w-4" />}>
              <input type="password" className="op-input" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            </InputRow>
          )}

          {error && <ErrorNote>{error}</ErrorNote>}
          {info && <p className="text-xs text-brand-accent">{info}</p>}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-accent px-6 py-3 text-sm font-bold text-brand-deepest transition-colors hover:bg-brand-light disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Send reset email'}
          </button>
        </form>

        <div className="mt-5 flex items-center justify-between text-xs text-brand-cream/60">
          {mode !== 'reset' ? (
            <button onClick={() => { setMode('reset'); setError(null); }} className="hover:text-brand-accent">Forgot password?</button>
          ) : <span />}
          {mode === 'signin' ? (
            <button onClick={() => { setMode('signup'); setError(null); }} className="hover:text-brand-accent">Create account</button>
          ) : (
            <button onClick={() => { setMode('signin'); setError(null); }} className="hover:text-brand-accent">Sign in</button>
          )}
        </div>
      </div>
    </div>
  );
}

function InputRow({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-brand-cream/40">{icon}</span>
      <div className="pl-9 [&_input]:pl-0">{children}</div>
    </div>
  );
}

function ErrorNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{children}</span>
    </div>
  );
}
