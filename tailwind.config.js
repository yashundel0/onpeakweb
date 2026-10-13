/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        /* Official OnPeak brand palette — from logo */
        brand: {
          deepest: '#0f1f18',
          deep:    '#1a3328',
          rich:    '#1e3d30',
          mid:     '#2a4d3c',
          accent:  '#3d8f66',
          light:   '#52b882',
          cream:   '#e8e5d0',
          'cream-dim': '#c5c2aa',
        },
        /* Used throughout components for body/secondary text on dark bg */
        'white-soft': '#e8e5d0',
        'white-dim':  '#c5c2aa',
        /* Legacy aliases kept for existing components */
        forest: {
          darkest: '#0f1f18',
          darker:  '#1a3328',
          dark:    '#1e3d30',
          medium:  '#2a4d3c',
          light:   '#3d8f66',
          accent:  '#3d8f66',
          glow:    '#3d8f66',
          soft:    '#52b882',
        },
      },
      fontFamily: {
        display: ['Outfit', 'sans-serif'],
        body:    ['Inter', 'sans-serif'],
      },
      animation: {
        'fade-in':    'fadeIn 0.8s ease-out forwards',
        'fade-in-up': 'fadeInUp 0.8s ease-out forwards',
        'ken-burns':  'kenBurns 20s ease-out forwards',
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
        'float':      'float 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
