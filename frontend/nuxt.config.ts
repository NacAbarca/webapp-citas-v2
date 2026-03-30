export default defineNuxtConfig({
  ssr: false,
  compatibilityDate: '2024-11-01',

  experimental: {
    appManifest: false,
  },

  css: ['bootstrap/dist/css/bootstrap.min.css'],

  app: {
    head: {
      title: 'WebApp Citas',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      ],
    },
  },

  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:3001/api',
    },
  },
})
