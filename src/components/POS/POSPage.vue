<template>
  <div class="pos">

    <!-- ── NAVBAR SUPERIOR FIJO ── -->
    <header class="navbar">
      <button class="navbar__menu" @click="menuAbierto = true">
        <span></span><span></span><span></span>
      </button>

      <div class="navbar__divisor"></div>

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
        <span class="navbar__user-texto">En vivo</span>
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
  <div class="drawer__seccion-head">
    <p class="drawer__titulo">Turno actual</p>
    <span v-if="turnoActual" class="turno-badge">
      <span class="turno-badge__punto"></span>
      Abierto · {{ horaApertura }}
    </span>
  </div>

  <div v-if="turnoActual" class="turno-card">
    <div class="turno-total">
      <span class="turno-total__label">Total vendido</span>
      <span class="turno-total__valor">Q{{ ventasEfectivo + ventasTarjeta }}</span>
    </div>

    <div class="turno-grid">
      <div class="turno-stat">
        <span class="turno-stat__label">Fondo inicial</span>
        <strong class="turno-stat__valor">Q{{ turnoActual.fondoInicial }}</strong>
      </div>
      <div class="turno-stat">
        <span class="turno-stat__label">Pedidos</span>
        <strong class="turno-stat__valor">{{ pedidosTurno.length }}</strong>
      </div>
      <div class="turno-stat">
        <span class="turno-stat__label">Ventas en efectivo</span>
        <strong class="turno-stat__valor">Q{{ ventasEfectivo }}</strong>
      </div>
      <div class="turno-stat">
        <span class="turno-stat__label">Ventas con tarjeta</span>
        <strong class="turno-stat__valor">Q{{ ventasTarjeta }}</strong>
      </div>
      <div class="turno-stat turno-stat--fila">
        <span class="turno-stat__label">Gastos</span>
        <strong class="turno-stat__valor" :class="{ 'turno-stat__valor--gasto': totalGastos > 0 }">
          {{ totalGastos > 0 ? `−Q${totalGastos}` : 'Q0' }}
        </strong>
      </div>
    </div>

    <!-- Lo que debe haber físicamente en la caja: la tarjeta no se suma -->
    <div class="turno-caja">
      <div class="turno-caja__fila">
        <span class="turno-caja__label">Efectivo en caja</span>
        <span class="turno-caja__valor">Q{{ efectivoEsperado }}</span>
      </div>
      <span class="turno-caja__nota">Fondo + ventas en efectivo − gastos. Lo cobrado con tarjeta no se suma.</span>
    </div>
  </div>

  <p v-else class="drawer__sin-turno">No hay turno abierto</p>
</div>


<!-- <button class="drawer__btn" @click="probarImpresora">🖨️ Probar impresora</button> -->
<div class="drawer__acciones">
  <button class="drawer__btn drawer__btn--historial" @click="irAlHistorial">
    Historial de turnos
  </button>
  <button
    v-if="turnoActual"
    class="drawer__btn drawer__btn--gastos"
    @click="abrirGastos"
  >
    Gastos del turno
    <span v-if="gastosTurno.length" class="drawer__btn-contador">{{ gastosTurno.length }}</span>
  </button>
  <button
    v-if="turnoActual"
    class="drawer__btn drawer__btn--cerrar-turno"
    @click="intentarCerrarTurno"
  >
    Cerrar turno
  </button>
  <button class="drawer__btn drawer__btn--extras" @click="menuAbierto = false; modalGestionExtras = true">
    Gestionar extras
  </button>
  <button class="drawer__btn drawer__btn--limpiar" @click="borrarHistorialCompleto">
    Limpiar historial
  </button>
  <button class="drawer__btn drawer__btn--salir" @click="cerrarSesion">
    Cerrar sesión
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
              <div class="resumen__item-info" @click="abrirComentario(item)">
                <span class="resumen__item-nombre">{{ item.nombre }}</span>
                <span v-if="item.comentario || item.extras?.length" class="resumen__item-nota">
                  {{ descripcionNota(item) }}
                </span>
                <span v-else class="resumen__item-nota resumen__item-nota--vacia">+ Agregar nota o extra</span>
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
            <button class="btn btn--guardar" :disabled="!orden.length || guardando" @click="pedirNombre('guardar')">
              {{ guardando ? 'Guardando...' : (pedidoEditando ? 'Actualizar' : 'Guardar') }}
            </button>
            <button class="btn btn--comer" :disabled="!orden.length || guardando" @click="pedirNombre('local')">
              Comer acá
            </button>
            <button class="btn btn--cobrar" :disabled="!orden.length || guardando" @click="pedirNombre('cobrar')">
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
            <!-- Estado · etiquetas · tiempo -->
            <div class="pedido__top">
              <span class="pedido__estado" :class="`pedido__estado--${pedido.estado}`">
                <span class="pedido__estado-punto"></span>{{ textoEstado(pedido.estado) }}
              </span>
              <span v-if="!esDelTurnoActual(pedido)" class="pedido__previo">De antes del turno</span>
              <span class="pedido__tiempo">{{ formatTiempo(pedido.fecha) }}</span>
            </div>

            <!-- Cliente y número -->
            <div class="pedido__titulo">
              <span class="pedido__cliente">{{ pedido.cliente || 'Mostrador' }}</span>
              <!-- Si el nombre ya es "Orden #00X", la etiqueta repetiría el número -->
              <span
                v-if="pedido.numero && !(pedido.cliente || '').startsWith('Orden #')"
                class="pedido__numero"
              >#{{ String(pedido.numero).padStart(3, '0') }}</span>
            </div>
            <p class="pedido__meta">
              {{ pedido.sucursal || 'Mostrador' }}
              <span class="pedido__meta-sep">·</span>
              {{ pedido.tipoOrden === 'local' ? 'Comer acá' : 'Para llevar' }}
              <template v-if="pedido.origen !== 'pos'">
                <span class="pedido__meta-sep">·</span>
                <span class="pedido__web">Web</span>
              </template>
            </p>

            <p v-if="pedido.comentario" class="pedido__comentario">
              <span class="pedido__comentario-label">Nota</span>{{ pedido.comentario }}
            </p>

            <!-- Productos -->
            <ul class="pedido__productos">
              <li v-for="(prod, i) in pedido.productos" :key="i" class="pedido__producto">
                <span class="pedido__cant">{{ prod.cantidad }}×</span>
                <div class="pedido__producto-texto">
                  <span class="pedido__producto-nombre">
                    {{ prod.nombre }}
                    <span v-if="prod.cantidadNueva > 0" class="pedido__producto-badge-nuevo">+{{ prod.cantidadNueva }} nuevo</span>
                  </span>
                  <span v-if="prod.comentario || prod.extras?.length" class="pedido__producto-nota">
                    {{ [prod.extras?.map(nombreExtraConCantidad).join(', '), prod.comentario].filter(Boolean).join(' · ') }}
                  </span>
                </div>
                <span class="pedido__producto-precio">Q{{ prod.subtotal }}</span>
              </li>
            </ul>

            <!-- Pagos divididos -->
            <div v-if="pedido.pagos && pedido.pagos.length > 0" class="pedido__pagos">
              <span class="pedido__pagos-titulo">Pagos divididos</span>
              <div v-for="(pg, i) in pedido.pagos" :key="i" class="pedido__pago">
                <span class="pedido__pago-monto">
                  Q{{ pg.monto }}
                  <span class="pedido__pago-metodo">{{ pg.metodo === 'efectivo' ? 'Efectivo' : 'Tarjeta' }}</span>
                </span>
                <span class="pedido__pago-items">{{ pg.items.join(', ') }}</span>
              </div>
            </div>

            <!-- Total y estado del pago -->
            <div class="pedido__resumen">
              <div class="pedido__total-bloque">
                <span class="pedido__total-label">Total</span>
                <span class="pedido__total">Q{{ pedido.total }}</span>
              </div>
              <span
                v-if="pedido.pagado && (!pedido.pagos || pedido.pagos.length === 0)"
                class="pedido__pago-estado pedido__pago-estado--ok"
              >Pagado · {{ pedido.metodoPago === 'efectivo' ? 'Efectivo' : 'Tarjeta' }}</span>
              <span
                v-else-if="pedido.montoPagado > 0 && pedido.montoPagado < pedido.total"
                class="pedido__pago-estado pedido__pago-estado--parcial"
              >Pagado Q{{ pedido.montoPagado }} · Falta Q{{ pedido.total - pedido.montoPagado }}</span>
              <span v-else-if="pedido.pagado" class="pedido__pago-estado pedido__pago-estado--ok">Pagado</span>
              <span
                v-else-if="pedido.estado !== 'cancelado'"
                class="pedido__pago-estado pedido__pago-estado--pendiente"
              >Pendiente de pago</span>
            </div>

            <!-- Acciones -->
            <div class="pedido__acciones" @click.stop>
              <!-- Si el pedido tiene algo que cocina prepara, solo cocina lo
                   marca listo. Caja ve "En cocina" y, si lo toca, un aviso. -->
              <button
                v-if="(pedido.estado === 'nuevo' || pedido.estado === 'guardado') && necesitaCocina(pedido)"
                class="accion-btn accion-btn--en-cocina"
                @click="pedidoEnCocina = pedido"
              >
                <span class="accion-btn__punto"></span>En cocina
              </button>
              <!-- Solo bebidas/postres: cocina no hace nada, caja lo marca directo -->
              <button
                v-else-if="pedido.estado === 'nuevo' || pedido.estado === 'guardado'"
                class="accion-btn accion-btn--listo"
                @click="cambiarEstado(pedido.id, 'listo')"
              >Marcar listo</button>

              <button
                v-if="pedido.estado === 'listo' && !pedido.pagado"
                class="accion-btn accion-btn--cobrar"
                @click="cobrarPedidoExistente(pedido)"
              >Cobrar</button>

              <button
                v-if="pedido.estado === 'listo' && pedido.pagado"
                class="accion-btn accion-btn--entregar"
                @click="cambiarEstado(pedido.id, 'entregado')"
              >Entregar</button>

              <button
                v-if="pedido.estado !== 'cancelado' && pedido.estado !== 'entregado'"
                class="accion-btn accion-btn--cancelar"
                @click="pedidoACancelar = pedido"
              >Cancelar</button>
            </div>

            <p v-if="esEditable(pedido)" class="pedido__hint">Toca el pedido para editarlo</p>
          </div>
        </div>
      </div>

    </main>

    <!-- ── MODAL NOMBRE DEL PEDIDO ── -->
   <div v-if="modalNombre" class="cobro-overlay cobro-overlay--top" @click.self="cerrarModalNombre">
  <div class="nombre-modal">
    <div class="nombre-modal__head">
      <h2>Nombre del pedido</h2>
      <button class="nombre-modal__x" @click="cerrarModalNombre">✕</button>
    </div>

    <div class="nombre-modal__cuerpo">
      <input
        ref="inputNombre"
        v-model="nombrePedido"
        class="nombre-modal__input"
        type="text"
        maxlength="30"
        :placeholder="nombreSugerido"
        enterkeyhint="done"
        @keyup.enter="confirmarNombre"
      />

      <div class="nombre-modal__rapidos">
        <button v-for="n in nombresRapidos" :key="n" class="rapido-btn" @click="nombrePedido = n">
          {{ n }}
        </button>
      </div>
    </div>

    <button class="nombre-modal__ok" :disabled="guardando" @click="confirmarNombre">Continuar</button>
  </div>
</div>

    <!-- ── MODAL NOTA DEL PRODUCTO ── -->
    <div v-if="modalComentario" class="cobro-overlay cobro-overlay--top" @click.self="cerrarComentario">
      <div class="nombre-modal">
        <div class="nombre-modal__head">
          <h2>Nota para este producto</h2>
          <button class="nombre-modal__x" @click="cerrarComentario">✕</button>
        </div>

        <div class="nota-modal__cuerpo">
          <div v-if="extrasDelProducto.length" class="nota-modal__extras">
            <p class="nota-modal__extras-titulo">Extras</p>
            <div class="nota-modal__extras-lista">
              <div v-for="ex in extrasDelProducto" :key="ex.id" class="extra-fila">
                <div class="extra-fila__info">
                  <span class="extra-fila__nombre">{{ ex.nombre }}</span>
                  <span class="extra-fila__precio">+Q{{ ex.precio }} c/u</span>
                </div>
                <div class="extra-fila__ctrl">
                  <button
                    v-if="cantidadExtraSeleccionada(ex.id) > 0"
                    type="button"
                    class="extra-fila__btn"
                    @click="restarExtraSeleccionado(ex.id)"
                  >−</button>
                  <span v-if="cantidadExtraSeleccionada(ex.id) > 0" class="extra-fila__cantidad">
                    {{ cantidadExtraSeleccionada(ex.id) }}
                  </span>
                  <button
                    type="button"
                    class="extra-fila__btn extra-fila__btn--add"
                    @click="sumarExtraSeleccionado(ex)"
                  >+</button>
                </div>
              </div>
            </div>
          </div>

          <textarea
            v-model="comentarioTexto"
            class="nota-modal__input"
            rows="3"
            maxlength="80"
            placeholder="Ej: sin mayonesa"
          ></textarea>

          <div class="nombre-modal__rapidos">
            <button
              v-for="n in notasRapidas"
              :key="n"
              class="rapido-btn"
              @click="comentarioTexto = comentarioTexto ? `${comentarioTexto}, ${n}` : n"
            >
              {{ n }}
            </button>
          </div>
        </div>

        <div class="nota-modal__acciones">
          <button
            v-if="comentarioTexto || extrasSeleccionados.length"
            class="nota-modal__quitar"
            @click="quitarComentario"
          >
            Quitar todo
          </button>
          <button class="nombre-modal__ok" @click="guardarComentario">Guardar</button>
        </div>
      </div>
    </div>

    <!-- ── PANEL GESTIONAR EXTRAS ── -->
    <GestionExtras v-if="modalGestionExtras" @cerrar="modalGestionExtras = false" />

    <!-- ── MODAL SELECCIÓN DE OPCIÓN (carne) ── -->
    <Transition name="modal">
      <div v-if="productoConOpciones" class="cobro-overlay" @click.self="productoConOpciones = null">
        <div class="opciones-modal">
          <h2>{{ productoConOpciones.nombre }}</h2>
          <p class="opciones-modal__sub">Elige una opción</p>
          <div class="opciones-modal__lista">
            <button
              v-for="op in productoConOpciones.opciones"
              :key="op.nombre"
              class="opcion-btn"
              @click="confirmarOpcion(op)"
            >
              {{ op.nombre }}
               <span v-if="productoConOpciones.esFusion" class="opcion-btn__precio">Q{{ op.precio }}</span>
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
            <div class="cobro__header-textos">
              <h2 class="cobro__titulo">Cobrar pedido</h2>
              <p v-if="nombreParaCobro" class="cobro__sub">{{ nombreParaCobro }}</p>
            </div>
            <button class="cobro__cerrar" aria-label="Cerrar" @click="cerrarCobro">✕</button>
          </div>

          <div class="cobro__monto">
            <span class="cobro__monto-label">Total a pagar</span>
            <span class="cobro__monto-valor">Q{{ montoACobrar }}</span>
          </div>

          <!-- Método de pago -->
          <div class="segmento" role="radiogroup" aria-label="Método de pago">
            <button
              class="segmento__opcion"
              :class="{ 'segmento__opcion--activa': metodoPago === 'efectivo' }"
              role="radio"
              :aria-checked="metodoPago === 'efectivo'"
              @click="metodoPago = 'efectivo'"
            >
              <svg class="segmento__icono" viewBox="0 0 24 24" aria-hidden="true">
                <rect x="2.5" y="6" width="19" height="12" rx="2" />
                <circle cx="12" cy="12" r="2.6" />
                <path d="M6 9.5v5M18 9.5v5" />
              </svg>
              <span class="segmento__texto">Efectivo</span>
            </button>
            <button
              class="segmento__opcion"
              :class="{ 'segmento__opcion--activa': metodoPago === 'tarjeta' }"
              role="radio"
              :aria-checked="metodoPago === 'tarjeta'"
              @click="metodoPago = 'tarjeta'"
            >
              <svg class="segmento__icono" viewBox="0 0 24 24" aria-hidden="true">
                <rect x="2.5" y="5.5" width="19" height="13" rx="2" />
                <path d="M2.5 10h19M6 15h4" />
              </svg>
              <span class="segmento__texto">Tarjeta</span>
            </button>
          </div>

          <div v-if="metodoPago === 'efectivo'" class="cobro__efectivo">
            <label class="cobro__label" for="cobro-efectivo">
              Efectivo recibido
              <span class="cobro__label-opcional">Opcional · vacío = pago exacto</span>
            </label>
            <div class="campo-monto">
              <span class="campo-monto__prefijo">Q</span>
              <input
                id="cobro-efectivo"
                v-model.number="efectivoRecibido"
                type="number"
                inputmode="decimal"
                class="campo-monto__input"
                placeholder="0"
              />
            </div>
            <div class="sugerencias">
              <button
                v-for="s in sugerencias"
                :key="s"
                class="sug-btn"
                :class="{ 'sug-btn--activa': efectivoRecibido === s }"
                @click="efectivoRecibido = s"
              >
                <span class="sug-btn__monto">Q{{ s }}</span>
                <span v-if="s === montoACobrar" class="sug-btn__etiqueta">Exacto</span>
              </button>
            </div>
            <div v-if="efectivoRecibido >= montoACobrar" class="resultado resultado--cambio">
              <span class="resultado__label">Cambio a devolver</span>
              <span class="resultado__valor">Q{{ efectivoRecibido - montoACobrar }}</span>
            </div>
            <div v-else-if="efectivoRecibido > 0" class="resultado resultado--falta">
              <span class="resultado__label">Faltan</span>
              <span class="resultado__valor">Q{{ montoACobrar - efectivoRecibido }}</span>
            </div>
          </div>
          <p v-else class="cobro__nota-tarjeta">
            Cobra Q{{ montoACobrar }} en la terminal y confirma cuando el pago sea aprobado.
          </p>

          <div class="cobro__acciones">
            <button class="cobro__dividir" @click="abrirDividir">Dividir cuenta</button>
            <button class="cobro__confirmar" :disabled="!puedeConfirmar || guardando" @click="confirmarCobro">
              {{ guardando ? 'Cobrando...' : `Confirmar Q${montoACobrar}` }}
            </button>
          </div>
        </div>
      </div>
    </Transition>


    <!-- ── MODAL DIVIDIR CUENTA ── -->
