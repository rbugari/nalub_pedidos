<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'
import { formatCurrency } from '../../utils/currency'

const router = useRouter()
const prepedidos = ref([])
const loading = ref(true)
const error = ref(null)
const dialog = ref(false)
const selectedPrepedido = ref(null)
const loadingDetails = ref(false)
const confirmDialog = ref(false)
const prepedidoToSend = ref(null)

// Computed property para verificar si existe un prepedido en borrador
const hasPrepedidoBorrador = computed(() => {
  return prepedidos.value.some(prepedido => prepedido.estado === 'borrador')
})

const headers = [
  { title: 'Fecha', key: 'fecha_creacion', sortable: true },
  { title: 'Total', key: 'total_estimado', sortable: true, align: 'end' },
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
    prepedidos.value = response.data.data || response.data
  } catch (err) {
    console.error('Error al cargar prepedidos:', err)
    error.value = 'Error al cargar los prepedidos'
  } finally {
    loading.value = false
  }
}

async function viewPrepedido(prepedido) {
  try {
    loadingDetails.value = true
    dialog.value = true
    
    // Cargar detalles completos del prepedido
    const response = await api.get(`/prepedidos/${prepedido.id}`)
    selectedPrepedido.value = response.data.data || response.data
    
    // DEBUG: Verificar valores de ofertaid - LOGS MÁS VISIBLES
    console.log('🟢🟢🟢 PREPEDIDOS DEBUG - INICIO 🟢🟢🟢')
    console.log('📋 Prepedido ID:', selectedPrepedido.value.id)
    console.log('📋 Total items:', selectedPrepedido.value.items?.length || 0)
    
    if (selectedPrepedido.value.items) {
      console.log('📦 ANÁLISIS DE ITEMS:')
      selectedPrepedido.value.items.forEach((item, index) => {
        const hasOffer = !!item.ofertaid
        console.log(`📦 Item ${index + 1}:`, {
          id: item.id,
          descripcion: item.descripcion,
          ofertaid: item.ofertaid,
          hasOfertaid: hasOffer,
          status: hasOffer ? '🎯 TIENE OFERTA' : '⚪ SIN OFERTA'
        })
      })
      
      const itemsConOferta = selectedPrepedido.value.items.filter(item => !!item.ofertaid)
      console.log(`🎯 RESUMEN: ${itemsConOferta.length} items con oferta de ${selectedPrepedido.value.items.length} totales`)
      
      if (itemsConOferta.length > 0) {
        console.log('🎯 Items con oferta encontrados:', itemsConOferta.map(item => ({
          id: item.id,
          descripcion: item.descripcion,
          ofertaid: item.ofertaid
        })))
      }
    } else {
      console.log('❌ No hay items en el prepedido')
    }
    console.log('🟢🟢🟢 PREPEDIDOS DEBUG - FIN 🟢🟢🟢')
  } catch (err) {
    console.error('Error al cargar detalles del prepedido:', err)
    selectedPrepedido.value = prepedido // Fallback a los datos básicos
  } finally {
    loadingDetails.value = false
  }
}

function editPrepedido(prepedido) {
  router.push(`/prepedidos/editar/${prepedido.id}`)
}

function mostrarConfirmacionEnvio(prepedidoId) {
  prepedidoToSend.value = prepedidoId
  confirmDialog.value = true
}

async function confirmarEnvioPrepedido() {
  try {
    await api.put(`/prepedidos/${prepedidoToSend.value}/enviar`)
    await loadPrepedidos()
    confirmDialog.value = false
    prepedidoToSend.value = null
    // Mostrar mensaje de éxito
  } catch (err) {
    console.error('Error al enviar prepedido:', err)
    // Mostrar mensaje de error
  }
}

function cancelarEnvio() {
  confirmDialog.value = false
  prepedidoToSend.value = null
}

