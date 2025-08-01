<script setup>
import { computed, ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'

const authStore = useAuthStore()
const router = useRouter()
const { mobile } = useDisplay()
const drawer = ref(false)
const user = computed(() => authStore.getUser)

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
    >
      <v-list>
        <v-list-item to="/dashboard" @click="drawer = false">
          <v-list-item-title>Dashboard</v-list-item-title>
        </v-list-item>
        <v-list-item to="/prepedidos" @click="drawer = false">
          <v-list-item-title>Prepedidos</v-list-item-title>
        </v-list-item>
        <v-list-item to="/pedidos" @click="drawer = false">
          <v-list-item-title>Pedidos</v-list-item-title>
        </v-list-item>
        <v-list-item to="/productos" @click="drawer = false">
          <v-list-item-title>Productos</v-list-item-title>
        </v-list-item>
        <v-list-item to="/ofertas" @click="drawer = false">
          <v-list-item-title>Ofertas</v-list-item-title>
        </v-list-item>
        <v-list-item to="/perfil" @click="drawer = false">
          <v-list-item-title>Perfil</v-list-item-title>
        </v-list-item>
        <v-list-item @click="logout">
          <v-list-item-title>Cerrar Sesión</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <!-- App Bar -->
    <v-app-bar color="primary" app>
      <!-- Botón de menú para móvil -->
      <v-app-bar-nav-icon
        v-if="mobile"
        @click="drawer = !drawer"
      ></v-app-bar-nav-icon>
      
      <v-app-bar-title>Nalub Pedidos</v-app-bar-title>
      
      <!-- Navegación para desktop -->
      <template v-if="!mobile">
        <v-spacer></v-spacer>
        <v-btn to="/dashboard" text>Dashboard</v-btn>
        <v-btn to="/prepedidos" text>Prepedidos</v-btn>
        <v-btn to="/pedidos" text>Pedidos</v-btn>
        <v-btn to="/productos" text>Productos</v-btn>
        <v-btn to="/ofertas" text>Ofertas</v-btn>
        <v-btn to="/perfil" text>Perfil</v-btn>
        <v-btn @click="logout" text>Cerrar Sesión</v-btn>
      </template>
    </v-app-bar>

    <v-main>
      <v-container fluid class="pa-4">
        <slot></slot>
      </v-container>
    </v-main>
  </v-app>
</template>