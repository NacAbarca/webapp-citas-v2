<script setup lang="ts">
const { isLoggedIn } = useAuth()
await navigateTo(isLoggedIn.value ? '/citas' : '/login', { replace: true })
</script>