<div v-if="modoDividir" class="dividir-overlay">
  <div class="dividir">

    <div class="dividir__head">
      <div class="dividir__head-textos">
        <h2 class="dividir__titulo">Dividir cuenta</h2>
        <p class="dividir__sub">Elige lo que paga cada persona y registra su pago.</p>
      </div>
      <button class="dividir__x" aria-label="Cerrar" @click="cerrarDividir">✕</button>
    </div>

    <div class="dividir__cuerpo">

      <!-- Columna productos -->
      <div class="dividir__col">
        <div class="dividir__col-head">
          <span class="dividir__label">Por cobrar</span>
          <div class="dividir__acciones-mini">
            <button v-if="itemsDisponibles.length" class="dividir__mini" @click="seleccionarTodos">Seleccionar todo</button>
            <button v-if="itemsSeleccionados.size" class="dividir__mini" @click="limpiarSeleccion">Quitar selección</button>
          </div>
        </div>

        <div class="dividir__items">
          <button
            v-for="item in itemsDisponibles"
            :key="item.uid"
            class="item-div"
            :class="{ 'item-div--sel': itemsSeleccionados.has(item.uid) }"
            @click="toggleItem(item.uid)"
          >
            <span class="item-div__check">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
            </span>
            <span class="item-div__nombre">{{ item.nombre }}</span>
            <span class="item-div__precio">Q{{ item.precio }}</span>
          </button>

          <p v-if="!itemsDisponibles.length" class="dividir__vacio">
            Todo está cobrado. Ya puedes finalizar.
          </p>
        </div>
      </div>

      <!-- Columna cobro -->
      <div class="dividir__col dividir__col--cobro">

        <div class="dividir__monto">
          <span class="dividir__monto-label">Paga esta persona</span>
          <span class="dividir__monto-valor">Q{{ totalSeleccionado }}</span>
        </div>

        <div class="segmento" role="radiogroup" aria-label="Método de pago">
          <button
            class="segmento__opcion"
            :class="{ 'segmento__opcion--activa': metodoPago === 'efectivo' }"
            role="radio"
            :aria-checked="metodoPago === 'efectivo'"
            @click="metodoPago = 'efectivo'"
          >
            <svg class="segmento__icono" viewBox="0 0 24 24" aria-hidden="true">
              <rect x="2.5" y="6" width="19" height="12" rx="2" />
              <circle cx="12" cy="12" r="2.6" />
              <path d="M6 9.5v5M18 9.5v5" />
            </svg>
            <span class="segmento__texto">Efectivo</span>
          </button>
          <button
            class="segmento__opcion"
            :class="{ 'segmento__opcion--activa': metodoPago === 'tarjeta' }"
            role="radio"
            :aria-checked="metodoPago === 'tarjeta'"
            @click="metodoPago = 'tarjeta'"
          >
            <svg class="segmento__icono" viewBox="0 0 24 24" aria-hidden="true">
              <rect x="2.5" y="5.5" width="19" height="13" rx="2" />
              <path d="M2.5 10h19M6 15h4" />
            </svg>
            <span class="segmento__texto">Tarjeta</span>
          </button>
        </div>

        <div v-if="metodoPago === 'efectivo' && totalSeleccionado > 0" class="dividir__efectivo">
          <div class="campo-monto campo-monto--compacto">
            <span class="campo-monto__prefijo">Q</span>
            <input
              v-model.number="efectivoParcial"
              type="number"
              inputmode="decimal"
              class="campo-monto__input"
              placeholder="Recibido (opcional)"
            />
          </div>
          <div class="sugerencias">
            <button
              v-for="s in sugerenciasParcial"
              :key="s"
              class="sug-btn"
              :class="{ 'sug-btn--activa': efectivoParcial === s }"
              @click="efectivoParcial = s"
            >
              <span class="sug-btn__monto">Q{{ s }}</span>
              <span v-if="s === totalSeleccionado" class="sug-btn__etiqueta">Exacto</span>
            </button>
          </div>
          <div v-if="efectivoParcial >= totalSeleccionado" class="resultado resultado--cambio">
            <span class="resultado__label">Cambio</span>
            <span class="resultado__valor">Q{{ efectivoParcial - totalSeleccionado }}</span>
          </div>
        </div>

        <button
          class="dividir__cobrar"
          :disabled="!puedeCobrarParcial"
          @click="cobrarParcial"
        >
          {{ totalSeleccionado > 0 ? `Registrar pago · Q${totalSeleccionado}` : 'Selecciona productos' }}
        </button>

        <!-- Pagos registrados -->
        <div v-if="pagosRealizados.length" class="dividir__pagos">
          <span class="dividir__label">Pagos registrados</span>
          <div v-for="(p, i) in pagosRealizados" :key="i" class="pago-row">
            <span class="pago-row__num">{{ i + 1 }}</span>
            <div class="pago-row__info">
              <span class="pago-row__monto">
                Q{{ p.monto }}
                <span class="pago-row__metodo">{{ p.metodo === 'efectivo' ? 'Efectivo' : 'Tarjeta' }}</span>
              </span>
              <span class="pago-row__items">{{ p.items.join(', ') }}</span>
            </div>
            <button class="pago-row__x" aria-label="Quitar pago" @click="quitarPago(i)">✕</button>
          </div>
        </div>

      </div>
    </div>

    <div class="dividir__footer">
      <div class="dividir__progreso">
        <div class="dividir__progreso-textos">
          <span class="dividir__cobrado">
            Cobrado Q{{ totalCobradoParcial }}
            <span class="dividir__de">de Q{{ montoACobrar }}</span>
          </span>
          <span v-if="faltaPorCobrar > 0" class="dividir__falta">Falta Q{{ faltaPorCobrar }}</span>
          <span v-else class="dividir__ok">Cuenta completa</span>
        </div>
        <div class="dividir__barra">
          <div class="dividir__barra-relleno" :style="{ width: porcentajeCobrado + '%' }"></div>
        </div>
      </div>
      <button
        class="dividir__confirmar"
        :disabled="!pagosRealizados.length || guardando"
        @click="confirmarDivision"
      >
        {{ guardando ? 'Guardando...' : 'Finalizar' }}
      </button>
    </div>

  </div>
</div>

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

    <!-- ── AVISO: PEDIDO TODAVÍA EN COCINA ── -->
    <div v-if="pedidoEnCocina" class="cobro-overlay" @click.self="pedidoEnCocina = null">
      <div class="confirmar-modal">
        <h2 class="confirmar-modal__titulo">Todavía en preparación</h2>
        <p class="confirmar-modal__texto">
          El pedido de <strong>{{ pedidoEnCocina.cliente }}</strong> sigue en cocina.
          Se marca como listo desde la pantalla de Cocina cuando lo terminen.
        </p>
        <button class="confirmar-modal__principal" @click="pedidoEnCocina = null">
          Entendido
        </button>
        <!-- Salida de emergencia: por si la tablet de cocina falla o se apaga -->
        <button class="confirmar-modal__secundario" @click="forzarListo">
          Marcar listo de todos modos
        </button>
      </div>
    </div>

    <!-- ── CONFIRMAR CANCELACIÓN ── -->
    <div v-if="pedidoACancelar" class="cobro-overlay" @click.self="pedidoACancelar = null">
      <div class="confirmar-modal">
        <h2 class="confirmar-modal__titulo">¿Cancelar este pedido?</h2>
        <p class="confirmar-modal__texto">
          El pedido de <strong>{{ pedidoACancelar.cliente }}</strong> se va a cancelar
          y se quitará de Cocina.
        </p>
        <button class="confirmar-modal__principal" @click="pedidoACancelar = null">
          No, mantener pedido
        </button>
        <button class="confirmar-modal__peligro" @click="confirmarCancelacion">
          Sí, cancelar pedido
        </button>
      </div>
    </div>

    <!-- ── AVISO DE ERROR AL GUARDAR ── -->
    <!-- Se queda en pantalla hasta que el cajero lo cierre, para que no se
         pierda en medio de la carrera si un pedido no se pudo guardar. -->
    <Transition name="modal">
      <div v-if="avisoError" class="aviso-error" role="alert">
        <span class="aviso-error__texto">{{ avisoError }}</span>
        <button class="aviso-error__x" @click="avisoError = ''">✕</button>
      </div>
    </Transition>

    <!-- ── MODAL ABRIR TURNO (bloqueante) ── -->
<div v-if="!cargandoTurno && !turnoActual" class="turno-overlay">
  <div class="turno-modal">
    <h2>Abrir turno</h2>
    <p class="turno-modal__sub">
      Debes abrir un turno para poder registrar ventas
    </p>

    <label class="turno-modal__label">Efectivo inicial en caja</label>
    <input
      v-model.number="fondoInicial"
      type="number"
      class="turno-modal__input"
      placeholder="0"
      @keyup.enter="abrirTurno"
    />

    <div class="turno-modal__rapidos">
      <button class="tr-btn" @click="fondoInicial = 0">Sin fondo (Q0)</button>
      <button class="tr-btn" @click="fondoInicial = 100">Q100</button>
      <button class="tr-btn" @click="fondoInicial = 200">Q200</button>
      <button class="tr-btn" @click="fondoInicial = 500">Q500</button>
    </div>

    <button class="turno-modal__ok" @click="abrirTurno">
      Abrir turno
    </button>
  </div>
</div>

<!-- ── MODAL GASTOS DEL TURNO ── -->
<div v-if="modalGastos" class="cobro-overlay cobro-overlay--top" @click.self="modalGastos = false">
  <div class="gastos">
    <div class="gastos__head">
      <div class="gastos__head-textos">
        <h2 class="gastos__titulo">Gastos del turno</h2>
        <p class="gastos__sub">Dinero que sale de la caja: compras, pagos o retiros.</p>
      </div>
      <button class="cobro__cerrar" aria-label="Cerrar" @click="modalGastos = false">✕</button>
    </div>

    <!-- Registrar un gasto -->
    <div class="gastos__form">
      <div class="gastos__campos">
        <div class="gastos__campo">
          <label class="cobro__label" for="gasto-monto">Monto</label>
          <div class="campo-monto campo-monto--compacto">
            <span class="campo-monto__prefijo">Q</span>
            <input
              id="gasto-monto"
              v-model.number="gastoMonto"
              type="number"
              inputmode="decimal"
              class="campo-monto__input"
              placeholder="0"
            />
          </div>
        </div>
        <div class="gastos__campo gastos__campo--concepto">
          <label class="cobro__label" for="gasto-concepto">Concepto</label>
          <input
            id="gasto-concepto"
            v-model="gastoConcepto"
            type="text"
            maxlength="40"
            enterkeyhint="done"
            class="gastos__concepto"
            placeholder="Ej. carne, gas, proveedor"
            @keyup.enter="registrarGasto"
          />
        </div>
      </div>
      <div class="gastos__chips">
        <button
          v-for="c in conceptosRapidosGasto"
          :key="c"
          class="gastos__chip"
          :class="{ 'gastos__chip--activo': gastoConcepto === c }"
          @click="gastoConcepto = c"
        >{{ c }}</button>
      </div>
      <button class="gastos__registrar" :disabled="!puedeRegistrarGasto" @click="registrarGasto">
        {{ puedeRegistrarGasto ? `Registrar gasto · Q${Number(gastoMonto)}` : 'Registrar gasto' }}
      </button>
    </div>

    <!-- Gastos ya registrados -->
    <div class="gastos__lista">
      <span class="cobro__label">Registrados en este turno</span>
      <p v-if="!gastosTurno.length" class="gastos__vacio">Todavía no hay gastos en este turno.</p>
      <div v-for="g in gastosTurno" :key="g.id" class="gasto-row" :class="{ 'gasto-row--confirmando': gastoAEliminar === g.id }">
        <template v-if="gastoAEliminar !== g.id">
          <div class="gasto-row__info">
            <span class="gasto-row__concepto">{{ g.concepto }}</span>
            <span class="gasto-row__hora">{{ formatHora(g.fecha) }}</span>
          </div>
          <span class="gasto-row__monto">−Q{{ g.monto }}</span>
          <button class="pago-row__x" aria-label="Eliminar gasto" @click="gastoAEliminar = g.id">✕</button>
        </template>
        <template v-else>
          <span class="gasto-row__pregunta">¿Eliminar "{{ g.concepto }}" de Q{{ g.monto }}?</span>
          <div class="gasto-row__confirmar">
            <button class="gasto-row__no" @click="gastoAEliminar = null">No</button>
            <button class="gasto-row__si" @click="eliminarGasto(g.id)">Eliminar</button>
          </div>
        </template>
      </div>
    </div>

    <div class="gastos__resumen">
      <div class="gastos__resumen-fila">
        <span class="gastos__resumen-label">Total gastos</span>
        <span class="gastos__resumen-valor">Q{{ totalGastos }}</span>
      </div>
      <div class="gastos__resumen-fila gastos__resumen-fila--caja">
        <span class="gastos__resumen-label">Efectivo en caja</span>
        <span class="gastos__resumen-valor">Q{{ efectivoEsperado }}</span>
      </div>
    </div>
  </div>
</div>

<!-- ── MODAL CERRAR TURNO ── -->
<div v-if="modalCerrarTurno" class="turno-overlay" @click.self="modalCerrarTurno = false">
  <div class="turno-modal">
    <h2>Cerrar turno</h2>
    <p class="turno-modal__sub">Cuenta el efectivo en caja</p>

    <div class="cierre-resumen">
      <div class="cierre-total">
        <span class="cierre-total__label">Debería haber en caja</span>
        <span class="cierre-total__valor">Q{{ efectivoEsperado }}</span>
      </div>

      <div class="cierre-grid">
        <div class="cierre-stat">
          <span class="cierre-stat__label">Fondo inicial</span>
          <strong class="cierre-stat__valor">Q{{ turnoActual?.fondoInicial || 0 }}</strong>
        </div>
        <div class="cierre-stat">
          <span class="cierre-stat__label">Ventas efectivo</span>
          <strong class="cierre-stat__valor">Q{{ ventasEfectivo }}</strong>
        </div>
        <div class="cierre-stat">
          <span class="cierre-stat__label">Gastos</span>
          <strong class="cierre-stat__valor" :class="{ 'cierre-stat__valor--gasto': totalGastos > 0 }">
            {{ totalGastos > 0 ? `−Q${totalGastos}` : 'Q0' }}
          </strong>
        </div>
        <div class="cierre-stat">
          <span class="cierre-stat__label">Ventas tarjeta</span>
          <strong class="cierre-stat__valor">Q{{ ventasTarjeta }}</strong>
        </div>
        <div class="cierre-stat">
          <span class="cierre-stat__label">Total vendido</span>
          <strong class="cierre-stat__valor">Q{{ ventasEfectivo + ventasTarjeta }}</strong>
        </div>
        <div class="cierre-stat">
          <span class="cierre-stat__label">Pedidos</span>
          <strong class="cierre-stat__valor">{{ pedidosTurno.length }}</strong>
        </div>
      </div>
      <p class="cierre-nota">
        En caja = fondo + ventas en efectivo − gastos. Lo cobrado con tarjeta no está en la caja.
      </p>
    </div>

    <label class="turno-modal__label">Efectivo contado en caja</label>
    <input
      v-model.number="efectivoContado"
      type="number"
      class="turno-modal__input"
      placeholder="0"
    />

    <div
      v-if="efectivoContado !== null && efectivoContado !== ''"
      class="cierre-diferencia"
      :class="{
        'cierre-diferencia--ok': diferenciaCaja === 0,
        'cierre-diferencia--falta': diferenciaCaja < 0,
        'cierre-diferencia--sobra': diferenciaCaja > 0
      }"
    >
      <span v-if="diferenciaCaja === 0">Caja cuadrada</span>
      <span v-else-if="diferenciaCaja < 0">Faltan Q{{ Math.abs(diferenciaCaja) }}</span>
      <span v-else>Sobran Q{{ diferenciaCaja }}</span>
    </div>
    <p v-else class="cierre-sin-conteo">
      Si cierras sin escribir lo contado, el turno queda en el historial como "sin conteo".
    </p>

    <div class="turno-modal__acciones">
      <button class="turno-modal__cancelar" @click="modalCerrarTurno = false">
        Cancelar
      </button>
      <button class="turno-modal__ok" @click="cerrarTurno">
        Confirmar cierre
      </button>
    </div>
  </div>
</div>

