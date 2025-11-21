<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import api from '../../services/api'
import { formatCurrency, parseCurrency } from '../../utils/currency'
import productosService from '../../services/productosService'
import ProductSelector from '../../components/ProductSelector.vue'
import OfertaSelector from '../../components/OfertaSelector.vue'

const router = useRouter()
const route = useRoute()
const loading = ref(false)
const error = ref(null)
const success = ref(false)

// Detectar modo edición
const isEditing = computed(() => !!route.params.id)
const prepedidoId = computed(() => route.params.id)

// Datos del formulario
const form = ref({
  observaciones: '',
  items: []
})

// Datos para agregar productos
const newItem = ref({
  productoId: '',
  descripcion: '',
  cantidad: 1,
  unidad: 'envase',
  precioEstimado: 0,
  observaciones: ''
})

// Lista de productos disponibles
const productos = ref([])
const productosLoading = ref(false)
const searchText = ref('')

// Dialog para agregar producto
const addItemDialog = ref(false)
const productSelectorDialog = ref(false)
const ofertaSelectorDialog = ref(false)
const selectedProductForForm = ref(null)

// Headers para la tabla de productos
const productHeaders = [
  {
    title: 'Producto',
    key: 'producto',
    sortable: false
  },
  {
    title: 'Cantidad',
    key: 'cantidad',
    sortable: false,
    width: '100px',
    align: 'end'
  },
  {
    title: 'Envase',
    key: 'envase',
    sortable: false,
    width: '100px'
  },
  {
    title: 'Precio',
    key: 'precio',
    sortable: false,
    width: '100px',
    align: 'end'
  },
  {
    title: 'Total',
    key: 'total',
    sortable: false,
    width: '100px',
    align: 'end'
  },
  {
    title: 'Acciones',
    key: 'acciones',
    sortable: false,
    width: '80px',
    align: 'center'
  }
]

// Computed property para calcular el total automáticamente
const totalCalculado = computed(() => {
  if (!selectedProductForForm.value || !newItem.value.cantidad) return 0
  return newItem.value.cantidad * newItem.value.precioEstimado
})

// Cargar productos al montar el componente
onMounted(async () => {
  // Si está en modo edición, cargar datos del prepedido
  if (isEditing.value) {
    await loadPrepedido()
  }
})

// Manejar selección de producto
function onProductSelected(producto) {
  selectedProductForForm.value = producto
  newItem.value.productoId = producto.id
  newItem.value.descripcion = producto.nombre
  newItem.value.precioEstimado = parseFloat(producto.precioBase || producto.precio || 0)
  newItem.value.unidad = producto.envase || 'envase' // usar envase del producto
  productSelectorDialog.value = false
}

// Manejar selección de oferta
function onOfertaSelected(productoConOferta) {
  console.log('🎯 OFERTA SELECCIONADA:', productoConOferta) // Debug log
  selectedProductForForm.value = productoConOferta
  newItem.value.productoId = productoConOferta.id
  newItem.value.descripcion = `${productoConOferta.nombre} (${productoConOferta.descuento_texto})`
  newItem.value.precioEstimado = parseFloat(productoConOferta.precioBase || productoConOferta.precio || 0)
  newItem.value.unidad = productoConOferta.envase || 'envase'
  
  // ✅ CORREGIR: Usar 'oferta_id' que es el campo que realmente envía OfertaSelector
  newItem.value.ofertaid = productoConOferta.oferta_id
  console.log('🎯 OFERTAID CAPTURADO (CORREGIDO):', newItem.value.ofertaid) // Debug log
  console.log('🔍 OBJETO COMPLETO RECIBIDO:', JSON.stringify(productoConOferta, null, 2)) // Debug completo
  
  ofertaSelectorDialog.value = false
  addItemDialog.value = true // Abrir el diálogo para configurar cantidad
}

