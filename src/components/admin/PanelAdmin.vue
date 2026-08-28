<template>
  <div class="admin">
    <!-- Encabezado del panel -->
    <div class="admin__header">
      <div class="admin__logo">
        <span class="admin__dot"></span>
        <h1>Panel Sabor Caribeño</h1>

        <!-- Botón de Cerrar Sesión corregido -->
        <button @click="cerrarSesion" class="btn-logout">
          <span>🔒</span> Cerrar Sesión
        </button>
      </div>

      <div class="admin__tabs">
        <button
          class="tab-btn"
          :class="{ 'tab-btn--activo': filtroEstado === 'activos' }"
          @click="filtroEstado = 'activos'"
        >
          🔴 Activos
          <span class="tab-btn__contador">{{ contadorActivos }}</span>
        </button>
        <button
          class="tab-btn"
          :class="{ 'tab-btn--activo': filtroEstado === 'entregados' }"
          @click="filtroEstado = 'entregados'"
        >
          📦 Entregados
        </button>
      </div>

      <div class="admin__filtros">
        <button
          v-for="s in sucursales"
          :key="s.id"
          class="filtro-btn"
          :class="{ 'filtro-btn--activo': filtroActivo === s.id }"
          @click="filtroActivo = s.id"
        >
          {{ s.nombre }}
        </button>

        <!-- Botón para vaciar entregados y cancelados actuales -->
        <button class="filtro-btn btn-limpiar" @click="borrarHistorialCompleto">
          🗑️ Limpiar Historial
        </button>
      </div>
    </div>

    <!-- Vista si no hay pedidos -->
    <div v-if="pedidosFiltrados.length === 0" class="admin__vacio">
      <span>🌮</span>
      <p>No hay pedidos nuevos</p>
    </div>

    <!-- Grid de tarjetas de pedidos -->
    <div class="admin__grid">
      <div
        v-for="pedido in pedidosFiltrados"
        :key="pedido.id"
        class="pedido"
        :class="`pedido--${pedido.estado}`"
      >
        <div class="pedido__header">
          <span class="pedido__estado-badge">
            {{ pedido.estado === 'nuevo' ? '🆕 Nuevo' : 
               pedido.estado === 'listo' ? '✅ Listo' : 
               pedido.estado === 'entregado' ? '📦 Entregado' : 
               '❌ Cancelado' }}
          </span>
          <span class="pedido__tiempo">{{ formatTiempo(pedido.fecha) }}</span>
        </div>

        <div class="pedido__info">
          <p class="pedido__cliente">👤 {{ pedido.cliente }}</p>
          <p class="pedido__sucursal">📍 {{ pedido.sucursal }}</p>
          <p v-if="pedido.comentario" class="pedido__comentario">
            💬 {{ pedido.comentario }}
          </p>
        </div>

        <div class="pedido__productos">
          <div
            v-for="(prod, i) in pedido.productos"
            :key="i"
            class="pedido__producto"
          >
            <span>{{ prod.cantidad }}x {{ prod.nombre }}{{ prod.opcion ? ` (${prod.opcion})` : '' }}</span>
            <span>Q{{ prod.subtotal }}</span>
          </div>
        </div>

        <div class="pedido__footer">
          <span class="pedido__total">Total: Q{{ pedido.total }}</span>
          <div class="pedido__acciones">
            <button
              v-if="pedido.estado === 'nuevo'"
              class="accion-btn accion-btn--listo"
              @click="cambiarEstado(pedido.id, 'listo')"
            >
              ✅ Listo
            </button>
            <button
              v-if="pedido.estado === 'listo'"
              class="accion-btn accion-btn--entregar"
              @click="cambiarEstado(pedido.id, 'entregado')"
            >
              📦 Entregar
            </button>
            <button
              v-if="pedido.estado !== 'cancelado' && pedido.estado !== 'entregado'"
              class="accion-btn accion-btn--cancelar"
              @click="cambiarEstado(pedido.id, 'cancelado')"
            >
              ❌ Cancelar
            </button> 
          </div>
        </div>  
      </div>
    </div>

    <!-- Modal Flotante (Canvas) de Alerta de Nuevo Pedido -->
    <Transition name="modal">
      <div v-if="hayPedidoNuevo" class="modal-overlay">
        <div class="modal-card">
          <div class="modal-icon">🔔</div>
          <h2>¡Nuevo Pedido Entrante!</h2>
          
          <div v-if="ultimoPedido" class="modal-detalle">
            <p><strong>Cliente:</strong> {{ ultimoPedido.cliente }}</p>
            <p><strong>Sucursal:</strong> {{ ultimoPedido.sucursal }}</p>
            <p class="modal-total">Total: Q{{ ultimoPedido.total }}</p>
          </div>

          <button class="modal-btn" @click="cerrarAlerta">
            Aceptar y Revisar
          </button>
        </div>
      </div>
    </Transition>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { signOut } from 'firebase/auth'
