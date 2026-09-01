<template>
  <div class="hist">

    <header class="hist__header">
      <button class="hist__volver" @click="router.push('/pos')">← Volver al POS</button>
      <h1>Historial de turnos</h1>
      <div class="hist__spacer"></div>
    </header>

    <main class="hist__main">

      <!-- Resumen general -->
      <section class="resumen-general">
        <div class="rg-card">
          <span class="rg-card__label">Turnos cerrados</span>
          <strong class="rg-card__valor">{{ turnos.length }}</strong>
        </div>
        <div class="rg-card">
          <span class="rg-card__label">💵 Total efectivo</span>
          <strong class="rg-card__valor">Q{{ totalEfectivoGeneral }}</strong>
        </div>
        <div class="rg-card">
          <span class="rg-card__label">💳 Total tarjeta</span>
          <strong class="rg-card__valor">Q{{ totalTarjetaGeneral }}</strong>
        </div>
        <div class="rg-card rg-card--destacado">
          <span class="rg-card__label">Total vendido</span>
          <strong class="rg-card__valor">Q{{ totalGeneral }}</strong>
        </div>
      </section>

      <!-- Lista de turnos -->
      <div v-if="cargando" class="hist__estado">Cargando…</div>

      <div v-else-if="turnos.length === 0" class="hist__estado">
        <span>📊</span>
        <p>Aún no hay turnos cerrados</p>
      </div>

      <div v-else class="turnos-lista">
        <div v-for="t in turnos" :key="t.id" class="turno-item">

          <div class="turno-item__head">
            <div>
              <p class="turno-item__fecha">{{ formatFecha(t.fechaApertura) }}</p>
              <p class="turno-item__horas">
                {{ formatHora(t.fechaApertura) }} — {{ formatHora(t.fechaCierre) }}
              </p>
            </div>
            <strong class="turno-item__total">Q{{ t.totalVentas || 0 }}</strong>
          </div>

          <div class="turno-item__grid">
            <div class="ti-dato">
              <span>🏦 Fondo</span>
              <strong>Q{{ t.fondoInicial || 0 }}</strong>
            </div>
            <div class="ti-dato">
              <span>💵 Efectivo</span>
              <strong>Q{{ t.ventasEfectivo || 0 }}</strong>
            </div>
            <div class="ti-dato">
              <span>💳 Tarjeta</span>
              <strong>Q{{ t.ventasTarjeta || 0 }}</strong>
            </div>
            <div class="ti-dato">
              <span>🧾 Pedidos</span>
              <strong>{{ t.cantidadPedidos || 0 }}</strong>
            </div>
          </div>

          <div
            class="turno-item__caja"
            :class="{
              'turno-item__caja--ok':    (t.diferencia || 0) === 0,
              'turno-item__caja--falta': (t.diferencia || 0) < 0,
              'turno-item__caja--sobra': (t.diferencia || 0) > 0
            }"
          >
            <span>Efectivo contado: Q{{ t.efectivoContado || 0 }}</span>
            <span v-if="(t.diferencia || 0) === 0">✅ Cuadrado</span>
            <span v-else-if="(t.diferencia || 0) < 0">⚠️ Faltó Q{{ Math.abs(t.diferencia) }}</span>
            <span v-else>💰 Sobró Q{{ t.diferencia }}</span>
          </div>

        </div>
      </div>

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

const totalEfectivoGeneral = computed(() =>
  turnos.value.reduce((s, t) => s + (t.ventasEfectivo || 0), 0)
)
const totalTarjetaGeneral = computed(() =>
  turnos.value.reduce((s, t) => s + (t.ventasTarjeta || 0), 0)
)
const totalGeneral = computed(() =>
  totalEfectivoGeneral.value + totalTarjetaGeneral.value
)

function formatFecha(f) {
  if (!f?.toDate) return '—'
  return f.toDate().toLocaleDateString('es-GT', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })
}

