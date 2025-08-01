import { defineStore } from 'pinia'
import axios from 'axios'
import { jwtDecode } from 'jwt-decode'
import router from '../router'
import api from '../services/api'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || null,
    user: null
  }),
  getters: {
    isAuthenticated: (state) => !!state.token,
    getUser: (state) => state.user
  },
  actions: {
    async login(credentials) {
      try {
        console.log('🔍 Sending login request with:', credentials)
        const response = await api.post('/auth/login', credentials)
        
        console.log('🔍 Full response received:', response)
        console.log('🔍 Response data:', response.data)
        console.log('🔍 Response data type:', typeof response.data)
        
        if (response.data && response.data.data) {
          console.log('🔍 Response.data.data:', response.data.data)
          console.log('🔍 Token in response:', response.data.data.token)
          console.log('🔍 Token type:', typeof response.data.data.token)
        }
        
        // Intentar diferentes formas de extraer el token
        let token = null
        
        if (response.data?.data?.token) {
          token = response.data.data.token
        } else if (response.data?.token) {
          token = response.data.token
        }
        
        console.log('🔍 Final extracted token:', token)
        console.log('🔍 Final token type:', typeof token)
        console.log('🔍 Token length:', token ? token.length : 'N/A')
        
        if (!token) {
          throw new Error('No se pudo extraer el token de la respuesta')
        }
        
        if (typeof token !== 'string') {
          console.error('❌ Token is not a string:', token)
          throw new Error(`Token debe ser string, recibido: ${typeof token}`)
        }
        
        if (token.trim() === '') {
          throw new Error('Token está vacío')
        }
        
        console.log('✅ Token válido, llamando setToken')
        this.setToken(token)
        router.push('/dashboard')
        return { success: true }
      } catch (error) {
        console.error('❌ Error de inicio de sesión:', error)
        console.error('❌ Error stack:', error.stack)
        return { 
          success: false, 
          message: error.response?.data?.message || error.message || 'Error al iniciar sesión'
        }
      }
    },
    setToken(token) {
      console.log('🔍 setToken called with:', token, 'type:', typeof token)
      
      if (!token || typeof token !== 'string') {
        throw new Error(`Invalid token specified: must be a string, received: ${typeof token}`)
      }
      
      try {
        this.token = token
        localStorage.setItem('token', token)
        this.user = jwtDecode(token)
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
        console.log('✅ Token set successfully')
      } catch (error) {
        console.error('❌ Error in setToken:', error)
        throw error
      }
    },
    logout() {
      this.token = null
      this.user = null
      localStorage.removeItem('token')
      delete axios.defaults.headers.common['Authorization']
      router.push('/login')
    },
    checkAuth() {
      if (this.token) {
        try {
          const decoded = jwtDecode(this.token)
          const currentTime = Date.now() / 1000
          
          if (decoded.exp < currentTime) {
            this.logout()
            return false
          }
          
          this.user = decoded
          axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`
          return true
        } catch (error) {
          this.logout()
          return false
        }
      }
      return false
    }
  }
})