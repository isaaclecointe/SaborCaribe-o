<template>
  <div class="hist">

    <header class="hist__header">
      <button class="hist__volver" @click="router.push('/pos')">
        <svg class="hist__volver-icono" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg>
        <span class="hist__volver-texto">Volver al POS</span>
      </button>
      <h1 class="hist__titulo">Historial de turnos</h1>
      <div class="hist__spacer"></div>
    </header>

    <main class="hist__main">

      <!-- Resumen de todos los turnos cerrados -->
      <section class="resumen">
        <div class="resumen__card resumen__card--destacado">
          <span class="resumen__label">Total vendido</span>
          <span class="resumen__valor">Q{{ fmt(totalGeneral) }}</span>
          <span class="resumen__nota">
            {{ turnos.length }} {{ turnos.length === 1 ? 'turno cerrado' : 'turnos cerrados' }}
          </span>
        </div>
        <div class="resumen__card">
          <span class="resumen__label">Ventas en efectivo</span>
          <span class="resumen__valor">Q{{ fmt(totalEfectivoGeneral) }}</span>
        </div>
        <div class="resumen__card">
          <span class="resumen__label">Ventas con tarjeta</span>
          <span class="resumen__valor">Q{{ fmt(totalTarjetaGeneral) }}</span>
        </div>
        <div class="resumen__card">
          <span class="resumen__label">Gastos</span>
          <span class="resumen__valor" :class="{ 'resumen__valor--gasto': totalGastosGeneral > 0 }">
            Q{{ fmt(totalGastosGeneral) }}
          </span>
        </div>
      </section>

      <div v-if="cargando" class="hist__estado">
        <p class="hist__estado-titulo">Cargando turnos…</p>
      </div>

      <div v-else-if="turnos.length === 0" class="hist__estado">
        <p class="hist__estado-titulo">Aún no hay turnos cerrados</p>
        <p class="hist__estado-texto">Cuando cierres tu primer turno, su resumen aparecerá aquí.</p>
      </div>

      <template v-else>
        <h2 class="hist__seccion">Turnos cerrados</h2>

        <div class="turnos-lista">
          <article v-for="t in turnosVista" :key="t.id" class="turno">

            <!-- Fecha, horario y total -->
            <div class="turno__head">
              <div class="turno__fechas">
                <h3 class="turno__fecha">{{ formatFecha(t.fechaApertura) }}</h3>
                <p class="turno__horas">
                  {{ rangoHoras(t) }}
                  <span v-if="duracion(t)" class="turno__duracion">· {{ duracion(t) }}</span>
                </p>
              </div>
              <div class="turno__total">
                <span class="turno__total-label">Total vendido</span>
                <span class="turno__total-valor">Q{{ fmt(t.totalVentas || 0) }}</span>
              </div>
            </div>

            <!-- Desglose -->
            <div class="turno__stats">
              <div class="turno__stat">
                <span class="turno__stat-label">Fondo inicial</span>
                <span class="turno__stat-valor">Q{{ fmt(t.fondoInicial || 0) }}</span>
              </div>
              <div class="turno__stat">
                <span class="turno__stat-label">Ventas en efectivo</span>
                <span class="turno__stat-valor">Q{{ fmt(t.ventasEfectivo || 0) }}</span>
              </div>
              <div class="turno__stat">
                <span class="turno__stat-label">Ventas con tarjeta</span>
                <span class="turno__stat-valor">Q{{ fmt(t.ventasTarjeta || 0) }}</span>
              </div>
              <div class="turno__stat">
                <span class="turno__stat-label">Gastos</span>
                <span class="turno__stat-valor" :class="{ 'turno__stat-valor--gasto': t.gastosTotal > 0 }">
                  {{ t.gastosTotal > 0 ? `−Q${fmt(t.gastosTotal)}` : 'Q0' }}
                </span>
              </div>
              <div class="turno__stat">
                <span class="turno__stat-label">Pedidos</span>
                <span class="turno__stat-valor">{{ t.cantidadPedidos || 0 }}</span>
              </div>
            </div>

            <!-- Cuadre de caja -->
            <div class="turno__caja" :class="`turno__caja--${t.caja.tipo}`">
              <div class="turno__caja-datos">
                <span class="turno__caja-dato">
                  Debía haber <span class="turno__caja-num">Q{{ fmt(t.caja.esperado) }}</span>
                </span>
                <span class="turno__caja-dato">
                  Contado
                  <span class="turno__caja-num">{{ t.caja.contado === null ? '—' : `Q${fmt(t.caja.contado)}` }}</span>
                </span>
              </div>
              <span class="turno__caja-estado">{{ t.caja.texto }}</span>
            </div>

            <!-- Detalle de gastos -->
            <div v-if="t.gastos?.length" class="turno__gastos">
              <button class="turno__gastos-toggle" @click="toggleGastos(t.id)">
                <span class="turno__gastos-toggle-texto">
                  {{ gastosAbiertos.has(t.id) ? 'Ocultar gastos' : `Ver gastos (${t.gastos.length})` }}
                </span>
                <svg
                  class="turno__gastos-chevron"
                  :class="{ 'turno__gastos-chevron--abierto': gastosAbiertos.has(t.id) }"
                  viewBox="0 0 24 24" aria-hidden="true"
                ><path d="M6 9l6 6 6-6" /></svg>
              </button>
              <ul v-if="gastosAbiertos.has(t.id)" class="turno__gastos-lista">
                <li v-for="g in gastosOrdenados(t)" :key="g.id" class="turno__gasto">
                  <span class="turno__gasto-concepto">{{ g.concepto }}</span>
                  <span class="turno__gasto-hora">{{ formatHora(g.fecha) }}</span>
                  <span class="turno__gasto-monto">−Q{{ fmt(g.monto) }}</span>
                </li>
              </ul>
            </div>

          </article>
        </div>
      </template>

    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { db } from '../../firebase.js'
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore'

