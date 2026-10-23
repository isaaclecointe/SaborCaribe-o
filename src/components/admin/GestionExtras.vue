<template>
  <div class="cobro-overlay cobro-overlay--top" @click.self="$emit('cerrar')">
    <div class="extras-modal">
      <div class="extras-modal__head">
        <h2>Gestionar extras</h2>
        <button class="extras-modal__x" @click="$emit('cerrar')">✕</button>
      </div>

      <!-- Agregar extra nuevo -->
      <div class="extras-form">
        <div class="extras-form__fila">
          <input
            v-model="nuevoNombre"
            type="text"
            placeholder="Nombre (ej. Taco extra res)"
            class="extras-input"
          />
          <input
            v-model.number="nuevoPrecio"
            type="number"
            placeholder="Precio"
            class="extras-input extras-input--precio"
          />
        </div>
        <p class="extras-form__label">¿A qué productos aplica?</p>
        <div class="extras-productos">
          <div v-for="grupo in productosAgrupados" :key="grupo.categoria" class="extras-grupo">
            <p class="extras-grupo__titulo">{{ grupo.categoria }}</p>
            <div class="extras-categorias">
              <button
                v-for="p in grupo.productos"
                :key="p.id"
                type="button"
                class="extras-chip"
                :class="{ 'extras-chip--activa': nuevosProductos.includes(p.id) }"
                @click="toggleNuevoProducto(p.id)"
              >
                {{ p.nombre }}
              </button>
            </div>
          </div>
        </div>
        <button class="extras-btn-agregar" :disabled="!puedeAgregar" @click="agregar">
          + Agregar extra
        </button>
      </div>

      <!-- Lista de extras existentes -->
      <div class="extras-lista">
        <p v-if="cargandoExtras" class="extras-vacio">Cargando...</p>
        <p v-else-if="extras.length === 0" class="extras-vacio">
          Todavía no hay extras creados.
        </p>

        <div
          v-for="e in extras"
          :key="e.id"
          class="extras-item"
          :class="{ 'extras-item--inactivo': e.activo === false }"
        >
          <div class="extras-item-top">
            <div class="extras-item-info">
              <input
                type="text"
                class="extras-item-nombre"
                :value="e.nombre"
                @change="renombrar(e, $event.target.value)"
              />
              <div class="extras-item-cats">
                <span v-for="pid in e.productos" :key="pid" class="extras-chip extras-chip--mini">
                  {{ nombreProducto(pid) }}
                </span>
                <span v-if="!e.productos?.length" class="extras-item-sinproductos">
                  Sin productos asignados
                </span>
              </div>
            </div>
            <div class="extras-item-ctrl">
              <span class="extras-item-q">Q</span>
              <input
                type="number"
                class="extras-item-precio"
                :value="e.precio"
                @change="cambiarPrecio(e, $event.target.value)"
              />
              <button
                class="extras-toggle"
                :class="{ 'extras-toggle--on': e.activo !== false }"
                @click="actualizarExtra(e.id, { activo: e.activo === false })"
              >
                {{ e.activo === false ? 'Inactivo' : 'Activo' }}
              </button>
              <button class="extras-eliminar" @click="confirmarEliminar(e)">🗑</button>
            </div>
          </div>

          <button class="extras-item-editar" @click="toggleExpandido(e.id)">
            {{ expandido === e.id ? 'Ocultar productos ▴' : 'Editar productos ▾' }}
          </button>

          <div v-if="expandido === e.id" class="extras-productos extras-productos--item">
            <div v-for="grupo in productosAgrupados" :key="grupo.categoria" class="extras-grupo">
              <p class="extras-grupo__titulo">{{ grupo.categoria }}</p>
              <div class="extras-categorias">
                <button
                  v-for="p in grupo.productos"
                  :key="p.id"
                  type="button"
                  class="extras-chip"
                  :class="{ 'extras-chip--activa': e.productos?.includes(p.id) }"
                  @click="toggleProductoExtra(e, p.id)"
                >
                  {{ p.nombre }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import productosData from '../../assets/data/productos.json'
import { useExtras } from '../../composables/useExtras.js'

defineEmits(['cerrar'])

const { extras, cargandoExtras, crearExtra, actualizarExtra, eliminarExtra } = useExtras()

// Productos agrupados por categoría, para elegir a cuáles aplica cada extra
// (por producto específico, no por categoría completa: así "taco extra res"
// no aparece al editar una porción de tacos al pastor).
const productosAgrupados = computed(() => {
  const grupos = {}
  productosData.forEach(p => {
    if (!grupos[p.categoria]) grupos[p.categoria] = []
    grupos[p.categoria].push({ id: p.id, nombre: p.nombre })
  })
  return Object.entries(grupos).map(([categoria, productos]) => ({ categoria, productos }))
})

function nombreProducto(id) {
  return productosData.find(p => p.id === id)?.nombre || `#${id}`
}

const nuevoNombre = ref('')
const nuevoPrecio = ref(null)
const nuevosProductos = ref([])
const expandido = ref(null)

const puedeAgregar = computed(() =>
  nuevoNombre.value.trim().length > 0 &&
  nuevoPrecio.value > 0 &&
  nuevosProductos.value.length > 0
)

function toggleNuevoProducto(id) {
  const i = nuevosProductos.value.indexOf(id)
  if (i === -1) nuevosProductos.value.push(id)
  else nuevosProductos.value.splice(i, 1)
}

function toggleExpandido(id) {
  expandido.value = expandido.value === id ? null : id
}

function toggleProductoExtra(extra, id) {
  const actuales = extra.productos || []
  const nuevos = actuales.includes(id)
    ? actuales.filter(x => x !== id)
    : [...actuales, id]
  actualizarExtra(extra.id, { productos: nuevos })
}

async function agregar() {
  if (!puedeAgregar.value) return
  await crearExtra({
    nombre: nuevoNombre.value,
    precio: nuevoPrecio.value,
    productos: [...nuevosProductos.value]
  })
  nuevoNombre.value = ''
  nuevoPrecio.value = null
  nuevosProductos.value = []
}

function renombrar(extra, valor) {
  const nombre = valor.trim()
  if (nombre && nombre !== extra.nombre) actualizarExtra(extra.id, { nombre })
}

function cambiarPrecio(extra, valor) {
  const precio = Number(valor)
  if (precio > 0 && precio !== extra.precio) actualizarExtra(extra.id, { precio })
}

function confirmarEliminar(extra) {
  if (window.confirm(`¿Eliminar "${extra.nombre}"? Esto no afecta pedidos ya guardados.`)) {
    eliminarExtra(extra.id)
  }
}
</script>

<style scoped>
.extras-modal {
  background: #fffaf5;
  border-radius: 20px;
  padding: 24px;
  width: 100%;
  max-width: 540px;
  max-height: 85vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 18px;
  font-family: 'Plus Jakarta Sans', sans-serif;
}

.extras-modal__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.extras-modal__head h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 800;
  color: #2c1a0e;
}
.extras-modal__x {
  width: 32px; height: 32px; border-radius: 50%; border: none;
  background: #f0e4d8; color: #2c1a0e; font-size: 14px; cursor: pointer;
}

