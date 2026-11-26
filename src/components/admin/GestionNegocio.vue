<template>
  <div class="gn-overlay" @click.self="$emit('cerrar')">
    <div class="gn">

      <div class="gn__head">
        <div class="gn__head-textos">
          <h2 class="gn__titulo">Sucursales y usuarios</h2>
          <p class="gn__sub">{{ negocio?.nombre || 'Tu negocio' }}</p>
        </div>
        <button class="gn__cerrar" aria-label="Cerrar" @click="$emit('cerrar')">✕</button>
      </div>

      <div class="gn__tabs" role="tablist">
        <button
          v-for="t in [['personal', 'Personal'], ['sucursales', 'Sucursales']]" :key="t[0]"
          class="gn__tab" :class="{ 'gn__tab--activo': vista === t[0] }"
          role="tab" :aria-selected="vista === t[0]" @click="vista = t[0]"
        >{{ t[1] }}</button>
      </div>

      <p v-if="avisoError" class="gn__aviso gn__aviso--error">{{ avisoError }}</p>

      <!-- ═══ PERSONAL ═══ -->
      <template v-if="vista === 'personal'">

        <!-- Código recién creado -->
        <section v-if="codigoNuevo" class="gn-codigo">
          <span class="gn-codigo__label">Código para {{ ROLES[codigoNuevo.rol].nombre.toLowerCase() }}</span>
          <span class="gn-codigo__valor">{{ formatoCodigo(codigoNuevo.codigo) }}</span>
          <p class="gn-codigo__pasos">
            En el equipo de esa persona: abre el POS, toca <strong class="gn-fuerte">Crear cuenta</strong>
            con su correo y escribe este código. Vale 7 días y una sola vez.
          </p>
          <button class="gn-btn gn-btn--claro" @click="codigoNuevo = null">Listo</button>
        </section>

        <!-- Invitar -->
        <section v-else class="gn-card">
          <h3 class="gn-card__titulo">Invitar a alguien</h3>
          <span class="gn-label">Rol</span>
          <div class="gn-roles">
            <button
              v-for="r in ['encargado', 'cajero', 'cocina']" :key="r"
              class="gn-rol" :class="{ 'gn-rol--activo': nuevoRol === r }"
              @click="nuevoRol = r"
            >
              <span class="gn-rol__nombre">{{ ROLES[r].nombre }}</span>
              <span class="gn-rol__desc">{{ ROLES[r].descripcion }}</span>
            </button>
          </div>
          <span class="gn-label">Sucursal</span>
          <div class="gn-chips">
            <button
              v-for="s in todasLasSucursales" :key="s.id"
              class="gn-chip" :class="{ 'gn-chip--activo': nuevasSucursales.includes(s.id) }"
              @click="alternar(nuevasSucursales, s.id)"
            >{{ s.nombre }}</button>
          </div>
          <p v-if="errorInvitar" class="gn__aviso gn__aviso--error">{{ errorInvitar }}</p>
          <button class="gn-btn" :disabled="trabajando" @click="invitar">
            {{ trabajando ? 'Creando…' : 'Crear código de acceso' }}
          </button>
        </section>

        <!-- Miembros -->
        <section class="gn-lista">
          <h3 class="gn-lista__titulo">Con acceso</h3>
          <div v-for="m in miembrosOrdenados" :key="m.id" class="gn-fila">
            <div class="gn-fila__textos">
              <span class="gn-fila__nombre">{{ m.email || 'Sin correo' }}{{ m.id === uid ? ' (tú)' : '' }}</span>
              <span class="gn-fila__detalle">
                <span class="gn-rol-badge" :class="`gn-rol-badge--${m.rol}`">{{ ROLES[m.rol]?.nombre || m.rol }}</span>
                {{ m.rol === 'dueno' ? 'Todas las sucursales' : nombresSucursales(m.sucursales) }}
              </span>
            </div>
            <template v-if="m.id !== uid">
              <div v-if="confirmarQuitar === m.id" class="gn-fila__confirmar">
                <button class="gn-mini" @click="confirmarQuitar = null">No</button>
                <button class="gn-mini gn-mini--peligro" @click="quitar(m)">Quitar</button>
              </div>
              <button v-else class="gn-mini" @click="confirmarQuitar = m.id">Quitar acceso</button>
            </template>
          </div>
        </section>

        <!-- Códigos sin usar -->
        <section v-if="invitaciones.length" class="gn-lista">
          <h3 class="gn-lista__titulo">Códigos sin usar</h3>
          <div v-for="inv in invitaciones" :key="inv.id" class="gn-fila">
            <div class="gn-fila__textos">
              <span class="gn-fila__nombre gn-fila__nombre--codigo">{{ formatoCodigo(inv.id) }}</span>
              <span class="gn-fila__detalle">
                {{ ROLES[inv.rol]?.nombre }} · {{ nombresSucursales(inv.sucursales) }} ·
                {{ vencida(inv) ? 'vencido' : `vence ${fechaCorta(inv.vence)}` }}
              </span>
            </div>
            <button class="gn-mini" @click="anular(inv)">Anular</button>
          </div>
        </section>
      </template>

      <!-- ═══ SUCURSALES ═══ -->
      <template v-else>
        <section class="gn-lista">
          <div v-for="s in todasLasSucursales" :key="s.id" class="gn-fila">
            <template v-if="editando === s.id">
              <input v-model="nombreEditado" class="gn-input" @keyup.enter="renombrar(s)" />
              <button class="gn-mini" @click="editando = null">Cancelar</button>
              <button class="gn-mini gn-mini--ok" @click="renombrar(s)">Guardar</button>
            </template>
            <template v-else>
              <div class="gn-fila__textos">
                <span class="gn-fila__nombre">{{ s.nombre }}</span>
                <span class="gn-fila__detalle">{{ personasEn(s.id) }}</span>
              </div>
              <!-- Sin pantalla de cocina: caja marca los pedidos listos directo -->
              <div class="gn-cocina">
                <span class="gn-cocina__texto">Pantalla de cocina</span>
                <button
                  type="button"
                  class="gn-switch" :class="{ 'gn-switch--on': sucursalUsaCocina(s) }"
                  role="switch" :aria-checked="sucursalUsaCocina(s)"
                  :aria-label="`Pantalla de cocina en ${s.nombre}`"
                  @click="alternarCocina(s)"
                ><span class="gn-switch__bola"></span></button>
              </div>
              <button class="gn-mini" @click="editando = s.id; nombreEditado = s.nombre">Cambiar nombre</button>
            </template>
          </div>
        </section>

        <section class="gn-card">
          <h3 class="gn-card__titulo">Nueva sucursal</h3>
          <div class="gn-nueva">
            <input v-model="nuevaSucursal" class="gn-input" placeholder="Nombre (ej. Jutiapa)" @keyup.enter="agregarSucursal" />
            <button class="gn-btn gn-btn--auto" :disabled="!nuevaSucursal.trim()" @click="agregarSucursal">Agregar</button>
          </div>
          <p class="gn-nota">Usa el mismo menú del negocio. Tendrá sus propios turnos, pedidos y numeración.</p>
        </section>

        <section class="gn-ayuda">
          <p class="gn-ayuda__texto">
            <strong class="gn-ayuda__fuerte">Pantalla de cocina:</strong> apágala en las sucursales que trabajan con
            una sola pantalla. Ahí los pedidos se marcan como listos desde caja, sin esperar a cocina.
          </p>
        </section>
      </template>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { doc, onSnapshot, setDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase.js'
import { useNegocio, ROLES, sucursalUsaCocina } from '../../composables/useNegocio.js'
import {
  crearInvitacion, formatoCodigo, invitacionesPendientesQuery, slug
} from '../../utils/configuracionNegocio.js'

defineEmits(['cerrar'])

const { negocio, negocioId, uid, todasLasSucursales, colNegocio, docNegocio } = useNegocio()

const vista = ref('personal')
const avisoError = ref('')
const trabajando = ref(false)

function falla(texto) {
  return (e) => {
    console.error(texto, e)
    avisoError.value = e?.code === 'permission-denied'
      ? 'Firebase no dio permiso. Solo el dueño puede hacer esto.'
      : `${texto}. Revisa la conexión e intenta de nuevo.`
  }
}

function alternar(lista, id) {
  const i = lista.indexOf(id)
  i === -1 ? lista.push(id) : lista.splice(i, 1)
}

function nombresSucursales(ids) {
  const nombres = (ids || []).map(id => todasLasSucursales.value.find(s => s.id === id)?.nombre).filter(Boolean)
  return nombres.length ? nombres.join(', ') : 'Sin sucursal'
}

function fechaCorta(f) {
  const d = f?.toDate ? f.toDate() : null
  return d ? d.toLocaleDateString('es-GT', { day: 'numeric', month: 'short' }) : '—'
}
const vencida = inv => inv.vence?.toMillis && inv.vence.toMillis() < Date.now()

// ── Miembros e invitaciones (en vivo) ──
const miembros = ref([])
const invitaciones = ref([])
const unsubs = []

onMounted(() => {
  unsubs.push(onSnapshot(colNegocio('miembros'), snap => {
    miembros.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  }, falla('No se pudo cargar el personal')))
  unsubs.push(onSnapshot(invitacionesPendientesQuery(negocioId.value, uid.value), snap => {
    invitaciones.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.creado?.toMillis?.() || 0) - (a.creado?.toMillis?.() || 0))
  }, falla('No se pudieron cargar los códigos')))
})
onUnmounted(() => unsubs.forEach(u => u()))

