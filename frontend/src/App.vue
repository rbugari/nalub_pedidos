<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from './stores/auth'
import { useRoute } from 'vue-router'
import DefaultLayout from './layouts/DefaultLayout.vue'

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
  <DefaultLayout v-if="authStore.isAuthenticated">
    <router-view />
  </DefaultLayout>
  <router-view v-else />
</template>