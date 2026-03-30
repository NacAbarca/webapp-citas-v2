<template>
  <div>
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h5 class="mb-0 fw-bold">Pacientes</h5>
      <button class="btn btn-success btn-sm" @click="openCreate">+ Nuevo paciente</button>
    </div>

    <div v-if="error" class="alert alert-danger py-2 small">{{ error }}</div>

    <div class="card shadow-sm">
      <div class="table-responsive">
        <table class="table table-striped table-hover mb-0">
          <thead class="table-dark">
            <tr>
              <th>ID/RUT</th>
              <th>Nombre</th>
              <th>Apellido</th>
              <th>Género</th>
              <th>Comuna</th>
              <th>Sector</th>
              <th>Vigente</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading"><td colspan="8" class="text-center py-3 text-muted">Cargando…</td></tr>
            <tr v-else-if="!patients.length"><td colspan="8" class="text-center py-3 text-muted">Sin pacientes</td></tr>
            <tr v-for="p in patients" :key="p.id_paciente">
              <td class="fw-mono small">{{ p.id_paciente }}</td>
              <td>{{ p.nombres }}</td>
              <td>{{ p.apellido_paterno }} {{ p.apellido_materno }}</td>
              <td>{{ p.genero ?? '—' }}</td>
              <td>{{ p.comuna ?? '—' }}</td>
              <td><span class="badge text-bg-info">{{ p.sector }}</span></td>
              <td>
                <span class="badge" :class="p.vigente ? 'text-bg-success' : 'text-bg-secondary'">
                  {{ p.vigente ? 'Sí' : 'No' }}
                </span>
              </td>
              <td>
                <button class="btn btn-xs btn-outline-primary" @click="openEdit(p)">Editar</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal Paciente -->
    <div class="modal fade" id="modalPaciente" tabindex="-1">
      <div class="modal-dialog modal-lg modal-dialog-scrollable">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{ editingId ? 'Editar paciente' : 'Nuevo paciente' }}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" />
          </div>
          <div class="modal-body">
            <div v-if="formError" class="alert alert-danger py-2 small">{{ formError }}</div>

            <div class="row g-3">
              <div class="col-md-4">
                <label class="form-label">ID / RUT <span class="text-danger">*</span></label>
                <input v-model="form.id_paciente" type="text" class="form-control"
                       :readonly="!!editingId" :class="{ 'bg-light': !!editingId }" required />
              </div>
              <div class="col-md-4">
                <label class="form-label">Usuario</label>
                <input v-model="form.usuario" type="text" class="form-control" />
              </div>
              <div class="col-md-4">
                <label class="form-label">Nombres <span class="text-danger">*</span></label>
                <input v-model="form.nombres" type="text" class="form-control" required />
              </div>
              <div class="col-md-4">
                <label class="form-label">Apellido paterno</label>
                <input v-model="form.apellido_paterno" type="text" class="form-control" />
              </div>
              <div class="col-md-4">
                <label class="form-label">Apellido materno</label>
                <input v-model="form.apellido_materno" type="text" class="form-control" />
              </div>
              <div class="col-md-4">
                <label class="form-label">Fecha nacimiento</label>
                <input v-model="form.fecha_nacimiento" type="date" class="form-control" />
              </div>
              <div class="col-md-3">
                <label class="form-label">Edad</label>
                <input v-model.number="form.edad" type="number" class="form-control" min="0" />
              </div>
              <div class="col-md-3">
                <label class="form-label">% Discapacidad</label>
                <input v-model.number="form.porcentaje_discapacidad" type="number" class="form-control" min="0" max="100" />
              </div>
              <div class="col-md-3">
                <label class="form-label">Género</label>
                <select v-model="form.genero" class="form-select">
                  <option value="">—</option>
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
              <div class="col-md-3">
                <label class="form-label">Nacionalidad</label>
                <input v-model="form.nacionalidad" type="text" class="form-control" />
              </div>
              <div class="col-md-6">
                <label class="form-label">Establecimiento</label>
                <input v-model="form.establecimiento" type="text" class="form-control" />
              </div>
              <div class="col-md-6">
                <label class="form-label">Contacto</label>
                <input v-model="form.contacto" type="text" class="form-control" />
              </div>
              <div class="col-md-6">
                <label class="form-label">Email</label>
                <input v-model="form.email" type="email" class="form-control" />
              </div>
              <div class="col-md-6">
                <label class="form-label">Dirección</label>
                <input v-model="form.direccion" type="text" class="form-control" />
              </div>
              <div class="col-md-4">
                <label class="form-label">Región</label>
                <input v-model="form.region" type="text" class="form-control" />
              </div>
              <div class="col-md-4">
                <label class="form-label">Provincia</label>
                <input v-model="form.provincia" type="text" class="form-control" />
              </div>
              <div class="col-md-4">
                <label class="form-label">Comuna</label>
                <input v-model="form.comuna" type="text" class="form-control" />
              </div>
              <div class="col-md-4">
                <label class="form-label">Sector</label>
                <select v-model="form.sector" class="form-select">
                  <option v-for="s in SECTORES" :key="s" :value="s">{{ s }}</option>
                </select>
              </div>
              <div class="col-md-4">
                <label class="form-label">Condiciones</label>
                <input v-model="form.condiciones" type="text" class="form-control" />
              </div>
              <div class="col-md-4">
                <label class="form-label">Vigente</label>
                <select v-model.number="form.vigente" class="form-select">
                  <option :value="1">Sí</option>
                  <option :value="0">No</option>
                </select>
              </div>
              <div class="col-12">
                <label class="form-label">Observaciones</label>
                <textarea v-model="form.observaciones" class="form-control" rows="2" />
              </div>
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
const { isStaff }    = useAuth()
const { $bootstrap } = useNuxtApp()

