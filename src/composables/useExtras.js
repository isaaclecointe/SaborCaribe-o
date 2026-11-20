import { ref } from 'vue'
import { db } from '../firebase.js'
import { idCatalogo } from '../utils/catalogoInicial.js'
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc,
  doc, orderBy, query, serverTimestamp
} from 'firebase/firestore'

// ── Catálogo de extras (modificadores que cambian el precio) ──
// Colección en Firestore: "extras"
// Cada documento: { nombre, precio, productos: [...ids], activo, creado }
//
// "productos" es una lista de ids de producto del catálogo del POS (los
// extras viejos tienen ids de productos.json; ver extraAplicaA),
// NO categorías: así "taco extra res" solo aparece al editar una porción de
// tacos de res, no en tacos al pastor aunque estén en la misma categoría "Tacos".
//
// El estado (extras.value) vive a nivel de módulo: aunque POS.vue y GestionExtras.vue
// llamen useExtras() por separado, ambos leen y escriben la MISMA lista reactiva,
// no listas independientes. Solo un listener de Firestore corre a la vez.

const extras = ref([])
const cargandoExtras = ref(true)
let unsubExtras = null

// Empieza a escuchar el catálogo en tiempo real. Llamar una sola vez,
// desde el onMounted de POS.vue (igual que ya hacés con pedidos/turno).
function escucharExtras() {
  if (unsubExtras) return // ya hay un listener activo, no duplicar

  const q = query(collection(db, 'extras'), orderBy('nombre'))
  unsubExtras = onSnapshot(q, (snap) => {
    extras.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    cargandoExtras.value = false
  })
}

// Llamar desde el onUnmounted de POS.vue, junto a los demás unsubscribe.
function detenerExtras() {
  if (unsubExtras) {
    unsubExtras()
    unsubExtras = null
  }
}

// Extras activos que aplican a un producto específico (por id).
// Uso: extrasParaProducto(producto.id)
// Los extras viejos guardan ids numéricos de productos.json (ej. 3) y los
// nuevos guardan ids de texto del catálogo del POS (ej. "2"). idCatalogo
// traduce los dos al mismo formato, sin tener que reescribir nada en Firebase.
function extraAplicaA(extra, productoId) {
  const id = idCatalogo(productoId)
  return (extra.productos || []).some(p => idCatalogo(p) === id)
}

function extrasParaProducto(productoId) {
  return extras.value.filter(e => e.activo !== false && extraAplicaA(e, productoId))
}

async function crearExtra({ nombre, precio, productos }) {
  await addDoc(collection(db, 'extras'), {
    nombre: nombre.trim(),
    precio: Number(precio),
    productos,
    activo: true,
    creado: serverTimestamp()
  })
}

// cambios puede ser { precio: 8 }, { activo: false }, { productos: [...] }, etc.
async function actualizarExtra(id, cambios) {
  await updateDoc(doc(db, 'extras', id), cambios)
}

async function eliminarExtra(id) {
  await deleteDoc(doc(db, 'extras', id))
}

export function useExtras() {
  return {
    extras,
    cargandoExtras,
    escucharExtras,
    detenerExtras,
    extrasParaProducto,
    extraAplicaA,
    crearExtra,
    actualizarExtra,
    eliminarExtra
  }
}