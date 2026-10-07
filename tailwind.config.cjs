/** @type {import('tailwindcss').Config} */

module.exports = {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      // Identidad «Azul noche y oro» (Design System Alejandro Rosales)
      colors: {
        marca: {
          noche: '#0A0E17',
          pizarra: '#111826',
          oro: '#E8B84B',
          'oro-tinta': '#8A6414',
          marfil: '#F4F6FB',
          niebla: '#9AA6BC',
          grafito: '#4A5568',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            a: {
              'text-decoration': 'none',
              'background-repeat': 'no-repeat',
              'background-size': '100% 1.5px',
              'background-position': '0 100%',
              'background-image':
                'linear-gradient(to right, rgb(var(--color-text-link)/1), rgb(var(--color-text-link)/1))',
              '&:hover': {
                color: 'rgb(var(--color-text-link))',
              },
            },
            'h1, h2, h3, h4, h5': {
              color: 'rgb(var(--color-text-heading))',
            },
            iframe: {
              'border-radius': '0.5rem',
            },
            code: {
              'background-color': 'rgb(var(--color-code-bg))',
              color: 'rgb(var(--color-code-text))',
              padding: '0.25rem 0.5rem',
              'border-radius': '0.25rem',
              'font-size': '0.875rem',
              'line-height': '1.5',
              'font-family': "Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace",
            },
            'ol > li::before': {
              color: 'rgb(var(--color-text-bold))',
            },
            li: {
              'margin-bottom': '0.5rem',
              'font-size': '1rem',
              'line-height': '1.5',
            },
            'code::before': {
              content: 'none',
            },
            'code::after': {
              content: 'none',
            },
            blockquote: {
              border: 'none',
              position: 'relative',
              width: '96%',
              margin: '0 auto',
              'font-size': '1.0625em',
              'padding-top': '1.5rem',
              'padding-bottom': '0.5rem',
              'padding-left': '1.5rem',
              'padding-right': '1.5rem',
            },
            'blockquote::before': {
              'font-family': 'Arial',
              content: "'“'",
              'font-size': '4em',
              color: 'rgb(var(--color-text-bold))',
              position: 'absolute',
              left: '-10px',
              top: '-10px',
            },
            'blockquote::after': {
              content: '',
            },
            'blockquote p:first-of-type::before': {
              content: '',
            },
            'blockquote p:last-of-type::after': {
              content: '',
            },
          },
        },
      }),
    },
  },
  plugins: [require('@tailwindcss/typography'), require('@tailwindcss/aspect-ratio')],
};
