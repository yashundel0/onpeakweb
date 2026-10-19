import { useState } from 'react';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import BookNow from '@/components/BookNow';
import Football from '@/components/Football';
import Padel from '@/components/Padel';
import Location from '@/components/Location';
import Gallery from '@/components/Gallery';
import Events from '@/components/Events';
import About from '@/components/About';
import Contact from '@/components/Contact';
import Footer from '@/components/Footer';
import WhatsAppButton from '@/components/WhatsAppButton';
import ErrorBoundary from '@/components/ErrorBoundary';
import BookingModal from '@/components/booking/BookingModal';
import AuthModal from '@/components/auth/AuthModal';
import MyAccount from '@/components/auth/MyAccount';
import AdminDashboard from '@/components/admin/AdminDashboard';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { AuthProvider } from '@/context/AuthContext';
import { BookingProvider } from '@/context/BookingContext';

type Overlay = 'none' | 'auth' | 'account' | 'admin';

function AppInner() {
  useScrollReveal();
  const [overlay, setOverlay] = useState<Overlay>('none');

  return (
    <div className="min-h-screen bg-forest-darkest">
      <Header
        onOpenAuth={() => setOverlay('auth')}
        onOpenAccount={() => setOverlay('account')}
        onOpenAdmin={() => setOverlay('admin')}
      />
      <main>
        <Hero />
        <BookNow />
        <Football />
        <Padel />
        <Location />
        <Gallery />
        <Events />
        <About />
        <Contact />
      </main>
      <Footer />
      <WhatsAppButton />

      <BookingModal />
      {overlay === 'auth' && <AuthModal onClose={() => setOverlay('none')} />}
      {overlay === 'account' && (
        <MyAccount onClose={() => setOverlay('none')} onOpenAdmin={() => setOverlay('admin')} />
      )}
      {overlay === 'admin' && <AdminDashboard onClose={() => setOverlay('none')} />}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BookingProvider>
          <AppInner />
        </BookingProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
