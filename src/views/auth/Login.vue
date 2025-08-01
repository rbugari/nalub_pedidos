<script setup>
import { ref } from 'vue'
import { useAuthStore } from '../../stores/auth'

const authStore = useAuthStore()
const credentials = ref({
  email: '',
  password: ''
})
const loading = ref(false)
const error = ref('')

async function handleLogin() {
  loading.value = true
  error.value = ''
  
  try {
    const result = await authStore.login(credentials.value)
    if (!result.success) {
      error.value = result.message
    }
  } catch (err) {
    error.value = 'Error al iniciar sesión'
    console.error(err)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="4">
        <v-card class="elevation-12">
          <v-toolbar color="primary" dark flat>
            <v-toolbar-title>Iniciar Sesión</v-toolbar-title>
          </v-toolbar>
          <v-card-text>
            <v-alert v-if="error" type="error" dense>{{ error }}</v-alert>
            <v-form @submit.prevent="handleLogin">
              <v-text-field
                v-model="credentials.email"
                label="Email"
                name="email"
                prepend-icon="mdi-account"
                type="text"
                required
              ></v-text-field>

              <v-text-field
                v-model="credentials.password"
                label="Contraseña"
                name="password"
                prepend-icon="mdi-lock"
                type="password"
                required
              ></v-text-field>
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn 
              color="primary" 
              @click="handleLogin"
              :loading="loading"
            >
              Iniciar Sesión
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>