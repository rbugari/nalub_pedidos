<script setup>
import { ref, onMounted } from 'vue'
import api from '../../services/api'
import { formatCurrency } from '../../utils/currency'

const productos = ref([])
const loading = ref(true)
const error = ref(null)
const search = ref('')
const imageDialog = ref(false)
const selectedImage = ref(null)
const selectedProductName = ref('')

const headers = [
  { title: 'Imagen', key: 'foto', sortable: false, width: '80px' },
  { title: 'Código', key: 'codigo', sortable: true },
  { title: 'Nombre', key: 'nombre', sortable: true },
  { title: 'Marca', key: 'marca', sortable: true },
  { title: 'Envase', key: 'envase', sortable: true },
  { title: 'Precio', key: 'precio', sortable: true, align: 'end' }
]

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
      <v-card-title>
        <v-text-field
          v-model="search"
          append-icon="mdi-magnify"
          label="Buscar productos..."
          single-line
          hide-details
          class="mb-4"
        ></v-text-field>
      </v-card-title>
      
      <v-data-table
        :headers="headers"
        :items="productos"
        :loading="loading"
        :search="search"
        loading-text="Cargando productos..."
        no-data-text="No hay productos disponibles"
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
        
        <template v-slot:item.precio="{ item }">
          <div class="text-body-1 font-weight-bold text-success text-right">
            {{ formatCurrency(item.precio) }}
          </div>
        </template>
        
        <template v-slot:item.envase="{ item }">
          {{ item.envase }} ({{ item.litros }}L)
        </template>
      </v-data-table>
    </v-card>

    <!-- Modal para mostrar imagen del producto -->
    <v-dialog v-model="imageDialog" max-width="600px">
      <v-card>
        <v-card-title class="d-flex justify-space-between align-center">
          <span>{{ selectedProductName }}</span>
          <v-btn
            icon="mdi-close"
            variant="text"
            @click="imageDialog = false"
          ></v-btn>
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
</style>