/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        void: '#0B0B0D',      // near-black background
        surface: '#16161A',   // card surface
        surface2: '#1D1D22',
        marquee: '#E8A33D',   // amber marquee-bulb gold — primary accent
        velvet: '#7A1F2B',    // curtain red — secondary accent
        bone: '#F2EFE9',      // warm off-white text
        muted: '#8B8A8F',
      },
      fontFamily: {
        display: ['var(--font-display)'],
        body: ['var(--font-body)'],
      },
    },
  },
  plugins: [],
};