import { db, auth } from '../../firebase.js' // 👈 Se importa auth junto a db
import {
  collection, onSnapshot, doc, updateDoc, orderBy, query, writeBatch, getDocs, where
} from 'firebase/firestore'

// ── Enrutador para redirección ──
const router = useRouter()

// ── Variables ──
const pedidos = ref([])
const filtroActivo = ref('todos')
const filtroEstado = ref('activos')
const pedidosAnteriores = ref(new Set())
const primeraCarga = ref(true)
const hayPedidoNuevo = ref(false)
const ultimoPedido = ref(null)
let unsubscribe = null
let intervaloPestana = null

// ── Sucursales ──
const sucursales = [
  { id: 'todos',         nombre: 'Todos' },
  { id: 'jicaro',       nombre: 'El Jícaro' },
  { id: 'yupiltepeque', nombre: 'Yupiltepeque' },
  { id: 'atescatempa',  nombre: 'Atescatempa' },
]

// ── Computeds ──
const contadorActivos = computed(() =>
  pedidos.value.filter(p => p.estado === 'nuevo' || p.estado === 'listo').length
)

const pedidosFiltrados = computed(() => {
  let resultado = pedidos.value
  if (filtroEstado.value === 'activos') {
    resultado = resultado.filter(p => p.estado !== 'entregado')
  } else if (filtroEstado.value === 'entregados') {
    resultado = resultado.filter(p => p.estado === 'entregado')
  }
  if (filtroActivo.value !== 'todos') {
    resultado = resultado.filter(p => p.sucursalId === filtroActivo.value)
  }
  return resultado
})

// ── Sonido ──
function reproducirSonido() {
  const ctx = new AudioContext()
  const oscillator = ctx.createOscillator()
  const gainNode = ctx.createGain()
  oscillator.connect(gainNode)
  gainNode.connect(ctx.destination)
  oscillator.frequency.setValueAtTime(800, ctx.currentTime)
  oscillator.frequency.setValueAtTime(600, ctx.currentTime + 0.1)
  oscillator.frequency.setValueAtTime(800, ctx.currentTime + 0.2)
  gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4)
  oscillator.start(ctx.currentTime)
  oscillator.stop(ctx.currentTime + 0.4)
}

// ── Alerta visual ──
function mostrarAlerta(pedido) {
  ultimoPedido.value = pedido
  hayPedidoNuevo.value = true

  let alterno = false
  clearInterval(intervaloPestana)
  intervaloPestana = setInterval(() => {
    document.title = alterno
      ? `(${contadorActivos.value}) Panel Sabor Caribeño`
      : '🔴 NUEVO PEDIDO!'
    alterno = !alterno
  }, 800)
}

function cerrarAlerta() {
  hayPedidoNuevo.value = false
  clearInterval(intervaloPestana)
  document.title = `(${contadorActivos.value}) Panel Sabor Caribeño`
}

// ── LIMPIEZA INMEDIATA ──
async function borrarHistorialCompleto() {
  const confirmar = confirm('¿Quieres eliminar permanentemente todos los pedidos entregados y cancelados?')
  if (!confirmar) return

  try {
    const q = query(
      collection(db, 'pedidos'),
      where('estado', 'in', ['entregado', 'cancelado'])
    )
    const snapshot = await getDocs(q)
    const batch = writeBatch(db)

    snapshot.docs.forEach(docSnap => {
      batch.delete(docSnap.ref)
    })

    await batch.commit()
    alert('¡Historial limpiado con éxito!')
  } catch (error) {
    console.error('Error al borrar el historial:', error)
  }
}

