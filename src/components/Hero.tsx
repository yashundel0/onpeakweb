import { Calendar, ChevronDown } from 'lucide-react';
import { images, club, whatsappLink } from '@/data/clubData';

export default function Hero({ onBookFootball, onBookPadel }: { onBookFootball: () => void; onBookPadel: () => void }) {
  return (
    <section
      id="home"
      className="relative flex min-h-screen items-center justify-center overflow-hidden"
    >
      {/* Background image with Ken Burns effect */}
      <div className="absolute inset-0">
        <img
          src={images.hero}
          alt={images.heroAlt}
          className="h-full w-full object-cover animate-ken-burns"
          fetchPriority="high"
        />
        {/* Dark green gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-forest-darkest/70 via-forest-darkest/50 to-forest-darkest" />
        <div className="absolute inset-0 bg-gradient-to-r from-forest-darkest/80 via-transparent to-forest-darkest/40" />
      </div>

      {/* Grid overlay texture */}
      <div className="absolute inset-0 grid-overlay opacity-50" />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-7xl px-6 text-center lg:px-8">
        {/* Tag badge */}
        <div
          className="animate-fade-in-down mx-auto mb-8 inline-flex items-center gap-2 rounded-full border border-forest-glow/30 bg-forest-dark/40 px-5 py-2 backdrop-blur-md"
          style={{ animationDelay: '0.2s' }}
        >
          <span className="h-2 w-2 animate-pulse rounded-full bg-forest-glow" />
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-forest-soft">
            Premium Sports Club · Dubai
          </span>
        </div>

        {/* Main heading */}
        <h1
          className="animate-fade-in-up font-display text-6xl font-extrabold leading-[1.05] text-white text-shadow-lg sm:text-7xl md:text-8xl lg:text-9xl"
          style={{ animationDelay: '0.4s' }}
        >
          PLAY AT YOUR <span className="text-gradient-green">PEAK</span>
        </h1>

        {/* Subtitle */}
        <p
          className="animate-fade-in-up mt-6 font-display text-2xl font-medium text-forest-soft sm:text-3xl md:text-4xl"
          style={{ animationDelay: '0.6s' }}
        >
          Football & Padel in Dubai
        </p>

        {/* Description */}
        <p
          className="animate-fade-in-up mx-auto mt-6 max-w-2xl text-base text-white-soft/70 sm:text-lg"
          style={{ animationDelay: '0.8s' }}
        >
          {club.description}
        </p>

        {/* CTA Buttons */}
        <div
          className="animate-fade-in-up mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
          style={{ animationDelay: '1s' }}
        >
          <button
            onClick={onBookFootball}
            className="btn-shine group flex w-full items-center justify-center gap-3 rounded-full bg-forest-glow px-8 py-4 text-base font-bold text-forest-darkest transition-all duration-300 hover:bg-forest-soft hover:shadow-2xl hover:shadow-forest-glow/30 sm:w-auto"
          >
            <Calendar className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
            BOOK FOOTBALL
          </button>
          <button
            onClick={onBookPadel}
            className="btn-shine group flex w-full items-center justify-center gap-3 rounded-full border-2 border-white/20 bg-white/5 px-8 py-4 text-base font-bold text-white backdrop-blur-md transition-all duration-300 hover:border-forest-glow/50 hover:bg-forest-glow/10 hover:shadow-xl hover:shadow-forest-glow/20 sm:w-auto"
          >
            <Calendar className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
            BOOK PADEL
          </button>
        </div>

        {/* WhatsApp quick link */}
        <a
          href={whatsappLink()}
          target="_blank"
          rel="noopener noreferrer"
          className="animate-fade-in mt-6 inline-block text-sm font-medium text-forest-soft/80 underline-offset-4 transition-colors hover:text-forest-soft hover:underline"
          style={{ animationDelay: '1.2s' }}
        >
          or book via WhatsApp →
        </a>
      </div>

      {/* Scroll indicator */}
      <a
        href="#book"
        className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2 text-forest-soft/60 transition-colors hover:text-forest-soft"
        aria-label="Scroll down"
      >
        <span className="text-[10px] font-semibold uppercase tracking-[0.3em]">
          Scroll
        </span>
        <div className="flex h-10 w-6 items-start justify-center rounded-full border-2 border-forest-soft/30 p-1.5">
          <div className="h-1.5 w-1 animate-scroll-down rounded-full bg-forest-soft" />
        </div>
      </a>
    </section>
  );
}