const router = useRouter()
const turnos = ref([])
const cargando = ref(true)
let unsub = null

// ── Formato ──
// Separador de miles al estilo de Guatemala: Q2,919
function fmt(n) {
  return (Number(n) || 0).toLocaleString('es-GT', { maximumFractionDigits: 2 })
}

function aFecha(f) {
  if (f?.toDate) return f.toDate()
  if (f instanceof Date) return f
  return null
}

function formatFecha(f) {
  const d = aFecha(f)
  if (!d) return '—'
  const texto = d.toLocaleDateString('es-GT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

function formatHora(f) {
  const d = aFecha(f)
  return d ? d.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' }) : '—'
}

// "03:22 p. m. – 11:40 p. m.". Si el turno cerró otro día, se indica cuál:
// "03:22 p. m. – vie 6 nov, 12:07 p. m."
function rangoHoras(t) {
  const ini = aFecha(t.fechaApertura)
  const fin = aFecha(t.fechaCierre)
  if (!ini || !fin) return `${formatHora(t.fechaApertura)} – ${formatHora(t.fechaCierre)}`
  if (ini.toDateString() === fin.toDateString()) return `${formatHora(ini)} – ${formatHora(fin)}`
  const dia = fin.toLocaleDateString('es-GT', { weekday: 'short', day: 'numeric', month: 'short' }).replace(',', '')
  return `${formatHora(ini)} – ${dia}, ${formatHora(fin)}`
}

function duracion(t) {
  const ini = aFecha(t.fechaApertura)
  const fin = aFecha(t.fechaCierre)
  if (!ini || !fin) return ''
  const min = Math.max(0, Math.round((fin - ini) / 60000))
  const h = Math.floor(min / 60)
  const m = min % 60
  return h ? `${h} h ${m} min` : `${m} min`
}

// ── Gastos ──
function totalGastosDe(t) {
  if (typeof t.totalGastos === 'number') return t.totalGastos
  return (t.gastos || []).reduce((s, g) => s + (Number(g.monto) || 0), 0)
}

function gastosOrdenados(t) {
  return [...(t.gastos || [])].sort((a, b) => (aFecha(a.fecha) || 0) - (aFecha(b.fecha) || 0))
}

const gastosAbiertos = ref(new Set())
function toggleGastos(id) {
  const s = new Set(gastosAbiertos.value)
  s.has(id) ? s.delete(id) : s.add(id)
  gastosAbiertos.value = s
}

// ── Cuadre de caja ──
// Lo que debía haber en caja: los cierres nuevos lo guardan; para los
// viejos se calcula (fondo + ventas en efectivo − gastos).
function esperadoDe(t) {
  if (typeof t.efectivoEsperado === 'number') return t.efectivoEsperado
  return (t.fondoInicial || 0) + (t.ventasEfectivo || 0) - totalGastosDe(t)
}

function cuadreDe(t) {
  const esperado = esperadoDe(t)
  const contado = t.efectivoContado
  // Sin conteo: los cierres nuevos guardan null si no se contó. Los viejos
  // guardaban "contado 0, diferencia 0" aunque debía haber efectivo, lo cual
  // es imposible si de verdad se contó (la diferencia habría sido negativa).
  const sinConteo = contado === null || contado === undefined ||
    (contado === 0 && (t.diferencia || 0) === 0 && esperado > 0)
  if (sinConteo) return { tipo: 'sin-conteo', texto: 'Sin conteo registrado', esperado, contado: null }

  const diferencia = typeof t.diferencia === 'number' ? t.diferencia : contado - esperado
  if (diferencia === 0) return { tipo: 'ok', texto: 'Cuadrado', esperado, contado }
  if (diferencia < 0) return { tipo: 'falta', texto: `Faltó Q${fmt(Math.abs(diferencia))}`, esperado, contado }
  return { tipo: 'sobra', texto: `Sobró Q${fmt(diferencia)}`, esperado, contado }
}

const turnosVista = computed(() =>
  turnos.value.map(t => ({ ...t, gastosTotal: totalGastosDe(t), caja: cuadreDe(t) }))
)

// ── Totales generales ──
const totalEfectivoGeneral = computed(() =>
  turnos.value.reduce((s, t) => s + (t.ventasEfectivo || 0), 0)
)
const totalTarjetaGeneral = computed(() =>
  turnos.value.reduce((s, t) => s + (t.ventasTarjeta || 0), 0)
)
const totalGeneral = computed(() =>
  totalEfectivoGeneral.value + totalTarjetaGeneral.value
)
const totalGastosGeneral = computed(() =>
  turnos.value.reduce((s, t) => s + totalGastosDe(t), 0)
)

onMounted(() => {
  const q = query(
    collection(db, 'turnos'),
    where('abierto', '==', false),
    orderBy('fechaCierre', 'desc')
  )
  unsub = onSnapshot(q, (snap) => {
    turnos.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    cargando.value = false
  }, (err) => {
    console.error('Error cargando turnos:', err)
    cargando.value = false
  })
})

onUnmounted(() => { if (unsub) unsub() })
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

/* Igual que en el POS: neutraliza la fuente global (Amatic SC / 24px) solo
   dentro de esta pantalla. Cada texto lleva su propio font-size. */
.hist, .hist * { font-family: 'Plus Jakarta Sans', sans-serif !important; box-sizing: border-box; }

.hist {
  min-height: 100vh; background: #f7f4f0;
  -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;
}

/* ── Barra superior ── */
.hist__header {
  display: grid; grid-template-columns: 1fr auto 1fr; align-items: center;
  background: #1a0e06; padding: 0 16px; height: 60px;
  position: sticky; top: 0; z-index: 10;
}
.hist__volver {
  justify-self: start; display: inline-flex; align-items: center; gap: 6px;
  height: 38px; padding: 0 14px 0 10px; border-radius: 10px; border: none;
  background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.85); cursor: pointer;
  transition: background 0.12s;
}
.hist__volver:hover { background: rgba(255,255,255,0.14); }
.hist__volver-icono {
  width: 18px; height: 18px; fill: none; stroke: currentColor;
  stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round;
}
.hist__volver-texto { font-size: 14px; font-weight: 700; }
.hist__titulo { margin: 0; font-size: 17px; font-weight: 800; color: #ffffff; }

.hist__main { padding: 24px; max-width: 1100px; margin: 0 auto; }

/* ── Resumen general ── */
.resumen {
  display: grid; grid-template-columns: 1.3fr 1fr 1fr 1fr; gap: 14px; margin-bottom: 28px;
}
.resumen__card {
  background: #ffffff; border: 1px solid #efe6dc; border-radius: 16px;
  padding: 18px 20px; display: flex; flex-direction: column; gap: 4px;
  box-shadow: 0 1px 2px rgba(44,26,14,0.04);
}
.resumen__label {
  font-size: 11.5px; font-weight: 800; color: #b3a394;
  text-transform: uppercase; letter-spacing: 0.07em;
}
.resumen__valor {
  font-size: 28px; font-weight: 800; color: #2c1a0e; line-height: 1.15;
  font-variant-numeric: tabular-nums; letter-spacing: -0.01em;
}
.resumen__valor--gasto { color: #b3261e; }
.resumen__nota { font-size: 12.5px; font-weight: 600; color: #a3948a; }
.resumen__card--destacado { background: #2c1a0e; border-color: #2c1a0e; }
.resumen__card--destacado .resumen__label { color: rgba(255,255,255,0.55); }
.resumen__card--destacado .resumen__valor { color: #f5a623; font-size: 32px; }
.resumen__card--destacado .resumen__nota { color: rgba(255,255,255,0.5); }

/* ── Estados ── */
.hist__estado { text-align: center; padding: 72px 16px; }
.hist__estado-titulo { margin: 0; font-size: 18px; font-weight: 800; color: #6b5444; }
.hist__estado-texto { margin: 6px 0 0; font-size: 14px; font-weight: 500; color: #a3948a; }

.hist__seccion {
  margin: 0 0 12px; font-size: 12px; font-weight: 800; color: #b3a394;
  text-transform: uppercase; letter-spacing: 0.07em;
}

/* ── Turno ── */
.turnos-lista { display: flex; flex-direction: column; gap: 14px; }
.turno {
  background: #ffffff; border: 1px solid #efe6dc; border-radius: 18px;
  padding: 20px 22px; display: flex; flex-direction: column; gap: 16px;
  box-shadow: 0 1px 2px rgba(44,26,14,0.04), 0 6px 18px rgba(44,26,14,0.04);
}

.turno__head { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
.turno__fechas { min-width: 0; }
.turno__fecha { margin: 0; font-size: 17px; font-weight: 800; color: #2c1a0e; }
.turno__horas { margin: 3px 0 0; font-size: 13.5px; font-weight: 600; color: #8a7362; }
.turno__duracion { font-size: 13.5px; font-weight: 500; color: #b3a394; }
.turno__total { display: flex; flex-direction: column; align-items: flex-end; gap: 1px; flex-shrink: 0; }
.turno__total-label {
  font-size: 11px; font-weight: 800; color: #b3a394;
  text-transform: uppercase; letter-spacing: 0.07em;
}
.turno__total-valor {
  font-size: 28px; font-weight: 800; color: #e8621a; line-height: 1.1;
  font-variant-numeric: tabular-nums;
}

.turno__stats {
  display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px;
  padding: 14px 0; border-top: 1px solid #f2ebe3; border-bottom: 1px solid #f2ebe3;
}
.turno__stat { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
.turno__stat-label { font-size: 12px; font-weight: 600; color: #a3948a; }
.turno__stat-valor { font-size: 17px; font-weight: 700; color: #2c1a0e; font-variant-numeric: tabular-nums; }
.turno__stat-valor--gasto { color: #b3261e; }

/* Cuadre de caja */
.turno__caja {
  display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap;
  border-radius: 12px; padding: 12px 16px;
}
.turno__caja-datos { display: flex; gap: 20px; flex-wrap: wrap; }
.turno__caja-dato { font-size: 13.5px; font-weight: 600; color: #6b5444; }
.turno__caja-num { font-size: 14.5px; font-weight: 800; color: #2c1a0e; margin-left: 4px; font-variant-numeric: tabular-nums; }
.turno__caja-estado {
  font-size: 13px; font-weight: 800; padding: 5px 12px; border-radius: 999px; white-space: nowrap;
}
.turno__caja--ok         { background: rgba(47,140,74,0.07); }
.turno__caja--ok .turno__caja-estado { background: rgba(47,140,74,0.14); color: #24733b; }
.turno__caja--falta      { background: rgba(204,0,0,0.05); }
.turno__caja--falta .turno__caja-estado { background: rgba(204,0,0,0.1); color: #b30000; }
.turno__caja--sobra      { background: #fdf6e8; }
.turno__caja--sobra .turno__caja-estado { background: #fbe9c6; color: #8a5a00; }
.turno__caja--sin-conteo { background: #faf6f1; }
.turno__caja--sin-conteo .turno__caja-estado { background: #f0e8df; color: #8a7362; }

/* Detalle de gastos */
.turno__gastos { margin-top: -4px; }
.turno__gastos-toggle {
  display: inline-flex; align-items: center; gap: 4px;
  border: none; background: transparent; cursor: pointer; padding: 4px 6px 4px 0;
  color: #e8621a;
}
.turno__gastos-toggle-texto { font-size: 13.5px; font-weight: 700; }
.turno__gastos-chevron {
  width: 16px; height: 16px; fill: none; stroke: currentColor;
  stroke-width: 2.4; stroke-linecap: round; stroke-linejoin: round; transition: transform 0.15s;
}
.turno__gastos-chevron--abierto { transform: rotate(180deg); }
.turno__gastos-lista {
  list-style: none; margin: 8px 0 0; padding: 4px 14px;
  background: #faf6f1; border-radius: 12px;
}
.turno__gasto {
  display: grid; grid-template-columns: 1fr auto auto; gap: 16px; align-items: baseline;
  padding: 9px 0; border-bottom: 1px solid #f0e6da;
}
.turno__gasto:last-child { border-bottom: none; }
.turno__gasto-concepto { font-size: 14px; font-weight: 700; color: #2c1a0e; }
.turno__gasto-hora { font-size: 12.5px; font-weight: 500; color: #a3948a; }
.turno__gasto-monto { font-size: 14px; font-weight: 800; color: #b3261e; font-variant-numeric: tabular-nums; }

@media (max-width: 900px) {
  .resumen { grid-template-columns: 1fr 1fr; }
  .turno__stats { grid-template-columns: repeat(3, 1fr); row-gap: 14px; }
}
@media (max-width: 600px) {
  .hist__header { grid-template-columns: auto 1fr; gap: 10px; }
  .hist__spacer { display: none; }
  .hist__titulo { font-size: 15px; text-align: right; }
  .hist__main { padding: 14px; }
  .turno { padding: 16px; }
  .turno__head { flex-direction: column; }
  .turno__total { align-items: flex-start; }
  .turno__stats { grid-template-columns: 1fr 1fr; }
}
</style>