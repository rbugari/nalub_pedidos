<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'

const router = useRouter()

const prepedidos = ref([])
const loading = ref(true)
const error = ref(null)
const dialog = ref(false)
const selectedPrepedido = ref(null)

const headers = [
  { title: 'Fecha', key: 'fecha', sortable: true },
  { title: 'Total', key: 'total', sortable: true, align: 'end' },
  { title: 'Estado', key: 'estado', sortable: true },
  { title: 'Acciones', key: 'actions', sortable: false }
]

onMounted(async () => {
  await loadPrepedidos()
})

async function loadPrepedidos() {
  try {
    loading.value = true
    const response = await api.get('/prepedidos')
    prepedidos.value = response.data.data || []
  } catch (err) {
    console.error('Error al cargar prepedidos:', err)
    error.value = 'Error al cargar los prepedidos'
  } finally {
    loading.value = false
  }
}

function viewPrepedido(prepedido) {
  selectedPrepedido.value = prepedido
  dialog.value = true
}

function editPrepedido(prepedidoId) {
  router.push(`/prepedidos/editar/${prepedidoId}`)
}

async function enviarPrepedido(prepedidoId) {
  try {
    await api.put(`/prepedidos/${prepedidoId}/enviar`)
    await loadPrepedidos()
    // Mostrar mensaje de éxito
  } catch (err) {
    console.error('Error al enviar prepedido:', err)
    // Mostrar mensaje de error
  }
}

function getStatusColor(estado) {
  switch (estado) {
    case 'borrador': return 'orange'
    case 'enviado': return 'green'
    case 'cerrado': return 'grey'
    default: return 'grey'
  }
}
</script>

<template>
  <div>
    <v-row class="mb-6">
      <v-col>
        <h1 class="text-h4 font-weight-bold">Prepedidos</h1>
        <p class="text-subtitle-1 text-grey-darken-1">Gestión de prepedidos pendientes</p>
      </v-col>
      <v-col cols="auto">
        <v-btn color="primary" prepend-icon="mdi-plus" @click="router.push('/prepedidos/nuevo')">
          Nuevo Prepedido
        </v-btn>
      </v-col>
    </v-row>

    <v-alert v-if="error" type="error" class="mb-4">{{ error }}</v-alert>

    <v-card>
      <v-data-table
        :headers="headers"
        :items="prepedidos"
        :loading="loading"
        loading-text="Cargando prepedidos..."
        no-data-text="No hay prepedidos disponibles"
        :sort-by="[{ key: 'fecha', order: 'desc' }]"
      >
        <template v-slot:item.fecha="{ item }">
          {{ new Date(item.fecha_creacion).toLocaleDateString() }}
        </template>
        
        <template v-slot:item.total="{ item }">
          €{{ parseFloat(item.total_estimado || 0).toFixed(2) }}
        </template>
        
        <template v-slot:item.estado="{ item }">
          <v-chip
            :color="getStatusColor(item.estado)"
            size="small"
            variant="elevated"
          >
            {{ item.estado }}
          </v-chip>
        </template>
        
        <template v-slot:item.actions="{ item }">
          <!-- Siempre mostrar ver -->
          <v-btn
            icon="mdi-eye"
            size="small"
            variant="text"
            @click="viewPrepedido(item)"
          ></v-btn>
          <!-- Solo para prepedidos en borrador -->
          <v-btn
            v-if="item.estado === 'borrador'"
            icon="mdi-pencil"
            size="small"
            variant="text"
            color="primary"
            @click="editPrepedido(item.id)"
          ></v-btn>
          <v-btn
            v-if="item.estado === 'borrador'"
            icon="mdi-send"
            size="small"
            variant="text"
            color="success"
            @click="enviarPrepedido(item.id)"
          ></v-btn>
        </template>
      </v-data-table>
    </v-card>

    <!-- Dialog para ver detalles del prepedido -->
    <v-dialog v-model="dialog" max-width="600px">
      <v-card v-if="selectedPrepedido">
        <v-card-title>
          <span class="text-h5">Prepedido #{{ selectedPrepedido.id }}</span>
        </v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="6">
              <strong>Cliente:</strong> {{ selectedPrepedido.cliente }}
            </v-col>
            <v-col cols="6">
              <strong>Fecha:</strong> {{ new Date(selectedPrepedido.fecha_creacion).toLocaleDateString() }}
            </v-col>
            <v-col cols="6">
              <strong>Estado:</strong> 
              <v-chip :color="getStatusColor(selectedPrepedido.estado)" size="small">
                {{ selectedPrepedido.estado }}
              </v-chip>
            </v-col>
            <v-col cols="6">
              <strong>Total:</strong> €{{ parseFloat(selectedPrepedido.total_estimado || 0).toFixed(2) }}
            </v-col>
            <v-col cols="6">
              <strong>Items:</strong> {{ selectedPrepedido.total_items }}
            </v-col>
          </v-row>
          
          <v-divider class="my-4"></v-divider>
          
          <h3 class="mb-3">Productos</h3>
          <v-list>
            <v-list-item
              v-for="producto in selectedPrepedido.productos"
              :key="producto.id"
            >
              <v-list-item-title>{{ producto.nombre }}</v-list-item-title>
              <v-list-item-subtitle>
                Cantidad: {{ producto.cantidad }} - Precio: {{ producto.precio }}€
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="dialog = false">
            Cerrar
          </v-btn>
          <v-btn
            v-if="selectedPrepedido.estado === 'borrador'"
            color="primary"
            variant="elevated"
            @click="editPrepedido(selectedPrepedido.id); dialog = false"
          >
            Editar
          </v-btn>
          <v-btn
            v-if="selectedPrepedido.estado === 'borrador'"
            color="success"
            variant="elevated"
            @click="enviarPrepedido(selectedPrepedido.id); dialog = false"
          >
            Enviar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>