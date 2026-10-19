import { useEffect } from 'react';

/**
 * Reveals elements marked with reveal/reveal-left/reveal-right/reveal-scale
 * when they enter the viewport. Adds multiple safety fallbacks so content
 * is never left permanently invisible, even in Safari where
 * IntersectionObserver may fire late or not at all for dynamically
 * inserted elements.
 */
export function useScrollReveal() {
  useEffect(() => {
    const selector = '.reveal, .reveal-left, .reveal-right, .reveal-scale';
    const forceReveal = (el: HTMLElement) => el.classList.add('revealed');

    const revealAll = () => {
      document.querySelectorAll<HTMLElement>(selector).forEach((el) => {
        if (!el.classList.contains('revealed')) forceReveal(el);
      });
    };

    const revealVisible = () => {
      document.querySelectorAll<HTMLElement>(selector).forEach((el) => {
        if (el.classList.contains('revealed')) return;
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          forceReveal(el);
        }
      });
    };

    if (typeof IntersectionObserver === 'undefined') {
      revealAll();
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

    const observeAll = () => {
      document.querySelectorAll<HTMLElement>(selector).forEach((el) => {
        if (!el.classList.contains('revealed')) observer.observe(el);
      });
    };

    observeAll();

    // Fallback 1: reveal anything visible after 1.5s
    const t1 = window.setTimeout(revealVisible, 1500);

    // Fallback 2: reveal everything after 3s regardless of viewport position
    const t2 = window.setTimeout(revealAll, 3000);

    // Watch for dynamically inserted elements (modal content, async data render)
    const mutationObserver = new MutationObserver(() => {
      observeAll();
      revealVisible();
    });
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    // Reveal on scroll/resize for elements that entered viewport without observer firing
    const onScroll = () => revealVisible();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);
}
