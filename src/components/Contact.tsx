import { Instagram, MessageCircle, Mail, Phone, MapPin, Navigation, Calendar } from 'lucide-react';
import { club, nav, whatsappLink } from '@/data/clubData';
import { useBooking } from '@/context/BookingContext';

export default function Contact() {
  const { openBooking } = useBooking();
  return (
    <section id="contact" className="relative bg-forest-darker py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2">
          {/* Left: heading + CTAs */}
          <div className="reveal-left">
            <span className="text-sm font-semibold uppercase tracking-[0.3em] text-forest-soft/70">
              Get in Touch
            </span>
            <h2 className="mt-4 font-display text-4xl font-extrabold text-white sm:text-5xl md:text-6xl">
              CONTACT <span className="text-gradient-green">US</span>
            </h2>
            <p className="mt-5 max-w-md text-lg text-white-soft/60">
              Ready to play? Reach out and we'll get you on the court or pitch.
            </p>

            {/* Contact methods */}
            <div className="mt-8 space-y-4">
              <a
                href={whatsappLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-4 rounded-2xl border border-forest-glow/15 bg-forest-dark/30 p-5 transition-all duration-300 hover:border-forest-glow/30 hover:bg-forest-dark/50"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-forest-glow/10 text-forest-glow transition-all duration-300 group-hover:scale-110">
                  <MessageCircle className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">WhatsApp</p>
                  <p className="text-sm text-white-soft/60">{club.whatsappDisplay}</p>
                </div>
              </a>

              <a
                href={`tel:${club.phone}`}
                className="group flex items-center gap-4 rounded-2xl border border-forest-glow/15 bg-forest-dark/30 p-5 transition-all duration-300 hover:border-forest-glow/30 hover:bg-forest-dark/50"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-forest-glow/10 text-forest-glow transition-all duration-300 group-hover:scale-110">
                  <Phone className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Phone</p>
                  <p className="text-sm text-white-soft/60">{club.phoneDisplay}</p>
                </div>
              </a>

              <a
                href={`mailto:${club.email}`}
                className="group flex items-center gap-4 rounded-2xl border border-forest-glow/15 bg-forest-dark/30 p-5 transition-all duration-300 hover:border-forest-glow/30 hover:bg-forest-dark/50"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-forest-glow/10 text-forest-glow transition-all duration-300 group-hover:scale-110">
                  <Mail className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Email</p>
                  <p className="text-sm text-white-soft/60">{club.email}</p>
                </div>
              </a>

              <a
                href={club.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-4 rounded-2xl border border-forest-glow/15 bg-forest-dark/30 p-5 transition-all duration-300 hover:border-forest-glow/30 hover:bg-forest-dark/50"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-forest-glow/10 text-forest-glow transition-all duration-300 group-hover:scale-110">
                  <Instagram className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Instagram</p>
                  <p className="text-sm text-white-soft/60">{club.instagramHandle}</p>
                </div>
              </a>
            </div>
          </div>

          {/* Right: address + map preview */}
          <div className="reveal-right flex flex-col gap-6">
            <div className="glass rounded-3xl p-8">
              <div className="flex items-start gap-4">
                <MapPin className="mt-1 h-6 w-6 shrink-0 text-forest-glow" />
                <div>
                  <h3 className="font-display text-xl font-bold text-white">
                    OnPeak Sports Club
                  </h3>
                  <p className="mt-1 text-sm text-white-soft/60">{club.address}</p>
                  <p className="mt-1 text-sm text-forest-soft/70">{club.city}</p>
                </div>
              </div>

              <a
                href={club.googleMaps}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-shine mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-forest-glow px-6 py-3.5 text-sm font-bold text-forest-darkest transition-all duration-300 hover:bg-forest-soft hover:shadow-xl hover:shadow-forest-glow/25"
              >
                <Navigation className="h-4 w-4" />
                GET DIRECTIONS
              </a>
            </div>

            {/* Quick booking reminder */}
            <div className="glass rounded-3xl p-8 text-center">
              <h3 className="font-display text-2xl font-bold text-white">
                Ready to Play?
              </h3>
              <p className="mt-2 text-sm text-white-soft/60">
                Book your football field or padel court now.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={() => openBooking({ sport: 'football' })}
                  className="flex-1 rounded-full bg-forest-glow px-6 py-3 text-sm font-bold text-forest-darkest transition-all duration-300 hover:bg-forest-soft"
                >
                  BOOK FOOTBALL
                </button>
                <button
                  onClick={() => openBooking({ sport: 'padel' })}
                  className="flex-1 rounded-full border border-white/20 px-6 py-3 text-sm font-bold text-white transition-all duration-300 hover:border-forest-glow/40 hover:bg-forest-glow/10"
                >
                  BOOK PADEL
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