async function loadPrepedido() {
  try {
    loading.value = true
    const response = await api.get(`/prepedidos/${prepedidoId.value}`)
    const prepedido = response.data.data
    
    // 🔍 DEBUG: Verificar datos recibidos del backend
    console.log('🔍 PREPEDIDO CARGADO PARA EDICIÓN:', JSON.stringify(prepedido, null, 2))
    console.log('🎯 ITEMS CON OFERTAID:', prepedido.items.filter(item => !!item.ofertaid))
    
    // Cargar datos en el formulario
    form.value.observaciones = prepedido.observaciones || ''
    form.value.items = prepedido.items.map(item => ({
      productoId: item.producto_id,
      descripcion: item.descripcion,
      cantidad: item.cantidad,
      unidad: item.unidad,
      precioEstimado: item.precio_estimado,
      observaciones: item.observaciones || '',
      ofertaid: item.ofertaid || null  // ✅ AGREGAR OFERTAID AL MAPEO
    }))
    
    // 🔍 DEBUG: Verificar items mapeados
    console.log('🔍 ITEMS MAPEADOS PARA FORMULARIO:', JSON.stringify(form.value.items, null, 2))
    console.log('🎯 ITEMS CON OFERTAID EN FORMULARIO:', form.value.items.filter(item => !!item.ofertaid))
    
  } catch (err) {
    console.error('Error cargando prepedido:', err)
    error.value = 'Error al cargar el prepedido'
  } finally {
    loading.value = false
  }
}

function addItem() {
  if (!selectedProductForForm.value) {
    error.value = 'Por favor seleccione un producto'
    return
  }
  
  if (!newItem.value.productoId || !newItem.value.descripcion || newItem.value.cantidad <= 0) {
    error.value = 'Por favor complete todos los campos requeridos'
    return
  }

  // 🔍 DEBUG: Verificar newItem antes de agregar
  console.log('🔍 ANTES DE AGREGAR - newItem completo:', JSON.stringify(newItem.value, null, 2))
  console.log('🎯 OFERTAID en newItem:', newItem.value.ofertaid)
  
  const itemToAdd = { ...newItem.value }
  console.log('🔍 ITEM A AGREGAR:', JSON.stringify(itemToAdd, null, 2))
  console.log('🎯 OFERTAID en itemToAdd:', itemToAdd.ofertaid)
  
  form.value.items.push(itemToAdd)
  
  console.log('🔍 ITEMS DESPUÉS DE AGREGAR:', JSON.stringify(form.value.items, null, 2))
  console.log('🎯 ÚLTIMO ITEM AGREGADO:', JSON.stringify(form.value.items[form.value.items.length - 1], null, 2))
  
  // Limpiar formulario
  resetNewItem()
  
  addItemDialog.value = false
  error.value = null
}

function removeItem(index) {
  form.value.items.splice(index, 1)
}

// Función para limpiar el formulario de nuevo item
function resetNewItem() {
  newItem.value = {
    productoId: null,
    descripcion: '',
    cantidad: 1,
    unidad: 'envase',
    precioEstimado: 0,
    observaciones: '',
    ofertaid: null  // ✅ AGREGAR OFERTAID AL RESET
  }
  selectedProductForForm.value = null
}

async function submitPrepedido() {
  if (form.value.items.length === 0) {
    error.value = 'Debe agregar al menos un producto al prepedido'
    return
  }

  try {
    loading.value = true
    error.value = null
    
    const data = {
      observaciones: form.value.observaciones,
      items: form.value.items
    }
    
    // 🔍 DEBUG: Verificar payload antes de enviar
    console.log('🚀 PAYLOAD COMPLETO A ENVIAR:', JSON.stringify(data, null, 2))
    console.log('🎯 ITEMS CON OFERTAID:', data.items.filter(item => item.ofertaid))
    
    let response
    if (isEditing.value) {
      response = await api.put(`/prepedidos/${prepedidoId.value}`, data)
    } else {
      response = await api.post('/prepedidos', data)
    }
    
    success.value = true
    
    // Redirigir después de 2 segundos
    setTimeout(() => {
      router.push('/prepedidos')
    }, 2000)
    
  } catch (err) {
    console.error(`Error al ${isEditing.value ? 'actualizar' : 'crear'} prepedido:`, err)
    error.value = err.response?.data?.message || `Error al ${isEditing.value ? 'actualizar' : 'crear'} el prepedido`
  } finally {
    loading.value = false
  }
}

