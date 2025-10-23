<script setup>
import { ref, onMounted, computed, defineEmits, defineProps } from 'vue'
import api from '../services/api'
import { formatCurrency } from '../utils/currency'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'product-selected'])

const productos = ref([])
const loading = ref(true)
const error = ref(null)
const search = ref('')
const selectedProduct = ref(null)
const selectedMarca = ref('')
const selectedCategoria = ref('')
const selectedEnvase = ref('')
const selectedCapacidad = ref('')
const showFilters = ref(false)

// Computed properties para filtros
const marcasUnicas = computed(() => {
  const marcas = [...new Set(productos.value.map(p => p.marca).filter(Boolean))]
  return marcas.sort()
})

const categoriasUnicas = computed(() => {
  const categorias = [...new Set(productos.value.map(p => p.tipo_envase).filter(Boolean))]
  return categorias.sort()
})

const envasesUnicos = computed(() => {
  const envases = [...new Set(productos.value.map(p => p.envase).filter(Boolean))]
  return envases.sort()
})

const capacidadesUnicas = computed(() => {
  const capacidades = [...new Set(productos.value.map(p => p.litros).filter(Boolean))]
  return capacidades.sort((a, b) => parseFloat(a) - parseFloat(b))
})

// Productos filtrados
const productosFiltrados = computed(() => {
  let filtered = productos.value
  
  if (selectedMarca.value) {
    filtered = filtered.filter(p => p.marca === selectedMarca.value)
  }
  
  if (selectedCategoria.value) {
    filtered = filtered.filter(p => p.tipo_envase === selectedCategoria.value)
  }
  
  if (selectedEnvase.value) {
    filtered = filtered.filter(p => p.envase === selectedEnvase.value)
  }
  
  if (selectedCapacidad.value) {
    filtered = filtered.filter(p => p.litros && p.litros.toString() === selectedCapacidad.value.toString())
  }
  
  return filtered
})

const headers = [
  { title: 'Imagen', key: 'foto', sortable: false, width: '80px' },
  { title: 'Código', key: 'codigo', sortable: true },
  { title: 'Nombre', key: 'nombre', sortable: true },
  { title: 'Marca', key: 'marca', sortable: true },
  { title: 'Precio', key: 'precio', sortable: true },
  { title: 'Tipo de Envase', key: 'tipo_envase', sortable: true },
  { title: 'Capacidad', key: 'litros', sortable: true },
  { title: 'Seleccionar', key: 'actions', sortable: false, width: '120px' }
]

onMounted(async () => {
  await loadProductos()
})

async function loadProductos() {
  try {
    loading.value = true
    const response = await api.get('/productos')
    productos.value = response.data.data
  } catch (err) {
    console.error('Error al cargar productos:', err)
    error.value = 'Error al cargar los productos'
  } finally {
    loading.value = false
  }
}

