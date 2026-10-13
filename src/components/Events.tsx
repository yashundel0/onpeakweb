import { Trophy, Award, Building2, Users, Heart, ArrowRight } from 'lucide-react';
import { images, eventTypes, whatsappLink } from '@/data/clubData';

const iconMap: Record<string, typeof Trophy> = {
  Trophy,
  Award,
  Building2,
  Users,
  Heart,
};

export default function Events() {
  return (
    <section id="events" className="relative overflow-hidden bg-forest-darker py-24 lg:py-32">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src={images.trophy}
          alt={images.trophyAlt}
          className="h-full w-full object-cover opacity-15"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-forest-darker via-forest-darker/90 to-forest-darker" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        {/* Heading */}
        <div className="reveal text-center">
          <span className="text-sm font-semibold uppercase tracking-[0.3em] text-forest-soft/70">
            Beyond the Game
          </span>
          <h2 className="mt-4 font-display text-4xl font-extrabold text-white sm:text-5xl md:text-6xl">
            EVENTS & <span className="text-gradient-green">TOURNAMENTS</span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl font-display text-xl font-medium text-forest-soft">
            More than a game. It's an experience.
          </p>
        </div>

        {/* Event type cards */}
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {eventTypes.map((event, i) => {
            const Icon = iconMap[event.icon] || Trophy;
            return (
              <div
                key={event.title}
                className="reveal group flex flex-col items-center rounded-2xl border border-forest-glow/10 bg-forest-dark/40 p-8 text-center transition-all duration-400 hover:border-forest-glow/30 hover:bg-forest-dark/60"
                style={{ transitionDelay: `${i * 60}ms` }}
              >
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-forest-glow/10 text-forest-glow transition-all duration-300 group-hover:scale-110 group-hover:bg-forest-glow/20">
                  <Icon className="h-7 w-7" />
                </div>
                <h3 className="font-display text-base font-bold text-white">
                  {event.title}
                </h3>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="reveal mt-14 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <a
            href={whatsappLink("Hello OnPeak! I'd like to host an event at your venue.")}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-shine group flex items-center gap-3 rounded-full bg-forest-glow px-8 py-4 text-base font-bold text-forest-darkest transition-all duration-300 hover:bg-forest-soft hover:shadow-2xl hover:shadow-forest-glow/30"
          >
            HOST YOUR EVENT
            <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
          </a>
          <a
            href={whatsappLink("Hello OnPeak! I'd like to know more about tournaments.")}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-full border border-white/20 px-7 py-4 text-base font-semibold text-white transition-all duration-300 hover:border-forest-glow/40 hover:bg-forest-glow/10"
          >
            Ask on WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}
