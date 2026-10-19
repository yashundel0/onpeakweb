import { useEffect } from 'react';

/**
 * Reveals elements marked with reveal/reveal-left/reveal-right/reveal-scale
 * when they enter the viewport. Adds a safety fallback so that, even if
 * IntersectionObserver never fires (older browser, hidden tab, rAF stall),
 * content is never left permanently invisible.
 */
export function useScrollReveal() {
  useEffect(() => {
    const selector = '.reveal, .reveal-left, .reveal-right, .reveal-scale';
    const elements = Array.from(document.querySelectorAll<HTMLElement>(selector));

    if (elements.length === 0) return;

    // Safety net: if the observer hasn't revealed an element within a short
    // window of becoming visible, force-reveal it so the page is never blank.
    const forceReveal = (el: HTMLElement) => el.classList.add('revealed');

    if (typeof IntersectionObserver === 'undefined') {
      elements.forEach(forceReveal);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    );

    elements.forEach((el) => observer.observe(el));

    // Fallback: reveal anything still hidden after 1.2s (covers off-screen
    // above-the-fold content that the observer may have missed on mount).
    const fallbackTimer = window.setTimeout(() => {
      elements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (
          rect.top < window.innerHeight &&
          rect.bottom > 0 &&
          !el.classList.contains('revealed')
        ) {
          forceReveal(el);
        }
      });
    }, 1200);

    return () => {
      observer.disconnect();
      window.clearTimeout(fallbackTimer);
    };
  }, []);
}
