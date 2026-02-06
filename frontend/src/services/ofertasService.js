import api from './api'

export default {
  // Obtener todas las ofertas con paginación
  getOfertas(params = {}) {
    return api.get('/ofertas', { params })
  },
  
  // Obtener ofertas vigentes del mes actual
  getOfertasVigentes() {
    return api.get('/ofertas/vigentes-mes')
  },
  
  // Obtener ofertas destacadas
  getOfertasDestacadas() {
    return api.get('/ofertas/destacadas')
  },
  
  // Obtener una oferta específica
  getOferta(id) {
    return api.get(`/ofertas/${id}`)
  },
  
  // Obtener ofertas aplicables a un producto
  getOfertasPorProducto(productoId) {
    return api.get(`/ofertas/por-producto/${productoId}`)
  },
  
  // Calcular precio con oferta
  calcularPrecio(ofertaId, productoId, cantidad) {
    return api.post('/ofertas/calcular-precio', {
      oferta_id: ofertaId,
      producto_id: productoId,
      cantidad: cantidad
    })
  },
  
  // Crear oferta (para admin - futuro)
  createOferta(ofertaData) {
    return api.post('/ofertas', ofertaData)
  },
  
  // Actualizar oferta (para admin - futuro)
  updateOferta(id, ofertaData) {
    return api.put(`/ofertas/${id}`, ofertaData)
  },
  
  // Eliminar oferta (para admin - futuro)
  deleteOferta(id) {
    return api.delete(`/ofertas/${id}`)
  }
}