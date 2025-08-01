<script setup>
import { ref, onMounted } from 'vue'
import api from '../../services/api'

const ofertas = ref([])
const loading = ref(true)
const error = ref(null)

const headers = [
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Título', key: 'titulo', sortable: true },
  { title: 'Descripción', key: 'descripcion', sortable: false },
  { title: 'Descuento %', key: 'descuento_porcentaje', sortable: true },
  { title: 'Fecha Inicio', key: 'fecha_inicio', sortable: true },
  { title: 'Fecha Fin', key: 'fecha_fin', sortable: true },
  { title: 'Estado', key: 'activa', sortable: true }
]

onMounted(async () => {
  await loadOfertas()
})

async function loadOfertas() {
  try {
    loading.value = true
    const response = await api.get('/ofertas')
    ofertas.value = response.data.data || response.data
  } catch (err) {
    console.error('Error al cargar ofertas:', err)
    error.value = 'Error al cargar las ofertas'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="pa-6">
    <v-row align="center" class="mb-6">
      <v-col>
        <h1 class="text-h4 font-weight-bold">Ofertas</h1>
        <p class="text-subtitle-1 text-grey-darken-1">Consulta de ofertas y promociones vigentes</p>
      </v-col>
    </v-row>

    <v-alert v-if="error" type="error" class="mb-4">{{ error }}</v-alert>

    <v-card>
      <v-data-table
        :headers="headers"
        :items="ofertas"
        :loading="loading"
        loading-text="Cargando ofertas..."
        no-data-text="No hay ofertas disponibles"
      >
        <template v-slot:item.descripcion="{ item }">
          <div class="text-truncate" style="max-width: 200px;">
            {{ item.descripcion }}
          </div>
        </template>
        
        <template v-slot:item.descuento_porcentaje="{ item }">
          {{ item.descuento_porcentaje }}%
        </template>
        
        <template v-slot:item.fecha_inicio="{ item }">
          {{ new Date(item.fecha_inicio).toLocaleDateString() }}
        </template>
        
        <template v-slot:item.fecha_fin="{ item }">
          {{ new Date(item.fecha_fin).toLocaleDateString() }}
        </template>
        
        <template v-slot:item.activa="{ item }">
          <v-chip
            :color="item.activa ? 'success' : 'error'"
            size="small"
            variant="elevated"
          >
            {{ item.activa ? 'Activa' : 'Inactiva' }}
          </v-chip>
        </template>
      </v-data-table>
    </v-card>
  </div>
</template>