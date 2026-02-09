<script setup>
import { ref, onMounted, computed } from 'vue'
import api from '../services/api'
import { formatCurrency } from '../utils/currency'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'ofertas-selected'])

// Estado
const ofertas = ref([])
const loading = ref(true)
const error = ref(null)
const tipoFiltro = ref('todas')
const detailDialog = ref(false)
const selectedOferta = ref(null)
const configuracionDialog = ref(false)
const ofertaAConfigurar = ref(null)

// Configuración de productos para la oferta seleccionada
const productosSeleccionados = ref([])

// Tipos de ofertas con colores
const tiposOfertas = {
  unitaria: { color: 'blue', icon: 'mdi-numeric-1-circle', label: 'Unitaria' },
  minima: { color: 'green', icon: 'mdi-greater-than-or-equal', label: 'Cantidad Mínima' },
  bundle: { color: 'orange', icon: 'mdi-package-variant', label: 'Combo' },
  mix: { color: 'purple', icon: 'mdi-shuffle-variant', label: 'Mix' }
}

// Computed properties para filtros
const ofertasPorTipo = computed(() => {
  const agrupadas = {
    unitaria: [],
    minima: [],
    bundle: [],
    mix: []
  }
  
  ofertas.value.forEach(oferta => {
    if (agrupadas[oferta.tipo]) {
      agrupadas[oferta.tipo].push(oferta)
    }
  })
  
  return agrupadas
})

const ofertasFiltradas = computed(() => {
  if (tipoFiltro.value === 'todas') {
    return ofertas.value
  }
  return ofertas.value.filter(o => o.tipo === tipoFiltro.value)
})

const contadorTipos = computed(() => {
  return {
    unitaria: ofertasPorTipo.value.unitaria.length,
    minima: ofertasPorTipo.value.minima.length,
    bundle: ofertasPorTipo.value.bundle.length,
    mix: ofertasPorTipo.value.mix.length,
    todas: ofertas.value.length
  }
})

const headers = [
  { title: 'Imagen', key: 'producto_foto', sortable: false, width: '80px' },
  { title: 'Código', key: 'producto_codigo', sortable: true },
  { title: 'Producto', key: 'producto_nombre', sortable: true },
  { title: 'Marca', key: 'producto_marca', sortable: true },
  { title: 'Envase', key: 'producto_envase', sortable: true },
  { title: 'Precio Oferta', key: 'producto_precio_oferta', sortable: true },
  { title: 'Descuento', key: 'descuento', sortable: true },
  { title: 'Seleccionar', key: 'actions', sortable: false, width: '120px' }
]

onMounted(async () => {
  await loadOfertas()
})

async function loadOfertas() {
  try {
    loading.value = true
    const response = await api.get('/ofertas/vigentes-mes')
    console.log('Ofertas cargadas:', response.data)
    ofertas.value = response.data.data || []
  } catch (err) {
    console.error('Error al cargar ofertas:', err)
    error.value = 'Error al cargar las ofertas'
  } finally {
    loading.value = false
  }
}

function verDetalles(oferta) {
  selectedOferta.value = oferta
  detailDialog.value = true
}

function configurarOferta(oferta) {
  ofertaAConfigurar.value = oferta
  productosSeleccionados.value = []
  
  // Inicializar productos según tipo de oferta
  if (oferta.tipo === 'bundle' || oferta.tipo === 'mix') {
    // Cargar productos con sus cantidades requeridas
    oferta.productos.forEach(prod => {
      productosSeleccionados.value.push({
        id_producto: prod.producto_id,
        nombre: prod.nombre,
        codigo: prod.codigo,
        envase: prod.envase,
        cantidad: oferta.tipo === 'bundle' ? (prod.unidades_fijas || 1) : 1,
        minimo: oferta.tipo === 'bundle' ? (prod.unidades_fijas || 1) : 0,
        precioBase: parseFloat(prod.precioVenta || 0)
      })
    })
  } else {
    // Para unitaria y mínima, solo el producto principal
    const producto = oferta.productos[0]
    productosSeleccionados.value = [{
      id_producto: producto.producto_id,
      nombre: producto.nombre,
      codigo: producto.codigo,
      envase: producto.envase,
      cantidad: oferta.tipo === 'minima' ? (oferta.min_unidades_total || 1) : 1,
      minimo: oferta.tipo === 'minima' ? (oferta.min_unidades_total || 1) : 1,
      precioBase: parseFloat(producto.precioVenta || 0)
    }]
  }
  
  configuracionDialog.value = true
}

