// ── Estadísticas de ventas a partir de los turnos cerrados ──
// Funciones puras: reciben la lista de turnos (tal como la carga
// HistorialTurnos.vue) y devuelven los datos listos para las gráficas.
// Un turno cuenta para el día en que se ABRIÓ (si cierra pasada la
// medianoche, sigue siendo del día en que empezó).

export const PERIODOS = [
  { id: '7d', nombre: '7 días' },
  { id: '30d', nombre: '30 días' },
  { id: 'mes', nombre: 'Este mes' },
  { id: 'todo', nombre: 'Todo' }
]

export const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

export function aFecha(f) {
  if (f?.toDate) return f.toDate()
  if (f instanceof Date) return f
  return null
}

const inicioDelDia = d => new Date(d.getFullYear(), d.getMonth(), d.getDate())
const sumarDias = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)

// "2026-11-23" en hora local (no UTC: en Guatemala UTC ya es "mañana" a las 6 p. m.)
export function claveDia(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function gastosDe(t) {
  if (typeof t.totalGastos === 'number') return t.totalGastos
  return (t.gastos || []).reduce((s, g) => s + (Number(g.monto) || 0), 0)
}

// Rango de fechas del período elegido y el período anterior del mismo
// largo (para comparar). "hasta" no se incluye.
export function rangoPeriodo(periodo, turnos, hoy = new Date()) {
  const manana = sumarDias(inicioDelDia(hoy), 1)
  let desde
  if (periodo === '7d') desde = sumarDias(manana, -7)
  else if (periodo === '30d') desde = sumarDias(manana, -30)
  else if (periodo === 'mes') desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
  else {
    const fechas = turnos.map(t => aFecha(t.fechaApertura)).filter(Boolean)
    desde = fechas.length ? inicioDelDia(new Date(Math.min(...fechas))) : sumarDias(manana, -7)
  }
  const dias = Math.round((manana - desde) / 86400000)
  const anterior = periodo === 'todo'
    ? null
    : periodo === 'mes'
      ? { desde: new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1), hasta: sumarDias(new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1), dias) }
      : { desde: sumarDias(desde, -dias), hasta: desde }
  return { desde, hasta: manana, dias, anterior }
}

export function turnosEntre(turnos, desde, hasta) {
  return turnos.filter(t => {
    const f = aFecha(t.fechaApertura)
    return f && f >= desde && f < hasta
  })
}

export function totales(turnos) {
  const efectivo = turnos.reduce((s, t) => s + (Number(t.ventasEfectivo) || 0), 0)
  const tarjeta = turnos.reduce((s, t) => s + (Number(t.ventasTarjeta) || 0), 0)
  const pedidos = turnos.reduce((s, t) => s + (Number(t.cantidadPedidos) || 0), 0)
  const ventas = efectivo + tarjeta
  return {
    ventas, efectivo, tarjeta, pedidos,
    gastos: turnos.reduce((s, t) => s + gastosDe(t), 0),
    ticketPromedio: pedidos ? ventas / pedidos : 0,
    cantidadTurnos: turnos.length
  }
}

// Cambio porcentual contra el período anterior. null si no hay con qué comparar.
export function cambio(actual, anterior) {
  if (!anterior) return null
  return (actual - anterior) / anterior
}

// Un registro por cada día del rango (también los días sin ventas, para
// que la gráfica no esconda los días cerrados).
export function ventasPorDia(turnos, desde, hasta) {
  const mapa = new Map()
  for (let d = new Date(desde); d < hasta; d = sumarDias(d, 1)) {
    mapa.set(claveDia(d), { clave: claveDia(d), fecha: new Date(d), efectivo: 0, tarjeta: 0, total: 0, pedidos: 0, gastos: 0, turnos: [], porSucursal: {} })
  }
  for (const t of turnosEntre(turnos, desde, hasta)) {
    const dia = mapa.get(claveDia(aFecha(t.fechaApertura)))
    if (!dia) continue
    dia.efectivo += Number(t.ventasEfectivo) || 0
    dia.tarjeta += Number(t.ventasTarjeta) || 0
    dia.pedidos += Number(t.cantidadPedidos) || 0
    dia.gastos += gastosDe(t)
    dia.turnos.push(t)
    if (t.sucursalId) {
      dia.porSucursal[t.sucursalId] = (dia.porSucursal[t.sucursalId] || 0) +
        (Number(t.ventasEfectivo) || 0) + (Number(t.ventasTarjeta) || 0)
    }
  }
  for (const dia of mapa.values()) {
    dia.total = dia.efectivo + dia.tarjeta
    dia.turnos.sort((a, b) => aFecha(a.fechaApertura) - aFecha(b.fechaApertura))
  }
  return [...mapa.values()]
}

