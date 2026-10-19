import { Calendar, ArrowRight, Check } from 'lucide-react';
import { images, club, footballFeatures, whatsappLink } from '@/data/clubData';

export default function Football({ onBookFootball }: { onBookFootball: () => void }) {
  return (
    <section id="football" className="relative overflow-hidden bg-forest-darker py-24 lg:py-32">
      {/* Subtle pattern */}
      <div className="absolute inset-0 grid-overlay opacity-30" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        {/* Heading */}
        <div className="reveal max-w-3xl">
          <span className="text-sm font-semibold uppercase tracking-[0.3em] text-forest-soft/70">
            The Pitch
          </span>
          <h2 className="mt-4 font-display text-5xl font-extrabold text-white sm:text-6xl md:text-7xl">
            FOOTBALL
          </h2>
          <p className="mt-4 font-display text-xl font-medium text-forest-soft sm:text-2xl">
            Your game. Your team. Your pitch.
          </p>
        </div>

        {/* Full-width image card */}
        <div className="reveal-scale mt-12 overflow-hidden rounded-3xl border border-forest-glow/10">
          <div className="img-zoom relative h-[400px] overflow-hidden lg:h-[500px]">
            <img
              src={images.footballWide}
              alt={images.footballWideAlt}
              className="h-full w-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-forest-darkest/80 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-8 lg:p-12">
              <p className="max-w-xl text-lg text-white-soft/80">
                A full-size pitch built to the highest standards, under the lights
                and the Dubai sky. Train, compete, and play at your peak.
              </p>
            </div>
          </div>
        </div>

        {/* Features grid */}
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {footballFeatures.map((feature, i) => (
            <div
              key={feature.title}
              className="reveal group rounded-2xl border border-forest-glow/10 bg-forest-dark/30 p-7 transition-all duration-400 hover:border-forest-glow/30 hover:bg-forest-dark/50"
              style={{ transitionDelay: `${i * 50}ms` }}
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-forest-glow/10 text-forest-glow transition-all duration-300 group-hover:bg-forest-glow/20 group-hover:scale-110">
                <Check className="h-5 w-5" />
              </div>
              <h3 className="font-display text-lg font-bold text-white">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm text-white-soft/60">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="reveal mt-12 flex flex-col items-center gap-4 sm:flex-row">
          <button
            onClick={onBookFootball}
            className="btn-shine group flex items-center gap-3 rounded-full bg-forest-glow px-8 py-4 text-base font-bold text-forest-darkest transition-all duration-300 hover:bg-forest-soft hover:shadow-2xl hover:shadow-forest-glow/30"
          >
            <Calendar className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
            BOOK FOOTBALL
            <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
          </button>
          <a
            href={whatsappLink("Hello OnPeak! I'd like to book the football field.")}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-full border border-white/20 px-7 py-4 text-base font-semibold text-white transition-all duration-300 hover:border-forest-glow/40 hover:bg-forest-glow/10"
          >
            Book via WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}
