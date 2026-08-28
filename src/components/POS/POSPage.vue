<template>
  <div class="pos">

    <!-- ── NAVBAR SUPERIOR FIJO ── -->
    <header class="navbar">
      <button class="navbar__menu" @click="menuAbierto = true">
        <span></span><span></span><span></span>
      </button>

      <nav class="navbar__tabs">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="nav-tab"
          :class="{ 'nav-tab--activo': tabActivo === tab.id }"
          @click="tabActivo = tab.id"
        >
          {{ tab.label }}
          <span v-if="tab.contador > 0" class="nav-tab__badge">{{ tab.contador }}</span>
        </button>
      </nav>

      <div class="navbar__user">
        <span class="navbar__dot"></span>
        <span>En vivo</span>
      </div>
    </header>

    <!-- ── MENÚ LATERAL ── -->
    <Transition name="drawer">
      <div v-if="menuAbierto" class="drawer-overlay" @click.self="menuAbierto = false">
        <aside class="drawer">
          <div class="drawer__header">
            <h2>Sabor Caribeño</h2>
            <button class="drawer__cerrar" @click="menuAbierto = false">✕</button>
          </div>

          <div class="drawer__seccion">
            <p class="drawer__titulo">Turno de hoy</p>
            <div class="turno-card">
              <div class="turno-fila">
                <span>💵 Efectivo</span><strong>Q{{ totalEfectivo }}</strong>
              </div>
              <div class="turno-fila">
                <span>💳 Tarjeta</span><strong>Q{{ totalTarjeta }}</strong>
              </div>
              <div class="turno-fila turno-fila--total">
                <span>Total vendido</span><strong>Q{{ totalEfectivo + totalTarjeta }}</strong>
              </div>
              <div class="turno-fila">
                <span>🧾 Pedidos</span><strong>{{ pedidosHoy.length }}</strong>
              </div>
            </div>
          </div>

          <div class="drawer__acciones">
            <button class="drawer__btn drawer__btn--limpiar" @click="borrarHistorialCompleto">
              🗑️ Limpiar historial
            </button>
            <button class="drawer__btn drawer__btn--salir" @click="cerrarSesion">
              🔒 Cerrar sesión
            </button>
          </div>
        </aside>
      </div>
    </Transition>

    <!-- ── ÁREA PRINCIPAL ── -->
    <main class="contenido">

      <!-- ═══ VISTA POS ═══ -->
      <div v-if="tabActivo === 'pos'" class="pos-view">

        <section class="pos-grid-zona">
          <div class="pos-productos">
            <button
              v-for="p in productosFiltrados"
              :key="p.id"
              class="producto-btn"
              @click="seleccionarProducto(p)"
            >
              <span class="producto-btn__nombre">{{ p.nombre }}</span>
              <span class="producto-btn__precio">Q{{ p.precio }}</span>
            </button>
          </div>

          <div class="pos-categorias">
            <button
              v-for="c in categorias"
              :key="c"
              class="categoria-btn"
              :class="{ 'categoria-btn--activa': categoriaActiva === c }"
              @click="categoriaActiva = c"
            >
              {{ c }}
            </button>
          </div>
        </section>

        <aside class="pos-resumen">
          <!-- Banner de edición -->
          <div v-if="pedidoEditando" class="editando-banner">
            <div class="editando-banner__info">
              <span class="editando-banner__label">✏️ Editando</span>
              <strong>{{ pedidoEditando.cliente }}</strong>
              <span v-if="pedidoEditando.pagado" class="editando-banner__pagado">
                Ya pagó Q{{ pedidoEditando.montoPagado || pedidoEditando.total }}
              </span>
            </div>
            <button class="editando-banner__cancelar" @click="cancelarEdicion">✕</button>
          </div>

          <div class="resumen__header">
            <h2>{{ pedidoEditando ? 'Editar pedido' : 'Pedido' }}</h2>
            <button v-if="orden.length" class="resumen__limpiar" @click="orden = []">Limpiar</button>
          </div>

          <div class="resumen__lista">
            <p v-if="!orden.length" class="resumen__vacio">Toca un producto para agregarlo</p>
            <div v-for="item in orden" :key="item.key" class="resumen__item">
              <div class="resumen__item-info">
                <span class="resumen__item-nombre">{{ item.nombre }}</span>
                <span v-if="item.opcion" class="resumen__item-opcion">{{ item.opcion }}</span>
              </div>
              <div class="resumen__item-ctrl">
                <button @click="quitarItem(item.key)">−</button>
                <span>{{ item.cantidad }}</span>
                <button @click="sumarItem(item.key)">+</button>
              </div>
              <span class="resumen__item-precio">Q{{ item.precio * item.cantidad }}</span>
            </div>
          </div>

          <div class="resumen__total">
            <span>Total</span><strong>Q{{ totalOrden }}</strong>
          </div>

          <!-- Saldo pendiente si ya pagó -->
          <div v-if="pedidoEditando?.pagado && saldoPendiente > 0" class="resumen__saldo">
            <span>Saldo por cobrar</span><strong>Q{{ saldoPendiente }}</strong>
          </div>

          <div class="resumen__acciones">
            <button class="btn btn--guardar" :disabled="!orden.length" @click="pedirNombre('guardar')">
              {{ pedidoEditando ? 'Actualizar' : 'Guardar' }}
            </button>
            <button class="btn btn--comer" :disabled="!orden.length" @click="pedirNombre('local')">
              Comer acá
            </button>
            <button class="btn btn--cobrar" :disabled="!orden.length" @click="pedirNombre('cobrar')">
              {{ pedidoEditando?.pagado && saldoPendiente > 0 ? `Cobrar Q${saldoPendiente}` : 'Cobrar' }}
            </button>
          </div>
        </aside>
      </div>

      <!-- ═══ VISTA LISTAS ═══ -->
      <div v-else class="lista-view">
        <div v-if="pedidosVista.length === 0" class="lista-vacia">
          <span>🌮</span>
          <p>No hay pedidos aquí</p>
        </div>

        <div class="lista-grid">
          <div
            v-for="pedido in pedidosVista"
            :key="pedido.id"
            class="pedido"
            :class="[`pedido--${pedido.estado}`, { 'pedido--editable': esEditable(pedido) }]"
            @click="esEditable(pedido) && editarPedido(pedido)"
          >
            <div class="pedido__header">
              <span class="pedido__estado-badge">{{ etiquetaEstado(pedido.estado) }}</span>
              <span class="pedido__tiempo">{{ formatTiempo(pedido.fecha) }}</span>
            </div>

            <div class="pedido__info">
              <p class="pedido__cliente">
                👤 {{ pedido.cliente || 'Mostrador' }}
                <span class="pedido__origen">{{ pedido.origen === 'pos' ? '🏪 POS' : '🌐 Web' }}</span>
              </p>
              <p class="pedido__sucursal">
                📍 {{ pedido.sucursal || 'Mostrador' }}
                <span v-if="pedido.tipoOrden === 'local'"> · 🍽️ Comer acá</span>
              </p>
              <p v-if="pedido.comentario" class="pedido__comentario">💬 {{ pedido.comentario }}</p>
              <p v-if="pedido.pagado" class="pedido__pagado">
                ✅ Pagado · {{ pedido.metodoPago === 'efectivo' ? '💵 Efectivo' : '💳 Tarjeta' }}
              </p>
              <p v-else-if="pedido.estado !== 'cancelado'" class="pedido__pendiente">
                ⏳ Pendiente de pago
              </p>
            </div>

            <div class="pedido__productos">
              <div v-for="(prod, i) in pedido.productos" :key="i" class="pedido__producto">
                <span>{{ prod.cantidad }}x {{ prod.nombre }}{{ prod.opcion ? ` (${prod.opcion})` : '' }}</span>
                <span>Q{{ prod.subtotal }}</span>
              </div>
            </div>

            <div class="pedido__footer">
              <span class="pedido__total">Total: Q{{ pedido.total }}</span>
              <div class="pedido__acciones" @click.stop>
                <button
                  v-if="pedido.estado === 'nuevo' || pedido.estado === 'guardado'"
                  class="accion-btn accion-btn--listo"
                  @click="cambiarEstado(pedido.id, 'listo')"
                >
                  ✅ Listo
                </button>

                <button
                  v-if="pedido.estado === 'listo' && !pedido.pagado"
                  class="accion-btn accion-btn--cobrar"
                  @click="cobrarPedidoExistente(pedido)"
                >
                  💵 Cobrar
                </button>

                <button
                  v-if="pedido.estado === 'listo' && pedido.pagado"
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

            <p v-if="esEditable(pedido)" class="pedido__hint">Toca para editar</p>
          </div>
        </div>
      </div>

    </main>

    <!-- ── MODAL NOMBRE DEL PEDIDO ── -->
    <Transition name="modal">
      <div v-if="modalNombre" class="cobro-overlay" @click.self="modalNombre = false">
        <div class="nombre-modal">
          <h2>Nombre del pedido</h2>
          <p class="nombre-modal__sub">Para identificarlo fácilmente</p>

          <input
            ref="inputNombre"
            v-model="nombrePedido"
            class="nombre-modal__input"
            type="text"
            maxlength="30"
            @keyup.enter="confirmarNombre"
          />

          <div class="nombre-modal__rapidos">
            <button v-for="n in nombresRapidos" :key="n" class="rapido-btn" @click="nombrePedido = n">
              {{ n }}
            </button>
          </div>

          <div class="nombre-modal__acciones">
            <button class="nombre-modal__cancelar" @click="modalNombre = false">Cancelar</button>
            <button class="nombre-modal__ok" @click="confirmarNombre">Continuar</button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- ── MODAL SELECCIÓN DE OPCIÓN (carne) ── -->
    <Transition name="modal">
      <div v-if="productoConOpciones" class="cobro-overlay" @click.self="productoConOpciones = null">
        <div class="opciones-modal">
          <h2>{{ productoConOpciones.nombre }}</h2>
          <p class="opciones-modal__sub">Elige una opción</p>
          <div class="opciones-modal__lista">
            <button
              v-for="op in productoConOpciones.opciones"
              :key="op"
              class="opcion-btn"
              @click="confirmarOpcion(op)"
            >
              {{ op }}
            </button>
          </div>
          <button class="opciones-modal__cancelar" @click="productoConOpciones = null">Cancelar</button>
        </div>
      </div>
    </Transition>

    <!-- ── MODAL DE COBRO ── -->
    <Transition name="modal">
      <div v-if="cobroAbierto" class="cobro-overlay" @click.self="cerrarCobro">
        <div class="cobro">
          <div class="cobro__header">
            <h2>Cobrar</h2>
            <button class="cobro__cerrar" @click="cerrarCobro">✕</button>
          </div>

          <div class="cobro__monto">
            <span>Total a pagar</span>
            <strong>Q{{ montoACobrar }}</strong>
          </div>

          <div class="cobro__metodos">
            <button class="metodo-btn" :class="{ 'metodo-btn--activo': metodoPago === 'efectivo' }" @click="metodoPago = 'efectivo'">
              💵 Efectivo
            </button>
            <button class="metodo-btn" :class="{ 'metodo-btn--activo': metodoPago === 'tarjeta' }" @click="metodoPago = 'tarjeta'">
              💳 Tarjeta
            </button>
          </div>

          <div v-if="metodoPago === 'efectivo'" class="cobro__efectivo">
            <label class="cobro__label">Efectivo recibido</label>
            <input v-model.number="efectivoRecibido" type="number" class="cobro__input" placeholder="0" />
            <div class="cobro__sugerencias">
              <button v-for="s in sugerencias" :key="s" class="sug-btn" @click="efectivoRecibido = s">Q{{ s }}</button>
            </div>
            <div v-if="efectivoRecibido >= montoACobrar" class="cobro__cambio">
              <span>Cambio</span><strong>Q{{ efectivoRecibido - montoACobrar }}</strong>
            </div>
            <p v-else-if="efectivoRecibido > 0" class="cobro__falta">
              Faltan Q{{ montoACobrar - efectivoRecibido }}
            </p>
          </div>

          <button class="cobro__confirmar" :disabled="!puedeConfirmar" @click="confirmarCobro">
            Confirmar cobro
          </button>
        </div>
      </div>
    </Transition>

    <!-- ── MODAL ALERTA PEDIDO NUEVO WEB ── -->
    <Transition name="modal">
      <div v-if="hayPedidoNuevo" class="alerta-overlay">
        <div class="alerta-card">
          <div class="alerta-icon">🔔</div>
          <h2>¡Nuevo pedido entrante!</h2>
          <div v-if="ultimoPedido" class="alerta-detalle">
            <p><strong>Cliente:</strong> {{ ultimoPedido.cliente }}</p>
            <p><strong>Sucursal:</strong> {{ ultimoPedido.sucursal }}</p>
            <p class="alerta-total">Total: Q{{ ultimoPedido.total }}</p>
          </div>
          <button class="alerta-btn" @click="cerrarAlerta">Aceptar y revisar</button>
        </div>
      </div>
    </Transition>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { signOut } from 'firebase/auth'
