<template>
  <!-- Botón flotante -->
  <Transition name="bounce">
    <button
      v-if="carrito.totalItems > 0"
      class="carrito-fab"
      @click="carrito.abierto = true"
    >
      <span class="carrito-fab__icon">🛒</span>
      <span class="carrito-fab__badge">{{ carrito.totalItems }}</span>
      <span class="carrito-fab__label">Ver pedido · Q{{ carrito.totalPrecio }}</span>
    </button>
  </Transition>

  <!-- Overlay -->
  <Transition name="fade">
    <div
      v-if="carrito.abierto"
      class="overlay"
      @click="carrito.abierto = false"
    />
  </Transition>

  <!-- Bottom Sheet -->
  <Transition name="sheet">
    <div v-if="carrito.abierto" class="sheet">

      <!-- Handle -->
      <div class="sheet__handle" @click="carrito.abierto = false">
        <div class="sheet__handle-bar"></div>
      </div>

      <!-- Header -->
      <div class="sheet__header">
        <div>
          <h2 class="sheet__titulo">Tu Pedido</h2>
          <p class="sheet__subtitulo">{{ carrito.totalItems }} producto{{ carrito.totalItems !== 1 ? 's' : '' }}</p>
        </div>
        <button class="sheet__cerrar" @click="carrito.abierto = false">✕</button>
      </div>

      <!-- Contenido scrolleable -->
      <div class="sheet__body">

        <!-- Lista de productos -->
        <div class="sheet__productos">
          <TransitionGroup name="item">
            <div
              v-for="item in carrito.items"
              :key="item.id"
              class="item-carrito"
            >
              <div class="item-carrito__info">
                <span class="item-carrito__emoji">{{ item.emoji }}</span>
                <div>
                  <p class="item-carrito__nombre">{{ item.nombre }}</p>
                  <p class="item-carrito__precio">Q{{ item.precio }} c/u</p>
                </div>
              </div>
              <div class="item-carrito__controles">
                <button class="ctrl-btn" @click="carrito.quitar(item.id)">−</button>
                <span class="ctrl-cantidad">{{ item.cantidad }}</span>
                <button class="ctrl-btn" @click="carrito.agregar(item)">+</button>
                <span class="item-carrito__subtotal">Q{{ item.precio * item.cantidad }}</span>
              </div>
            </div>
          </TransitionGroup>
        </div>

        <!-- Total -->
        <div class="sheet__total">
          <span>Total</span>
          <span class="sheet__total-precio">Q{{ carrito.totalPrecio }}</span>
        </div>

        <!-- Formulario -->
        <div class="sheet__form">
          <p class="sheet__form-titulo">📋 Datos del pedido</p>

          <!-- Nombre -->
          <div class="campo">
            <label class="campo__label">👤 Tu nombre</label>
            <input
              v-model="nombre"
              class="campo__input"
              type="text"
              placeholder="¿Cómo te llamas?"
              maxlength="40"
            />
          </div>

          <!-- Sucursal -->
          <div class="campo">
            <label class="campo__label">📍 Sucursal donde recoges</label>
            <div class="sucursales">
              <button
                v-for="s in sucursales"
                :key="s.id"
                class="sucursal-btn"
                :class="{ 'sucursal-btn--activa': sucursalSeleccionada === s.id }"
                @click="sucursalSeleccionada = s.id"
              >
                <span class="sucursal-btn__nombre">{{ s.nombre }}</span>
                <span class="sucursal-btn__lugar">{{ s.lugar }}</span>
              </button>
            </div>
          </div>

          <!-- Hora -->
          <div class="campo">
            <label class="campo__label">⏰ Hora de recogida</label>
            <select v-model="horaSeleccionada" class="campo__input campo__select">
              <option value="" disabled>Elige una hora</option>
              <option v-for="h in horas" :key="h" :value="h">{{ h }}</option>
            </select>
          </div>
        </div>

        <!-- Error -->
        <p v-if="error" class="sheet__error">{{ error }}</p>

        <!-- Botón WhatsApp -->
        <button class="sheet__whatsapp" @click="enviarPedido">
          <svg viewBox="0 0 24 24" fill="currentColor" class="wa-icon">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          Pedir por WhatsApp
        </button>

        <!-- Vaciar -->
        <button class="sheet__vaciar" @click="vaciarCarrito">
          🗑️ Vaciar pedido
        </button>

      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useCarritoStore } from '../../store/carrito.js'

const carrito = useCarritoStore()

const nombre = ref('')
const sucursalSeleccionada = ref('')
const horaSeleccionada = ref('')
const error = ref('')

