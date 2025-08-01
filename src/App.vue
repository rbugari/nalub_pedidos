<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from './stores/auth'
import { useRoute } from 'vue-router'
import DefaultLayout from './layouts/DefaultLayout.vue'

const authStore = useAuthStore()
const route = useRoute()

onMounted(() => {
  authStore.checkAuth()
})
</script>

<template>
  <DefaultLayout v-if="authStore.isAuthenticated && route.meta.requiresAuth">
    <router-view />
  </DefaultLayout>
  <router-view v-else />
</template>