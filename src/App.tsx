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
import AdminApp from '@/components/admin/AdminApp';
import AdminLogin from '@/components/admin/AdminLogin';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { AuthProvider } from '@/context/AuthContext';
import { BookingProvider } from '@/context/BookingContext';
import { useRouter, isAdminRoute, navigate } from '@/lib/router';

type Overlay = 'none' | 'auth' | 'account';

function AppInner() {
  useScrollReveal();
  const path = useRouter();
  const [overlay, setOverlay] = useState<Overlay>('none');

  // Admin routes render as full-page views, separate from the public site
  if (isAdminRoute(path)) {
    if (path === '/admin/login') {
      return <AdminLogin />;
    }
    return <AdminApp />;
  }

  return (
    <div className="min-h-screen bg-forest-darkest">
      <Header
        onOpenAuth={() => setOverlay('auth')}
        onOpenAccount={() => setOverlay('account')}
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
        <MyAccount onClose={() => setOverlay('none')} onOpenAdmin={() => navigate('/admin')} />
      )}
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
