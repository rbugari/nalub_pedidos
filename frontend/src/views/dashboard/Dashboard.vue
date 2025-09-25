<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../../services/api'
import { formatCurrency } from '../../utils/currency'

const router = useRouter()
const cliente = ref(null)
const prepedidosAbiertos = ref(0)
const pedidosAnoActual = ref(0)
const cuentasInfo = ref({ pedidos_principales: 0, pedidos_secundarios: 0 })
const ofertasDestacadas = ref([])
const loading = ref(true)
const error = ref(null)
const imageDialog = ref(false)
const selectedImage = ref(null)
const selectedProductName = ref('')



const formatDate = (dateString) => {
  if (!dateString) return 'Sin registro'
  return new Date(dateString).toLocaleDateString('es-AR')
}

const getDeudaStatus = (diasDeuda) => {
  if (diasDeuda === 0) return { color: 'success', text: 'Al día' }
  if (diasDeuda <= 30) return { color: 'warning', text: 'Vencida' }
  return { color: 'error', text: 'Muy vencida' }
}

const openImageModal = (oferta) => {
  if (oferta.producto_foto || oferta.imagen_url) {
    selectedImage.value = oferta.producto_foto || oferta.imagen_url
    selectedProductName.value = oferta.producto_nombre || oferta.titulo
    imageDialog.value = true
  }
}

