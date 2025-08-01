<script setup>
import { ref, onMounted } from 'vue'
import api from '../../services/api'

const dashboardData = ref({
  pedidosPendientes: 0,
  pedidosCompletados: 0,
  totalProductos: 0
})
const ofertasDestacadas = ref([])
const loading = ref(true)
const error = ref(null)

onMounted(async () => {
  try {
    const [dashboardResponse, ofertasResponse] = await Promise.all([
      api.get('/dashboard'),
      api.get('/dashboard/ofertas-destacadas') // Cambiado de '/dashboard/ofertas' a '/dashboard/ofertas-destacadas'
    ])
    
    dashboardData.value = dashboardResponse.data
    ofertasDestacadas.value = ofertasResponse.data
  } catch (err) {
    console.error('Error al cargar datos del dashboard:', err)
    error.value = 'Error al cargar los datos del dashboard'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div>
    <v-row class="mb-6">
      <v-col>
        <h1 class="text-h4 font-weight-bold">Dashboard</h1>
        <p class="text-subtitle-1 text-grey-darken-1">Resumen general del sistema</p>
      </v-col>
    </v-row>
    
    <v-alert v-if="error" type="error" class="mb-4">{{ error }}</v-alert>
    
    <v-row v-if="loading">
      <v-col v-for="i in 3" :key="i" cols="12" md="4">
        <v-skeleton-loader type="card" />
      </v-col>
    </v-row>
    
    <template v-else>
      <!-- Tarjetas de resumen -->
      <v-row class="mb-6">
        <v-col cols="12" md="4">
          <v-card color="primary" dark>
            <v-card-text>
              <div class="d-flex align-center">
                <v-icon size="40" class="mr-4">mdi-clock-outline</v-icon>
                <div>
                  <div class="text-h4 font-weight-bold">{{ dashboardData.pedidosPendientes }}</div>
                  <div class="text-subtitle-1">Pedidos Pendientes</div>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        
        <v-col cols="12" md="4">
          <v-card color="success" dark>
            <v-card-text>
              <div class="d-flex align-center">
                <v-icon size="40" class="mr-4">mdi-check-circle</v-icon>
                <div>
                  <div class="text-h4 font-weight-bold">{{ dashboardData.pedidosCompletados }}</div>
                  <div class="text-subtitle-1">Pedidos Completados</div>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        
        <v-col cols="12" md="4">
          <v-card color="info" dark>
            <v-card-text>
              <div class="d-flex align-center">
                <v-icon size="40" class="mr-4">mdi-package-variant</v-icon>
                <div>
                  <div class="text-h4 font-weight-bold">{{ dashboardData.totalProductos }}</div>
                  <div class="text-subtitle-1">Total Productos</div>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
      
      <!-- Ofertas Destacadas -->
      <v-row>
        <v-col cols="12">
          <h2 class="text-h5 mb-4">Ofertas Destacadas</h2>
        </v-col>
      </v-row>
      
      <v-row v-if="ofertasDestacadas.length > 0">
        <v-col v-for="oferta in ofertasDestacadas" :key="oferta.id" cols="12" md="4">
          <v-card>
            <v-img
              height="200"
              :src="oferta.imagen || 'https://via.placeholder.com/300x200'"
              cover
            >
              <v-chip
                color="error"
                class="ma-2"
                size="small"
              >
                -{{ oferta.descuento }}%
              </v-chip>
            </v-img>
            <v-card-title>{{ oferta.nombre }}</v-card-title>
            <v-card-subtitle>
              <span class="text-decoration-line-through mr-2">{{ oferta.precioOriginal }}€</span>
              <span class="font-weight-bold text-success">{{ oferta.precioOferta }}€</span>
            </v-card-subtitle>
            <v-card-text>{{ oferta.descripcion }}</v-card-text>
            <v-card-actions>
              <v-btn color="primary" variant="text">Ver Detalles</v-btn>
              <v-spacer></v-spacer>
              <v-btn color="success" variant="elevated">Añadir al Pedido</v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
      
      <v-row v-else>
        <v-col cols="12">
          <v-card>
            <v-card-text class="text-center py-8">
              <v-icon size="64" color="grey-lighten-1">mdi-tag-off</v-icon>
              <div class="text-h6 mt-4">No hay ofertas destacadas disponibles</div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </template>
  </div>
</template>