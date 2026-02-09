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
  deuda: 0,
  cuit: '',
  porcentaje1: 0,
  porcentaje2: 0,
  porcentaje3: 0
})
const loading = ref(true)
const saving = ref(false)
const error = ref(null)
const success = ref(false)
const isEditing = ref(false)

// Referencias y estado para cambio de contraseña
const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})
const showPasswordDialog = ref(false)
const passwordFormRef = ref(null)
const changingPassword = ref(false)
const passwordError = ref(null)
const passwordSuccess = ref(false)

// Reglas de validación
const passwordRules = {
  currentPassword: [
    v => !!v || 'La contraseña actual es requerida'
  ],
  newPassword: [
    v => !!v || 'La nueva contraseña es requerida',
    v => (v && v.length >= 6) || 'La contraseña debe tener al menos 6 caracteres'
  ],
  confirmPassword: [
    v => !!v || 'Confirmar contraseña es requerido',
    v => v === passwordForm.value.newPassword || 'Las contraseñas no coinciden'
  ]
}

// Reglas de validación para perfil
const profileRules = {
  cuit: [
    v => !v || /^\d{2}-\d{8}-\d{1}$/.test(v) || 'Formato CUIT inválido (XX-XXXXXXXX-X)'
  ],
  porcentaje: [
    v => !v || (Number(v) >= 0 && Number(v) <= 100) || 'El porcentaje debe estar entre 0 y 100'
  ]
}

onMounted(async () => {
  await loadUserProfile()
})

async function loadUserProfile() {
  try {
    loading.value = true
    error.value = null
    
    console.log('🔍 Loading user profile...')
    
    const response = await api.get('/users/profile')
    
    console.log('🔍 Profile response:', response.data)
    
    // Asignar datos del usuario
    user.value = {
      ...response.data,
      cuit: response.data.cuit || '',
      porcentaje1: response.data.porcentaje1 || 0,
      porcentaje2: response.data.porcentaje2 || 0,
      porcentaje3: response.data.porcentaje3 || 0
    }
    
    console.log('🔍 User data loaded:', user.value)
    
  } catch (err) {
    console.error('Error loading profile:', err)
    console.error('Error details:', err.response?.data)
    
    if (err.response?.status === 401) {
      error.value = 'Sesión expirada. Por favor inicia sesión nuevamente.'
      authStore.logout()
    } else {
      error.value = 'Error al cargar el perfil. Intenta nuevamente.'
    }
  } finally {
    loading.value = false
  }
}

async function updateProfile() {
  try {
    saving.value = true
    error.value = null
    
    console.log('🔍 Updating profile with data:', {
      cuit: user.value.cuit,
      porcentaje1: user.value.porcentaje1,
      porcentaje2: user.value.porcentaje2,
      porcentaje3: user.value.porcentaje3
    })
    
    const response = await api.put('/users/profile', {
      cuit: user.value.cuit,
      porcentaje1: user.value.porcentaje1,
      porcentaje2: user.value.porcentaje2,
      porcentaje3: user.value.porcentaje3
    })
    
    console.log('🔍 Profile update response:', response.data)
    
    success.value = true
    isEditing.value = false
    
    // Limpiar mensaje de éxito después de 3 segundos
    setTimeout(() => {
      success.value = false
    }, 3000)
    
  } catch (err) {
    console.error('Error updating profile:', err)
    console.error('Error details:', err.response?.data)
    
    if (err.response?.data?.message) {
      error.value = err.response.data.message
    } else {
      error.value = 'Error al actualizar el perfil. Intenta nuevamente.'
    }
  } finally {
    saving.value = false
  }
}

function toggleEdit() {
  isEditing.value = !isEditing.value
  if (!isEditing.value) {
    // Si se cancela la edición, recargar los datos originales
    loadUserProfile()
  }
}

async function changePassword() {
  passwordError.value = null
  
  if (!passwordFormRef.value) {
    passwordError.value = 'Error en el formulario'
    return
  }
  
  const { valid } = await passwordFormRef.value.validate()
  if (!valid) {
    passwordError.value = 'Por favor corrige los errores en el formulario'
    return
  }
  
  try {
    changingPassword.value = true
    
    const response = await api.put('/auth/change-password', {
      currentPassword: passwordForm.value.currentPassword,
      newPassword: passwordForm.value.newPassword
    })
    
    // Mostrar mensaje de éxito específico para cambio de contraseña
    passwordSuccess.value = true
    
    // Cerrar diálogo y limpiar formulario después de un breve delay
    setTimeout(() => {
      showPasswordDialog.value = false
      passwordForm.value = {
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }
      
      // Resetear validación del formulario
      if (passwordFormRef.value) {
        passwordFormRef.value.reset()
      }
      
      // Limpiar mensaje de éxito después de cerrar el diálogo
      setTimeout(() => {
        passwordSuccess.value = false
      }, 3000)
    }, 2000)
    
  } catch (err) {
    console.error('Error al cambiar contraseña:', err)
    console.error('Error details:', err.response?.data)
    
    // Mostrar mensaje específico del backend
    if (err.response?.data?.message) {
      passwordError.value = err.response.data.message
    } else {
      passwordError.value = 'Error al cambiar la contraseña. Intenta nuevamente.'
    }
  } finally {
    changingPassword.value = false
  }
}

