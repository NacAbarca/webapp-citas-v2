export default defineNuxtPlugin(async () => {
  const bootstrap = await import('bootstrap')
  return { provide: { bootstrap } }
})
