/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{js,jsx,ts,tsx}',
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        morado: '#925ffa',
        gris: '#9D9D9D',
        negro: '#292929',
        black1: '#0C0C0C',
        black2: '#191919',
        black3: '#1C1D1F'
      },
    },
  },
  darkMode: 'class',
  plugins: [
    function ({ addBase }) {
      addBase({
        '.dark': {
          'text-color': '#9D9D9D',
        },
      });
    },
  ],
};
