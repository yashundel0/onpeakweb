import { useState, useEffect, useCallback } from 'react';
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
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { useAuth } from '@/hooks/useAuth';
import AuthModal from '@/components/auth/AuthModal';
import BookingFlow from '@/components/booking/BookingFlow';
import MyBookings from '@/components/booking/MyBookings';
import AdminDashboard from '@/components/admin/AdminDashboard';

type View = 'home' | 'booking' | 'mybookings' | 'admin';

function App() {
  useScrollReveal();
  const { user, isAdmin } = useAuth();
  const [view, setView] = useState<View>('home');
  const [preselectedSport, setPreselectedSport] = useState<'padel' | 'football' | undefined>(undefined);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  const navigate = useCallback((newView: View, sport?: 'padel' | 'football') => {
    setPreselectedSport(sport);
    setView(newView);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const openBooking = useCallback((sport?: 'padel' | 'football') => {
    navigate('booking', sport);
  }, [navigate]);

  const openAuth = useCallback((mode: 'signin' | 'signup') => {
    setAuthMode(mode);
    setAuthOpen(true);
  }, []);

  // Expose navigation globally so existing components can trigger booking without prop drilling
  useEffect(() => {
    (window as any).__onpeakNavigate = (newView: View, sport?: 'padel' | 'football') => navigate(newView, sport);
    (window as any).__onpeakOpenBooking = (sport?: 'padel' | 'football') => openBooking(sport);
    (window as any).__onpeakOpenAuth = (mode: 'signin' | 'signup') => openAuth(mode);
    return () => {
      delete (window as any).__onpeakNavigate;
      delete (window as any).__onpeakOpenBooking;
      delete (window as any).__onpeakOpenAuth;
    };
  }, [navigate, openBooking, openAuth]);

  // Listen for hash changes to switch to booking view
  useEffect(() => {
    const checkHash = () => {
      const hash = window.location.hash;
      if (hash === '#book-court' || hash === '#booking') {
        navigate('booking');
      }
    };
    checkHash();
    window.addEventListener('hashchange', checkHash);
    return () => window.removeEventListener('hashchange', checkHash);
  }, [navigate]);

  if (view === 'admin' && !isAdmin) {
    setView('home');
  }

  return (
    <div className="min-h-screen bg-forest-darkest">
      <Header
        onBookNow={() => openBooking()}
        onMyBookings={() => navigate('mybookings')}
        onAdmin={() => navigate('admin')}
        onSignIn={() => openAuth('signin')}
        onSignUp={() => openAuth('signup')}
        view={view}
        onHome={() => navigate('home')}
      />

      {view === 'booking' && (
        <BookingFlow
          preselectedSport={preselectedSport}
          onClose={() => navigate('home')}
        />
      )}

      {view === 'mybookings' && user && (
        <MyBookings onClose={() => navigate('home')} />
      )}

      {view === 'admin' && isAdmin && (
        <AdminDashboard onClose={() => navigate('home')} />
      )}

      {view === 'home' && (
        <main>
          <Hero onBookFootball={() => openBooking('football')} onBookPadel={() => openBooking('padel')} />
          <BookNow onBookFootball={() => openBooking('football')} onBookPadel={() => openBooking('padel')} />
          <Football onBookFootball={() => openBooking('football')} />
          <Padel onBookPadel={() => openBooking('padel')} />
          <Location />
          <Gallery />
          <Events />
          <About />
          <Contact onBookFootball={() => openBooking('football')} onBookPadel={() => openBooking('padel')} />
        </main>
      )}

      <Footer onBookFootball={() => openBooking('football')} onBookPadel={() => openBooking('padel')} />

      {view === 'home' && <WhatsAppButton />}

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} initialMode={authMode} />
    </div>
  );
}

export default App;