function getStatusColor(estado) {
  switch (estado) {
    case 'borrador': return 'orange'
    case 'enviado': return 'green'
    case 'procesado': return 'blue'
    case 'rechazado': return 'red'
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
        <v-tooltip :text="hasPrepedidoBorrador ? 'Ya existe un prepedido en borrador. Solo puede haber uno abierto.' : 'Crear nuevo prepedido'">
          <template v-slot:activator="{ props }">
            <v-btn 
              v-bind="props"
              color="primary" 
              prepend-icon="mdi-plus"
              :disabled="hasPrepedidoBorrador"
              @click="router.push('/prepedidos/nuevo')"
            >
              Nuevo Prepedido
            </v-btn>
          </template>
        </v-tooltip>
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
        :sort-by="[{ key: 'fecha_creacion', order: 'desc' }]"
      >
        <template v-slot:item.fecha_creacion="{ item }">
          {{ new Date(item.fecha_creacion).toLocaleDateString() }}
        </template>
        
        <template v-slot:item.total_estimado="{ item }">
          <span class="font-weight-bold text-primary">{{ formatCurrency(item.total_estimado) }}</span>
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
          <template v-if="item.estado === 'borrador'">
            <v-btn
              icon="mdi-pencil"
              size="small"
              variant="text"
              color="primary"
              @click="editPrepedido(item)"
            ></v-btn>
            <v-btn
              icon="mdi-send"
              size="small"
              variant="text"
              color="success"
              @click="mostrarConfirmacionEnvio(item.id)"
            ></v-btn>
          </template>
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
              <strong>Total:</strong> {{ formatCurrency(selectedPrepedido.total_estimado) }}
            </v-col>
            <v-col cols="6">
              <strong>Items:</strong> {{ selectedPrepedido.total_items }}
            </v-col>
          </v-row>
          
          <v-divider class="my-4"></v-divider>
          
          <h3 class="mb-3">Productos</h3>
          <v-data-table
            :headers="[
              { title: 'Producto', key: 'descripcion', sortable: false },
              { title: 'Cantidad', key: 'cantidad', sortable: false, align: 'end' },
              { title: 'Unidad', key: 'unidad', sortable: false, align: 'center' },
              { title: 'Precio Unit.', key: 'precio_estimado', sortable: false, align: 'end' },
              { title: 'Subtotal', key: 'subtotal', sortable: false, align: 'end' }
            ]"
            :items="selectedPrepedido?.items?.map(item => ({
              ...item,
              subtotal: item.cantidad * item.precio_estimado
            })) || []"
            :loading="loadingDetails"
            loading-text="Cargando productos..."
            no-data-text="No hay productos en este prepedido"
            density="compact"
            hide-default-footer
            :row-props="({ item }) => ({
              class: item.ofertaid ? 'bg-green-lighten-3' : ''
            })"
          >
            <template v-slot:item.descripcion="{ item }">
              <div class="d-flex align-center">
                <span>{{ item.descripcion }}</span>
                <v-chip 
                  v-if="item.ofertaid" 
                  color="success" 
                  size="x-small" 
                  variant="elevated"
                  class="ml-2"
                >
                  🎯 OFERTA
                </v-chip>
              </div>
            </template>
            
            <template v-slot:item.cantidad="{ item }">
              <span class="text-right">{{ item.cantidad }}</span>
            </template>
            
            <template v-slot:item.precio_estimado="{ item }">
              <span class="text-right">{{ formatCurrency(item.precio_estimado) }}</span>
            </template>
            
            <template v-slot:item.subtotal="{ item }">
              <span class="font-weight-bold text-right">{{ formatCurrency(item.subtotal) }}</span>
            </template>
          </v-data-table>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="dialog = false">
            Cerrar
          </v-btn>
          
          <!-- Solo para prepedidos en borrador -->
          <template v-if="selectedPrepedido.estado === 'borrador'">
            <v-btn
              color="primary"
              variant="elevated"
              @click="editPrepedido(selectedPrepedido); dialog = false"
            >
              Editar
            </v-btn>
            <v-btn
              color="success"
              variant="elevated"
              @click="mostrarConfirmacionEnvio(selectedPrepedido.id); dialog = false"
            >
              Enviar
            </v-btn>
          </template>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog de confirmación para enviar prepedido -->
    <v-dialog v-model="confirmDialog" max-width="500px" persistent>
      <v-card>
        <v-card-title class="text-h5">
          <v-icon color="warning" class="mr-2">mdi-alert</v-icon>
          Confirmar Envío
        </v-card-title>
        <v-card-text>
          <p class="text-body-1 mb-3">
            ¿Está seguro que desea enviar este prepedido?
          </p>
          <v-alert type="warning" variant="tonal" class="mb-0">
            <strong>Importante:</strong> Una vez enviado, el prepedido no se podrá editar.
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="grey"
            variant="text"
            @click="cancelarEnvio"
          >
            Cancelar
          </v-btn>
          <v-btn
            color="success"
            variant="elevated"
            @click="confirmarEnvioPrepedido"
          >
            Confirmar Envío
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>