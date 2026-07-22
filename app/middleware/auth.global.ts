export default defineNuxtRouteMiddleware((to) => {
  if (import.meta.server) return

  const { session, hydrate } = useSession()
  hydrate()

  if (!session.value && to.path !== '/') {
    return navigateTo('/')
  }

  if (session.value && to.path === '/') {
    return navigateTo('/dashboard')
  }
})
