<script setup>
import { ref, onMounted, computed, defineEmits, defineProps } from 'vue'
import api from '../services/api'
import { formatCurrency } from '../utils/currency'

// Función para formatear capacidad
function formatCapacidad(litros) {
  if (!litros) return '-'
  const num = parseFloat(litros)
  // Si es un número entero o los decimales son .0000, mostrar solo el entero
  if (num % 1 === 0) {
    return `${Math.floor(num)}L`
  }
  // Si tiene decimales significativos, mostrar con decimales
  return `${num}L`
}

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'oferta-selected'])

const ofertas = ref([])
const loading = ref(true)
const error = ref(null)
const search = ref('')
const selectedOferta = ref(null)
const selectedMarca = ref('')
const selectedCategoria = ref('')
const selectedEnvase = ref('')
const showFilters = ref(false)

// Computed properties para filtros
const marcasUnicas = computed(() => {
  const marcas = [...new Set(ofertas.value.map(o => o.producto_marca).filter(Boolean))]
  return marcas.sort()
})

const categoriasUnicas = computed(() => {
  const categorias = [...new Set(ofertas.value.map(o => o.producto_tipo_envase).filter(Boolean))]
  return categorias.sort()
})

const envasesUnicos = computed(() => {
  const envases = [...new Set(ofertas.value.map(o => o.producto_envase).filter(Boolean))]
  return envases.sort()
})

// Ofertas filtradas
const ofertasFiltradas = computed(() => {
  let filtered = ofertas.value
  
  if (selectedMarca.value) {
    filtered = filtered.filter(o => o.producto_marca === selectedMarca.value)
  }
  
  if (selectedCategoria.value) {
    filtered = filtered.filter(o => o.producto_tipo_envase === selectedCategoria.value)
  }
  
  if (selectedEnvase.value) {
    filtered = filtered.filter(o => o.producto_envase === selectedEnvase.value)
  }
  
  return filtered
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
    
    console.log('Respuesta del servidor:', response.data)
    
    // Las ofertas ya vienen procesadas desde el backend con precios directos
    ofertas.value = response.data.data.map(oferta => {
      // Calcular descuento porcentual para mostrar usando precio_original y precio_oferta
      let descuentoCalculado = 0
      if (oferta.producto_precio_original > 0 && oferta.producto_precio_oferta < oferta.producto_precio_original) {
        descuentoCalculado = Math.round(((oferta.producto_precio_original - oferta.producto_precio_oferta) / oferta.producto_precio_original) * 100)
      }
      
      return {
        ...oferta,
        descuento_calculado: descuentoCalculado
      }
    })
    
    console.log('Ofertas procesadas:', ofertas.value)
  } catch (err) {
    console.error('Error al cargar ofertas:', err)
    error.value = 'Error al cargar las ofertas'
  } finally {
    loading.value = false
  }
}

function selectOferta(oferta) {
  selectedOferta.value = oferta
  
  // Crear objeto producto con información de la oferta usando precios directos
  const productoConOferta = {
    id: oferta.id_producto,
    codigo: oferta.producto_codigo,
    nombre: oferta.producto_nombre,
    marca: oferta.producto_marca,
    envase: oferta.producto_envase,
    precio: oferta.producto_precio_oferta, // Precio de oferta directo
    precio_original: oferta.producto_precio_original, // Precio original
    foto: oferta.producto_foto,
    es_oferta: true,
    oferta_id: oferta.id,
    oferta_titulo: oferta.titulo,
    descuento_porcentaje: oferta.descuento_calculado
  }
  
  emit('oferta-selected', productoConOferta)
  closeDialog()
}

function closeDialog() {
  emit('update:modelValue', false)
  clearFilters()
}

function clearFilters() {
  search.value = ''
  selectedMarca.value = ''
  selectedCategoria.value = ''
  selectedEnvase.value = ''
  selectedOferta.value = null
  showFilters.value = false
}

function toggleFilters() {
  showFilters.value = !showFilters.value
}
</script>

