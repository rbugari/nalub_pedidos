<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import api from '../../services/api'
import { formatCurrency } from '../../utils/currency'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const pedidos = ref([])
const loading = ref(true)
const error = ref(null)
const search = ref('')

const headers = [
  { title: 'Fecha Entrega', key: 'fechaEntrega', sortable: true },
  { title: 'Tipo Cliente', key: 'tipo_cliente', sortable: true },
  { title: 'Cantidad Bultos', key: 'cantidadBultos', sortable: true, align: 'end' },
  { title: 'Importe Total', key: 'importeTotal', sortable: true, align: 'end' },
  { title: 'Estado', key: 'estado', sortable: true },
  { title: 'Acciones', key: 'actions', sortable: false }
]

onMounted(async () => {
  console.log('🔍 Frontend: Componente PedidosList montado, iniciando carga...')
  console.log('🔍 Auth store state:', authStore.isAuthenticated)
  console.log('🔍 Current route:', route.path)
  console.log('🔍 About to call loadPedidos')
  await loadPedidos()
})

async function loadPedidos() {
  console.log('🔍 loadPedidos function called')
  try {
    console.log('🔍 Frontend: Iniciando carga de pedidos...')
    loading.value = true
    const response = await api.get('/pedidos')
    console.log('🔍 Frontend: Respuesta del API:', response.data)
    if (response.data.success && response.data.data) {
      pedidos.value = response.data.data
      console.log('🔍 Frontend: Pedidos cargados:', pedidos.value.length)
    } else {
      pedidos.value = []
      console.log('🔍 Frontend: No se encontraron pedidos o respuesta sin éxito')
      console.log('🔍 Frontend: Success:', response.data.success)
      console.log('🔍 Frontend: Data:', response.data.data)
    }
  } catch (err) {
    console.error('🔍 Frontend: Error al cargar pedidos:', err)
    error.value = 'Error al cargar los pedidos'
  } finally {
    loading.value = false
  }
}

function viewPedido(pedidoId) {
  router.push(`/pedidos/${pedidoId}`)
}

function getStatusColor(estado) {
  switch (estado) {
    case 'pendiente': return 'orange'
    case 'en_proceso': return 'blue'
    case 'completado': return 'green'
    case 'cancelado': return 'red'
    default: return 'grey'
  }
}

function formatDate(dateString) {
  if (!dateString) return 'Sin fecha'
  return new Date(dateString).toLocaleDateString('es-AR')
}


</script>

<template>
  <div>
    <v-row class="mb-6">
      <v-col>
        <div class="d-flex align-center mb-2">
          <v-icon size="40" color="primary" class="mr-3">mdi-clipboard-check-outline</v-icon>
          <div>
            <h1 class="text-h4 font-weight-bold mb-0">Historial de Pedidos</h1>
            <p class="text-subtitle-1 text-grey-darken-1 mb-0">Pedidos de los últimos 365 días</p>
          </div>
        </div>
      </v-col>
    </v-row>

    <v-alert v-if="error" type="error" class="mb-4">{{ error }}</v-alert>

    <v-card>
      <v-card-title>
        <v-text-field
          v-model="search"
          append-icon="mdi-magnify"
          label="Buscar pedidos..."
          single-line
          hide-details
          class="mb-4"
        ></v-text-field>
      </v-card-title>
      
      <v-data-table
        :headers="headers"
        :items="pedidos"
        :loading="loading"
        :search="search"
        loading-text="Cargando pedidos..."
        no-data-text="No hay pedidos disponibles"
      >
        <template v-slot:item.fechaEntrega="{ item }">
          {{ formatDate(item.fechaEntrega) }}
        </template>
        
        <template v-slot:item.importeTotal="{ item }">
          <span class="font-weight-bold">{{ formatCurrency(item.importeTotal) }}</span>
        </template>
        
        <template v-slot:item.tipo_cliente="{ item }">
          <v-chip
            :color="item.tipo_cliente === 'principal' ? 'primary' : 'secondary'"
            size="small"
            variant="elevated"
          >
            {{ item.tipo_cliente === 'principal' ? 'Principal' : 'Secundario' }}
          </v-chip>
        </template>
        
        <template v-slot:item.cantidadBultos="{ item }">
          {{ item.cantidadBultos }}
        </template>
        
        <template v-slot:item.estado="{ item }">
          <v-chip
            :color="getStatusColor(item.estado)"
            size="small"
            variant="elevated"
          >
            {{ item.estado.replace('_', ' ') }}
          </v-chip>
        </template>
        
        <template v-slot:item.actions="{ item }">
          <v-btn
            icon="mdi-eye"
            size="small"
            variant="text"
            @click="viewPedido(item.id)"
          ></v-btn>
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>