// ── AUTO-ELIMINACIÓN (> 24 horas) ──
async function depurarPedidosAntiguos(snapshotDocs) {
  const limite24Horas = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const batch = writeBatch(db)
  let hayParaBorrar = false

  snapshotDocs.forEach(docSnap => {
    const p = docSnap.data()
    if (p.fecha) {
      const fechaPedido = p.fecha.toDate()
      if (fechaPedido < limite24Horas && (p.estado === 'entregado' || p.estado === 'cancelado')) {
        batch.delete(docSnap.ref)
        hayParaBorrar = true
      }
    }
  })

  if (hayParaBorrar) {
    await batch.commit()
  }
}

// ── Firebase en tiempo real ──
onMounted(() => {
  const q = query(collection(db, 'pedidos'), orderBy('fecha', 'desc'))

  unsubscribe = onSnapshot(q, (snapshot) => {
    depurarPedidosAntiguos(snapshot.docs)

    const pedidosNuevos = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    if (!primeraCarga.value) {
      pedidosNuevos.forEach(p => {
        if (!pedidosAnteriores.value.has(p.id) && p.estado === 'nuevo') {
          reproducirSonido()
          mostrarAlerta(p)
        }
      })
    }

    pedidosAnteriores.value = new Set(pedidosNuevos.map(p => p.id))
    pedidos.value = pedidosNuevos
    primeraCarga.value = false
  })
})

// ── Limpieza ──
onUnmounted(() => {
  if (unsubscribe) unsubscribe()
  clearInterval(intervaloPestana)
})

// ── Cambiar estado ──
async function cambiarEstado(id, nuevoEstado) {
  await updateDoc(doc(db, 'pedidos', id), { estado: nuevoEstado })
}

// ── Formato tiempo ──
function formatTiempo(fecha) {
  if (!fecha) return 'ahora'
  const ahora = new Date()
  const pedidoFecha = fecha.toDate()
  const diff = Math.floor((ahora - pedidoFecha) / 1000 / 60)
  if (diff < 1) return 'hace un momento'
  if (diff === 1) return 'hace 1 min'
  if (diff < 60) return `hace ${diff} min`
  return `hace ${Math.floor(diff / 60)}h`
}

// ── Cierre de sesión ──
async function cerrarSesion() {
  try {
    await signOut(auth)
    router.push('/login')
  } catch (error) {
    console.error('Error al cerrar sesión:', error)
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Nunito:wght@400;600;700&display=swap');

.admin {
  min-height: 100vh;
  background: #fcf9f9;
  font-family: 'Nunito', sans-serif;
  padding: 24px;
}

.admin__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32px;
  flex-wrap: wrap;
  gap: 16px;
}

.admin__logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.admin__logo h1 {
  font-family: 'Playfair Display', serif;
  font-size: 24px;
  color: rgb(0, 0, 0);
  margin: 0;
}

.admin__dot {
  width: 12px;
  height: 12px;
  background: #25d366;
  border-radius: 50%;
  animation: pulso 2s infinite;
}

/* ── Botón Cerrar Sesión Estilizado ── */
.btn-logout {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background-color: #ffffff;
  border: 1px solid #fee2e2;
  border-radius: 20px;
  color: #dc2626;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  margin-left: 12px;
}

.btn-logout:hover {
  background-color: #fef2f2;
  border-color: #fca5a5;
  transform: translateY(-1px);
}

.btn-logout:active {
  transform: translateY(0);
}

@keyframes pulso {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(1.3); }
}

