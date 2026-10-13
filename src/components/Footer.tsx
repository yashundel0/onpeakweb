import { Instagram, MessageCircle, MapPin } from 'lucide-react';
import { club, nav, whatsappLink } from '@/data/clubData';

const LOGO = '/assets/images/Изображение_PNG_8.png';

export default function Footer() {
  return (
    <footer className="relative bg-brand-deepest border-t border-brand-mid/15">
      {/* Top accent line */}
      <div className="h-px bg-gradient-to-r from-transparent via-brand-accent/40 to-transparent" />

      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-2">
            {/* Official logo */}
            <img
              src={LOGO}
              alt="OnPeak Sports Club"
              className="h-14 w-auto object-contain"
              draggable={false}
            />

            <p className="mt-5 max-w-md text-sm text-brand-cream/50">
              {club.description}
            </p>

            <div className="mt-6 flex items-center gap-2 text-sm text-brand-cream/50">
              <MapPin className="h-4 w-4 text-brand-accent" />
              {club.city}
            </div>

            {/* Social icons */}
            <div className="mt-6 flex items-center gap-3">
              <a
                href={club.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-brand-mid/20 bg-brand-deep text-brand-cream/60 transition-all duration-300 hover:border-brand-accent/50 hover:bg-brand-mid/50 hover:text-brand-cream"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href={whatsappLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-brand-mid/20 bg-brand-deep text-brand-cream/60 transition-all duration-300 hover:border-brand-accent/50 hover:bg-brand-mid/50 hover:text-brand-cream"
                aria-label="WhatsApp"
              >
                <MessageCircle className="h-5 w-5" />
              </a>
              <a
                href={club.googleMaps}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-brand-mid/20 bg-brand-deep text-brand-cream/60 transition-all duration-300 hover:border-brand-accent/50 hover:bg-brand-mid/50 hover:text-brand-cream"
                aria-label="Google Maps"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </a>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="font-display text-sm font-bold uppercase tracking-widest text-brand-cream">
              Navigate
            </h4>
            <ul className="mt-5 space-y-3">
              {nav.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className="text-sm text-brand-cream/50 transition-colors duration-300 hover:text-brand-accent"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Booking links */}
          <div>
            <h4 className="font-display text-sm font-bold uppercase tracking-widest text-brand-cream">
              Book
            </h4>
            <ul className="mt-5 space-y-3">
              <li>
                <a href={club.bookingFootball} target="_blank" rel="noopener noreferrer"
                  className="text-sm text-brand-cream/50 transition-colors duration-300 hover:text-brand-accent">
                  Book Football
                </a>
              </li>
              <li>
                <a href={club.bookingPadel} target="_blank" rel="noopener noreferrer"
                  className="text-sm text-brand-cream/50 transition-colors duration-300 hover:text-brand-accent">
                  Book Padel
                </a>
              </li>
              <li>
                <a href={whatsappLink()} target="_blank" rel="noopener noreferrer"
                  className="text-sm text-brand-cream/50 transition-colors duration-300 hover:text-brand-accent">
                  WhatsApp Booking
                </a>
              </li>
              <li>
                <a href="#events"
                  className="text-sm text-brand-cream/50 transition-colors duration-300 hover:text-brand-accent">
                  Host an Event
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-brand-mid/15 pt-8 sm:flex-row">
          <p className="text-sm font-medium text-brand-cream/40">
            ONPEAK SPORTS CLUB — DUBAI, UAE
          </p>
          <p className="text-xs text-brand-cream/30">
            &copy; 2026 OnPeak Sports Club. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
