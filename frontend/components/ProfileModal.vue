<template>
  <div ref="elRef" class="modal fade" tabindex="-1" aria-labelledby="profileModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">

        <div class="modal-header">
          <h5 class="modal-title" id="profileModalLabel">Mi perfil</h5>
          <button type="button" class="btn-close" @click="close" />
        </div>

        <div class="modal-body">
          <!-- User info -->
          <div class="d-flex align-items-center gap-3 mb-4">
            <div class="profile-avatar">{{ initials }}</div>
            <div>
              <div class="fw-semibold fs-6">{{ user?.name }}</div>
              <div class="text-muted small">{{ user?.email }}</div>
              <span class="badge text-bg-secondary mt-1">{{ user?.role }}</span>
            </div>
          </div>

          <hr>

          <!-- Change password -->
          <h6 class="mb-3">Cambiar contraseña</h6>

          <div v-if="msg" class="alert py-2" :class="msgOk ? 'alert-success' : 'alert-danger'">
            {{ msg }}
          </div>

          <form @submit.prevent="changePassword">
            <div class="mb-3">
              <label class="form-label">Contraseña actual</label>
              <input
                type="password"
                class="form-control"
                v-model="form.current"
                autocomplete="current-password"
                required
              />
            </div>
            <div class="mb-3">
              <label class="form-label">Nueva contraseña</label>
              <input
                type="password"
                class="form-control"
                v-model="form.newPass"
                autocomplete="new-password"
                minlength="8"
                required
              />
              <div class="form-text">Mínimo 8 caracteres.</div>
            </div>
            <div class="mb-3">
              <label class="form-label">Confirmar nueva contraseña</label>
              <input
                type="password"
                class="form-control"
                v-model="form.confirm"
                autocomplete="new-password"
                required
              />
            </div>
            <button type="submit" class="btn btn-primary w-100" :disabled="saving">
              {{ saving ? 'Guardando...' : 'Cambiar contraseña' }}
            </button>
          </form>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ open: boolean }>()
const emit  = defineEmits<{ 'update:open': [v: boolean] }>()

const { user } = useAuth()
const { $bootstrap } = useNuxtApp()

const elRef = ref<HTMLElement | null>(null)
let bsModal: any = null

const form = reactive({ current: '', newPass: '', confirm: '' })
const saving = ref(false)
const msg    = ref('')
const msgOk  = ref(false)

const initials = computed(() => {
  const name  = user.value?.name ?? ''
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return parts[0]?.slice(0, 2).toUpperCase() ?? '?'
})

onMounted(() => {
  if (!elRef.value) return
  bsModal = new ($bootstrap as any).Modal(elRef.value)
  elRef.value.addEventListener('hidden.bs.modal', () => emit('update:open', false))
})

watch(() => props.open, (v) => {
  if (v) {
    msg.value     = ''
    form.current  = ''
    form.newPass  = ''
    form.confirm  = ''
    bsModal?.show()
  } else {
    bsModal?.hide()
  }
})

function close() {
  emit('update:open', false)
}

async function changePassword() {
  msg.value = ''

  if (form.newPass !== form.confirm) {
    msg.value = 'Las contraseñas nuevas no coinciden.'
    msgOk.value = false
    return
  }

  saving.value = true
  try {
    await useApi().put('/auth/me', {
      current_password: form.current,
      new_password:     form.newPass,
    })
    msg.value   = 'Contraseña actualizada correctamente.'
    msgOk.value = true
    form.current = ''
    form.newPass = ''
    form.confirm = ''
  } catch (e: any) {
    msg.value   = e.message ?? 'Error al cambiar contraseña.'
    msgOk.value = false
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.profile-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #6c757d;
  color: #fff;
  font-size: 1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  user-select: none;
}
</style>
