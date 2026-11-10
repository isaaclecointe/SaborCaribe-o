import productosData from '../assets/data/productos.json'

// ── Qué prepara cocina y qué despacha caja ──
// Regla única que usan POSPage.vue y CocinaView.vue, para que las dos
// pantallas nunca decidan distinto.

// Categorías que el cajero despacha directo (bebidas, postres): cocina
// no tiene nada que preparar con ellas.
export const CATEGORIAS_SIN_COCINA = ['Frescos', 'Postres']

// Los pedidos del POS guardan la categoría de cada producto, pero los de
// la página web (y algunos pedidos viejos) no. Para esos, la buscamos por
// el nombre del producto en productos.json.
const categoriaPorNombre = new Map(productosData.map(p => [p.nombre, p.categoria]))

export function categoriaDe(prod) {
  return prod.categoria || categoriaPorNombre.get(prod.nombre) || null
}

// ¿Este producto lo prepara cocina? Si no sabemos su categoría, decimos
// que sí: es mejor que cocina vea algo de más a que se le escape un plato.
export function vaACocina(prod) {
  return !CATEGORIAS_SIN_COCINA.includes(categoriaDe(prod))
}

// ¿El pedido tiene al menos un producto que cocina tenga que preparar?
export function pedidoNecesitaCocina(pedido) {
  return (pedido.productos || []).some(vaACocina)
}