import productosData from '../../assets/data/productos.json'
import { db, auth } from '../../firebase.js'
import {
  collection, addDoc, onSnapshot, doc, updateDoc, orderBy,
  query, serverTimestamp, writeBatch, getDocs, where
} from 'firebase/firestore'

const router = useRouter()

// ── Estado ──
const tabActivo = ref('pos')
const menuAbierto = ref(false)
const categoriaActiva = ref('Todo')
const orden = ref([])
const pedidos = ref([])
const productoConOpciones = ref(null)
let unsubscribe = null
let intervaloPestana = null

// ── Edición ──
const pedidoEditandoId = ref(null)

const pedidoEditando = computed(() => 
pedidoEditandoId.value ? 
pedidos.value.find(p => p.id === pedidoEditandoId.value) || null
: null
)

// ── Nombre del pedido ──
const modalNombre = ref(false)
const nombrePedido = ref('')
const accionPendiente = ref(null)
const inputNombre = ref(null)
const nombreParaCobro = ref('')
const nombresRapidos = ['Familia', 'Para llevar', 'Grupo', 'Pareja comer aca']

// ── Alerta ──
const hayPedidoNuevo = ref(false)
const ultimoPedido = ref(null)
const pedidosAnteriores = ref(new Set())
const primeraCarga = ref(true)

