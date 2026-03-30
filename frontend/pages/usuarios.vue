<template>
  <div>
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h5 class="mb-0 fw-bold">Usuarios</h5>
      <button class="btn btn-success btn-sm" @click="openCreate">+ Nuevo usuario</button>
    </div>

    <div v-if="error" class="alert alert-danger py-2 small">{{ error }}</div>

    <div class="card shadow-sm">
      <div class="table-responsive">
        <table class="table table-striped table-hover mb-0">
          <thead class="table-dark">
            <tr>
              <th>#</th>
              <th>Nombre</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading"><td colspan="6" class="text-center py-3 text-muted">Cargando…</td></tr>
            <tr v-else-if="!users.length"><td colspan="6" class="text-center py-3 text-muted">Sin usuarios</td></tr>
            <tr v-for="u in users" :key="u.id">
              <td>{{ u.id }}</td>
              <td>{{ u.name }}</td>
              <td>{{ u.email }}</td>
              <td><span class="badge text-bg-secondary">{{ u.role }}</span></td>
              <td>
                <span class="badge" :class="u.status === 'active' ? 'text-bg-success' : 'text-bg-warning'">
                  {{ u.status }}
                </span>
              </td>
              <td class="d-flex gap-1">
                <button class="btn btn-xs btn-outline-primary" @click="openEdit(u)">Editar</button>
                <button
                  v-if="u.status === 'active'"
                  class="btn btn-xs btn-outline-warning"
                  @click="deactivate(u)"
                >Desactivar</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Usuario -->
    <div class="modal fade" id="modalUsuario" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ editingId ? 'Editar usuario' : 'Nuevo usuario' }}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" />
          </div>
          <div class="modal-body">
            <div v-if="formError" class="alert alert-danger py-2 small">{{ formError }}</div>

            <div class="mb-3">
              <label class="form-label">Nombre <span class="text-danger">*</span></label>
              <input v-model="form.name" type="text" class="form-control" required />
            </div>
            <div class="mb-3">
              <label class="form-label">Email <span class="text-danger">*</span></label>
              <input v-model="form.email" type="email" class="form-control"
                     :readonly="!!editingId" :class="{ 'bg-light': !!editingId }" required />
            </div>
            <div class="mb-3">
              <label class="form-label">
                Contraseña <span v-if="editingId" class="text-muted small">(dejar vacío para no cambiar)</span>
                <span v-else class="text-danger">*</span>
              </label>
              <input v-model="form.password" type="password" class="form-control"
                     :required="!editingId" autocomplete="new-password" />
            </div>
            <div class="mb-3">
              <label class="form-label">Rol</label>
              <select v-model="form.role" class="form-select">
                <option value="user">user</option>
                <option value="staff">staff</option>
                <option value="interpreter">interpreter</option>
                <option value="admin">admin</option>
              </select>
            </div>
            <div class="mb-3">
              <label class="form-label">Estado</label>
              <select v-model="form.status" class="form-select">
                <option value="active">active</option>
                <option value="inactive">inactive</option>
              </select>
            </div>
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
const { isAdmin }    = useAuth()
const { $bootstrap } = useNuxtApp()

const users      = ref<any[]>([])
const loading    = ref(false)
const saving     = ref(false)
const error      = ref('')
const formError  = ref('')
const editingId  = ref<number | null>(null)

const emptyForm = () => ({ name: '', email: '', password: '', role: 'user', status: 'active' })
const form = ref(emptyForm())

onMounted(async () => {
  if (!isAdmin.value) return navigateTo('/citas')
  await load()
})

async function load() {
  loading.value = true
  error.value   = ''
  try {
    const data = await api.get<{ users: any[] }>('/users')
    users.value = data.users
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Error cargando'
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editingId.value = null
  form.value      = emptyForm()
  formError.value = ''
  showModal()
}

function openEdit(u: any) {
  editingId.value = u.id
  form.value      = { name: u.name, email: u.email, password: '', role: u.role, status: u.status }
  formError.value = ''
  showModal()
}

function showModal() {
  const el  = document.getElementById('modalUsuario')
  const bsM = ($bootstrap as any).Modal.getOrCreateInstance(el)
  bsM.show()
}

async function save() {
  formError.value = ''
  saving.value    = true
  try {
    const body: Record<string, unknown> = { ...form.value }
    if (editingId.value) {
      if (!body.password) delete body.password
      await api.put(`/users/${editingId.value}`, body)
    } else {
      await api.post('/users', body)
    }
    const el  = document.getElementById('modalUsuario')
    const bsM = ($bootstrap as any).Modal.getInstance(el)
    bsM?.hide()
    await load()
  } catch (e: unknown) {
    formError.value = e instanceof Error ? e.message : 'Error guardando'
  } finally {
    saving.value = false
  }
}

async function deactivate(u: any) {
  if (!confirm(`¿Desactivar a ${u.name}?`)) return
  try {
    await api.put(`/users/${u.id}`, { status: 'inactive' })
    u.status = 'inactive'
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Error desactivando'
  }
}
</script>

<style scoped>
.btn-xs { padding: 0.15rem 0.4rem; font-size: 0.75rem; }
</style>
