<script setup>
import { ref, onMounted, computed } from 'vue'
import api from '../../services/api'
import { formatCurrency } from '../../utils/currency'

const productos = ref([])
const loading = ref(true)
const error = ref(null)
const search = ref('')
const imageDialog = ref(false)
const selectedImage = ref(null)
const selectedProductName = ref('')

const headers = computed(() => {
  const baseHeaders = [
    { title: 'Imagen', key: 'foto', sortable: false, width: '80px' },
    { title: 'Código', key: 'codigo', sortable: true },
    { title: 'Nombre', key: 'nombre', sortable: true },
    { title: 'Marca', key: 'marca', sortable: true },
    { title: 'Envase', key: 'envase', sortable: true },
    { title: 'Precio Base', key: 'precioBase', sortable: true, align: 'end' }
  ]
  
  // Si hay productos, obtener los porcentajes del primer producto para los headers
  if (productos.value.length > 0) {
    const firstProduct = productos.value[0]
    baseHeaders.push(
      { 
        title: `Precio 1${firstProduct.porcentaje1 && firstProduct.porcentaje1 > 0 ? ` (${firstProduct.porcentaje1}%)` : ''}`, 
        key: 'precio1', 
        sortable: true, 
        align: 'end' 
      },
      { 
        title: `Precio 2${firstProduct.porcentaje2 && firstProduct.porcentaje2 > 0 ? ` (${firstProduct.porcentaje2}%)` : ''}`, 
        key: 'precio2', 
        sortable: true, 
        align: 'end' 
      },
      { 
        title: `Precio 3${firstProduct.porcentaje3 && firstProduct.porcentaje3 > 0 ? ` (${firstProduct.porcentaje3}%)` : ''}`, 
        key: 'precio3', 
        sortable: true, 
        align: 'end' 
      }
    )
  } else {
    // Headers por defecto cuando no hay productos
    baseHeaders.push(
      { title: 'Precio 1', key: 'precio1', sortable: true, align: 'end' },
      { title: 'Precio 2', key: 'precio2', sortable: true, align: 'end' },
      { title: 'Precio 3', key: 'precio3', sortable: true, align: 'end' }
    )
  }
  
  return baseHeaders
})

onMounted(async () => {
  await loadProductos()
})

async function loadProductos() {
  try {
    loading.value = true
    const response = await api.get('/productos')
    productos.value = response.data.data // Acceder a data anidada
  } catch (err) {
    console.error('Error al cargar productos:', err)
    error.value = 'Error al cargar los productos'
  } finally {
    loading.value = false
  }
}

function openImageModal(producto) {
  if (producto.foto) {
    selectedImage.value = producto.foto
    selectedProductName.value = producto.nombre
    imageDialog.value = true
  }
}
</script>

<template>
  <div>
    <v-row class="mb-4">
      <v-col>
        <h1 class="text-h4 font-weight-bold">Productos</h1>
        <p class="text-subtitle-1 text-grey-600">Consulta de productos disponibles</p>
      </v-col>
    </v-row>

    <v-alert v-if="error" type="error" class="mb-4">{{ error }}</v-alert>

    <v-card>
      <!-- Input de búsqueda fijo -->
      <v-card-title class="sticky-search-header">
        <v-text-field
          v-model="search"
          append-icon="mdi-magnify"
          label="Buscar productos..."
          single-line
          hide-details
          class="mb-4"
        ></v-text-field>
      </v-card-title>
      
      <!-- Contenedor con scroll para la tabla -->
      <div class="table-container">
        <v-data-table
          :headers="headers"
          :items="productos"
          :loading="loading"
          :search="search"
          loading-text="Cargando productos..."
          no-data-text="No hay productos disponibles"
          class="sticky-header-table"
          :height="600"
          fixed-header
          :items-per-page="-1"
        >
        <template v-slot:item.foto="{ item }">
          <v-avatar size="50" class="ma-1" rounded="lg" style="cursor: pointer;" @click="openImageModal(item)">
            <v-img
              v-if="item.foto"
              :src="item.foto"
              :alt="item.nombre"
              cover
              class="product-image"
            ></v-img>
            <v-icon v-else color="grey-lighten-1" size="30">mdi-package-variant</v-icon>
          </v-avatar>
        </template>
        
        <template v-slot:item.precioBase="{ item }">
          <div class="text-body-1 font-weight-bold text-primary text-right">
            {{ formatCurrency(item.precioBase) }}
          </div>
        </template>
        
        <template v-slot:item.precio1="{ item }">
          <div class="text-body-1 font-weight-bold text-success text-right">
            {{ formatCurrency(item.precio1) }}
          </div>
        </template>
        
        <template v-slot:item.precio2="{ item }">
          <div class="text-body-1 font-weight-bold text-warning text-right">
            {{ formatCurrency(item.precio2) }}
          </div>
        </template>
        
        <template v-slot:item.precio3="{ item }">
          <div class="text-body-1 font-weight-bold text-error text-right">
            {{ formatCurrency(item.precio3) }}
          </div>
        </template>
        
        <template v-slot:item.envase="{ item }">
          {{ item.envase }} ({{ item.litros }}L)
        </template>
      </v-data-table>
      </div>
    </v-card>

    <!-- Modal para mostrar imagen ampliada -->
    <v-dialog v-model="imageDialog" max-width="600">
      <v-card>
        <v-card-title class="d-flex justify-space-between align-center">
          <span class="text-h6">{{ selectedProductName }}</span>
          <v-btn icon @click="imageDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text class="pa-0">
          <v-img
            v-if="selectedImage"
            :src="selectedImage"
            :alt="selectedProductName"
            contain
            max-height="400"
            class="mx-auto"
          ></v-img>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.product-image {
  transition: transform 0.2s ease;
}

.product-image:hover {
  transform: scale(1.1);
}

.text-success {
  color: #4caf50 !important;
}

.v-data-table :deep(tr:hover) {
  background-color: rgba(25, 118, 210, 0.04);
}

/* Estilos para header fijo */
.sticky-search-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: white;
  border-bottom: 1px solid #e0e0e0;
}

.table-container {
  position: relative;
  max-height: 600px;
  overflow-y: auto;
}

.sticky-header-table :deep(.v-data-table__wrapper) {
  overflow-y: auto;
}

.sticky-header-table :deep(thead th) {
  position: sticky;
  top: 0;
  z-index: 5;
  background-color: #f5f5f5;
  border-bottom: 2px solid #e0e0e0;
}
</style>