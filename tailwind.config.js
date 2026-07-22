module.exports = {
  content: [
    './app/**/*.{js,vue,ts}',
    './components/**/*.{js,vue,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './nuxt.config.{js,ts}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#00438e',
          deep: '#002f66',
        },
        steel: {
          DEFAULT: '#a6aec6',
          dark: '#7d879e',
        },
        cream: {
          DEFAULT: '#f7f4ef',
          dark: '#ebe6dc',
        },
        alert: {
          DEFAULT: '#e85d04',
          soft: '#fff0e6',
        },
        ok: {
          DEFAULT: '#1a7a4c',
          soft: '#e8f5ee',
        },
        warn: {
          DEFAULT: '#c47a00',
          soft: '#fff8e6',
        },
        ink: '#1a1a1a',
        muted: '#5c6570',
      },
      fontFamily: {
        display: ['Outfit', 'system-ui', 'sans-serif'],
        sans: ['Source Sans 3', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