// ── Cobro ──
const cobroAbierto = ref(false)
const metodoPago = ref('efectivo')
const efectivoRecibido = ref(null)
const pedidoACobrar = ref(null)

// ── Categorías ──
const categorias = computed(() => {
  const cats = [...new Set(productosData.map(p => p.categoria))]
  return ['Todo', ...cats]
})

const productosFiltrados = computed(() =>
  categoriaActiva.value === 'Todo'
    ? productosData
    : productosData.filter(p => p.categoria === categoriaActiva.value)
)

// ── Tabs ──
const enProceso = ['nuevo', 'guardado', 'listo']

const contadorActivos = computed(() =>
  pedidos.value.filter(p => 
  (p.tipoOrden !== 'local' && enProceso.includes(p.estado)) || (p.tipoOrden === 'local' && ['nuevo', 'guardado'].includes(p.estado))
).length
  
)

const contadorLocal = computed(() =>
  pedidos.value.filter(p => enProceso.includes(p.estado) && p.tipoOrden === 'local').length
)

const tabs = computed(() => [
  { id: 'pos',        label: '🏪 POS',        contador: 0 },
  { id: 'activos',    label: '🔴 Activos',    contador: contadorActivos.value },
  { id: 'local',      label: '🍽️ Comer acá',  contador: contadorLocal.value },
  { id: 'entregados', label: '📦 Entregados', contador: 0 },
  { id: 'cancelados', label: '❌ Cancelados', contador: 0 },
])

const pedidosVista = computed(() => {
  if (tabActivo.value === 'activos')
    return pedidos.value.filter(p => (p.tipoOrden !== 'local' && enProceso.includes(p.estado)) ||
   (p.tipoOrden === 'local' && ['nuevo', 'guardado', ].includes(p.estado))
  )
  if (tabActivo.value === 'local')
    return pedidos.value.filter(p => enProceso.includes(p.estado) && p.tipoOrden === 'local')
  if (tabActivo.value === 'entregados')
    return pedidos.value.filter(p => p.estado === 'entregado')
  if (tabActivo.value === 'cancelados')
    return pedidos.value.filter(p => p.estado === 'cancelado')
  return []
})

// ── Orden actual ──
const totalOrden = computed(() =>
  orden.value.reduce((s, i) => s + i.precio * i.cantidad, 0)
)

const saldoPendiente = computed(() => {
  if (!pedidoEditando.value) return totalOrden.value
  const yaPagado = pedidoEditando.value.montoPagado || 0
  return Math.max(0, totalOrden.value - yaPagado)
})

// ── Productos ──
function seleccionarProducto(producto) {
  if (producto.opciones && producto.opciones.length > 1) {
    productoConOpciones.value = producto
  } else {
    const op = producto.opciones?.length === 1 ? producto.opciones[0] : null
    agregarProducto(producto, op)
  }
}

function confirmarOpcion(opcion) {
  agregarProducto(productoConOpciones.value, opcion)
  productoConOpciones.value = null
}

function agregarProducto(producto, opcion = null) {
  const key = opcion ? `${producto.id}-${opcion}` : `${producto.id}`
  const existe = orden.value.find(i => i.key === key)
  if (existe) existe.cantidad++
  else orden.value.push({ ...producto, key, opcion, cantidad: 1 })
}

function sumarItem(key) {
  const item = orden.value.find(i => i.key === key)
  if (item) item.cantidad++
}

function quitarItem(key) {
  const item = orden.value.find(i => i.key === key)
  if (!item) return
  if (item.cantidad > 1) item.cantidad--
  else orden.value = orden.value.filter(i => i.key !== key)
}

// ── Nombre del pedido ──
function nombrePorDefecto() {
  const n = pedidosHoy.value.length + 1
  return `Orden #${String(n).padStart(3, '0')}`
}

async function pedirNombre(accion) {
  accionPendiente.value = accion
  nombrePedido.value = pedidoEditando.value?.cliente || nombrePorDefecto()
  modalNombre.value = true
  await nextTick()
  inputNombre.value?.focus()
  inputNombre.value?.select()
}

function confirmarNombre() {
  modalNombre.value = false
  const nombre = nombrePedido.value.trim() || nombrePorDefecto()

  if (accionPendiente.value === 'guardar') {
    persistirPedido('guardado', 'llevar', nombre)
  } else if (accionPendiente.value === 'local') {
    persistirPedido('guardado', 'local', nombre)
  } else if (accionPendiente.value === 'cobrar') {
    abrirCobro(nombre)
  }
}