function selectProduct(producto) {
  selectedProduct.value = producto
  emit('product-selected', producto)
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
  selectedCapacidad.value = ''
  selectedProduct.value = null
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
    max-width="1200px"
    persistent
  >
    <v-card>
      <v-card-title class="d-flex justify-space-between align-center">
        <span class="text-h5">Seleccionar Producto</span>
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
                label="Buscar productos por código, nombre o marca..."
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
                :disabled="!search && !selectedMarca && !selectedCategoria && !selectedEnvase && !selectedCapacidad"
              >
                Limpiar
              </v-btn>
            </v-col>
          </v-row>
          
          <!-- Panel de filtros expandible -->
          <v-expand-transition>
            <v-card v-show="showFilters" variant="outlined" class="mt-3 pa-3">
              <v-row>
                <v-col cols="12" md="3">
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
                <v-col cols="12" md="3">
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
                <v-col cols="12" md="3">
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
                <v-col cols="12" md="3">
                  <v-select
                    v-model="selectedCapacidad"
                    :items="capacidadesUnicas"
                    label="Filtrar por capacidad"
                    clearable
                    variant="outlined"
                    density="compact"
                    prepend-icon="mdi-cup-water"
                    item-title="value"
                    item-value="value"
                  >
                    <template v-slot:item="{ props, item }">
                      <v-list-item v-bind="props" :title="`${item.raw}L`"></v-list-item>
                    </template>
                    <template v-slot:selection="{ item }">
                      {{ item.raw }}L
                    </template>
                  </v-select>
                </v-col>
              </v-row>
            </v-card>
          </v-expand-transition>
        </div>
        
        <v-data-table
          :headers="headers"
          :items="productosFiltrados"
          :loading="loading"
          :search="search"
          loading-text="Cargando productos..."
          no-data-text="No hay productos que coincidan con los filtros"
          height="450px"
          fixed-header
          class="elevation-1 clickable-table"
          :items-per-page="-1"
          :items-per-page-options="[10, 25, 50, 100, -1]"
        >
          <template v-slot:item="{ item }">
            <tr class="clickable-row" @click="selectProduct(item)">
              <td>
                <v-avatar size="50" class="ma-1" rounded="lg">
                  <v-img
                    v-if="item.foto"
                    :src="item.foto"
                    :alt="item.nombre"
                    cover
                    class="product-image"
                  ></v-img>
                  <v-icon v-else color="grey-lighten-1" size="30">mdi-package-variant</v-icon>
                </v-avatar>
              </td>
              <td>
                <div class="text-body-2 font-weight-medium">
                  {{ item.codigo }}
                </div>
              </td>
              <td>
                <div class="product-name">
                  <div class="text-body-1 font-weight-medium">{{ item.nombre }}</div>
                  <div v-if="item.descripcion" class="text-caption text-grey-darken-1 mt-1">
                    {{ item.descripcion }}
                  </div>
                </div>
              </td>
              <td>
                <v-chip
                  v-if="item.marca"
                  size="small"
                  color="primary"
                  variant="outlined"
                >
                  {{ item.marca }}
                </v-chip>
              </td>
              <td>
                <div class="text-body-1 font-weight-bold" :class="item.en_oferta ? 'text-error' : 'text-success'">
                  {{ item.en_oferta && item.precio_oferta ? formatCurrency(item.precio_oferta) : formatCurrency(item.precioBase || item.precio) }}
                </div>
                <div v-if="item.en_oferta && item.precio_oferta" class="text-caption text-grey text-decoration-line-through">
                  {{ formatCurrency(item.precioBase || item.precio) }}
                </div>
              </td>
              <td>
                <v-chip
                  v-if="item.tipo_envase"
                  size="small"
                  color="secondary"
                  variant="outlined"
                >
                  {{ item.tipo_envase }}
                </v-chip>
                <span v-else class="text-grey">-</span>
              </td>
              <td>
                <div class="text-body-2 font-weight-medium">
                  {{ item.litros ? `${item.litros}L` : '-' }}
                </div>
              </td>
              <td>
                <v-btn
                  color="primary"
                  size="small"
                  variant="elevated"
                  @click.stop="selectProduct(item)"
                  prepend-icon="mdi-check"
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
  background: rgba(0, 0, 0, 0.02);
  border-radius: 8px;
  padding: 16px;
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
  background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
  color: white;
}

.v-card-title .v-btn {
  color: white;
}

.v-data-table :deep(.v-data-table__wrapper) {
  border-radius: 8px;
}

.v-data-table :deep(th) {
  background-color: #f5f5f5;
  font-weight: 600;
}

.v-data-table :deep(tr:hover) {
  background-color: rgba(25, 118, 210, 0.04);
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
  background-color: rgba(25, 118, 210, 0.08) !important;
}

.clickable-table :deep(.v-data-table__wrapper tbody tr) {
  cursor: pointer;
}

.clickable-table :deep(.v-data-table__wrapper tbody tr:hover) {
  background-color: rgba(25, 118, 210, 0.08) !important;
}
</style>