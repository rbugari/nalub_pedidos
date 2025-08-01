import api from './api'

export default {
  getOfertas() {
    return api.get('/ofertas')
  },
  
  getOferta(id) {
    return api.get(`/ofertas/${id}`)
  },
  
  createOferta(ofertaData) {
    return api.post('/ofertas', ofertaData)
  },
  
  updateOferta(id, ofertaData) {
    return api.put(`/ofertas/${id}`, ofertaData)
  },
  
  deleteOferta(id) {
    return api.delete(`/ofertas/${id}`)
  }
}