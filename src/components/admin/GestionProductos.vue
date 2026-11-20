<template>
  <div class="gp-overlay" @click.self="$emit('cerrar')">
    <div class="gp">

      <!-- ═══ LISTA ═══ -->
      <template v-if="!editando">
        <div class="gp__head">
          <div class="gp__head-textos">
            <h2 class="gp__titulo">Productos del POS</h2>
            <p class="gp__sub">Lo que se vende en caja. El menú de la página web no cambia.</p>
          </div>
          <button class="gp__cerrar" aria-label="Cerrar" @click="$emit('cerrar')">✕</button>
        </div>

        <p v-if="estadoCatalogo === 'vacio'" class="gp__aviso">
          Estás viendo el menú que ya traía el sistema. Al guardar tu primer cambio,
          se copia completo y desde ese momento lo administras aquí.
        </p>
        <p v-if="avisoError" class="gp__aviso gp__aviso--error">{{ avisoError }}</p>

        <div class="gp__barra">
          <input
            v-model="busqueda"
            type="search"
            class="gp__buscar"
            placeholder="Buscar producto"
            aria-label="Buscar producto"
          />
          <button class="gp__nuevo" :disabled="estadoCatalogo === 'cargando'" @click="abrirEditor(null)">
            Nuevo producto
          </button>
        </div>

        <div class="gp__filtros">
          <button
            v-for="c in ['Todas', ...todasLasCategorias]"
            :key="c"
            class="gp__filtro"
            :class="{ 'gp__filtro--activo': categoriaFiltro === c }"
            @click="categoriaFiltro = c"
          >{{ c }}</button>
        </div>

        <p v-if="estadoCatalogo === 'cargando'" class="gp__vacio">Cargando productos…</p>
        <p v-else-if="!productosVista.length" class="gp__vacio">No hay productos que coincidan.</p>

        <ul v-else class="gp__lista">
          <li
            v-for="(p, i) in productosVista"
            :key="p.id"
            class="gp-fila"
            :class="{ 'gp-fila--oculto': !p.activo }"
          >
            <!-- Ordenar (no mientras se busca: el orden no se entendería) -->
            <div v-if="!busqueda.trim()" class="gp-fila__orden">
              <button
                class="gp-fila__flecha"
                :disabled="i === 0"
                aria-label="Subir"
                @click="mover(p, -1)"
              ><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 15l6-6 6 6" /></svg></button>
              <button
                class="gp-fila__flecha"
                :disabled="i === productosVista.length - 1"
                aria-label="Bajar"
                @click="mover(p, 1)"
              ><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg></button>
            </div>

            <button class="gp-fila__cuerpo" @click="abrirEditor(p)">
              <span class="gp-fila__nombre">{{ p.nombre }}</span>
              <span class="gp-fila__detalle">
                {{ p.categoria }}
                <template v-if="p.opciones.length"> · {{ p.opciones.length }} opciones</template>
                <span v-if="!p.vaACocina" class="gp-etiqueta">Lo entrega caja</span>
                <span v-if="!p.activo" class="gp-etiqueta gp-etiqueta--oculto">Oculto</span>
              </span>
            </button>

            <span class="gp-fila__precio">
              <template v-if="p.opciones.length">desde </template>Q{{ p.precio }}
            </span>

            <button
              class="gp-switch"
              :class="{ 'gp-switch--on': p.activo }"
              role="switch"
              :aria-checked="p.activo"
              :aria-label="p.activo ? 'Visible en caja' : 'Oculto en caja'"
              :title="p.activo ? 'Visible en caja' : 'Oculto en caja'"
              @click="alternarVisible(p)"
            ><span class="gp-switch__bola"></span></button>
          </li>
        </ul>
      </template>

      <!-- ═══ EDITOR ═══ -->
      <template v-else>
        <div class="gp__head">
          <button class="gp__volver" @click="cerrarEditor">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 18l-6-6 6-6" /></svg>
            <span class="gp__volver-texto">Productos</span>
          </button>
          <button class="gp__cerrar" aria-label="Cerrar" @click="$emit('cerrar')">✕</button>
        </div>

        <h2 class="gp__titulo">{{ form.id ? 'Editar producto' : 'Nuevo producto' }}</h2>

        <div class="gp-form">
          <div class="gp-campo">
            <label class="gp-campo__label" for="gp-nombre">Nombre</label>
            <input id="gp-nombre" v-model="form.nombre" type="text" maxlength="60" class="gp-input"
              placeholder="Ej. Quesabirrias (3x)" />
          </div>

          <div class="gp-campo">
            <label class="gp-campo__label" for="gp-corto">
              Nombre en el pedido <span class="gp-campo__opcional">opcional</span>
            </label>
            <input id="gp-corto" v-model="form.nombreCorto" type="text" maxlength="40" class="gp-input"
              :placeholder="form.nombre || 'Igual que el nombre'" />
            <span class="gp-campo__ayuda">Cómo aparece en el pedido y en cocina. Si lo dejas vacío, se usa el nombre.</span>
          </div>

          <div class="gp-campo">
            <label class="gp-campo__label" for="gp-categoria">Categoría</label>
            <input id="gp-categoria" v-model="form.categoria" type="text" maxlength="40" class="gp-input"
              placeholder="Ej. Tacos" />
            <div v-if="todasLasCategorias.length" class="gp-chips">
              <button
                v-for="c in todasLasCategorias"
                :key="c"
                type="button"
                class="gp-chip"
                :class="{ 'gp-chip--activa': form.categoria === c }"
                @click="form.categoria = c"
              >{{ c }}</button>
            </div>
          </div>

          <!-- Precio o, si tiene opciones, un precio por opción -->
          <div class="gp-campo">
            <div class="gp-segmento" role="radiogroup" aria-label="Tipo de precio">
              <button type="button" class="gp-segmento__opcion"
                :class="{ 'gp-segmento__opcion--activa': !form.conOpciones }"
                role="radio" :aria-checked="!form.conOpciones"
                @click="usarOpciones(false)">Precio único</button>
              <button type="button" class="gp-segmento__opcion"
                :class="{ 'gp-segmento__opcion--activa': form.conOpciones }"
                role="radio" :aria-checked="form.conOpciones"
                @click="usarOpciones(true)">Con opciones</button>
            </div>
          </div>

          <div v-if="!form.conOpciones" class="gp-campo">
            <label class="gp-campo__label" for="gp-precio">Precio</label>
            <div class="gp-monto">
              <span class="gp-monto__q">Q</span>
              <input id="gp-precio" v-model.number="form.precio" type="number" inputmode="decimal"
                min="0" class="gp-monto__input" placeholder="0" />
            </div>
          </div>

          <div v-else class="gp-campo">
            <span class="gp-campo__label">Opciones</span>
            <span class="gp-campo__ayuda">Ej. Pollo / Res / Adobado, o 2x / 3x. Cada una con su precio.</span>
            <div class="gp-opciones">
              <div v-for="(op, i) in form.opciones" :key="i" class="gp-opcion">
                <input v-model="op.nombre" type="text" maxlength="30" class="gp-input gp-opcion__nombre"
                  :placeholder="`Opción ${i + 1}`" :aria-label="`Nombre de la opción ${i + 1}`" />
                <div class="gp-monto gp-monto--compacto">
                  <span class="gp-monto__q">Q</span>
                  <input v-model.number="op.precio" type="number" inputmode="decimal" min="0"
                    class="gp-monto__input" placeholder="0" :aria-label="`Precio de la opción ${i + 1}`" />
                </div>
                <button type="button" class="gp-opcion__quitar" aria-label="Quitar opción"
                  :disabled="form.opciones.length === 1" @click="form.opciones.splice(i, 1)">✕</button>
              </div>
            </div>
            <button type="button" class="gp-agregar-opcion" @click="agregarOpcion">Agregar opción</button>
          </div>

          <label class="gp-check">
            <input v-model="form.vaACocina" type="checkbox" class="gp-check__input" @change="cocinaTocada = true" />
            <span class="gp-check__textos">
              <span class="gp-check__titulo">Lo prepara cocina</span>
              <span class="gp-check__ayuda">Desmárcalo en bebidas y postres que entrega caja: así no llegan a la pantalla de Cocina.</span>
            </span>
          </label>

          <label class="gp-check">
            <input v-model="form.activo" type="checkbox" class="gp-check__input" />
            <span class="gp-check__textos">
              <span class="gp-check__titulo">Visible en caja</span>
              <span class="gp-check__ayuda">Desmárcalo si se agotó o salió del menú. Lo puedes volver a mostrar cuando quieras.</span>
            </span>
          </label>

          <ul v-if="errores.length" class="gp-errores">
            <li v-for="e in errores" :key="e" class="gp-errores__item">{{ e }}</li>
          </ul>
          <p v-if="avisoError" class="gp__aviso gp__aviso--error">{{ avisoError }}</p>

          <div class="gp-acciones">
            <button type="button" class="gp-acciones__cancelar" @click="cerrarEditor">Cancelar</button>
            <button type="button" class="gp-acciones__guardar" @click="guardar">
              {{ form.id ? 'Guardar cambios' : 'Crear producto' }}
            </button>
          </div>

          <!-- Eliminar: pide confirmación en el mismo lugar -->
          <div v-if="form.id" class="gp-eliminar">
            <button v-if="!confirmandoEliminar" type="button" class="gp-eliminar__link"
              @click="confirmandoEliminar = true">Eliminar producto</button>
            <div v-else class="gp-eliminar__confirmar">
              <span class="gp-eliminar__pregunta">
                ¿Eliminar "{{ form.nombre }}"? Si solo se agotó, mejor ocúltalo.
              </span>
              <div class="gp-eliminar__botones">
                <button type="button" class="gp-eliminar__no" @click="confirmandoEliminar = false">No</button>
                <button type="button" class="gp-eliminar__si" @click="eliminar">Eliminar</button>
              </div>
            </div>
          </div>
        </div>
      </template>

    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { useCatalogoPos } from '../../composables/useCatalogoPos.js'
