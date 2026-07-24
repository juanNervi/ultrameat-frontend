// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  ssr: false,
  modules: ['@nuxtjs/tailwindcss'],
  tailwindcss: {
    cssPath: '~/assets/css/main.css',
    configPath: 'tailwind.config.js',
  },
  future: {
    compatibilityVersion: 4,
  },
  // GitHub Pages project site: https://juanNervi.github.io/ultrameat-frontend/
  // Locally stays "/" unless NUXT_APP_BASE_URL is set.
  app: {
    baseURL: process.env.NUXT_APP_BASE_URL || '/',
    head: {
      title: 'Ultra Meat — TERMILCO SAS',
      htmlAttrs: { lang: 'es' },
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: 'favicon.svg' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700;800&family=Source+Sans+3:wght@400;500;600;700&display=swap',
        },
      ],
      meta: [
        {
          name: 'description',
          content: 'Demo Ultra Meat — indicadores de venta, crédito y exportación contable',
        },
      ],
    },
  },
  nitro: {
    preset: 'github-pages',
    prerender: {
      routes: ['/', '/dashboard', '/canales', '/productos', '/stock', '/carga', '/exportacion'],
      crawlLinks: true,
    },
  },
})