// ── Guardar / actualizar ──
async function persistirPedido(estado, tipoOrden, nombre, datosPago = null) {
  if (!orden.value.length) return

  const productos = orden.value.map(i => ({
    nombre: i.nombre,
    opcion: i.opcion || null,
    cantidad: i.cantidad,
    precio: i.precio,
    subtotal: i.precio * i.cantidad
  }))

  if (pedidoEditando.value) {
    // Actualizar pedido existente
    const yaPagado = pedidoEditando.value.montoPagado
      || (pedidoEditando.value.pagado ? pedidoEditando.value.total : 0)
    const nuevoPagado = datosPago ? yaPagado + (datosPago.monto || 0) : yaPagado

    await updateDoc(doc(db, 'pedidos', pedidoEditando.value.id), {
      cliente: nombre,
      tipoOrden: tipoOrden || pedidoEditando.value.tipoOrden,
      productos,
      total: totalOrden.value,
      montoPagado: nuevoPagado,
      pagado: nuevoPagado >= totalOrden.value,
      metodoPago: datosPago?.metodo || pedidoEditando.value.metodoPago || null,
      ...(datosPago ? { estado: 'nuevo' } : {})
    })
  } else {
    // Crear pedido nuevo
    await addDoc(collection(db, 'pedidos'), {
      cliente: nombre,
      origen: 'pos',
      sucursal: 'Mostrador',
      sucursalId: 'pos',
      tipoOrden,
      comentario: '',
      productos,
      total: totalOrden.value,
      estado,
      pagado: !!datosPago,
      montoPagado: datosPago ? totalOrden.value : 0,
      metodoPago: datosPago?.metodo || null,
      efectivoRecibido: datosPago?.recibido || null,
      cambio: datosPago?.cambio || null,
      fecha: serverTimestamp()
    })
  }

  orden.value = []
  pedidoEditandoId.value = null
}

// ── Editar ──
function esEditable(pedido) {
  return pedido.origen !== 'cancelado' && pedido.estado !== 'entregado'
}

function editarPedido(pedido) {
  pedidoEditandoId.value = pedido.id
  orden.value = pedido.productos.map((p, i) => {
    const original = productosData.find(x => x.nombre === p.nombre)
    const baseId = original?.id ?? `x${i}`
    return {
      id: baseId,
      nombre: p.nombre,
      precio: p.precio,
      opcion: p.opcion,
      cantidad: p.cantidad,
      key: p.opcion ? `${baseId}-${p.opcion}` : `${baseId}`
    }
  })
  tabActivo.value = 'pos'
}

function cancelarEdicion() {
  pedidoEditandoId.value = null
  orden.value = []
}

// ── Cobro ──
const montoACobrar = computed(() => {
  if (pedidoACobrar.value) {
  return pedidoACobrar.value.total - (pedidoACobrar.value.montoPagado || 0)
}
  if (pedidoEditando.value) return saldoPendiente.value
  return totalOrden.value
})

const sugerencias = computed(() => {
  const m = montoACobrar.value
  const redondeo = Math.ceil(m / 5) * 5
  const base = [20, 50, 100, 200]
  const set = new Set([m, redondeo, ...base.filter(v => v >= m)])
  return [...set].filter(v => v >= m).sort((a, b) => a - b).slice(0, 4)
})

const puedeConfirmar = computed(() =>
  metodoPago.value === 'tarjeta' || efectivoRecibido.value >= montoACobrar.value
)

function abrirCobro(nombre) {
  nombreParaCobro.value = nombre
  pedidoACobrar.value = null
  metodoPago.value = 'efectivo'
  efectivoRecibido.value = null
  cobroAbierto.value = true
}

function cobrarPedidoExistente(pedido) {
  pedidoACobrar.value = pedido
  metodoPago.value = 'efectivo'
  efectivoRecibido.value = null
  cobroAbierto.value = true
}

function cerrarCobro() {
  cobroAbierto.value = false
  pedidoACobrar.value = null
}

async function confirmarCobro() {
  const datosPago = {
    metodo: metodoPago.value,
    monto: montoACobrar.value,
    recibido: metodoPago.value === 'efectivo' ? efectivoRecibido.value : null,
    cambio: metodoPago.value === 'efectivo' ? efectivoRecibido.value - montoACobrar.value : null
  }

  if (pedidoACobrar.value) {
    await updateDoc(doc(db, 'pedidos', pedidoACobrar.value.id), {
      estado: 'entregado',
      pagado: true,
      montoPagado: pedidoACobrar.value.total,
      metodoPago: datosPago.metodo,
      efectivoRecibido: datosPago.recibido,
      cambio: datosPago.cambio
    })
  } else {
    await persistirPedido(
      'nuevo',
      pedidoEditando.value?.tipoOrden || 'llevar',
      nombreParaCobro.value,
      datosPago
    )
  }
  cerrarCobro()
}

// ── Estados ──
async function cambiarEstado(id, nuevoEstado) {
  await updateDoc(doc(db, 'pedidos', id), { estado: nuevoEstado })
}

// ── Turno ──
const pedidosHoy = computed(() => {
  const hoy = new Date().toDateString()
  return pedidos.value.filter(p =>
    p.fecha?.toDate && p.fecha.toDate().toDateString() === hoy && p.estado !== 'cancelado'
  )
})

const totalEfectivo = computed(() =>
  pedidosHoy.value.filter(p => p.pagado && p.metodoPago === 'efectivo')
    .reduce((s, p) => s + (p.montoPagado || p.total), 0)
)

const totalTarjeta = computed(() =>
  pedidosHoy.value.filter(p => p.pagado && p.metodoPago === 'tarjeta')
    .reduce((s, p) => s + (p.montoPagado || p.total), 0)
)

// ── Sonido y alerta ──
function reproducirSonido() {
  const ctx = new AudioContext()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.connect(gain); gain.connect(ctx.destination)
  osc.frequency.setValueAtTime(800, ctx.currentTime)
  osc.frequency.setValueAtTime(600, ctx.currentTime + 0.1)
  osc.frequency.setValueAtTime(800, ctx.currentTime + 0.2)
  gain.gain.setValueAtTime(0.3, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4)
  osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.4)
}