import { CATEGORIAS_SIN_COCINA } from '../../utils/cocina.js'

defineEmits(['cerrar'])

const {
  estadoCatalogo, todosLosProductos, todasLasCategorias,
  crearProducto, actualizarProducto, cambiarVisibilidad, eliminarProducto, moverProducto
} = useCatalogoPos()

// ── Lista ──
const busqueda = ref('')
const categoriaFiltro = ref('Todas')
const avisoError = ref('')

function quitarAcentos(t) {
  return String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

const productosVista = computed(() => {
  const q = quitarAcentos(busqueda.value.trim())
  return todosLosProductos.value.filter(p =>
    (categoriaFiltro.value === 'Todas' || p.categoria === categoriaFiltro.value) &&
    (!q || quitarAcentos(`${p.nombre} ${p.nombreCorto} ${p.categoria}`).includes(q))
  )
})

// Si se borra o renombra la última categoría filtrada, vuelve a "Todas"
watch(todasLasCategorias, cats => {
  if (categoriaFiltro.value !== 'Todas' && !cats.includes(categoriaFiltro.value)) categoriaFiltro.value = 'Todas'
})

// Ejecuta un cambio y avisa en pantalla si algo falla
function intentar(accion) {
  avisoError.value = ''
  try {
    const promesa = accion()
    promesa?.catch?.(e => {
      console.error(e)
      avisoError.value = 'No se pudo guardar el cambio en el servidor. Revisa la conexión e intenta otra vez.'
    })
    return true
  } catch (e) {
    avisoError.value = e.message
    return false
  }
}

function mover(p, direccion) {
  intentar(() => moverProducto(p.id, direccion, productosVista.value.map(x => x.id)))
}

function alternarVisible(p) {
  intentar(() => cambiarVisibilidad(p.id, !p.activo))
}

// ── Editor ──
const editando = ref(false)
const confirmandoEliminar = ref(false)
const cocinaTocada = ref(false)
const errores = ref([])
const form = reactive({
  id: null, nombre: '', nombreCorto: '', categoria: '', precio: null,
  conOpciones: false, opciones: [], vaACocina: true, activo: true
})

function abrirEditor(p) {
  Object.assign(form, p
    ? {
        id: p.id, nombre: p.nombre, nombreCorto: p.nombreCorto, categoria: p.categoria,
        precio: p.opciones.length ? null : p.precio,
        conOpciones: p.opciones.length > 0,
        opciones: p.opciones.map(o => ({ ...o })),
        vaACocina: p.vaACocina, activo: p.activo
      }
    : {
        id: null, nombre: '', nombreCorto: '',
        categoria: categoriaFiltro.value !== 'Todas' ? categoriaFiltro.value : '',
        precio: null, conOpciones: false, opciones: [],
        vaACocina: !CATEGORIAS_SIN_COCINA.includes(categoriaFiltro.value),
        activo: true
      })
  cocinaTocada.value = !!p
  confirmandoEliminar.value = false
  errores.value = []
  avisoError.value = ''
  editando.value = true
}

function cerrarEditor() {
  editando.value = false
  errores.value = []
}

function usarOpciones(si) {
  form.conOpciones = si
  if (si && !form.opciones.length) {
    form.opciones = [{ nombre: '', precio: form.precio || null }, { nombre: '', precio: form.precio || null }]
  }
}

function agregarOpcion() {
  const ultimo = form.opciones[form.opciones.length - 1]
  form.opciones.push({ nombre: '', precio: ultimo?.precio ?? null })
}

// En un producto nuevo, la categoría sugiere si va a cocina (bebidas y
// postres no), mientras el cajero no haya tocado esa casilla.
watch(() => form.categoria, cat => {
  if (!cocinaTocada.value) form.vaACocina = !CATEGORIAS_SIN_COCINA.includes(cat.trim())
})

function validar() {
  const e = []
  if (!form.nombre.trim()) e.push('Escribe el nombre del producto.')
  if (!form.categoria.trim()) e.push('Elige o escribe una categoría.')
  if (form.conOpciones) {
    const llenas = form.opciones.filter(o => String(o.nombre || '').trim())
    if (!llenas.length) e.push('Agrega al menos una opción con nombre.')
    if (llenas.some(o => !(Number(o.precio) > 0))) e.push('Cada opción necesita un precio mayor a Q0.')
    const nombres = llenas.map(o => quitarAcentos(o.nombre.trim()))
    if (new Set(nombres).size !== nombres.length) e.push('Hay dos opciones con el mismo nombre.')
  } else if (!(Number(form.precio) > 0)) {
    e.push('Escribe un precio mayor a Q0.')
  }
  const repetido = todosLosProductos.value.find(p =>
    p.id !== form.id && quitarAcentos(p.nombre) === quitarAcentos(form.nombre.trim()))
  if (repetido) e.push(`Ya existe un producto llamado "${repetido.nombre}".`)
  return e
}

function guardar() {
  errores.value = validar()
  if (errores.value.length) return
  const datos = {
    nombre: form.nombre,
    nombreCorto: form.nombreCorto,
    categoria: form.categoria,
    precio: form.conOpciones ? null : form.precio,
    opciones: form.conOpciones ? form.opciones : [],
    vaACocina: form.vaACocina,
    activo: form.activo
  }
  const ok = intentar(() => form.id ? actualizarProducto(form.id, datos) : crearProducto(datos))
  if (ok) cerrarEditor()
}

function eliminar() {
  const ok = intentar(() => eliminarProducto(form.id))
  if (ok) cerrarEditor()
}
</script>

<style scoped>
/* Fuente propia: la global de la página (Amatic SC / 24px) no debe colarse.
   Cada texto lleva su propio font-size. */
.gp-overlay, .gp-overlay * { font-family: 'Plus Jakarta Sans', sans-serif !important; box-sizing: border-box; }

.gp-overlay {
  position: fixed; inset: 0; z-index: 1100;
  background: rgba(26,14,6,0.55);
  display: flex; align-items: flex-start; justify-content: center;
  padding: 24px 16px;
  -webkit-font-smoothing: antialiased;
}
.gp {
  background: #ffffff; border-radius: 22px; width: 100%; max-width: 720px;
  max-height: calc(100vh - 48px); overflow-y: auto;
  padding: 22px; display: flex; flex-direction: column; gap: 14px;
  box-shadow: 0 24px 60px rgba(26,14,6,0.25);
}
/* Que nada se aplaste: el modal hace scroll en vez de encoger las secciones */
.gp > * { flex-shrink: 0; }

/* Encabezado */
.gp__head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
.gp__head-textos { min-width: 0; }
.gp__titulo { margin: 0; font-size: 21px; font-weight: 800; color: #2c1a0e; }
.gp__sub { margin: 2px 0 0; font-size: 13.5px; font-weight: 600; color: #8a7362; }
.gp__cerrar {
  width: 36px; height: 36px; border-radius: 50%; border: none; flex-shrink: 0;
  background: #f4ede5; color: #6b5444; cursor: pointer; font-size: 15px; font-weight: 700;
}
.gp__volver {
  display: inline-flex; align-items: center; gap: 4px; height: 36px; padding: 0 12px 0 6px;
  border: none; border-radius: 10px; background: #f4ede5; color: #6b5444; cursor: pointer;
}
.gp__volver svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; }
.gp__volver-texto { font-size: 14px; font-weight: 700; }

.gp__aviso {
  margin: 0; padding: 10px 14px; border-radius: 12px;
  background: #fdf3e1; font-size: 13px; font-weight: 600; color: #8a5a00; line-height: 1.45;
}
.gp__aviso--error { background: rgba(204,0,0,0.06); color: #b30000; }

/* Barra: búsqueda + nuevo */
.gp__barra { display: flex; gap: 10px; }
.gp__buscar {
  flex: 1; min-width: 0; height: 46px; padding: 0 14px;
  border: 1.5px solid #e6dacd; border-radius: 12px; background: #ffffff;
  font-size: 15px; font-weight: 600; color: #2c1a0e; outline: none;
}
.gp__buscar::placeholder { font-size: 15px; font-weight: 500; color: #c9bbad; }
.gp__buscar:focus { border-color: #e8621a; box-shadow: 0 0 0 3px rgba(232,98,26,0.12); }
.gp__nuevo {
  height: 46px; padding: 0 18px; border: none; border-radius: 12px;
  background: #2c1a0e; color: #ffffff; font-size: 14.5px; font-weight: 800; cursor: pointer; white-space: nowrap;
}
.gp__nuevo:disabled { background: #e9e1d8; color: #b3a394; cursor: not-allowed; }

.gp__filtros { display: flex; gap: 6px; overflow-x: auto; padding-bottom: 2px; }
.gp__filtro {
  flex-shrink: 0; height: 34px; padding: 0 13px; border-radius: 999px;
  border: 1.5px solid #e6dacd; background: #ffffff; cursor: pointer;
  font-size: 13px; font-weight: 700; color: #6b5444; white-space: nowrap;
}
.gp__filtro--activo { border-color: #2c1a0e; background: #2c1a0e; color: #ffffff; }

.gp__vacio { margin: 0; padding: 28px 0; text-align: center; font-size: 14px; font-weight: 600; color: #a3948a; }

/* Lista */
.gp__lista { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
.gp-fila {
  display: flex; align-items: center; gap: 10px;
  min-height: 62px; padding: 6px 12px 6px 6px;
  border: 1px solid #efe6dc; border-radius: 14px; background: #ffffff;
}
.gp-fila--oculto { background: #faf6f1; }
.gp-fila--oculto .gp-fila__nombre, .gp-fila--oculto .gp-fila__precio { color: #a3948a; }
.gp-fila__orden { display: flex; flex-direction: column; gap: 2px; flex-shrink: 0; }
.gp-fila__flecha {
  width: 30px; height: 24px; border: none; border-radius: 7px; background: transparent;
  color: #8a7362; cursor: pointer; display: flex; align-items: center; justify-content: center;
}
.gp-fila__flecha:hover:not(:disabled) { background: #f4ede5; }
.gp-fila__flecha:disabled { color: #e2d6c9; cursor: default; }
.gp-fila__flecha svg { width: 16px; height: 16px; fill: none; stroke: currentColor; stroke-width: 2.4; stroke-linecap: round; stroke-linejoin: round; }
.gp-fila__cuerpo {
  flex: 1; min-width: 0; border: none; background: transparent; cursor: pointer; text-align: left;
  display: flex; flex-direction: column; gap: 2px; padding: 6px 6px;
  border-radius: 10px;
}
.gp-fila__cuerpo:hover { background: #faf6f1; }
.gp-fila__nombre {
  font-size: 15px; font-weight: 700; color: #2c1a0e;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.gp-fila__detalle {
  font-size: 12.5px; font-weight: 600; color: #a3948a;
  display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
}
.gp-etiqueta {
  font-size: 11px; font-weight: 700; color: #6b5444;
  background: #f4ede5; padding: 2px 7px; border-radius: 6px;
}
.gp-etiqueta--oculto { background: #efe5da; color: #8a7362; }
.gp-fila__precio {
  flex-shrink: 0; font-size: 15px; font-weight: 800; color: #2c1a0e; font-variant-numeric: tabular-nums;
}

/* Interruptor visible/oculto */
.gp-switch {
  flex-shrink: 0; position: relative; width: 46px; height: 28px; border-radius: 999px;
  border: none; background: #e2d6c9; cursor: pointer; transition: background 0.15s;
}
.gp-switch--on { background: #2f8c4a; }
.gp-switch__bola {
  position: absolute; top: 3px; left: 3px; width: 22px; height: 22px; border-radius: 50%;
  background: #ffffff; box-shadow: 0 1px 3px rgba(0,0,0,0.2); transition: transform 0.15s;
}
.gp-switch--on .gp-switch__bola { transform: translateX(18px); }

/* Formulario */
.gp-form { display: flex; flex-direction: column; gap: 16px; }
.gp-campo { display: flex; flex-direction: column; gap: 6px; }
.gp-campo__label {
  font-size: 11.5px; font-weight: 800; color: #b3a394;
  text-transform: uppercase; letter-spacing: 0.07em;
}
.gp-campo__opcional { font-size: 11.5px; font-weight: 600; color: #c9bbad; text-transform: none; letter-spacing: 0; margin-left: 4px; }
.gp-campo__ayuda { font-size: 12.5px; font-weight: 500; color: #a3948a; line-height: 1.4; }
.gp-input {
  width: 100%; height: 50px; padding: 0 14px;
  border: 1.5px solid #e6dacd; border-radius: 13px; background: #ffffff;
  font-size: 16px; font-weight: 600; color: #2c1a0e; outline: none;
}
.gp-input::placeholder { font-size: 15px; font-weight: 500; color: #c9bbad; }
.gp-input:focus { border-color: #e8621a; box-shadow: 0 0 0 3px rgba(232,98,26,0.12); }

.gp-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.gp-chip {
  height: 32px; padding: 0 12px; border-radius: 999px; border: 1.5px solid #e6dacd; background: #ffffff;
  font-size: 12.5px; font-weight: 700; color: #6b5444; cursor: pointer;
}
.gp-chip--activa { border-color: #e8621a; background: #fff6f0; color: #c04e10; }

.gp-segmento {
  display: grid; grid-template-columns: 1fr 1fr; gap: 4px;
  background: #f4ede5; border-radius: 13px; padding: 4px;
}
.gp-segmento__opcion {
  height: 42px; border: none; border-radius: 10px; background: transparent;
  font-size: 14.5px; font-weight: 700; color: #8a7362; cursor: pointer;
}
.gp-segmento__opcion--activa { background: #ffffff; color: #2c1a0e; box-shadow: 0 1px 2px rgba(44,26,14,0.08), 0 2px 8px rgba(44,26,14,0.06); }

.gp-monto {
  display: flex; align-items: center; gap: 6px; max-width: 220px;
  height: 50px; padding: 0 14px; border: 1.5px solid #e6dacd; border-radius: 13px; background: #ffffff;
}
.gp-monto:focus-within { border-color: #e8621a; box-shadow: 0 0 0 3px rgba(232,98,26,0.12); }
.gp-monto__q { font-size: 18px; font-weight: 700; color: #b3a394; }
.gp-monto__input {
  flex: 1; min-width: 0; height: 100%; border: none; outline: none; background: transparent;
  font-size: 18px; font-weight: 800; color: #2c1a0e; font-variant-numeric: tabular-nums;
}
.gp-monto__input::placeholder { font-size: 18px; font-weight: 700; color: #d6c7b8; }
.gp-monto--compacto { max-width: 130px; flex-shrink: 0; }

.gp-opciones { display: flex; flex-direction: column; gap: 8px; }
.gp-opcion { display: flex; align-items: center; gap: 8px; }
.gp-opcion__nombre { flex: 1; min-width: 0; }
.gp-opcion__quitar {
  width: 36px; height: 36px; flex-shrink: 0; border-radius: 50%; border: none;
  background: #f4ede5; color: #8a7362; font-size: 13px; font-weight: 700; cursor: pointer;
}
.gp-opcion__quitar:disabled { opacity: 0.35; cursor: default; }
.gp-agregar-opcion {
  align-self: flex-start; height: 38px; padding: 0 14px; border-radius: 10px;
  border: 1.5px dashed #dccbb9; background: #faf6f1; color: #6b5444;
  font-size: 13.5px; font-weight: 700; cursor: pointer;
}

.gp-check {
  display: flex; align-items: flex-start; gap: 12px; cursor: pointer;
  padding: 12px 14px; border: 1px solid #efe6dc; border-radius: 13px;
}
.gp-check__input { width: 22px; height: 22px; margin: 1px 0 0; accent-color: #2f8c4a; flex-shrink: 0; }
.gp-check__textos { display: flex; flex-direction: column; gap: 2px; }
.gp-check__titulo { font-size: 14.5px; font-weight: 700; color: #2c1a0e; }
.gp-check__ayuda { font-size: 12.5px; font-weight: 500; color: #a3948a; line-height: 1.4; }

.gp-errores {
  margin: 0; padding: 10px 14px 10px 30px; border-radius: 12px;
  background: rgba(204,0,0,0.06); display: flex; flex-direction: column; gap: 3px;
}
.gp-errores__item { font-size: 13px; font-weight: 600; color: #b30000; }

.gp-acciones { display: grid; grid-template-columns: 1fr 1.6fr; gap: 10px; }
.gp-acciones__cancelar {
  height: 52px; border-radius: 13px; border: 1.5px solid #e6dacd; background: #ffffff;
  font-size: 15px; font-weight: 700; color: #6b5444; cursor: pointer;
}
.gp-acciones__guardar {
  height: 52px; border-radius: 13px; border: none; background: #2f8c4a; color: #ffffff;
  font-size: 15.5px; font-weight: 800; cursor: pointer;
}
.gp-acciones__guardar:hover { background: #24733b; }

.gp-eliminar { border-top: 1px solid #f2ebe3; padding-top: 12px; }
.gp-eliminar__link {
  border: none; background: transparent; padding: 6px 0; cursor: pointer;
  font-size: 13.5px; font-weight: 700; color: #b30000;
}
.gp-eliminar__confirmar {
  display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
  padding: 10px 12px; border-radius: 12px; background: rgba(204,0,0,0.05);
}
.gp-eliminar__pregunta { flex: 1; min-width: 200px; font-size: 13.5px; font-weight: 700; color: #2c1a0e; }
.gp-eliminar__botones { display: flex; gap: 6px; }
.gp-eliminar__no, .gp-eliminar__si {
  height: 38px; padding: 0 14px; border-radius: 10px; font-size: 13px; font-weight: 800; cursor: pointer;
}
.gp-eliminar__no { border: 1px solid #e6dacd; background: #ffffff; color: #6b5444; }
.gp-eliminar__si { border: none; background: #cc0000; color: #ffffff; }

@media (max-width: 560px) {
  .gp { padding: 16px; }
  .gp__barra { flex-direction: column; }
  .gp-acciones { grid-template-columns: 1fr; }
}
</style>