.extras-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-bottom: 16px;
  border-bottom: 2px solid #f0e4d8;
}
.extras-form__fila { display: flex; gap: 10px; }
.extras-form__label {
  margin: 4px 0 0; font-size: 13px; font-weight: 600; color: #8a7362;
}

.extras-input {
  flex: 1;
  padding: 12px 14px;
  border: 2px solid #e8ddd0;
  border-radius: 10px;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 15px;
  font-weight: 500;
  color: #2c1a0e;
  outline: none;
}
.extras-input:focus { border-color: #e8621a; }
.extras-input--precio { flex: 0 0 110px; }

.extras-productos {
  display: flex; flex-direction: column; gap: 10px;
  max-height: 220px; overflow-y: auto;
  padding: 12px; border: 1.5px solid #f0e4d8; border-radius: 12px; background: white;
}
.extras-productos--item { max-height: 180px; margin-top: -4px; }

.extras-grupo { display: flex; flex-direction: column; gap: 6px; }
.extras-grupo__titulo {
  margin: 0; font-size: 10.5px; font-weight: 700; color: #b3a394;
  text-transform: uppercase; letter-spacing: 0.08em;
}

.extras-categorias { display: flex; flex-wrap: wrap; gap: 6px; }

.extras-chip {
  padding: 6px 11px;
  border-radius: 999px;
  border: 2px solid #e8ddd0;
  background: white;
  color: #8a7362;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
}
.extras-chip--activa { background: #e8621a; border-color: #e8621a; color: white; }
.extras-chip--mini {
  padding: 3px 9px; font-size: 11px; cursor: default;
  background: #f0e4d8; border-color: #f0e4d8; color: #8a7362;
}

.extras-btn-agregar {
  padding: 14px;
  border-radius: 12px;
  border: none;
  background: #2c1a0e;
  color: white;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
}
.extras-btn-agregar:disabled { opacity: 0.4; cursor: not-allowed; }

.extras-lista { display: flex; flex-direction: column; gap: 10px; }
.extras-vacio { text-align: center; color: #b3a394; font-size: 14px; padding: 20px 0; }

.extras-item {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  border-radius: 14px;
  background: white;
  border: 2px solid #f0e4d8;
}
.extras-item--inactivo { opacity: 0.5; }

.extras-item-top { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.extras-item-info { display: flex; flex-direction: column; gap: 6px; min-width: 0; flex: 1; }
.extras-item-nombre {
  border: none; background: transparent; outline: none;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 15px; font-weight: 700; color: #2c1a0e; padding: 0;
}
.extras-item-cats { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.extras-item-sinproductos { font-size: 11.5px; color: #cc0000; font-weight: 600; }

.extras-item-ctrl { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.extras-item-q { font-weight: 700; color: #8a7362; font-size: 14px; }
.extras-item-precio {
  width: 60px; padding: 8px; border: 2px solid #e8ddd0; border-radius: 8px;
  font-family: 'Plus Jakarta Sans', sans-serif; font-size: 14px; font-weight: 700;
  color: #2c1a0e; outline: none; text-align: center;
}
.extras-item-precio:focus { border-color: #e8621a; }

.extras-toggle {
  padding: 6px 10px; border-radius: 8px; border: none;
  background: #f0e4d8; color: #8a7362;
  font-family: 'Plus Jakarta Sans', sans-serif; font-size: 11px; font-weight: 700;
  cursor: pointer; white-space: nowrap;
}
.extras-toggle--on { background: rgba(58,155,213,0.15); color: #3a9bd5; }

.extras-eliminar {
  width: 32px; height: 32px; border-radius: 8px; border: none;
  background: rgba(204,0,0,0.08); color: #cc0000; font-size: 14px; cursor: pointer;
}

.extras-item-editar {
  align-self: flex-start;
  border: none; background: transparent; padding: 0;
  font-family: 'Plus Jakarta Sans', sans-serif; font-size: 12px; font-weight: 700;
  color: #e8621a; cursor: pointer;
}
</style>