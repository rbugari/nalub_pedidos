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
        const response = await api.post('/auth/login', credentials)
        console.log('🔍 Full response:', response.data) // Debug log
        const { token } = response.data.data // Fixed: extract from response.data.data
        console.log('🔍 Extracted token:', token, 'Type:', typeof token) // Debug log
        this.setToken(token)
        router.push('/dashboard')
        return { success: true }
      } catch (error) {
        console.error('Error de inicio de sesión:', error)
        return { 
          success: false, 
          message: error.response?.data?.message || 'Error al iniciar sesión'
        }
      }
    },
    setToken(token) {
      this.token = token
      localStorage.setItem('token', token)
      this.user = jwtDecode(token)
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
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