function closePasswordDialog() {
  showPasswordDialog.value = false
  passwordError.value = null
  passwordSuccess.value = false
  passwordForm.value = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  }
  if (passwordFormRef.value) {
    passwordFormRef.value.reset()
  }
}
</script>

<template>
  <div>
    <v-row class="mb-6">
      <v-col>
        <div class="d-flex align-center mb-2">
          <v-icon size="40" color="primary" class="mr-3">mdi-account-cog</v-icon>
          <div>
            <h1 class="text-h4 font-weight-bold mb-0">Mi Perfil</h1>
            <p class="text-subtitle-1 text-grey-darken-1 mb-0">Gestiona tu información personal</p>
          </div>
        </div>
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
              
              <!-- Campos editables -->
              <v-text-field
                v-model="user.cuit"
                label="CUIT"
                prepend-icon="mdi-card-account-details"
                :readonly="!isEditing"
                :rules="isEditing ? profileRules.cuit : []"
                placeholder="XX-XXXXXXXX-X"
                hint="Formato: XX-XXXXXXXX-X"
                persistent-hint
              ></v-text-field>
              
              <v-text-field
                v-model="user.porcentaje1"
                label="Porcentaje 1"
                prepend-icon="mdi-percent"
                :readonly="!isEditing"
                :rules="isEditing ? profileRules.porcentaje : []"
                type="number"
                min="0"
                max="100"
                suffix="%"
              ></v-text-field>
              
              <v-text-field
                v-model="user.porcentaje2"
                label="Porcentaje 2"
                prepend-icon="mdi-percent"
                :readonly="!isEditing"
                :rules="isEditing ? profileRules.porcentaje : []"
                type="number"
                min="0"
                max="100"
                suffix="%"
              ></v-text-field>
              
              <v-text-field
                v-model="user.porcentaje3"
                label="Porcentaje 3"
                prepend-icon="mdi-percent"
                :readonly="!isEditing"
                :rules="isEditing ? profileRules.porcentaje : []"
                type="number"
                min="0"
                max="100"
                suffix="%"
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
            
            <!-- Botones de edición -->
            <template v-if="!isEditing">
              <v-btn 
                color="primary" 
                variant="outlined"
                @click="toggleEdit"
                prepend-icon="mdi-pencil"
              >
                Editar Datos
              </v-btn>
            </template>
            
            <template v-else>
              <v-btn 
                color="grey" 
                variant="text"
                @click="toggleEdit"
                :disabled="saving"
              >
                Cancelar
              </v-btn>
              <v-btn 
                color="primary" 
                @click="updateProfile"
                :loading="saving"
                :disabled="saving"
                prepend-icon="mdi-content-save"
              >
                Guardar Cambios
              </v-btn>
            </template>
          </v-card-actions>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card>
          <v-card-title>Seguridad</v-card-title>
          <v-card-text>
            <p class="text-body-2 mb-4">Mantén tu cuenta segura cambiando tu contraseña regularmente.</p>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn 
              color="primary" 
              variant="outlined"
              @click="showPasswordDialog = true"
              prepend-icon="mdi-lock-reset"
            >
              Cambiar Contraseña
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- Diálogo para cambio de contraseña -->
    <v-dialog v-model="showPasswordDialog" max-width="500px" persistent>
      <v-card>
        <v-card-title>
          <span class="text-h5">Cambiar Contraseña</span>
        </v-card-title>
        
        <!-- Alerta de éxito dentro del diálogo -->
        <v-alert 
          v-if="passwordSuccess" 
          type="success" 
          class="ma-4"
          prepend-icon="mdi-check"
        >
          Contraseña cambiada correctamente
        </v-alert>
        
        <v-alert v-if="passwordError" type="error" class="ma-4">{{ passwordError }}</v-alert>
        
        <v-card-text>
          <v-form ref="passwordFormRef">
            <v-text-field
              v-model="passwordForm.currentPassword"
              label="Contraseña actual"
              type="password"
              prepend-icon="mdi-lock"
              :rules="passwordRules.currentPassword"
              :disabled="changingPassword"
              required
            ></v-text-field>
            
            <v-text-field
              v-model="passwordForm.newPassword"
              label="Nueva contraseña"
              type="password"
              prepend-icon="mdi-lock-plus"
              :rules="passwordRules.newPassword"
              :disabled="changingPassword"
              hint="Mínimo 6 caracteres"
              required
            ></v-text-field>
            
            <v-text-field
              v-model="passwordForm.confirmPassword"
              label="Confirmar nueva contraseña"
              type="password"
              prepend-icon="mdi-lock-check"
              :rules="passwordRules.confirmPassword"
              :disabled="changingPassword"
              required
            ></v-text-field>
          </v-form>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn 
            color="grey" 
            variant="text" 
            @click="closePasswordDialog"
            :disabled="changingPassword"
          >
            Cancelar
          </v-btn>
          <v-btn 
            color="primary" 
            @click="changePassword"
            :loading="changingPassword"
            :disabled="changingPassword"
          >
            <v-icon left>mdi-check</v-icon>
            Cambiar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>