<!-- ── MODAL PEDIDOS PENDIENTES ── -->
<div v-if="modalPendientes" class="turno-overlay" @click.self="modalPendientes = false">
  <div class="turno-modal">
    <h2>Pedidos pendientes</h2>
    <p class="turno-modal__sub">
      No puedes cerrar el turno con {{ pedidosPendientes.length }}
      pedido{{ pedidosPendientes.length !== 1 ? 's' : '' }} sin resolver
    </p>

    <div class="pendientes-lista">
      <div v-for="p in pedidosPendientes" :key="p.id" class="pendiente-item">
        <span class="pendiente-item__nombre">{{ p.cliente }}</span>
        <span class="pendiente-item__estado">{{ etiquetaEstado(p.estado) }}</span>
        <span class="pendiente-item__total">Q{{ p.total }}</span>
      </div>
    </div>

    <button class="turno-modal__ok" @click="modalPendientes = false; tabActivo = 'activos'">
      Ver pedidos
    </button>
  </div>
</div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { signOut } from 'firebase/auth'
import productosData from '../../assets/data/productos.json'
import { db, auth } from '../../firebase.js'
import { reiniciarContadorPedidos, registrarNumeroUsado } from '../../utils/pedidosNumero.js'
import { vaACocina, pedidoNecesitaCocina } from '../../utils/cocina.js'
import {
  collection, onSnapshot, doc, updateDoc, setDoc, arrayUnion, orderBy,
  query, serverTimestamp, writeBatch, getDocs, getDoc, where, limit
} from 'firebase/firestore'
import { useExtras } from '../../composables/useExtras.js'
import GestionExtras from '../admin/GestionExtras.vue'

//import { imprimirTicketCocina, probarImpresora } from '../../impresora.js'

const nombresCortosPos = {
  5:'Quesadillas',
  6: 'Quesadilla Peperonne y Jamon'
}

// Posición en la cuadrícula del POS para productos que se agregaron
// después y que deben quedar junto a sus parecidos (por defecto se
// ordenan por id). Ej: el Burrito de Pasta (21) junto al de Pollo (14).
const posicionesPos = {
  21: 14.5
}

// Qué prepara cocina y qué despacha caja (bebidas, postres) vive en
// utils/cocina.js, compartido con CocinaView.vue. Si lo único que se
// agrega a un pedido ya "listo" es bebida/postre, el pedido se queda en
// "listo" y no vuelve a aparecer en la pantalla de Cocina.

// ── Productos fusionados solo para el POS ──
// `posicion` = dónde aparece el botón en la cuadrícula (los productos
// normales se ordenan por su id; 2.5 = entre el id 2 y el 3, etc.)
const fusionesPOS = [
  {
    id: 'tortilla-grande',
    nombre: 'Tortilla Grande',
    categoria: 'Tortillas de Harina',
    posicion: 2.5,            // después de Tortilla Pequeña
    reemplaza: [2, 3],        // ids que oculta del grid
    opciones: [
      { nombre: 'Pollo',   precio: 31 },
      { nombre: 'Adobado', precio: 31 },
      { nombre: 'Res',     precio: 33 }
    ]
  },
  {
    id: 'gringas',
    nombre: 'Gringas',
    categoria: 'Tacos',
    posicion: 10.5,           // después de Tacos de Res
    reemplaza: [19, 20],      // ids que oculta del grid
    opciones: [
      { nombre: '2x', precio: 25 },
      { nombre: '3x', precio: 35 }
    ]
  },
  {
    id: 'yogurt',
    nombre: 'Yogurt',
    categoria: 'Postres',
    posicion: 15.5,           // junto a Gelatina, con los postres
    reemplaza: [16, 17, 18],  // ids que oculta del grid
    opciones: [
      { nombre: 'Pequeño', precio: 6 },
      { nombre: 'Mediano', precio: 25 },
      { nombre: 'Grande',  precio: 40 }
    ]
  }
]

// Lista de productos que ve el POS
const productosPOS = computed(() => {
  const ocultos = fusionesPOS.flatMap(f => f.reemplaza)

  // Productos normales (sin los que se fusionaron)
  const normales = productosData
    .filter(p => !ocultos.includes(p.id))
    .map(p => ({
      ...p,
      nombreCorto: nombresCortosPos[p.id] || p.nombre,
      // Convierte opciones simples a objetos con precio
      opciones: p.opciones
        ? p.opciones.map(o => ({ nombre: o, precio: p.precio }))
        : null
    }))

  // Agrega las fusiones y ordena todo por posición
  const resultado = [...normales]
  fusionesPOS.forEach(f => {
    const precioBase = Math.min(...f.opciones.map(o => o.precio))
    resultado.push({ ...f, precio: precioBase, esFusion: true })
  })

  const posicionDe = p =>
    p.esFusion ? p.posicion : (posicionesPos[p.id] ?? p.id)

  return resultado.sort((a, b) => posicionDe(a) - posicionDe(b))
})

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

// ── Turno ──
const turnoActual = ref(null)
const cargandoTurno = ref(true)
const modalAbrirTurno = ref(false)
const modalCerrarTurno = ref(false)
const modalPendientes = ref(false)
const fondoInicial = ref(null)
const efectivoContado = ref(null)
let unsubTurno = null

const horaApertura = computed(() => {
  if (!turnoActual.value?.fechaApertura?.toDate) return '—'
  return turnoActual.value.fechaApertura.toDate()
    .toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' })
})

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
const nombreSugerido = ref('')   // "Orden #005", se muestra en gris en el campo
const nombreParaCobro = ref('')
const nombresRapidos = ['Familia', 'Para llevar', 'Grupo', 'Pareja comer aca']

// ── Nota por producto ──
const modalComentario = ref(false)
const modalGestionExtras = ref(false)
const { escucharExtras, detenerExtras, extrasParaProducto } = useExtras()
const itemComentarioKey = ref(null)
const comentarioTexto = ref('')
const extrasSeleccionados = ref([])
const notasRapidas = ['Sin mayonesa', 'Sin cebolla', 'Sin queso', 'Extra picante', 'Bien cocido']

// Extras del catálogo que aplican a este producto específico (por id, no por categoría:
// así "taco extra res" no aparece al editar una porción de tacos al pastor)
const extrasDelProducto = computed(() => {
  const item = orden.value.find(i => i.key === itemComentarioKey.value)
  return item ? extrasParaProducto(item.id) : []
})

function cantidadExtraSeleccionada(id) {
  return extrasSeleccionados.value.find(e => e.id === id)?.cantidad || 0
}

function sumarExtraSeleccionado(ex) {
  const existe = extrasSeleccionados.value.find(e => e.id === ex.id)
  if (existe) existe.cantidad++
  else extrasSeleccionados.value.push({ id: ex.id, nombre: ex.nombre, precio: ex.precio, cantidad: 1 })
}

function restarExtraSeleccionado(id) {
  const existe = extrasSeleccionados.value.find(e => e.id === id)
  if (!existe) return
  if (existe.cantidad > 1) existe.cantidad--
  else extrasSeleccionados.value = extrasSeleccionados.value.filter(e => e.id !== id)
}

// Texto combinado que se ve debajo del nombre del producto en el resumen
function nombreExtraConCantidad(e) {
  return e.cantidad > 1 ? `${e.cantidad}x ${e.nombre}` : e.nombre
}

function descripcionNota(item) {
  const partes = []
  if (item.extras?.length) partes.push(item.extras.map(nombreExtraConCantidad).join(', '))
  if (item.comentario) partes.push(item.comentario)
  return '📝 ' + partes.join(' · ')
}

// ── Alerta ──
const hayPedidoNuevo = ref(false)
const ultimoPedido = ref(null)
const pedidosAnteriores = ref(new Set())
const primeraCarga = ref(true)

// ── Cobro ──
const cobroPedidoId = ref(null)
const cobroAbierto = ref(false)
const metodoPago = ref('efectivo')
const efectivoRecibido = ref(null)

// ── División de cuenta ──
const modoDividir = ref(false)
const itemsSeleccionados = ref(new Set())
const itemsPagados = ref(new Set())
const pagosRealizados = ref([])
const efectivoParcial = ref(null)


// ── Categorías ──
const categorias = computed(() => {
  const cats = [...new Set(productosData.map(p => p.categoria))]
  return ['Todo', ...cats]
})

const productosFiltrados = computed(() =>
  categoriaActiva.value === 'Todo'
    ? productosPOS.value
    : productosPOS.value.filter(p => p.categoria === categoriaActiva.value)
)

// ── Tabs ──
const enProceso = ['nuevo', 'guardado', 'listo']

const contadorActivos = computed(() =>
  pedidos.value.filter(p =>
    esVisibleEnCurso(p) && (
      (p.tipoOrden !== 'local' && enProceso.includes(p.estado)) ||
      (p.tipoOrden === 'local' && ['nuevo', 'guardado'].includes(p.estado))
    )
  ).length
)

const contadorLocal = computed(() =>
  pedidos.value.filter(p =>
    esVisibleEnCurso(p) && enProceso.includes(p.estado) && p.tipoOrden === 'local'
  ).length
)

const tabs = computed(() => [
  { id: 'pos',        label: 'POS',        contador: 0 },
  { id: 'activos',    label: 'Activos',    contador: contadorActivos.value },
  { id: 'local',      label: 'Comer acá',  contador: contadorLocal.value },
  { id: 'entregados', label: 'Entregados', contador: 0 },
  { id: 'cancelados', label: 'Cancelados', contador: 0 },
])

// ── Solo pedidos del turno actual ──
// Un pedido es del turno si se creó después de la apertura, o si se
// guardó/cobró en este turno (turnoId). Lo segundo cubre, por ejemplo, un
// pedido web de la noche anterior que se atiende y se cobra hoy: así su
// dinero sí cuenta en el cierre de este turno.
function esDelTurnoActual(p) {
  if (!turnoActual.value) return false
  if (p.turnoId && p.turnoId === turnoActual.value.id) return true
  if (!turnoActual.value.fechaApertura?.toDate) return false
  if (!p.fecha?.toDate) return false
  return p.fecha.toDate() >= turnoActual.value.fechaApertura.toDate()
}

// Activos y Comer acá muestran también los pendientes de antes del turno.
// Un pedido sin atender nunca debe quedar invisible en el POS (antes solo
// aparecía en Cocina y bloqueaba el cierre de turno sin poder verlo).
function esVisibleEnCurso(p) {
  return esDelTurnoActual(p) || enProceso.includes(p.estado)
}

// Del más viejo al más nuevo (igual que Cocina): el pedido #001 se queda
// primero y los nuevos se van agregando después. La consulta de Firestore
// trae los pedidos del más nuevo al más viejo, por eso hay que reordenar.
function porFechaAscendente(a, b) {
  const ta = a.fecha?.toDate ? a.fecha.toDate().getTime() : Number.MAX_SAFE_INTEGER
  const tb = b.fecha?.toDate ? b.fecha.toDate().getTime() : Number.MAX_SAFE_INTEGER
  return ta - tb
}

