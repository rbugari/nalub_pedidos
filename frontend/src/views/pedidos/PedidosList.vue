<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../../services/api'

const router = useRouter()
const pedidos = ref([])
const loading = ref(true)
const error = ref(null)
const search = ref('')

const headers = [
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Cliente', key: 'cliente', sortable: true },
  { title: 'Fecha', key: 'fecha', sortable: true },
  { title: 'Total', key: 'total', sortable: true },
  { title: 'Estado', key: 'estado', sortable: true },
  { title: 'Acciones', key: 'actions', sortable: false }
]

onMounted(async () => {
  await loadPedidos()
})

async function loadPedidos() {
  try {
    loading.value = true
    const response = await api.get('/pedidos')
    pedidos.value = response.data.data
  } catch (err) {
    console.error('Error al cargar pedidos:', err)
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
</script>

<template>
  <div>
    <v-row class="mb-6">
      <v-col>
        <h1 class="text-h4 font-weight-bold">Pedidos</h1>
        <p class="text-subtitle-1 text-grey-darken-1">Historial de todos los pedidos</p>
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
        <template v-slot:item.fecha="{ item }">
          {{ new Date(item.fecha).toLocaleDateString() }}
        </template>
        
        <template v-slot:item.total="{ item }">
          {{ item.total }}€
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