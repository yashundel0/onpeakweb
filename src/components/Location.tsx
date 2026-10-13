import { MapPin, Navigation, Clock, Mail, Phone } from 'lucide-react';
import { images, club, whatsappLink } from '@/data/clubData';

export default function Location() {
  return (
    <section id="location" className="relative bg-forest-darker py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Heading */}
        <div className="reveal text-center">
          <span className="text-sm font-semibold uppercase tracking-[0.3em] text-forest-soft/70">
            Find Us
          </span>
          <h2 className="mt-4 font-display text-4xl font-extrabold text-white sm:text-5xl md:text-6xl">
            OUR <span className="text-gradient-green">LOCATION</span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-white-soft/60">
            {club.address}
          </p>
        </div>

        {/* Map + Info */}
        <div className="mt-16 grid gap-8 lg:grid-cols-5">
          {/* Map */}
          <div className="reveal-left lg:col-span-3">
            <div className="overflow-hidden rounded-3xl border border-forest-glow/15">
              <iframe
                src={club.googleMapsEmbed}
                width="100%"
                height="450"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="OnPeak Sports Club Location"
                className="grayscale-[30%] contrast-110"
              />
            </div>
          </div>

          {/* Info card + image */}
          <div className="reveal-right flex flex-col gap-6 lg:col-span-2">
            {/* Club photo */}
            <div className="img-zoom overflow-hidden rounded-3xl border border-forest-glow/10">
              <img
                src={images.dubaiSkyline}
                alt={images.dubaiSkylineAlt}
                className="h-48 w-full object-cover"
                loading="lazy"
              />
            </div>

            {/* Contact info */}
            <div className="glass rounded-3xl p-6 lg:p-8">
              <h3 className="font-display text-xl font-bold text-white">
                OnPeak Sports Club
              </h3>
              <p className="mt-1 text-sm text-forest-soft/70">{club.city}</p>

              <div className="mt-6 space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-forest-glow" />
                  <span className="text-sm text-white-soft/70">{club.address}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 shrink-0 text-forest-glow" />
                  <span className="text-sm text-white-soft/70">Open daily · Always open</span>
                </div>
                <a
                  href={`mailto:${club.email}`}
                  className="flex items-center gap-3 text-sm text-white-soft/70 transition-colors hover:text-forest-soft"
                >
                  <Mail className="h-5 w-5 shrink-0 text-forest-glow" />
                  {club.email}
                </a>
                <a
                  href={`tel:${club.phone}`}
                  className="flex items-center gap-3 text-sm text-white-soft/70 transition-colors hover:text-forest-soft"
                >
                  <Phone className="h-5 w-5 shrink-0 text-forest-glow" />
                  {club.phoneDisplay}
                </a>
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

              <a
                href={whatsappLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-white/15 px-6 py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:border-forest-glow/40 hover:bg-forest-glow/10"
              >
                CONTACT ON WHATSAPP
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