function formatHora(f) {
  if (!f?.toDate) return '—'
  return f.toDate().toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' })
}

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
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Nunito:wght@400;600;700;800&display=swap');

* { box-sizing: border-box; }

.hist {
  min-height: 100vh;
  background: #f7f4f0;
  font-family: 'Nunito', sans-serif;
}

.hist__header {
  display: flex; align-items: center; justify-content: space-between;
  background: #1a0e06; padding: 0 20px; height: 64px;
}
.hist__header h1 {
  font-family: 'Playfair Display', serif; color: white;
  font-size: 22px; margin: 0;
}
.hist__volver {
  background: rgba(255,255,255,0.1); border: none; color: #f5a623;
  padding: 10px 18px; border-radius: 10px;
  font-family: 'Nunito', sans-serif; font-size: 15px; font-weight: 700;
  cursor: pointer; transition: background 0.1s;
}
.hist__volver:hover { background: rgba(255,255,255,0.2); }
.hist__spacer { width: 140px; }

.hist__main { padding: 24px; max-width: 1100px; margin: 0 auto; }

/* Resumen general */
.resumen-general {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 14px; margin-bottom: 28px;
}
.rg-card {
  background: white; border: 1px solid #e8ddd0; border-radius: 16px;
  padding: 20px; display: flex; flex-direction: column; gap: 6px;
}
.rg-card__label { font-size: 13px; color: #8c6a52; font-weight: 700; }
.rg-card__valor {
  font-family: 'Playfair Display', serif; font-size: 30px;
  color: #2c1a0e; font-weight: 700;
}
.rg-card--destacado { background: #1a0e06; border-color: #1a0e06; }
.rg-card--destacado .rg-card__label { color: rgba(255,255,255,0.55); }
.rg-card--destacado .rg-card__valor { color: #f5a623; }

/* Estados */
.hist__estado {
  text-align: center; padding: 80px 0; color: #b09880; font-size: 18px;
}
.hist__estado span { font-size: 64px; display: block; margin-bottom: 16px; }
.hist__estado p { margin: 0; }

/* Lista */
.turnos-lista { display: flex; flex-direction: column; gap: 16px; }

.turno-item {
  background: white; border: 1px solid #e8ddd0;
  border-radius: 16px; padding: 20px;
  border-left: 5px solid #e8621a;
}

.turno-item__head {
  display: flex; justify-content: space-between; align-items: flex-start;
  gap: 12px; margin-bottom: 16px;
}
.turno-item__fecha {
  font-size: 17px; font-weight: 800; color: #2c1a0e;
  margin: 0; text-transform: capitalize;
}
.turno-item__horas { font-size: 14px; color: #8c6a52; margin: 2px 0 0; }
.turno-item__total {
  font-family: 'Playfair Display', serif; font-size: 30px;
  color: #e8621a; font-weight: 700; white-space: nowrap;
}

.turno-item__grid {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px; padding: 14px 0;
  border-top: 1px solid #f0e6d8; border-bottom: 1px solid #f0e6d8;
  margin-bottom: 14px;
}
.ti-dato { display: flex; flex-direction: column; gap: 3px; }
.ti-dato span { font-size: 12px; color: #8c6a52; font-weight: 700; }
.ti-dato strong { font-size: 18px; color: #2c1a0e; }

.turno-item__caja {
  display: flex; justify-content: space-between; align-items: center;
  gap: 10px; padding: 12px 16px; border-radius: 10px;
  font-size: 14px; font-weight: 700; flex-wrap: wrap;
}
.turno-item__caja--ok    { background: #eaf9ee; color: #1a6b32; }
.turno-item__caja--falta { background: #fff0f0; color: #cc0000; }
.turno-item__caja--sobra { background: #fff8e8; color: #8a5a00; }

@media (max-width: 767px) {
  .hist__header { padding: 0 12px; }
  .hist__header h1 { font-size: 17px; }
  .hist__volver { padding: 8px 12px; font-size: 13px; }
  .hist__spacer { display: none; }
  .hist__main { padding: 14px; }
}
</style>