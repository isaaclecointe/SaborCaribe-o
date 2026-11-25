import { ref, computed } from 'vue'
import { db } from '../firebase.js'
import { collection, doc, getDoc, onSnapshot } from 'firebase/firestore'

// ── Negocio, sucursal y rol de quien inició sesión ──
// Todo el POS pasa por aquí para saber DÓNDE leer y escribir en Firebase:
//
//   negocios/{negocioId}                       ← el negocio (cliente del sistema)
//     miembros/{uid}                           ← rol y sucursales de cada usuario
//     productosPos/  extras/                   ← lo que comparte todo el negocio
//     sucursales/{sucursalId}
//       pedidos/  turnos/  contadores/         ← lo de cada sucursal
//
//   usuarios/{uid} → { negocioId }             ← para saber el negocio al entrar
//
// Así, ningún archivo escribe 'turnos' o 'pedidos' a mano: usa colSucursal()
// o colNegocio(). Cuando otro restaurante use el sistema, solo cambia el
// negocioId de su usuario.
//
// El estado vive a nivel de módulo (igual que useExtras): todas las
// pantallas ven la misma sesión. La carga la hace el router antes de abrir
// /pos, /cocina o /historial, así las pantallas ya la encuentran lista.

// ── Roles ──
export const ROLES = {
  dueno:     { nombre: 'Dueño',     descripcion: 'Todo, en todas las sucursales' },
  encargado: { nombre: 'Encargado', descripcion: 'Vende y ve historial y gráficas de sus sucursales' },
  cajero:    { nombre: 'Cajero',    descripcion: 'Vende, cobra y abre o cierra turno' },
  cocina:    { nombre: 'Cocina',    descripcion: 'Solo la pantalla de cocina' }
}

// Pantalla de inicio de cada rol (a dónde se le manda si entra a otra)
export const INICIO_POR_ROL = { dueno: '/pos', encargado: '/pos', cajero: '/pos', cocina: '/cocina' }

const estado = ref('inicial')   // inicial | cargando | sinNegocio | listo | error
const errorSesion = ref('')
const uid = ref(null)
const email = ref('')
const negocioId = ref(null)
const negocio = ref(null)
const miembro = ref(null)
const todasLasSucursales = ref([])
const sucursalElegida = ref(null)

let cargaEnCurso = null
let cargaDeUid = null
let unsubs = []

function detenerEscuchas() {
  unsubs.forEach(u => u())
  unsubs = []
}

// ── Carga ──
// Se llama desde el router con el usuario de Firebase Auth. Si ya está
// cargada para ese mismo usuario, no hace nada.
export function cargarSesion(user) {
  if (!user) {
    limpiarSesion()
    return Promise.resolve('sinUsuario')
  }
  if (cargaDeUid === user.uid && cargaEnCurso) return cargaEnCurso

  limpiarSesion()
  cargaDeUid = user.uid
  uid.value = user.uid
  email.value = user.email || ''
  estado.value = 'cargando'

  cargaEnCurso = (async () => {
    try {
      const puntero = await getDoc(doc(db, 'usuarios', user.uid))
      const nId = puntero.exists() ? puntero.data().negocioId : null
      if (!nId) {
        estado.value = 'sinNegocio'
        return estado.value
      }
      // Primero se confirma que sigue siendo miembro: si le quitaron el
      // acceso, Firebase no le dejaría leer el negocio y eso se vería
      // como un error en vez de "no tienes acceso".
      const m = await getDoc(doc(db, 'negocios', nId, 'miembros', user.uid))
      if (!m.exists()) {
        estado.value = 'sinNegocio'
        return estado.value
      }
      negocioId.value = nId
      await escucharNegocio(nId, user.uid)
      return estado.value
    } catch (e) {
      console.error('No se pudo cargar la sesión del negocio:', e)
      errorSesion.value = e?.code === 'permission-denied'
        ? 'Firebase no dio permiso para leer tu acceso. Revisa las reglas de Firestore.'
        : 'No se pudo cargar tu acceso. Revisa la conexión e intenta de nuevo.'
      estado.value = 'error'
      // Se permite reintentar en la próxima navegación
      cargaDeUid = null
      return estado.value
    }
  })()
  return cargaEnCurso
}

