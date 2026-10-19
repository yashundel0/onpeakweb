import { MapPin, Navigation, Clock, Mail, Phone, Calendar, Loader2, CircleDot, Building2, Home, AlertCircle } from 'lucide-react';
import { club, whatsappLink } from '@/data/clubData';
import { useFacilities, courtsForLocation, sportBySlug } from '@/hooks/useFacilities';
import { useBooking } from '@/context/BookingContext';
import { Court } from '@/lib/types';

export default function Location() {
  const { locations, sports, courts, loading, error } = useFacilities();
  const { openBooking } = useBooking();
  const padel = sportBySlug(sports, 'padel');
  const football = sportBySlug(sports, 'football');

  return (
    <section id="location" className="relative bg-forest-darker py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="reveal text-center">
          <span className="text-sm font-semibold uppercase tracking-[0.3em] text-forest-soft/70">Find Us</span>
          <h2 className="mt-4 font-display text-4xl font-extrabold text-white sm:text-5xl md:text-6xl">
            OUR <span className="text-gradient-green">LOCATIONS</span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-white-soft/60">
            Visit OnPeak at either of our premium Dubai sports club locations.
          </p>
        </div>

        {loading && (
          <div className="mt-12 flex items-center justify-center text-white-soft/60">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading locations…
          </div>
        )}

        {error && !loading && (
          <div className="mt-12 flex items-start gap-3 rounded-2xl border border-red-400/30 bg-red-400/10 p-6 text-red-200">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">Unable to load locations</p>
              <p className="mt-1 text-sm text-red-200/70">{error}</p>
              <p className="mt-2 text-xs text-red-200/50">Please check your connection and try again.</p>
            </div>
          </div>
        )}

        {!loading && !error && (
          <div className="mt-16 grid gap-10 lg:grid-cols-2">
            {locations.map((location, index) => {
              const padelCourts = padel ? courtsForLocation(courts, location.id, padel.id) : [];
              const footballCourts = football ? courtsForLocation(courts, location.id, football.id) : [];

              return (
                <article
                  key={location.id}
                  className={`reveal-${index === 0 ? 'left' : 'right'} overflow-hidden rounded-3xl border border-forest-glow/15 bg-forest-dark/30 transition-all duration-500 hover:border-forest-glow/30 hover:bg-forest-dark/45`}
                >
                  {/* Map embed */}
                  {location.google_maps_embed && (
                    <div className="overflow-hidden border-b border-forest-glow/10">
                      <iframe
                        src={location.google_maps_embed}
                        width="100%"
                        height="260"
                        style={{ border: 0 }}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        title={`${location.name} map`}
                        className="grayscale-[30%] contrast-110"
                      />
                    </div>
                  )}

                  <div className="p-6 lg:p-8">
                    {/* Location header */}
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-forest-glow/10 text-forest-glow">
                        <MapPin className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-display text-xl font-bold text-white">{location.name}</h3>
                        {location.address && (
                          <p className="mt-1 text-sm text-forest-soft/70">{location.address}</p>
                        )}
                      </div>
                    </div>

                    {/* Contact info */}
                    <div className="mt-5 space-y-3">
                      <div className="flex items-center gap-3">
                        <Clock className="h-4 w-4 shrink-0 text-forest-glow" />
                        <span className="text-sm text-white-soft/70">Open daily · Always open</span>
                      </div>
                      <a href={`mailto:${club.email}`} className="flex items-center gap-3 text-sm text-white-soft/70 transition-colors hover:text-forest-soft">
                        <Mail className="h-4 w-4 shrink-0 text-forest-glow" />
                        {club.email}
                      </a>
                      <a href={`tel:${club.phone}`} className="flex items-center gap-3 text-sm text-white-soft/70 transition-colors hover:text-forest-soft">
                        <Phone className="h-4 w-4 shrink-0 text-forest-glow" />
                        {club.phoneDisplay}
                      </a>
                    </div>

                    {/* Facilities */}
                    <div className="mt-6 space-y-4">
                      {padelCourts.length > 0 && (
                        <FacilityBlock
                          icon={<CircleDot className="h-4 w-4" />}
                          label="PADEL"
                          courts={padelCourts}
                        />
                      )}
                      {footballCourts.length > 0 && (
                        <FacilityBlock
                          icon={<Building2 className="h-4 w-4" />}
                          label="FOOTBALL"
                          courts={footballCourts}
                        />
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="mt-7 flex flex-col gap-3">
                      <button
                        onClick={() => openBooking({ locationId: location.id, sport: null })}
                        className="btn-shine flex w-full items-center justify-center gap-2 rounded-full bg-forest-glow px-6 py-3.5 text-sm font-bold text-forest-darkest transition-all duration-300 hover:bg-forest-soft hover:shadow-xl hover:shadow-forest-glow/25"
                      >
                        <Calendar className="h-4 w-4" /> BOOK NOW
                      </button>
                      <div className="grid grid-cols-2 gap-3">
                        {location.google_maps && (
                          <a
                            href={location.google_maps}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex w-full items-center justify-center gap-2 rounded-full border border-white/15 px-4 py-3 text-xs font-semibold text-white transition-all duration-300 hover:border-forest-glow/40 hover:bg-forest-glow/10"
                          >
                            <Navigation className="h-3.5 w-3.5" /> View on Google Maps
                          </a>
                        )}
                        <a
                          href={whatsappLink()}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex w-full items-center justify-center gap-2 rounded-full border border-white/15 px-4 py-3 text-xs font-semibold text-white transition-all duration-300 hover:border-forest-glow/40 hover:bg-forest-glow/10"
                        >
                          WhatsApp
                        </a>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {!loading && !error && locations.length === 0 && (
          <div className="mt-12 rounded-2xl border border-forest-glow/15 bg-forest-dark/20 p-8 text-center text-white-soft/50">
            No locations available at the moment.
          </div>
        )}
      </div>
    </section>
  );
}

function FacilityBlock({ icon, label, courts }: { icon: React.ReactNode; label: string; courts: Court[] }) {
  return (
    <div className="rounded-2xl border border-forest-glow/10 bg-forest-darkest/40 p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-forest-glow">{icon}</span>
        <span className="text-xs font-bold uppercase tracking-[0.2em] text-forest-soft/70">{label}</span>
      </div>
      <ul className="space-y-1.5">
        {courts.map((court) => {
          const isPink = court.special_marker === 'pink' || court.name.toLowerCase().includes('pink');
          return (
            <li key={court.id} className="flex items-center gap-2 text-sm text-white-soft/80">
              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${isPink ? 'bg-pink-400' : 'bg-forest-glow/60'}`} />
              <span>{court.name}</span>
              {isPink && (
                <span className="ml-1 rounded-full border border-pink-400/50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-pink-300">
                  Pink Court
                </span>
              )}
              {court.is_indoor && (
                <span className="ml-1 flex items-center gap-1 rounded-full border border-forest-glow/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-forest-glow">
                  <Home className="h-2.5 w-2.5" /> Indoor / Covered
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
