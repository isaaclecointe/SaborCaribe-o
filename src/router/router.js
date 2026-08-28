import { createRouter, createWebHistory } from 'vue-router'
import { auth } from '../firebase.js'
import { onAuthStateChanged } from 'firebase/auth'



import MainPage from '../components/Home/MainPage.vue'
import MenuPage from '../components/Menu/MenuPage.vue'
import AcercaDePage from '../components/AcercaDe/AcercaDePage.vue'
import PanelAdmin from '../components/admin/PanelAdmin.vue'
import LoginAdmin from '../components/admin/LoginAdmin.vue'
import POSPage from '../components/POS/POSpage.vue'

const routes = [
    {path: '/', name: 'Main', component: MainPage},
    {path: '/menu', name: 'Menu', component: MenuPage},
    {path: '/acerca', name: 'AcercaDe', component: AcercaDePage},
    {path: '/pos', name: 'POS', component: POSPage},
    {path: '/login', name: 'Login', component: LoginAdmin},
    {path: '/admin', name: 'Admin', component: PanelAdmin, meta: { requiresAuth: true }
    }
]

const router = createRouter({
  history: createWebHistory('/SaborCaribe-o/'),
  routes
})

// ── Promesa para esperar respuesta de Firebase ──
const getCurrentUser = () => {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe()
      resolve(user)
    })
  })
}

// ── Validación de sesión antes de cambiar de página ──
router.beforeEach(async (to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const currentUser = await getCurrentUser()

  if (requiresAuth && !currentUser) {
    next('/login')
  } else if (to.path === '/login' && currentUser) {
    next('/pos')
  } else {
    next()
  }
})

export default router