import api from './api'

export default {
  getProductos() {
    return api.get('/productos')
  },
  
  getProducto(id) {
    return api.get(`/productos/${id}`)
  },
  
  createProducto(productoData) {
    return api.post('/productos', productoData)
  },
  
  updateProducto(id, productoData) {
    return api.put(`/productos/${id}`, productoData)
  },
  
  deleteProducto(id) {
    return api.delete(`/productos/${id}`)
  }
}