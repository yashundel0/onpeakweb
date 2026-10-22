/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          deepest: '#0a1410',
          deep:    '#0f1f18',
          rich:    '#1a3328',
          mid:     '#2a4d3c',
          accent:  '#3d8f66',
          light:   '#52b882',
          cream:   '#e8e5d0',
          'cream-dim': '#c5c2aa',
        },
      },
      fontFamily: {
        display: ['Outfit', 'sans-serif'],
        body:    ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
