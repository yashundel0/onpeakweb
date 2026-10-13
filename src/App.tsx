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

function App() {
  useScrollReveal();

  return (
    <div className="min-h-screen bg-forest-darkest">
      <Header />
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
    </div>
  );
}

export default App;
