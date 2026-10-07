import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0c1015',
        panel: '#151b23',
        panel2: '#1b2430',
        line: '#2b3542',
        text: '#f5f7fa',
        muted: '#9da9b8',
        gold: '#e7b95f',
        gold2: '#f5d58e',
        green: '#5bd6a2',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'eq-1': {
          '0%, 100%': { height: '30%' },
          '50%': { height: '100%' },
        },
        'eq-2': {
          '0%, 100%': { height: '60%' },
          '50%': { height: '25%' },
        },
        'eq-3': {
          '0%, 100%': { height: '45%' },
          '50%': { height: '90%' },
        },
      },
      animation: {
        'eq-1': 'eq-1 0.9s ease-in-out infinite',
        'eq-2': 'eq-2 0.7s ease-in-out infinite',
        'eq-3': 'eq-3 1.1s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;