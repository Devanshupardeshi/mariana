import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        void: '#0b0b0b',
        biolume: '#6366f1',
        hydrothermal: '#d4af7a',
      },
      fontFamily: {
        alto: ['var(--font-alto)', 'var(--font-serif)', 'Georgia', 'serif'],
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      letterSpacing: {
        telemetry: '0.25em',
        wide2: '0.18em',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'in-out-quint': 'cubic-bezier(0.83, 0, 0.17, 1)',
        'descent': 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      screens: {
        xs: '420px',
        '3xl': '1920px',
      },
    },
  },
  plugins: [],
};

export default config;
