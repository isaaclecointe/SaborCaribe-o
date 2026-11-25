import { ref, computed } from 'vue'
import { db } from '../firebase.js'
import { colNegocio, docNegocio, useNegocio } from './useNegocio.js'
import {
  collection, doc, onSnapshot, setDoc, updateDoc, deleteDoc, writeBatch, serverTimestamp
} from 'firebase/firestore'
import { catalogoInicial } from '../utils/catalogoInicial.js'

// ── Catálogo de productos del POS ──
// Colección "productosPos" en Firestore. Es SOLO del POS: la página web
// sigue usando su propio productos.json y no se ve afectada.
//
// Cada documento:
//   nombre       "Quesabirrias (3x)"
//   nombreCorto  opcional: cómo sale en el pedido ("Quesadillas")
//   categoria    "Tacos"
//   precio       precio del producto (si tiene opciones: el más bajo)
//   opciones     [{ nombre: 'Pollo', precio: 31 }, ...]  (vacío si no tiene)
//   vaACocina    true si cocina lo prepara (bebidas y postres: false)
//   ocultoEn     ['atescatempa', ...] sucursales donde NO se vende. El menú
//                es uno solo, pero cada sucursal decide qué muestra: ocultar
//                los tacos en Atescatempa no los oculta en El Jícaro.
//                Una sucursal nueva ve todo hasta que se oculte algo ahí.
//   activo       (de antes de las sucursales) false = oculto en todas.
//                Al cambiar la visibilidad se pasa a ocultoEn.
//   orden        posición en la cuadrícula (de 10 en 10)
//
// Igual que useExtras, el estado vive a nivel de módulo: el POS y la
// pantalla de administración comparten la misma lista y un solo listener.

// Un solo lugar con el nombre de la colección: cuando lleguen las
// sucursales, solo cambia esta línea.
// Vive dentro del negocio: negocios/{negocio}/productosPos (ver useNegocio.js)
const COLECCION = 'productosPos'

const productos = ref([])          // tal cual vienen de Firebase
const cargandoCatalogo = ref(true)
const servidorConfirmoVacio = ref(false)
const errorCatalogo = ref(null)        // mensaje si Firebase no deja leer
let unsub = null
let importacionIniciada = false

// ── Lectura ──
function escucharCatalogo() {
  if (unsub) return
  // includeMetadataChanges: avisa también cuando responde el servidor, no
  // solo la caché de la tablet. Hace falta para saber si el catálogo está
  // vacío de verdad o si todavía no llegan los datos.
  unsub = onSnapshot(colNegocio(COLECCION), { includeMetadataChanges: true }, (snap) => {
    productos.value = snap.docs.map(d => normalizar({ id: d.id, ...d.data() }))
    servidorConfirmoVacio.value = snap.empty && !snap.metadata.fromCache
    errorCatalogo.value = null
    cargandoCatalogo.value = false
  }, (err) => {
    console.error('Error cargando el catálogo del POS:', err)
    errorCatalogo.value = err?.code === 'permission-denied'
      ? 'Firebase no da permiso para leer los productos. Revisa que la regla de "productosPos" esté en las reglas de Firestore.'
      : 'No se pudieron cargar los productos. Revisa la conexión e intenta de nuevo.'
    cargandoCatalogo.value = false
    // Firebase cierra el listener cuando falla: lo soltamos para poder reintentar
    unsub = null
  })
}

function detenerCatalogo() {
  if (unsub) { unsub(); unsub = null }
}

function normalizar(p) {
  const opciones = Array.isArray(p.opciones)
    ? p.opciones.filter(o => o && o.nombre).map(o => ({ nombre: o.nombre, precio: Number(o.precio) || 0 }))
    : []
  return {
    ...p,
    id: String(p.id),
    nombreCorto: p.nombreCorto || '',
    opciones,
    precio: opciones.length ? Math.min(...opciones.map(o => o.precio)) : Number(p.precio) || 0,
    vaACocina: p.vaACocina !== false,
    activo: p.activo !== false,
    ocultoEn: Array.isArray(p.ocultoEn) ? p.ocultoEn.map(String) : [],
    orden: Number(p.orden) || 0
  }
}

const porOrden = (a, b) => a.orden - b.orden || a.nombre.localeCompare(b.nombre)

// 'cargando' → todavía no sabemos qué hay en Firebase
// 'vacio'    → Firebase confirmó que no hay productos (aún no se importa)
// 'listo'    → hay productos en Firebase
// 'error'    → Firebase rechazó la lectura (permisos o conexión)
const estadoCatalogo = computed(() => {
  if (productos.value.length) return 'listo'
  if (errorCatalogo.value) return 'error'
  if (servidorConfirmoVacio.value) return 'vacio'
  return 'cargando'
})

// Mientras Firebase no tenga productos, la caja usa el menú inicial para no
// quedarse vacía. Mismo formato y mismos ids que tendrá al importarse.
const usandoMenuInicial = computed(() => productos.value.length === 0)

const todosLosProductos = computed(() =>
  (usandoMenuInicial.value ? catalogoInicial().map(normalizar) : productos.value)
    .slice()
    .sort(porOrden)
)

// Lo que se ve en la caja: solo los visibles
// ── Disponibilidad por sucursal ──
const { sucursalId, todasLasSucursales } = useNegocio()

// ¿Este producto se vende en esta sucursal?
export function seVendeEn(p, sucursal) {
  return p.activo !== false && !(p.ocultoEn || []).includes(sucursal)
}

