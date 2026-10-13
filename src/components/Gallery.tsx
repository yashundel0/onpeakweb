import { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { galleryImages } from '@/data/clubData';

export default function Gallery() {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const closeLightbox = useCallback(() => setLightboxIndex(null), []);

  const nextImage = useCallback(() => {
    setLightboxIndex((prev) =>
      prev === null ? 0 : (prev + 1) % galleryImages.length
    );
  }, []);

  const prevImage = useCallback(() => {
    setLightboxIndex((prev) =>
      prev === null ? 0 : (prev - 1 + galleryImages.length) % galleryImages.length
    );
  }, []);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'ArrowLeft') prevImage();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [lightboxIndex, closeLightbox, nextImage, prevImage]);

  return (
    <section id="gallery" className="relative bg-forest-darkest py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Heading */}
        <div className="reveal text-center">
          <span className="text-sm font-semibold uppercase tracking-[0.3em] text-forest-soft/70">
            Gallery
          </span>
          <h2 className="mt-4 font-display text-4xl font-extrabold text-white sm:text-5xl md:text-6xl">
            INSIDE <span className="text-gradient-green">ONPEAK</span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-white-soft/60">
            A glimpse into the OnPeak experience — courts, pitches, and the energy of the game.
          </p>
        </div>

        {/* Masonry Grid */}
        <div className="mt-14 grid auto-rows-[200px] grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {galleryImages.map((img, i) => (
            <div
              key={i}
              className={`reveal-scale group relative cursor-pointer overflow-hidden rounded-2xl border border-forest-glow/10 ${img.span}`}
              style={{ transitionDelay: `${i * 60}ms` }}
              onClick={() => setLightboxIndex(i)}
            >
              <img
                src={img.src}
                alt={img.alt}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-forest-darkest/80 via-transparent to-transparent opacity-0 transition-opacity duration-400 group-hover:opacity-100" />
              <div className="absolute bottom-0 left-0 right-0 translate-y-4 p-4 opacity-0 transition-all duration-400 group-hover:translate-y-0 group-hover:opacity-100">
                <p className="text-xs font-medium text-white-soft/90">{img.alt}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-forest-darkest/95 backdrop-blur-md"
          onClick={closeLightbox}
        >
          {/* Close */}
          <button
            className="absolute right-6 top-6 z-10 flex h-12 w-12 items-center justify-center rounded-full border border-white/15 text-white transition-all hover:border-forest-glow/50 hover:bg-forest-glow/10"
            onClick={closeLightbox}
            aria-label="Close"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Prev */}
          <button
            className="absolute left-4 z-10 flex h-12 w-12 items-center justify-center rounded-full border border-white/15 text-white transition-all hover:border-forest-glow/50 hover:bg-forest-glow/10 lg:left-8"
            onClick={(e) => {
              e.stopPropagation();
              prevImage();
            }}
            aria-label="Previous"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          {/* Next */}
          <button
            className="absolute right-4 z-10 flex h-12 w-12 items-center justify-center rounded-full border border-white/15 text-white transition-all hover:border-forest-glow/50 hover:bg-forest-glow/10 lg:right-8"
            onClick={(e) => {
              e.stopPropagation();
              nextImage();
            }}
            aria-label="Next"
          >
            <ChevronRight className="h-6 w-6" />
          </button>

          {/* Image */}
          <div
            className="animate-fade-in-scale max-w-5xl px-16"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={galleryImages[lightboxIndex].src}
              alt={galleryImages[lightboxIndex].alt}
              className="max-h-[80vh] w-full rounded-2xl object-contain"
            />
            <p className="mt-4 text-center text-sm text-white-soft/60">
              {galleryImages[lightboxIndex].alt}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
