<template>
  <div class="cocina">
    <header class="cocina__header">
      <h1>Cocina</h1>
      <span class="cocina__contador">
        {{ pedidosCocina.length }} pedido{{ pedidosCocina.length !== 1 ? 's' : '' }}
      </span>
    </header>

    <div v-if="!pedidosCocina.length" class="cocina__vacio">
      <p>No hay pedidos pendientes 🎉</p>
    </div>

    <div v-else class="cocina__grid">
      <div
        v-for="pedido in pedidosCocina"
        :key="pedido.id"
        class="ticket"
        :class="'ticket--' + urgencia(pedido)"
        :style="{
          transform: `translateY(-${swipeOffsets[pedido.id] || 0}px)`,
          opacity: 1 - (swipeOffsets[pedido.id] || 0) / 180
        }"
        @touchstart="onTouchStart($event, pedido.id)"
        @touchmove="onTouchMove($event, pedido.id)"
        @touchend="onTouchEnd(pedido.id)"
      >
        <div class="ticket__head">
          <span class="ticket__cliente">{{ pedido.cliente }}</span>
          <span class="ticket__tipo">{{ pedido.tipoOrden === 'local' ? 'Comer acá' : 'Para llevar' }}</span>
        </div>

        <span class="ticket__tiempo" :class="'ticket__tiempo--' + urgencia(pedido)">
          Hace {{ minutosDesde(pedido) }} min
        </span>

        <div class="ticket__productos">
          <div v-for="(prod, i) in pedido.productos" :key="i" class="ticket__producto">
            <span class="ticket__producto-nombre">{{ prod.cantidad }}x {{ prod.nombre }}</span>
            <span v-if="notaProducto(prod)" class="ticket__producto-nota">📝 {{ notaProducto(prod) }}</span>
          </div>
        </div>

        <p v-if="pedido.comentario" class="ticket__comentario">💬 {{ pedido.comentario }}</p>

        <button class="ticket__listo" @click="marcarListo(pedido.id)">
          ✓ Listo
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted, onUnmounted } from 'vue'
import { db } from '../../firebase.js'
import { collection, onSnapshot, orderBy, query, doc, updateDoc } from 'firebase/firestore'

const pedidos = ref([])
let unsubscribe = null

// ── Reloj para el indicador de tiempo (se recalcula cada 15s) ──
const ahora = ref(Date.now())
let intervaloReloj = null

onMounted(() => {
  const q = query(collection(db, 'pedidos'), orderBy('fecha', 'asc'))
  unsubscribe = onSnapshot(q, (snap) => {
    pedidos.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  })
  intervaloReloj = setInterval(() => { ahora.value = Date.now() }, 15000)
})

onUnmounted(() => {
  if (unsubscribe) unsubscribe()
  clearInterval(intervaloReloj)
})

// Pedidos que la cocina todavía tiene que preparar, del más viejo al más nuevo
// (mismos estados que ya usa el botón "Listo" en Activos)
const pedidosCocina = computed(() =>
  pedidos.value.filter(p => p.estado === 'nuevo' || p.estado === 'guardado')
)

function minutosDesde(pedido) {
  if (!pedido.fecha?.toDate) return 0
  return Math.max(0, Math.floor((ahora.value - pedido.fecha.toDate().getTime()) / 60000))
}

// Umbrales de urgencia en minutos — ajustalos según qué tan rápido se mueva tu cocina
const UMBRAL_ALERTA = 5
const UMBRAL_CRITICO = 12

function urgencia(pedido) {
  const m = minutosDesde(pedido)
  if (m >= UMBRAL_CRITICO) return 'critico'
  if (m >= UMBRAL_ALERTA) return 'alerta'
  return 'normal'
}

function notaProducto(prod) {
  const partes = []
  if (prod.extras?.length) {
    partes.push(
      prod.extras.map(e => (e.cantidad > 1 ? `${e.cantidad}x ${e.nombre}` : e.nombre)).join(', ')
    )
  }
  if (prod.comentario) partes.push(prod.comentario)
  return partes.join(' · ')
}

