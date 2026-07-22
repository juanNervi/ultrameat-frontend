import type { Session } from '~/types'

const SESSION_KEY = 'ultrameat-session'

export function useSession() {
  const session = useState<Session | null>('session', () => null)
  const ready = useState('session-ready', () => false)

  function hydrate() {
    if (!import.meta.client || ready.value) return
    const raw = localStorage.getItem(SESSION_KEY)
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Session & { role?: string }
        session.value = { name: parsed.name || 'Usuario demo' }
      } catch {
        session.value = null
      }
    }
    ready.value = true
  }

  function login(name: string) {
    session.value = { name: name.trim() || 'Usuario demo' }
    if (import.meta.client) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session.value))
    }
  }

  function logout() {
    session.value = null
    if (import.meta.client) {
      localStorage.removeItem(SESSION_KEY)
    }
  }

  return { session, ready, hydrate, login, logout }
}
