<template>
  <div>
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h1 class="h4 mb-0">Auditoría — Login logs</h1>
        <div class="text-muted small">Últimos {{ limit }} intentos de acceso</div>
      </div>
      <div class="d-flex gap-2 align-items-center">
        <select class="form-select form-select-sm" style="width:auto" v-model="limit" @change="load">
          <option :value="50">50</option>
          <option :value="100">100</option>
          <option :value="250">250</option>
          <option :value="500">500</option>
        </select>
        <button class="btn btn-sm btn-outline-secondary" @click="load" :disabled="loading">
          {{ loading ? 'Cargando…' : 'Refrescar' }}
        </button>
      </div>
    </div>

    <div v-if="error" class="alert alert-danger">{{ error }}</div>

    <div class="card shadow-sm">
      <div class="table-responsive">
        <table class="table table-hover table-sm mb-0">
          <thead class="table-dark">
            <tr>
              <th>Fecha</th>
              <th>Email</th>
              <th>IP</th>
              <th>Resultado</th>
              <th>User-Agent</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in logs" :key="log.id">
              <td class="text-nowrap small">{{ formatDate(log.created_at) }}</td>
              <td class="small">{{ log.email }}</td>
              <td class="small text-nowrap">{{ log.ip }}</td>
              <td>
                <span class="badge" :class="log.success ? 'text-bg-success' : 'text-bg-danger'">
                  {{ log.success ? 'Exitoso' : 'Fallido' }}
                </span>
              </td>
              <td class="small text-muted text-truncate" style="max-width:260px" :title="log.user_agent">
                {{ log.user_agent }}
              </td>
            </tr>
            <tr v-if="!loading && logs.length === 0">
              <td colspan="5" class="text-muted text-center p-4">Sin registros</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="card-footer text-muted small">
        {{ logs.length }} registros cargados
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const { isAdmin } = useAuth()
if (!isAdmin.value) {
  await navigateTo('/citas')
}

interface LoginLog {
  id:         number
  user_id:    number | null
  email:      string
  ip:         string
  user_agent: string
  success:    number
  created_at: string
}

const api     = useApi()
const logs    = ref<LoginLog[]>([])
const limit   = ref(100)
const loading = ref(false)
const error   = ref('')

async function load() {
  error.value   = ''
  loading.value = true
  try {
    const data = await api.get<{ logs: LoginLog[] }>('/audit/login-logs', { limit: limit.value })
    logs.value  = data.logs
  } catch (e: any) {
    error.value = e.message ?? 'Error cargando logs'
  } finally {
    loading.value = false
  }
}

function formatDate(s: string) {
  const d = new Date(s)
  return isNaN(d.getTime()) ? s : d.toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' })
}

onMounted(load)
</script>
