<template>
  <div class="cfg">
    <div class="cfg__caja">

      <header class="cfg__head">
        <h1 class="cfg__titulo">{{ hecho ? 'Todo listo' : 'Configurar acceso' }}</h1>
        <p class="cfg__sub">
          Sesión iniciada como <strong class="cfg__email">{{ email }}</strong>
          <button class="cfg__salir" @click="salir">Cerrar sesión</button>
        </p>
      </header>

      <!-- No se pudo cargar el acceso (sin internet, reglas…) -->
      <section v-if="estado === 'error'" class="cfg__card">
        <p class="cfg__aviso cfg__aviso--error">{{ errorSesion }}</p>
        <button class="cfg__ok" :disabled="trabajando" @click="reintentar">Reintentar</button>
      </section>

      <!-- Terminado -->
      <section v-else-if="hecho" class="cfg__card">
        <p class="cfg__texto">{{ hecho }}</p>
        <ul v-if="resumen" class="cfg__resumen">
          <li class="cfg__resumen-item"><span class="cfg__resumen-num">{{ resumen.turnos }}</span><span class="cfg__resumen-txt">turnos</span></li>
          <li class="cfg__resumen-item"><span class="cfg__resumen-num">{{ resumen.productos }}</span><span class="cfg__resumen-txt">productos</span></li>
          <li class="cfg__resumen-item"><span class="cfg__resumen-num">{{ resumen.extras }}</span><span class="cfg__resumen-txt">extras</span></li>
          <li class="cfg__resumen-item"><span class="cfg__resumen-num">{{ resumen.pedidos }}</span><span class="cfg__resumen-txt">pedidos</span></li>
        </ul>
        <button class="cfg__ok" @click="continuar">Continuar</button>
      </section>

      <template v-else>
        <div class="cfg__tabs" role="tablist">
          <button
            class="cfg__tab" :class="{ 'cfg__tab--activo': modo === 'codigo' }"
            role="tab" :aria-selected="modo === 'codigo'" @click="modo = 'codigo'"
          >Tengo un código</button>
          <button
            class="cfg__tab" :class="{ 'cfg__tab--activo': modo === 'crear' }"
            role="tab" :aria-selected="modo === 'crear'" @click="modo = 'crear'"
          >Crear mi negocio</button>
        </div>

        <!-- ── Unirse con código ── -->
        <section v-if="modo === 'codigo'" class="cfg__card">
          <p class="cfg__texto">
            Pídele al dueño del negocio un código de acceso. Él lo crea en el POS,
            en el menú → <strong class="cfg__fuerte">Sucursales y usuarios</strong>.
          </p>
          <label class="cfg__label" for="cfg-codigo">Código de acceso</label>
          <input
            id="cfg-codigo"
            v-model="codigo"
            class="cfg__input cfg__input--codigo"
            placeholder="XXXX-XXXX"
            maxlength="9"
            autocapitalize="characters"
            autocomplete="off"
            @keyup.enter="usarCodigo"
          />
          <p v-if="error" class="cfg__aviso cfg__aviso--error">{{ error }}</p>
          <button class="cfg__ok" :disabled="trabajando" @click="usarCodigo">
            {{ trabajando ? 'Verificando…' : 'Entrar' }}
          </button>
        </section>

        <!-- ── Crear negocio ── -->
        <section v-else class="cfg__card">
          <p class="cfg__texto">
            Solo la persona dueña del negocio hace esto, una vez. Después invita a su
            personal con códigos de acceso.
          </p>

          <label class="cfg__label" for="cfg-nombre">Nombre del negocio</label>
          <input id="cfg-nombre" v-model="nombreNegocio" class="cfg__input" placeholder="Ej. Sabor Caribeño" />

          <div class="cfg__label-fila">
            <span class="cfg__label">Sucursales</span>
            <span class="cfg__label-nota">Puedes agregar más después</span>
          </div>
          <div class="cfg__sucursales">
            <div v-for="(s, i) in sucursales" :key="s.clave" class="cfg__sucursal">
              <input v-model="s.nombre" class="cfg__input" :placeholder="`Sucursal ${i + 1}`" />
              <button
                v-if="sucursales.length > 1"
                class="cfg__quitar" aria-label="Quitar sucursal"
                @click="sucursales.splice(i, 1)"
              >✕</button>
            </div>
            <button class="cfg__agregar" @click="agregarSucursal">Agregar sucursal</button>
          </div>

          <!-- Datos de antes de las sucursales -->
          <div v-if="datosAnteriores" class="cfg__migrar">
            <label class="cfg__check">
              <input v-model="migrar" type="checkbox" class="cfg__check-input" />
              <span class="cfg__check-textos">
                <span class="cfg__check-titulo">Pasar los datos que ya existen</span>
                <span class="cfg__check-sub">Turnos, productos, extras y pedidos. Se copian; lo original queda como respaldo.</span>
              </span>
            </label>
            <template v-if="migrar">
              <span class="cfg__label">¿De qué sucursal son?</span>
              <div class="cfg__chips">
                <button
                  v-for="s in sucursalesValidas" :key="s.clave"
                  class="cfg__chip" :class="{ 'cfg__chip--activo': migrarA === s.clave }"
                  @click="migrarA = s.clave"
                >{{ s.nombre }}</button>
              </div>
            </template>
          </div>

          <p v-if="error" class="cfg__aviso cfg__aviso--error">{{ error }}</p>
          <p v-if="progreso" class="cfg__aviso">{{ progreso }}</p>
          <button class="cfg__ok" :disabled="trabajando" @click="crear">
            {{ trabajando ? 'Creando…' : 'Crear negocio' }}
          </button>
        </section>
      </template>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { signOut } from 'firebase/auth'
