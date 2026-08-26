// tailwind.config.cjs
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // enable class-based dark mode
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './index.html',
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        "primary-foreground": 'var(--color-primary-foreground)',
        secondary: 'var(--color-secondary)',
        "secondary-foreground": 'var(--color-secondary-foreground)',
        destructive: 'var(--color-destructive)',
        "destructive-foreground": 'var(--color-destructive-foreground)',
        muted: 'var(--color-muted)',
        "muted-foreground": 'var(--color-muted-foreground)',
        accent: 'var(--color-accent)',
        "accent-foreground": 'var(--color-accent-foreground)',
        background: 'var(--color-background)',
        foreground: 'var(--color-foreground)',
        card: 'var(--color-card)',
        "card-foreground": 'var(--color-card-foreground)',
        popover: 'var(--color-popover)',
        "popover-foreground": 'var(--color-popover-foreground)',
        border: 'var(--color-border)',
        input: 'var(--color-input)',
        ring: 'var(--color-ring)',
        brand: {
          primary: 'var(--brand-primary)',
          accent: 'var(--brand-accent)',
          success: 'var(--brand-success)',
          warning: 'var(--brand-warning)',
          error: 'var(--brand-error)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('tailwindcss-animate'),
  ],
};
