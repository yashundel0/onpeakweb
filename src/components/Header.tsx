import { useState, useEffect } from 'react';
import { Menu, X, Calendar, User as UserIcon, LogOut, Shield, ChevronDown } from 'lucide-react';
import { nav, club } from '@/data/clubData';
import { useAuth } from '@/context/AuthContext';
import { useBooking } from '@/context/BookingContext';

const LOGO = '/onpeakweb/assets/images/Изображение_PNG_8.png';

interface HeaderProps {
  onOpenAuth: () => void;
  onOpenAccount: () => void;
  onOpenAdmin: () => void;
}

export default function Header({ onOpenAuth, onOpenAccount, onOpenAdmin }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [acctMenu, setAcctMenu] = useState(false);
  const { user, profile, isAdmin, signOut } = useAuth();
  const { openBooking } = useBooking();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const handleNavClick = () => setMenuOpen(false);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? 'bg-brand-deep/90 backdrop-blur-xl py-3 shadow-2xl shadow-black/40 border-b border-brand-mid/30'
            : 'bg-transparent py-5'
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 lg:px-8">
          {/* Official Logo */}
          <a href="#home" className="group flex items-center" aria-label="OnPeak Sports Club home">
            <img
              src={LOGO}
              alt="OnPeak Sports Club"
              className="h-11 w-auto object-contain transition-opacity duration-300 group-hover:opacity-90 lg:h-12"
              draggable={false}
            />
          </a>

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-1 lg:flex">
            {nav.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="group relative px-4 py-2 text-sm font-medium text-brand-cream/80 transition-colors duration-300 hover:text-brand-cream"
              >
                {item.label}
                <span className="absolute bottom-0 left-1/2 h-0.5 w-0 -translate-x-1/2 rounded-full bg-brand-accent transition-all duration-300 group-hover:w-6" />
              </a>
            ))}
          </nav>

          {/* Desktop right cluster */}
          <div className="hidden items-center gap-3 lg:flex">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setAcctMenu((v) => !v)}
                  onBlur={() => setTimeout(() => setAcctMenu(false), 150)}
                  className="flex items-center gap-2 rounded-full border border-brand-mid/30 px-3 py-2 text-sm font-semibold text-brand-cream/80 hover:border-brand-accent/40"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-accent text-xs font-bold text-brand-deepest">
                    {(profile?.full_name || user.email || 'U').charAt(0).toUpperCase()}
                  </span>
                  <span className="max-w-[120px] truncate">{profile?.full_name || 'Account'}</span>
                  <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                </button>
                {acctMenu && (
                  <div className="absolute right-0 top-full mt-2 w-52 overflow-hidden rounded-2xl border border-brand-mid/30 bg-brand-deep shadow-2xl">
                    <button onClick={() => { setAcctMenu(false); onOpenAccount(); }} className="flex w-full items-center gap-2 px-4 py-3 text-sm text-brand-cream/80 hover:bg-brand-mid/40">
                      <UserIcon className="h-4 w-4" /> My bookings
                    </button>
                    {isAdmin && (
                      <button onClick={() => { setAcctMenu(false); onOpenAdmin(); }} className="flex w-full items-center gap-2 px-4 py-3 text-sm text-brand-cream/80 hover:bg-brand-mid/40">
                        <Shield className="h-4 w-4" /> Admin dashboard
                      </button>
                    )}
                    <button onClick={async () => { setAcctMenu(false); await signOut(); }} className="flex w-full items-center gap-2 px-4 py-3 text-sm text-red-200 hover:bg-red-400/10">
                      <LogOut className="h-4 w-4" /> Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="rounded-full border border-brand-mid/30 px-4 py-2 text-sm font-semibold text-brand-cream/80 transition-colors hover:border-brand-accent/40"
              >
                Sign in
              </button>
            )}
            <button
              onClick={() => openBooking()}
              className="btn-shine hidden items-center gap-2 rounded-full bg-brand-accent px-6 py-2.5 text-sm font-bold text-brand-deep transition-all duration-300 hover:bg-brand-light hover:shadow-lg hover:shadow-brand-accent/30 xl:flex"
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
        className={`fixed inset-0 z-[60] lg:hidden ${menuOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
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
            {nav.map((item, i) => (
              <a
                key={item.label}
                href={item.href}
                onClick={handleNavClick}
                className="rounded-xl px-4 py-3.5 text-base font-medium text-brand-cream/80 transition-all duration-300 hover:bg-brand-mid/40 hover:text-brand-cream"
                style={{ animation: menuOpen ? `fadeInUp 0.4s ease-out ${i * 0.06}s forwards` : 'none', opacity: menuOpen ? undefined : 0 }}
              >
                {item.label}
              </a>
            ))}
            <button
              onClick={() => { setMenuOpen(false); openBooking(); }}
              className="mt-4 flex items-center justify-center gap-2 rounded-full bg-brand-accent px-6 py-3.5 text-sm font-bold text-brand-deepest transition-all duration-300 hover:bg-brand-light"
            >
              <Calendar className="h-4 w-4" /> BOOK NOW
            </button>

            <div className="my-3 h-px bg-brand-mid/20" />

            {user ? (
              <>
                <button onClick={() => { setMenuOpen(false); onOpenAccount(); }} className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm text-brand-cream/80 hover:bg-brand-mid/40">
                  <UserIcon className="h-4 w-4" /> My bookings
                </button>
                {isAdmin && (
                  <button onClick={() => { setMenuOpen(false); onOpenAdmin(); }} className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm text-brand-cream/80 hover:bg-brand-mid/40">
                    <Shield className="h-4 w-4" /> Admin
                  </button>
                )}
                <button onClick={async () => { setMenuOpen(false); await signOut(); }} className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm text-red-200 hover:bg-red-400/10">
                  <LogOut className="h-4 w-4" /> Sign out
                </button>
              </>
            ) : (
              <button onClick={() => { setMenuOpen(false); onOpenAuth(); }} className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm text-brand-cream/80 hover:bg-brand-mid/40">
                <UserIcon className="h-4 w-4" /> Sign in
              </button>
            )}
          </nav>

          <div className="mt-auto px-6 pb-8">
            <p className="text-xs uppercase tracking-widest text-brand-cream/40">{club.city}</p>
            <p className="mt-1 text-sm text-brand-cream/50">{club.instagramHandle}</p>
          </div>
        </div>
      </div>
    </>
  );
}
