<script setup>
import { ref, onMounted } from 'vue'
import api from '../../services/api'

const ofertas = ref([])
const productos = ref([])
const loading = ref(true)
const error = ref(null)
const dialog = ref(false)
const editDialog = ref(false)
const selectedOferta = ref(null)
const newOferta = ref({
  nombre: '',
  descripcion: '',
  descuento: 0,
  fechaInicio: '',
  fechaFin: '',
  productoId: null,
  activa: true
})

const headers = [
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Nombre', key: 'nombre', sortable: true },
  { title: 'Producto', key: 'producto', sortable: true },
  { title: 'Descuento', key: 'descuento', sortable: true },
  { title: 'Fecha Inicio', key: 'fechaInicio', sortable: true },
  { title: 'Fecha Fin', key: 'fechaFin', sortable: true },
  { title: 'Estado', key: 'activa', sortable: true },
  { title: 'Acciones', key: 'actions', sortable: false }
]

onMounted(async () => {
  await Promise.all([loadOfertas(), loadProductos()])
})

async function loadOfertas() {
  try {
    loading.value = true
    const response = await api.get('/ofertas')
    ofertas.value = response.data
  } catch (err) {
    console.error('Error al cargar ofertas:', err)
    error.value = 'Error al cargar las ofertas'
  } finally {
    loading.value = false
  }
}

async function loadProductos() {
  try {
    const response = await api.get('/productos')
    productos.value = response.data
  } catch (err) {
    console.error('Error al cargar productos:', err)
  }
}

function openNewOfertaDialog() {
  newOferta.value = {
    nombre: '',
    descripcion: '',
    descuento: 0,
    fechaInicio: '',
    fechaFin: '',
    productoId: null,
    activa: true
  }
  dialog.value = true
}

function editOferta(oferta) {
  selectedOferta.value = { ...oferta }
  editDialog.value = true
}

async function saveOferta() {
  try {
    await api.post('/ofertas', newOferta.value)
    await loadOfertas()
    dialog.value = false
    // Mostrar mensaje de éxito
  } catch (err) {
    console.error('Error al crear oferta:', err)
    // Mostrar mensaje de error
  }
}

async function updateOferta() {
  try {
    await api.put(`/ofertas/${selectedOferta.value.id}`, selectedOferta.value)
    await loadOfertas()
    editDialog.value = false
    // Mostrar mensaje de éxito
  } catch (err) {
    console.error('Error al actualizar oferta:', err)
    // Mostrar mensaje de error
  }
}

async function deleteOferta(id) {
  if (confirm('¿Estás seguro de que quieres eliminar esta oferta?')) {
    try {
      await api.delete(`/ofertas/${id}`)
      await loadOfertas()
      // Mostrar mensaje de éxito
    } catch (err) {
      console.error('Error al eliminar oferta:', err)
      // Mostrar mensaje de error
    }
  }
}
</script>

<template>
  <div>
    <v-row class="mb-6">
      <v-col>
        <h1 class="text-h4 font-weight-bold">Ofertas</h1>
        <p class="text-subtitle-1 text-grey-darken-1">Gestión de ofertas y promociones</p>
      </v-col>
      <v-col cols="auto">
        <v-btn color="primary" prepend-icon="mdi-plus" @click="openNewOfertaDialog">
          Nueva Oferta
        </v-btn>
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
        <template v-slot:item.descuento="{ item }">
          {{ item.descuento }}%
        </template>
        
        <template v-slot:item.fechaInicio="{ item }">
          {{ new Date(item.fechaInicio).toLocaleDateString() }}
        </template>
        
        <template v-slot:item.fechaFin="{ item }">
          {{ new Date(item.fechaFin).toLocaleDateString() }}
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
        
        <template v-slot:item.actions="{ item }">
          <v-btn
            icon="mdi-pencil"
            size="small"
            variant="text"
            @click="editOferta(item)"
          ></v-btn>
          <v-btn
            icon="mdi-delete"
            size="small"
            variant="text"
            color="error"
            @click="deleteOferta(item.id)"
          ></v-btn>
        </template>
      </v-data-table>
    </v-card>

    <!-- Dialog para nueva oferta -->
    <v-dialog v-model="dialog" max-width="600px">
      <v-card>
        <v-card-title>Nueva Oferta</v-card-title>
        <v-card-text>
          <v-form>
            <v-text-field
              v-model="newOferta.nombre"
              label="Nombre de la oferta"
              required
            ></v-text-field>
            
            <v-textarea
              v-model="newOferta.descripcion"
              label="Descripción"
              rows="3"
            ></v-textarea>
            
            <v-select
              v-model="newOferta.productoId"
              :items="productos"
              item-title="nombre"
              item-value="id"
              label="Producto"
              required
            ></v-select>
            
            <v-text-field
              v-model.number="newOferta.descuento"
              label="Descuento (%)"
              type="number"
              min="0"
              max="100"
              suffix="%"
              required
            ></v-text-field>
            
            <v-text-field
              v-model="newOferta.fechaInicio"
              label="Fecha de inicio"
              type="date"
              required
            ></v-text-field>
            
            <v-text-field
              v-model="newOferta.fechaFin"
              label="Fecha de fin"
              type="date"
              required
            ></v-text-field>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="dialog = false">
            Cancelar
          </v-btn>
          <v-btn color="primary" variant="elevated" @click="saveOferta">
            Guardar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog para editar oferta -->
    <v-dialog v-model="editDialog" max-width="600px">
      <v-card v-if="selectedOferta">
        <v-card-title>Editar Oferta</v-card-title>
        <v-card-text>
          <v-form>
            <v-text-field
              v-model="selectedOferta.nombre"
              label="Nombre de la oferta"
              required
            ></v-text-field>
            
            <v-textarea
              v-model="selectedOferta.descripcion"
              label="Descripción"
              rows="3"
            ></v-textarea>
            
            <v-select
              v-model="selectedOferta.productoId"
              :items="productos"
              item-title="nombre"
              item-value="id"
              label="Producto"
              required
            ></v-select>
            
            <v-text-field
              v-model.number="selectedOferta.descuento"
              label="Descuento (%)"
              type="number"
              min="0"
              max="100"
              suffix="%"
              required
            ></v-text-field>
            
            <v-text-field
              v-model="selectedOferta.fechaInicio"
              label="Fecha de inicio"
              type="date"
              required
            ></v-text-field>
            
            <v-text-field
              v-model="selectedOferta.fechaFin"
              label="Fecha de fin"
              type="date"
              required
            ></v-text-field>
            
            <v-switch
              v-model="selectedOferta.activa"
              label="Oferta activa"
              color="primary"
            ></v-switch>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="editDialog = false">
            Cancelar
          </v-btn>
          <v-btn color="primary" variant="elevated" @click="updateOferta">
            Actualizar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>