.admin__filtros {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.filtro-btn {
  padding: 8px 16px;
  border-radius: 100px;
  border: 1px solid rgba(27, 22, 22, 0.2);
  background: transparent;
  color: rgba(0, 0, 0, 0.6);
  font-family: 'Nunito', sans-serif;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.filtro-btn:hover { border-color: #e8621a; color: #e8621a; }
.filtro-btn--activo { background: #e8621a; border-color: #e8621a; color: white; }

.admin__vacio {
  text-align: center;
  padding: 80px 0;
  color: rgba(0, 0, 0, 0.3);
}

.admin__vacio span { font-size: 64px; display: block; margin-bottom: 16px; }
.admin__vacio p { font-size: 18px; }

.admin__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

.pedido {
  background: #1a1a1a;
  border-radius: 16px;
  padding: 20px;
  border: 1px solid rgba(255,255,255,0.08);
  transition: border-color 0.2s;
}

.pedido--nuevo { border-left: 4px solid #e8621a; }
.pedido--listo { border-left: 4px solid #25d366; opacity: 1; }
.pedido--cancelado { border-left: 4px solid #666; opacity: 0.4; }
.pedido--entregado { border-left: 4px solid #f5a623; opacity: 1; }

.pedido__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.pedido__estado-badge {
  font-size: 20px;
  font-weight: 700;
  color: white;
}

.pedido__tiempo {
  font-size: 25px;
  color: rgba(255,255,255,0.4);
}

.pedido__info { margin-bottom: 12px; }

.pedido__cliente {
  font-size: 26px;
  font-weight: 700;
  color: white;
  margin: 0 0 4px;
}

.pedido__sucursal {
  font-size: 25px;
  color: #e8621a;
  margin: 0 0 4px;
}

.pedido__comentario {
  font-size: 13px;
  color: rgba(255,255,255,0.5);
  margin: 4px 0 0;
  font-style: italic;
}

.pedido__productos {
  border-top: 1px solid rgba(255,255,255,0.08);
  border-bottom: 1px solid rgba(255,255,255,0.08);
  padding: 12px 0;
  margin-bottom: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.pedido__producto {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: rgba(255,255,255,0.8);
}

.pedido__footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pedido__total {
  font-family: 'Playfair Display', serif;
  font-size: 20px;
  color: #f5a623;
  font-weight: 700;
}

.pedido__acciones {
  display: flex;
  gap: 8px;
}

.accion-btn {
  padding: 8px 16px;
  border-radius: 8px;
  border: none;
  font-family: 'Nunito', sans-serif;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.accion-btn--listo {
  background: #25d366;
  color: white;
}
.accion-btn--listo:hover { background: #1fb855; }

.accion-btn--entregar {
  background: #f5a623;
  color: white;
}
.accion-btn--entregar:hover {
  background: #e8900a;
  transform: translateY(-1px);
}

.accion-btn--cancelar {
  background: rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.6);
}
.accion-btn--cancelar:hover { background: #cc0000; color: white; }

/* ── Tabs de estado ── */
.admin__tabs {
  display: flex;
  gap: 8px;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 10px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  background: transparent;
  color: rgb(17, 17, 17);
  font-family: 'Nunito', sans-serif;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn:hover {
  border-color: #e8621a;
  color: #e8621a;
}

.tab-btn--activo {
  background: #e8621a;
  border-color: #e8621a;
  color: white;
}

.tab-btn__contador {
  background: white;
  color: #e8621a;
  font-size: 22px;
  font-weight: 800;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-limpiar {
  border-color: rgba(204, 0, 0, 0.4);
  color: #cc0000;
}

.btn-limpiar:hover {
  background: #cc0000;
  border-color: #cc0000;
  color: white;
}

@media (max-width: 767px) {
  .admin { padding: 16px; }
  .admin__header { flex-direction: column; align-items: flex-start; }
  .admin__grid { grid-template-columns: 1fr; }
}

/* ── Modal Overlay ── */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.modal-card {
  background: #1a1a1a;
  border: 2px solid #e8621a;
  border-radius: 20px;
  padding: 32px;
  width: 90%;
  max-width: 400px;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes popIn {
  0% { transform: scale(0.8); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

.modal-icon {
  font-size: 48px;
  margin-bottom: 8px;
  animation: campana 0.8s infinite alternate;
}

@keyframes campana {
  0% { transform: rotate(-10deg); }
  100% { transform: rotate(10deg); }
}

.modal-card h2 {
  color: #ffffff;
  font-family: 'Playfair Display', serif;
  font-size: 22px;
  margin: 0 0 16px;
}

.modal-detalle {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
  text-align: left;
}

.modal-detalle p {
  color: #e0e0e0;
  margin: 6px 0;
  font-size: 25px;
}

.modal-total {
  color: #f5a623 !important;
  font-weight: bold;
  font-size: 28px !important;
  margin-top: 10px !important;
}

.modal-btn {
  width: 100%;
  padding: 14px;
  background: #e8621a;
  color: white;
  border: none;
  border-radius: 12px;
  font-family: 'Nunito', sans-serif;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.modal-btn:hover {
  background: #d4530f;
  transform: translateY(-2px);
}

/* Transición Vue del Modal */
.modal-enter-active, .modal-leave-active {
  transition: opacity 0.3s ease;
}
.modal-enter-from, .modal-leave-to {
  opacity: 0;
}
</style>

