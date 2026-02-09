<script setup>
import { ref, onMounted, computed } from 'vue'
import api from '../../services/api'

const ofertas = ref([])
const loading = ref(true)
const error = ref(null)
const imageDialog = ref(false)
const selectedImage = ref(null)
const selectedProductName = ref('')
const selectedOferta = ref(null)
const ofertaDialog = ref(false)

// Función para formatear fecha a dd/mm/yyyy
function formatDate(dateString) {
  if (!dateString) return '-'
  const date = new Date(dateString)
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

// Función para formatear precio
function formatPrice(price) {
  return Number(price || 0).toLocaleString('es-ES', { 
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

// Función para obtener nombre del tipo de oferta
function getTipoLabel(tipo) {
  const tipos = {
    'unitaria': 'Unitaria',
    'minima': 'Cantidad Mínima',
    'bundle': 'Combo',
    'mix': 'Mix'
  }
  return tipos[tipo] || tipo
}

// Función para obtener color del tipo
function getTipoColor(tipo) {
  const colores = {
    'unitaria': 'primary',
    'minima': 'success',
    'bundle': 'warning',
    'mix': 'purple'
  }
  return colores[tipo] || 'grey'
}

// Función para obtener descripción del tipo
function getTipoDescripcion(oferta) {
  switch (oferta.tipo) {
    case 'unitaria':
      return 'Precio especial por unidad'
    case 'minima':
      return `Llevando ${oferta.min_unidades_total} o más unidades`
    case 'bundle':
      return `Combo de ${oferta.unidades_totales} unidades`
    case 'mix':
      return `Combiná ${oferta.min_unidades_total} unidades del grupo`
    default:
      return ''
  }
}

// Obtener primer producto con foto
function getPrimeraFoto(oferta) {
  const productoConFoto = oferta.productos?.find(p => p.foto)
  return productoConFoto?.foto || null
}

// Obtener nombres de productos
function getProductosNombres(oferta) {
  if (!oferta.productos || oferta.productos.length === 0) return 'Sin productos'
  if (oferta.productos.length === 1) return oferta.productos[0].nombre
  return `${oferta.productos.length} productos`
}

onMounted(async () => {
  await loadOfertas()
})

async function loadOfertas() {
  try {
    loading.value = true
    const response = await api.get('/ofertas/vigentes-mes')
    ofertas.value = response.data.data || response.data
    console.log('Ofertas cargadas:', ofertas.value)
  } catch (err) {
    console.error('Error al cargar ofertas:', err)
    error.value = 'Error al cargar las ofertas del mes actual'
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

function verDetalle(oferta) {
  selectedOferta.value = oferta
  ofertaDialog.value = true
}
</script>

<template>
  <div class="pa-6">
    <v-row align="center" class="mb-6">
      <v-col>
        <div class="d-flex align-center mb-2">
          <v-icon size="40" color="primary" class="mr-3">mdi-tag-multiple</v-icon>
          <div>
            <h1 class="text-h4 font-weight-bold mb-0">Ofertas del Mes</h1>
            <p class="text-subtitle-1 text-grey-darken-1 mb-0">
          <v-icon icon="mdi-calendar-month" class="me-2"></v-icon>
          Promociones vigentes para {{ new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }) }}
        </p>
      </v-col>
    </v-row>

    <v-alert v-if="error" type="error" class="mb-4" variant="tonal">
      <v-icon icon="mdi-alert-circle"></v-icon>
      {{ error }}
    </v-alert>

    <!-- Vista de cards -->
    <v-row v-if="!loading && ofertas.length > 0">
      <v-col
        v-for="oferta in ofertas"
        :key="oferta.id"
        cols="12"
        sm="6"
        lg="4"
      >
        <v-card
          elevation="3"
          class="oferta-card h-100"
          hover
          @click="verDetalle(oferta)"
        >
          <!-- Badge de tipo -->
          <div class="position-absolute" style="top: 10px; right: 10px; z-index: 1;">
            <v-chip
              :color="getTipoColor(oferta.tipo)"
              size="small"
              variant="flat"
            >
              <v-icon start size="small">
                {{
                  oferta.tipo === 'unitaria' ? 'mdi-numeric-1-box' :
                  oferta.tipo === 'minima' ? 'mdi-cart-arrow-down' :
                  oferta.tipo === 'bundle' ? 'mdi-package-variant' :
                  'mdi-select-group'
                }}
              </v-icon>
              {{ getTipoLabel(oferta.tipo) }}
            </v-chip>
          </div>

          <!-- Descuento badge -->
          <div
            v-if="oferta.descuento_calculado > 0"
            class="position-absolute discount-badge"
          >
            <v-chip color="error" size="large" variant="flat">
              <span class="text-h6 font-weight-bold">-{{ Math.round(oferta.descuento_calculado) }}%</span>
            </v-chip>
          </div>

          <!-- Imagen -->
          <v-img
            :src="getPrimeraFoto(oferta) || '/placeholder.png'"
            height="200"
            cover
            class="bg-grey-lighten-3"
          >
            <template v-if="!getPrimeraFoto(oferta)" v-slot:default>
              <div class="d-flex align-center justify-center h-100">
                <v-icon size="80" color="grey-lighten-1">mdi-tag-multiple</v-icon>
              </div>
            </template>
          </v-img>

          <v-card-title class="text-h6 pb-2">
            {{ oferta.titulo }}
          </v-card-title>

          <v-card-subtitle class="pb-2">
            {{ getTipoDescripcion(oferta) }}
          </v-card-subtitle>

          <v-card-text>
            <!-- Productos incluidos -->
            <div class="mb-3">
              <v-chip
                size="small"
                variant="outlined"
                color="primary"
                class="me-1"
              >
                <v-icon start size="small">mdi-package-variant</v-icon>
                {{ getProductosNombres(oferta) }}
              </v-chip>
            </div>

            <!-- Precio referencia -->
            <div v-if="oferta.precio_referencia > 0" class="pricing">
              <div class="d-flex align-center justify-space-between">
                <span class="text-grey-darken-1 text-decoration-line-through">
                  ${{ formatPrice(oferta.precio_original) }}
                </span>
                <span class="text-h5 font-weight-bold text-success">
                  ${{ formatPrice(oferta.precio_referencia) }}
                </span>
              </div>
            </div>

            <!-- Descripción -->
            <p v-if="oferta.descripcion" class="text-body-2 text-grey-darken-1 mt-2">
              {{ oferta.descripcion }}
            </p>
          </v-card-text>

          <v-card-actions class="pt-0">
            <v-chip
              size="small"
              variant="outlined"
              color="warning"
              prepend-icon="mdi-calendar-end"
            >
              Hasta {{ formatDate(oferta.fecha_fin) }}
            </v-chip>
            <v-spacer></v-spacer>
            <v-btn
              size="small"
              color="primary"
              variant="text"
              append-icon="mdi-arrow-right"
            >
              Ver más
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- Loading -->
    <v-row v-if="loading">
      <v-col
        v-for="i in 6"
        :key="i"
        cols="12"
        sm="6"
        lg="4"
      >
        <v-skeleton-loader type="card"></v-skeleton-loader>
      </v-col>
    </v-row>

    <!-- Sin ofertas -->
    <v-card v-if="!loading && ofertas.length === 0" class="text-center pa-8">
      <v-icon size="80" color="grey-lighten-1">mdi-tag-off-outline</v-icon>
      <p class="text-h6 text-grey-darken-1 mt-4">
        No hay ofertas vigentes este mes
      </p>
    </v-card>

    <!-- Dialog de detalle de oferta -->
    <v-dialog v-model="ofertaDialog" max-width="800px" scrollable>
      <v-card v-if="selectedOferta">
        <v-card-title class="d-flex justify-space-between align-center bg-primary">
          <span class="text-white">{{ selectedOferta.titulo }}</span>
          <v-btn
            icon="mdi-close"
            variant="text"
            color="white"
            @click="ofertaDialog = false"
          ></v-btn>
        </v-card-title>

        <v-card-text class="pa-4">
          <!-- Tipo y descripción -->
          <div class="mb-4">
            <v-chip
              :color="getTipoColor(selectedOferta.tipo)"
              class="me-2"
            >
              {{ getTipoLabel(selectedOferta.tipo) }}
            </v-chip>
            <v-chip
              v-if="selectedOferta.descuento_calculado > 0"
              color="error"
            >
              -{{ Math.round(selectedOferta.descuento_calculado) }}% OFF
            </v-chip>
            <p class="mt-3 text-body-1">{{ getTipoDescripcion(selectedOferta) }}</p>
            <p v-if="selectedOferta.descripcion" class="mt-2 text-grey-darken-1">
              {{ selectedOferta.descripcion }}
            </p>
          </div>

          <v-divider class="my-4"></v-divider>

          <!-- Lista de productos -->
          <h3 class="text-h6 mb-3">
            <v-icon class="me-2">mdi-package-variant-closed</v-icon>
            Productos incluidos
          </h3>
          
          <v-list lines="two">
            <v-list-item
              v-for="producto in selectedOferta.productos"
              :key="producto.producto_id"
              class="mb-2 border rounded"
            >
              <template v-slot:prepend>
                <v-avatar size="60" rounded="lg">
                  <v-img
                    v-if="producto.foto"
                    :src="producto.foto"
                    :alt="producto.nombre"
                    @click="openImageModal(producto)"
                    style="cursor: pointer"
                  ></v-img>
                  <v-icon v-else size="40">mdi-package-variant</v-icon>
                </v-avatar>
              </template>

              <v-list-item-title class="font-weight-medium">
                {{ producto.nombre }}
              </v-list-item-title>
              <v-list-item-subtitle>
                <span class="text-caption">{{ producto.marca || '' }}</span>
                <span v-if="producto.envase" class="text-caption"> • {{ producto.envase }}</span>
                <span v-if="producto.litros" class="text-caption"> • {{ producto.litros }}L</span>
              </v-list-item-subtitle>

              <template v-slot:append>
                <div class="text-right">
                  <div v-if="selectedOferta.tipo === 'bundle'" class="text-caption text-grey-darken-1">
                    {{ producto.unidades_fijas }} unidades
                  </div>
                  <div class="text-body-2 font-weight-medium">
                    ${{ formatPrice(producto.precioVenta) }}
                  </div>
                </div>
              </template>
            </v-list-item>
          </v-list>

          <v-divider class="my-4"></v-divider>

          <!-- Vigencia -->
          <div class="d-flex align-center">
            <v-icon class="me-2" color="warning">mdi-calendar-range</v-icon>
            <span class="text-body-1">
              Vigencia: {{ formatDate(selectedOferta.fecha_inicio) }} - {{ formatDate(selectedOferta.fecha_fin) }}
            </span>
          </div>
        </v-card-text>

        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            variant="flat"
            @click="ofertaDialog = false"
          >
            Cerrar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Modal para imagen ampliada -->
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
.oferta-card {
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  position: relative;
}

.oferta-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15) !important;
}

.discount-badge {
  top: 10px;
  left: 10px;
  z-index: 1;
}

.pricing {
  padding: 12px;
  background: rgba(76, 175, 80, 0.08);
  border-radius: 8px;
}

.v-list-item {
  border: 1px solid rgba(0, 0, 0, 0.12);
}

.v-list-item:hover {
  background-color: rgba(25, 118, 210, 0.04);
}
</style>