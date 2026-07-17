import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'media',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        approvals: { DEFAULT: '#2563eb', dark: '#3b82f6' },
        denials: { DEFAULT: '#d97706' }
      }
    }
  },
  plugins: []
};

export default config;