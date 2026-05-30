import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './hooks/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}', './store/**/*.{ts,tsx}', './types/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-up': 'fadeUp 0.38s cubic-bezier(0.22,1,0.36,1) both',
        'fade-left': 'fadeLeft 0.38s cubic-bezier(0.22,1,0.36,1) both',
        'fade-right': 'fadeRight 0.40s cubic-bezier(0.22,1,0.36,1) both',
        'scale-in': 'scaleIn 0.35s cubic-bezier(0.22,1,0.36,1) both',
        'pop-in': 'popIn 0.35s cubic-bezier(0.22,1,0.36,1) both',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite',
        'bell-swing': 'bellSwing 0.5s ease-out',
        'border-pulse': 'borderPulse 1.2s ease-in-out infinite',
        'gradient-shift': 'gradientShift 12s ease infinite',
      },
      transitionTimingFunction: {
        'expo-out': 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
};

export default config;
