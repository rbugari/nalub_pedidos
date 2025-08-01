<script setup>
import { ref, onMounted } from 'vue'
import api from '../../services/api'

const productos = ref([])
const loading = ref(true)
const error = ref(null)
const search = ref('')
const dialog = ref(false)
const editDialog = ref(false)
const selectedProducto = ref(null)
const newProducto = ref({
  nombre: '',
  descripcion: '',
  precio: 0,
  stock: 0,
  categoria: ''
})

const headers = [
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Nombre', key: 'nombre', sortable: true },
  { title: 'Categoría', key: 'categoria', sortable: true },
  { title: 'Precio', key: 'precio', sortable: true },
  { title: 'Stock', key: 'stock', sortable: true },
  { title: 'Estado', key: 'activo', sortable: true },
  { title: 'Acciones', key: 'actions', sortable: false }
]

const categorias = [
  'Electrónicos',
  'Ropa',
  'Hogar',
  'Deportes',
  'Libros',
  'Otros'
]

onMounted(async () => {
  await loadProductos()
})

async function loadProductos() {
  try {
    loading.value = true
    const response = await api.get('/productos')
    productos.value = response.data
  } catch (err) {
    console.error('Error al cargar productos:', err)
    error.value = 'Error al cargar los productos'
  } finally {
    loading.value = false
  }
}

function openNewProductDialog() {
  newProducto.value = {
    nombre: '',
    descripcion: '',
    precio: 0,
    stock: 0,
    categoria: ''
  }
  dialog.value = true
}

function editProducto(producto) {
  selectedProducto.value = { ...producto }
  editDialog.value = true
}

async function saveProducto() {
  try {
    await api.post('/productos', newProducto.value)
    await loadProductos()
    dialog.value = false
    // Mostrar mensaje de éxito
  } catch (err) {
    console.error('Error al crear producto:', err)
    // Mostrar mensaje de error
  }
}

async function updateProducto() {
  try {
    await api.put(`/productos/${selectedProducto.value.id}`, selectedProducto.value)
    await loadProductos()
    editDialog.value = false
    // Mostrar mensaje de éxito
  } catch (err) {
    console.error('Error al actualizar producto:', err)
    // Mostrar mensaje de error
  }
}

async function deleteProducto(id) {
  if (confirm('¿Estás seguro de que quieres eliminar este producto?')) {
    try {
      await api.delete(`/productos/${id}`)
      await loadProductos()
      // Mostrar mensaje de éxito
    } catch (err) {
      console.error('Error al eliminar producto:', err)
      // Mostrar mensaje de error
    }
  }
}
</script>

<template>
  <div>
    <v-row class="mb-6">
      <v-col>
        <h1 class="text-h4 font-weight-bold">Productos</h1>
        <p class="text-subtitle-1 text-grey-darken-1">Gestión del catálogo de productos</p>
      </v-col>
      <v-col cols="auto">
        <v-btn color="primary" prepend-icon="mdi-plus" @click="openNewProductDialog">
          Nuevo Producto
        </v-btn>
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
          {{ item.precio }}€
        </template>
        
        <template v-slot:item.activo="{ item }">
          <v-chip
            :color="item.activo ? 'success' : 'error'"
            size="small"
            variant="elevated"
          >
            {{ item.activo ? 'Activo' : 'Inactivo' }}
          </v-chip>
        </template>
        
        <template v-slot:item.actions="{ item }">
          <v-btn
            icon="mdi-pencil"
            size="small"
            variant="text"
            @click="editProducto(item)"
          ></v-btn>
          <v-btn
            icon="mdi-delete"
            size="small"
            variant="text"
            color="error"
            @click="deleteProducto(item.id)"
          ></v-btn>
        </template>
      </v-data-table>
    </v-card>

    <!-- Dialog para nuevo producto -->
    <v-dialog v-model="dialog" max-width="600px">
      <v-card>
        <v-card-title>Nuevo Producto</v-card-title>
        <v-card-text>
          <v-form>
            <v-text-field
              v-model="newProducto.nombre"
              label="Nombre del producto"
              required
            ></v-text-field>
            
            <v-textarea
              v-model="newProducto.descripcion"
              label="Descripción"
              rows="3"
            ></v-textarea>
            
            <v-select
              v-model="newProducto.categoria"
              :items="categorias"
              label="Categoría"
              required
            ></v-select>
            
            <v-text-field
              v-model.number="newProducto.precio"
              label="Precio"
              type="number"
              step="0.01"
              suffix="€"
              required
            ></v-text-field>
            
            <v-text-field
              v-model.number="newProducto.stock"
              label="Stock inicial"
              type="number"
              required
            ></v-text-field>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="dialog = false">
            Cancelar
          </v-btn>
          <v-btn color="primary" variant="elevated" @click="saveProducto">
            Guardar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Dialog para editar producto -->
    <v-dialog v-model="editDialog" max-width="600px">
      <v-card v-if="selectedProducto">
        <v-card-title>Editar Producto</v-card-title>
        <v-card-text>
          <v-form>
            <v-text-field
              v-model="selectedProducto.nombre"
              label="Nombre del producto"
              required
            ></v-text-field>
            
            <v-textarea
              v-model="selectedProducto.descripcion"
              label="Descripción"
              rows="3"
            ></v-textarea>
            
            <v-select
              v-model="selectedProducto.categoria"
              :items="categorias"
              label="Categoría"
              required
            ></v-select>
            
            <v-text-field
              v-model.number="selectedProducto.precio"
              label="Precio"
              type="number"
              step="0.01"
              suffix="€"
              required
            ></v-text-field>
            
            <v-text-field
              v-model.number="selectedProducto.stock"
              label="Stock"
              type="number"
              required
            ></v-text-field>
            
            <v-switch
              v-model="selectedProducto.activo"
              label="Producto activo"
              color="primary"
            ></v-switch>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" variant="text" @click="editDialog = false">
            Cancelar
          </v-btn>
          <v-btn color="primary" variant="elevated" @click="updateProducto">
            Actualizar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>