const pedidosVista = computed(() => {
  const delTurno = pedidos.value.filter(esDelTurnoActual)
  const enCurso = pedidos.value.filter(esVisibleEnCurso)

  if (tabActivo.value === 'activos')
    return enCurso.filter(p =>
      (p.tipoOrden !== 'local' && enProceso.includes(p.estado)) ||
      (p.tipoOrden === 'local' && ['nuevo', 'guardado'].includes(p.estado))
    ).sort(porFechaAscendente)
  if (tabActivo.value === 'local')
    return enCurso
      .filter(p => enProceso.includes(p.estado) && p.tipoOrden === 'local')
      .sort(porFechaAscendente)
  if (tabActivo.value === 'entregados')
    return delTurno.filter(p => p.estado === 'entregado')
  if (tabActivo.value === 'cancelados')
    return delTurno.filter(p => p.estado === 'cancelado')
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
  const nombreOp = opcion?.nombre || null
  const precio = opcion?.precio ?? producto.precio
  const base = producto.nombreCorto || producto.nombre
  const nombreCompleto = nombreOp ? `${base} ${nombreOp}` : base

  const key = nombreOp ? `${producto.id}-${nombreOp}` : `${producto.id}`
  const existe = orden.value.find(i => i.key === key)

  if (existe) existe.cantidad++
  else orden.value.push({
    id: producto.id,
    nombre: nombreCompleto,
    categoria: producto.categoria,
    precio,
    precioBase: precio,
    opcion: nombreOp,
    key,
    cantidad: 1,
    comentario: '',
    extras: []
  })
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

// ── Nota por producto ──
function abrirComentario(item) {
  itemComentarioKey.value = item.key
  comentarioTexto.value = item.comentario || ''
  extrasSeleccionados.value = item.extras ? [...item.extras] : []
  modalComentario.value = true
}

function guardarComentario() {
  const item = orden.value.find(i => i.key === itemComentarioKey.value)
  if (item) {
    item.comentario = comentarioTexto.value.trim()
    item.extras = [...extrasSeleccionados.value]
    const totalExtras = item.extras.reduce((suma, e) => suma + e.precio * (e.cantidad || 1), 0)
    item.precio = (item.precioBase ?? item.precio) + totalExtras
  }
  modalComentario.value = false
}

function quitarComentario() {
  comentarioTexto.value = ''
  extrasSeleccionados.value = []
  guardarComentario()
}

function cerrarComentario() {
  modalComentario.value = false
}

// ── Candado de guardado y avisos de error ──
// Mientras se guarda o se cobra, los botones quedan desactivados: así
// un toque extra no vuelve a ejecutar el guardado (y no hay pedidos
// dobles). Si algo falla, se muestra un aviso en vez de fallar en silencio.
const guardando = ref(false)
const avisoError = ref('')

function mostrarAviso(mensaje) {
  avisoError.value = mensaje
}

async function conCandado(accion) {
  if (guardando.value) return
  guardando.value = true
  try {
    await accion()
  } catch (e) {
    console.error('Error al guardar:', e)
    mostrarAviso('No se pudo guardar el pedido. Revisa la conexión e intenta otra vez.')
  } finally {
    guardando.value = false
  }
}

// Las escrituras ya no se esperan (ver persistirPedido). Si el servidor
// llegara a rechazar una (no pasa por falta de internet: en ese caso
// Firestore la deja en cola y la manda sola después), avisamos con el
// nombre del pedido para que el cajero lo vuelva a ingresar.
function vigilarEscritura(promesa, nombre) {
  promesa.catch(e => {
    console.error('El servidor rechazó un guardado:', e)
    mostrarAviso(`El pedido "${nombre}" no se pudo guardar. Vuelve a ingresarlo.`)
  })
}

// Espera una promesa como máximo `ms` milisegundos.
function conTiempoLimite(promesa, ms) {
  return Promise.race([
    promesa,
    new Promise((_, rechazar) => setTimeout(() => rechazar(new Error('tiempo agotado')), ms))
  ])
}

// ── Número de orden ──
// Solo la tablet de caja crea pedidos del POS, así que el número se
// calcula aquí mismo, sin transacción y sin esperar internet: el mayor
// número usado en este turno + 1. ultimoNumeroLocal evita repetir número
// si se crean dos pedidos seguidos antes de que el primero aparezca en
// la lista. (Los pedidos web siguen usando el contador de Firestore, y
// aquí le avisamos de cada número usado; ver registrarNumeroUsado.)
const ultimoNumeroLocal = ref(0)

function proximoNumeroPedido() {
  const inicio = turnoActual.value?.fechaApertura?.toDate?.()
  const maxTurno = inicio
    ? pedidos.value.reduce((max, p) => {
        const creadoEnTurno = p.fecha?.toDate && p.fecha.toDate() >= inicio
        return creadoEnTurno ? Math.max(max, Number(p.numero) || 0) : max
      }, 0)
    : 0
  return Math.max(maxTurno, ultimoNumeroLocal.value) + 1
}

function tomarNumeroPedido() {
  const n = proximoNumeroPedido()
  ultimoNumeroLocal.value = n
  return n
}

// ── Nombre por defecto ──
// Usa el mismo cálculo que el número real, así la sugerencia coincide.
function nombrePorDefecto() {
  return `Orden #${String(proximoNumeroPedido()).padStart(3, '0')}`
}

// ── Nombre del pedido ──
async function pedirNombre(accion) {
  if (guardando.value) return
  accionPendiente.value = accion

  // Si ya tiene nombre (pedido existente), no preguntar de nuevo
  if (pedidoEditando.value?.cliente) {
    const nombre = pedidoEditando.value.cliente
    if (accion === 'guardar') {
      const tipo = pedidoEditando.value.tipoOrden || 'llevar'
      conCandado(() => persistirPedido('guardado', tipo, nombre))
    } else if (accion === 'local') {
      conCandado(() => persistirPedido('guardado', 'local', nombre))
    } else if (accion === 'cobrar') {
      abrirCobro(nombre)
    }
    return
  }

  // Solo pide nombre para pedidos nuevos.
  // El campo arranca vacío y muestra el número sugerido en gris
  // (placeholder): si el cajero escribe, se usa lo que escribió; si da
  // "Continuar" sin escribir, se usa el número. Ya no se enfoca el campo
  // solo, así el teclado del iPad no se abre hasta que el cajero toque
  // el campo (antes tapaba media pantalla aunque no fuera a escribir).
  nombreSugerido.value = nombrePorDefecto()
  nombrePedido.value = ''
  modalNombre.value = true

  document.body.style.overflow = 'hidden'
  document.body.style.position = 'fixed'
  document.body.style.width = '100%'
}
function liberarScrollModalNombre() {
  document.body.style.overflow = ''
  document.body.style.position = ''
  document.body.style.width = ''
}

function cerrarModalNombre() {
  modalNombre.value = false
  liberarScrollModalNombre()
}

function confirmarNombre() {
  if (guardando.value) return
  modalNombre.value = false
  liberarScrollModalNombre()
  inputNombre.value?.blur() // por si el teclado quedó abierto
  const nombre = nombrePedido.value.trim() || nombreSugerido.value || nombrePorDefecto()

  if (accionPendiente.value === 'guardar') {
    conCandado(() => persistirPedido('guardado', 'llevar', nombre))
  } else if (accionPendiente.value === 'local') {
    conCandado(() => persistirPedido('guardado', 'local', nombre))
  } else if (accionPendiente.value === 'cobrar') {
    abrirCobro(nombre)
  }
}

// ── Guardar / actualizar ──
async function persistirPedido(estado, tipoOrden, nombre, datosPago = null) {
  if (!orden.value.length) return

  const productos = orden.value.map(i => ({
    nombre: i.nombre,
    categoria: i.categoria || null,
    opcion: i.opcion || null,
    cantidad: i.cantidad,
    precio: i.precio,
    precioBase: i.precioBase ?? i.precio,
    subtotal: i.precio * i.cantidad,
    comentario: i.comentario || null,
    extras: i.extras || []
  }))

  if (pedidoEditando.value) {
    // Actualizar pedido existente
    const yaPagado = pedidoEditando.value.montoPagado
      || (pedidoEditando.value.pagado ? pedidoEditando.value.total : 0)
    const nuevoPagado = datosPago ? yaPagado + (datosPago.monto || 0) : yaPagado

    const refPedidoEditado = doc(db, 'pedidos', pedidoEditando.value.id)

    // Leemos el estado y los productos directo de Firestore (no el
    // caché local) justo antes de decidir si hay que regresarlo a
    // "nuevo". ¿Por qué? Si cocina acaba de marcar el pedido como
    // "listo" desde otra tablet, ese cambio puede tardar unos segundos
    // en llegarle al listener de este dispositivo. Si decidiéramos con
    // el dato viejo en caché, podríamos pensar que seguía en "nuevo" y
    // nunca regresarlo a la cola de cocina con lo que se acaba de
    // agregar.
    // Esperamos esa lectura como máximo 1.5 s: si el internet está lento,
    // seguimos con lo que ya tenemos en la tablet en vez de dejar al
    // cajero esperando.
    let estadoActual = pedidoEditando.value.estado
    let productosAntes = pedidoEditando.value.productos || []
    try {
      const snapActual = await conTiempoLimite(getDoc(refPedidoEditado), 1500)
      if (snapActual.exists()) {
        estadoActual = snapActual.data().estado
        productosAntes = snapActual.data().productos || []
      }
    } catch (e) {
      console.warn('No se pudo confirmar el estado más reciente, usando el valor en caché:', e)
    }

    // Si el pedido ya estaba "listo" y le estamos agregando algo, marcamos
    // cuánto de cada producto es nuevo (lo que no había antes), para que
    // en Cocina quede claro qué falta por preparar — no todo el pedido
    // otra vez, solo lo que se acaba de agregar. Las bebidas/postres
    // (ver utils/cocina.js) no se marcan: esas las despacha el cajero
    // directo, cocina no tiene nada que hacer con ellas.
    const claveLinea = p => `${p.nombre}||${p.opcion || ''}`
    let productosParaGuardar = productos
    let hayAlgoQuePrepararNuevo = false
    if (estadoActual === 'listo' && productosAntes) {
      const cantidadesAntes = {}
      productosAntes.forEach(p => {
        const k = claveLinea(p)
        cantidadesAntes[k] = (cantidadesAntes[k] || 0) + (p.cantidad || 0)
      })
      productosParaGuardar = productos.map(p => {
        const antes = cantidadesAntes[claveLinea(p)] || 0
        const nuevos = Math.max(0, p.cantidad - antes)
        if (nuevos === 0 || !vaACocina(p)) return p
        hayAlgoQuePrepararNuevo = true
        return { ...p, cantidadNueva: nuevos }
      })
    }

    // Sin await: Firestore aplica el cambio en esta tablet al instante y
    // lo manda al servidor por detrás (si no hay internet, lo deja en cola).
    vigilarEscritura(updateDoc(refPedidoEditado, {
      cliente: nombre,
      tipoOrden: tipoOrden || pedidoEditando.value.tipoOrden,
      turnoId: turnoActual.value?.id || pedidoEditando.value.turnoId || null,
      productos: productosParaGuardar,
      total: totalOrden.value,
      montoPagado: nuevoPagado,
      pagado: nuevoPagado >= totalOrden.value,
      metodoPago: datosPago?.metodo || pedidoEditando.value.metodoPago || null,
      pagos: datosPago?.pagos
  ? [...(pedidoEditando.value.pagos || []), ...datosPago.pagos]
  : (pedidoEditando.value.pagos || null),
totalEfectivo: datosPago
  ? (pedidoEditando.value.totalEfectivo || 0) + (datosPago.totalEfectivo || 0)
  : pedidoEditando.value.totalEfectivo ?? null,
totalTarjeta: datosPago
  ? (pedidoEditando.value.totalTarjeta || 0) + (datosPago.totalTarjeta || 0)
  : pedidoEditando.value.totalTarjeta ?? null,
      ...(datosPago
  ? {
      estado: (nuevoPagado >= totalOrden.value && estadoActual === 'listo')
        ? 'entregado'
        : (estadoActual === 'listo' ? 'listo' : 'nuevo')
    }
  // Edición sin pago (ej. el cliente pide agregar algo más a un pedido
  // ya guardado): si cocina ya lo había marcado "listo" Y lo que se
  // agregó incluye algo que sí hay que preparar, lo regresamos a
  // "nuevo" para que le llegue a Cocina otra vez. Si lo único nuevo
  // fue bebida/postre (hayAlgoQuePrepararNuevo queda en false), el
  // cajero ya lo despachó directo — el pedido se queda en "listo" y no
  // vuelve a aparecer en Cocina. Si no estaba "listo" (seguía en
  // "guardado" o "nuevo"), lo dejamos como está — ya lo está viendo
  // cocina de todos modos.
  : (estadoActual === 'listo' && hayAlgoQuePrepararNuevo ? { estado: 'nuevo' } : {}))
    }), nombre)
  } else {
    // Crear pedido nuevo — también sin esperar al servidor. El número se
    // calcula aquí (ver tomarNumeroPedido) y luego se le avisa al contador
    // de Firestore en segundo plano, para que los pedidos web sigan la
    // misma secuencia.
    const numeroPedido = tomarNumeroPedido()
    const refNuevo = doc(collection(db, 'pedidos'))
    vigilarEscritura(setDoc(refNuevo, {
      cliente: nombre,
      numero: numeroPedido,
      turnoId: turnoActual.value?.id || null,
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
      pagos: datosPago?.pagos || null,
      totalEfectivo: datosPago?.totalEfectivo ?? null,
      totalTarjeta: datosPago?.totalTarjeta ?? null,
      fecha: serverTimestamp()
    }), nombre)
    registrarNumeroUsado(numeroPedido)
  }

//     // Imprime el ticket de cocina

// try {
//   await imprimirTicketCocina({
//     cliente: nombre,
//     tipoOrden,
//     origen: 'pos',
//     productos,
//     comentario: pedidoEditando.value?.comentario || ''
//   })
// } catch (errorImpresora) {
//   console.warn('La impresora falló, pero continuamos guardando el pedido:', errorImpresora)
// }

  orden.value = []
  pedidoEditandoId.value = null
}

// ── Editar ──
function esEditable(pedido) {
  return pedido.estado !== 'cancelado' && pedido.estado !== 'entregado'
}

function editarPedido(pedido) {
  pedidoEditandoId.value = pedido.id
  orden.value = pedido.productos.map((p, i) => {
    const original = productosData.find(x => x.nombre === p.nombre)
    const baseId = original?.id ?? `x${i}`
    return {
      id: baseId,
      nombre: p.nombre,
      categoria: p.categoria || original?.categoria || null,
      precio: p.precio,
      precioBase: p.precioBase ?? p.precio,
      opcion: p.opcion,
      cantidad: p.cantidad,
      comentario: p.comentario || '',
      extras: p.extras || [],
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
  if (pedidoEditando.value) return saldoPendiente.value
  return totalOrden.value

})

// ── Desglosa productos en unidades individuales ──
const itemsDivididos = computed(() => {
  const lista = []
  orden.value.forEach((item, idxItem) => {
    for (let i = 0; i < item.cantidad; i++) {
      lista.push({
        uid: `${item.key}__${i}`,
        nombre: item.nombre,
        precio: item.precio,
        idxItem
      })
    }
  })
  return lista
})

// Items que aún no se han pagado
const itemsDisponibles = computed(() =>
  itemsDivididos.value.filter(i => !itemsPagados.value.has(i.uid))
)

// Suma de lo seleccionado ahora
const totalSeleccionado = computed(() =>
  itemsDivididos.value
    .filter(i => itemsSeleccionados.value.has(i.uid))
    .reduce((s, i) => s + i.precio, 0)
)

// Cuánto se ha cobrado en esta sesión de división
const totalCobradoParcial = computed(() =>
  pagosRealizados.value.reduce((s, p) => s + p.monto, 0)
)

// Cuánto falta
const faltaPorCobrar = computed(() =>
  Math.max(0, montoACobrar.value - totalCobradoParcial.value)
)

// Para la barra de progreso de "Dividir cuenta"
const porcentajeCobrado = computed(() =>
  montoACobrar.value > 0
    ? Math.min(100, Math.round((totalCobradoParcial.value / montoACobrar.value) * 100))
    : 0
)

// Sugerencias para el pago parcial
const sugerenciasParcial = computed(() => {
  const m = totalSeleccionado.value
  if (m <= 0) return []
  const redondeo = Math.ceil(m / 5) * 5
  const base = [20, 50, 100, 200]
  const set = new Set([m, redondeo, ...base.filter(v => v >= m)])
  return [...set].filter(v => v >= m).sort((a, b) => a - b).slice(0, 4)
})

// El efectivo recibido es opcional: si el cajero no escribe nada (ya hizo
// la cuenta mental), se toma como pago exacto, sin cambio. Si sí escribe
// un monto, tiene que alcanzar: un monto menor casi siempre es un error
// de dedo y registraría efectivo que no entró a la caja.
function sinMontoRecibido(v) {
  return v === null || v === undefined || v === '' || Number(v) === 0
}

const puedeCobrarParcial = computed(() => {
  if (totalSeleccionado.value <= 0) return false
  if (metodoPago.value === 'tarjeta') return true
  return sinMontoRecibido(efectivoParcial.value) || efectivoParcial.value >= totalSeleccionado.value
})

const sugerencias = computed(() => {
  const m = montoACobrar.value
  const redondeo = Math.ceil(m / 5) * 5
  const base = [20, 50, 100, 200]
  const set = new Set([m, redondeo, ...base.filter(v => v >= m)])
  return [...set].filter(v => v >= m).sort((a, b) => a - b).slice(0, 4)
})

const puedeConfirmar = computed(() =>
  metodoPago.value === 'tarjeta' ||
  sinMontoRecibido(efectivoRecibido.value) ||
  efectivoRecibido.value >= montoACobrar.value
)

function abrirCobro(nombre) {
  nombreParaCobro.value = nombre
  cobroPedidoId.value = pedidoEditandoId.value
  metodoPago.value = 'efectivo'
  efectivoRecibido.value = null
  cobroAbierto.value = true
}

function cobrarPedidoExistente(pedido) {
  pedidoEditandoId.value = pedido.id
  cobroPedidoId.value = pedido.id
  orden.value = pedido.productos.map((p, i) => {
    const original = productosData.find(x => x.nombre === p.nombre)
    const baseId = original?.id ?? `x${i}`
    return {
      id: baseId,
      nombre: p.nombre,
      categoria: p.categoria || original?.categoria || null,
      precio: p.precio,
      precioBase: p.precioBase ?? p.precio,
      opcion: p.opcion,
      cantidad: p.cantidad,
      comentario: p.comentario || '',
      extras: p.extras || [],
      key: p.opcion ? `${baseId}-${p.opcion}` : `${baseId}`
    }
  })
  nombreParaCobro.value = pedido.cliente
  metodoPago.value = 'efectivo'
  efectivoRecibido.value = null
  cobroAbierto.value = true
}

function cerrarCobro() {
  cobroAbierto.value = false
  cobroPedidoId.value = null
}

async function confirmarCobro() {
  if (guardando.value) return
  // Campo vacío = pagó exacto (recibido = total, cambio 0)
  const recibidoEfectivo = sinMontoRecibido(efectivoRecibido.value)
    ? montoACobrar.value
    : Number(efectivoRecibido.value)
  const datosPago = {
    metodo: metodoPago.value,
    monto: montoACobrar.value,
    recibido: metodoPago.value === 'efectivo' ? recibidoEfectivo : null,
    cambio: metodoPago.value === 'efectivo' ? recibidoEfectivo - montoACobrar.value : null,
    totalEfectivo: metodoPago.value === 'efectivo' ? montoACobrar.value : 0,
    totalTarjeta: metodoPago.value === 'tarjeta' ? montoACobrar.value : 0
  }
 // Restaura el id por si algo lo borró
  if (cobroPedidoId.value) pedidoEditandoId.value = cobroPedidoId.value

  await conCandado(async () => {
    await persistirPedido(
      'nuevo',
      pedidoEditando.value?.tipoOrden || 'llevar',
      nombreParaCobro.value,
      datosPago
    )
    // Solo cerramos el modal si se guardó bien; si falló, se queda
    // abierto con el aviso de error para que el cajero reintente.
    cerrarCobro()
  })
}

function abrirDividir() {
  modoDividir.value = true
  itemsSeleccionados.value = new Set()
  itemsPagados.value = new Set()
  pagosRealizados.value = []
  efectivoParcial.value = null
  metodoPago.value = 'efectivo'

   // Reconstruye qué unidades ya fueron pagadas en rondas anteriores
  const pagosPrevios = pedidoEditando.value?.pagos || []
  const pendientePorNombre = {}
  pagosPrevios.forEach(p => {
    p.items.forEach(nombre => {
      pendientePorNombre[nombre] = (pendientePorNombre[nombre] || 0) + 1
    })
  })

  const pagados = new Set()
  itemsDivididos.value.forEach(item => {
    if (pendientePorNombre[item.nombre] > 0) {
      pagados.add(item.uid)
      pendientePorNombre[item.nombre]--
    }
  })
  itemsPagados.value = pagados
}


function cerrarDividir() {
  modoDividir.value = false
  itemsSeleccionados.value = new Set()
  efectivoParcial.value = null
}

function toggleItem(uid) {
  const nuevo = new Set(itemsSeleccionados.value)
  if (nuevo.has(uid)) nuevo.delete(uid)
  else nuevo.add(uid)
  itemsSeleccionados.value = nuevo
}

function seleccionarTodos() {
  itemsSeleccionados.value = new Set(itemsDisponibles.value.map(i => i.uid))
}

function limpiarSeleccion() {
  itemsSeleccionados.value = new Set()
}

// Registra un pago parcial (no toca Firebase todavía)
function cobrarParcial() {
  const seleccionados = itemsDivididos.value
    .filter(i => itemsSeleccionados.value.has(i.uid))
  // Campo vacío = pagó exacto
  const recibidoParcial = sinMontoRecibido(efectivoParcial.value)
    ? totalSeleccionado.value
    : Number(efectivoParcial.value)

  pagosRealizados.value.push({
    monto: totalSeleccionado.value,
    metodo: metodoPago.value,
    recibido: metodoPago.value === 'efectivo' ? recibidoParcial : null,
    cambio: metodoPago.value === 'efectivo'
      ? recibidoParcial - totalSeleccionado.value
      : null,
    items: seleccionados.map(i => i.nombre),
    hora: new Date().toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' })
  })

  // Marca esos items como pagados
  const nuevosPagados = new Set(itemsPagados.value)
  seleccionados.forEach(i => nuevosPagados.add(i.uid))
  itemsPagados.value = nuevosPagados

  // Limpia la selección para el siguiente cliente
  itemsSeleccionados.value = new Set()
  efectivoParcial.value = null
  metodoPago.value = 'efectivo'
}

function quitarPago(index) {
  const pago = pagosRealizados.value[index]
  // Devuelve los items al pool disponible
  const nuevosPagados = new Set(itemsPagados.value)
  itemsDivididos.value.forEach(i => {
    if (pago.items.includes(i.nombre) && nuevosPagados.has(i.uid)) {
      nuevosPagados.delete(i.uid)
    }
  })
  itemsPagados.value = nuevosPagados
  pagosRealizados.value.splice(index, 1)
}

// Confirma toda la división y guarda en Firebase
async function confirmarDivision() {
  if (guardando.value) return
  if (faltaPorCobrar.value > 0) {
    if (!confirm(`Faltan Q${faltaPorCobrar.value} por cobrar. ¿Guardar como pago parcial?`)) {
      return
    }
  }

  // Método predominante para el corte de caja
  const totalEf = pagosRealizados.value
    .filter(p => p.metodo === 'efectivo').reduce((s, p) => s + p.monto, 0)
  const totalTar = pagosRealizados.value
    .filter(p => p.metodo === 'tarjeta').reduce((s, p) => s + p.monto, 0)

  const datosPago = {
    metodo: totalEf >= totalTar ? 'efectivo' : 'tarjeta',
    monto: totalCobradoParcial.value,
    recibido: null,
    cambio: null,
    pagos: [...pagosRealizados.value],
    totalEfectivo: totalEf,
    totalTarjeta: totalTar
  }

  if (cobroPedidoId.value) pedidoEditandoId.value = cobroPedidoId.value

  await conCandado(async () => {
    await persistirPedido(
      'nuevo',
      pedidoEditando.value?.tipoOrden || 'llevar',
      nombreParaCobro.value,
      datosPago
    )
    cerrarDividir()
    cerrarCobro()
  })
}


 // if (pedidoACobrar.value) {
  //   await updateDoc(doc(db, 'pedidos', pedidoACobrar.value.id), {
  //     estado: 'entregado',
  //     pagado: true,
  //     montoPagado: pedidoACobrar.value.total,
  //     metodoPago: datosPago.metodo,
  //     efectivoRecibido: datosPago.recibido,
  //     cambio: datosPago.cambio
  //   })
  // } else



// ── Protección contra toques accidentales en Activos ──
// ¿El pedido tiene algo que cocina tiene que preparar? (no solo
// bebidas/postres). Si un producto no trae categoría (pedidos viejos),
// lo tratamos como de cocina por seguridad.
function necesitaCocina(pedido) {
  return pedidoNecesitaCocina(pedido)
}

const pedidoEnCocina = ref(null)   // pedido del aviso "todavía en preparación"
const pedidoACancelar = ref(null)  // pedido esperando confirmación para cancelar

function forzarListo() {
  if (pedidoEnCocina.value) cambiarEstado(pedidoEnCocina.value.id, 'listo')
  pedidoEnCocina.value = null
}

function confirmarCancelacion() {
  if (pedidoACancelar.value) cambiarEstado(pedidoACancelar.value.id, 'cancelado')
  pedidoACancelar.value = null
}

// ── Estados ──
async function cambiarEstado(id, nuevoEstado) {
  // Si se marca como "listo" desde aquí (Activos), limpiamos también las
  // marcas de "cantidadNueva" de los productos — igual que hace Cocina —
  // para que una futura edición solo resalte lo que sea nuevo desde ahora.
  if (nuevoEstado === 'listo') {
    const pedido = pedidos.value.find(p => p.id === id)
    const productosLimpios = (pedido?.productos || []).map(p => {
      const { cantidadNueva, ...resto } = p
      return resto
    })
    vigilarEscritura(updateDoc(doc(db, 'pedidos', id), { estado: nuevoEstado, productos: productosLimpios }), pedido?.cliente || 'pedido')
    return
  }
  const pedido = pedidos.value.find(p => p.id === id)
  vigilarEscritura(updateDoc(doc(db, 'pedidos', id), { estado: nuevoEstado }), pedido?.cliente || 'pedido')
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

// ── Pedidos del turno actual ──
const pedidosTurno = computed(() =>
  pedidos.value.filter(p => esDelTurnoActual(p) && p.estado !== 'cancelado')
)

const ventasEfectivo = computed(() =>
  pedidosTurno.value.reduce((s, p) => {
    if (p.totalEfectivo != null) return s + p.totalEfectivo
    return p.metodoPago === 'efectivo' ? s + (p.montoPagado || 0) : s
  }, 0)
)

const ventasTarjeta = computed(() =>
  pedidosTurno.value.reduce((s, p) => {
    if (p.totalTarjeta != null) return s + p.totalTarjeta
    return p.metodoPago === 'tarjeta' ? s + (p.montoPagado || 0) : s
  }, 0)
)

// ── Gastos del turno ──
// Se guardan dentro del documento del turno (campo "gastos"), así cada
// cierre queda con su propio registro. Son salidas de efectivo de la caja.
const modalGastos = ref(false)
const gastoMonto = ref(null)
const gastoConcepto = ref('')
const gastoAEliminar = ref(null)   // id del gasto que espera confirmación
// Conceptos frecuentes para no tener que escribir (edítalos a tu gusto)
const conceptosRapidosGasto = ['Carne', 'Verduras', 'Gas', 'Desechables', 'Proveedor', 'Retiro']

function fechaEnMs(f) {
  if (f?.toDate) return f.toDate().getTime()
  if (f instanceof Date) return f.getTime()
  return 0
}

function formatHora(f) {
  const ms = fechaEnMs(f)
  return ms ? new Date(ms).toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' }) : ''
}

const gastosTurno = computed(() =>
  [...(turnoActual.value?.gastos || [])].sort((a, b) => fechaEnMs(a.fecha) - fechaEnMs(b.fecha))
)

const totalGastos = computed(() =>
  gastosTurno.value.reduce((s, g) => s + (Number(g.monto) || 0), 0)
)

const puedeRegistrarGasto = computed(() =>
  Number(gastoMonto.value) > 0 && gastoConcepto.value.trim().length > 0
)

function abrirGastos() {
  menuAbierto.value = false
  gastoMonto.value = null
  gastoConcepto.value = ''
  gastoAEliminar.value = null
  modalGastos.value = true
}

function registrarGasto() {
  if (!puedeRegistrarGasto.value || !turnoActual.value) return
  const gasto = {
    id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    concepto: gastoConcepto.value.trim(),
    monto: Number(gastoMonto.value),
    // serverTimestamp() no se puede usar dentro de un arreglo: hora de la tablet
    fecha: new Date()
  }
  // Sin await (igual que los pedidos): aparece al instante y se sincroniza solo
  updateDoc(doc(db, 'turnos', turnoActual.value.id), { gastos: arrayUnion(gasto) })
    .catch(e => {
      console.error('Error al registrar gasto:', e)
      mostrarAviso(`No se pudo registrar el gasto "${gasto.concepto}". Intenta otra vez.`)
    })
  // Limpiar el formulario también evita registrar el mismo gasto dos veces
  gastoMonto.value = null
  gastoConcepto.value = ''
}

function eliminarGasto(id) {
  if (!turnoActual.value) return
  const restantes = (turnoActual.value.gastos || []).filter(g => g.id !== id)
  updateDoc(doc(db, 'turnos', turnoActual.value.id), { gastos: restantes })
    .catch(e => {
      console.error('Error al eliminar gasto:', e)
      mostrarAviso('No se pudo eliminar el gasto. Intenta otra vez.')
    })
  gastoAEliminar.value = null
}

// Lo que debe haber físicamente en la caja. Lo cobrado con tarjeta no se
// suma (no está en efectivo) y los gastos se restan. Es el mismo número
// que se muestra en el menú ("Efectivo en caja") y en el cierre de turno.
const efectivoEsperado = computed(() =>
  (turnoActual.value?.fondoInicial || 0) + ventasEfectivo.value - totalGastos.value
)

const diferenciaCaja = computed(() =>
  efectivoContado.value !== null
    ? efectivoContado.value - efectivoEsperado.value
    : 0
)

// Pedidos que impiden cerrar el turno
const pedidosPendientes = computed(() =>
  pedidos.value.filter(p =>
    ['nuevo', 'guardado', 'listo'].includes(p.estado)
  )
)


// ── Sonido y alerta ──
// Un solo AudioContext para toda la sesión: el iPad limita cuántos se
// pueden crear, y antes se creaba uno nuevo por cada alerta (después de
// varias, el sonido dejaba de funcionar).
let audioCtx = null

function reproducirSonido() {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    if (audioCtx.state === 'suspended') audioCtx.resume()
    const ctx = audioCtx
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain); gain.connect(ctx.destination)
    osc.frequency.setValueAtTime(800, ctx.currentTime)
    osc.frequency.setValueAtTime(600, ctx.currentTime + 0.1)
    osc.frequency.setValueAtTime(800, ctx.currentTime + 0.2)
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4)
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.4)
  } catch (e) {
    console.warn('No se pudo reproducir el sonido de alerta:', e)
  }
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
// // imprime ticket  para pedido web
//  if (ultimoPedido.value) {
//     imprimirTicketCocina(ultimoPedido.value)
//   }


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

async function limpiarDocumentosVacios() {
  const snap = await getDocs(collection(db, 'pedidos'))
  const batch = writeBatch(db)
  let contador = 0

  snap.docs.forEach(d => {
    const data = d.data()
    // Los pedidos reales siempre tienen campos; los vacíos no tienen ninguno
    if (Object.keys(data).length === 0) {
      batch.delete(d.ref)
      contador++
    }
  })

  if (contador > 0) {
    await batch.commit()
    console.log(`Se eliminaron ${contador} documentos vacíos.`)
  } else {
    console.log('No se encontraron documentos vacíos.')
  }
}

// Borra pedidos entregados/cancelados de hace más de 24 h. Los resúmenes
// de cada turno (colección "turnos") no se tocan.
function depurarAntiguos() {
  const limite = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const viejos = pedidos.value.filter(p =>
    p.fecha?.toDate && p.fecha.toDate() < limite && ['entregado', 'cancelado'].includes(p.estado)
  )
  if (!viejos.length) return
  const batch = writeBatch(db)
  // Un batch de Firestore acepta hasta 500 operaciones
  viejos.slice(0, 450).forEach(p => batch.delete(doc(db, 'pedidos', p.id)))
  batch.commit().catch(e => console.warn('No se pudieron limpiar pedidos viejos:', e))
}

// ── Helpers ──
// Estado en texto simple, para la etiqueta de color del ticket
function textoEstado(e) {
  return {
    guardado:  'Guardado',
    nuevo:     'Nuevo',
    listo:     'Listo',
    entregado: 'Entregado',
    cancelado: 'Cancelado'
  }[e] || e
}

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

// ── TURNOS ──
// Id del turno que se está abriendo. Se genera una sola vez: si el
// botón se toca dos veces, las dos escrituras van al MISMO documento
// en vez de crear dos turnos abiertos.
let idTurnoPendiente = null

function abrirTurno() {
  const fondo = Number(fondoInicial.value) || 0
  if (!idTurnoPendiente) idTurnoPendiente = doc(collection(db, 'turnos')).id

  // Sin await: el turno aparece en esta tablet al instante y se manda al
  // servidor por detrás.
  setDoc(doc(db, 'turnos', idTurnoPendiente), {
    abierto: true,
    fondoInicial: fondo,
    fechaApertura: serverTimestamp(),
    fechaCierre: null,
    ventasEfectivo: 0,
    ventasTarjeta: 0,
    totalVentas: 0,
    cantidadPedidos: 0,
    gastos: [],
    efectivoContado: null,
    diferencia: null
  }).catch(e => {
    console.error('Error al abrir turno:', e)
    mostrarAviso('No se pudo abrir el turno. Revisa la conexión e intenta otra vez.')
  })

  // El primer pedido de cada turno nuevo siempre empieza en #001,
  // aunque sea el mismo día y ya hayas cerrado un turno anterior.
  ultimoNumeroLocal.value = 0
  reiniciarContadorPedidos().catch(e => console.warn('No se pudo reiniciar el contador web:', e))

  modalAbrirTurno.value = false
  fondoInicial.value = null
}

function intentarCerrarTurno() {
  menuAbierto.value = false
  if (pedidosPendientes.value.length > 0) {
    modalPendientes.value = true
    return
  }
  efectivoContado.value = null
  modalCerrarTurno.value = true
}

function cerrarTurno() {
  if (!turnoActual.value) return
  // Si no se escribió cuánto se contó, se guarda como "sin conteo" (null),
  // no como Q0: antes eso hacía que el historial marcara "Cuadrado" aunque
  // nadie hubiera contado la caja.
  const contado = efectivoContado.value === null || efectivoContado.value === ''
    ? null
    : Number(efectivoContado.value)
  updateDoc(doc(db, 'turnos', turnoActual.value.id), {
    abierto: false,
    fechaCierre: serverTimestamp(),
    ventasEfectivo: ventasEfectivo.value,
    ventasTarjeta: ventasTarjeta.value,
    totalVentas: ventasEfectivo.value + ventasTarjeta.value,
    cantidadPedidos: pedidosTurno.value.length,
    totalGastos: totalGastos.value,
    efectivoEsperado: efectivoEsperado.value,
    efectivoContado: contado,
    diferencia: contado === null ? null : contado - efectivoEsperado.value
  }).catch(e => {
    console.error('Error al cerrar turno:', e)
    mostrarAviso('No se pudo cerrar el turno. Revisa la conexión e intenta otra vez.')
  })

  // El próximo turno tendrá su propio id
  idTurnoPendiente = null
  // Buen momento para limpiar pedidos viejos (una sola vez, no en cada cambio)
  depurarAntiguos()

  modalCerrarTurno.value = false
  efectivoContado.value = null
}

function irAlHistorial() {
  menuAbierto.value = false
  router.push('/historial')
}

// ── Color de la barra superior de Safari (iPad) ──
// Safari pinta la franja de arriba (hora, batería) con un color que saca
// de la página, y lo difumina sobre el contenido. Si saca un color claro,
// se ve un difuminado blanco encima de la barra oscura del POS.
// Las versiones nuevas de Safari ya no hacen caso a theme-color y toman el
// color del fondo de la página (html/body) o de una barra fija arriba. Por
// eso, mientras el POS está abierto: (1) el fondo de html/body pasa al
// color de la barra, (2) dejamos theme-color por si el Safari es más viejo,
// y (3) la barra es "sticky" arriba (ver .navbar en el CSS).
// Al salir del POS se restaura todo como estaba.
const COLOR_BARRA = '#1a0e06'
let metaThemeColor = null
let themeColorAnterior = null
let fondoHtmlAnterior = ''
let fondoBodyAnterior = ''

function aplicarColorBarra() {
  fondoHtmlAnterior = document.documentElement.style.backgroundColor
  fondoBodyAnterior = document.body.style.backgroundColor
  document.documentElement.style.backgroundColor = COLOR_BARRA
  document.body.style.backgroundColor = COLOR_BARRA

  metaThemeColor = document.querySelector('meta[name="theme-color"]')
  if (metaThemeColor) {
    themeColorAnterior = metaThemeColor.getAttribute('content')
  } else {
    metaThemeColor = document.createElement('meta')
    metaThemeColor.setAttribute('name', 'theme-color')
    document.head.appendChild(metaThemeColor)
  }
  metaThemeColor.setAttribute('content', COLOR_BARRA)
}

function restaurarColorBarra() {
  document.documentElement.style.backgroundColor = fondoHtmlAnterior
  document.body.style.backgroundColor = fondoBodyAnterior
  if (!metaThemeColor) return
  if (themeColorAnterior !== null) metaThemeColor.setAttribute('content', themeColorAnterior)
  else metaThemeColor.remove()
  metaThemeColor = null
  themeColorAnterior = null
}

// ── Firebase ──
onMounted(() => {
    aplicarColorBarra()

    escucharExtras()

    limpiarDocumentosVacios()

    // ── Escucha el turno abierto ──
  const qTurno = query(
    collection(db, 'turnos'),
    where('abierto', '==', true),
    limit(1)
  )
  unsubTurno = onSnapshot(qTurno, (snap) => {
    // serverTimestamps: 'estimate' → mientras el servidor confirma la hora
    // de apertura, usamos la hora de la tablet en vez de null. Sin esto, un
    // turno recién abierto se vería "sin hora" unos segundos.
    turnoActual.value = snap.empty
      ? null
      : { id: snap.docs[0].id, ...snap.docs[0].data({ serverTimestamps: 'estimate' }) }
    cargandoTurno.value = false
    if (!turnoActual.value) modalAbrirTurno.value = true
    else modalAbrirTurno.value = false
  })

  const q = query(collection(db, 'pedidos'), orderBy('fecha', 'desc'))
  unsubscribe = onSnapshot(q, (snap) => {
    // Igual que arriba: un pedido recién guardado trae la hora de la
    // tablet hasta que el servidor la confirme, así aparece de inmediato
    // en Activos y cuenta para el número de orden.
    const nuevos = snap.docs.map(d => ({ id: d.id, ...d.data({ serverTimestamps: 'estimate' }) }))

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

    // La limpieza de pedidos viejos corre una vez al abrir el POS (y al
    // cerrar turno), ya no con cada cambio: antes cada actualización de
    // cualquier pedido la disparaba en cada tablet a la vez.
    if (primeraCarga.value) depurarAntiguos()
    primeraCarga.value = false
  })
})

onUnmounted(() => {
  restaurarColorBarra()
  if (unsubscribe) unsubscribe()
  if (unsubTurno) unsubTurno()
  detenerExtras()
  clearInterval(intervaloPestana)
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

.pos,
.pos * {
  font-family: 'Plus Jakarta Sans', sans-serif !important;
}

* { box-sizing: border-box; }

.pos {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f7f4f0;
  font-family: 'Plus Jakarta Sans', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
  overflow: hidden;
}

/* ── NAVBAR ── */
.navbar {
  display: flex; align-items: center; gap: 0;
  background: #1a0e06; padding: 0 12px; height: 60px; flex-shrink: 0;
  /* Pegada arriba: Safari en iPad toma de aquí el color de la franja de
     la hora/batería (ver aplicarColorBarra en el script) */
  position: sticky; top: 0; z-index: 50;
}

.navbar__menu {
  display: flex; flex-direction: column; justify-content: center; gap: 4px;
  width: 38px; height: 38px; background: transparent; border: none;
  border-radius: 8px; cursor: pointer; padding: 8px;
  transition: background 0.15s;
}
.navbar__menu:hover { background: rgba(255,255,255,0.07); }
.navbar__menu span { display: block; height: 1.5px; background: rgba(255,255,255,0.65); border-radius: 2px; }

.navbar__divisor { width: 1px; height: 22px; background: rgba(255,255,255,0.1); margin: 0 12px; flex-shrink: 0; }

.navbar__tabs { display: flex; gap: 2px; flex: 1; overflow-x: auto; height: 100%; align-items: center; }

.nav-tab {
  position: relative;
  display: flex; align-items: center; gap: 8px; padding: 0 14px; height: 100%;
  border: none; background: transparent;
  color: rgba(255,255,255,0.45); font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 14px; font-weight: 700; cursor: pointer; white-space: nowrap;
  transition: color 0.15s;
}
.nav-tab:hover { color: rgba(255,255,255,0.8); }
.nav-tab--activo { color: white; }
.nav-tab--activo::after {
  content: ''; position: absolute; left: 14px; right: 14px; bottom: 0;
  height: 2px; background: #e8621a; border-radius: 2px 2px 0 0;
}

.nav-tab__badge {
  background: white; color: #e8621a; font-size: 11px; font-weight: 800;
  min-width: 19px; height: 19px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center; padding: 0 5px;
}

.navbar__user {
  display: flex; align-items: center; gap: 7px; flex-shrink: 0;
  color: rgba(255,255,255,0.5); font-size: 12.5px; font-weight: 700;
  padding: 6px 12px; border-radius: 999px; background: rgba(255,255,255,0.05);
}
/* Tamaño explícito: sin esto el span hereda los 24px globales de style.css */
.navbar__user-texto { font-size: 12.5px; font-weight: 700; color: rgba(255,255,255,0.5); }
.navbar__dot {
  width: 6px; height: 6px; background: #3aa65a; border-radius: 50%;
  box-shadow: 0 0 0 3px rgba(58,166,90,0.2);
  animation: pulso 2.4s infinite;
}
@keyframes pulso { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.55;transform:scale(1.25)} }

/* ── DRAWER ── */
.drawer-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1000; }

.drawer {
  width: 320px; max-width: 85vw; height: 100%; background: #fffaf5;
  padding: 24px; display: flex; flex-direction: column; gap: 24px;
  border-right: 1px solid #f0e4d8;
}

.drawer__header { display: flex; align-items: center; justify-content: space-between; }
.drawer__header h2 { font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800; color: #2c1a0e; margin: 0; font-size: 20px; }
.drawer__cerrar {
  width: 30px; height: 30px; border-radius: 50%; border: none;
  background: #f0e4d8; color: #2c1a0e; cursor: pointer; font-size: 13px;
}

.drawer__titulo {
  font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase;
  color: #b3a394; font-weight: 700; margin: 0 0 12px;
}

.drawer__seccion-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.drawer__seccion-head .drawer__titulo { margin: 0; }

.turno-badge { display: inline-flex; align-items: center; gap: 6px; font-size: 11.5px; font-weight: 700; color: #8a7362; }
.turno-badge__punto {
  width: 6px; height: 6px; border-radius: 50%; background: #3aa65a; flex-shrink: 0;
  box-shadow: 0 0 0 3px rgba(58,166,90,0.15);
}

.turno-card {
  background: white; border: 1.5px solid #f0e4d8; border-radius: 16px; padding: 16px;
  display: flex; flex-direction: column; gap: 14px;
}

.turno-total {
  display: flex; align-items: baseline; justify-content: space-between;
  padding-bottom: 14px; border-bottom: 1.5px solid #f0e4d8;
}
.turno-total__label { font-size: 12.5px; font-weight: 700; color: #8a7362; }
.turno-total__valor { font-size: 24px; font-weight: 800; color: #e8621a; }

.turno-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px 16px; }
.turno-stat { display: flex; flex-direction: column; gap: 3px; }
.turno-stat__label { font-size: 11.5px; font-weight: 600; color: #b3a394; }
.turno-stat__valor { font-size: 15px; font-weight: 700; color: #2c1a0e; }
/* Gastos: ocupa toda la fila, etiqueta a la izquierda y monto a la derecha */
.turno-stat--fila {
  grid-column: 1 / -1; flex-direction: row; align-items: baseline; justify-content: space-between;
  padding-top: 12px; border-top: 1px dashed #f0e4d8;
}
.turno-stat__valor--gasto { color: #b3261e; }

/* Efectivo en caja: banda oscura para que no se confunda con "Total vendido" */
.turno-caja {
  background: #2c1a0e; border-radius: 12px; padding: 12px 14px;
  display: flex; flex-direction: column; gap: 4px;
}
.turno-caja__fila { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; }
.turno-caja__label { font-size: 12.5px; font-weight: 700; color: rgba(255,255,255,0.75); }
.turno-caja__valor { font-size: 22px; font-weight: 800; color: #ffffff; font-variant-numeric: tabular-nums; }
.turno-caja__nota { font-size: 11px; font-weight: 500; color: rgba(255,255,255,0.5); line-height: 1.35; }

.drawer__acciones { margin-top: auto; display: flex; flex-direction: column; }

.drawer__btn {
  padding: 15px 4px; border: none; background: transparent;
  border-bottom: 1px solid #f0e4d8;
  text-align: left;
  font-family: 'Plus Jakarta Sans', sans-serif; font-size: 14.5px; font-weight: 700; cursor: pointer;
  color: #2c1a0e;
  transition: background 0.15s;
}
.drawer__btn:hover { background: #f7efe6; }
.drawer__btn--salir { border-bottom: none; color: #8a7362; }
.drawer__btn--salir:hover { color: #2c1a0e; }
.drawer__btn--limpiar { color: #cc0000; }

/* ── CONTENIDO ── */
.contenido { flex: 1; overflow: hidden; padding: 16px; }

/* ── VISTA POS ── */
.pos-view { height: 100%; display: grid; grid-template-columns: 1fr 420px; gap: 16px; }
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
}
.producto-btn:hover { border-color: #e8621a; }
.producto-btn:active { transform: scale(0.97); }
.producto-btn__nombre { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 22px; font-weight: 600; color: #2c1a0e; line-height: 1.25; }
.producto-btn__precio { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 22px; font-weight: 700; color: #e8621a; }

.pos-categorias { display: flex; gap: 8px; overflow-x: auto; padding-top: 4px; flex-shrink: 0; }

.categoria-btn {
  padding: 14px 24px; border-radius: 100px; border: 2px solid #e8ddd0;
  background: white; color: #8c6a52; font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 15px; font-weight: 700; cursor: pointer; white-space: nowrap;
  transition: background 0.1s, border-color 0.1s, color 0.1s;
}
.categoria-btn--activa { background: #e8621a; border-color: #e8621a; color: white; }

/*boton precio*/
.opcion-btn__precio {
  color: #e8621a;
  font-weight: 800;
  margin-left: 10px;
}

/* ── RESUMEN ── */
.pos-resumen {
  background: white; border-radius: 18px; border: 1px solid #e8ddd0;
  display: flex; flex-direction: column; overflow: hidden;
  font-family: 'Plus Jakarta Sans', sans-serif;
}

.editando-banner {
  background: #3a9bd5; color: white; padding: 12px 16px;
  display: flex; align-items: center; justify-content: space-between; gap: 10px;
}
.editando-banner__info { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.editando-banner__label { font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; opacity: 0.85; }
.editando-banner__info strong { font-size: 18px; font-weight: 700; }
.editando-banner__pagado { font-size: 13px; opacity: 0.9; }
.editando-banner__cancelar {
  width: 30px; height: 30px; border-radius: 50%; border: none;
  background: rgba(255,255,255,0.25); color: white; cursor: pointer; flex-shrink: 0;
}

.resumen__header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 18px; border-bottom: 1px solid #f0e6d8;
}
.resumen__header h2 { font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800; font-size: 20px; margin: 0; color: #2c1a0e; }
.resumen__limpiar {
  background: none; border: none; color: #cc0000; font-size: 13px;
  font-weight: 700; cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif;
}
.resumen__lista {
  flex: 1; overflow-y: auto; padding: 12px 18px;
  display: flex; flex-direction: column; gap: 10px;
}
.resumen__vacio { color: #b09880; font-size: 26px; text-align: center; padding: 32px 0; font-weight: 600; }
.resumen__item { display: grid; grid-template-columns: 1fr auto auto; align-items: center; gap: 10px; }
.resumen__item-info { display: flex; flex-direction: column; min-width: 0; cursor: pointer; }
.resumen__item-nombre { font-size: 16px; font-weight: 600; color: #2c1a0e; line-height: 1.3; font-family: 'Plus Jakarta Sans', sans-serif; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.resumen__item-opcion { font-size: 16px; color: #e8621a; font-weight: 600; font-family: 'Plus Jakarta Sans', sans-serif; }
.resumen__item-nota {
  font-size: 12px;
  font-weight: 600;
  color: #e8621a;
  font-family: 'Plus Jakarta Sans', sans-serif;
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.resumen__item-nota--vacia {
  color: #c9b8a8;
  font-weight: 500;
}
.resumen__item-ctrl { display: flex; align-items: center; gap: 6px; }
.resumen__item-ctrl button {
  width: 28px; height: 28px; border-radius: 50%; border: 1.5px solid #e8621a;
  background: white; color: #e8621a; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 15px; font-weight: 700;
  cursor: pointer; line-height: 1; display: flex; align-items: center; justify-content: center;
}
.resumen__item-ctrl span {font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800; min-width: 16px; text-align: center; font-size: 15px }
.resumen__item-precio {font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 600; color: #e8621a; font-size: 17px; min-width: 44px; text-align: right; }

.resumen__total {
  display: flex; justify-content: space-between; align-items: center;
  padding: 16px 18px; background: #1a0e06; color: white; font-weight: 700;
}
.resumen__total strong { font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800; font-size: 26px; color: #f5a623; }

.resumen__saldo {
  display: flex; justify-content: space-between; align-items: center;
  padding: 12px 18px; background: #fff5e8; color: #8a5a00; font-weight: 700;
  border-top: 1px solid #f0d9a0;
}
.resumen__saldo strong { font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800; font-size: 22px; color: #e8621a; }

.resumen__acciones { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; padding: 12px; }

.btn {
  padding: 18px 12px; border-radius: 12px; border: none;
  font-family: 'Plus Jakarta Sans', sans-serif; font-size: 16px; font-weight: 700;
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
.lista-vacia p { font-size: 18px; font-weight: 600; }

.lista-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 16px; }

/* ── TICKET DE PEDIDO (Activos / Comer acá / Entregados / Cancelados) ── */
/* Tarjeta clara, igual que los productos y la pantalla de Cocina.
   El color del estado vive en la franja izquierda y en la etiqueta. */
.pedido {
  background: #ffffff;
  border: 1px solid #efe6dc;
  border-left: 4px solid #d8c9b9;
  border-radius: 16px;
  padding: 16px 18px 14px;
  display: flex; flex-direction: column; gap: 12px;
  box-shadow: 0 1px 2px rgba(44,26,14,0.04), 0 6px 18px rgba(44,26,14,0.05);
  position: relative;
}
.pedido--nuevo     { border-left-color: #e8621a; }
.pedido--guardado  { border-left-color: #2f7fc1; }
.pedido--listo     { border-left-color: #2f8c4a; }
.pedido--entregado { border-left-color: #b3a394; }
.pedido--cancelado { border-left-color: #d6cbbf; opacity: 0.6; }
.pedido--editable { cursor: pointer; transition: box-shadow 0.15s, border-color 0.15s; }
.pedido--editable:hover {
  border-color: #e2d3c3;
  box-shadow: 0 1px 2px rgba(44,26,14,0.05), 0 10px 26px rgba(44,26,14,0.09);
}

/* Fila superior: estado · etiquetas · tiempo */
.pedido__top { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.pedido__estado {
  display: inline-flex; align-items: center; gap: 7px;
  font-size: 12px; font-weight: 700; letter-spacing: 0.02em;
  padding: 4px 10px 4px 9px; border-radius: 999px;
  background: #f4ede5; color: #6b5444;
}
.pedido__estado-punto { width: 7px; height: 7px; border-radius: 50%; background: currentColor; flex-shrink: 0; }
.pedido__estado--nuevo     { background: rgba(232,98,26,0.10); color: #c04e10; }
.pedido__estado--guardado  { background: rgba(47,127,193,0.10); color: #23679f; }
.pedido__estado--listo     { background: rgba(47,140,74,0.11); color: #24733b; }
.pedido__estado--entregado { background: #f4ede5; color: #8a7362; }
.pedido__estado--cancelado { background: #f4ede5; color: #a3948a; }
.pedido__previo {
  font-size: 11.5px; font-weight: 700; color: #a4640f;
  background: #fdf3e1; padding: 4px 9px; border-radius: 999px; white-space: nowrap;
}
.pedido__tiempo { margin-left: auto; font-size: 12.5px; font-weight: 600; color: #b3a394; white-space: nowrap; }

/* Cliente */
.pedido__titulo { display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; margin-top: 2px; }
.pedido__cliente { font-size: 19px; font-weight: 800; color: #2c1a0e; line-height: 1.2; }
.pedido__numero {
  font-size: 12px; font-weight: 700; color: #8a7362;
  background: #f4ede5; padding: 2px 8px; border-radius: 6px;
  font-variant-numeric: tabular-nums;
}
.pedido__meta {
  margin: -6px 0 0; font-size: 13px; font-weight: 600; color: #8a7362;
  display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
}
.pedido__meta-sep { font-size: 13px; color: #d6c7b8; }
.pedido__web {
  font-size: 11px; font-weight: 700; color: #23679f;
  background: rgba(47,127,193,0.10); padding: 2px 7px; border-radius: 5px;
}

.pedido__comentario {
  margin: 0; font-size: 13px; font-weight: 500; color: #6b5444; line-height: 1.4;
  background: #faf6f1; border-radius: 10px; padding: 8px 10px;
}
.pedido__comentario-label {
  font-size: 11px; font-weight: 800; color: #b3a394;
  text-transform: uppercase; letter-spacing: 0.06em; margin-right: 6px;
}

/* Productos */
.pedido__productos {
  list-style: none; margin: 0; padding: 12px 0 0;
  border-top: 1px solid #f2ebe3;
  display: flex; flex-direction: column; gap: 9px;
}
.pedido__producto {
  display: grid; grid-template-columns: 30px 1fr auto; align-items: start; gap: 6px;
  font-size: 15px;
}
.pedido__cant { font-size: 14px; font-weight: 700; color: #b3a394; padding-top: 1px; font-variant-numeric: tabular-nums; }
.pedido__producto-texto { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.pedido__producto-nombre { font-size: 15px; font-weight: 600; color: #2c1a0e; line-height: 1.3; }
.pedido__producto-nota { font-size: 12.5px; font-weight: 600; color: #b8691f; line-height: 1.3; }
.pedido__producto-badge-nuevo {
  display: inline-block; margin-left: 6px; vertical-align: 1px;
  font-size: 10.5px; font-weight: 800; color: #23679f;
  background: rgba(47,127,193,0.12); padding: 2px 7px; border-radius: 999px;
}
.pedido__producto-precio { font-size: 15px; font-weight: 700; color: #2c1a0e; font-variant-numeric: tabular-nums; }

/* Pagos divididos */
.pedido__pagos {
  background: #faf6f1; border-radius: 10px; padding: 10px 12px;
  display: flex; flex-direction: column; gap: 6px;
}
.pedido__pagos-titulo {
  font-size: 11px; font-weight: 800; color: #b3a394;
  text-transform: uppercase; letter-spacing: 0.06em;
}
.pedido__pago { display: flex; flex-direction: column; gap: 1px; }
.pedido__pago-monto { font-size: 13.5px; font-weight: 700; color: #2c1a0e; }
.pedido__pago-metodo { font-size: 12px; font-weight: 600; color: #8a7362; margin-left: 4px; }
.pedido__pago-items { font-size: 12px; font-weight: 500; color: #a3948a; }

/* Total y estado del pago */
.pedido__resumen {
  display: flex; align-items: flex-end; justify-content: space-between; gap: 10px;
  padding-top: 12px; border-top: 1px solid #f2ebe3;
  /* Cuando las tarjetas de una fila se estiran a la misma altura, el total
     y los botones quedan alineados abajo en todas */
  margin-top: auto;
}
.pedido__total-bloque { display: flex; flex-direction: column; gap: 1px; }
.pedido__total-label {
  font-size: 11px; font-weight: 800; color: #b3a394;
  text-transform: uppercase; letter-spacing: 0.06em;
}
.pedido__total { font-size: 22px; font-weight: 800; color: #2c1a0e; font-variant-numeric: tabular-nums; line-height: 1.1; }
.pedido__pago-estado {
  font-size: 12px; font-weight: 700; padding: 5px 10px; border-radius: 999px;
  white-space: nowrap; margin-bottom: 2px;
}
.pedido__pago-estado--ok        { background: rgba(47,140,74,0.11); color: #24733b; }
.pedido__pago-estado--pendiente { background: #fdf3e1; color: #a4640f; }
.pedido__pago-estado--parcial   { background: #fdf3e1; color: #a4640f; }

/* Acciones */
.pedido__acciones { display: flex; gap: 8px; flex-wrap: wrap; }
.accion-btn {
  height: 42px; padding: 0 16px; border-radius: 10px; border: 1px solid transparent;
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  font-size: 14px; font-weight: 700; cursor: pointer;
  transition: background 0.12s, color 0.12s, border-color 0.12s;
}
.accion-btn--cobrar   { background: #e8621a; color: #ffffff; flex: 1; }
.accion-btn--cobrar:hover { background: #c04e10; }
.accion-btn--listo    { background: #2f8c4a; color: #ffffff; flex: 1; }
.accion-btn--listo:hover { background: #24733b; }
.accion-btn--entregar { background: #2c1a0e; color: #ffffff; flex: 1; }
.accion-btn--entregar:hover { background: #45301f; }
.accion-btn--en-cocina {
  background: #faf6f1; color: #8a7362; border: 1px dashed #dccbb9; flex: 1;
}
.accion-btn__punto {
  width: 8px; height: 8px; border-radius: 50%; background: #e8a521; flex-shrink: 0;
  animation: pulso 2.4s infinite;
}
.accion-btn--cancelar { background: transparent; color: #a3948a; border-color: #efe6dc; }
.accion-btn--cancelar:hover { color: #cc0000; border-color: rgba(204,0,0,0.25); background: rgba(204,0,0,0.05); }

.pedido__hint {
  margin: -2px 0 0; text-align: center;
  font-size: 11.5px; font-weight: 600; color: #c9bbad;
}

/* ── MODALES DE CONFIRMACIÓN (en cocina / cancelar) ── */
.confirmar-modal {
  background: white; border-radius: 22px; padding: 24px;
  width: 100%; max-width: 420px;
  display: flex; flex-direction: column; gap: 12px;
}
.confirmar-modal__titulo {
  margin: 0; font-size: 20px; font-weight: 800; color: #2c1a0e;
}
.confirmar-modal__texto {
  margin: 0 0 6px; font-size: 15px; font-weight: 500; color: #6b5444; line-height: 1.45;
}
.confirmar-modal__texto strong { font-size: 15px; font-weight: 800; color: #2c1a0e; }
.confirmar-modal__principal {
  padding: 15px; border-radius: 12px; border: none;
  background: #2c1a0e; color: white;
  font-size: 15.5px; font-weight: 800; cursor: pointer;
}
.confirmar-modal__secundario {
  padding: 10px; border: none; background: transparent;
  color: #8a7362; font-size: 13.5px; font-weight: 700;
  text-decoration: underline; cursor: pointer;
}
.confirmar-modal__peligro {
  padding: 15px; border-radius: 12px; border: none;
  background: rgba(204,0,0,0.08); color: #cc0000;
  font-size: 15.5px; font-weight: 800; cursor: pointer;
}

/* ── MODAL NOMBRE ── */
.cobro-overlay--top {
  align-items: flex-start;
  padding-top: 24px;
  touch-action: none;
  overscroll-behavior: contain;
}

.nombre-modal {
  background: white; border-radius: 22px; padding: 20px 24px;
  width: 100%; max-width: 820px;
}
.nombre-modal__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.nombre-modal h2 {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 20px;
  font-weight: 800;
  margin: 0;
  color: #2c1a0e;
}

.nombre-modal__x {
  width: 34px; height: 34px; border-radius: 50%; border: none;
  background: #f0e6d8; color: #6b3a1f; cursor: pointer; font-size: 15px;
}

.nombre-modal__cuerpo {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  align-items: start;
  margin-bottom: 16px;
}

.nombre-modal__input {
  width: 100%;
  padding: 18px;
  border: 2px solid #e8ddd0;
  border-radius: 12px;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 22px;
  font-weight: 700;
  color: #2c1a0e;
  outline: none;
  margin: 0;
}
.nombre-modal__input:focus { border-color: #e8621a; }
.nombre-modal__input::placeholder { color: #b3a394; font-size: 22px; font-weight: 600; opacity: 1; }

.nombre-modal__rapidos {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin: 0;
}

.rapido-btn {
  padding: 14px 10px;
  border-radius: 10px;
  border: 2px solid #e8ddd0;
  background: white;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 14px;
  font-weight: 700;
  color: #6b3a1f;
  cursor: pointer;
  transition: border-color 0.1s, color 0.1s;
}
.rapido-btn:hover { border-color: #e8621a; color: #e8621a; }

.nombre-modal__ok {
  width: 100%;
  padding: 18px;
  border-radius: 12px;
  border: none;
  background: #e8621a;
  color: white;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 17px;
  font-weight: 800;
  cursor: pointer;
}
.nombre-modal__ok:hover:not(:disabled) { background: #c04e10; }
.nombre-modal__ok:disabled { opacity: 0.5; cursor: not-allowed; }

/* ── AVISO DE ERROR AL GUARDAR ── */
.aviso-error {
  position: fixed; top: 16px; left: 50%; transform: translateX(-50%);
  z-index: 3000; width: calc(100% - 32px); max-width: 560px;
  display: flex; align-items: center; gap: 12px;
  background: #cc0000; color: white;
  padding: 14px 16px; border-radius: 14px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.25);
}
.aviso-error__texto {
  flex: 1; font-size: 14.5px; font-weight: 700; line-height: 1.35;
}
.aviso-error__x {
  flex-shrink: 0; width: 32px; height: 32px; border-radius: 50%; border: none;
  background: rgba(255,255,255,0.2); color: white;
  font-size: 14px; font-weight: 700; cursor: pointer;
}

/* ── MODAL NOTA DEL PRODUCTO ── */
.nota-modal__cuerpo { display: flex; flex-direction: column; gap: 14px; margin-bottom: 16px; }
.nota-modal__input {
  width: 100%;
  padding: 14px;
  border: 2px solid #e8ddd0;
  border-radius: 12px;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 16px;
  font-weight: 500;
  color: #2c1a0e;
  outline: none;
  resize: none;
}
.nota-modal__input:focus { border-color: #e8621a; }

.nota-modal__extras { display: flex; flex-direction: column; gap: 8px; }
.nota-modal__extras-titulo {
  margin: 0; font-size: 13px; font-weight: 700; color: #8a7362;
  text-transform: uppercase; letter-spacing: 0.3px;
}
.nota-modal__extras-lista { display: flex; flex-direction: column; gap: 6px; }

.extra-fila {
  display: flex; align-items: center; justify-content: space-between; gap: 10px;
  padding: 10px 12px; border-radius: 10px; border: 2px solid #e8ddd0; background: white;
  font-family: 'Plus Jakarta Sans', sans-serif;
}
.extra-fila__info { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.extra-fila__nombre { font-size: 14px; font-weight: 700; color: #2c1a0e; }
.extra-fila__precio { font-size: 12.5px; font-weight: 700; color: #b3a394; }

.extra-fila__ctrl { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.extra-fila__btn {
  width: 26px; height: 26px; border-radius: 50%; border: 1.5px solid #e8ddd0;
  background: white; color: #2c1a0e; font-size: 15px; font-weight: 700; cursor: pointer;
  display: flex; align-items: center; justify-content: center; line-height: 1; padding: 0;
}
.extra-fila__btn--add { border-color: #e8621a; color: #e8621a; }
.extra-fila__btn--add:hover { background: #e8621a; color: white; }
.extra-fila__cantidad { font-size: 14px; font-weight: 800; color: #2c1a0e; min-width: 14px; text-align: center; }
.nota-modal__acciones { display: flex; gap: 10px; }
.nota-modal__quitar {
  flex: 1;
  padding: 16px;
  border-radius: 12px;
  border: 2px solid #e8ddd0;
  background: white;
  color: #cc0000;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
}
.nota-modal__acciones .nombre-modal__ok { flex: 2; }

/* ── MODAL OPCIONES ── */
.opciones-modal {
  background: white; border-radius: 22px; padding: 28px;
  width: 100%; max-width: 420px; text-align: center;
}
.opciones-modal h2 {
  font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800; font-size: 24px;
  margin: 0 0 4px; color: #2c1a0e;
}
.opciones-modal__sub { color: #8c6a52; font-size: 14px; margin: 0 0 20px; font-weight: 600; }
.opciones-modal__lista { display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px; }
.opcion-btn {
  padding: 18px; border-radius: 12px; border: 2px solid #e8ddd0;
  background: white; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 19px;
  font-weight: 700; color: #2c1a0e; cursor: pointer;
  transition: background 0.1s, border-color 0.1s, color 0.1s;
}
.opcion-btn:hover { border-color: #e8621a; background: #fff5f0; color: #e8621a; }
.opciones-modal__cancelar {
  background: none; border: none; color: #8c6a52;
  font-family: 'Plus Jakarta Sans', sans-serif; font-size: 14px; font-weight: 600; cursor: pointer;
}

/* ── COBRO ── */
.cobro-overlay {
  position: fixed; inset: 0; background: rgba(26,14,6,0.55);
  display: flex; align-items: center; justify-content: center; z-index: 1100; padding: 20px;
}
.cobro {
  background: #ffffff; border-radius: 22px; width: 100%; max-width: 460px;
  padding: 22px; display: flex; flex-direction: column; gap: 16px;
  max-height: 92vh; overflow-y: auto;
  box-shadow: 0 24px 60px rgba(26,14,6,0.25);
}
.cobro__header { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
.cobro__header-textos { min-width: 0; }
.cobro__titulo { margin: 0; font-size: 21px; font-weight: 800; color: #2c1a0e; }
.cobro__sub {
  margin: 2px 0 0; font-size: 13.5px; font-weight: 600; color: #8a7362;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.cobro__cerrar {
  width: 36px; height: 36px; border-radius: 50%; border: none; flex-shrink: 0;
  background: #f4ede5; color: #6b5444; cursor: pointer; font-size: 15px; font-weight: 700;
}
.cobro__cerrar:hover { background: #ebe0d4; }

.cobro__monto {
  background: #faf6f1; border: 1px solid #f0e6da; border-radius: 16px;
  padding: 16px 18px; display: flex; flex-direction: column; gap: 2px;
}
.cobro__monto-label {
  font-size: 11.5px; font-weight: 800; color: #b3a394;
  text-transform: uppercase; letter-spacing: 0.07em;
}
.cobro__monto-valor {
  font-size: 38px; font-weight: 800; color: #2c1a0e; line-height: 1.1;
  font-variant-numeric: tabular-nums; letter-spacing: -0.01em;
}

/* Control segmentado: Efectivo / Tarjeta (cobro y dividir cuenta) */
.segmento {
  display: grid; grid-template-columns: 1fr 1fr; gap: 4px;
  background: #f4ede5; border-radius: 13px; padding: 4px;
}
.segmento__opcion {
  height: 46px; border: none; border-radius: 10px; background: transparent;
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  color: #8a7362; cursor: pointer; transition: background 0.12s, color 0.12s, box-shadow 0.12s;
}
.segmento__opcion--activa {
  background: #ffffff; color: #2c1a0e;
  box-shadow: 0 1px 2px rgba(44,26,14,0.08), 0 2px 8px rgba(44,26,14,0.06);
}
.segmento__icono {
  width: 19px; height: 19px; fill: none; stroke: currentColor;
  stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; flex-shrink: 0;
}
.segmento__opcion--activa .segmento__icono { stroke: #e8621a; }
.segmento__texto { font-size: 15px; font-weight: 700; }

.cobro__efectivo { display: flex; flex-direction: column; gap: 10px; }
.cobro__label {
  display: flex; align-items: baseline; justify-content: space-between; gap: 8px;
  font-size: 11.5px; font-weight: 800; color: #b3a394;
  text-transform: uppercase; letter-spacing: 0.07em;
}
.cobro__label-opcional {
  font-size: 12px; font-weight: 600; color: #c9bbad;
  text-transform: none; letter-spacing: 0;
}

/* Campo de monto con "Q" adelante */
.campo-monto {
  display: flex; align-items: center; gap: 6px;
  border: 1.5px solid #e6dacd; border-radius: 14px; padding: 0 16px;
  background: #ffffff; transition: border-color 0.12s, box-shadow 0.12s;
}
.campo-monto:focus-within { border-color: #e8621a; box-shadow: 0 0 0 3px rgba(232,98,26,0.12); }
.campo-monto__prefijo { font-size: 23px; font-weight: 700; color: #b3a394; }
.campo-monto__input {
  flex: 1; min-width: 0; height: 60px; border: none; outline: none; background: transparent;
  font-size: 28px; font-weight: 800; color: #2c1a0e; font-variant-numeric: tabular-nums;
}
.campo-monto__input::placeholder { font-size: 28px; font-weight: 700; color: #d6c7b8; }
.campo-monto--compacto .campo-monto__input { height: 52px; font-size: 24px; }
.campo-monto--compacto .campo-monto__input::placeholder { font-size: 20px; }
.campo-monto--compacto .campo-monto__prefijo { font-size: 20px; }

/* Montos rápidos */
/* Flex en vez de grid fijo de 4: con 3 montos se reparten todo el ancho */
.sugerencias { display: flex; gap: 8px; }
.sug-btn {
  flex: 1; min-width: 0;
  height: 52px; border-radius: 11px; border: 1.5px solid #e6dacd; background: #ffffff;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1px;
  cursor: pointer; transition: border-color 0.12s, background 0.12s;
}
.sug-btn:hover { border-color: #d3c2b0; }
.sug-btn--activa { border-color: #e8621a; background: #fff6f0; }
.sug-btn__monto { font-size: 15px; font-weight: 700; color: #2c1a0e; font-variant-numeric: tabular-nums; }
.sug-btn__etiqueta {
  font-size: 10px; font-weight: 800; color: #b3a394;
  text-transform: uppercase; letter-spacing: 0.06em;
}
.sug-btn--activa .sug-btn__etiqueta { color: #e8621a; }

/* Cambio / faltante */
.resultado {
  display: flex; justify-content: space-between; align-items: center;
  border-radius: 13px; padding: 12px 16px;
}
.resultado__label { font-size: 14px; font-weight: 700; }
.resultado__valor { font-size: 26px; font-weight: 800; font-variant-numeric: tabular-nums; }
.resultado--cambio { background: rgba(47,140,74,0.09); color: #24733b; }
.resultado--falta  { background: rgba(204,0,0,0.06); color: #b30000; }

.cobro__nota-tarjeta {
  margin: 0; font-size: 14px; font-weight: 500; color: #6b5444; line-height: 1.45;
  background: #faf6f1; border-radius: 13px; padding: 14px 16px;
}

/* Acciones del cobro */
.cobro__acciones { display: grid; grid-template-columns: 1fr 1.6fr; gap: 10px; margin-top: 2px; }
.cobro__dividir {
  height: 56px; border-radius: 14px; border: 1.5px solid #e6dacd; background: #ffffff;
  font-size: 15px; font-weight: 700; color: #6b5444; cursor: pointer;
  transition: border-color 0.12s, color 0.12s;
}
.cobro__dividir:hover { border-color: #d3c2b0; color: #2c1a0e; }
.cobro__confirmar {
  height: 56px; border-radius: 14px; border: none; background: #2f8c4a; color: #ffffff;
  font-size: 16.5px; font-weight: 800; cursor: pointer; transition: background 0.12s;
  font-variant-numeric: tabular-nums;
}
.cobro__confirmar:hover:not(:disabled) { background: #24733b; }
.cobro__confirmar:disabled { background: #e9e1d8; color: #b3a394; cursor: not-allowed; }

/* ── GASTOS DEL TURNO ── */
.gastos {
  background: #ffffff; border-radius: 22px; width: 100%; max-width: 520px;
  padding: 22px; display: flex; flex-direction: column; gap: 18px;
  max-height: calc(100vh - 48px); overflow-y: auto;
  box-shadow: 0 24px 60px rgba(26,14,6,0.25);
}
.gastos__head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
.gastos__head-textos { min-width: 0; }
.gastos__titulo { margin: 0; font-size: 21px; font-weight: 800; color: #2c1a0e; }
.gastos__sub { margin: 2px 0 0; font-size: 13.5px; font-weight: 600; color: #8a7362; }

.gastos__form {
  display: flex; flex-direction: column; gap: 10px;
  background: #faf6f1; border: 1px solid #f0e6da; border-radius: 16px; padding: 14px;
}
.gastos__campos { display: grid; grid-template-columns: 150px 1fr; gap: 10px; }
.gastos__campo { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.gastos__concepto {
  width: 100%; height: 52px; border: 1.5px solid #e6dacd; border-radius: 14px; padding: 0 14px;
  background: #ffffff; font-size: 16px; font-weight: 600; color: #2c1a0e; outline: none;
  transition: border-color 0.12s, box-shadow 0.12s;
}
.gastos__concepto:focus { border-color: #e8621a; box-shadow: 0 0 0 3px rgba(232,98,26,0.12); }
.gastos__concepto::placeholder { font-size: 15px; font-weight: 500; color: #c9bbad; }
.gastos__chips { display: flex; flex-wrap: wrap; gap: 6px; }
.gastos__chip {
  height: 34px; padding: 0 12px; border-radius: 999px; border: 1.5px solid #e6dacd; background: #ffffff;
  font-size: 13px; font-weight: 700; color: #6b5444; cursor: pointer;
  transition: border-color 0.12s, background 0.12s, color 0.12s;
}
.gastos__chip--activo { border-color: #e8621a; background: #fff6f0; color: #c04e10; }
.gastos__registrar {
  height: 50px; border-radius: 13px; border: none; background: #2c1a0e; color: #ffffff;
  font-size: 15px; font-weight: 800; cursor: pointer; font-variant-numeric: tabular-nums;
  transition: background 0.12s;
}
.gastos__registrar:hover:not(:disabled) { background: #45301f; }
.gastos__registrar:disabled { background: #e9e1d8; color: #b3a394; cursor: not-allowed; }

.gastos__lista { display: flex; flex-direction: column; gap: 8px; }
.gastos__vacio { margin: 0; padding: 6px 0; font-size: 13.5px; font-weight: 500; color: #a3948a; }
.gasto-row {
  display: flex; align-items: center; gap: 12px; min-height: 56px;
  padding: 8px 10px 8px 14px; border: 1px solid #efe6dc; border-radius: 12px;
}
.gasto-row--confirmando { background: rgba(204,0,0,0.04); border-color: rgba(204,0,0,0.2); }
.gasto-row__info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
.gasto-row__concepto {
  font-size: 15px; font-weight: 700; color: #2c1a0e;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.gasto-row__hora { font-size: 12px; font-weight: 500; color: #a3948a; }
.gasto-row__monto { font-size: 15.5px; font-weight: 800; color: #b3261e; font-variant-numeric: tabular-nums; }
.gasto-row__pregunta { flex: 1; min-width: 0; font-size: 13.5px; font-weight: 700; color: #2c1a0e; }
.gasto-row__confirmar { display: flex; gap: 6px; flex-shrink: 0; }
.gasto-row__no,
.gasto-row__si {
  height: 38px; padding: 0 14px; border-radius: 10px;
  font-size: 13px; font-weight: 800; cursor: pointer;
}
.gasto-row__no { border: 1px solid #e6dacd; background: #ffffff; color: #6b5444; }
.gasto-row__si { border: none; background: #cc0000; color: #ffffff; }

.gastos__resumen {
  display: flex; flex-direction: column; gap: 10px;
  padding-top: 14px; border-top: 1px solid #f2ebe3;
}
.gastos__resumen-fila { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; }
.gastos__resumen-label { font-size: 14px; font-weight: 700; color: #6b5444; }
.gastos__resumen-valor { font-size: 17px; font-weight: 800; color: #2c1a0e; font-variant-numeric: tabular-nums; }
.gastos__resumen-fila--caja { background: #2c1a0e; border-radius: 12px; padding: 12px 14px; align-items: center; }
.gastos__resumen-fila--caja .gastos__resumen-label { color: rgba(255,255,255,0.75); }
.gastos__resumen-fila--caja .gastos__resumen-valor { color: #ffffff; font-size: 22px; }

@media (max-width: 560px) {
  .gastos__campos { grid-template-columns: 1fr; }
}

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
.alerta-card h2 { color: white; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800; font-size: 24px; margin: 0 0 16px; }
.alerta-detalle {
  background: rgba(255,255,255,0.05); border-radius: 12px;
  padding: 16px; margin-bottom: 20px; text-align: left;
}
.alerta-detalle p { color: #e0e0e0; margin: 8px 0; font-size: 16px; font-weight: 600; }
.alerta-total { color: #f5a623 !important; font-weight: 800 !important; font-size: 26px !important; margin-top: 12px !important; }
.alerta-btn {
  width: 100%; padding: 16px; background: #e8621a; color: white; border: none;
  border-radius: 12px; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 17px;
  font-weight: 700; cursor: pointer; transition: background 0.1s;
}
.alerta-btn:hover { background: #c04e10; }

/* ── Transiciones (solo drawer) ── */
.drawer-enter-active, .drawer-leave-active { transition: opacity 0.2s; }
.drawer-enter-from, .drawer-leave-to { opacity: 0; }
.drawer-enter-active .drawer, .drawer-leave-active .drawer { transition: transform 0.25s cubic-bezier(0.32,0.72,0,1); }
.drawer-enter-from .drawer, .drawer-leave-to .drawer { transform: translateX(-100%); }

/* ── Responsive ── */
/* Tablets en horizontal (10", 8" y similares): mantiene las 2 columnas, solo ajusta proporciones */
@media (max-width: 1180px) {
  .pos-view { grid-template-columns: 1fr 360px; }
  .pos-productos { grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); }
}

/* Pantallas angostas: Sunmi de mano en modo celular, teléfonos */
@media (max-width: 680px) {
  .pos-view { grid-template-columns: 1fr; grid-template-rows: 1fr auto; }
  .pos-resumen { max-height: 44vh; }
  .pos-productos { grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); }
}

@media (max-width: 680px) {
  .navbar { height: 54px; padding: 0 8px; }
  .nav-tab { padding: 0 10px; font-size: 12.5px; }
  .navbar__divisor { margin: 0 6px; }
  .contenido { padding: 10px; }
  .lista-grid { grid-template-columns: 1fr; }
}

/* ── TURNOS ── */
.turno-overlay {
  position: fixed; inset: 0; background: rgba(26,14,6,0.85);
  display: flex; align-items: center; justify-content: center;
  z-index: 2000; padding: 20px;
}

.turno-modal {
  background: white; border-radius: 24px; padding: 32px;
  width: 100%; max-width: 500px; text-align: center;
  max-height: 92vh; overflow-y: auto;
}

.turno-modal h2 {
  font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800; font-size: 24px;
  margin: 0 0 6px; color: #2c1a0e;
}

.turno-modal__sub { color: #8c6a52; font-size: 15px; margin: 0 0 24px; font-weight: 600; }

.turno-modal__label {
  display: block; font-size: 12px; font-weight: 700;
  letter-spacing: 0.08em; text-transform: uppercase;
  color: #8c6a52; margin-bottom: 8px; text-align: left;
}

.turno-modal__input {
  width: 100%; padding: 14px; border: 2px solid #e8ddd0; border-radius: 12px;
  font-family: 'Plus Jakarta Sans', sans-serif; font-size: 22px; font-weight: 800;
  color: #2c1a0e; outline: none; text-align: center; margin-bottom: 14px;
}
.turno-modal__input:focus { border-color: #e8621a; }

.turno-modal__rapidos {
  display: grid; grid-template-columns: repeat(2, 1fr);
  gap: 8px; margin-bottom: 20px;
}

.tr-btn {
  padding: 12px; border-radius: 10px; border: 2px solid #e8ddd0;
  background: white; font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 14px; font-weight: 700; color: #6b3a1f; cursor: pointer;
  transition: border-color 0.1s, color 0.1s;
}
.tr-btn:hover { border-color: #e8621a; color: #e8621a; }

.turno-modal__ok {
  width: 100%; padding: 16px; border-radius: 14px; border: none;
  background: #3aa65a; color: white; font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 15.5px; font-weight: 800; cursor: pointer; transition: background 0.1s;
}
.turno-modal__ok:hover { background: #2f8c4a; }

.turno-modal__acciones { display: grid; grid-template-columns: 1fr 2fr; gap: 10px; }

.turno-modal__cancelar {
  padding: 16px; border-radius: 14px; border: 2px solid #e8ddd0;
  background: white; font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 14.5px; font-weight: 700; color: #8c6a52; cursor: pointer;
}

/* Resumen del cierre */
.cierre-resumen {
  background: #fdf8f2; border: 1.5px solid #f0e6d8; border-radius: 16px;
  padding: 18px; margin-bottom: 20px; text-align: left;
  display: flex; flex-direction: column; gap: 16px;
}

.cierre-total {
  display: flex; align-items: baseline; justify-content: space-between;
  padding-bottom: 14px; border-bottom: 1.5px solid #f0e4d8;
}
.cierre-total__label { font-size: 13px; font-weight: 700; color: #8a7362; }
.cierre-total__valor { font-size: 24px; font-weight: 800; color: #e8621a; }
.cierre-nota { margin: -4px 0 0; font-size: 11.5px; font-weight: 500; color: #a3948a; line-height: 1.4; }

.cierre-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px 16px; }
.cierre-stat { display: flex; flex-direction: column; gap: 3px; }
.cierre-stat__label { font-size: 11.5px; font-weight: 600; color: #b3a394; }
.cierre-stat__valor { font-size: 15px; font-weight: 700; color: #2c1a0e; }
.cierre-stat__valor--gasto { color: #b3261e; }

.cierre-diferencia {
  padding: 11px; border-radius: 10px; font-size: 14px; text-align: center;
  font-weight: 700; margin-bottom: 18px;
}
/* Sin esto el texto ("Caja cuadrada", "Faltan Q…") heredaba los 24px globales */
.cierre-diferencia span { font-size: 14px; font-weight: 700; }
.cierre-sin-conteo {
  margin: 0 0 18px; padding: 10px 12px; border-radius: 10px; text-align: center;
  background: #faf6f1; font-size: 13px; font-weight: 600; color: #8a7362; line-height: 1.4;
}
.cierre-diferencia--ok    { background: #eaf9ee; color: #1a6b32; border: 1px solid #b7e8c4; }
.cierre-diferencia--falta { background: #fff0f0; color: #cc0000; border: 1px solid #ffcccc; }
.cierre-diferencia--sobra { background: #fff8e8; color: #8a5a00; border: 1px solid #f0d9a0; }

/* Pendientes */
.pendientes-lista {
  display: flex; flex-direction: column; gap: 8px;
  margin-bottom: 24px; max-height: 260px; overflow-y: auto;
}
.pendiente-item {
  display: grid; grid-template-columns: 1fr auto auto;
  gap: 12px; align-items: center;
  background: #fdf8f2; border: 1px solid #f0e6d8;
  border-radius: 10px; padding: 12px 14px; text-align: left;
}
.pendiente-item__nombre { font-size: 15px; font-weight: 700; color: #2c1a0e; }
.pendiente-item__estado { font-size: 13px; color: #8c6a52; font-weight: 600; }
.pendiente-item__total { font-size: 15px; font-weight: 800; color: #e8621a; }

/* Drawer nuevos botones */
.drawer__sin-turno {
  background: #f7efe6; border-radius: 14px;
  padding: 20px; text-align: center; color: #b3a394;
  font-size: 14px; margin: 0; font-weight: 600;
}
.drawer__btn--historial { color: #2c1a0e; }
.drawer__btn--cerrar-turno { color: #e8621a; }
.drawer__btn--extras { color: #2c1a0e; }
.drawer__btn--gastos {
  color: #2c1a0e; display: flex; align-items: center; justify-content: space-between; gap: 10px;
}
.drawer__btn-contador {
  font-size: 11.5px; font-weight: 800; color: #8a7362;
  background: #f4ede5; padding: 2px 9px; border-radius: 999px;
}

/* ── DIVIDIR CUENTA ── */
.dividir-overlay {
  position: fixed; inset: 0; background: rgba(26,14,6,0.6);
  display: flex; align-items: center; justify-content: center;
  z-index: 1200; padding: 16px;
}
.dividir {
  background: #ffffff; border-radius: 22px;
  width: 100%; max-width: 920px; max-height: 92vh;
  display: flex; flex-direction: column; overflow: hidden;
  box-shadow: 0 24px 60px rgba(26,14,6,0.25);
}

.dividir__head {
  display: flex; align-items: flex-start; justify-content: space-between; gap: 12px;
  padding: 20px 24px 16px; border-bottom: 1px solid #f2ebe3;
}
.dividir__titulo { margin: 0; font-size: 21px; font-weight: 800; color: #2c1a0e; }
.dividir__sub { margin: 2px 0 0; font-size: 13.5px; font-weight: 600; color: #8a7362; }
.dividir__x {
  width: 36px; height: 36px; border-radius: 50%; border: none; flex-shrink: 0;
  background: #f4ede5; color: #6b5444; cursor: pointer; font-size: 15px; font-weight: 700;
}
.dividir__x:hover { background: #ebe0d4; }

.dividir__cuerpo {
  flex: 1; min-height: 0; display: grid; grid-template-columns: 1.15fr 1fr; overflow: hidden;
}
.dividir__col {
  padding: 18px 24px; overflow-y: auto; min-height: 0;
  display: flex; flex-direction: column; gap: 12px;
}
.dividir__col--cobro { background: #faf6f1; border-left: 1px solid #f2ebe3; }

.dividir__col-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.dividir__label {
  font-size: 11.5px; font-weight: 800; color: #b3a394;
  text-transform: uppercase; letter-spacing: 0.07em;
}
.dividir__acciones-mini { display: flex; gap: 4px; }
.dividir__mini {
  border: none; background: transparent; cursor: pointer;
  font-size: 13px; font-weight: 700; color: #e8621a; padding: 6px 8px; border-radius: 8px;
}
.dividir__mini:hover { background: rgba(232,98,26,0.08); }

/* Lista de productos por cobrar */
.dividir__items { display: flex; flex-direction: column; gap: 8px; }
.item-div {
  display: grid; grid-template-columns: 26px 1fr auto; align-items: center; gap: 12px;
  min-height: 54px; padding: 10px 14px; border-radius: 13px;
  border: 1.5px solid #efe6dc; background: #ffffff; cursor: pointer; text-align: left;
  transition: border-color 0.12s, background 0.12s;
}
.item-div:hover { border-color: #e2d3c3; }
.item-div--sel { border-color: #e8621a; background: #fff6f0; }
.item-div__check {
  width: 24px; height: 24px; border-radius: 7px; border: 1.5px solid #d8c9b9; background: #ffffff;
  display: flex; align-items: center; justify-content: center;
  transition: background 0.12s, border-color 0.12s;
}
.item-div__check svg {
  width: 15px; height: 15px; fill: none; stroke: #ffffff; stroke-width: 2.6;
  stroke-linecap: round; stroke-linejoin: round; opacity: 0; transition: opacity 0.12s;
}
.item-div--sel .item-div__check { background: #e8621a; border-color: #e8621a; }
.item-div--sel .item-div__check svg { opacity: 1; }
.item-div__nombre { font-size: 15px; font-weight: 600; color: #2c1a0e; line-height: 1.3; }
.item-div__precio { font-size: 15px; font-weight: 700; color: #2c1a0e; font-variant-numeric: tabular-nums; }
.dividir__vacio {
  margin: 0; padding: 22px 16px; text-align: center; border-radius: 13px;
  font-size: 14.5px; font-weight: 700; color: #24733b; background: rgba(47,140,74,0.08);
}

/* Columna de cobro */
.dividir__monto {
  background: #ffffff; border: 1px solid #efe6dc; border-radius: 16px;
  padding: 14px 16px; display: flex; flex-direction: column; gap: 2px;
}
.dividir__monto-label {
  font-size: 11.5px; font-weight: 800; color: #b3a394;
  text-transform: uppercase; letter-spacing: 0.07em;
}
.dividir__monto-valor {
  font-size: 32px; font-weight: 800; color: #2c1a0e; line-height: 1.1;
  font-variant-numeric: tabular-nums;
}
.dividir__col--cobro .segmento { background: #efe5da; }
.dividir__efectivo { display: flex; flex-direction: column; gap: 8px; }
.dividir__cobrar {
  height: 52px; border-radius: 13px; border: none; background: #e8621a; color: #ffffff;
  font-size: 15.5px; font-weight: 800; cursor: pointer; transition: background 0.12s;
  font-variant-numeric: tabular-nums;
}
.dividir__cobrar:hover:not(:disabled) { background: #c04e10; }
.dividir__cobrar:disabled { background: #e9e1d8; color: #b3a394; cursor: not-allowed; }

/* Pagos ya registrados */
.dividir__pagos { display: flex; flex-direction: column; gap: 8px; margin-top: 4px; }
.pago-row {
  display: grid; grid-template-columns: 28px 1fr auto; gap: 10px; align-items: center;
  background: #ffffff; border: 1px solid #efe6dc; border-radius: 12px; padding: 10px 12px;
}
.pago-row__num {
  width: 26px; height: 26px; border-radius: 50%; background: rgba(47,140,74,0.11);
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 800; color: #24733b;
}
.pago-row__info { display: flex; flex-direction: column; min-width: 0; }
.pago-row__monto { font-size: 15px; font-weight: 800; color: #2c1a0e; font-variant-numeric: tabular-nums; }
.pago-row__metodo { font-size: 12px; font-weight: 600; color: #8a7362; margin-left: 4px; }
.pago-row__items {
  font-size: 12px; font-weight: 500; color: #a3948a;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.pago-row__x {
  width: 30px; height: 30px; border-radius: 50%; border: none;
  background: #f4ede5; color: #8a7362; cursor: pointer; font-size: 12px; font-weight: 700;
}
.pago-row__x:hover { background: rgba(204,0,0,0.1); color: #cc0000; }

/* Pie: progreso + finalizar */
.dividir__footer {
  display: flex; align-items: center; gap: 20px;
  padding: 16px 24px; border-top: 1px solid #f2ebe3; background: #ffffff;
}
.dividir__progreso { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 8px; }
.dividir__progreso-textos { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; }
.dividir__cobrado { font-size: 15px; font-weight: 800; color: #2c1a0e; font-variant-numeric: tabular-nums; }
.dividir__de { font-size: 13px; font-weight: 600; color: #a3948a; margin-left: 2px; }
.dividir__falta { font-size: 13.5px; font-weight: 700; color: #a4640f; font-variant-numeric: tabular-nums; }
.dividir__ok { font-size: 13.5px; font-weight: 700; color: #24733b; }
.dividir__barra { height: 8px; border-radius: 999px; background: #f2ebe3; overflow: hidden; }
.dividir__barra-relleno {
  height: 100%; border-radius: 999px; background: #2f8c4a;
  transition: width 0.25s ease;
}
.dividir__confirmar {
  height: 54px; padding: 0 34px; border-radius: 14px; border: none;
  background: #2f8c4a; color: #ffffff;
  font-size: 16px; font-weight: 800; cursor: pointer; transition: background 0.12s;
}
.dividir__confirmar:hover:not(:disabled) { background: #24733b; }
.dividir__confirmar:disabled { background: #e9e1d8; color: #b3a394; cursor: not-allowed; }

@media (max-width: 900px) {
  .dividir__cuerpo { grid-template-columns: 1fr; overflow-y: auto; }
  .dividir__col { overflow: visible; }
  .dividir__col--cobro { border-left: none; border-top: 1px solid #f2ebe3; }
  .dividir__footer { flex-direction: column; align-items: stretch; gap: 12px; }
}

</style>