function validarConfiguracion() {
  const oferta = ofertaAConfigurar.value
  
  if (oferta.tipo === 'minima') {
    const totalUnidades = productosSeleccionados.value.reduce((sum, p) => sum + Number(p.cantidad), 0)
    return totalUnidades >= oferta.min_unidades_total
  }
  
  if (oferta.tipo === 'bundle') {
    // Validar que cada producto tenga la cantidad exacta requerida
    return productosSeleccionados.value.every(p => {
      const prodRequerido = oferta.productos.find(pr => pr.producto_id === p.id_producto)
      return prodRequerido && Number(p.cantidad) === (prodRequerido.unidades_fijas || 1)
    })
  }
  
  if (oferta.tipo === 'mix') {
    const totalUnidades = productosSeleccionados.value.reduce((sum, p) => sum + Number(p.cantidad), 0)
    return totalUnidades >= oferta.min_unidades_total
  }
  
  return true // unitaria siempre válida
}

function confirmarSeleccion() {
  if (!validarConfiguracion()) {
    error.value = 'La configuración no cumple con los requisitos de la oferta'
    return
  }
  
  // Emitir los productos con la oferta aplicada
  const productosParaAgregar = productosSeleccionados.value.map(p => ({
    id_producto: p.id_producto,
    nombre: p.nombre,
    codigo: p.codigo,
    envase: p.envase,
    cantidad: Number(p.cantidad),
    precioBase: p.precioBase
  }))
  
  emit('ofertas-selected', {
    oferta_id: ofertaAConfigurar.value.id,
    tipo: ofertaAConfigurar.value.tipo,
    titulo: ofertaAConfigurar.value.titulo,
    productos: productosParaAgregar
  })
  
  closeDialog()
}

function closeDialog() {
  emit('update:modelValue', false)
  configuracionDialog.value = false
  detailDialog.value = false
  selectedOferta.value = null
  ofertaAConfigurar.value = null
  productosSeleccionados.value = []
  error.value = null
}

function getDescuentoTexto(oferta) {
  if (oferta.modo_precio === 'porcentaje') {
    return `-${oferta.valor_precio}%`
  } else if (oferta.modo_precio === 'fijo' && oferta.productos.length > 0) {
    const precioOriginal = oferta.productos[0].precio_base
    const descPct = Math.round(((precioOriginal - oferta.valor_precio) / precioOriginal) * 100)
    return `-${descPct}%`
  } else if (oferta.modo_precio === 'descuento' && oferta.productos.length > 0) {
    const precioOriginal = oferta.productos[0].precio_base
    const descPct = Math.round((oferta.valor_precio / precioOriginal) * 100)
    return `-${descPct}%`
  }
  return 'Precio especial'
}

function getRequisitos(oferta) {
  switch(oferta.tipo) {
    case 'unitaria':
      return 'Sin mínimo de compra'
    case 'minima':
      return `Mínimo ${oferta.min_unidades_total} unidades`
    case 'bundle':
      return `Combo fijo: ${oferta.productos.length} productos`
    case 'mix':
      return `Elige productos, mínimo ${oferta.min_unidades_total} unidades`
    default:
      return ''
  }
}
</script>