const ORDEN_ROL = { dueno: 0, encargado: 1, cajero: 2, cocina: 3 }
const miembrosOrdenados = computed(() =>
  [...miembros.value].sort((a, b) => (ORDEN_ROL[a.rol] ?? 9) - (ORDEN_ROL[b.rol] ?? 9) || String(a.email).localeCompare(b.email))
)

function personasEn(sucursalId) {
  const n = miembros.value.filter(m => m.rol !== 'dueno' && (m.sucursales || []).includes(sucursalId)).length
  return n === 0 ? 'Sin personal asignado' : `${n} ${n === 1 ? 'persona' : 'personas'}`
}

// ── Invitar ──
const nuevoRol = ref('cajero')
const nuevasSucursales = ref([])
const errorInvitar = ref('')
const codigoNuevo = ref(null)

async function invitar() {
  errorInvitar.value = ''
  if (!nuevasSucursales.value.length) {
    errorInvitar.value = 'Elige al menos una sucursal.'
    return
  }
  trabajando.value = true
  try {
    const codigo = await crearInvitacion({
      negocioId: negocioId.value, rol: nuevoRol.value,
      sucursales: [...nuevasSucursales.value], creadoPor: uid.value
    })
    codigoNuevo.value = { codigo, rol: nuevoRol.value }
    nuevasSucursales.value = []
  } catch (e) {
    falla('No se pudo crear el código')(e)
  } finally {
    trabajando.value = false
  }
}

