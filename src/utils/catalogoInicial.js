import productosData from '../assets/data/productos.json'
import { CATEGORIAS_SIN_COCINA } from './cocina.js'

// ── Menú inicial del catálogo del POS ──
// Convierte el menú que el POS tenía escrito en el código (productos.json
// más los botones agrupados) al formato del catálogo nuevo en Firebase.
// Se usa en dos momentos:
//   1) Al guardar el primer cambio en "Productos del POS": este menú se
//      copia completo a Firebase y desde ahí se administra.
//   2) Como respaldo mientras el catálogo en Firebase esté vacío, para que
//      la caja nunca se quede sin productos.
// La página web NO usa esto: sigue leyendo productos.json directamente.

// Productos que en el POS se muestran como un solo botón con opciones de
// distinto precio. Toman el id del primer producto que reemplazan.
const AGRUPADOS = [
  {
    id: '2', nombre: 'Tortilla Grande', categoria: 'Tortillas de Harina',
    despuesDe: 1, reemplaza: [2, 3],
    opciones: [
      { nombre: 'Pollo', precio: 31 },
      { nombre: 'Adobado', precio: 31 },
      { nombre: 'Res', precio: 33 }
    ]
  },
  {
    id: '19', nombre: 'Gringas', categoria: 'Tacos',
    despuesDe: 10, reemplaza: [19, 20],
    opciones: [
      { nombre: '2x', precio: 25 },
      { nombre: '3x', precio: 35 }
    ]
  },
  {
    id: '16', nombre: 'Yogurt', categoria: 'Postres',
    despuesDe: 15, reemplaza: [16, 17, 18],
    opciones: [
      { nombre: 'Pequeño', precio: 6 },
      { nombre: 'Mediano', precio: 25 },
      { nombre: 'Grande', precio: 40 }
    ]
  }
]

// Cómo salían algunos productos en el ticket del pedido
const NOMBRES_CORTOS = { 5: 'Quesadillas', 6: 'Quesadilla Peperonne y Jamon' }

// Productos agregados después que deben quedar junto a sus parecidos
const POSICIONES = { 21: 14.5 } // Burrito de Pasta junto al de Pollo

// Productos que ahora forman parte de un botón agrupado: sus ids viejos
// apuntan al id del grupo. Así los extras y pedidos guardados con el id
// viejo (ej. 3 = "Tortilla Grande de Res") siguen encontrando su producto.
const IDS_REASIGNADOS = { '3': '2', '20': '19', '17': '16', '18': '16' }

// Id de catálogo (texto) a partir de cualquier id guardado antes (número
// de productos.json o id viejo de un producto agrupado).
export function idCatalogo(id) {
  if (id === null || id === undefined) return null
  const texto = String(id)
  return IDS_REASIGNADOS[texto] || texto
}

export function catalogoInicial() {
  const reemplazados = new Set(AGRUPADOS.flatMap(g => g.reemplaza))
  const lista = []

  productosData.forEach(p => {
    if (reemplazados.has(p.id)) return
    lista.push({
      id: String(p.id),
      nombre: p.nombre,
      nombreCorto: NOMBRES_CORTOS[p.id] || '',
      categoria: p.categoria,
      precio: p.precio,
      // En productos.json las opciones eran solo nombres con el mismo precio
      opciones: (p.opciones || []).map(o => ({ nombre: o, precio: p.precio })),
      vaACocina: !CATEGORIAS_SIN_COCINA.includes(p.categoria),
      activo: true,
      _posicion: POSICIONES[p.id] ?? p.id
    })
  })

  AGRUPADOS.forEach(g => {
    lista.push({
      id: g.id,
      nombre: g.nombre,
      nombreCorto: '',
      categoria: g.categoria,
      precio: Math.min(...g.opciones.map(o => o.precio)),
      opciones: g.opciones.map(o => ({ ...o })),
      vaACocina: !CATEGORIAS_SIN_COCINA.includes(g.categoria),
      activo: true,
      _posicion: g.despuesDe + 0.5
    })
  })

  // Mismo orden que tenía la cuadrícula del POS, numerado de 10 en 10
  return lista
    .sort((a, b) => a._posicion - b._posicion)
    .map(({ _posicion, ...p }, i) => ({ ...p, orden: (i + 1) * 10 }))
}