const sucursales = [
  { id: 'jicaro',       nombre: 'Sabor Caribeño', lugar: 'El Jícaro' },
  { id: 'yupiltepeque', nombre: 'Sabor Caribeño', lugar: 'Yupiltepeque' },
  { id: 'atescatempa',  nombre: 'Sabor Caribeño', lugar: 'Atescatempa' },
]

// Genera horas de 10:00 am a 7:30 pm en intervalos de 30 min
const horas = computed(() => {
  const lista = []
  for (let h = 10; h <= 19; h++) {
    const sufijo = h < 12 ? 'am' : 'pm'
    const hora12 = h > 12 ? h - 12 : h
    lista.push(`${hora12}:00 ${sufijo}`)
    if (h < 19) lista.push(`${hora12}:30 ${sufijo}`)
  }
  lista.push('7:30 pm')
  return lista
})

function enviarPedido() {
  error.value = ''

  if (!nombre.value.trim()) {
    error.value = '⚠️ Por favor escribe tu nombre'
    return
  }
  if (!sucursalSeleccionada.value) {
    error.value = '⚠️ Elige la sucursal donde vas a recoger'
    return
  }
  if (!horaSeleccionada.value) {
    error.value = '⚠️ Elige una hora de recogida'
    return
  }

  const sucursal = sucursales.find(s => s.id === sucursalSeleccionada.value)
  const lineasProductos = carrito.items
    .map(i => `  • ${i.cantidad}x ${i.nombre} — Q${i.precio * i.cantidad}`)
    .join('\n')

  const mensaje = `🌮 *NUEVO PEDIDO - Sabor Caribeño*

👤 *Cliente:* ${nombre.value}
📍 *Sucursal:* ${sucursal.nombre} ${sucursal.lugar}
⏰ *Hora de recogida:* ${horaSeleccionada.value}

📋 *Pedido:*
${lineasProductos}

💰 *Total: Q${carrito.totalPrecio}*

_Pedido realizado desde la página web_`

  const numero = '50238814906'
  const url = `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`
  window.open(url, '_blank')
}

function vaciarCarrito() {
  carrito.vaciar()
  carrito.abierto = false
  nombre.value = ''
  sucursalSeleccionada.value = ''
  horaSeleccionada.value = ''
  error.value = ''
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Nunito:wght@400;600;700&display=swap');

/* ── FAB ── */
.carrito-fab {
  position: fixed;
  bottom: 28px;
  right: 24px;
  display: flex;
  align-items: center;
  gap: 10px;
  background: #e8621a;
  color: white;
  border: none;
  border-radius: 100px;
  padding: 14px 20px;
  font-family: 'Nunito', sans-serif;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 8px 28px rgba(232,98,26,0.45);
  z-index: 900;
  transition: transform 0.2s, box-shadow 0.2s;
}

.carrito-fab:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 36px rgba(232,98,26,0.55);
}

.carrito-fab__icon { font-size: 20px; }

.carrito-fab__badge {
  background: white;
  color: #e8621a;
  font-size: 12px;
  font-weight: 800;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.carrito-fab__label {
  font-size: 14px;
}

/* ── Overlay ── */
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  backdrop-filter: blur(4px);
  z-index: 1000;
}

/* ── Bottom Sheet ── */
.sheet {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-radius: 28px 28px 0 0;
  z-index: 1001;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 -8px 40px rgba(0,0,0,0.2);
  font-family: 'Nunito', sans-serif;
}

.sheet__handle {
  padding: 12px;
  display: flex;
  justify-content: center;
  cursor: pointer;
}

.sheet__handle-bar {
  width: 40px;
  height: 4px;
  background: #e0d8ce;
  border-radius: 100px;
}

.sheet__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px 16px;
  border-bottom: 1px solid #f5e6cc;
}

.sheet__titulo {
  font-family: 'Playfair Display', serif;
  font-size: 24px;
  color: #3d1f0a;
  margin: 0;
}

.sheet__subtitulo {
  font-size: 13px;
  color: #8c6a52;
  margin: 2px 0 0;
}

.sheet__cerrar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: #f5e6cc;
  color: #3d1f0a;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.sheet__cerrar:hover { background: #e8621a; color: white; }

