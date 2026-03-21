import type { Config } from 'tailwindcss';

const config: Config = {
  theme: {
    extend: {
      colors: {
        bg: '#F4F2EE',
        white: '#FDFCFA',
        ink: '#1A1714',
        orange: '#E05C1A',
        'orange-bg': '#FDF0E8',
        steel: '#3B4B5C',
        'steel-bg': '#EBF0F5',
        rule: '#DDD9D2',
        'text-1': '#1A1714',
        'text-2': '#5C574F',
        'text-3': '#A8A39A',
      },
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
    },
  },
};

export default config;