function anular(inv) {
  deleteDoc(invitacionRef(inv.id)).catch(falla('No se pudo anular el código'))
}

// Las invitaciones viven fuera del negocio (quien recibe el código todavía
// no sabe de qué negocio es)
function invitacionRef(codigo) { return doc(db, 'invitaciones', codigo) }

// ── Quitar acceso ──
const confirmarQuitar = ref(null)
function quitar(m) {
  confirmarQuitar.value = null
  deleteDoc(docNegocio('miembros', m.id)).catch(falla('No se pudo quitar el acceso'))
}

// ── Sucursales ──
const editando = ref(null)
const nombreEditado = ref('')
const nuevaSucursal = ref('')

function renombrar(s) {
  const nombre = nombreEditado.value.trim()
  if (!nombre) return
  editando.value = null
  updateDoc(docNegocio('sucursales', s.id), { nombre }).catch(falla('No se pudo cambiar el nombre'))
}

function alternarCocina(s) {
  updateDoc(docNegocio('sucursales', s.id), { usaCocina: !sucursalUsaCocina(s) })
    .catch(falla('No se pudo cambiar la pantalla de cocina'))
}

function agregarSucursal() {
  const nombre = nuevaSucursal.value.trim()
  if (!nombre) return
  const base = slug(nombre) || 'sucursal'
  let id = base
  let n = 2
  while (todasLasSucursales.value.some(s => s.id === id)) id = `${base}-${n++}`
  const orden = Math.max(0, ...todasLasSucursales.value.map(s => s.orden || 0)) + 10
  nuevaSucursal.value = ''
  setDoc(docNegocio('sucursales', id), { nombre, orden, creado: serverTimestamp() })
    .catch(falla('No se pudo agregar la sucursal'))
}
</script>

