export interface AuthUser {
  id:    number
  name:  string
  email: string
  role:  'admin' | 'staff' | 'user' | 'interpreter'
}

export function useAuth() {
  const _user  = useState<AuthUser | null>('auth_user', () => null)
  const router = useRouter()

  const user       = readonly(_user)
  const isLoggedIn = computed(() => _user.value !== null)
  const isAdmin    = computed(() => _user.value?.role === 'admin')
  const isStaff    = computed(() => ['admin', 'staff'].includes(_user.value?.role ?? ''))

  // init() no lanza nunca — 401 o cualquier error → user = null silencioso
  async function init() {
    try {
      const api   = useApi()
      const data  = await api.get<{ user: AuthUser }>('/auth/me')
      _user.value = data.user ?? null
    } catch {
      _user.value = null
    }
  }

  async function login(email: string, password: string) {
    const api   = useApi()
    const data  = await api.post<{ user: AuthUser }>('/auth/login', { email, password })
    _user.value = data.user
    await router.push('/citas')
  }

  async function logout() {
    try { await useApi().post('/auth/logout', {}) } catch { /* ignore */ }
    _user.value = null
    await router.push('/login')
  }

  return { user, isLoggedIn, isAdmin, isStaff, init, login, logout }
}