// Promedio vendido por día de la semana, contando solo los días que se
// abrió (un domingo cerrado no baja el promedio de los domingos).
export function promedioPorDiaSemana(dias) {
  const grupos = DIAS_SEMANA.map(nombre => ({ nombre, total: 0, diasAbiertos: 0, promedio: 0 }))
  for (const d of dias) {
    if (!d.turnos.length) continue
    const i = (d.fecha.getDay() + 6) % 7 // lunes = 0
    grupos[i].total += d.total
    grupos[i].diasAbiertos += 1
  }
  for (const g of grupos) g.promedio = g.diasAbiertos ? g.total / g.diasAbiertos : 0
  return grupos
}

// Productos más vendidos, sumando el resumen guardado de cada turno.
// Los turnos cerrados antes de que existiera el resumen no tienen este
// dato; por eso también se devuelve cuántos turnos sí lo tienen.
export function productosMasVendidos(turnos) {
  const mapa = new Map()
  let conResumen = 0
  for (const t of turnos) {
    if (!t.resumen?.productos) continue
    conResumen += 1
    for (const p of t.resumen.productos) {
      if (!mapa.has(p.clave)) mapa.set(p.clave, { clave: p.clave, nombre: p.nombre, cantidad: 0, total: 0, opciones: {} })
      const item = mapa.get(p.clave)
      item.nombre = p.nombre // el nombre más reciente gana
      item.cantidad += Number(p.cantidad) || 0
      item.total += Number(p.total) || 0
      for (const [op, n] of Object.entries(p.opciones || {})) item.opciones[op] = (item.opciones[op] || 0) + n
    }
  }
  const productos = [...mapa.values()].sort((a, b) => b.cantidad - a.cantidad || b.total - a.total)
  return { productos, conResumen }
}

// Ventas por hora del día, sumando todos los turnos del período.
export function ventasPorHora(turnos) {
  const horas = new Map()
  let conResumen = 0
  for (const t of turnos) {
    if (!t.resumen?.porHora) continue
    conResumen += 1
    for (const h of t.resumen.porHora) {
      if (!horas.has(h.hora)) horas.set(h.hora, { hora: h.hora, ventas: 0, pedidos: 0 })
      horas.get(h.hora).ventas += Number(h.ventas) || 0
      horas.get(h.hora).pedidos += Number(h.pedidos) || 0
    }
  }
  if (!horas.size) return { horas: [], conResumen }
  // Rango continuo de la primera a la última hora con ventas
  const min = Math.min(...horas.keys())
  const max = Math.max(...horas.keys())
  const lista = []
  for (let h = min; h <= max; h++) lista.push(horas.get(h) || { hora: h, ventas: 0, pedidos: 0 })
  return { horas: lista, conResumen }
}

// Escala "bonita" para el eje: 0, 500, 1,000, 1,500…
export function escalaEje(maximo, marcas = 4) {
  if (!maximo || maximo <= 0) return { tope: 1, pasos: [0, 1] }
  const crudo = maximo / marcas
  const potencia = 10 ** Math.floor(Math.log10(crudo))
  const paso = [1, 2, 2.5, 5, 10].map(m => m * potencia).find(p => p >= crudo)
  const tope = Math.ceil(maximo / paso) * paso
  const pasos = []
  for (let v = 0; v <= tope + paso / 2; v += paso) pasos.push(v)
  return { tope, pasos }
}

// ── Comparación entre sucursales ──
// Colores fijos por sucursal, en el orden en que se crearon (nunca por
// quién vendió más): así cada sucursal conserva su color aunque cambie el
// filtro o el período. Paleta revisada para daltonismo.
export const COLORES_SUCURSAL = ['#e8621a', '#2a78d6', '#1baf7a', '#eda100', '#e87ba4']

export function conColores(sucursales) {
  return sucursales.map((s, i) => ({ ...s, color: COLORES_SUCURSAL[i % COLORES_SUCURSAL.length] }))
}

// Una fila por sucursal: lo vendido en el período, su parte del total y
// el cambio contra el período anterior.
export function compararSucursales(turnosPeriodo, turnosAnteriores, sucursales) {
  const totalGeneral = totales(turnosPeriodo).ventas
  return sucursales.map(s => {
    const actual = totales(turnosPeriodo.filter(t => t.sucursalId === s.id))
    const antes = turnosAnteriores.filter(t => t.sucursalId === s.id)
    return {
      ...s,
      ...actual,
      participacion: totalGeneral ? actual.ventas / totalGeneral : 0,
      cambio: antes.length ? cambio(actual.ventas, totales(antes).ventas) : null
    }
  })
}