/* ── Body scrolleable ── */
.sheet__body {
  overflow-y: auto;
  padding: 16px 24px 40px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ── Productos ── */
.sheet__productos {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.item-carrito {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #fdf6ec;
  border-radius: 14px;
  border: 1px solid #f5e6cc;
  gap: 12px;
}

.item-carrito__info {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.item-carrito__emoji { font-size: 28px; flex-shrink: 0; }

.item-carrito__nombre {
  font-size: 14px;
  font-weight: 700;
  color: #3d1f0a;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-carrito__precio {
  font-size: 12px;
  color: #8c6a52;
  margin: 2px 0 0;
}

.item-carrito__controles {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.ctrl-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid #e8621a;
  background: white;
  color: #e8621a;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
  line-height: 1;
}

.ctrl-btn:hover { background: #e8621a; color: white; }

.ctrl-cantidad {
  font-size: 15px;
  font-weight: 800;
  color: #3d1f0a;
  min-width: 20px;
  text-align: center;
}

.item-carrito__subtotal {
  font-size: 14px;
  font-weight: 800;
  color: #e8621a;
  min-width: 36px;
  text-align: right;
}

/* ── Total ── */
.sheet__total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  background: #3d1f0a;
  border-radius: 14px;
  color: white;
  font-weight: 700;
  font-size: 16px;
}

.sheet__total-precio {
  font-family: 'Playfair Display', serif;
  font-size: 24px;
  color: #f5a623;
}

/* ── Formulario ── */
.sheet__form {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px;
  background: #fdf6ec;
  border-radius: 16px;
  border: 1px solid #f5e6cc;
}

.sheet__form-titulo {
  font-size: 14px;
  font-weight: 700;
  color: #3d1f0a;
  margin: 0;
  letter-spacing: 0.05em;
}

.campo { display: flex; flex-direction: column; gap: 6px; }

.campo__label {
  font-size: 12px;
  font-weight: 700;
  color: #8c6a52;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.campo__input {
  padding: 12px 14px;
  border: 2px solid #f5e6cc;
  border-radius: 10px;
  font-family: 'Nunito', sans-serif;
  font-size: 15px;
  color: #3d1f0a;
  background: white;
  outline: none;
  transition: border-color 0.2s;
}

.campo__input:focus { border-color: #e8621a; }

.campo__select { cursor: pointer; }

/* ── Sucursales ── */
.sucursales {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sucursal-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border: 2px solid #f5e6cc;
  border-radius: 10px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
  font-family: 'Nunito', sans-serif;
}

.sucursal-btn:hover { border-color: #e8621a; }

.sucursal-btn--activa {
  border-color: #e8621a;
  background: #fff5f0;
}

.sucursal-btn__nombre {
  font-size: 14px;
  font-weight: 700;
  color: #3d1f0a;
}

.sucursal-btn__lugar {
  font-size: 13px;
  color: #e8621a;
  font-weight: 600;
}

/* ── Error ── */
.sheet__error {
  background: #fff0f0;
  border: 1px solid #ffcccc;
  color: #cc0000;
  padding: 10px 14px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  margin: 0;
}

/* ── Botón WhatsApp ── */
.sheet__whatsapp {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  width: 100%;
  padding: 16px;
  background: #25d366;
  color: white;
  border: none;
  border-radius: 14px;
  font-family: 'Nunito', sans-serif;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 16px rgba(37,211,102,0.35);
}

.sheet__whatsapp:hover {
  background: #1fb855;
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(37,211,102,0.45);
}

.wa-icon {
  width: 22px;
  height: 22px;
  flex-shrink: 0;
}

/* ── Vaciar ── */
.sheet__vaciar {
  background: none;
  border: none;
  color: #8c6a52;
  font-family: 'Nunito', sans-serif;
  font-size: 13px;
  cursor: pointer;
  padding: 4px;
  text-align: center;
  width: 100%;
  transition: color 0.2s;
}

.sheet__vaciar:hover { color: #cc0000; }

/* ── Transiciones ── */
.bounce-enter-active { animation: bounceIn 0.4s ease; }
.bounce-leave-active { animation: bounceIn 0.2s ease reverse; }
@keyframes bounceIn {
  0%   { transform: scale(0.5) translateY(20px); opacity: 0; }
  70%  { transform: scale(1.05); opacity: 1; }
  100% { transform: scale(1) translateY(0); }
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.sheet-enter-active, .sheet-leave-active { transition: transform 0.35s cubic-bezier(0.32, 0.72, 0, 1); }
.sheet-enter-from, .sheet-leave-to { transform: translateY(100%); }

.item-enter-active, .item-leave-active { transition: all 0.25s ease; }
.item-enter-from { opacity: 0; transform: translateX(-16px); }
.item-leave-to { opacity: 0; transform: translateX(16px); }

/* ── Desktop: panel lateral en pantallas grandes ── */
@media (min-width: 768px) {
  .sheet {
    left: auto;
    right: 0;
    top: 0;
    bottom: 0;
    width: 420px;
    border-radius: 28px 0 0 28px;
    max-height: 100vh;
  }

  .carrito-fab {
    bottom: 40px;
    right: 40px;
  }
}
</style>