<template>
  <v-dialog 
    :model-value="modelValue" 
    @update:model-value="emit('update:modelValue', $event)"
    max-width="1400px"
    persistent
  >
    <v-card>
      <v-card-title class="d-flex justify-space-between align-center">
        <span class="text-h5">Seleccionar Oferta</span>
        <v-btn
          icon="mdi-close"
          variant="text"
          @click="closeDialog"
        ></v-btn>
      </v-card-title>
      
      <v-card-text>
        <v-alert v-if="error" type="error" class="mb-4">{{ error }}</v-alert>
        
        <!-- Barra de búsqueda y filtros -->
        <div class="search-filters-container mb-4">
          <v-row>
            <v-col cols="12" md="8">
              <v-text-field
                v-model="search"
                append-icon="mdi-magnify"
                label="Buscar ofertas por producto, código o marca..."
                single-line
                hide-details
                clearable
                variant="outlined"
                density="compact"
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="4" class="d-flex align-center justify-end">
              <v-btn
                :color="showFilters ? 'primary' : 'default'"
                :variant="showFilters ? 'flat' : 'outlined'"
                @click="toggleFilters"
                prepend-icon="mdi-filter-variant"
                class="me-2"
              >
                Filtros
              </v-btn>
              <v-btn
                variant="outlined"
                @click="clearFilters"
                prepend-icon="mdi-filter-remove"
                :disabled="!search && !selectedMarca && !selectedCategoria && !selectedEnvase"
              >
                Limpiar
              </v-btn>
            </v-col>
          </v-row>
          
          <!-- Panel de filtros expandible -->
          <v-expand-transition>
            <v-card v-show="showFilters" variant="outlined" class="mt-3 pa-3">
              <v-row>
                <v-col cols="12" md="4">
                  <v-select
                    v-model="selectedMarca"
                    :items="marcasUnicas"
                    label="Filtrar por marca"
                    clearable
                    variant="outlined"
                    density="compact"
                    prepend-icon="mdi-tag"
                  ></v-select>
                </v-col>
                <v-col cols="12" md="4">
                  <v-select
                    v-model="selectedCategoria"
                    :items="categoriasUnicas"
                    label="Filtrar por tipo de envase"
                    clearable
                    variant="outlined"
                    density="compact"
                    prepend-icon="mdi-shape"
                  ></v-select>
                </v-col>
                <v-col cols="12" md="4">
                  <v-select
                    v-model="selectedEnvase"
                    :items="envasesUnicos"
                    label="Filtrar por envase"
                    clearable
                    variant="outlined"
                    density="compact"
                    prepend-icon="mdi-package-variant"
                  ></v-select>
                </v-col>
              </v-row>
            </v-card>
          </v-expand-transition>
        </div>
        
        <v-data-table
          :headers="headers"
          :items="ofertasFiltradas"
          :loading="loading"
          :search="search"
          loading-text="Cargando ofertas..."
          no-data-text="No hay ofertas que coincidan con los filtros"
          height="450px"
          fixed-header
          density="compact"
          class="elevation-1 clickable-table"
          items-per-page="10"
          :items-per-page-options="[10, 25, 50, 100]"
        >
          <template v-slot:item="{ item }">
            <tr class="clickable-row" @click="selectOferta(item)">
              <td>
                <v-avatar size="40" class="ma-1">
                  <v-img 
                    v-if="item.producto_foto" 
                    :src="item.producto_foto" 
                    :alt="item.producto_nombre"
                    cover
                    class="hover-zoom"
                  />
                  <v-icon v-else color="grey-lighten-1" size="24">
                    mdi-package-variant
                  </v-icon>
                </v-avatar>
              </td>
              <td>
                <span class="font-weight-medium">{{ item.producto_codigo || 'N/A' }}</span>
              </td>
              <td>
                <div class="product-name">
                  <div class="text-body-2 font-weight-medium">{{ item.producto_nombre }}</div>
                  <div class="text-caption text-orange-darken-2 font-weight-bold">
                    <v-icon size="x-small" class="me-1">mdi-tag</v-icon>
                    {{ item.titulo }}
                  </div>
                </div>
              </td>
              <td>
                <v-chip 
                  v-if="item.producto_marca" 
                  size="small" 
                  color="primary" 
                  variant="outlined"
                >
                  {{ item.producto_marca }}
                </v-chip>
                <span v-else class="text-grey">Sin marca</span>
              </td>
              <td>
                <v-chip 
                  v-if="item.producto_envase" 
                  size="small" 
                  color="blue" 
                  variant="flat"
                >
                  {{ item.producto_envase }}
                </v-chip>
                <span v-else class="text-grey">-</span>
              </td>
              <td>
                <span class="text-success font-weight-bold text-h6">
                  ${{ formatCurrency(item.producto_precio_oferta) }}
                </span>
              </td>
              <td>
                <v-chip color="success" size="small" variant="elevated">
                  -{{ item.descuento_calculado }}%
                </v-chip>
              </td>
              <td>
                <v-btn
                  color="orange"
                  size="small"
                  variant="elevated"
                  @click.stop="selectOferta(item)"
                  prepend-icon="mdi-tag-check"
                >
                  Seleccionar
                </v-btn>
              </td>
            </tr>
          </template>
        </v-data-table>
      </v-card-text>
      
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          variant="text"
          @click="closeDialog"
        >
          Cancelar
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.v-data-table {
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 8px;
}

.search-filters-container {
  background: rgba(255, 152, 0, 0.05);
  border-radius: 8px;
  padding: 12px;
  border: 1px solid rgba(255, 152, 0, 0.2);
}

.product-image {
  transition: transform 0.2s ease;
}

.product-image:hover {
  transform: scale(1.1);
}

.product-name {
  max-width: 200px;
}

.v-card-title {
  background: linear-gradient(135deg, #ff9800 0%, #f57c00 100%);
  color: white;
}

.v-card-title .v-btn {
  color: white;
}

.v-data-table :deep(.v-data-table__wrapper) {
  border-radius: 8px;
}

.v-data-table :deep(th) {
  background-color: #fff3e0;
  font-weight: 600;
}

.v-data-table :deep(tr:hover) {
  background-color: rgba(255, 152, 0, 0.04);
}

.v-chip {
  font-weight: 500;
}

.text-success {
  color: #4caf50 !important;
}

/* Estilos para filas clickeables */
.clickable-row {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.clickable-row:hover {
  background-color: rgba(255, 152, 0, 0.08) !important;
}

.clickable-table :deep(.v-data-table__wrapper tbody tr) {
  cursor: pointer;
}

.clickable-table :deep(.v-data-table__wrapper tbody tr:hover) {
  background-color: rgba(255, 152, 0, 0.08) !important;
}
</style>