// Misma acción que el botón "Listo" de Activos: solo cambia el estado en Firestore
async function marcarListo(id) {
  await updateDoc(doc(db, 'pedidos', id), { estado: 'listo' })
}

// ── Deslizar hacia arriba para marcar listo (además del botón) ──
const swipeOffsets = reactive({})
const swipeStartY = reactive({})

function onTouchStart(e, id) {
  swipeStartY[id] = e.touches[0].clientY
}
function onTouchMove(e, id) {
  if (swipeStartY[id] == null) return
  const delta = swipeStartY[id] - e.touches[0].clientY
  swipeOffsets[id] = Math.max(0, Math.min(delta, 100))
}
function onTouchEnd(id) {
  if ((swipeOffsets[id] || 0) > 70) marcarListo(id)
  swipeStartY[id] = null
  swipeOffsets[id] = 0
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap');

/* Neutraliza la tipografía global (Amatic SC / 24px en *) solo dentro de esta pantalla,
   igual que ya hacemos en POSPage.vue — sin tocar el archivo global. */
.cocina, .cocina * { font-family: 'Plus Jakarta Sans', sans-serif !important; }

.cocina {
  min-height: 100vh;
  background: #fdf8f2;
  padding: 20px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.cocina__header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 20px;
}
.cocina__header h1 { font-size: 24px; font-weight: 800; color: #2c1a0e; margin: 0; }
.cocina__contador {
  font-size: 14px; font-weight: 700; color: #8a7362;
  background: white; border: 1.5px solid #f0e4d8; padding: 6px 14px; border-radius: 999px;
}

.cocina__vacio {
  display: flex; align-items: center; justify-content: center;
  height: 60vh; color: #b3a394; font-size: 18px; font-weight: 600;
}

.cocina__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.ticket {
  background: white; border-radius: 18px; padding: 18px;
  border-left: 6px solid #3aa65a;
  box-shadow: 0 2px 10px rgba(44,26,14,0.06);
  display: flex; flex-direction: column; gap: 12px;
  transition: transform 0.1s, opacity 0.1s;
  touch-action: pan-y;
}
.ticket--alerta { border-left-color: #e8a521; }
.ticket--critico { border-left-color: #cc0000; }

.ticket__head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.ticket__cliente { font-size: 18px; font-weight: 800; color: #2c1a0e; }
.ticket__tipo {
  font-size: 11.5px; font-weight: 700; color: #8a7362;
  background: #f7efe6; padding: 4px 10px; border-radius: 999px; white-space: nowrap;
}

.ticket__tiempo {
  align-self: flex-start; font-size: 12.5px; font-weight: 800;
  padding: 4px 10px; border-radius: 999px;
  background: rgba(58,166,90,0.12); color: #2f8c4a;
}
.ticket__tiempo--alerta { background: rgba(232,165,33,0.18); color: #a86e00; }
.ticket__tiempo--critico { background: rgba(204,0,0,0.1); color: #cc0000; }

.ticket__productos { display: flex; flex-direction: column; gap: 8px; }
.ticket__producto { display: flex; flex-direction: column; gap: 2px; }
.ticket__producto-nombre { font-size: 16px; font-weight: 700; color: #2c1a0e; }
.ticket__producto-nota { font-size: 13px; font-weight: 600; color: #e8621a; }

.ticket__comentario {
  font-size: 13px; font-weight: 600; color: #8a7362; margin: 0;
  background: #f7efe6; padding: 8px 10px; border-radius: 8px;
}

.ticket__listo {
  margin-top: 4px; padding: 16px; border: none; border-radius: 12px;
  background: #2c1a0e; color: white; font-size: 16px; font-weight: 800;
  cursor: pointer;
}
.ticket__listo:active { background: #e8621a; }

@media (max-width: 680px) {
  .cocina__grid { grid-template-columns: 1fr; }
}
</style>