onMounted(async () => {
  try {
    const [dashboardResponse, ofertasResponse] = await Promise.all([
      api.get('/dashboard'),
      api.get('/dashboard/ofertas-destacadas')
    ])
    
    if (dashboardResponse.data.success) {
      cliente.value = dashboardResponse.data.data.cliente
      prepedidosAbiertos.value = dashboardResponse.data.data.prepedidosAbiertos
      pedidosAnoActual.value = dashboardResponse.data.data.pedidosAnoActual
      cuentasInfo.value = dashboardResponse.data.data.cuentasInfo || { pedidos_principales: 0, pedidos_secundarios: 0 }
    }
    ofertasDestacadas.value = ofertasResponse.data.success ? ofertasResponse.data.data : []
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
        <p class="text-subtitle-1 text-grey-darken-1" v-if="cliente">Bienvenido, {{ cliente.nombre }}</p>
      </v-col>
    </v-row>
    
    <v-alert v-if="error" type="error" class="mb-4">{{ error }}</v-alert>
    
    <v-row v-if="loading">
      <v-col v-for="i in 3" :key="i" cols="12" md="4">
        <v-skeleton-loader type="card" />
      </v-col>
    </v-row>
    
    <template v-else-if="cliente">
      <!-- Información personal de deuda -->
      <v-row class="mb-4">
        <v-col cols="12" sm="6" md="3">
          <v-card color="error" dark class="dashboard-card">
            <v-card-text class="pa-3">
              <div class="d-flex align-center">
                <v-icon size="32" class="mr-3">mdi-currency-usd</v-icon>
                <div>
                  <div class="text-h6 font-weight-bold">{{ formatCurrency(cliente.deuda) }}</div>
                  <div class="text-caption">Mi Deuda Actual</div>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        
        <v-col cols="12" sm="6" md="3">
          <v-card :color="getDeudaStatus(cliente.diasDeuda).color" dark class="dashboard-card">
            <v-card-text class="pa-3">
              <div class="d-flex align-center">
                <v-icon size="32" class="mr-3">mdi-calendar-clock</v-icon>
                <div>
                  <div class="text-h6 font-weight-bold">{{ cliente.diasDeuda }}</div>
                  <div class="text-caption">Días de Deuda</div>
                  <div class="text-caption">{{ getDeudaStatus(cliente.diasDeuda).text }}</div>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        
        <v-col cols="12" sm="6" md="3">
          <v-card color="info" dark class="dashboard-card">
            <v-card-text class="pa-3">
              <div class="d-flex align-center">
                <v-icon size="32" class="mr-3">mdi-calendar-check</v-icon>
                <div>
                  <div class="text-subtitle-2 font-weight-bold">{{ formatDate(cliente.fechaUltimoPago) }}</div>
                  <div class="text-caption">Último Pago</div>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Información de pedidos por tipo de cuenta -->
      <v-row class="mb-4">
      </v-row>
      

      
      <!-- Ofertas Destacadas -->
      <v-row>
        <v-col cols="12">
          <h2 class="text-h5 mb-4">Ofertas Destacadas</h2>
        </v-col>
      </v-row>
      
      <v-row v-if="ofertasDestacadas.length > 0">
        <v-col v-for="oferta in ofertasDestacadas" :key="oferta.id" cols="12" md="4">
          <v-card class="compact-offer-card">
            <!-- Imagen del producto como header -->
            <div class="product-image-container">
              <v-img
                :src="oferta.producto_foto || oferta.imagen_url || 'https://via.placeholder.com/120x120'"
                contain
                class="product-image"
                style="cursor: pointer;"
                @click="openImageModal(oferta)"
              >
                <v-chip
                  color="error"
                  class="discount-chip"
                  size="x-small"
                  v-if="oferta.descuento_porcentaje"
                >
                  -{{ oferta.descuento_porcentaje }}%
                </v-chip>
              </v-img>
            </div>
            
            <!-- Información del producto -->
            <div class="product-info">
              <div class="product-title">{{ oferta.titulo }}</div>
              <div class="product-name" v-if="oferta.producto_nombre">{{ oferta.producto_nombre }}</div>
              <div class="product-date">Válida hasta: {{ new Date(oferta.fecha_fin).toLocaleDateString() }}</div>
              
              <!-- Precios -->
              <div class="product-footer">
                <div class="price-container" v-if="oferta.producto_precio">
                  <span class="original-price">{{ formatCurrency(oferta.producto_precio) }}</span>
                  <span class="discounted-price">{{ formatCurrency(oferta.producto_precio * (1 - oferta.descuento_porcentaje / 100)) }}</span>
                </div>
              </div>
            </div>
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
/* Altura uniforme para todas las tarjetas del dashboard - más compacto */
.dashboard-card {
  height: 90px !important;
  display: flex;
  flex-direction: column;
  padding: 4px !important;
}

.dashboard-card .v-card-text {
  flex: 1;
  display: flex;
  align-items: center;
  padding: 8px 12px !important;
}

/* Tarjetas de ofertas destacadas - diseño vertical */
.compact-offer-card {
  height: 240px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* Contenedor de imagen del producto */
.product-image-container {
  height: 120px;
  position: relative;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
  border-radius: 4px 4px 0 0;
}

.product-image {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  object-fit: contain;
}

.discount-chip {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 2;
}

/* Información del producto */
.product-info {
  flex: 1;
  padding: 12px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.product-title {
  font-size: 0.9rem;
  font-weight: 600;
  line-height: 1.2;
  margin-bottom: 4px;
  color: #1a1a1a;
}

.product-name {
  font-size: 0.75rem;
  color: #666;
  margin-bottom: 6px;
  line-height: 1.1;
}

.product-date {
  font-size: 0.7rem;
  color: #888;
  margin-bottom: 8px;
}

/* Footer con precios y botón */
.product-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
}

.price-container {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.original-price {
  font-size: 0.7rem;
  text-decoration: line-through;
  color: #999;
}

.discounted-price {
  font-size: 0.8rem;
  font-weight: 600;
  color: #4caf50;
}

.add-btn {
  height: 32px !important;
  font-size: 0.7rem !important;
  min-width: 70px !important;
  padding: 0 12px !important;
}

/* Ajuste para botones en acciones rápidas */
.dashboard-card .v-btn {
  height: 32px !important;
  font-size: 0.7rem !important;
  padding: 0 8px !important;
}

/* Iconos más pequeños */
.dashboard-card .v-icon {
  font-size: 22px !important;
  margin-right: 8px !important;
}

/* Texto más compacto */
.dashboard-card .text-h6 {
  font-size: 0.95rem !important;
  line-height: 1.1;
  font-weight: 600 !important;
}

.dashboard-card .text-caption {
  font-size: 0.65rem !important;
  line-height: 1;
  margin-top: 2px;
}

.dashboard-card .text-subtitle-2 {
  font-size: 0.8rem !important;
  line-height: 1.1;
  font-weight: 600 !important;
}



/* Efecto hover para imágenes clickeables */
.product-image {
  transition: transform 0.2s ease;
}

.product-image:hover {
  transform: scale(1.05);
}
</style>