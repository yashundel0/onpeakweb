import { images, club, stats } from '@/data/clubData';
import { useEffect, useRef, useState } from 'react';

function AnimatedCounter({ value, suffix }: { value: number; suffix: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const duration = 1500;
          const steps = 60;
          const increment = value / steps;
          let current = 0;
          const interval = setInterval(() => {
            current += increment;
            if (current >= value) {
              setCount(value);
              clearInterval(interval);
            } else {
              setCount(Math.floor(current));
            }
          }, duration / steps);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value]);

  return (
    <span ref={ref}>
      {count}
      {suffix}
    </span>
  );
}

export default function About() {
  return (
    <section id="about" className="relative bg-forest-darkest py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          {/* Image side */}
          <div className="reveal-left relative">
            <div className="img-zoom overflow-hidden rounded-3xl border border-forest-glow/10">
              <img
                src={images.lounge}
                alt={images.loungeAlt}
                className="h-[480px] w-full object-cover"
                loading="lazy"
              />
            </div>
            {/* Floating stats card */}
            <div className="glass absolute -bottom-8 -right-4 rounded-2xl px-6 py-5 lg:-right-8">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-forest-glow/15 text-forest-glow">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 22h14M5 2h14M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" />
                  </svg>
                </div>
                <div>
                  <p className="font-display text-lg font-bold text-white">Premium</p>
                  <p className="text-xs text-forest-soft/70">Experience</p>
                </div>
              </div>
            </div>
          </div>

          {/* Text side */}
          <div className="reveal-right">
            <span className="text-sm font-semibold uppercase tracking-[0.3em] text-forest-soft/70">
              About OnPeak
            </span>
            <h2 className="mt-4 font-display text-4xl font-extrabold text-white sm:text-5xl">
              BUILT FOR THE <span className="text-gradient-green">GAME</span>
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-white-soft/70">
              {club.about}
            </p>

            {/* Stats */}
            <div className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <p className="font-display text-4xl font-extrabold text-gradient-green">
                    <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-widest text-white-soft/50">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
