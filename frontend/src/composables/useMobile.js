import { ref, onMounted, onUnmounted } from 'vue'

/**
 * Composable para detectar capacidades táctiles y mejorar UX móvil
 */
export function useTouchFriendly() {
  const isTouchDevice = ref(false)
  
  // Detectar si es dispositivo táctil
  const checkTouchDevice = () => {
    isTouchDevice.value = (
      ('ontouchstart' in window) ||
      (navigator.maxTouchPoints > 0) ||
      (navigator.msMaxTouchPoints > 0)
    )
  }
  
  onMounted(() => {
    checkTouchDevice()
  })
  
  /**
   * Vibración táctil para feedback en acciones
   * @param {number} duration - Duración en ms
   */
  const vibrate = (duration = 50) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(duration)
    }
  }
  
  /**
   * Feedback táctil para botones
   */
  const tapFeedback = () => {
    vibrate(10)
  }
  
  /**
   * Feedback táctil para acciones exitosas
   */
  const successFeedback = () => {
    vibrate([50, 100, 50])
  }
  
  /**
   * Feedback táctil para errores
   */
  const errorFeedback = () => {
    vibrate([100, 50, 100])
  }
  
  return {
    isTouchDevice,
    vibrate,
    tapFeedback,
    successFeedback,
    errorFeedback
  }
}

/**
 * Composable para pull-to-refresh
 */
export function usePullToRefresh(callback) {
  let startY = 0
  let currentY = 0
  let isPulling = false
  
  const handleTouchStart = (e) => {
    // Solo activar si estamos en el top de la página
    if (window.scrollY === 0) {
      startY = e.touches[0].pageY
      isPulling = true
    }
  }
  
  const handleTouchMove = (e) => {
    if (!isPulling) return
    
    currentY = e.touches[0].pageY
    const diff = currentY - startY
    
    // Si pull hacia abajo más de 100px
    if (diff > 100) {
      e.preventDefault()
    }
  }
  
  const handleTouchEnd = () => {
    if (!isPulling) return
    
    const diff = currentY - startY
    
    // Si pull fue suficiente, ejecutar callback
    if (diff > 100) {
      callback()
    }
    
    isPulling = false
    startY = 0
    currentY = 0
  }
  
  onMounted(() => {
    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchmove', handleTouchMove, { passive: false })
    document.addEventListener('touchend', handleTouchEnd, { passive: true })
  })
  
  onUnmounted(() => {
    document.removeEventListener('touchstart', handleTouchStart)
    document.removeEventListener('touchmove', handleTouchMove)
    document.removeEventListener('touchend', handleTouchEnd)
  })
}