const SECTORES = ['Verde','Azul','Rojo','Amarillo','Transversales','Patio central','Particular','Sin informado','Otros']

const patients   = ref<any[]>([])
const loading    = ref(false)
const saving     = ref(false)
const error      = ref('')
const formError  = ref('')
const editingId  = ref<string | null>(null)

const emptyForm = () => ({
  id_paciente: '', usuario: '', nombres: '', apellido_paterno: '', apellido_materno: '',
  fecha_nacimiento: '', edad: 0, porcentaje_discapacidad: 0, condiciones: '',
  nacionalidad: '', genero: '', establecimiento: '', ampersand_flag: 0,
  contacto: '', email: '', direccion: '', comuna: '', region: '', provincia: '',
  vigente: 1, sector: 'Sin informado', foto: '', observaciones: '',
})
const form = ref(emptyForm())

onMounted(load)

async function load() {
  if (!isStaff.value) return navigateTo('/citas')
  loading.value = true
  error.value   = ''
  try {
    const data = await api.get<{ patients: any[] }>('/patients')
    patients.value = data.patients
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Error cargando'
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editingId.value = null
  form.value = emptyForm()
  formError.value = ''
  showModal()
}

function openEdit(p: any) {
  editingId.value = p.id_paciente
  form.value = { ...emptyForm(), ...p }
  formError.value = ''
  showModal()
}

function showModal() {
  const el  = document.getElementById('modalPaciente')
  const bsM = ($bootstrap as any).Modal.getOrCreateInstance(el)
  bsM.show()
}

async function save() {
  formError.value = ''
  saving.value    = true
  try {
    if (editingId.value) {
      await api.put(`/patients/${editingId.value}`, form.value)
    } else {
      await api.post('/patients', form.value)
    }
    const el  = document.getElementById('modalPaciente')
    const bsM = ($bootstrap as any).Modal.getInstance(el)
    bsM?.hide()
    await load()
  } catch (e: unknown) {
    formError.value = e instanceof Error ? e.message : 'Error guardando'
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.btn-xs { padding: 0.15rem 0.4rem; font-size: 0.75rem; }
.fw-mono { font-family: monospace; }
</style>
