/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      keyframes: {
        pop: {
          '0%': { transform: 'scale(1.6)', opacity: '0' },
          '30%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(0.9)', opacity: '0.85' },
        },
        pulseRec: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.35' } },
      },
      animation: {
        pop: 'pop 1s ease-out both',
        'pulse-rec': 'pulseRec 1.2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