<style scoped>
.gn-overlay, .gn-overlay * { font-family: 'Plus Jakarta Sans', sans-serif !important; box-sizing: border-box; }

.gn-overlay {
  position: fixed; inset: 0; z-index: 1100; background: rgba(26,14,6,0.55);
  display: flex; align-items: center; justify-content: center; padding: 16px;
}
.gn {
  width: 100%; max-width: 640px; max-height: calc(100vh - 32px); max-height: calc(100dvh - 32px); overflow-y: auto;
  background: #ffffff; border-radius: 22px; padding: 22px;
  display: flex; flex-direction: column; gap: 14px;
  box-shadow: 0 24px 60px rgba(26,14,6,0.25);
}
.gn > * { flex-shrink: 0; }

.gn__head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
.gn__titulo { margin: 0; font-size: 21px; font-weight: 800; color: #2c1a0e; }
.gn__sub { margin: 2px 0 0; font-size: 13.5px; font-weight: 600; color: #8a7362; }
.gn__cerrar {
  width: 36px; height: 36px; border-radius: 50%; border: none; cursor: pointer;
  background: #f4ede5; color: #2c1a0e; font-size: 13px; font-weight: 700; flex-shrink: 0;
}

.gn__tabs { display: flex; gap: 4px; padding: 4px; background: #f4ede5; border-radius: 13px; }
.gn__tab {
  flex: 1; height: 40px; border: none; border-radius: 10px; cursor: pointer;
  background: transparent; color: #8a7362; font-size: 14.5px; font-weight: 700;
}
.gn__tab--activo { background: #ffffff; color: #2c1a0e; box-shadow: 0 1px 3px rgba(44,26,14,0.12); }

.gn__aviso { margin: 0; padding: 10px 12px; border-radius: 10px; font-size: 13.5px; font-weight: 600; }
.gn__aviso--error { background: #fdf1f0; color: #b3261e; }

.gn-card {
  display: flex; flex-direction: column; gap: 10px;
  padding: 16px; border-radius: 16px; border: 1px solid #efe6dc; background: #faf6f1;
}
.gn-card__titulo { margin: 0; font-size: 15.5px; font-weight: 800; color: #2c1a0e; }
.gn-label {
  font-size: 11.5px; font-weight: 800; color: #b3a394;
  text-transform: uppercase; letter-spacing: 0.07em;
}

.gn-roles { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.gn-rol {
  display: flex; flex-direction: column; gap: 3px; text-align: left;
  padding: 10px 12px; border-radius: 12px; border: 1.5px solid #e6dacd; background: #ffffff; cursor: pointer;
}
.gn-rol--activo { border-color: #e8621a; box-shadow: 0 0 0 3px rgba(232,98,26,0.12); }
.gn-rol__nombre { font-size: 14.5px; font-weight: 800; color: #2c1a0e; }
.gn-rol__desc { font-size: 12px; font-weight: 500; line-height: 1.35; color: #8a7362; }

.gn-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.gn-chip {
  height: 38px; padding: 0 14px; border-radius: 999px; cursor: pointer;
  border: 1.5px solid #e6dacd; background: #ffffff; color: #6b5444; font-size: 14px; font-weight: 700;
}
.gn-chip--activo { border-color: #2c1a0e; background: #2c1a0e; color: #ffffff; }

.gn-btn {
  height: 48px; border: none; border-radius: 12px; cursor: pointer;
  background: #e8621a; color: #ffffff; font-size: 15px; font-weight: 800;
}
.gn-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.gn-btn--claro { background: #2c1a0e; }
.gn-btn--auto { padding: 0 18px; flex-shrink: 0; }

.gn-codigo {
  display: flex; flex-direction: column; align-items: center; gap: 8px; text-align: center;
  padding: 20px; border-radius: 16px; background: #2c1a0e;
}
.gn-codigo__label { font-size: 12px; font-weight: 800; color: rgba(255,255,255,0.6); text-transform: uppercase; letter-spacing: 0.08em; }
.gn-codigo__valor { font-size: 36px; font-weight: 800; color: #f5a623; letter-spacing: 0.1em; }
.gn-codigo__pasos { margin: 0 0 6px; font-size: 13.5px; font-weight: 500; line-height: 1.5; color: rgba(255,255,255,0.75); max-width: 420px; }
.gn-fuerte { font-size: 13.5px; font-weight: 800; color: #ffffff; }
.gn-codigo .gn-btn { width: 100%; max-width: 240px; background: #ffffff; color: #2c1a0e; }

.gn-lista { display: flex; flex-direction: column; }
.gn-lista__titulo {
  margin: 4px 0 6px; font-size: 11.5px; font-weight: 800; color: #b3a394;
  text-transform: uppercase; letter-spacing: 0.07em;
}
.gn-fila {
  display: flex; align-items: center; gap: 10px;
  padding: 12px 2px; border-bottom: 1px solid #f2ebe3;
}
.gn-fila:last-child { border-bottom: none; }
.gn-fila__textos { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
.gn-fila__nombre { font-size: 14.5px; font-weight: 700; color: #2c1a0e; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.gn-fila__nombre--codigo { font-size: 16px; font-weight: 800; letter-spacing: 0.08em; }
.gn-fila__detalle { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; font-size: 12.5px; font-weight: 500; color: #8a7362; }
.gn-fila__confirmar { display: flex; gap: 6px; }

.gn-rol-badge { padding: 2px 8px; border-radius: 999px; font-size: 11.5px; font-weight: 800; background: #f4ede5; color: #6b5444; }
.gn-rol-badge--dueno { background: #2c1a0e; color: #ffffff; }
.gn-rol-badge--encargado { background: rgba(47,127,193,0.12); color: #23679f; }
.gn-rol-badge--cajero { background: rgba(232,98,26,0.12); color: #c04e10; }
.gn-rol-badge--cocina { background: rgba(47,140,74,0.12); color: #24733b; }

.gn-mini {
  flex-shrink: 0; height: 34px; padding: 0 12px; border-radius: 9px; cursor: pointer;
  border: 1.5px solid #e6dacd; background: #ffffff; color: #6b5444; font-size: 13px; font-weight: 700;
}
.gn-mini--peligro { border-color: #b3261e; background: #b3261e; color: #ffffff; }
.gn-mini--ok { border-color: #2f8c4a; background: #2f8c4a; color: #ffffff; }

.gn-input {
  flex: 1; min-width: 0; height: 44px; padding: 0 12px; border-radius: 10px;
  border: 1.5px solid #e6dacd; background: #ffffff; outline: none;
  font-size: 15px; font-weight: 600; color: #2c1a0e;
}
.gn-input:focus { border-color: #e8621a; }
.gn-nueva { display: flex; gap: 8px; }

.gn-cocina { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.gn-cocina__texto { font-size: 12.5px; font-weight: 700; color: #8a7362; }
.gn-switch {
  position: relative; width: 46px; height: 28px; border-radius: 999px; border: none; cursor: pointer;
  background: #e6dacd; transition: background 0.15s; flex-shrink: 0; padding: 0;
}
.gn-switch--on { background: #2f8c4a; }
.gn-switch__bola {
  position: absolute; top: 3px; left: 3px; width: 22px; height: 22px; border-radius: 50%;
  background: #ffffff; box-shadow: 0 1px 3px rgba(0,0,0,0.2); transition: transform 0.15s;
}
.gn-switch--on .gn-switch__bola { transform: translateX(18px); }
.gn-ayuda { padding: 12px 14px; border-radius: 12px; background: #faf6f1; }
.gn-ayuda__texto { margin: 0; font-size: 12.5px; font-weight: 500; line-height: 1.5; color: #8a7362; }
.gn-ayuda__fuerte { font-size: 12.5px; font-weight: 700; color: #6b5444; }
.gn-nota { margin: 0; font-size: 12.5px; font-weight: 500; color: #8a7362; }

@media (max-width: 560px) {
  .gn { padding: 16px; }
  .gn-roles { grid-template-columns: 1fr; }
  .gn-cocina__texto { display: none; }
}
</style>