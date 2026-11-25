import { createRouter, createWebHistory } from 'vue-router'
import { auth } from '../firebase.js'
import { onAuthStateChanged } from 'firebase/auth'
import { cargarSesion, useNegocio, INICIO_POR_ROL } from '../composables/useNegocio.js'

import MainPage from '../components/Home/MainPage.vue'
import MenuPage from '../components/Menu/MenuPage.vue'
import AcercaDePage from '../components/AcercaDe/AcercaDePage.vue'
import PanelAdmin from '../components/admin/PanelAdmin.vue'
import LoginAdmin from '../components/admin/LoginAdmin.vue'
import ConfigurarNegocio from '../components/admin/ConfigurarNegocio.vue'
import POSPage from '../components/POS/POSPage.vue'
import HistorialTurnos from '../components/POS/HistorialTurnos.vue'
import CocinaView from '../components/POS/CocinaView.vue'

// meta.roles: quién puede entrar. Sin "roles", cualquier persona.
// meta.sistema: necesita sesión Y pertenecer a un negocio.
const routes = [
  { path: '/', name: 'Main', component: MainPage },
  { path: '/menu', name: 'Menu', component: MenuPage },
  { path: '/acerca', name: 'AcercaDe', component: AcercaDePage },
  { path: '/login', name: 'Login', component: LoginAdmin },
  { path: '/admin', name: 'Admin', component: PanelAdmin, meta: { requiresAuth: true } },
  { path: '/configurar', name: 'Configurar', component: ConfigurarNegocio, meta: { requiresAuth: true } },
  { path: '/pos', name: 'POS', component: POSPage,
    meta: { sistema: true, roles: ['dueno', 'encargado', 'cajero'] } },
  { path: '/historial', name: 'Historial', component: HistorialTurnos,
    meta: { sistema: true, roles: ['dueno', 'encargado'] } },
  { path: '/cocina', name: 'Cocina', component: CocinaView,
    meta: { sistema: true, roles: ['dueno', 'encargado', 'cajero', 'cocina'] } }
]

const router = createRouter({
  history: createWebHistory('/SaborCaribe-o/'),
  routes
})

// ── Espera la primera respuesta de Firebase Auth ──
const getCurrentUser = () => new Promise((resolve) => {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    unsubscribe()
    resolve(user)
  })
})

router.beforeEach(async (to) => {
  const necesitaSesion = to.matched.some(r => r.meta.requiresAuth || r.meta.sistema)
  const user = await getCurrentUser()

  // Sin sesión: al login, recordando a dónde iba (ej. /cocina)
  if (necesitaSesion && !user) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }

  if (to.path === '/login' && user) {
    return typeof to.query.redirect === 'string' ? to.query.redirect : '/pos'
  }

  const esSistema = to.matched.some(r => r.meta.sistema)
  if (!esSistema && to.path !== '/configurar') return true

  // Pantallas del sistema: hace falta saber negocio y rol
  const estado = await cargarSesion(user)
  const { rol } = useNegocio()

  if (to.path === '/configurar') {
    // Si ya pertenece a un negocio, no tiene nada que configurar
    return estado === 'listo' ? INICIO_POR_ROL[rol.value] || '/pos' : true
  }

  if (estado === 'sinNegocio') return { path: '/configurar', query: { redirect: to.fullPath } }
  // Si no se pudo cargar (sin internet y sin caché), la pantalla de
  // configuración muestra el error con un botón para reintentar
  if (estado === 'error') return { path: '/configurar', query: { redirect: to.fullPath } }

  const permitidos = to.meta.roles
  if (permitidos && !permitidos.includes(rol.value)) {
    return INICIO_POR_ROL[rol.value] || '/login'
  }
  return true
})

export default router