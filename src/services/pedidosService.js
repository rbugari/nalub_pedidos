import api from './api'

export default {
  // Obtener todos los pedidos
  getPedidos() {
    return api.get('/pedidos')
  },
  
  // Obtener un pedido específico
  getPedido(id) {
    return api.get(`/pedidos/${id}`)
  },
  
  // Crear nuevo pedido
  createPedido(pedidoData) {
    return api.post('/pedidos', pedidoData)
  },
  
  // Actualizar pedido
  updatePedido(id, pedidoData) {
    return api.put(`/pedidos/${id}`, pedidoData)
  },
  
  // Eliminar pedido
  deletePedido(id) {
    return api.delete(`/pedidos/${id}`)
  }
}