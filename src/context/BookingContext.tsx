import { createContext, useContext, useState, ReactNode } from 'react';

export type SportPreset = 'padel' | 'football' | null;

interface BookingPreset {
  locationId?: string;
  sport: SportPreset;
}

interface BookingContextValue {
  isOpen: boolean;
  preset: BookingPreset;
  openBooking: (preset?: BookingPreset) => void;
  closeBooking: () => void;
}

const BookingContext = createContext<BookingContextValue | undefined>(undefined);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [preset, setPreset] = useState<BookingPreset>({ sport: null });

  const openBooking = (p: BookingPreset = { sport: null }) => {
    setPreset(p);
    setIsOpen(true);
  };
  const closeBooking = () => setIsOpen(false);

  return (
    <BookingContext.Provider value={{ isOpen, preset, openBooking, closeBooking }}>
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error('useBooking must be used within BookingProvider');
  return ctx;
}
