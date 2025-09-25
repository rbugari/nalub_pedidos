<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../../stores/auth'
import api from '../../services/api'

const authStore = useAuthStore()
const user = ref({
  nombre: '',
  email: '',
  usuario: '',
  telefono: '',
  direccion: '',
  deuda: 0
})
const loading = ref(true)
const saving = ref(false)
const error = ref(null)
const success = ref(false)

const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})
const showPasswordDialog = ref(false)

onMounted(async () => {
  await loadUserProfile()
})

async function loadUserProfile() {
  try {
    loading.value = true
    error.value = null
    
    console.log('🔍 Loading user profile...')
    
    const response = await api.get('/users/profile')
    
    console.log('🔍 API response:', response)
    console.log('🔍 Response data:', response.data)
    
    // Verificar si la respuesta tiene datos
    if (!response.data) {
      throw new Error('No se recibieron datos del servidor')
    }
    
    // Asignar los datos recibidos del backend
    user.value = {
      nombre: response.data.nombre || '',
      email: response.data.email || '',
      usuario: response.data.usuario || '',
      telefono: response.data.telefono || '',
      direccion: response.data.direccion || '',
      deuda: response.data.deuda || 0
    }
    
    console.log('🔍 User data assigned:', user.value)
    
  } catch (err) {
    console.error('❌ Error al cargar perfil:', err)
    console.error('❌ Error details:', err.response?.data)
    error.value = `Error al cargar el perfil: ${err.response?.data?.message || err.message}`
  } finally {
    loading.value = false
  }
}

async function updateProfile() {
  try {
    saving.value = true
    error.value = null
    await api.put('/users/profile', user.value)
    success.value = true
    setTimeout(() => success.value = false, 3000)
  } catch (err) {
    console.error('Error al actualizar perfil:', err)
    error.value = 'Error al actualizar el perfil'
  } finally {
    saving.value = false
  }
}

async function changePassword() {
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    error.value = 'Las contraseñas no coinciden'
    return
  }
  
  try {
    await api.put('/auth/change-password', {
      currentPassword: passwordForm.value.currentPassword,
      newPassword: passwordForm.value.newPassword
    })
    showPasswordDialog.value = false
    passwordForm.value = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
    success.value = true
    setTimeout(() => success.value = false, 3000)
  } catch (err) {
    console.error('Error al cambiar contraseña:', err)
    error.value = 'Error al cambiar la contraseña'
  }
}
</script>

<template>
  <div>
    <v-row class="mb-6">
      <v-col>
        <h1 class="text-h4 font-weight-bold">Mi Perfil</h1>
        <p class="text-subtitle-1 text-grey-darken-1">Gestiona tu información personal</p>
      </v-col>
    </v-row>

    <v-alert v-if="error" type="error" class="mb-4">{{ error }}</v-alert>
    <v-alert v-if="success" type="success" class="mb-4">Perfil actualizado correctamente</v-alert>

    <v-row>
      <v-col cols="12" md="8">
        <v-card>
          <v-card-title>Información Personal</v-card-title>
          <v-card-text>
            <v-form v-if="!loading">
              <v-text-field
                v-model="user.nombre"
                label="Nombre completo"
                prepend-icon="mdi-account"
                readonly
              ></v-text-field>
              
              <v-text-field
                v-model="user.email"
                label="Email"
                prepend-icon="mdi-email"
                type="email"
                readonly
              ></v-text-field>
              
              <v-text-field
                v-model="user.usuario"
                label="Usuario"
                prepend-icon="mdi-account-circle"
                readonly
              ></v-text-field>
              
              <v-text-field
                v-model="user.deuda"
                label="Deuda actual"
                prepend-icon="mdi-currency-usd"
                readonly
                suffix="$"
              ></v-text-field>
              
              <!-- Debug info -->
              <v-expansion-panels v-if="!loading">
                <v-expansion-panel>
                  <v-expansion-panel-title>Información de Debug</v-expansion-panel-title>
                  <v-expansion-panel-text>
                    <pre>{{ JSON.stringify(user, null, 2) }}</pre>
                  </v-expansion-panel-text>
                </v-expansion-panel>
              </v-expansion-panels>
            </v-form>
            
            <v-skeleton-loader v-else type="article"></v-skeleton-loader>
          </v-card-text>
          
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn 
              color="grey" 
              variant="outlined"
              disabled
            >
              Datos de Solo Lectura
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
      
      <v-col cols="12" md="4">
        <v-card>
          <v-card-title>Seguridad</v-card-title>
          <v-card-text>
            <p class="text-body-2 mb-4">
              Mantén tu cuenta segura cambiando tu contraseña regularmente.
            </p>
            
            <v-btn 
              color="warning" 
              variant="outlined"
              block
              @click="showPasswordDialog = true"
            >
              Cambiar Contraseña
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Dialog para cambiar contraseña -->
    <v-dialog v-model="showPasswordDialog" max-width="500px">
      <v-card>
        <v-card-title>Cambiar Contraseña</v-card-title>
        <v-card-text>
          <v-form>
            <v-text-field
              v-model="passwordForm.currentPassword"
              label="Contraseña actual"
              type="password"
              required
            ></v-text-field>
            
            <v-text-field
              v-model="passwordForm.newPassword"
              label="Nueva contraseña"
              type="password"
              required
            ></v-text-field>
            
            <v-text-field
              v-model="passwordForm.confirmPassword"
              label="Confirmar nueva contraseña"
              type="password"
              required
            ></v-text-field>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="showPasswordDialog = false">
            Cancelar
          </v-btn>
          <v-btn color="primary" @click="changePassword">
            Cambiar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>