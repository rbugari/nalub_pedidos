<script setup>
import { ref, onMounted } from 'vue'
import api from '../../services/api'

const ofertas = ref([])
const loading = ref(true)
const error = ref(null)
const imageDialog = ref(false)
const selectedImage = ref(null)
const selectedProductName = ref('')

const headers = [
  { title: 'Imagen', key: 'foto', sortable: false, width: '80px' },
  { title: 'Título', key: 'titulo', sortable: true, width: '200px' },
  { title: 'Producto', key: 'producto_nombre', sortable: true, width: '180px' },
  { title: 'Descripción', key: 'descripcion', sortable: false, width: '250px' },
  { title: 'Descuento %', key: 'descuento_porcentaje', sortable: true, width: '120px', align: 'center' },
  { title: 'Fecha Fin', key: 'fecha_fin', sortable: true, width: '120px', align: 'center' }
]

// Función para formatear fecha a dd/mm/yyyy
function formatDate(dateString) {
  if (!dateString) return '-'
  const date = new Date(dateString)
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

onMounted(async () => {
  await loadOfertas()
})

async function loadOfertas() {
  try {
    loading.value = true
    // Usar endpoint específico para ofertas vigentes del mes
    const response = await api.get('/ofertas/vigentes-mes')
    ofertas.value = response.data.data || response.data
  } catch (err) {
    console.error('Error al cargar ofertas:', err)
    error.value = 'Error al cargar las ofertas del mes actual'
  } finally {
    loading.value = false
  }
}

function openImageModal(oferta) {
  if (oferta.producto_foto) {
    selectedImage.value = oferta.producto_foto
    selectedProductName.value = oferta.producto_nombre || oferta.titulo
    imageDialog.value = true
  }
}
</script>

<template>
  <div class="pa-6">
    <v-row align="center" class="mb-6">
      <v-col>
        <h1 class="text-h4 font-weight-bold text-primary">Ofertas del Mes</h1>
        <p class="text-subtitle-1 text-grey-darken-1">
          <v-icon icon="mdi-calendar-month" class="me-2"></v-icon>
          Promociones vigentes para {{ new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }) }}
        </p>
      </v-col>
    </v-row>

    <v-alert v-if="error" type="error" class="mb-4" variant="tonal">
      <v-icon icon="mdi-alert-circle"></v-icon>
      {{ error }}
    </v-alert>

    <v-card elevation="2" class="rounded-lg">
      <v-card-title class="bg-grey-lighten-5 pa-4">
        <v-icon icon="mdi-tag-multiple" class="me-2 text-primary"></v-icon>
        <span class="text-h6">Ofertas Vigentes</span>
        <v-spacer></v-spacer>
        <v-chip color="primary" variant="outlined" size="small">
          {{ ofertas.length }} ofertas
        </v-chip>
      </v-card-title>
      
      <v-data-table
        :headers="headers"
        :items="ofertas"
        :loading="loading"
        loading-text="Cargando ofertas del mes..."
        no-data-text="No hay ofertas vigentes este mes"
        class="elevation-0"
        :items-per-page="15"
        :items-per-page-options="[10, 15, 25, 50]"
      >
        <template v-slot:item.foto="{ item }">
          <v-avatar size="50" class="ma-1" rounded="lg" style="cursor: pointer;" @click="openImageModal(item)">
            <v-img
              v-if="item.producto_foto"
              :src="item.producto_foto"
              :alt="item.producto_nombre || item.titulo"
              cover
              class="product-image"
            ></v-img>
            <v-icon v-else color="grey-lighten-1" size="30">mdi-tag-multiple</v-icon>
          </v-avatar>
        </template>
        
        <template v-slot:item.titulo="{ item }">
          <div class="font-weight-medium text-primary">
            {{ item.titulo }}
          </div>
        </template>
        
        <template v-slot:item.producto_nombre="{ item }">
          <div class="d-flex align-center">
            <v-icon icon="mdi-package-variant" class="me-2 text-grey-darken-1" size="small"></v-icon>
            <span class="text-body-2">{{ item.producto_nombre || 'Oferta general' }}</span>
          </div>
        </template>
        
        <template v-slot:item.descripcion="{ item }">
          <div class="text-truncate text-body-2" style="max-width: 250px;" :title="item.descripcion">
            {{ item.descripcion }}
          </div>
        </template>
        
        <template v-slot:item.descuento_porcentaje="{ item }">
          <v-chip
            color="success"
            variant="tonal"
            size="small"
            class="font-weight-bold"
          >
            {{ item.descuento_porcentaje }}%
          </v-chip>
        </template>
        
        <template v-slot:item.fecha_fin="{ item }">
          <div class="text-center">
            <v-chip
              color="warning"
              variant="outlined"
              size="small"
              prepend-icon="mdi-calendar-end"
            >
              {{ formatDate(item.fecha_fin) }}
            </v-chip>
          </div>
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

.v-data-table :deep(tr:hover) {
  background-color: rgba(25, 118, 210, 0.04);
}
</style>