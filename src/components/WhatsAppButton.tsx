import { useEffect, useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { whatsappLink, club } from '@/data/clubData';

export default function WhatsAppButton() {
  const [visible, setVisible] = useState(false);
  const [tooltipOpen, setTooltipOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => setTooltipOpen(true), 1500);
    const closeTimer = setTimeout(() => setTooltipOpen(false), 6000);
    return () => {
      clearTimeout(timer);
      clearTimeout(closeTimer);
    };
  }, [visible]);

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 transition-all duration-500 ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'
      }`}
    >
      {/* Tooltip bubble */}
      {tooltipOpen && (
        <div className="animate-fade-in relative max-w-[240px] rounded-2xl rounded-br-sm border border-forest-glow/20 bg-forest-dark px-4 py-3 shadow-2xl backdrop-blur-md">
          <button
            className="absolute -left-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-forest-darker text-white-soft/60 hover:text-white"
            onClick={() => setTooltipOpen(false)}
            aria-label="Close tooltip"
          >
            <X className="h-3.5 w-3.5" />
          </button>
          <p className="text-sm font-medium text-white">
            Book your game on WhatsApp
          </p>
          <p className="mt-0.5 text-xs text-white-soft/50">
            {club.whatsappDisplay}
          </p>
        </div>
      )}

      {/* Button */}
      <a
        href={whatsappLink()}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] shadow-lg shadow-[#25D366]/30 transition-all duration-300 hover:scale-110 hover:shadow-xl hover:shadow-[#25D366]/40"
        aria-label="Contact us on WhatsApp"
        onMouseEnter={() => setTooltipOpen(true)}
      >
        <MessageCircle className="h-7 w-7 text-white" />
        <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-[#25D366]/30" style={{ animationDuration: '2s' }} />
      </a>
    </div>
  );
}
