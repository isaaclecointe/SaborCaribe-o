// ── Resumen de ventas de un turno ──
// Se calcula al cerrar el turno y se guarda dentro del documento del turno
// (campo "resumen"). Los pedidos se borran a las 24 h, pero este resumen
// queda para siempre: de aquí salen las gráficas de "Productos más
// vendidos" y "Horas con más ventas".
//
// Funciones puras (sin Firebase ni Vue) para poder probarlas solas.

// Lo que de verdad se cobró de un pedido. Misma regla que el cierre de
// turno (ventasEfectivo + ventasTarjeta en POSPage.vue).
export function montoCobrado(p) {
  if (p.totalEfectivo != null || p.totalTarjeta != null) {
    return (Number(p.totalEfectivo) || 0) + (Number(p.totalTarjeta) || 0)
  }
  return Number(p.montoPagado) || 0
}

function horaDe(p) {
  const d = p.fecha?.toDate ? p.fecha.toDate() : (p.fecha instanceof Date ? p.fecha : null)
  return d ? d.getHours() : null
}

// pedidos: los pedidos del turno (sin cancelados)
// identificar(linea) → { clave, nombre } del producto. Lo da el POS, que
//   conoce el catálogo: así "Tortilla Grande Pollo" y "Tortilla Grande Res"
//   suman en un solo producto, con el detalle por opción aparte.
export function resumenDeTurno(pedidos, identificar) {
  const productos = new Map()
  const horas = new Map()

  for (const p of pedidos) {
    // Productos
    for (const linea of p.productos || []) {
      const cantidad = Number(linea.cantidad) || 0
      if (!cantidad) continue
      const { clave, nombre } = identificar(linea)
      if (!productos.has(clave)) {
        productos.set(clave, { clave, nombre, cantidad: 0, total: 0, opciones: {} })
      }
      const item = productos.get(clave)
      item.cantidad += cantidad
      item.total += Number(linea.subtotal ?? (Number(linea.precio) || 0) * cantidad) || 0
      if (linea.opcion) item.opciones[linea.opcion] = (item.opciones[linea.opcion] || 0) + cantidad
    }

    // Horas (hora en que se hizo el pedido)
    const hora = horaDe(p)
    if (hora !== null) {
      if (!horas.has(hora)) horas.set(hora, { hora, ventas: 0, pedidos: 0 })
      const h = horas.get(hora)
      h.ventas += montoCobrado(p)
      h.pedidos += 1
    }
  }

  return {
    version: 1,
    productos: [...productos.values()].sort((a, b) => b.cantidad - a.cantidad),
    porHora: [...horas.values()].sort((a, b) => a.hora - b.hora),
    pedidosWeb: pedidos.filter(p => p.origen === 'web').length
  }
}