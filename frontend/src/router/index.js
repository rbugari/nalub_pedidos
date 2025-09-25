import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: (to) => {
        const authStore = useAuthStore()
        return authStore.isAuthenticated ? '/dashboard' : '/login'
      }
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/auth/Login.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('../views/dashboard/Dashboard.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/prepedidos',
      name: 'prepedidos',
      component: () => import('../views/prepedidos/Prepedidos.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/prepedidos/nuevo',
      name: 'prepedido-nuevo',
      component: () => import('../views/prepedidos/PrepedidoForm.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/prepedidos/editar/:id',
      name: 'prepedido-editar',
      component: () => import('../views/prepedidos/PrepedidoForm.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/pedidos',
      name: 'pedidos',
      component: () => import('../views/pedidos/PedidosList.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/pedidos/:id',
      name: 'pedido-detail',
      component: () => import('../views/pedidos/PedidoDetail.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/productos',
      name: 'productos',
      component: () => import('../views/productos/Productos.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/ofertas',
      name: 'ofertas',
      component: () => import('../views/ofertas/Ofertas.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/pagos',
      name: 'pagos',
      component: () => import('../views/pagos/PagosList.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/perfil',
      name: 'perfil',
      component: () => import('../views/auth/Perfil.vue'),
      meta: { requiresAuth: true }
    }
  ]
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)

  if (requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  } else if (to.path === '/login' && authStore.isAuthenticated) {
    // Si el usuario ya está autenticado y trata de ir al login, redirigir al dashboard
    next('/dashboard')
  } else {
    next()
  }
})

export default router