import { auth } from '../../firebase.js'
import { useNegocio, recargarSesion, limpiarSesion, INICIO_POR_ROL } from '../../composables/useNegocio.js'
import { crearNegocio, unirseConCodigo, hayDatosAnteriores, slug } from '../../utils/configuracionNegocio.js'

const router = useRouter()
const route = useRoute()
const { estado, errorSesion, email, rol } = useNegocio()

const modo = ref('codigo')
const codigo = ref('')
const error = ref('')
const progreso = ref('')
const trabajando = ref(false)
const hecho = ref('')
const resumen = ref(null)

// ── Crear negocio ──
const nombreNegocio = ref('')
let siguienteClave = 1
const sucursales = ref([{ clave: 'nueva-0', id: null, nombre: '' }])
const datosAnteriores = ref(false)
const migrar = ref(true)
const migrarA = ref(null)

function agregarSucursal() {
  sucursales.value.push({ clave: `nueva-${siguienteClave++}`, id: null, nombre: '' })
}

// Id de cada sucursal: los que ya conoce la página web se conservan
// (jicaro, yupiltepeque, atescatempa); las nuevas salen del nombre.
const sucursalesValidas = computed(() => {
  const usados = new Set()
  return sucursales.value
    .filter(s => s.nombre.trim())
    .map(s => {
      let id = s.id || slug(s.nombre) || 'sucursal'
      let n = 2
      while (usados.has(id)) id = `${s.id || slug(s.nombre)}-${n++}`
      usados.add(id)
      return { ...s, id }
    })
})

onMounted(async () => {
  // Si este proyecto ya tenía datos (antes de existir las sucursales), se
  // ofrece pasarlos y se proponen las sucursales de Sabor Caribeño.
  datosAnteriores.value = await hayDatosAnteriores()
  if (datosAnteriores.value) {
    modo.value = 'crear'
    nombreNegocio.value = 'Sabor Caribeño'
    sucursales.value = [
      { clave: 'jicaro', id: 'jicaro', nombre: 'El Jícaro' },
      { clave: 'yupiltepeque', id: 'yupiltepeque', nombre: 'Yupiltepeque' },
      { clave: 'atescatempa', id: 'atescatempa', nombre: 'Atescatempa' }
    ]
    migrarA.value = 'jicaro'
  }
})

