<script setup>
import { computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()
const user = computed(() => authStore.getUser)

function logout() {
  authStore.logout()
}
</script>

<template>
  <v-app>
    <v-app-bar color="primary" app>
      <v-app-bar-title>Nalub Pedidos</v-app-bar-title>
      <v-spacer></v-spacer>
      <v-btn to="/dashboard" text>Dashboard</v-btn>
      <v-btn to="/prepedidos" text>Prepedidos</v-btn>
      <v-btn to="/pedidos" text>Pedidos</v-btn>
      <v-btn to="/productos" text>Productos</v-btn>
      <v-btn to="/ofertas" text>Ofertas</v-btn>
      <v-btn to="/perfil" text>Perfil</v-btn>
      <v-btn @click="logout" text>Cerrar Sesión</v-btn>
    </v-app-bar>

    <v-main>
      <v-container fluid>
        <slot></slot>
      </v-container>
    </v-main>
  </v-app>
</template>