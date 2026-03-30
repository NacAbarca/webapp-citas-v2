export function useApi() {
  const config = useRuntimeConfig()
  const BASE   = config.public.apiBase as string

  async function request<T = unknown>(
    path: string,
    options: RequestInit & { query?: Record<string, string | number | undefined | null> } = {}
  ): Promise<T> {
    const { query, ...fetchOpts } = options

    const qs = query
      ? '?' + new URLSearchParams(
          Object.fromEntries(
            Object.entries(query)
              .filter(([, v]) => v !== undefined && v !== null && v !== '')
              .map(([k, v]) => [k, String(v)])
          )
        )
      : ''

    const res = await fetch(`${BASE}${path}${qs}`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Accept:         'application/json',
        ...(fetchOpts.headers as Record<string, string> ?? {}),
      },
      ...fetchOpts,
    })

    const contentType = res.headers.get('content-type') ?? ''
    if (!contentType.includes('application/json')) {
      throw new Error(`Respuesta no-JSON (HTTP ${res.status})`)
    }

    const json = await res.json()
    if (!json?.ok) {
      throw new Error(json?.error?.message ?? 'Error API')
    }
    return json.data as T
  }

  return {
    get:    <T>(path: string, query?: Record<string, string | number | undefined | null>) =>
              request<T>(path, { method: 'GET', query }),
    post:   <T>(path: string, body: unknown) =>
              request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
    put:    <T>(path: string, body: unknown) =>
              request<T>(path, { method: 'PUT',  body: JSON.stringify(body) }),
    delete: <T>(path: string) =>
              request<T>(path, { method: 'DELETE' }),
  }
}
