/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/app/**/*.{js,jsx}',
    './src/components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: '#10241E',
        paper: '#F6F5EF',
        paperdark: '#0D1613',
        teal: {
          DEFAULT: '#1B6B5B',
          50: '#EAF3F1',
          100: '#CFE6E0',
          400: '#2E8C77',
          500: '#1B6B5B',
          600: '#155448',
          700: '#0F3D35',
        },
        amber: {
          DEFAULT: '#E0A339',
          100: '#FBEACB',
          500: '#E0A339',
          600: '#B9832A',
        },
        coral: {
          DEFAULT: '#D9634A',
          100: '#F8DCD3',
          500: '#D9634A',
          600: '#B84E38',
        },
        mist: '#DCE6DE',
        mistdark: '#1C2C26',
      },
      fontFamily: {
        display: ['var(--font-sora)', 'sans-serif'],
        body: ['var(--font-inter)', 'sans-serif'],
        mono: ['var(--font-plex-mono)', 'monospace'],
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.25rem',
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,36,30,0.06), 0 4px 16px rgba(16,36,30,0.05)',
      },
    },
  },
  plugins: [],
};