async function crear() {
  error.value = ''
  const nombre = nombreNegocio.value.trim()
  const lista = sucursalesValidas.value
  if (!nombre) { error.value = 'Escribe el nombre del negocio.'; return }
  if (!slug(nombre)) { error.value = 'El nombre necesita al menos una letra o número.'; return }
  if (!lista.length) { error.value = 'Agrega al menos una sucursal.'; return }
  const destino = migrar.value && datosAnteriores.value
    ? lista.find(s => s.clave === migrarA.value)?.id
    : null
  if (migrar.value && datosAnteriores.value && !destino) {
    error.value = 'Elige a qué sucursal pertenecen los datos actuales.'
    return
  }

  trabajando.value = true
  try {
    resumen.value = await crearNegocio({
      user: auth.currentUser,
      nombre,
      negocioId: slug(nombre),
      sucursales: lista.map(s => ({ id: s.id, nombre: s.nombre })),
      migrarA: destino,
      progreso: t => { progreso.value = t }
    })
    await recargarSesion(auth.currentUser)
    hecho.value = destino
      ? `Se creó ${nombre} con ${lista.length} ${lista.length === 1 ? 'sucursal' : 'sucursales'} y se copiaron los datos a ${lista.find(s => s.id === destino).nombre}:`
      : `Se creó ${nombre} con ${lista.length} ${lista.length === 1 ? 'sucursal' : 'sucursales'}.`
  } catch (e) {
    console.error('Error creando el negocio:', e)
    error.value = e?.code === 'permission-denied'
      ? 'Firebase no dio permiso. Revisa que las reglas nuevas de Firestore estén publicadas.'
      : (e?.message || 'No se pudo crear el negocio. Intenta de nuevo.')
  } finally {
    trabajando.value = false
    progreso.value = ''
  }
}

async function usarCodigo() {
  error.value = ''
  trabajando.value = true
  try {
    const inv = await unirseConCodigo(auth.currentUser, codigo.value)
    await recargarSesion(auth.currentUser)
    continuar(inv.rol)
  } catch (e) {
    console.error('Error usando el código:', e)
    error.value = e?.code === 'permission-denied'
      ? 'No se pudo usar el código. Puede que ya se haya usado o vencido.'
      : (e?.message || 'No se pudo usar el código.')
  } finally {
    trabajando.value = false
  }
}

async function reintentar() {
  trabajando.value = true
  await recargarSesion(auth.currentUser)
  trabajando.value = false
  if (estado.value === 'listo') continuar()
}

function continuar(rolNuevo) {
  const r = rolNuevo || rol.value
  const pedido = typeof route.query.redirect === 'string' ? route.query.redirect : null
  // El router decide si ese rol puede entrar ahí; si no, lo manda a su inicio
  router.replace(pedido || INICIO_POR_ROL[r] || '/pos')
}

