/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#F8F6F4',
        surface: '#FFFFFF',
        primary: '#844D3B',
        'primary-light': '#D48C70',
        'primary-dark': '#5E3426',
        secondary: '#1A1A1A',
        tertiary: '#C87D65',
        border: '#EAE4DC',
        success: '#1E824C',
        danger: '#C0392B',
      },
      borderRadius: {
        card: '18px',
      },
    },
  },
  plugins: [],
};
