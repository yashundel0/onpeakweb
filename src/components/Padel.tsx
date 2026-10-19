import { Calendar, ArrowRight, Check } from 'lucide-react';
import { images, club, padelFeatures, whatsappLink } from '@/data/clubData';

export default function Padel({ onBookPadel }: { onBookPadel: () => void }) {
  return (
    <section id="padel" className="relative overflow-hidden bg-forest-darkest py-24 lg:py-32">
      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        {/* Two-column heading + image */}
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Left: text */}
          <div className="reveal-left">
            <span className="text-sm font-semibold uppercase tracking-[0.3em] text-forest-soft/70">
              The Courts
            </span>
            <h2 className="mt-4 font-display text-5xl font-extrabold text-white sm:text-6xl md:text-7xl">
              PADEL
            </h2>
            <p className="mt-4 font-display text-xl font-medium text-forest-soft sm:text-2xl">
              Play. Compete. Repeat.
            </p>
            <p className="mt-6 max-w-lg text-lg text-white-soft/60">
              Two premium padel courts built to professional standards. Whether you're
 here for a casual hit or a competitive match, OnPeak delivers the ultimate padel
 experience in Dubai.
            </p>

            {/* CTA */}
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <button
                onClick={onBookPadel}
                className="btn-shine group flex items-center gap-3 rounded-full bg-forest-glow px-8 py-4 text-base font-bold text-forest-darkest transition-all duration-300 hover:bg-forest-soft hover:shadow-2xl hover:shadow-forest-glow/30"
              >
                <Calendar className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
                BOOK PADEL
                <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
              </button>
              <a
                href={whatsappLink("Hello OnPeak! I'd like to book a padel court.")}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-full border border-white/20 px-7 py-4 text-base font-semibold text-white transition-all duration-300 hover:border-forest-glow/40 hover:bg-forest-glow/10"
              >
                Book via WhatsApp
              </a>
            </div>
          </div>

          {/* Right: image */}
          <div className="reveal-right relative">
            <div className="img-zoom overflow-hidden rounded-3xl border border-forest-glow/10">
              <img
                src={images.padelWide}
                alt={images.padelWideAlt}
                className="h-[420px] w-full object-cover lg:h-[520px]"
                loading="lazy"
              />
            </div>
            {/* Floating badge */}
            <div className="glass animate-float absolute -bottom-6 -left-4 rounded-2xl px-6 py-4 lg:-left-8">
              <p className="font-display text-3xl font-extrabold text-white">2</p>
              <p className="text-xs uppercase tracking-widest text-forest-soft/70">
                Premium Courts
              </p>
            </div>
          </div>
        </div>

        {/* Features grid */}
        <div className="mt-20 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {padelFeatures.map((feature, i) => (
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
      </div>
    </section>
  );
}
