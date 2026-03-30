<template>
  <div>
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h5 class="mb-0 fw-bold">Citas</h5>
      <button class="btn btn-success btn-sm" data-bs-toggle="modal" data-bs-target="#modalCita">
        + Nueva cita
      </button>
    </div>

    <!-- Error -->
    <div v-if="error" class="alert alert-danger py-2 small">{{ error }}</div>

    <!-- Tabla -->
    <div class="card shadow-sm">
      <div class="table-responsive">
        <table class="table table-striped table-hover mb-0">
          <thead class="table-dark">
            <tr>
              <th>#</th>
              <th>Paciente</th>
              <th>Usuario</th>
              <th>Inicio</th>
              <th>Fin</th>
              <th>Estado</th>
              <th>Notas</th>
              <th v-if="isStaff">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading"><td colspan="8" class="text-center py-3 text-muted">Cargando…</td></tr>
            <tr v-else-if="!appointments.length"><td colspan="8" class="text-center py-3 text-muted">Sin citas</td></tr>
            <tr v-for="a in appointments" :key="a.id">
              <td>{{ a.id }}</td>
              <td>{{ a.paciente_nombres ?? '—' }}</td>
              <td>{{ a.user_name }}</td>
              <td>{{ fmtDt(a.start_at) }}</td>
              <td>{{ fmtDt(a.end_at) }}</td>
              <td>
                <span class="badge" :class="statusClass(a.status)">{{ a.status }}</span>
              </td>
              <td class="text-truncate" style="max-width:160px">{{ a.notes ?? '' }}</td>
              <td v-if="isStaff">
                <div class="d-flex gap-1">
                  <button
                    v-if="a.status === 'pending'"
                    class="btn btn-xs btn-outline-success"
                    @click="setStatus(a, 'confirmed')"
                  >✓</button>
                  <button
                    v-if="['pending','confirmed'].includes(a.status)"
                    class="btn btn-xs btn-outline-danger"
                    @click="setStatus(a, 'cancelled')"
                  >✕</button>
                  <button
                    v-if="a.status === 'confirmed'"
                    class="btn btn-xs btn-outline-primary"
                    @click="setStatus(a, 'done')"
                  >✔</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Nueva Cita -->
    <div class="modal fade" id="modalCita" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Nueva cita</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" />
          </div>
          <div class="modal-body">
            <div v-if="formError" class="alert alert-danger py-2 small">{{ formError }}</div>

            <div v-if="isStaff" class="mb-3">
              <label class="form-label">Usuario</label>
              <select v-model="form.user_id" class="form-select">
                <option v-for="u in users" :key="u.id" :value="u.id">
                  {{ u.name }} ({{ u.email }})
                </option>
              </select>
            </div>

            <div class="mb-3">
              <label class="form-label">Paciente (RUT / ID)</label>
              <input v-model="form.id_paciente" type="text" class="form-control" placeholder="Opcional" />
            </div>

            <div class="mb-3">
              <label class="form-label">Inicio <small class="text-muted">DD-MM-YYYY HH:MM</small></label>
              <input v-model="form.start_at" type="datetime-local" class="form-control" required />
            </div>

            <div class="mb-3">
              <label class="form-label">Fin <small class="text-muted">DD-MM-YYYY HH:MM</small></label>
              <input v-model="form.end_at" type="datetime-local" class="form-control" required />
            </div>

            <div class="mb-3">
              <label class="form-label">Notas</label>
              <textarea v-model="form.notes" class="form-control" rows="2" />
            </div>

            <template v-if="isStaff">
              <div class="mb-3">
                <label class="form-label">Tipo de atención</label>
                <input v-model="form.attention_type" type="text" class="form-control" />
              </div>
              <div class="mb-3">
                <label class="form-label">Sector</label>
                <input v-model="form.sector_at" type="text" class="form-control" />
              </div>
            </template>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button class="btn btn-primary" :disabled="saving" @click="save">
              <span v-if="saving" class="spinner-border spinner-border-sm me-1" />
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const api            = useApi()
const { user, isStaff } = useAuth()
const { $bootstrap } = useNuxtApp()

const appointments = ref<any[]>([])
const users        = ref<any[]>([])
const loading      = ref(false)
const saving       = ref(false)
const error        = ref('')
const formError    = ref('')

const emptyForm = () => ({
  user_id:       user.value?.id ?? '',
  id_paciente:   '',
  start_at:      '',
  end_at:        '',
  notes:         '',
  attention_type: '',
  sector_at:     '',
})
const form = ref(emptyForm())

onMounted(async () => {
  await load()
  if (isStaff.value) await loadUsers()
})

async function load() {
  loading.value = true
  error.value   = ''
  try {
    const data     = await api.get<{ appointments: any[] }>('/appointments', { from: '2026-01-01', to: '2026-12-31' })
    appointments.value = data.appointments
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Error cargando citas'
  } finally {
    loading.value = false
  }
}

async function loadUsers() {
  try {
    const data = await api.get<{ users: any[] }>('/users')
    users.value = data.users
  } catch { /* no-op si no es admin */ }
}

async function save() {
  formError.value = ''
  saving.value    = true
  try {
    const body: Record<string, unknown> = {
      user_id:     form.value.user_id,
      id_paciente: form.value.id_paciente || undefined,
      start_at:    form.value.start_at,
      end_at:      form.value.end_at,
      notes:       form.value.notes || undefined,
    }
    if (isStaff.value) {
      body.attention_type = form.value.attention_type || undefined
      body.sector_at      = form.value.sector_at      || undefined
    }
    await api.post('/appointments', body)
    form.value = emptyForm()
    const modal = ($bootstrap as any).Modal.getInstance(document.getElementById('modalCita'))
    modal?.hide()
    await load()
  } catch (e: unknown) {
    formError.value = e instanceof Error ? e.message : 'Error guardando'
  } finally {
    saving.value = false
  }
}

async function setStatus(a: any, status: string) {
  try {
    await api.put(`/appointments/${a.id}`, { status })
    a.status = status
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Error actualizando'
  }
}

function fmtDt(raw: string) {
  if (!raw) return ''
  const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/)
  return m ? `${m[3]}-${m[2]}-${m[1]} ${m[4]}:${m[5]}` : raw
}

function statusClass(s: string) {
  const map: Record<string, string> = {
    pending:   'text-bg-warning',
    confirmed: 'text-bg-success',
    cancelled: 'text-bg-danger',
    no_show:   'text-bg-secondary',
    done:      'text-bg-primary',
  }
  return map[s] ?? 'text-bg-light'
}
</script>

<style scoped>
.btn-xs { padding: 0.15rem 0.4rem; font-size: 0.75rem; }
</style>
