// ============================================================
// ONPEAK SPORTS CLUB — Central Data
// All links, images, contacts and text live here for easy editing.
// ============================================================

export const club = {
  name: 'OnPeak Sports Club',
  shortName: 'OnPeak',
  tagline: 'Football & Padel in Dubai',
  city: 'Dubai, UAE',
  address: 'G19, 19B Street, Umm Suqeim 2, Jumeirah, Dubai',
  addressShort: '19B Street, Umm Suqeim 2, Dubai',
  email: 'info@onpeak.ae',
  phone: '+971586758477',
  phoneDisplay: '+971 58 675 8477',
  whatsapp: '971522679325',
  whatsappDisplay: '+971 52 267 9325',
  instagram: 'https://www.instagram.com/onpeak.ae',
  instagramHandle: '@onpeak.ae',
  googleMaps: 'https://maps.app.goo.gl/tsNBRZPM1dKWHw4g7?g_st=ic',
  googleMapsEmbed:
    'https://www.google.com/maps?q=25.15306143,55.20644029&z=16&output=embed',
  // Booking links — padel via Playtomic, football via Pitchbooking
  bookingPadel: 'https://playtomic.com/clubs/onpeak-padel-courts-jumeirah',
  bookingFootball: 'https://pitchbooking.com/partners/ONPEAK',
  whatsappMessage: "Hello OnPeak! I'd like to book a game.",
  description:
    'Premium sports facilities for football, padel, private games, events and tournaments.',
  about:
    'OnPeak is a premium sports destination in Dubai built for people who love the game. From football and padel sessions to tournaments and private events, we create a space where sport, competition and community come together.',
};

export const nav = [
  { label: 'Home', href: '#home' },
  { label: 'Football', href: '#football' },
  { label: 'Padel', href: '#padel' },
  { label: 'Location', href: '#location' },
  { label: 'Events', href: '#events' },
  { label: 'About', href: '#about' },
  { label: 'Contact', href: '#contact' },
];

// Club photos uploaded to public/assets/images. Replace these local paths when new club media is provided.
export const images = {
  hero: '/onpeakweb/assets/images/Изображение_PNG_2.png',
  heroAlt: ' padel court with a player under blue court lighting',
  footballField: '/onpeakweb/assets/images/Изображение_PNG_3.png',
  footballFieldAlt: 'Players competing on a football pitch at OnPeak',
  footballAction: '/onpeakweb/assets/images/Изображение_PNG_4.png',
  footballActionAlt: 'Player relaxing beside the football pitch at OnPeak',
  footballWide: '/onpeakweb/assets/images/Изображение_PNG_3.png',
  footballWideAlt: 'Football players competing on a green pitch',
  padelCourt: '/onpeakweb/assets/images/Изображение_PNG_2.png',
  padelCourtAlt 'OnPeak padel court with a player ready to play',
  padelAction: '/onpeakweb/assets/images/Изображение_PNG_5.png',
  padelActionAlt: 'Padel player moving across the blue court at OnPeak',
  padelWide: '/onpeakweb/assets/images/Изображение_PNG_5.png',
  padelWideAlt: 'Padel player in action inside the OnPeak court',
  lounge: '/onpeakweb/assets/images/Изображение_PNG_4.png',
  loungeAlt: 'Player enjoying the atmosphere beside the OnPeak pitch',
  cafe: '/onpeakweb/assets/images/Изображение_PNG_6.png',
  cafeAlt: ' Padel rackets and ball at OnPeak',
  dubaiSkyline: '/onpeakweb/assets/images/Изображение_PNG_4.png',
  dubaiSkylineAlt: 'OnPeak player beside the club pitch',
  trophy: '/onpeakweb/assets/images/Изображение_PNG_3.png',
  trophyAlt: 'Football players competing on the OnPeak pitch',
  footballPlayer: '/onpeakweb/assets/images/Изображение_PNG_3.png',
  footballPlayerAlt: 'Football players competing on the OnPeak pitch',
};

export const galleryImages = [
  {
    src: '/onpeakweb/assets/images/Изображение_PNG_2.png',
    alt: 'OnPeak padel court with a player under blue lighting',
    span: 'row-span-2',
  },
  {
    src: '/onpeakweb/assets/images/Изображение_PNG_3.png',
    alt: 'Football players competing on the OnPeak pitch',
    span: '',
  },
  {
    src: '/onpeakweb/assets/images/Изображение_PNG_4.png',
    alt: 'Player relaxing beside the OnPeak football pitch',
    span: '',
  },
  {
    src: '/onpeakweb/assets/images/Изображение_PNG_5.png',
    alt: 'Padel player in action inside the OnPeak court',
    span: '',
  },
  {
    src: '/onpeakweb/assets/images/Изображение_PNG_3.png',
    alt: 'Football game at OnPeak',
    span: 'row-span-2',
  },
  {
    src: '/onpeakweb/assets/images/Изображение_PNG_5.png',
    alt: 'Padel court action at OnPeak',
    span: '',
  },
  {
    src: '/onpeakweb/assets/images/Изображение_PNG_6.png',
    alt: 'Padel rackets and ball at OnPeak',
    span: '',
  },
  {
    src: '/onpeakweb/assets/images/Изображение_PNG_4.png',
    alt: 'OnPeak club atmosphere beside the pitch',
    span: '',
  },
];

export const footballFeatures = [
  { title: 'Private Games', desc: 'Book the pitch for your friends and private matches.' },
  { title: 'Football Training', desc: 'Professional coaching and skill development sessions.' },
  { title: 'Team Sessions', desc: 'Train together, play together, win together.' },
  { title: 'Academy Training', desc: 'Structured programs for young developing players.' },
  { title: 'Tournaments', desc: 'Compete in organized football tournaments.' },
  { title: 'Corporate Games', desc: 'Company matches and team-building on the pitch.' },
];

export const padelFeatures = [
  { title: 'Premium Padel Courts', desc: 'High-quality courts built to professional standards.' },
  { title: 'Easy Booking', desc: 'Book your court in minutes via Playtomic or WhatsApp.' },
  { title: 'Private Games', desc: 'Reserve a court for your private padel sessions.' },
  { title: 'Training', desc: 'Lessons, semi-private and group coaching available.' },
  { title: 'Tournaments', desc: 'Join competitive padel tournaments and ladder play.' },
  { title: 'Corporate Sessions', desc: 'Corporate bookings for team padel events.' },
];

export const eventTypes = [
  { title: 'Football Tournaments', icon: 'Trophy' },
  { title: 'Padel Tournaments', icon: 'Award' },
  { title: 'Corporate Events', icon: 'Building2' },
  { title: 'Private Events', icon: 'Users' },
  { title: 'Community Events', icon: 'Heart' },
];

export const stats = [
  { value: 2, label: 'Padel Courts', suffix: '' },
  { value: 1, label: 'Football Pitch', suffix: '' },
  { value: 7, label: 'Days a Week', suffix: '' },
  { value: 100, label: 'Premium Experience', suffix: '%' },
];

export function whatsappLink(message?: string) {
  const text = encodeURIComponent(message || club.whatsappMessage);
  return `https://wa.me/${club.whatsapp}?text=${text}`;
}
