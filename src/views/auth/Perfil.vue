<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../../stores/auth'
import api from '../../services/api'

const authStore = useAuthStore()
const user = ref({
  nombre: '',
  email: '',
  telefono: '',
  direccion: ''
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
    const response = await api.get('/users/profile')
    user.value = response.data
  } catch (err) {
    console.error('Error al cargar perfil:', err)
    error.value = 'Error al cargar el perfil'
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
    await api.put('/users/change-password', {
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
                required
              ></v-text-field>
              
              <v-text-field
                v-model="user.email"
                label="Email"
                prepend-icon="mdi-email"
                type="email"
                required
              ></v-text-field>
              
              <v-text-field
                v-model="user.telefono"
                label="Teléfono"
                prepend-icon="mdi-phone"
              ></v-text-field>
              
              <v-textarea
                v-model="user.direccion"
                label="Dirección"
                prepend-icon="mdi-map-marker"
                rows="3"
              ></v-textarea>
            </v-form>
            
            <v-skeleton-loader v-else type="article"></v-skeleton-loader>
          </v-card-text>
          
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn 
              color="primary" 
              @click="updateProfile"
              :loading="saving"
              :disabled="loading"
            >
              Guardar Cambios
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
        
        <v-card class="mt-4">
          <v-card-title>Información de la Cuenta</v-card-title>
          <v-card-text>
            <div class="mb-2">
              <strong>Usuario:</strong> {{ authStore.getUser?.email }}
            </div>
            <div class="mb-2">
              <strong>Rol:</strong> {{ authStore.getUser?.rol || 'Usuario' }}
            </div>
            <div>
              <strong>Último acceso:</strong> {{ new Date().toLocaleDateString() }}
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Dialog para cambiar contraseña -->
    <v-dialog v-model="showPasswordDialog" max-width="400px">
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
          <v-btn color="primary" variant="elevated" @click="changePassword">
            Cambiar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>