function mostrarAlerta(pedido) {
  ultimoPedido.value = pedido
  hayPedidoNuevo.value = true
  let alterno = false
  clearInterval(intervaloPestana)
  intervaloPestana = setInterval(() => {
    document.title = alterno ? `(${contadorActivos.value}) POS Sabor Caribeño` : '🔴 NUEVO PEDIDO!'
    alterno = !alterno
  }, 800)
}

function cerrarAlerta() {
  hayPedidoNuevo.value = false
  clearInterval(intervaloPestana)
  document.title = `(${contadorActivos.value}) POS Sabor Caribeño`
  tabActivo.value = 'activos'
}

// ── Limpieza de historial ──
async function borrarHistorialCompleto() {
  if (!confirm('¿Eliminar permanentemente todos los pedidos entregados y cancelados?')) return
  try {
    const q = query(collection(db, 'pedidos'), where('estado', 'in', ['entregado', 'cancelado']))
    const snap = await getDocs(q)
    const batch = writeBatch(db)
    snap.docs.forEach(d => batch.delete(d.ref))
    await batch.commit()
    menuAbierto.value = false
  } catch (e) {
    console.error('Error al borrar historial:', e)
  }
}

async function depurarAntiguos(docs) {
  const limite = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const batch = writeBatch(db)
  let hay = false
  docs.forEach(d => {
    const p = d.data()
    if (p.fecha?.toDate && p.fecha.toDate() < limite && ['entregado','cancelado'].includes(p.estado)) {
      batch.delete(d.ref); hay = true
    }
  })
  if (hay) await batch.commit()
}

// ── Helpers ──
function etiquetaEstado(e) {
  return {
    guardado:  '🔵 Guardado',
    nuevo:     '🆕 Nuevo',
    listo:     '✅ Listo',
    entregado: '📦 Entregado',
    cancelado: '❌ Cancelado'
  }[e] || e
}

function formatTiempo(fecha) {
  if (!fecha?.toDate) return 'ahora'
  const diff = Math.floor((new Date() - fecha.toDate()) / 60000)
  if (diff < 1) return 'hace un momento'
  if (diff === 1) return 'hace 1 min'
  if (diff < 60) return `hace ${diff} min`
  return `hace ${Math.floor(diff / 60)}h`
}

async function cerrarSesion() {
  try { await signOut(auth); router.push('/login') }
  catch (e) { console.error('Error al cerrar sesión:', e) }
}

// ── Firebase ──
onMounted(() => {
  const q = query(collection(db, 'pedidos'), orderBy('fecha', 'desc'))
  unsubscribe = onSnapshot(q, (snap) => {
    depurarAntiguos(snap.docs)
    const nuevos = snap.docs.map(d => ({ id: d.id, ...d.data() }))

    if (!primeraCarga.value) {
      nuevos.forEach(p => {
        if (!pedidosAnteriores.value.has(p.id) && p.estado === 'nuevo' && p.origen !== 'pos') {
          reproducirSonido()
          mostrarAlerta(p)
        }
      })
    }

    pedidosAnteriores.value = new Set(nuevos.map(p => p.id))
    pedidos.value = nuevos
    primeraCarga.value = false
  })
})

