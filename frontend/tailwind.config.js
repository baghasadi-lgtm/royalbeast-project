/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#0a0a0a',
          light: '#262626',
          muted: '#525252',
        },
        surface: {
          DEFAULT: '#fafafa',
          dark: '#f5f5f5',
        },
        line: '#e5e5e5',
        muted: '#737373',
      },
      boxShadow: {
        soft: '0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
        card: '0 4px 24px -4px rgb(0 0 0 / 0.08)',
      },
      backgroundImage: {
        'gradient-elegant': 'linear-gradient(135deg, #0a0a0a 0%, #262626 50%, #404040 100%)',
        'gradient-subtle': 'linear-gradient(180deg, #fafafa 0%, #f5f5f5 100%)',
      },
    },
  },
  plugins: [],
};
