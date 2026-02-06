<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from './stores/auth'
import { useRoute } from 'vue-router'
import DefaultLayout from './layouts/DefaultLayout.vue'
import MobileBottomNav from './components/MobileBottomNav.vue'

const authStore = useAuthStore()
const route = useRoute()

onMounted(() => {
  console.log('🔍 App.vue mounted - checking auth')
  const isAuth = authStore.checkAuth()
  console.log('🔍 Auth check result:', isAuth)
  console.log('🔍 Current route:', route.path)
  console.log('🔍 Route meta:', route.meta)
})
</script>

<template>
  <div v-if="authStore.isAuthenticated">
    <DefaultLayout>
      <router-view />
    </DefaultLayout>
    <MobileBottomNav />
  </div>
  <router-view v-else />
</template>