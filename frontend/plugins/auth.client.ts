export default defineNuxtPlugin(async () => {
  try {
    const { init } = useAuth()
    await init()
  } catch {
    // init() ya silencia errores, este catch es defensa extra
    // para que nunca rompa el boot de Nuxt
  }
})