// Lo que muestra la caja: solo lo que se vende en la sucursal de esta tablet
const productosPOS = computed(() => todosLosProductos.value.filter(p => seVendeEn(p, sucursalId.value)))

const categoriasPOS = computed(() =>
  [...new Set(productosPOS.value.map(p => p.categoria).filter(Boolean))]
)
const todasLasCategorias = computed(() =>
  [...new Set(todosLosProductos.value.map(p => p.categoria).filter(Boolean))]
)

function buscarProducto(id) {
  if (id === null || id === undefined) return null
  return todosLosProductos.value.find(p => p.id === String(id)) || null
}

// ── Escritura ──
// Igual que en el resto del POS, no se espera al servidor: el cambio
// aparece al instante y Firebase lo sincroniza solo. Cada función devuelve
// la promesa para que la pantalla pueda avisar si el servidor lo rechaza.

// Antes de cualquier cambio: si Firebase está vacío, primero se copia el
// menú inicial completo. Si no, guardar un producto nuevo dejaría la caja
// con ese único producto.
function asegurarCatalogo() {
  if (estadoCatalogo.value === 'cargando') {
    throw new Error('El catálogo todavía se está cargando. Intenta en unos segundos.')
  }
  if (estadoCatalogo.value === 'error') {
    throw new Error(errorCatalogo.value)
  }
  if (estadoCatalogo.value === 'vacio' && !importacionIniciada) {
    importacionIniciada = true
    const batch = writeBatch(db)
    catalogoInicial().forEach(({ id, ...p }) => {
      batch.set(docNegocio(COLECCION, id), { ...p, creado: serverTimestamp(), actualizado: serverTimestamp() })
    })
    batch.commit().catch(e => {
      importacionIniciada = false
      console.error('No se pudo copiar el menú inicial:', e)
    })
  }
}

function limpiar(datos) {
  const opciones = (datos.opciones || [])
    .map(o => ({ nombre: String(o.nombre || '').trim(), precio: Number(o.precio) || 0 }))
    .filter(o => o.nombre)
  return {
    nombre: String(datos.nombre || '').trim(),
    nombreCorto: String(datos.nombreCorto || '').trim(),
    categoria: String(datos.categoria || '').trim(),
    precio: opciones.length ? Math.min(...opciones.map(o => o.precio)) : Number(datos.precio) || 0,
    opciones,
    vaACocina: datos.vaACocina !== false,
    // La visibilidad ya no es general: va por sucursal en ocultoEn
    activo: true,
    ocultoEn: [...new Set((datos.ocultoEn || []).map(String))]
  }
}

function crearProducto(datos) {
  asegurarCatalogo()
  const ultimo = Math.max(0, ...todosLosProductos.value.map(p => p.orden))
  const ref = doc(colNegocio(COLECCION))
  return setDoc(ref, {
    ...limpiar(datos),
    orden: ultimo + 10,
    creado: serverTimestamp(),
    actualizado: serverTimestamp()
  })
}

function actualizarProducto(id, datos) {
  asegurarCatalogo()
  return setDoc(docNegocio(COLECCION, String(id)), {
    ...limpiar(datos),
    actualizado: serverTimestamp()
  }, { merge: true })
}

// Muestra u oculta un producto SOLO en una sucursal
function cambiarVisibilidad(id, visible, sucursal) {
  asegurarCatalogo()
  const p = buscarProducto(id)
  if (!p || !sucursal) return Promise.resolve()
  // Si venía oculto en todas (como se hacía antes de las sucursales), se
  // convierte a "oculto en cada sucursal" para poder mostrarlo solo en una
  const ocultos = new Set(p.activo === false ? todasLasSucursales.value.map(s => s.id) : p.ocultoEn)
  visible ? ocultos.delete(sucursal) : ocultos.add(sucursal)
  return setDoc(docNegocio(COLECCION, String(id)), {
    activo: true, ocultoEn: [...ocultos], actualizado: serverTimestamp()
  }, { merge: true })
}

function eliminarProducto(id) {
  asegurarCatalogo()
  return deleteDoc(docNegocio(COLECCION, String(id)))
}

// Mueve un producto un lugar arriba (-1) o abajo (+1) respecto a los que
// se están viendo (por ejemplo, dentro de una categoría). Los demás
// productos conservan su lugar; se renumera todo de 10 en 10.
function moverProducto(id, direccion, idsVisibles) {
  asegurarCatalogo()
  const i = idsVisibles.indexOf(String(id))
  const vecino = idsVisibles[i + direccion]
  if (i === -1 || !vecino) return Promise.resolve()

  const lista = todosLosProductos.value.map(p => p.id)
  const a = lista.indexOf(String(id))
  const b = lista.indexOf(vecino)
  ;[lista[a], lista[b]] = [lista[b], lista[a]]

  const batch = writeBatch(db)
  lista.forEach((pid, idx) => {
    const nuevoOrden = (idx + 1) * 10
    if (buscarProducto(pid)?.orden !== nuevoOrden) {
      batch.update(docNegocio(COLECCION, pid), { orden: nuevoOrden })
    }
  })
  return batch.commit()
}

export function useCatalogoPos() {
  return {
    // lectura
    escucharCatalogo,
    detenerCatalogo,
    cargandoCatalogo,
    estadoCatalogo,
    errorCatalogo,
    usandoMenuInicial,
    todosLosProductos,
    productosPOS,
    categoriasPOS,
    todasLasCategorias,
    buscarProducto,
    // escritura
    crearProducto,
    actualizarProducto,
    cambiarVisibilidad,
    seVendeEn,
    eliminarProducto,
    moverProducto
  }
}