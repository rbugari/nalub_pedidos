<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../../services/api'
import { formatCurrency } from '../../utils/currency'

const route = useRoute()
const router = useRouter()
const pedido = ref(null)
const loading = ref(true)
const error = ref(null)
const statusOptions = [
  { value: 'pendiente', title: 'Pendiente', color: 'orange' },
  { value: 'en_proceso', title: 'En Proceso', color: 'blue' },
  { value: 'completado', title: 'Completado', color: 'green' },
  { value: 'cancelado', title: 'Cancelado', color: 'red' }
]

onMounted(async () => {
  await loadPedido()
})

async function loadPedido() {
  try {
    loading.value = true
    const response = await api.get(`/pedidos/${route.params.id}`)
    pedido.value = response.data
  } catch (err) {
    console.error('Error al cargar pedido:', err)
    error.value = 'Error al cargar el pedido'
  } finally {
    loading.value = false
  }
}



function getStatusColor(estado) {
  const status = statusOptions.find(s => s.value === estado)
  return status ? status.color : 'grey'
}

function getStatusTitle(estado) {
  const status = statusOptions.find(s => s.value === estado)
  return status ? status.title : estado
}

function goBack() {
  router.push('/pedidos')
}
</script>

<template>
  <div>
    <v-row class="mb-6">
      <v-col>
        <v-btn 
          icon="mdi-arrow-left" 
          variant="text" 
          @click="goBack"
          class="mr-2"
        ></v-btn>
        <span class="text-h4 font-weight-bold">Pedido #{{ route.params.id }}</span>
      </v-col>

    </v-row>

    <v-alert v-if="error" type="error" class="mb-4">{{ error }}</v-alert>

    <v-row v-if="loading">
      <v-col>
        <v-skeleton-loader type="card" />
      </v-col>
    </v-row>

    <template v-else-if="pedido">
      <!-- Información del pedido -->
      <v-row>
        <v-col cols="12" md="8">
          <v-card class="mb-4">
            <v-card-title>Información del Pedido</v-card-title>
            <v-card-text>
              <v-row>
                <v-col cols="6">
                  <strong>Cliente:</strong> {{ pedido.cliente }}
                </v-col>
                <v-col cols="6">
                  <strong>Fecha:</strong> {{ new Date(pedido.fecha).toLocaleDateString() }}
                </v-col>
                <v-col cols="6">
                  <strong>Estado:</strong>
                  <v-chip 
                    :color="getStatusColor(pedido.estado)" 
                    size="small" 
                    class="ml-2"
                  >
                    {{ getStatusTitle(pedido.estado) }}
                  </v-chip>
                </v-col>
                <v-col cols="6">
                  <strong>Total:</strong> {{ formatCurrency(pedido.total) }}
                </v-col>
                <v-col cols="12" v-if="pedido.notas">
                  <strong>Notas:</strong> {{ pedido.notas }}
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-col>
        
        <v-col cols="12" md="4">
          <v-card>
            <v-card-title>Resumen</v-card-title>
            <v-card-text>
              <div class="d-flex justify-space-between mb-2">
                <span>Subtotal:</span>
                <span>{{ formatCurrency(pedido.total * 0.79) }}</span>
              </div>
              <div class="d-flex justify-space-between mb-2">
                <span>IVA (21%):</span>
                <span>{{ formatCurrency(pedido.total * 0.21) }}</span>
              </div>
              <v-divider class="my-2"></v-divider>
              <div class="d-flex justify-space-between font-weight-bold">
                <span>Total:</span>
                <span>{{ formatCurrency(pedido.total) }}</span>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Productos del pedido -->
      <v-card>
        <v-card-title>Productos</v-card-title>
        <v-card-text>
          <v-data-table
            :headers="[
              { title: 'Producto', key: 'producto.nombre' },
              { title: 'Cantidad', key: 'cantidad', align: 'end' },
              { title: 'Precio Unitario', key: 'precio_unitario', align: 'end' },
              { title: 'Subtotal', key: 'subtotal', align: 'end' }
            ]"
            :items="pedido.items || []"
            hide-default-footer
          >
            <template v-slot:item.precio_unitario="{ item }">
              {{ formatCurrency(item.precio_unitario) }}
            </template>
            <template v-slot:item.subtotal="{ item }">
              {{ formatCurrency(item.subtotal) }}
            </template>
          </v-data-table>
        </v-card-text>
      </v-card>
    </template>


  </div>
</template>