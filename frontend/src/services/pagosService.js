import api from './api'

const pagosService = {
  /**
   * Obtiene los últimos 5 pagos del cliente autenticado
   * @returns {Promise} Respuesta del API con los pagos
   */
  async getPagos() {
    try {
      const response = await api.get('/pagos')
      return response
    } catch (error) {
      console.error('Error en pagosService.getPagos:', error)
      throw error
    }
  }
}

export default pagosService