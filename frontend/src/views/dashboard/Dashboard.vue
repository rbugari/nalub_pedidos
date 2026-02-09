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
        <div class="d-flex align-center mb-2">
          <v-icon size="40" color="primary" class="mr-3">mdi-view-dashboard</v-icon>
          <div>
            <h1 class="text-h4 font-weight-bold mb-0">Dashboard</h1>
            <p class="text-subtitle-1 text-grey-darken-1 mb-0" v-if="cliente">Bienvenido, {{ cliente.nombre }}</p>
          </div>
        </div>
      </v-col>
    </v-row>
    
    <v-alert v-if="error" type="error" class="mb-4" prominent border="start">
      <v-icon start>mdi-alert-circle</v-icon>
      {{ error }}
    </v-alert>
    
    <v-row v-if="loading">
      <v-col v-for="i in 3" :key="i" cols="12" md="4">
        <v-skeleton-loader type="card" class="elevation-2" />
      </v-col>
    </v-row>
    
    <template v-else-if="cliente">
      <!-- Información personal de deuda -->
      <v-row class="mb-6">
        <v-col cols="12" sm="6" md="3">
          <v-card color="error" dark class="dashboard-card elevation-4" hover>
            <v-card-text class="pa-4">
              <div class="d-flex align-center">
                <v-avatar color="white" size="56" class="mr-4">
                  <v-icon size="32" color="error">mdi-currency-usd</v-icon>
                </v-avatar>
                <div>
                  <div class="text-h5 font-weight-bold mb-1">{{ formatCurrency(cliente.deuda) }}</div>
                  <div class="text-body-2 text-uppercase" style="opacity: 0.9; letter-spacing: 1px;">Mi Deuda Actual</div>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        
        <v-col cols="12" sm="6" md="3">
          <v-card :color="getDeudaStatus(cliente.diasDeuda).color" dark class="dashboard-card elevation-4" hover>
            <v-card-text class="pa-4">
              <div class="d-flex align-center">
                <v-avatar color="white" size="56" class="mr-4">
                  <v-icon size="32" :color="getDeudaStatus(cliente.diasDeuda).color">mdi-calendar-clock</v-icon>
                </v-avatar>
                <div>
                  <div class="text-h5 font-weight-bold mb-1">{{ cliente.diasDeuda }} días</div>
                  <div class="text-body-2 text-uppercase" style="opacity: 0.9; letter-spacing: 1px;">{{ getDeudaStatus(cliente.diasDeuda).text }}</div>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        
        <v-col cols="12" sm="6" md="3">
          <v-card color="info" dark class="dashboard-card elevation-4" hover>
            <v-card-text class="pa-4">
              <div class="d-flex align-center">
                <v-avatar color="white" size="56" class="mr-4">
                  <v-icon size="32" color="info">mdi-calendar-check</v-icon>
                </v-avatar>
                <div>
                  <div class="text-body-1 font-weight-bold mb-1">{{ formatDate(cliente.fechaUltimoPago) }}</div>
                  <div class="text-body-2 text-uppercase" style="opacity: 0.9; letter-spacing: 1px;">Último Pago</div>
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
      <v-row class="mb-4">
        <v-col cols="12">
          <div class="d-flex align-center">
            <v-icon size="32" color="primary" class="mr-3">mdi-tag-star</v-icon>
            <h2 class="text-h5 font-weight-bold">Ofertas Destacadas</h2>
          </div>
        </v-col>
      </v-row>
      
      <v-row v-if="ofertasDestacadas.length > 0">
        <v-col v-for="oferta in ofertasDestacadas" :key="oferta.id" cols="12" md="4">
          <v-card class="compact-offer-card">
            <!-- Imagen del producto como header -->
            <div class="product-image-container">
              <v-img
                :src="oferta.producto_foto || 'https://via.placeholder.com/120x120'"
                contain
                class="product-image"
                style="cursor: pointer;"
                @click="openImageModal(oferta)"
              >
                <v-chip
                  color="error"
                  class="discount-chip"
                  size="x-small"
                  v-if="oferta.precio_original > 0 && oferta.precio_oferta > 0 && oferta.precio_original > oferta.precio_oferta"
                >
                  -{{ Math.round(((oferta.precio_original - oferta.precio_oferta) / oferta.precio_original) * 100) }}%
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
                <div class="price-container" v-if="oferta.precio_original && oferta.precio_oferta">
                  <span class="original-price">{{ formatCurrency(oferta.precio_original) }}</span>
                  <span class="discounted-price">{{ formatCurrency(oferta.precio_oferta) }}</span>
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
/* Altura para tarjetas del dashboard - diseño mejorado */
.dashboard-card {
  min-height: 110px !important;
  display: flex;
  flex-direction: column;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 16px !important;
}