<template>
  <v-dialog 
    :model-value="modelValue" 
    @update:model-value="emit('update:modelValue', $event)"
    max-width="1200px"
    persistent
    scrollable
  >
    <v-card>
      <v-card-title class="d-flex justify-space-between align-center bg-gradient">
        <span class="text-h5">🎯 Seleccionar Oferta</span>
        <v-btn
          icon="mdi-close"
          variant="text"
          @click="closeDialog"
        ></v-btn>
      </v-card-title>
      
      <v-card-text class="pa-4">
        <v-alert v-if="error" type="error" class="mb-4" closable @click:close="error = null">
          {{ error }}
        </v-alert>
        
        <!-- Filtros por tipo -->
        <v-chip-group
          v-model="tipoFiltro"
          selected-class="text-primary"
          mandatory
          class="mb-4"
        >
          <v-chip value="todas" filter variant="outlined">
            <v-icon start>mdi-view-grid</v-icon>
            Todas ({{ contadorTipos.todas }})
          </v-chip>
          <v-chip 
            v-for="(config, tipo) in tiposOfertas" 
            :key="tipo"
            :value="tipo"
            :color="config.color"
            filter
            variant="outlined"
          >
            <v-icon start>{{ config.icon }}</v-icon>
            {{ config.label }} ({{ contadorTipos[tipo] }})
          </v-chip>
        </v-chip-group>

        <!-- Loading State -->
        <div v-if="loading" class="text-center py-8">
          <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
          <p class="mt-4">Cargando ofertas...</p>
        </div>

        <!-- Lista de Ofertas -->
        <v-row v-else>
          <v-col v-if="ofertasFiltradas.length === 0" cols="12">
            <v-alert type="info" variant="tonal">
              No hay ofertas disponibles para este tipo
            </v-alert>
          </v-col>
          
          <v-col 
            v-for="oferta in ofertasFiltradas" 
            :key="oferta.id"
            cols="12"
            md="6"
            lg="4"
          >
            <v-card 
              class="oferta-card h-100" 
              :class="`border-${tiposOfertas[oferta.tipo].color}`"
              elevation="2"
              hover
            >
              <!-- Header con tipo de oferta -->
              <v-card-title class="d-flex align-center pa-3" :class="`bg-${tiposOfertas[oferta.tipo].color}-lighten-5`">
                <v-icon :color="tiposOfertas[oferta.tipo].color" class="mr-2">
                  {{ tiposOfertas[oferta.tipo].icon }}
                </v-icon>
                <span class="text-subtitle-1">{{ tiposOfertas[oferta.tipo].label }}</span>
                <v-spacer></v-spacer>
                <v-chip 
                  :color="tiposOfertas[oferta.tipo].color" 
                  size="small"
                  variant="elevated"
                >
                  {{ getDescuentoTexto(oferta) }}
                </v-chip>
              </v-card-title>

              <!-- Contenido -->
              <v-card-text class="pa-3">
                <h3 class="text-h6 mb-2">{{ oferta.titulo }}</h3>
                <p class="text-body-2 text-grey-darken-1 mb-3">{{ oferta.descripcion }}</p>

                <!-- Requisitos -->
                <v-alert 
                  :color="tiposOfertas[oferta.tipo].color"
                  variant="tonal"
                  density="compact"
                  class="mb-3"
                >
                  <v-icon start size="small">mdi-information</v-icon>
                  {{ getRequisitos(oferta) }}
                </v-alert>

                <!-- Productos incluidos (preview) -->
                <div class="productos-preview mb-2">
                  <div class="text-caption text-grey-darken-1 mb-1 font-weight-medium">
                    <v-icon size="x-small">mdi-package-variant</v-icon>
                    Productos incluidos:
                  </div>
                  <div class="text-caption" v-for="(prod, idx) in oferta.productos" :key="`prev-${prod.producto_id}-${idx}`">
                    • {{ prod.codigo }} - {{ prod.nombre }}
                  </div>
                </div>

                <!-- Vigencia -->
                <div class="text-caption text-grey">
                  <v-icon size="x-small">mdi-calendar-range</v-icon>
                  Hasta {{ new Date(oferta.fecha_fin).toLocaleDateString('es-AR') }}
                </div>
              </v-card-text>

              <!-- Acciones -->
              <v-card-actions class="pa-3 pt-0">
                <v-btn
                  variant="outlined"
                  size="small"
                  @click="verDetalles(oferta)"
                  prepend-icon="mdi-eye"
                >
                  Ver detalles
                </v-btn>
                <v-spacer></v-spacer>
                <v-btn
                  :color="tiposOfertas[oferta.tipo].color"
                  variant="elevated"
                  size="small"
                  @click="configurarOferta(oferta)"
                  prepend-icon="mdi-check-circle"
                >
                  Seleccionar
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Dialog de Detalles -->
    <v-dialog v-model="detailDialog" max-width="700px">
      <v-card v-if="selectedOferta">
        <v-card-title class="bg-gradient">
          <v-icon :color="tiposOfertas[selectedOferta.tipo].color" class="mr-2">
            {{ tiposOfertas[selectedOferta.tipo].icon }}
          </v-icon>
          {{ selectedOferta.titulo }}
        </v-card-title>
        <v-card-text class="pa-4">
          <p class="text-body-1 mb-4">{{ selectedOferta.descripcion }}</p>
          
          <v-divider class="my-4"></v-divider>
          
          <h4 class="text-h6 mb-3">Productos incluidos:</h4>
          <v-list density="compact">
            <v-list-item 
              v-for="(prod, idx) in selectedOferta.productos" 
              :key="`det-${prod.producto_id}-${idx}`"
              class="mb-2"
            >
              <template v-slot:prepend>
                <v-avatar size="40" class="mr-3">
                  <v-img v-if="prod.foto" :src="prod.foto" cover />
                  <v-icon v-else>mdi-package-variant</v-icon>
                </v-avatar>
              </template>
              <v-list-item-title>
                <strong>{{ prod.codigo }}</strong> - {{ prod.nombre }}
              </v-list-item-title>
              <v-list-item-subtitle>
                <span v-if="selectedOferta.tipo === 'bundle'">
                  Cantidad requerida: <strong>{{ prod.unidades_fijas }}</strong>
                </span>
                <span v-else>
                  Precio base: <strong>{{ formatCurrency(prod.precioVenta) }}</strong>
                </span>
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>
          
          <v-divider class="my-4"></v-divider>
          
          <v-alert :color="tiposOfertas[selectedOferta.tipo].color" variant="tonal">
            <strong>{{ getRequisitos(selectedOferta) }}</strong>
          </v-alert>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="detailDialog = false">Cerrar</v-btn>
          <v-btn 
            :color="tiposOfertas[selectedOferta.tipo].color"
            @click="detailDialog = false; configurarOferta(selectedOferta)"
          >
            Seleccionar esta oferta
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog de Configuración -->
    <v-dialog v-model="configuracionDialog" max-width="800px" persistent>
      <v-card v-if="ofertaAConfigurar">
        <v-card-title class="bg-gradient">
          <v-icon :color="tiposOfertas[ofertaAConfigurar.tipo].color" class="mr-2">
            {{ tiposOfertas[ofertaAConfigurar.tipo].icon }}
          </v-icon>
          Configurar: {{ ofertaAConfigurar.titulo }}
        </v-card-title>
        
        <v-card-text class="pa-4">
          <v-alert 
            :color="tiposOfertas[ofertaAConfigurar.tipo].color"
            variant="tonal"
            class="mb-4"
          >
            <strong>{{ getRequisitos(ofertaAConfigurar) }}</strong>
          </v-alert>

          <h4 class="text-h6 mb-3">Productos:</h4>
          
          <v-list>
            <v-list-item 
              v-for="(prod, idx) in productosSeleccionados" 
              :key="`prod-${prod.id_producto}-${idx}`"
              class="mb-3 border rounded"
            >
              <template v-slot:prepend>
                <v-icon color="primary">mdi-package-variant</v-icon>
              </template>
              
              <v-list-item-title class="mb-2">
                <strong>{{ prod.codigo }}</strong> - {{ prod.nombre }}
              </v-list-item-title>
              
              <v-list-item-subtitle>
                <v-row align="center">
                  <v-col cols="6">
                    <v-text-field
                      v-model.number="prod.cantidad"
                      type="number"
                      :min="prod.minimo || 1"
                      label="Cantidad"
                      density="compact"
                      variant="outlined"
                      :readonly="ofertaAConfigurar.tipo === 'bundle'"
                      :hint="ofertaAConfigurar.tipo === 'bundle' ? 'Cantidad fija para este combo' : prod.minimo > 0 ? `Mínimo: ${prod.minimo}` : ''"
                      persistent-hint
                    ></v-text-field>
                  </v-col>
                  <v-col cols="6" class="text-right">
                    <div class="text-caption text-grey">Precio base</div>
                    <div class="text-h6">{{ formatCurrency(prod.precioBase) }}</div>
                  </v-col>
                </v-row>
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>

          <!-- Resumen de cantidades para ofertas con mínimo -->
          <v-alert 
            v-if="ofertaAConfigurar.tipo === 'minima' || ofertaAConfigurar.tipo === 'mix'"
            :color="validarConfiguracion() ? 'success' : 'warning'"
            variant="tonal"
            class="mt-4"
          >
            <div class="d-flex align-center">
              <v-icon start>{{ validarConfiguracion() ? 'mdi-check-circle' : 'mdi-alert-circle' }}</v-icon>
              <div>
                <strong>Total de unidades: {{ productosSeleccionados.reduce((sum, p) => sum + Number(p.cantidad), 0) }}</strong>
                <div class="text-caption">
                  {{ validarConfiguracion() 
                    ? '✓ Cumple con el mínimo requerido' 
                    : `Necesitas al menos ${ofertaAConfigurar.min_unidades_total} unidades` 
                  }}
                </div>
              </div>
            </div>
          </v-alert>
        </v-card-text>
        
        <v-card-actions class="pa-4">
          <v-btn 
            variant="text" 
            @click="configuracionDialog = false"
          >
            Cancelar
          </v-btn>
          <v-spacer></v-spacer>
          <v-btn
            :color="tiposOfertas[ofertaAConfigurar.tipo].color"
            :disabled="!validarConfiguracion()"
            @click="confirmarSeleccion"
            prepend-icon="mdi-check"
          >
            Agregar al prepedido
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-dialog>
</template>

<style scoped>
.bg-gradient {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.oferta-card {
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.oferta-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.15) !important;
}

.border-blue { border-color: #2196F3 !important; }
.border-green { border-color: #4CAF50 !important; }
.border-orange { border-color: #FF9800 !important; }
.border-purple { border-color: #9C27B0 !important; }

.bg-blue-lighten-5 { background-color: #E3F2FD; }
.bg-green-lighten-5 { background-color: #E8F5E9; }
.bg-orange-lighten-5 { background-color: #FFF3E0; }
.bg-purple-lighten-5 { background-color: #F3E5F5; }

.productos-preview {
  min-height: 50px;
  max-height: 120px;
  overflow-y: auto;
}

.productos-preview .text-caption {
  line-height: 1.6;
}
</style>
