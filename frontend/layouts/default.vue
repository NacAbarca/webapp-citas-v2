<template>
  <div>
    <!-- Navbar -->
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark px-3">
      <span class="navbar-brand fw-bold">📅 WebApp Citas</span>

      <div class="collapse navbar-collapse">
        <ul class="navbar-nav me-auto gap-1">
          <li class="nav-item">
            <NuxtLink to="/citas" class="nav-link" active-class="fw-bold text-white">Citas</NuxtLink>
          </li>
          <li v-if="isStaff" class="nav-item">
            <NuxtLink to="/pacientes" class="nav-link" active-class="fw-bold text-white">Pacientes</NuxtLink>
          </li>
          <li v-if="isAdmin" class="nav-item">
            <NuxtLink to="/usuarios" class="nav-link" active-class="fw-bold text-white">Usuarios</NuxtLink>
          </li>
          <li v-if="isAdmin" class="nav-item">
            <NuxtLink to="/auditoria" class="nav-link" active-class="fw-bold text-white">Auditoría</NuxtLink>
          </li>
        </ul>

        <!-- User dropdown -->
        <div class="dropdown">
          <a
            href="#"
            class="d-flex align-items-center gap-2 text-decoration-none dropdown-toggle"
            data-bs-toggle="dropdown"
            aria-expanded="false"
          >
            <div class="user-avatar">{{ initials }}</div>
            <span class="text-white-50 small d-none d-md-inline">{{ user?.name }}</span>
          </a>
          <ul class="dropdown-menu dropdown-menu-end">
            <li class="px-3 py-2">
              <div class="fw-semibold">{{ user?.name }}</div>
              <div class="text-muted small">{{ user?.email }}</div>
              <span class="badge text-bg-secondary mt-1">{{ user?.role }}</span>
            </li>
            <li><hr class="dropdown-divider"></li>
            <li>
              <button class="dropdown-item" @click="showProfile = true">Mi perfil</button>
            </li>
            <li><hr class="dropdown-divider"></li>
            <li>
              <button class="dropdown-item text-danger" @click="logout">Cerrar sesión</button>
            </li>
          </ul>
        </div>
      </div>
    </nav>

    <!-- Content -->
    <div class="container-fluid py-4 px-4">
      <slot />
    </div>

    <ProfileModal v-model:open="showProfile" />
  </div>
</template>

<script setup lang="ts">
const { user, isAdmin, isStaff, logout } = useAuth()
const showProfile = ref(false)

const initials = computed(() => {
  const name = user.value?.name ?? ''
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return parts[0]?.slice(0, 2).toUpperCase() ?? '?'
})
</script>

<style scoped>
.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #6c757d;
  color: #fff;
  font-size: 0.75rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  user-select: none;
}
</style>