.dashboard-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2) !important;
}

.dashboard-card .v-card-text {
  flex: 1;
  display: flex;
  align-items: center;
}

.dashboard-card .v-avatar {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

/* Tarjetas de ofertas destacadas - diseño mejorado */
.compact-offer-card {
  height: 360px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border-radius: 16px !important;
  transition: all 0.3s ease;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.compact-offer-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.18) !important;
  border-color: rgba(var(--v-theme-primary), 0.3);
}

/* Contenedor de imagen del producto */
.product-image-container {
  height: 130px;
  position: relative;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f5f5 0%, #eaeaea 100%);
  border-radius: 16px 16px 0 0;
  padding: 12px;
}

.product-image {
  width: 100px;
  height: 100px;
  border-radius: 12px;
  object-fit: contain;
  transition: transform 0.3s ease;
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.1));
}

.product-image:hover {
  transform: scale(1.08);
}

.discount-chip {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 2;
  font-weight: 700 !important;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

/* Información del producto */
.product-info {
  flex: 1;
  padding: 16px;
  padding-bottom: 20px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  background: white;
}

.product-title {
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.3;
  margin-bottom: 6px;
  color: #1a1a1a;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.product-name {
  font-size: 0.8rem;
  color: #666;
  margin-bottom: 8px;
  line-height: 1.2;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.product-date {
  font-size: 0.75rem;
  color: #888;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.product-date::before {
  content: "📅";
  font-size: 0.9rem;
}

/* Footer con precios */
.product-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
  padding-top: 12px;
  border-top: 2px solid rgba(76, 175, 80, 0.15);
}

.price-container {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
}

.original-price {
  font-size: 0.85rem;
  text-decoration: line-through;
  color: #999;
  font-weight: 500;
  opacity: 0.9;
}

.discounted-price {
  font-size: 1.75rem;
  font-weight: 800;
  color: #2e7d32;
  display: flex;
  align-items: center;
  gap: 6px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  line-height: 1;
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
  padding: 8px 12px;
  border-radius: 8px;
  border: 2px solid #4caf50;
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.2);
}

.discounted-price::before {
  content: "💰";
  font-size: 1.3rem;
}

/* Responsivo para móviles */
@media (max-width: 768px) {
  .dashboard-card {
    min-height: 100px !important;
  }
  
  .compact-offer-card {
    height: 380px;
  }
  
  .product-image-container {
    height: 140px;
  }
  
  .product-image {
    width: 120px;
    height: 120px;
  }
  
  .discounted-price {
    font-size: 1.6rem;
    padding: 6px 10px;
  }
}

/* Efecto de carga suave */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.v-row > .v-col {
  animation: fadeIn 0.4s ease-out;
}

.v-row > .v-col:nth-child(1) { animation-delay: 0.05s; }
.v-row > .v-col:nth-child(2) { animation-delay: 0.1s; }
.v-row > .v-col:nth-child(3) { animation-delay: 0.15s; }
.v-row > .v-col:nth-child(4) { animation-delay: 0.2s; }
</style>