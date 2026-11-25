<template>
  <div class="gv">

    <!-- Período -->
    <div class="gv__periodos" role="radiogroup" aria-label="Período">
      <button
        v-for="p in PERIODOS"
        :key="p.id"
        class="gv__periodo"
        :class="{ 'gv__periodo--activo': periodo === p.id }"
        role="radio"
        :aria-checked="periodo === p.id"
        @click="periodo = p.id"
      >{{ p.nombre }}</button>
    </div>

    <!-- Cifras del período -->
    <section class="gv-cifras">
      <div v-for="c in cifras" :key="c.id" class="gv-cifra" :class="{ 'gv-cifra--principal': c.id === 'ventas' }">
        <span class="gv-cifra__label">{{ c.label }}</span>
        <span class="gv-cifra__valor">{{ c.valor }}</span>
        <span v-if="c.cambio !== null" class="gv-cifra__cambio" :class="`gv-cifra__cambio--${c.tono}`">
          {{ c.cambio >= 0 ? '↑' : '↓' }} {{ Math.abs(Math.round(c.cambio * 100)) }}%
          <span class="gv-cifra__vs">vs {{ textoAnterior }}</span>
        </span>
        <span v-else class="gv-cifra__vs">{{ c.nota }}</span>
      </div>
    </section>

    <!-- Comparación entre sucursales (solo con "Todas") -->
    <section v-if="comparar" class="gv-card">
      <div class="gv-card__head">
        <div>
          <h3 class="gv-card__titulo">Comparación entre sucursales</h3>
          <p class="gv-card__sub">Lo vendido por cada sucursal en el período</p>
        </div>
      </div>
      <ul class="gv-comp">
        <li v-for="c in comparacion" :key="c.id" class="gv-comp__fila">
          <div class="gv-comp__nombre">
            <span class="gv-comp__punto" :style="{ background: c.color }"></span>
            <span class="gv-comp__texto">{{ c.nombre }}</span>
          </div>
          <span class="gv-comp__pista">
            <span v-if="c.ventas > 0" class="gv-comp__barra" :style="{ width: ancho(c.ventas, maxComparacion), background: c.color }"></span>
          </span>
          <div class="gv-comp__valores">
            <span class="gv-comp__valor">Q{{ fmt(c.ventas) }}</span>
            <span class="gv-comp__parte">{{ Math.round(c.participacion * 100) }}%</span>
          </div>
          <div class="gv-comp__detalle">
            <span class="gv-comp__dato">{{ fmt(c.pedidos) }} pedidos</span>
            <span class="gv-comp__dato">Ticket Q{{ fmt(Math.round(c.ticketPromedio)) }}</span>
            <span class="gv-comp__dato">{{ c.cantidadTurnos }} {{ c.cantidadTurnos === 1 ? 'turno' : 'turnos' }}</span>
            <span
              v-if="c.cambio !== null && isFinite(c.cambio)"
              class="gv-comp__cambio" :class="`gv-cifra__cambio--${tono(c.cambio)}`"
            >{{ c.cambio >= 0 ? '↑' : '↓' }} {{ Math.abs(Math.round(c.cambio * 100)) }}%</span>
          </div>
        </li>
      </ul>
    </section>

    <!-- Ventas por día -->
    <section class="gv-card">
      <div class="gv-card__head">
        <div>
          <h3 class="gv-card__titulo">Ventas por día</h3>
          <p class="gv-card__sub">Toca un día para ver sus turnos</p>
        </div>
        <div class="gv-leyenda">
          <span v-for="serie in seriesDia" :key="serie.id" class="gv-leyenda__item">
            <span class="gv-leyenda__muestra" :style="{ background: serie.color }"></span>
            <span class="gv-leyenda__texto">{{ serie.nombre }}</span>
          </span>
        </div>
      </div>

      <div class="gv-col">
        <div class="gv-col__eje">
          <span
            v-for="v in escalaDias.pasos" :key="v"
            class="gv-col__tick" :style="{ bottom: `${(v / escalaDias.tope) * 100}%` }"
          >{{ compacto(v) }}</span>
        </div>
        <div class="gv-col__cuerpo">
          <div class="gv-col__area">
            <div
              v-for="v in escalaDias.pasos" :key="v"
              class="gv-col__guia" :style="{ bottom: `${(v / escalaDias.tope) * 100}%` }"
            ></div>
            <div class="gv-col__barras">
              <button
                v-for="d in dias" :key="d.clave"
                class="gv-col__slot"
                :class="{ 'gv-col__slot--activo': diaSeleccionado?.clave === d.clave }"
                :aria-label="`${fechaLarga(d.fecha)}: Q${fmt(d.total)}`"
                @click="claveSeleccionada = d.clave"
              >
                <span v-if="d.total > 0" class="gv-col__pila" :style="{ height: altura(d.total, escalaDias.tope) }">
                  <!-- La primera serie va abajo (column-reverse) -->
                  <template v-for="serie in seriesDia" :key="serie.id">
                    <span
                      v-if="serie.valor(d) > 0"
                      class="gv-col__seg" :style="{ flexGrow: serie.valor(d), background: serie.color }"
                    ></span>
                  </template>
                </span>
              </button>
            </div>
          </div>
          <div class="gv-col__etiquetas">
            <span v-for="(d, i) in dias" :key="d.clave" class="gv-col__etiqueta">
              {{ i % saltoEtiquetas === 0 ? etiquetaDia(d.fecha) : '' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Detalle del día elegido -->
      <div v-if="diaSeleccionado" class="gv-dia">
        <div class="gv-dia__head">
          <div>
            <p class="gv-dia__fecha">{{ fechaLarga(diaSeleccionado.fecha) }}</p>
            <p class="gv-dia__resumen">
              <template v-if="diaSeleccionado.turnos.length">
                {{ diaSeleccionado.pedidos }} pedidos ·
                Efectivo Q{{ fmt(diaSeleccionado.efectivo) }} ·
                Tarjeta Q{{ fmt(diaSeleccionado.tarjeta) }}
                <template v-if="diaSeleccionado.gastos > 0"> · Gastos Q{{ fmt(diaSeleccionado.gastos) }}</template>
              </template>
              <template v-else>No se abrió turno este día</template>
            </p>
          </div>
          <span class="gv-dia__total">Q{{ fmt(diaSeleccionado.total) }}</span>
        </div>
        <ul v-if="diaSeleccionado.turnos.length" class="gv-dia__turnos">
          <li v-for="t in diaSeleccionado.turnos" :key="t.id" class="gv-dia__turno">
            <span class="gv-dia__turno-horas">
              <span v-if="comparar" class="gv-dia__turno-sucursal">
                <span class="gv-comp__punto" :style="{ background: colorDe(t.sucursalId) }"></span>{{ nombreSucursal(t.sucursalId) }} ·
              </span>
              Turno {{ hora(t.fechaApertura) }} – {{ hora(t.fechaCierre) }}
            </span>
            <span class="gv-dia__turno-pedidos">{{ t.cantidadPedidos || 0 }} pedidos</span>
            <span class="gv-dia__turno-total">Q{{ fmt(t.totalVentas || 0) }}</span>
          </li>
        </ul>
      </div>
    </section>

    <div class="gv-fila">
      <!-- Día de la semana -->
      <section class="gv-card">
        <div class="gv-card__head">
          <div>
            <h3 class="gv-card__titulo">Promedio por día de la semana</h3>
            <p class="gv-card__sub">Cuánto se vende un día normal, contando solo los días que se abrió</p>
          </div>
        </div>
        <ul class="gv-barras">
          <li v-for="g in porSemana" :key="g.nombre" class="gv-barra">
            <span class="gv-barra__nombre">{{ g.nombre }}</span>
            <span class="gv-barra__pista">
              <span v-if="g.promedio > 0" class="gv-barra__relleno" :style="{ width: ancho(g.promedio, maxSemana) }"></span>
            </span>
            <span class="gv-barra__valor">{{ g.diasAbiertos ? `Q${fmt(Math.round(g.promedio))}` : '—' }}</span>
          </li>
        </ul>
      </section>

      <!-- Horas -->
      <section class="gv-card">
        <div class="gv-card__head">
          <div>
            <h3 class="gv-card__titulo">Horas con más ventas</h3>
            <p class="gv-card__sub">
              {{ horaSeleccionada
                ? `${rangoHora(horaSeleccionada.hora)} · Q${fmt(horaSeleccionada.ventas)} · ${horaSeleccionada.pedidos} pedidos`
                : 'Toca una hora para ver el detalle' }}
            </p>
          </div>
        </div>
        <div v-if="!porHora.horas.length" class="gv-vacio">
          <p class="gv-vacio__titulo">Todavía no hay datos por hora</p>
          <p class="gv-vacio__texto">Se empiezan a guardar desde el próximo cierre de turno.</p>
        </div>
        <template v-else>
          <div>
          <div class="gv-horas">
            <button
              v-for="h in porHora.horas" :key="h.hora"
              class="gv-horas__slot"
              :class="{ 'gv-horas__slot--activo': horaSeleccionada?.hora === h.hora }"
              :aria-label="`${rangoHora(h.hora)}: Q${fmt(h.ventas)}`"
              @click="horaElegida = h.hora"
            >
              <span v-if="h.ventas > 0" class="gv-horas__barra" :style="{ height: altura(h.ventas, maxHora) }"></span>
            </button>
          </div>
          <div class="gv-horas__etiquetas">
            <span v-for="h in porHora.horas" :key="h.hora" class="gv-horas__etiqueta">{{ horaCorta(h.hora) }}</span>
          </div>
          </div>
          <p v-if="porHora.conResumen < turnosPeriodo.length" class="gv-nota">
            Con datos de {{ porHora.conResumen }} de {{ turnosPeriodo.length }} turnos (los anteriores no guardaban este detalle).
          </p>
        </template>
      </section>
    </div>

    <!-- Productos -->
    <section class="gv-card">
      <div class="gv-card__head">
        <div>
          <h3 class="gv-card__titulo">Productos más vendidos</h3>
          <p class="gv-card__sub">Unidades vendidas en el período</p>
        </div>
      </div>
      <div v-if="!masVendidos.productos.length" class="gv-vacio">
        <p class="gv-vacio__titulo">Todavía no hay datos por producto</p>
        <p class="gv-vacio__texto">Se empiezan a guardar desde el próximo cierre de turno.</p>
      </div>
      <template v-else>
        <ul class="gv-barras gv-barras--productos">
          <li v-for="p in productosVista" :key="p.clave" class="gv-barra gv-barra--producto">
            <span class="gv-barra__nombre">
              <span class="gv-barra__nombre-texto">{{ p.nombre }}</span>
              <span v-if="Object.keys(p.opciones).length" class="gv-barra__opciones">{{ textoOpciones(p.opciones) }}</span>
            </span>
            <span class="gv-barra__pista">
              <span class="gv-barra__relleno" :style="{ width: ancho(p.cantidad, maxProducto) }"></span>
            </span>
            <span class="gv-barra__valor">
              {{ fmt(p.cantidad) }}
              <span class="gv-barra__valor-sub">Q{{ fmt(p.total) }}</span>
            </span>
          </li>
        </ul>
        <button
          v-if="masVendidos.productos.length > LIMITE_PRODUCTOS"
          class="gv-mas"
          @click="verTodos = !verTodos"
        >{{ verTodos ? 'Ver menos' : `Ver los ${masVendidos.productos.length} productos` }}</button>
        <p v-if="masVendidos.conResumen < turnosPeriodo.length" class="gv-nota">
          Con datos de {{ masVendidos.conResumen }} de {{ turnosPeriodo.length }} turnos (los anteriores no guardaban este detalle).
        </p>
      </template>
    </section>

  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import {
  PERIODOS, aFecha, rangoPeriodo, turnosEntre, totales, cambio,
  ventasPorDia, promedioPorDiaSemana, productosMasVendidos, ventasPorHora, escalaEje,
  compararSucursales
} from '../../utils/estadisticas.js'

// Recibe los turnos cerrados que ya cargó HistorialTurnos.vue: esta
// pantalla no hace consultas propias a Firebase.
// sucursales: [{ id, nombre, color }] (ver conColores en estadisticas.js)
// comparar: true con el filtro "Todas" y más de una sucursal
const props = defineProps({
  turnos: { type: Array, required: true },
  sucursales: { type: Array, default: () => [] },
  comparar: { type: Boolean, default: false }
})

const periodo = ref('7d')
const LIMITE_PRODUCTOS = 8
const verTodos = ref(false)

// ── Formato ──
const fmt = n => (Number(n) || 0).toLocaleString('es-GT', { maximumFractionDigits: 2 })
const compacto = v => v >= 10000 ? `${fmt(v / 1000)}K` : fmt(v)
const altura = (v, tope) => `max(3px, ${(v / tope) * 100}%)`
const ancho = (v, tope) => `max(4px, ${tope ? (v / tope) * 100 : 0}%)`

function fechaLarga(d) {
  const t = d.toLocaleDateString('es-GT', { weekday: 'long', day: 'numeric', month: 'long' })
  return t.charAt(0).toUpperCase() + t.slice(1)
}
function etiquetaDia(d) {
  if (dias.value.length <= 7) {
    const dia = d.toLocaleDateString('es-GT', { weekday: 'short' }).replace('.', '')
    return `${dia.charAt(0).toUpperCase()}${dia.slice(1, 3)} ${d.getDate()}`
  }
  return d.getDate() === 1 || dias.value.length > 31
    ? `${d.getDate()} ${d.toLocaleDateString('es-GT', { month: 'short' }).replace('.', '')}`
    : `${d.getDate()}`
}
function hora(f) {
  const d = aFecha(f)
  return d ? d.toLocaleTimeString('es-GT', { hour: 'numeric', minute: '2-digit' }) : '—'
}
function horaCorta(h) {
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}${h < 12 ? 'a' : 'p'}`
}
function rangoHora(h) {
  const f = x => { const h12 = x % 12 === 0 ? 12 : x % 12; return `${h12} ${x % 24 < 12 ? 'a. m.' : 'p. m.'}` }
  return `De ${f(h)} a ${f(h + 1)}`
}
function textoOpciones(opciones) {
  return Object.entries(opciones).sort((a, b) => b[1] - a[1]).map(([n, c]) => `${n} ${c}`).join(' · ')
}

// ── Período ──
const rango = computed(() => rangoPeriodo(periodo.value, props.turnos))
const turnosPeriodo = computed(() => turnosEntre(props.turnos, rango.value.desde, rango.value.hasta))
const turnosAnteriores = computed(() =>
  rango.value.anterior ? turnosEntre(props.turnos, rango.value.anterior.desde, rango.value.anterior.hasta) : []
)
const textoAnterior = computed(() => ({
  '7d': 'los 7 días anteriores',
  '30d': 'los 30 días anteriores',
  mes: 'el mismo tramo del mes pasado'
}[periodo.value] || ''))

// ── Cifras ──
const cifras = computed(() => {
  const a = totales(turnosPeriodo.value)
  // Sin turnos en el período anterior no hay comparación justa
  const b = turnosAnteriores.value.length ? totales(turnosAnteriores.value) : null
  const turnosTxt = `${a.cantidadTurnos} ${a.cantidadTurnos === 1 ? 'turno' : 'turnos'}`
  return [
    { id: 'ventas', label: 'Vendido', valor: `Q${fmt(a.ventas)}`, cambio: cambio(a.ventas, b?.ventas), tono: tono(cambio(a.ventas, b?.ventas)), nota: turnosTxt },
    { id: 'pedidos', label: 'Pedidos', valor: fmt(a.pedidos), cambio: cambio(a.pedidos, b?.pedidos), tono: tono(cambio(a.pedidos, b?.pedidos)), nota: turnosTxt },
    { id: 'ticket', label: 'Ticket promedio', valor: `Q${fmt(Math.round(a.ticketPromedio))}`, cambio: cambio(a.ticketPromedio, b?.ticketPromedio), tono: tono(cambio(a.ticketPromedio, b?.ticketPromedio)), nota: 'por pedido' },
    // Más gastos no es "bueno": el color va al revés
    { id: 'gastos', label: 'Gastos', valor: `Q${fmt(a.gastos)}`, cambio: cambio(a.gastos, b?.gastos), tono: tono(cambio(a.gastos, b?.gastos), true), nota: 'salidas de caja' }
  ]
})
function tono(c, alReves = false) {
  if (c === null || Math.abs(c) < 0.005) return 'neutro'
  return (c > 0) !== alReves ? 'bueno' : 'malo'
}

// ── Comparación entre sucursales ──
const comparacion = computed(() =>
  props.comparar ? compararSucursales(turnosPeriodo.value, turnosAnteriores.value, props.sucursales) : []
)
const maxComparacion = computed(() => Math.max(...comparacion.value.map(c => c.ventas), 0) || 1)
const colorDe = id => props.sucursales.find(s => s.id === id)?.color || '#b3a394'
const nombreSucursal = id => props.sucursales.find(s => s.id === id)?.nombre || 'Sucursal'

// Columnas por día: apiladas por sucursal (comparando) o por método de pago
const seriesDia = computed(() => props.comparar
  ? props.sucursales.map(s => ({ id: s.id, nombre: s.nombre, color: s.color, valor: d => d.porSucursal[s.id] || 0 }))
  : [
      { id: 'efectivo', nombre: 'Efectivo', color: '#e8621a', valor: d => d.efectivo },
      { id: 'tarjeta', nombre: 'Tarjeta', color: '#2f7fc1', valor: d => d.tarjeta }
    ]
)

// ── Ventas por día ──
const dias = computed(() => ventasPorDia(props.turnos, rango.value.desde, rango.value.hasta))
const escalaDias = computed(() => escalaEje(Math.max(...dias.value.map(d => d.total), 0)))
const saltoEtiquetas = computed(() => Math.max(1, Math.ceil(dias.value.length / 16)))

// Día elegido: por defecto, el último día con ventas
const claveSeleccionada = ref(null)
const diaSeleccionado = computed(() =>
  dias.value.find(d => d.clave === claveSeleccionada.value) ||
  [...dias.value].reverse().find(d => d.turnos.length) ||
  null
)

// ── Día de la semana ──
const porSemana = computed(() => promedioPorDiaSemana(dias.value))
const maxSemana = computed(() => Math.max(...porSemana.value.map(g => g.promedio), 0))

// ── Horas ──
const porHora = computed(() => ventasPorHora(turnosPeriodo.value))
const maxHora = computed(() => Math.max(...porHora.value.horas.map(h => h.ventas), 0) || 1)
const horaElegida = ref(null)
const horaSeleccionada = computed(() => porHora.value.horas.find(h => h.hora === horaElegida.value) || null)

// ── Productos ──
const masVendidos = computed(() => productosMasVendidos(turnosPeriodo.value))
const maxProducto = computed(() => masVendidos.value.productos[0]?.cantidad || 1)
const productosVista = computed(() =>
  verTodos.value ? masVendidos.value.productos : masVendidos.value.productos.slice(0, LIMITE_PRODUCTOS)
)

// Al cambiar de período, se limpia lo elegido del anterior
watch(periodo, () => {
  claveSeleccionada.value = null
  horaElegida.value = null
  verTodos.value = false
})
</script>

<style scoped>
/* Igual que el resto del POS: neutraliza la fuente global (Amatic SC / 24px).
   Cada texto lleva su propio font-size. */
.gv, .gv * { font-family: 'Plus Jakarta Sans', sans-serif !important; box-sizing: border-box; }

.gv { display: flex; flex-direction: column; gap: 16px; }

/* ── Período ── */
.gv__periodos {
  display: inline-flex; align-self: flex-start; gap: 4px; padding: 4px;
  background: #efe7de; border-radius: 12px;
}
.gv__periodo {
  height: 38px; padding: 0 16px; border-radius: 9px; border: none; cursor: pointer;
  background: transparent; color: #8a7362; font-size: 14px; font-weight: 700;
}
.gv__periodo--activo { background: #ffffff; color: #2c1a0e; box-shadow: 0 1px 3px rgba(44,26,14,0.12); }

/* ── Cifras ── */
.gv-cifras { display: grid; grid-template-columns: 1.3fr 1fr 1fr 1fr; gap: 14px; }
.gv-cifra {
  background: #ffffff; border: 1px solid #efe6dc; border-radius: 16px;
  padding: 16px 18px; display: flex; flex-direction: column; gap: 4px;
}
.gv-cifra__label {
  font-size: 11.5px; font-weight: 800; color: #b3a394;
  text-transform: uppercase; letter-spacing: 0.07em;
}
.gv-cifra__valor { font-size: 26px; font-weight: 800; color: #2c1a0e; line-height: 1.15; letter-spacing: -0.01em; }
.gv-cifra__cambio { font-size: 13px; font-weight: 800; }
.gv-cifra__cambio--bueno { color: #24733b; }
.gv-cifra__cambio--malo { color: #b3261e; }
.gv-cifra__cambio--neutro { color: #8a7362; }
.gv-cifra__vs { font-size: 12.5px; font-weight: 600; color: #a3948a; }
.gv-cifra--principal { background: #2c1a0e; border-color: #2c1a0e; }
.gv-cifra--principal .gv-cifra__label { color: rgba(255,255,255,0.55); }
.gv-cifra--principal .gv-cifra__valor { color: #f5a623; font-size: 30px; }
.gv-cifra--principal .gv-cifra__vs { color: rgba(255,255,255,0.5); }
.gv-cifra--principal .gv-cifra__cambio--bueno { color: #7fd99a; }
.gv-cifra--principal .gv-cifra__cambio--malo { color: #ff9b8f; }
.gv-cifra--principal .gv-cifra__cambio--neutro { color: rgba(255,255,255,0.6); }

/* ── Tarjeta de gráfica ── */
.gv-card {
  background: #ffffff; border: 1px solid #efe6dc; border-radius: 18px;
  padding: 18px 20px; display: flex; flex-direction: column; gap: 14px; min-width: 0;
}
.gv-card__head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; flex-wrap: wrap; }
.gv-card__titulo { margin: 0; font-size: 16px; font-weight: 800; color: #2c1a0e; }
.gv-card__sub { margin: 3px 0 0; font-size: 13px; font-weight: 500; color: #a3948a; }

.gv-leyenda { display: flex; gap: 14px; }
.gv-leyenda__item { display: inline-flex; align-items: center; gap: 6px; }
.gv-leyenda__muestra { width: 10px; height: 10px; border-radius: 3px; }
.gv-leyenda__texto { font-size: 13px; font-weight: 600; color: #6b5444; }

/* ── Columnas por día ── */
.gv-col { display: grid; grid-template-columns: auto 1fr; gap: 8px; }
.gv-col__eje { position: relative; height: 220px; min-width: 40px; }
.gv-col__tick {
  position: absolute; right: 0; transform: translateY(50%);
  font-size: 11.5px; font-weight: 600; color: #a3948a; font-variant-numeric: tabular-nums;
}
.gv-col__cuerpo { min-width: 0; }
.gv-col__area { position: relative; height: 220px; }
.gv-col__guia { position: absolute; left: 0; right: 0; height: 1px; background: #f2ebe3; }
.gv-col__guia:first-child { background: #e6dacd; }
.gv-col__barras { position: absolute; inset: 0; display: flex; gap: 2px; }
.gv-col__slot {
  flex: 1; min-width: 0; height: 100%; padding: 0; border: none; border-radius: 6px 6px 0 0;
  background: transparent; cursor: pointer;
  display: flex; align-items: flex-end; justify-content: center;
}
.gv-col__slot--activo { background: #f6efe7; }
.gv-col__pila {
  display: flex; flex-direction: column-reverse; gap: 2px;
  width: 70%; max-width: 24px; border-radius: 4px 4px 0 0; overflow: hidden;
}
.gv-col__seg { display: block; min-height: 1px; flex-basis: 0; }
.gv-col__etiquetas { display: flex; gap: 2px; margin-top: 6px; }
.gv-col__etiqueta {
  flex: 1; min-width: 0; text-align: center; white-space: nowrap; overflow: visible;
  font-size: 11.5px; font-weight: 600; color: #a3948a;
}

/* Detalle del día */
.gv-dia { background: #faf6f1; border-radius: 14px; padding: 14px 16px; }
.gv-dia__head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
.gv-dia__fecha { margin: 0; font-size: 15px; font-weight: 800; color: #2c1a0e; }
.gv-dia__resumen { margin: 3px 0 0; font-size: 13px; font-weight: 600; color: #8a7362; }
.gv-dia__total { font-size: 22px; font-weight: 800; color: #e8621a; white-space: nowrap; }
.gv-dia__turnos { list-style: none; margin: 10px 0 0; padding: 0; border-top: 1px solid #efe6dc; }
.gv-dia__turno {
  display: grid; grid-template-columns: 1fr auto auto; gap: 16px; align-items: baseline;
  padding: 9px 0; border-bottom: 1px solid #efe6dc;
}
.gv-dia__turno:last-child { border-bottom: none; padding-bottom: 0; }
.gv-dia__turno-horas { font-size: 14px; font-weight: 700; color: #2c1a0e; }
.gv-dia__turno-pedidos { font-size: 13px; font-weight: 600; color: #a3948a; }
.gv-dia__turno-total { font-size: 14px; font-weight: 800; color: #2c1a0e; font-variant-numeric: tabular-nums; }

/* ── Comparación entre sucursales ── */
.gv-comp { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; }
.gv-comp__fila {
  display: grid; grid-template-columns: minmax(120px, 22%) 1fr auto; align-items: center;
  column-gap: 14px; row-gap: 4px; padding: 12px 0; border-bottom: 1px solid #f2ebe3;
}
.gv-comp__fila:last-child { border-bottom: none; padding-bottom: 0; }
.gv-comp__fila:first-child { padding-top: 0; }
.gv-comp__nombre { display: flex; align-items: center; gap: 8px; min-width: 0; }
.gv-comp__punto { display: inline-block; width: 10px; height: 10px; border-radius: 3px; flex-shrink: 0; margin-right: 6px; vertical-align: 1px; }
.gv-comp__nombre .gv-comp__punto { margin-right: 0; }
.gv-comp__texto { font-size: 14.5px; font-weight: 700; color: #2c1a0e; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.gv-comp__pista { display: block; height: 18px; }
.gv-comp__barra { display: block; height: 100%; border-radius: 0 4px 4px 0; }
.gv-comp__valores { display: flex; align-items: baseline; gap: 8px; justify-content: flex-end; min-width: 120px; }
.gv-comp__valor { font-size: 16px; font-weight: 800; color: #2c1a0e; font-variant-numeric: tabular-nums; }
.gv-comp__parte { font-size: 13px; font-weight: 700; color: #a3948a; min-width: 36px; text-align: right; font-variant-numeric: tabular-nums; }
.gv-comp__detalle { grid-column: 2 / -1; display: flex; flex-wrap: wrap; gap: 4px 14px; }
.gv-comp__dato { font-size: 12.5px; font-weight: 600; color: #8a7362; }
.gv-comp__cambio { font-size: 12.5px; font-weight: 800; }
.gv-dia__turno-sucursal { font-size: 14px; font-weight: 700; color: #6b5444; }

/* ── Dos columnas ── */
.gv-fila { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

/* ── Barras horizontales ── */
.gv-barras { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
.gv-barra { display: grid; grid-template-columns: 88px 1fr 76px; align-items: center; gap: 10px; }
.gv-barra__nombre { font-size: 13.5px; font-weight: 600; color: #6b5444; min-width: 0; }
.gv-barra__pista { display: block; height: 14px; }
.gv-barra__relleno { display: block; height: 100%; background: #e8621a; border-radius: 0 4px 4px 0; }
.gv-barra__valor { font-size: 13.5px; font-weight: 800; color: #2c1a0e; text-align: right; font-variant-numeric: tabular-nums; }

.gv-barra--producto { grid-template-columns: minmax(150px, 34%) 1fr 92px; }
.gv-barra--producto .gv-barra__nombre { display: flex; flex-direction: column; gap: 1px; }
.gv-barra__nombre-texto { font-size: 14px; font-weight: 700; color: #2c1a0e; }
.gv-barra__opciones { font-size: 12px; font-weight: 500; color: #a3948a; }
.gv-barra--producto .gv-barra__pista { height: 16px; }
.gv-barra--producto .gv-barra__valor { display: flex; flex-direction: column; align-items: flex-end; gap: 1px; font-size: 15px; }
.gv-barra__valor-sub { font-size: 12px; font-weight: 600; color: #a3948a; }

/* ── Columnas por hora ── */
.gv-horas { display: flex; gap: 2px; height: 180px; border-bottom: 1px solid #e6dacd; }
.gv-horas__slot {
  flex: 1; min-width: 0; height: 100%; padding: 0; border: none; border-radius: 6px 6px 0 0;
  background: transparent; cursor: pointer; display: flex; align-items: flex-end; justify-content: center;
}
.gv-horas__slot--activo { background: #f6efe7; }
.gv-horas__barra { display: block; width: 70%; max-width: 24px; background: #e8621a; border-radius: 4px 4px 0 0; }
.gv-horas__etiquetas { display: flex; gap: 2px; margin-top: 6px; }
.gv-horas__etiqueta { flex: 1; min-width: 0; text-align: center; font-size: 11.5px; font-weight: 600; color: #a3948a; }

.gv-mas {
  align-self: flex-start; border: none; background: transparent; padding: 2px 0; cursor: pointer;
  color: #e8621a; font-size: 13.5px; font-weight: 700;
}
.gv-nota { margin: 0; font-size: 12.5px; font-weight: 500; color: #a3948a; }

.gv-vacio { padding: 28px 12px; text-align: center; background: #faf6f1; border-radius: 12px; }
.gv-vacio__titulo { margin: 0; font-size: 14.5px; font-weight: 800; color: #6b5444; }
.gv-vacio__texto { margin: 4px 0 0; font-size: 13px; font-weight: 500; color: #a3948a; }

@media (max-width: 900px) {
  .gv-cifras { grid-template-columns: 1fr 1fr; }
  .gv-fila { grid-template-columns: 1fr; }
}
@media (max-width: 600px) {
  .gv__periodos { align-self: stretch; }
  .gv__periodo { flex: 1; padding: 0 8px; font-size: 13px; }
  .gv-card { padding: 16px; }
  .gv-barra--producto { grid-template-columns: 1fr 72px; }
  .gv-barra--producto .gv-barra__pista { grid-column: 1 / -1; grid-row: 2; }
  .gv-comp__fila { grid-template-columns: 1fr auto; }
  .gv-comp__pista { grid-column: 1 / -1; grid-row: 2; }
  .gv-comp__detalle { grid-column: 1 / -1; }
}
</style>