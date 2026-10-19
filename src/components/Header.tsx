import { useState, useEffect } from 'react';
import { Menu, X, Calendar, User, LogOut, LayoutGrid, ClipboardList } from 'lucide-react';
import { nav, club } from '@/data/clubData';
import { useAuth } from '@/hooks/useAuth';

const LOGO = '/onpeakweb/assets/images/Изображение_PNG_8.png';

interface HeaderProps {
  onBookNow: () => void;
  onMyBookings: () => void;
  onAdmin: () => void;
  onSignIn: () => void;
  onSignUp: () => void;
  view: string;
  onHome: () => void;
}

export default function Header({
  onBookNow, onMyBookings, onAdmin, onSignIn, onSignUp, view, onHome,
}: HeaderProps) {
  const { user, profile, signOut, isAdmin } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const handleNavClick = () => setMenuOpen(false);

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onHome();
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled || view !== 'home'
            ? 'bg-brand-deep/90 backdrop-blur-xl py-3 shadow-2xl shadow-black/40 border-b border-brand-mid/30'
            : 'bg-transparent py-5'
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 lg:px-8">
          {/* Official Logo */}
          <a
            href="#home"
            onClick={handleLogoClick}
            className="group flex items-center"
            aria-label="OnPeak Sports Club home"
          >
            <img
              src={LOGO}
              alt="OnPeak Sports Club"
              className="h-11 w-auto object-contain transition-opacity duration-300 group-hover:opacity-90 lg:h-12"
              draggable={false}
            />
          </a>

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-1 lg:flex">
            {view === 'home' && nav.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="group relative px-4 py-2 text-sm font-medium text-brand-cream/80 transition-colors duration-300 hover:text-brand-cream"
              >
                {item.label}
                <span className="absolute bottom-0 left-1/2 h-0.5 w-0 -translate-x-1/2 rounded-full bg-brand-accent transition-all duration-300 group-hover:w-6" />
              </a>
            ))}
            {view !== 'home' && (
              <button
                onClick={onHome}
                className="px-4 py-2 text-sm font-medium text-brand-cream/80 transition-colors duration-300 hover:text-brand-cream"
              >
                Back to Home
              </button>
            )}
          </nav>

          {/* Desktop right actions */}
          <div className="hidden items-center gap-3 lg:flex">
            {user ? (
              <>
                <button
                  onClick={onMyBookings}
                  className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    view === 'mybookings' ? 'text-brand-accent' : 'text-brand-cream/70 hover:text-brand-cream'
                  }`}
                >
                  <ClipboardList className="h-4 w-4" />
                  My Bookings
                </button>
                {isAdmin && (
                  <button
                    onClick={onAdmin}
                    className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                      view === 'admin' ? 'text-brand-accent' : 'text-brand-cream/70 hover:text-brand-cream'
                    }`}
                  >
                    <LayoutGrid className="h-4 w-4" />
                    Admin
                  </button>
                )}
                <button
                  onClick={() => signOut()}
                  className="flex items-center gap-1.5 rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-brand-cream/60 transition-all hover:border-red-500/30 hover:text-red-300"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </>
            ) : (
              <button
                onClick={onSignIn}
                className="flex items-center gap-1.5 rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-brand-cream/70 transition-all hover:border-brand-accent/40 hover:text-brand-cream"
              >
                <User className="h-4 w-4" />
                Sign in
              </button>
            )}
            <button
              onClick={onBookNow}
              className="btn-shine flex items-center gap-2 rounded-full bg-brand-accent px-6 py-2.5 text-sm font-bold text-brand-deep transition-all duration-300 hover:bg-brand-light hover:shadow-lg hover:shadow-brand-accent/30"
            >
              <Calendar className="h-4 w-4" />
              BOOK NOW
            </button>
          </div>

          {/* Mobile Hamburger */}
          <button
            className="flex h-10 w-10 items-center justify-center rounded-lg text-brand-cream lg:hidden"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <div
        className={`fixed inset-0 z-[60] lg:hidden ${
          menuOpen ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
      >
        <div
          className={`absolute inset-0 bg-brand-deepest/85 backdrop-blur-md transition-opacity duration-400 ${
            menuOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setMenuOpen(false)}
        />
        <div
          className={`absolute right-0 top-0 h-full w-[85%] max-w-sm bg-brand-deep border-l border-brand-mid/20 transition-transform duration-500 ease-out ${
            menuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between border-b border-brand-mid/15 px-6 py-5">
            <img src={LOGO} alt="OnPeak Sports Club" className="h-9 w-auto object-contain" draggable={false} />
            <button
              className="flex h-10 w-10 items-center justify-center rounded-lg text-brand-cream/70 hover:text-brand-cream"
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <nav className="flex flex-col gap-1 px-4 py-6">
            {view === 'home' && nav.map((item, i) => (
              <a
                key={item.label}
                href={item.href}
                onClick={handleNavClick}
                className="rounded-xl px-4 py-3.5 text-base font-medium text-brand-cream/80 transition-all duration-300 hover:bg-brand-mid/40 hover:text-brand-cream"
                style={{
                  animation: menuOpen ? `fadeInUp 0.4s ease-out ${i * 0.06}s forwards` : 'none',
                  opacity: menuOpen ? undefined : 0,
                }}
              >
                {item.label}
              </a>
            ))}
            {view !== 'home' && (
              <button
                onClick={() => { onHome(); setMenuOpen(false); }}
                className="rounded-xl px-4 py-3.5 text-left text-base font-medium text-brand-cream/80 transition-all duration-300 hover:bg-brand-mid/40 hover:text-brand-cream"
              >
                Back to Home
              </button>
            )}

            <button
              onClick={() => { onBookNow(); setMenuOpen(false); }}
              className="mt-4 flex items-center justify-center gap-2 rounded-full bg-brand-accent px-6 py-3.5 text-sm font-bold text-brand-deepest transition-all duration-300 hover:bg-brand-light"
            >
              <Calendar className="h-4 w-4" />
              BOOK NOW
            </button>

            {user ? (
              <>
                <button
                  onClick={() => { onMyBookings(); setMenuOpen(false); }}
                  className="mt-2 flex items-center gap-2 rounded-xl px-4 py-3.5 text-base font-medium text-brand-cream/80 transition-all hover:bg-brand-mid/40"
                >
                  <ClipboardList className="h-5 w-5" /> My Bookings
                </button>
                {isAdmin && (
                  <button
                    onClick={() => { onAdmin(); setMenuOpen(false); }}
                    className="flex items-center gap-2 rounded-xl px-4 py-3.5 text-base font-medium text-brand-cream/80 transition-all hover:bg-brand-mid/40"
                  >
                    <LayoutGrid className="h-5 w-5" /> Admin Dashboard
                  </button>
                )}
                <button
                  onClick={() => { signOut(); setMenuOpen(false); }}
                  className="flex items-center gap-2 rounded-xl px-4 py-3.5 text-base font-medium text-red-300/70 transition-all hover:bg-red-500/10"
                >
                  <LogOut className="h-5 w-5" /> Sign out
                </button>
              </>
            ) : (
              <button
                onClick={() => { onSignIn(); setMenuOpen(false); }}
                className="mt-2 flex items-center justify-center gap-2 rounded-full border border-white/15 px-6 py-3.5 text-sm font-semibold text-brand-cream/80 transition-all hover:border-brand-accent/40"
              >
                <User className="h-4 w-4" /> Sign in / Sign up
              </button>
            )}
          </nav>

          <div className="mt-auto px-6 pb-8">
            <p className="text-xs uppercase tracking-widest text-brand-cream/40">{club.city}</p>
            <p className="mt-1 text-sm text-brand-cream/50">{club.instagramHandle}</p>
            {user && profile?.full_name && (
              <p className="mt-2 text-xs text-brand-accent/60">Signed in as {profile.full_name}</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
