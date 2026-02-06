<template>
  <v-bottom-navigation
    v-if="isMobile && isAuthenticated"
    v-model="activeTab"
    grow
    bg-color="primary"
    app
  >
    <v-btn @click="navigate('/dashboard')" value="dashboard">
      <v-icon>mdi-view-dashboard</v-icon>
      <span>Inicio</span>
    </v-btn>

    <v-btn @click="navigate('/prepedidos')" value="prepedidos">
      <v-icon>mdi-clipboard-text</v-icon>
      <span>Prepedidos</span>
    </v-btn>

    <v-btn @click="navigate('/pedidos')" value="pedidos">
      <v-icon>mdi-cart</v-icon>
      <span>Pedidos</span>
    </v-btn>

    <v-btn @click="navigate('/productos')" value="productos">
      <v-icon>mdi-package-variant</v-icon>
      <span>Productos</span>
    </v-btn>

    <v-btn @click="navigate('/perfil')" value="perfil">
      <v-icon>mdi-account</v-icon>
      <span>Perfil</span>
    </v-btn>
  </v-bottom-navigation>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useDisplay } from 'vuetify'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const { mobile } = useDisplay()

const activeTab = ref('dashboard')
const isMobile = computed(() => mobile.value)
const isAuthenticated = computed(() => authStore.isAuthenticated)

// Sincronizar tab activo con la ruta actual
watch(() => route.path, (newPath) => {
  if (newPath.startsWith('/dashboard')) activeTab.value = 'dashboard'
  else if (newPath.startsWith('/prepedidos')) activeTab.value = 'prepedidos'
  else if (newPath.startsWith('/pedidos')) activeTab.value = 'pedidos'
  else if (newPath.startsWith('/productos')) activeTab.value = 'productos'
  else if (newPath.startsWith('/perfil')) activeTab.value = 'perfil'
}, { immediate: true })

const navigate = (path) => {
  if (route.path !== path) {
    router.push(path)
  }
}
</script>

<style scoped>
:deep(.v-btn) {
  min-width: 64px;
  flex-direction: column;
  height: 100% !important;
}

:deep(.v-btn__content) {
  flex-direction: column;
  gap: 4px;
}

:deep(.v-btn__content span) {
  font-size: 11px;
  line-height: 1.2;
}

:deep(.v-icon) {
  font-size: 24px;
}

/* Agregar padding inferior cuando bottom nav está visible */
:deep(.v-main) {
  padding-bottom: 56px;
}
</style>
