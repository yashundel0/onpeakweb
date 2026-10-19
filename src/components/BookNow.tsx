import { Calendar, ArrowRight } from 'lucide-react';
import { images, club, whatsappLink } from '@/data/clubData';

export default function BookNow({ onBookFootball, onBookPadel }: { onBookFootball: () => void; onBookPadel: () => void }) {
  return (
    <section id="book" className="relative bg-forest-darkest py-24 lg:py-32">
      {/* Decorative top gradient */}
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-forest-darkest/80 to-transparent" />

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section heading */}
        <div className="reveal text-center">
          <span className="text-sm font-semibold uppercase tracking-[0.3em] text-forest-soft/70">
            Book Your Game
          </span>
          <h2 className="mt-4 font-display text-4xl font-extrabold text-white sm:text-5xl md:text-6xl">
            Choose Your <span className="text-gradient-green">Sport</span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-white-soft/60">
            Reserve your pitch or court in minutes. Easy booking, premium facilities,
            and an unmatched sporting atmosphere.
          </p>
        </div>

        {/* Cards */}
        <div className="mt-16 grid gap-8 md:grid-cols-2">
          {/* Football Card */}
          <div className="reveal-left group relative overflow-hidden rounded-3xl border border-forest-glow/15">
            <div className="img-zoom relative h-96 overflow-hidden">
              <img
                src={images.footballField}
                alt={images.footballFieldAlt}
                className="h-full w-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-forest-darkest via-forest-darkest/40 to-transparent" />
            </div>
            <div className="absolute inset-0 flex flex-col justify-end p-8 lg:p-10">
              <h3 className="font-display text-4xl font-extrabold text-white lg:text-5xl">
                FOOTBALL
              </h3>
              <p className="mt-3 max-w-md text-base text-white-soft/70">
                Book our football field for training, matches and private games.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={onBookFootball}
                  className="btn-shine group/btn flex items-center gap-2 rounded-full bg-forest-glow px-7 py-3.5 text-sm font-bold text-forest-darkest transition-all duration-300 hover:bg-forest-soft hover:shadow-xl hover:shadow-forest-glow/25"
                >
                  <Calendar className="h-4 w-4" />
                  BOOK FOOTBALL
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
                </button>
                <a
                  href={whatsappLink("Hello OnPeak! I'd like to book the football field.")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur-md transition-all duration-300 hover:border-forest-glow/40 hover:bg-forest-glow/10"
                >
                  WhatsApp
                </a>
              </div>
            </div>
          </div>

          {/* Padel Card */}
          <div className="reveal-right group relative overflow-hidden rounded-3xl border border-forest-glow/15">
            <div className="img-zoom relative h-96 overflow-hidden">
              <img
                src={images.padelCourt}
                alt={images.padelCourtAlt}
                className="h-full w-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-forest-darkest via-forest-darkest/40 to-transparent" />
            </div>
            <div className="absolute inset-0 flex flex-col justify-end p-8 lg:p-10">
              <h3 className="font-display text-4xl font-extrabold text-white lg:text-5xl">
                PADEL
              </h3>
              <p className="mt-3 max-w-md text-base text-white-soft/70">
                Book a padel court for casual games, training and competitive matches.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={onBookPadel}
                  className="btn-shine group/btn flex items-center gap-2 rounded-full bg-forest-glow px-7 py-3.5 text-sm font-bold text-forest-darkest transition-all duration-300 hover:bg-forest-soft hover:shadow-xl hover:shadow-forest-glow/25"
                >
                  <Calendar className="h-4 w-4" />
                  BOOK PADEL
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
                </button>
                <a
                  href={whatsappLink("Hello OnPeak! I'd like to book a padel court.")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur-md transition-all duration-300 hover:border-forest-glow/40 hover:bg-forest-glow/10"
                >
                  WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
