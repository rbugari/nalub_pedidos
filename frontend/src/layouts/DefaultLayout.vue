<script setup>
import { computed, ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'

const authStore = useAuthStore()
const router = useRouter()
const { mobile } = useDisplay()
const drawer = ref(false)
const user = computed(() => authStore.getUser)

onMounted(() => {
  console.log('🔍 DefaultLayout mounted')
  console.log('🔍 Current route in layout:', router.currentRoute.value.path)
})

function logout() {
  authStore.logout()
}
</script>

<template>
  <v-app>
    <!-- Navigation Drawer para móvil -->
    <v-navigation-drawer
      v-model="drawer"
      temporary
      v-if="mobile"
      class="elevation-4"
    >
      <!-- Header del drawer -->
      <v-list-item class="px-4 py-3 bg-primary">
        <template v-slot:prepend>
          <v-avatar color="white" size="40">
            <v-icon color="primary" size="24">mdi-account-circle</v-icon>
          </v-avatar>
        </template>
        <v-list-item-title class="text-white font-weight-bold">{{ user?.nombre || 'Usuario' }}</v-list-item-title>
        <v-list-item-subtitle class="text-white" style="opacity: 0.9">{{ user?.usuario || '' }}</v-list-item-subtitle>
      </v-list-item>
      
      <v-divider></v-divider>
      
      <v-list density="comfortable" nav class="py-2">
        <v-list-item to="/dashboard" @click="drawer = false" class="mb-1" rounded="lg">
          <template v-slot:prepend>
            <v-icon color="primary">mdi-view-dashboard</v-icon>
          </template>
          <v-list-item-title class="font-weight-medium">Dashboard</v-list-item-title>
        </v-list-item>
        
        <v-list-item to="/prepedidos" @click="drawer = false" class="mb-1" rounded="lg">
          <template v-slot:prepend>
            <v-icon color="orange-darken-2">mdi-cart-outline</v-icon>
          </template>
          <v-list-item-title class="font-weight-medium">Prepedidos</v-list-item-title>
        </v-list-item>
        
        <v-list-item to="/pedidos" @click="drawer = false" class="mb-1" rounded="lg">
          <template v-slot:prepend>
            <v-icon color="green-darken-2">mdi-clipboard-check-outline</v-icon>
          </template>
          <v-list-item-title class="font-weight-medium">Pedidos</v-list-item-title>
        </v-list-item>
        
        <v-list-item to="/productos" @click="drawer = false" class="mb-1" rounded="lg">
          <template v-slot:prepend>
            <v-icon color="blue-darken-2">mdi-package-variant</v-icon>
          </template>
          <v-list-item-title class="font-weight-medium">Productos</v-list-item-title>
        </v-list-item>
        
        <v-list-item to="/ofertas" @click="drawer = false" class="mb-1" rounded="lg">
          <template v-slot:prepend>
            <v-icon color="red-darken-2">mdi-tag-multiple</v-icon>
          </template>
          <v-list-item-title class="font-weight-medium">Ofertas</v-list-item-title>
        </v-list-item>
        
        <v-list-item to="/pagos" @click="drawer = false" class="mb-1" rounded="lg">
          <template v-slot:prepend>
            <v-icon color="teal-darken-2">mdi-cash-multiple</v-icon>
          </template>
          <v-list-item-title class="font-weight-medium">Pagos</v-list-item-title>
        </v-list-item>
        
        <v-divider class="my-2"></v-divider>
        
        <v-list-item to="/perfil" @click="drawer = false" class="mb-1" rounded="lg">
          <template v-slot:prepend>
            <v-icon color="grey-darken-2">mdi-account-cog</v-icon>
          </template>
          <v-list-item-title class="font-weight-medium">Mi Perfil</v-list-item-title>
        </v-list-item>
        
        <v-list-item @click="logout" class="mb-1" rounded="lg">
          <template v-slot:prepend>
            <v-icon color="error">mdi-logout</v-icon>
          </template>
          <v-list-item-title class="font-weight-medium">Cerrar Sesión</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <!-- App Bar -->
    <v-app-bar color="primary" app elevation="2">
      <!-- Botón de menú para móvil -->
      <v-app-bar-nav-icon
        v-if="mobile"
        @click="drawer = !drawer"
      ></v-app-bar-nav-icon>
      
      <v-icon v-if="!mobile" class="mr-2" size="32">mdi-storefront</v-icon>
      <v-app-bar-title class="font-weight-bold">Nalub Pedidos</v-app-bar-title>
      
      <!-- Navegación para desktop -->
      <template v-if="!mobile">
        <v-spacer></v-spacer>
        
        <v-btn to="/dashboard" variant="text" class="mx-1">
          <v-icon start>mdi-view-dashboard</v-icon>
          Dashboard
        </v-btn>
        
        <v-btn to="/prepedidos" variant="text" class="mx-1">
          <v-icon start>mdi-cart-outline</v-icon>
          Prepedidos
        </v-btn>
        
        <v-btn to="/pedidos" variant="text" class="mx-1">
          <v-icon start>mdi-clipboard-check-outline</v-icon>
          Pedidos
        </v-btn>
        
        <v-btn to="/productos" variant="text" class="mx-1">
          <v-icon start>mdi-package-variant</v-icon>
          Productos
        </v-btn>
        
        <v-btn to="/ofertas" variant="text" class="mx-1">
          <v-icon start>mdi-tag-multiple</v-icon>
          Ofertas
        </v-btn>
        
        <v-btn to="/pagos" variant="text" class="mx-1">
          <v-icon start>mdi-cash-multiple</v-icon>
          Pagos
        </v-btn>
        
        <v-divider vertical class="mx-2" thickness="2"></v-divider>
        
        <v-btn to="/perfil" variant="text" class="mx-1">
          <v-icon start>mdi-account-cog</v-icon>
          Perfil
        </v-btn>
        
        <v-btn @click="logout" variant="text" color="white" class="mx-1">
          <v-icon start>mdi-logout</v-icon>
          Salir
        </v-btn>
      </template>
    </v-app-bar>

    <v-main :class="{ 'mobile-with-bottom-nav': mobile }">
      <v-container fluid class="pa-4">
        <slot></slot>
      </v-container>
    </v-main>
  </v-app>
</template>

<style scoped>
/* Agregar padding inferior en móvil cuando hay bottom navigation */
.mobile-with-bottom-nav {
  padding-bottom: 56px !important;
}
</style>