onUnmounted(() => {
  if (unsubscribe) unsubscribe()
  clearInterval(intervaloPestana)
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Nunito:wght@400;600;700;800&display=swap');

* { box-sizing: border-box; }

.pos {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f7f4f0;
  font-family: 'Nunito', sans-serif;
  overflow: hidden;
}

/* ── NAVBAR ── */
.navbar {
  display: flex; align-items: center; gap: 16px;
  background: #1a0e06; padding: 0 16px; height: 64px; flex-shrink: 0;
}

.navbar__menu {
  display: flex; flex-direction: column; justify-content: center; gap: 4px;
  width: 40px; height: 40px; background: transparent; border: none;
  cursor: pointer; padding: 8px;
}
.navbar__menu span { display: block; height: 2px; background: #f5a623; border-radius: 2px; }

.navbar__tabs { display: flex; gap: 6px; flex: 1; overflow-x: auto; }

.nav-tab {
  display: flex; align-items: center; gap: 8px; padding: 10px 18px;
  border-radius: 10px; border: none; background: transparent;
  color: rgba(255,255,255,0.55); font-family: 'Nunito', sans-serif;
  font-size: 15px; font-weight: 700; cursor: pointer; white-space: nowrap;
  transition: background 0.1s, color 0.1s;
}
.nav-tab:hover { color: #f5a623; }
.nav-tab--activo { background: #e8621a; color: white; }

.nav-tab__badge {
  background: white; color: #e8621a; font-size: 12px; font-weight: 800;
  min-width: 22px; height: 22px; border-radius: 11px;
  display: flex; align-items: center; justify-content: center; padding: 0 6px;
}

.navbar__user {
  display: flex; align-items: center; gap: 8px;
  color: rgba(255,255,255,0.5); font-size: 13px; font-weight: 700;
}
.navbar__dot {
  width: 8px; height: 8px; background: #25d366; border-radius: 50%;
  animation: pulso 2s infinite;
}
@keyframes pulso { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.3)} }

/* ── DRAWER ── */
.drawer-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1000; }

.drawer {
  width: 320px; max-width: 85vw; height: 100%; background: #1a0e06;
  padding: 24px; display: flex; flex-direction: column; gap: 24px;
}

.drawer__header { display: flex; align-items: center; justify-content: space-between; }
.drawer__header h2 { font-family: 'Playfair Display', serif; color: white; margin: 0; font-size: 22px; }
.drawer__cerrar {
  width: 32px; height: 32px; border-radius: 50%; border: none;
  background: rgba(255,255,255,0.1); color: white; cursor: pointer;
}

.drawer__titulo {
  font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase;
  color: #f5a623; font-weight: 700; margin: 0 0 12px;
}

.turno-card {
  background: rgba(255,255,255,0.05); border-radius: 14px; padding: 16px;
  display: flex; flex-direction: column; gap: 10px;
}
.turno-fila { display: flex; justify-content: space-between; font-size: 14px; color: rgba(255,255,255,0.7); }
.turno-fila strong { color: white; }
.turno-fila--total { border-top: 1px solid rgba(255,255,255,0.1); padding-top: 10px; margin-top: 4px; }
.turno-fila--total strong { color: #f5a623; font-size: 18px; }

.drawer__acciones { margin-top: auto; display: flex; flex-direction: column; gap: 10px; }

.drawer__btn {
  padding: 14px; border-radius: 12px; border: none;
  font-family: 'Nunito', sans-serif; font-size: 15px; font-weight: 700; cursor: pointer;
}
.drawer__btn--limpiar { background: rgba(255,255,255,0.08); color: #ff8a8a; }
.drawer__btn--limpiar:hover { background: #cc0000; color: white; }
.drawer__btn--salir { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.7); }
.drawer__btn--salir:hover { background: rgba(255,255,255,0.15); color: white; }

/* ── CONTENIDO ── */
.contenido { flex: 1; overflow: hidden; padding: 16px; }

/* ── VISTA POS ── */
.pos-view { height: 100%; display: grid; grid-template-columns: 1fr 380px; gap: 16px; }
.pos-grid-zona { display: flex; flex-direction: column; gap: 12px; min-height: 0; }

.pos-productos {
  flex: 1; display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  grid-auto-rows: min-content; gap: 12px; overflow-y: auto; align-content: start;
}

.producto-btn {
  display: flex; flex-direction: column; justify-content: space-between; gap: 10px;
  min-height: 140px; padding: 20px; border-radius: 14px; border: 1px solid #e8ddd0;
  background: white; cursor: pointer; text-align: left;
  transition: border-color 0.1s, transform 0.08s;
  font-family: 'Nunito', sans-serif;
}
.producto-btn:hover { border-color: #e8621a; }
.producto-btn:active { transform: scale(0.97); }
.producto-btn__nombre { font-size: 25px; font-weight: 700; color: #2c1a0e; line-height: 1.25; }
.producto-btn__precio { font-family: 'Playfair Display', serif; font-size: 22px; font-weight: 700; color: #e8621a; }

.pos-categorias { display: flex; gap: 8px; overflow-x: auto; padding-top: 4px; flex-shrink: 0; }

.categoria-btn {
  padding: 14px 24px; border-radius: 100px; border: 2px solid #e8ddd0;
  background: white; color: #8c6a52; font-family: 'Nunito', sans-serif;
  font-size: 15px; font-weight: 700; cursor: pointer; white-space: nowrap;
  transition: background 0.1s, border-color 0.1s, color 0.1s;
}
.categoria-btn--activa { background: #e8621a; border-color: #e8621a; color: white; }

/* ── RESUMEN ── */
.pos-resumen {
  background: white; border-radius: 18px; border: 1px solid #e8ddd0;
  display: flex; flex-direction: column; overflow: hidden;
}

.editando-banner {
  background: #3a9bd5; color: white; padding: 12px 16px;
  display: flex; align-items: center; justify-content: space-between; gap: 10px;
}
.editando-banner__info { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.editando-banner__label { font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; opacity: 0.85; }
.editando-banner__info strong { font-size: 18px; }
.editando-banner__pagado { font-size: 13px; opacity: 0.9; }
.editando-banner__cancelar {
  width: 30px; height: 30px; border-radius: 50%; border: none;
  background: rgba(255,255,255,0.25); color: white; cursor: pointer; flex-shrink: 0;
}

.resumen__header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 18px; border-bottom: 1px solid #f0e6d8;
}
.resumen__header h2 { font-family: 'Playfair Display', serif; font-size: 20px; margin: 0; color: #2c1a0e; }
.resumen__limpiar {
  background: none; border: none; color: #cc0000; font-size: 13px;
  font-weight: 700; cursor: pointer; font-family: 'Nunito', sans-serif;
}
.resumen__lista {
  flex: 1; overflow-y: auto; padding: 12px 18px;
  display: flex; flex-direction: column; gap: 12px;
}
.resumen__vacio { color: #b09880; font-size: 30px; text-align: center; padding: 32px 0; }
.resumen__item { display: grid; grid-template-columns: 1fr auto auto; align-items: center; gap: 10px; }
.resumen__item-info { display: flex; flex-direction: column; min-width: 0; }
.resumen__item-nombre { font-size: 25px; font-weight: 700; color: #2c1a0e; line-height: 1.25; }
.resumen__item-opcion { font-size: 30px; color: #e8621a; font-weight: 700; }
.resumen__item-ctrl { display: flex; align-items: center; gap: 8px; }
.resumen__item-ctrl button {
  width: 35px; height: 35px; border-radius: 50%; border: 2px solid #e8621a;
  background: white; color: #e8621a; font-size: 27px; font-weight: 700;
  cursor: pointer; line-height: 1;
}
.resumen__item-ctrl span { font-weight: 800; min-width: 18px; text-align: center; font-size: 30px }
.resumen__item-precio { font-weight: 800; color: #e8621a; font-size: 40px; min-width: 48px; text-align: right; }

.resumen__total {
  display: flex; justify-content: space-between; align-items: center;
  padding: 16px 18px; background: #1a0e06; color: white; font-weight: 700;
}
.resumen__total strong { font-family: 'Playfair Display', serif; font-size: 28px; color: #f5a623; }

.resumen__saldo {
  display: flex; justify-content: space-between; align-items: center;
  padding: 12px 18px; background: #fff5e8; color: #8a5a00; font-weight: 700;
  border-top: 1px solid #f0d9a0;
}
.resumen__saldo strong { font-family: 'Playfair Display', serif; font-size: 24px; color: #e8621a; }

.resumen__acciones { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; padding: 12px; }

.btn {
  padding: 18px 12px; border-radius: 12px; border: none;
  font-family: 'Nunito', sans-serif; font-size: 16px; font-weight: 700;
  cursor: pointer; transition: background 0.1s;
}
.btn:disabled { opacity: 0.35; cursor: not-allowed; }
.btn--guardar { background: #f0e6d8; color: #6b3a1f; }
.btn--guardar:hover:not(:disabled) { background: #e4d5c0; }
.btn--comer { background: #3d7a34; color: white; }
.btn--comer:hover:not(:disabled) { background: #2d5a27; }
.btn--cobrar { grid-column: 1 / -1; background: #e8621a; color: white; font-size: 18px; padding: 20px; }
.btn--cobrar:hover:not(:disabled) { background: #c04e10; }

/* ── VISTA LISTAS ── */
.lista-view { height: 100%; overflow-y: auto; }
.lista-vacia { text-align: center; padding: 80px 0; color: #b09880; }
.lista-vacia span { font-size: 64px; display: block; margin-bottom: 16px; }
.lista-vacia p { font-size: 18px; }

.lista-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 16px; }

/* ── TICKET ── */
.pedido {
  background: #1a1a1a; border-radius: 16px; padding: 20px;
  border: 1px solid rgba(255,255,255,0.08); position: relative;
}
.pedido--editable { cursor: pointer; transition: border-color 0.1s; }
.pedido--editable:hover { border-color: #3a9bd5; }
.pedido--nuevo     { border-left: 4px solid #e8621a; }
.pedido--guardado  { border-left: 4px solid #3a9bd5; }
.pedido--listo     { border-left: 4px solid #25d366; }
.pedido--entregado { border-left: 4px solid #f5a623; }
.pedido--cancelado { border-left: 4px solid #666; opacity: 0.4; }

.pedido__header {
  display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;
}
.pedido__estado-badge { font-size: 17px; font-weight: 700; color: white; }
.pedido__tiempo { font-size: 14px; color: rgba(255,255,255,0.4); }

.pedido__info { margin-bottom: 12px; }
.pedido__cliente {
  font-size: 22px; font-weight: 700; color: white; margin: 0 0 4px;
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
}
.pedido__origen {
  font-size: 12px; background: rgba(255,255,255,0.1);
  padding: 3px 10px; border-radius: 100px; color: rgba(255,255,255,0.6);
}
.pedido__sucursal { font-size: 17px; color: #e8621a; margin: 0 0 4px; }
.pedido__comentario { font-size: 14px; color: rgba(255,255,255,0.5); margin: 6px 0 0; font-style: italic; }
.pedido__pagado { font-size: 13px; color: #25d366; margin: 6px 0 0; font-weight: 700; }
.pedido__pendiente { font-size: 13px; color: #f5a623; margin: 6px 0 0; font-weight: 700; }

.pedido__productos {
  border-top: 1px solid rgba(255,255,255,0.08);
  border-bottom: 1px solid rgba(255,255,255,0.08);
  padding: 12px 0; margin-bottom: 12px;
  display: flex; flex-direction: column; gap: 8px;
}
.pedido__producto {
  display: flex; justify-content: space-between;
  font-size: 16px; color: rgba(255,255,255,0.85);
}

.pedido__footer {
  display: flex; justify-content: space-between; align-items: center;
  gap: 10px; flex-wrap: wrap;
}
.pedido__total { font-family: 'Playfair Display', serif; font-size: 22px; color: #f5a623; font-weight: 700; }
.pedido__acciones { display: flex; gap: 8px; flex-wrap: wrap; }

.pedido__hint {
  font-size: 11px; color: rgba(255,255,255,0.25); margin: 10px 0 0;
  text-align: center; letter-spacing: 0.05em;
}

.accion-btn {
  padding: 10px 18px; border-radius: 8px; border: none;
  font-family: 'Nunito', sans-serif; font-size: 14px; font-weight: 700;
  cursor: pointer; transition: background 0.1s;
}
.accion-btn--listo    { background: #25d366; color: white; }
.accion-btn--listo:hover { background: #1fb855; }
.accion-btn--cobrar   { background: #e8621a; color: white; }
.accion-btn--cobrar:hover { background: #c04e10; }
.accion-btn--entregar { background: #f5a623; color: white; }
.accion-btn--entregar:hover { background: #e8900a; }
.accion-btn--cancelar { background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.6); }
.accion-btn--cancelar:hover { background: #cc0000; color: white; }

/* ── MODAL NOMBRE ── */
.nombre-modal {
  background: white; border-radius: 22px; padding: 28px;
  width: 100%; max-width: 440px;
}
.nombre-modal h2 { font-family: 'Playfair Display', serif; font-size: 24px; margin: 0 0 4px; color: #2c1a0e; }
.nombre-modal__sub { color: #8c6a52; font-size: 14px; margin: 0 0 20px; }
.nombre-modal__input {
  width: 100%; padding: 18px; border: 2px solid #e8ddd0; border-radius: 12px;
  font-family: 'Nunito', sans-serif; font-size: 22px; font-weight: 700;
  color: #2c1a0e; outline: none; margin-bottom: 14px;
}
.nombre-modal__input:focus { border-color: #e8621a; }
.nombre-modal__rapidos { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-bottom: 20px; }
.rapido-btn {
  padding: 14px; border-radius: 10px; border: 2px solid #e8ddd0; background: white;
  font-family: 'Nunito', sans-serif; font-size: 15px; font-weight: 700;
  color: #6b3a1f; cursor: pointer; transition: border-color 0.1s, color 0.1s;
}
.rapido-btn:hover { border-color: #e8621a; color: #e8621a; }
.nombre-modal__acciones { display: grid; grid-template-columns: 1fr 2fr; gap: 10px; }
.nombre-modal__cancelar {
  padding: 16px; border-radius: 12px; border: 2px solid #e8ddd0; background: white;
  font-family: 'Nunito', sans-serif; font-size: 15px; font-weight: 700; color: #8c6a52; cursor: pointer;
}
.nombre-modal__ok {
  padding: 16px; border-radius: 12px; border: none; background: #e8621a; color: white;
  font-family: 'Nunito', sans-serif; font-size: 17px; font-weight: 800; cursor: pointer;
}
.nombre-modal__ok:hover { background: #c04e10; }

/* ── MODAL OPCIONES ── */
.opciones-modal {
  background: white; border-radius: 22px; padding: 28px;
  width: 100%; max-width: 420px; text-align: center;
}
.opciones-modal h2 {
  font-family: 'Playfair Display', serif; font-size: 24px;
  margin: 0 0 4px; color: #2c1a0e;
}
.opciones-modal__sub { color: #8c6a52; font-size: 14px; margin: 0 0 20px; }
.opciones-modal__lista { display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px; }
.opcion-btn {
  padding: 18px; border-radius: 12px; border: 2px solid #e8ddd0;
  background: white; font-family: 'Nunito', sans-serif; font-size: 19px;
  font-weight: 700; color: #2c1a0e; cursor: pointer;
  transition: background 0.1s, border-color 0.1s, color 0.1s;
}
.opcion-btn:hover { border-color: #e8621a; background: #fff5f0; color: #e8621a; }
.opciones-modal__cancelar {
  background: none; border: none; color: #8c6a52;
  font-family: 'Nunito', sans-serif; font-size: 14px; cursor: pointer;
}

/* ── COBRO ── */
.cobro-overlay {
  position: fixed; inset: 0; background: rgba(26,14,6,0.6);
  display: flex; align-items: center; justify-content: center; z-index: 1100; padding: 20px;
}
.cobro {
  background: white; border-radius: 22px; width: 100%; max-width: 440px;
  padding: 24px; display: flex; flex-direction: column; gap: 18px;
  max-height: 92vh; overflow-y: auto;
}
.cobro__header { display: flex; justify-content: space-between; align-items: center; }
.cobro__header h2 { font-family: 'Playfair Display', serif; font-size: 24px; margin: 0; color: #2c1a0e; }
.cobro__cerrar {
  width: 34px; height: 34px; border-radius: 50%; border: none;
  background: #f0e6d8; cursor: pointer; color: #6b3a1f;
}
.cobro__monto {
  background: #1a0e06; border-radius: 14px; padding: 18px;
  display: flex; justify-content: space-between; align-items: center;
  color: rgba(255,255,255,0.6); font-weight: 700;
}
.cobro__monto strong { font-family: 'Playfair Display', serif; font-size: 34px; color: #f5a623; }
.cobro__metodos { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.metodo-btn {
  padding: 18px; border-radius: 12px; border: 2px solid #e8ddd0; background: white;
  font-family: 'Nunito', sans-serif; font-size: 16px; font-weight: 700;
  color: #6b3a1f; cursor: pointer;
  transition: background 0.1s, border-color 0.1s, color 0.1s;
}
.metodo-btn--activo { border-color: #e8621a; background: #fff5f0; color: #e8621a; }
.cobro__efectivo { display: flex; flex-direction: column; gap: 12px; }
.cobro__label {
  font-size: 12px; font-weight: 700; letter-spacing: 0.08em;
  text-transform: uppercase; color: #8c6a52;
}
.cobro__input {
  padding: 16px; border: 2px solid #e8ddd0; border-radius: 12px;
  font-family: 'Playfair Display', serif; font-size: 30px; font-weight: 700;
  color: #2c1a0e; outline: none; text-align: center;
}
.cobro__input:focus { border-color: #e8621a; }
.cobro__sugerencias { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.sug-btn {
  padding: 14px 4px; border-radius: 10px; border: 2px solid #e8ddd0; background: white;
  font-family: 'Nunito', sans-serif; font-size: 15px; font-weight: 700;
  color: #6b3a1f; cursor: pointer; transition: border-color 0.1s, color 0.1s;
}
.sug-btn:hover { border-color: #e8621a; color: #e8621a; }
.cobro__cambio {
  display: flex; justify-content: space-between; align-items: center;
  background: #eaf9ee; border: 1px solid #b7e8c4; border-radius: 12px;
  padding: 14px 18px; font-weight: 700; color: #1a6b32;
}
.cobro__cambio strong { font-family: 'Playfair Display', serif; font-size: 30px; }
.cobro__falta {
  background: #fff0f0; border: 1px solid #ffcccc; color: #cc0000;
  border-radius: 12px; padding: 12px 16px; font-size: 14px;
  font-weight: 700; margin: 0; text-align: center;
}
.cobro__confirmar {
  padding: 20px; border-radius: 14px; border: none; background: #25d366;
  color: white; font-family: 'Nunito', sans-serif; font-size: 18px;
  font-weight: 800; cursor: pointer; transition: background 0.1s;
}
.cobro__confirmar:disabled { opacity: 0.35; cursor: not-allowed; }
.cobro__confirmar:hover:not(:disabled) { background: #1fb855; }

/* ── ALERTA PEDIDO NUEVO ── */
.alerta-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.65);
  display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 20px;
}
.alerta-card {
  background: #1a1a1a; border: 2px solid #e8621a; border-radius: 20px;
  padding: 32px; width: 100%; max-width: 420px; text-align: center;
  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
}
.alerta-icon { font-size: 52px; margin-bottom: 8px; animation: campana 0.8s infinite alternate; }
@keyframes campana { 0%{transform:rotate(-10deg)} 100%{transform:rotate(10deg)} }
.alerta-card h2 { color: white; font-family: 'Playfair Display', serif; font-size: 24px; margin: 0 0 16px; }
.alerta-detalle {
  background: rgba(255,255,255,0.05); border-radius: 12px;
  padding: 16px; margin-bottom: 20px; text-align: left;
}
.alerta-detalle p { color: #e0e0e0; margin: 8px 0; font-size: 17px; }
.alerta-total { color: #f5a623 !important; font-weight: 800; font-size: 26px !important; margin-top: 12px !important; }
.alerta-btn {
  width: 100%; padding: 16px; background: #e8621a; color: white; border: none;
  border-radius: 12px; font-family: 'Nunito', sans-serif; font-size: 17px;
  font-weight: 700; cursor: pointer; transition: background 0.1s;
}
.alerta-btn:hover { background: #c04e10; }

/* ── Transiciones (solo drawer) ── */
.drawer-enter-active, .drawer-leave-active { transition: opacity 0.2s; }
.drawer-enter-from, .drawer-leave-to { opacity: 0; }
.drawer-enter-active .drawer, .drawer-leave-active .drawer { transition: transform 0.25s cubic-bezier(0.32,0.72,0,1); }
.drawer-enter-from .drawer, .drawer-leave-to .drawer { transform: translateX(-100%); }

/* ── Responsive ── */
@media (max-width: 1023px) {
  .pos-view { grid-template-columns: 1fr; grid-template-rows: 1fr auto; }
  .pos-resumen { max-height: 44vh; }
  .pos-productos { grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); }
}

@media (max-width: 767px) {
  .navbar { height: 56px; padding: 0 8px; }
  .nav-tab { padding: 8px 12px; font-size: 13px; }
  .contenido { padding: 10px; }
  .lista-grid { grid-template-columns: 1fr; }
}
</style>