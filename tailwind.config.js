/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Design-system tokens as alpha-aware RGB so `/opacity` modifiers work.
        bg: 'rgb(var(--rgb-background) / <alpha-value>)',
        fg: 'rgb(var(--rgb-foreground) / <alpha-value>)',
        card: 'rgb(var(--rgb-card) / <alpha-value>)',
        'card-fg': 'rgb(var(--rgb-card-foreground) / <alpha-value>)',
        muted: 'rgb(var(--rgb-muted) / <alpha-value>)',
        'muted-fg': 'rgb(var(--rgb-muted-foreground) / <alpha-value>)',
        border: 'var(--color-border)',
        primary: 'rgb(var(--rgb-primary) / <alpha-value>)',
        'primary-fg': 'rgb(var(--rgb-on-primary) / <alpha-value>)',
        accent: 'rgb(var(--rgb-accent) / <alpha-value>)',
        'accent-fg': 'rgb(var(--rgb-on-accent) / <alpha-value>)',
        destructive: 'rgb(var(--rgb-destructive) / <alpha-value>)',
        'destructive-fg': 'rgb(var(--rgb-on-destructive) / <alpha-value>)',
        warning: 'rgb(var(--rgb-warning) / <alpha-value>)',
        ring: 'rgb(var(--rgb-ring) / <alpha-value>)',
      },
      fontFamily: {
        heading: ['Lexend', 'system-ui', 'sans-serif'],
        body: ['"Source Sans 3"', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        lg: '0.75rem',
      },
      maxWidth: {
        content: '72rem',
      },
    },
  },
  plugins: [],
}
