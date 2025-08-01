<script setup>
import { ref, onMounted } from 'vue'
import api from '../../services/api'

const productos = ref([])
const loading = ref(true)
const error = ref(null)
const search = ref('')

const headers = [
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Código', key: 'codigo', sortable: true },
  { title: 'Nombre', key: 'nombre', sortable: true },
  { title: 'Marca', key: 'marca', sortable: true },
  { title: 'Envase', key: 'envase', sortable: true },
  { title: 'Precio', key: 'precio', sortable: true }
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
        <template v-slot:item.precio="{ item }">
          ${{ item.precio }}
        </template>
        
        <template v-slot:item.envase="{ item }">
          {{ item.envase }} ({{ item.litros }}L)
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>