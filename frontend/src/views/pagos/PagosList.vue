<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../../stores/auth'
import pagosService from '../../services/pagosService'
import { formatCurrency } from '../../utils/currency'

const authStore = useAuthStore()
const pagos = ref([])
const loading = ref(false)
const error = ref('')

const headers = [
  { title: 'Fecha', key: 'fecha', sortable: true },
  { title: 'Medio de Pago', key: 'medio_pago', sortable: true },
  { title: 'Importe', key: 'importe', sortable: true, align: 'end' },
  { title: 'Receptor', key: 'receptor', sortable: true }
]

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

const loadPagos = async () => {
  try {
    loading.value = true
    error.value = ''
    console.log('🔍 Frontend: Iniciando carga de pagos...')
    const response = await pagosService.getPagos()
    console.log('🔍 Frontend: Respuesta recibida:', response.data)
    
    // Los datos están en response.data.data según la estructura del backend
    const pagosData = response.data.data || response.data
    console.log('🔍 Frontend: Datos de pagos:', pagosData)
    
    pagos.value = pagosData.map(pago => ({
      ...pago,
      fecha: formatDate(pago.fecha),
      importe: formatCurrency(pago.importe)
    }))
    console.log('🔍 Frontend: Pagos procesados:', pagos.value)
  } catch (err) {
    console.error('❌ Frontend: Error al cargar pagos:', err)
    error.value = 'Error al cargar los pagos. Por favor, intente nuevamente.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadPagos()
})
</script>

<template>
  <div>
    <!-- Header -->
    <v-row class="mb-4">
      <v-col>
        <h1 class="text-h4 font-weight-bold text-primary">Pagos</h1>
        <p class="text-subtitle-1 text-grey-600">Historial de los últimos pagos realizados</p>
      </v-col>
    </v-row>

    <v-alert v-if="error" type="error" class="mb-4">{{ error }}</v-alert>

    <v-card elevation="2">
      <v-card-title class="bg-grey-lighten-4">
        <v-icon class="mr-2">mdi-credit-card-outline</v-icon>
        Últimos 5 Pagos
      </v-card-title>
      
      <v-data-table
        :headers="headers"
        :items="pagos"
        :loading="loading"
        loading-text="Cargando pagos..."
        no-data-text="No hay pagos registrados"
        class="elevation-0"
        :items-per-page="5"
        :items-per-page-options="[5]"
        hide-default-footer
      >
        <template v-slot:item.fecha="{ item }">
          <span class="font-weight-medium">{{ item.fecha }}</span>
        </template>
        
        <template v-slot:item.medio_pago="{ item }">
          <v-chip
            size="small"
            color="primary"
            variant="outlined"
          >
            {{ item.medio_pago }}
          </v-chip>
        </template>
        
        <template v-slot:item.importe="{ item }">
          <span class="font-weight-bold text-success">{{ item.importe }}</span>
        </template>
        
        <template v-slot:item.receptor="{ item }">
          <span class="text-body-2">{{ item.receptor }}</span>
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>

<style scoped>
.v-data-table {
  border-radius: 0 0 4px 4px;
}
</style>