function cancelar() {
  router.push('/prepedidos')
}

function getTotalEstimado() {
  return form.value.items.reduce((total, item) => {
    return total + (item.cantidad * item.precioEstimado)
  }, 0).toFixed(2)
}
</script>

<script>
export default {
  name: 'PrepedidoForm',
  components: {
    ProductSelector,
    OfertaSelector
  }
}
</script>

<template>
  <div>
    <v-row class="mb-6">
      <v-col>
        <h1 class="text-h4 font-weight-bold">{{ isEditing ? 'Editar Prepedido' : 'Nuevo Prepedido' }}</h1>
        <p class="text-subtitle-1 text-grey-darken-1">{{ isEditing ? 'Modificar prepedido existente' : 'Crear un nuevo prepedido' }}</p>
      </v-col>
    </v-row>

    <v-alert v-if="error" type="error" class="mb-4">{{ error }}</v-alert>
    <v-alert v-if="success" type="success" class="mb-4">
      Prepedido {{ isEditing ? 'actualizado' : 'creado' }} exitosamente. Redirigiendo...
    </v-alert>

    <v-form @submit.prevent="submitPrepedido">
      <v-card class="mb-4">
        <v-card-title>Información General</v-card-title>
        <v-card-text>
          <v-textarea
            v-model="form.observaciones"
            label="Observaciones generales"
            placeholder="Ingrese observaciones o comentarios sobre el prepedido"
            rows="3"
            variant="outlined"
          ></v-textarea>
        </v-card-text>
      </v-card>

      <v-card class="mb-4">
        <v-card-title class="d-flex justify-space-between align-center">
          <span>Productos</span>
          <div class="d-flex gap-2">
            <v-btn 
              color="primary" 
              prepend-icon="mdi-plus"
              @click="addItemDialog = true; productSelectorDialog = true"
            >
              Seleccionar Producto
            </v-btn>
            <v-btn 
              color="success" 
              prepend-icon="mdi-tag"
              @click="ofertaSelectorDialog = true"
            >
              Seleccionar Oferta
            </v-btn>
          </div>
        </v-card-title>
        <v-card-text>
          <div v-if="form.items.length === 0" class="text-center py-8 text-grey">
            <v-icon size="64" class="mb-4">mdi-package-variant</v-icon>
            <p>No hay productos agregados</p>
            <p class="text-caption">Haga clic en "Agregar Producto" para comenzar</p>
          </div>
          
          <v-data-table
            v-else
            :headers="productHeaders"
            :items="form.items"
            item-key="index"
            class="elevation-1"
            density="compact"
            hide-default-footer
            :items-per-page="-1"
          >
            <template v-slot:item.producto="{ item }">
              <div class="d-flex align-center">
                <v-icon class="mr-2" size="small">mdi-package-variant</v-icon>
                <span>{{ item.descripcion }}</span>
                <!-- Indicador visual de oferta -->
                <v-chip 
                  v-if="item.ofertaid" 
                  color="success" 
                  size="x-small" 
                  class="ml-2"
                  variant="elevated"
                >
                  🎯 OFERTA
                </v-chip>
              </div>
            </template>
            
            <template v-slot:item.cantidad="{ item }">
              <span class="text-right">{{ item.cantidad }}</span>
            </template>
            
            <template v-slot:item.envase="{ item }">
              <span>{{ item.unidad }}</span>
            </template>
            
            <template v-slot:item.precio="{ item }">
              <span class="text-right">{{ formatCurrency(item.precioEstimado) }}</span>
            </template>
            
            <template v-slot:item.total="{ item }">
              <strong class="text-right">{{ formatCurrency(item.cantidad * item.precioEstimado) }}</strong>
            </template>
            
            <template v-slot:item.acciones="{ index }">
              <v-btn
                icon="mdi-delete"
                size="small"
                variant="text"
                color="error"
                @click="removeItem(index)"
              ></v-btn>
            </template>
          </v-data-table>
          
          <v-divider v-if="form.items.length > 0" class="my-4"></v-divider>
          
          <div v-if="form.items.length > 0" class="text-right">
            <strong>Total Estimado: {{ formatCurrency(getTotalEstimado()) }}</strong>
          </div>
        </v-card-text>
      </v-card>

      <v-card-actions class="justify-end">
        <v-btn 
          variant="text" 
          @click="cancelar"
          :disabled="loading"
        >
          Cancelar
        </v-btn>
        <v-btn 
          type="submit" 
          color="primary"
          :loading="loading"
          :disabled="form.items.length === 0"
        >
          {{ isEditing ? 'Actualizar Prepedido' : 'Crear Prepedido' }}
        </v-btn>
      </v-card-actions>
    </v-form>

    <!-- Dialog para agregar producto -->
    <v-dialog v-model="addItemDialog" max-width="700px">
      <v-card>
        <v-card-title>Agregar Producto</v-card-title>
        <v-card-text>
          <v-form @submit.prevent="addItem">
            <!-- SECCIÓN 1: Información del Producto (Solo lectura) -->
            <v-card 
              v-if="selectedProductForForm" 
              class="mb-4 pa-4" 
              variant="outlined"
            >
              <v-card-title class="text-h6 pb-2 text-primary">Información del Producto</v-card-title>
              <v-row dense>
                <v-col cols="12">
                  <div class="text-body-1 text-primary">
                    <strong>{{ selectedProductForForm.codigo }}</strong> - {{ selectedProductForForm.nombre }}
                  </div>
                </v-col>
                <v-col cols="6">
                  <div class="text-body-2 text-primary">
                    <strong>Tipo:</strong> {{ selectedProductForForm.tipo_envase || 'N/A' }}
                  </div>
                </v-col>
                <v-col cols="6">
                  <div class="text-body-2 text-primary">
                    <strong>Capacidad:</strong> {{ selectedProductForForm.litros ? `${selectedProductForForm.litros}L` : 'N/A' }}
                  </div>
                </v-col>
                <v-col cols="12">
                  <div class="text-h6 text-primary">
                    <strong>Precio unitario:</strong> {{ formatCurrency(newItem.precioEstimado) }}
                  </div>
                </v-col>
              </v-row>
            </v-card>

            <v-divider class="my-4"></v-divider>

            <!-- SECCIÓN 2: Campos Editables -->
            <v-card class="pa-4" variant="outlined">
              <v-card-title class="text-h6 pb-2">Campos Editables</v-card-title>
              <v-row class="align-center">
                <v-col cols="6">
                  <v-number-input
                    v-model="newItem.cantidad"
                    label="Cantidad"
                    variant="outlined"
                    :min="1"
                    required
                    density="comfortable"
                  ></v-number-input>
                </v-col>
                <v-col cols="6">
                  <v-text-field
                    :model-value="formatCurrency(totalCalculado)"
                    label="Total"
                    variant="outlined"
                    readonly
                    density="comfortable"
                    class="text-h6"
                    color="success"
                  ></v-text-field>
                </v-col>
              </v-row>
            </v-card>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="addItemDialog = false; resetNewItem()">Cancelar</v-btn>
          <v-btn 
            color="primary" 
            @click="addItem"
            :disabled="!selectedProductForForm || !newItem.cantidad"
          >
            Agregar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- Selector de productos -->
    <ProductSelector
      v-model="productSelectorDialog"
      @product-selected="onProductSelected"
    />
    
    <!-- Selector de ofertas -->
    <OfertaSelector
      v-model="ofertaSelectorDialog"
      @oferta-selected="onOfertaSelected"
    />
  </div>
</template>

<style scoped>
.border {
  border: 1px solid rgba(0, 0, 0, 0.12);
}
</style>