// Escucha en vivo el miembro, el negocio y las sucursales. Si el dueño
// cambia el rol de alguien o agrega una sucursal, se nota sin recargar.
function escucharNegocio(nId, userId) {
  return new Promise((resolve, reject) => {
    let listos = { miembro: false, sucursales: false, negocio: false }
    const avisarListo = (clave) => {
      listos[clave] = true
      if (listos.miembro && listos.sucursales && listos.negocio) resolve()
    }
    const fallo = (e) => { detenerEscuchas(); reject(e) }

    unsubs.push(onSnapshot(doc(db, 'negocios', nId, 'miembros', userId), (snap) => {
      if (!snap.exists()) {
        // Le quitaron el acceso (o nunca lo tuvo)
        miembro.value = null
        estado.value = 'sinNegocio'
        detenerEscuchas()
        resolve()
        return
      }
      miembro.value = { id: snap.id, ...snap.data() }
      if (estado.value === 'cargando' || estado.value === 'sinNegocio') estado.value = 'listo'
      avisarListo('miembro')
    }, fallo))

    unsubs.push(onSnapshot(doc(db, 'negocios', nId), (snap) => {
      negocio.value = snap.exists() ? { id: snap.id, ...snap.data() } : null
      avisarListo('negocio')
    }, fallo))

    unsubs.push(onSnapshot(collection(db, 'negocios', nId, 'sucursales'), (snap) => {
      todasLasSucursales.value = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0) || String(a.nombre).localeCompare(b.nombre))
      avisarListo('sucursales')
    }, fallo))
  })
}

export function limpiarSesion() {
  detenerEscuchas()
  cargaEnCurso = null
  cargaDeUid = null
  estado.value = 'inicial'
  errorSesion.value = ''
  uid.value = null
  email.value = ''
  negocioId.value = null
  negocio.value = null
  miembro.value = null
  todasLasSucursales.value = []
  sucursalElegida.value = null
}

// Para después de crear el negocio o usar un código de invitación
export function recargarSesion(user) {
  cargaDeUid = null
  cargaEnCurso = null
  return cargarSesion(user)
}

// ── Rol y permisos ──
const rol = computed(() => miembro.value?.rol || null)
const esDueno = computed(() => rol.value === 'dueno')
// Historial, gráficas, productos y extras
const puedeGestionar = computed(() => rol.value === 'dueno' || rol.value === 'encargado')
// Vender y cobrar (todos menos cocina)
const puedeVender = computed(() => !!rol.value && rol.value !== 'cocina')

// Sucursales que esta persona puede ver: el dueño todas; los demás, las suyas
const sucursales = computed(() => {
  if (esDueno.value) return todasLasSucursales.value
  const mias = miembro.value?.sucursales || []
  return todasLasSucursales.value.filter(s => mias.includes(s.id))
})

// ── Sucursal de este dispositivo ──
// Cada tablet recuerda en qué sucursal está. Si la persona solo tiene una,
// es esa y no hay nada que elegir.
function claveDispositivo() { return `sucursal:${negocioId.value}:${uid.value}` }

function leerGuardada() {
  try { return localStorage.getItem(claveDispositivo()) } catch { return null }
}

const sucursalId = computed(() => {
  const ids = sucursales.value.map(s => s.id)
  if (!ids.length) return null
  const candidata = sucursalElegida.value || leerGuardada()
  return ids.includes(candidata) ? candidata : ids[0]
})

const sucursalActual = computed(() => sucursales.value.find(s => s.id === sucursalId.value) || null)

export function elegirSucursal(id) {
  sucursalElegida.value = id
  try { localStorage.setItem(claveDispositivo(), id) } catch { /* sin almacenamiento */ }
}

// ── Rutas de Firebase ──
function exigirNegocio() {
  if (!negocioId.value) throw new Error('Todavía no se cargó el negocio de este usuario.')
  return negocioId.value
}
function exigirSucursal(id) {
  const s = id || sucursalId.value
  if (!s) throw new Error('Este usuario no tiene ninguna sucursal asignada.')
  return s
}

// Colecciones del negocio: productosPos, extras, miembros, sucursales
export function colNegocio(nombre) {
  return collection(db, 'negocios', exigirNegocio(), nombre)
}
export function docNegocio(nombre, id) {
  return doc(db, 'negocios', exigirNegocio(), nombre, String(id))
}
// Colecciones de una sucursal: pedidos, turnos, contadores
// (sin sucursal indicada, la de este dispositivo)
export function colSucursal(nombre, sucursal) {
  return collection(db, 'negocios', exigirNegocio(), 'sucursales', exigirSucursal(sucursal), nombre)
}
export function docSucursal(nombre, id, sucursal) {
  return doc(db, 'negocios', exigirNegocio(), 'sucursales', exigirSucursal(sucursal), nombre, String(id))
}

export function useNegocio() {
  return {
    estado, errorSesion, uid, email,
    negocioId, negocio, miembro, rol,
    esDueno, puedeGestionar, puedeVender,
    sucursales, todasLasSucursales, sucursalId, sucursalActual,
    elegirSucursal,
    colNegocio, docNegocio, colSucursal, docSucursal
  }
}