async function salir() {
  try {
    await signOut(auth)
  } finally {
    limpiarSesion()
    router.replace('/login')
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

.cfg, .cfg * { font-family: 'Plus Jakarta Sans', sans-serif !important; box-sizing: border-box; }

.cfg {
  min-height: 100vh; min-height: 100dvh; background: #f7f4f0;
  display: flex; justify-content: center; padding: 32px 16px;
  -webkit-font-smoothing: antialiased;
}
.cfg__caja { width: 100%; max-width: 520px; display: flex; flex-direction: column; gap: 16px; }

.cfg__head { display: flex; flex-direction: column; gap: 4px; }
.cfg__titulo { margin: 0; font-size: 26px; font-weight: 800; color: #2c1a0e; }
.cfg__sub { margin: 0; font-size: 14px; font-weight: 500; color: #8a7362; display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 8px; }
.cfg__email { font-size: 14px; font-weight: 700; color: #2c1a0e; }
.cfg__salir {
  border: none; background: none; padding: 0; cursor: pointer;
  font-size: 13.5px; font-weight: 700; color: #e8621a;
}

.cfg__tabs { display: flex; gap: 4px; padding: 4px; background: #efe7de; border-radius: 14px; }
.cfg__tab {
  flex: 1; height: 42px; border: none; border-radius: 10px; cursor: pointer;
  background: transparent; color: #8a7362; font-size: 14.5px; font-weight: 700;
}
.cfg__tab--activo { background: #ffffff; color: #2c1a0e; box-shadow: 0 1px 3px rgba(44,26,14,0.12); }

.cfg__card {
  background: #ffffff; border: 1px solid #efe6dc; border-radius: 20px; padding: 22px;
  display: flex; flex-direction: column; gap: 12px;
  box-shadow: 0 1px 2px rgba(44,26,14,0.04), 0 10px 30px rgba(44,26,14,0.05);
}
.cfg__texto { margin: 0 0 4px; font-size: 14px; font-weight: 500; line-height: 1.5; color: #6b5444; }
.cfg__fuerte { font-size: 14px; font-weight: 700; color: #2c1a0e; }

.cfg__label {
  font-size: 11.5px; font-weight: 800; color: #b3a394;
  text-transform: uppercase; letter-spacing: 0.07em;
}
.cfg__label-fila { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; margin-top: 4px; }
.cfg__label-nota { font-size: 12px; font-weight: 500; color: #b3a394; }

.cfg__input {
  width: 100%; height: 50px; padding: 0 14px; border-radius: 12px;
  border: 1.5px solid #e6dacd; background: #faf6f1; outline: none;
  font-size: 16px; font-weight: 600; color: #2c1a0e;
}
.cfg__input:focus { border-color: #e8621a; background: #ffffff; }
.cfg__input--codigo { height: 60px; text-align: center; font-size: 24px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; }

.cfg__sucursales { display: flex; flex-direction: column; gap: 8px; }
.cfg__sucursal { display: flex; gap: 8px; align-items: center; }
.cfg__quitar {
  flex-shrink: 0; width: 40px; height: 40px; border-radius: 50%; border: none; cursor: pointer;
  background: #f4ede5; color: #8a7362; font-size: 13px; font-weight: 700;
}
.cfg__agregar {
  align-self: flex-start; height: 40px; padding: 0 14px; border-radius: 10px; cursor: pointer;
  border: 1.5px dashed #e6dacd; background: #faf6f1; color: #6b5444; font-size: 14px; font-weight: 700;
}

.cfg__migrar {
  display: flex; flex-direction: column; gap: 10px; margin-top: 4px;
  padding: 14px; border-radius: 14px; background: #fdf6ee; border: 1px solid #f3e3cf;
}
.cfg__check { display: flex; gap: 12px; align-items: flex-start; cursor: pointer; }
.cfg__check-input { width: 22px; height: 22px; margin: 1px 0 0; accent-color: #2f8c4a; flex-shrink: 0; }
.cfg__check-textos { display: flex; flex-direction: column; gap: 2px; }
.cfg__check-titulo { font-size: 14.5px; font-weight: 700; color: #2c1a0e; }
.cfg__check-sub { font-size: 12.5px; font-weight: 500; color: #8a7362; line-height: 1.4; }
.cfg__chips { display: flex; flex-wrap: wrap; gap: 6px; }
.cfg__chip {
  height: 38px; padding: 0 14px; border-radius: 999px; cursor: pointer;
  border: 1.5px solid #e6dacd; background: #ffffff; color: #6b5444; font-size: 14px; font-weight: 700;
}
.cfg__chip--activo { border-color: #2c1a0e; background: #2c1a0e; color: #ffffff; }

.cfg__aviso { margin: 0; padding: 10px 12px; border-radius: 10px; background: #fdf3e1; font-size: 13.5px; font-weight: 600; color: #8a5a00; }
.cfg__aviso--error { background: #fdf1f0; color: #b3261e; }

.cfg__ok {
  margin-top: 4px; height: 54px; border: none; border-radius: 14px; cursor: pointer;
  background: #e8621a; color: #ffffff; font-size: 16.5px; font-weight: 800;
}
.cfg__ok:disabled { opacity: 0.55; cursor: not-allowed; }

.cfg__resumen { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.cfg__resumen-item {
  display: flex; flex-direction: column; align-items: center; gap: 2px;
  padding: 12px 6px; border-radius: 12px; background: #faf6f1;
}
.cfg__resumen-num { font-size: 22px; font-weight: 800; color: #2c1a0e; }
.cfg__resumen-txt { font-size: 12.5px; font-weight: 600; color: #8a7362; }
</style>