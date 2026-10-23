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
        <span class="turno-stat__label">Efectivo</span>
        <strong class="turno-stat__valor">Q{{ ventasEfectivo }}</strong>
      </div>
      <div class="turno-stat">
        <span class="turno-stat__label">Tarjeta</span>
        <strong class="turno-stat__valor">Q{{ ventasTarjeta }}</strong>
      </div>
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
                <span v-if="pedido.numero" class="pedido__numero">
                  #{{ String(pedido.numero).padStart(3, '0') }}
                </span>
              </p>
              <p class="pedido__sucursal">
                📍 {{ pedido.sucursal || 'Mostrador' }}
                <span v-if="pedido.tipoOrden === 'local'"> · 🍽️ Comer acá</span>
                <span v-if="pedido.origen !== 'pos'" class="pedido__origen-web"> · 🌐 Web</span>
              </p>
              <p v-if="pedido.comentario" class="pedido__comentario">💬 {{ pedido.comentario }}</p>
             <p v-if="pedido.pagado && (!pedido.pagos || pedido.pagos.length === 0)" class="pedido__pagado">
                ✅ Pagado · {{ pedido.metodoPago === 'efectivo' ? '💵 Efectivo' : '💳 Tarjeta' }}
              </p>

              <div v-else-if="pedido.pagos && pedido.pagos.length > 0" class="pedido__pagos">
                <span class="pedido__pagos-titulo">💰 Pagos divididos</span>
                <div v-for="(pg, i) in pedido.pagos" :key="i" class="pedido__pago">
                  <span>{{ pg.metodo === 'efectivo' ? '💵' : '💳' }} Q{{ pg.monto }}</span>
                  <span class="pedido__pago-items">{{ pg.items.join(', ') }}</span>
                </div>
              </div>

              <p v-else-if="pedido.estado !== 'cancelado'" class="pedido__pendiente">
                ⏳ Pendiente de pago
              </p>
            </div>

            <div class="pedido__productos">
              <div v-for="(prod, i) in pedido.productos" :key="i" class="pedido__producto">
                <div class="pedido__producto-texto">
                  <span>{{ prod.cantidad }}x {{ prod.nombre }}</span>
                  <span v-if="prod.comentario || prod.extras?.length" class="pedido__producto-nota">
                    📝 {{ [prod.extras?.map(nombreExtraConCantidad).join(', '), prod.comentario].filter(Boolean).join(' · ') }}
                  </span>
                </div>
                <span class="pedido__producto-precio">Q{{ prod.subtotal }}</span>
              </div>
            </div>
            <div class="pedido__footer">
              <div class="pedido__totales">
                <span class="pedido__total">Total: Q{{ pedido.total }}</span>
                <span v-if="pedido.montoPagado > 0 && pedido.montoPagado < pedido.total" class="pedido__resta">
                  Pagado Q{{ pedido.montoPagado }} · Falta Q{{ pedido.total - pedido.montoPagado }}
                </span>
              </div>
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
        @keyup.enter="confirmarNombre"
      />

      <div class="nombre-modal__rapidos">
        <button v-for="n in nombresRapidos" :key="n" class="rapido-btn" @click="nombrePedido = n">
          {{ n }}
        </button>
      </div>
    </div>

    <button class="nombre-modal__ok" @click="confirmarNombre">Continuar</button>
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

           <button class="cobro__dividir" @click="abrirDividir">
              🧾 Dividir cuenta
           </button>

       <button class="cobro__confirmar" :disabled="!puedeConfirmar" @click="confirmarCobro">
         Confirmar cobro
       </button>

        </div>
      </div>
    </Transition>


    <!-- ── MODAL DIVIDIR CUENTA ── -->
<div v-if="modoDividir" class="dividir-overlay">
  <div class="dividir">

    <div class="dividir__head">
      <div>
        <h2>Dividir cuenta</h2>
        <p class="dividir__sub">Total Q{{ montoACobrar }}</p>
      </div>
      <button class="dividir__x" @click="cerrarDividir">✕</button>
    </div>

    <div class="dividir__cuerpo">

      <!-- Columna productos -->
      <div class="dividir__col">
        <div class="dividir__col-head">
          <span class="dividir__label">Sin pagar</span>
          <div class="dividir__acciones-mini">
            <button v-if="itemsDisponibles.length" @click="seleccionarTodos">Todos</button>
            <button v-if="itemsSeleccionados.size" @click="limpiarSeleccion">Ninguno</button>
          </div>
        </div>

        <div class="dividir__chips">
          <button
            v-for="item in itemsDisponibles"
            :key="item.uid"
            class="chip"
            :class="{ 'chip--sel': itemsSeleccionados.has(item.uid) }"
            @click="toggleItem(item.uid)"
          >
            <span class="chip__nombre">{{ item.nombre }}</span>
            <span class="chip__precio">Q{{ item.precio }}</span>
          </button>

          <p v-if="!itemsDisponibles.length" class="dividir__vacio">
            ✅ Todo pagado
          </p>
        </div>
      </div>

      <!-- Columna cobro -->
      <div class="dividir__col dividir__col--cobro">

        <div class="dividir__monto">
          <span>A cobrar</span>
          <strong>Q{{ totalSeleccionado }}</strong>
        </div>

        <div class="dividir__metodos">
          <button
            class="metodo-btn"
            :class="{ 'metodo-btn--activo': metodoPago === 'efectivo' }"
            @click="metodoPago = 'efectivo'"
          >💵 Efectivo</button>
          <button
            class="metodo-btn"
            :class="{ 'metodo-btn--activo': metodoPago === 'tarjeta' }"
            @click="metodoPago = 'tarjeta'"
          >💳 Tarjeta</button>
        </div>

        <div v-if="metodoPago === 'efectivo' && totalSeleccionado > 0" class="dividir__efectivo">
          <input
            v-model.number="efectivoParcial"
            type="number"
            class="dividir__input"
            placeholder="Recibido"
          />
          <div class="dividir__sugs">
            <button
              v-for="s in sugerenciasParcial"
              :key="s"
              class="sug-btn"
              @click="efectivoParcial = s"
            >Q{{ s }}</button>
          </div>
          <div v-if="efectivoParcial >= totalSeleccionado" class="dividir__cambio">
            <span>Cambio</span><strong>Q{{ efectivoParcial - totalSeleccionado }}</strong>
          </div>
        </div>

        <button
          class="dividir__cobrar"
          :disabled="!puedeCobrarParcial"
          @click="cobrarParcial"
        >
          Cobrar Q{{ totalSeleccionado }}
        </button>

        <!-- Pagos registrados -->
        <div v-if="pagosRealizados.length" class="dividir__pagos">
          <span class="dividir__label">Pagos registrados</span>
          <div v-for="(p, i) in pagosRealizados" :key="i" class="pago-row">
            <span class="pago-row__metodo">{{ p.metodo === 'efectivo' ? '💵' : '💳' }}</span>
            <div class="pago-row__info">
              <strong>Q{{ p.monto }}</strong>
              <span>{{ p.items.join(', ') }}</span>
            </div>
            <button class="pago-row__x" @click="quitarPago(i)">✕</button>
          </div>
        </div>

      </div>
    </div>

    <div class="dividir__footer">
      <div class="dividir__resumen">
        <span>Cobrado: <strong>Q{{ totalCobradoParcial }}</strong></span>
        <span v-if="faltaPorCobrar > 0" class="dividir__falta">
          Falta: <strong>Q{{ faltaPorCobrar }}</strong>
        </span>
        <span v-else class="dividir__ok">✅ Completo</span>
      </div>
      <button
        class="dividir__confirmar"
        :disabled="!pagosRealizados.length"
        @click="confirmarDivision"
      >
        Finalizar
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
          <span class="cierre-stat__label">Ventas tarjeta</span>
          <strong class="cierre-stat__valor">Q{{ ventasTarjeta }}</strong>
        </div>
        <div class="cierre-stat">
          <span class="cierre-stat__label">Total vendido</span>
          <strong class="cierre-stat__valor">Q{{ ventasEfectivo + ventasTarjeta }}</strong>
        </div>
      </div>
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
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { signOut } from 'firebase/auth'
import productosData from '../../assets/data/productos.json'
import { db, auth } from '../../firebase.js'
import { siguienteNumeroPedido, reiniciarContadorPedidos } from '../../utils/pedidosNumero.js'
import {
  collection, addDoc, onSnapshot, doc, updateDoc, orderBy,
  query, serverTimestamp, writeBatch, getDocs, where, limit
} from 'firebase/firestore'
import { useExtras } from '../../composables/useExtras.js'
import GestionExtras from '../admin/GestionExtras.vue'

//import { imprimirTicketCocina, probarImpresora } from '../../impresora.js'

const nombresCortosPos = {
  5:'Quesadillas',
  6: 'Quesadilla Peperonne y Jamon'
}
// ── Productos fusionados solo para el POS ──
const fusionesPOS = [
  {
    id: 'tortilla-grande',
    nombre: 'Tortilla Grande',
    categoria: 'Tortillas de Harina',
    reemplaza: [2, 3],        // ids que oculta del grid
    opciones: [
      { nombre: 'Pollo',   precio: 31 },
      { nombre: 'Adobado', precio: 31 },
      { nombre: 'Res',     precio: 33 }
    ]
  },
  {
    id: 'yogurt',
    nombre: 'Yogurt',
    categoria: 'Postres',
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

  // Inserta las fusiones en la posición del primer id que reemplazan
  const resultado = [...normales]
  fusionesPOS.forEach(f => {
    const precioBase = Math.min(...f.opciones.map(o => o.precio))
    resultado.push({ ...f, precio: precioBase, esFusion: true })
  })

  return resultado.sort((a, b) => {
    const ia = typeof a.id === 'number' ? a.id : 2.5
    const ib = typeof b.id === 'number' ? b.id : 2.5
    return ia - ib
  })
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
    esDelTurnoActual(p) && (
      (p.tipoOrden !== 'local' && enProceso.includes(p.estado)) ||
      (p.tipoOrden === 'local' && ['nuevo', 'guardado'].includes(p.estado))
    )
  ).length
)

const contadorLocal = computed(() =>
  pedidos.value.filter(p =>
    esDelTurnoActual(p) && enProceso.includes(p.estado) && p.tipoOrden === 'local'
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
function esDelTurnoActual(p) {
  if (!turnoActual.value?.fechaApertura?.toDate) return false
  if (!p.fecha?.toDate) return false
  return p.fecha.toDate() >= turnoActual.value.fechaApertura.toDate()
}

const pedidosVista = computed(() => {
 const delTurno = pedidos.value.filter(esDelTurnoActual)

  if (tabActivo.value === 'activos')
    return delTurno.filter(p =>
      (p.tipoOrden !== 'local' && enProceso.includes(p.estado)) ||
      (p.tipoOrden === 'local' && ['nuevo', 'guardado'].includes(p.estado))
    )
  if (tabActivo.value === 'local')
    return delTurno.filter(p => enProceso.includes(p.estado) && p.tipoOrden === 'local')
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

// ── Nombre por defecto ──
// Usa pedidosTurno (no pedidosHoy): el número real que se guarda
// ahora se reinicia por turno, así que la sugerencia tiene que
// contar los pedidos del turno actual, no los de todo el día.
function nombrePorDefecto() {
  const n = pedidosTurno.value.length + 1
  return `Orden #${String(n).padStart(3, '0')}`
}

// ── Nombre del pedido ──
async function pedirNombre(accion) {
  accionPendiente.value = accion

  // Si ya tiene nombre (pedido existente), no preguntar de nuevo
  if (pedidoEditando.value?.cliente) {
    const nombre = pedidoEditando.value.cliente
    if (accion === 'guardar') {
      persistirPedido('guardado', pedidoEditando.value.tipoOrden || 'llevar', nombre)
    } else if (accion === 'local') {
      persistirPedido('guardado', 'local', nombre)
    } else if (accion === 'cobrar') {
      abrirCobro(nombre)
    }
    return
  }

  // Solo pide nombre para pedidos nuevos
  nombrePedido.value = nombrePorDefecto()
  modalNombre.value = true

  document.body.style.overflow = 'hidden'
  document.body.style.position = 'fixed'
  document.body.style.width = '100%'

  await nextTick()
  inputNombre.value?.focus()
  inputNombre.value?.select()
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
  modalNombre.value = false
  liberarScrollModalNombre()
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

    await updateDoc(doc(db, 'pedidos', pedidoEditando.value.id), {
      cliente: nombre,
      tipoOrden: tipoOrden || pedidoEditando.value.tipoOrden,
      productos,
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
      estado: (nuevoPagado >= totalOrden.value && pedidoEditando.value.estado === 'listo')
        ? 'entregado'
        : (pedidoEditando.value.estado === 'listo' ? 'listo' : 'nuevo')
    }
  : {})
    })
  } else {
    // Crear pedido nuevo
    const numeroPedido = await siguienteNumeroPedido()
    await addDoc(collection(db, 'pedidos'), {
      cliente: nombre,
      numero: numeroPedido,
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
    })
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

// Sugerencias para el pago parcial
const sugerenciasParcial = computed(() => {
  const m = totalSeleccionado.value
  if (m <= 0) return []
  const redondeo = Math.ceil(m / 5) * 5
  const base = [20, 50, 100, 200]
  const set = new Set([m, redondeo, ...base.filter(v => v >= m)])
  return [...set].filter(v => v >= m).sort((a, b) => a - b).slice(0, 4)
})

const puedeCobrarParcial = computed(() => {
  if (totalSeleccionado.value <= 0) return false
  if (metodoPago.value === 'tarjeta') return true
  return efectivoParcial.value >= totalSeleccionado.value
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
  const datosPago = {
    metodo: metodoPago.value,
    monto: montoACobrar.value,
    recibido: metodoPago.value === 'efectivo' ? efectivoRecibido.value : null,
    cambio: metodoPago.value === 'efectivo' ? efectivoRecibido.value - montoACobrar.value : null,
    totalEfectivo: metodoPago.value === 'efectivo' ? montoACobrar.value : 0,
    totalTarjeta: metodoPago.value === 'tarjeta' ? montoACobrar.value : 0
  }
 // Restaura el id por si algo lo borró
  if (cobroPedidoId.value) pedidoEditandoId.value = cobroPedidoId.value

  {
    await persistirPedido(
      'nuevo',
      pedidoEditando.value?.tipoOrden || 'llevar',
      nombreParaCobro.value,
      datosPago
    )
  }
  cerrarCobro()
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

  pagosRealizados.value.push({
    monto: totalSeleccionado.value,
    metodo: metodoPago.value,
    recibido: metodoPago.value === 'efectivo' ? efectivoParcial.value : null,
    cambio: metodoPago.value === 'efectivo'
      ? efectivoParcial.value - totalSeleccionado.value
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

  await persistirPedido(
    'nuevo',
    pedidoEditando.value?.tipoOrden || 'llevar',
    nombreParaCobro.value,
    datosPago
  )

  cerrarDividir()
  cerrarCobro()
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

// ── Pedidos del turno actual ──
const pedidosTurno = computed(() => {
  if (!turnoActual.value?.fechaApertura?.toDate) return []
  const inicio = turnoActual.value.fechaApertura.toDate()
  return pedidos.value.filter(p =>
    p.fecha?.toDate && p.fecha.toDate() >= inicio && p.estado !== 'cancelado'
  )
})

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

const efectivoEsperado = computed(() =>
  (turnoActual.value?.fondoInicial || 0) + ventasEfectivo.value
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

// ── TURNOS ──
async function abrirTurno() {
  const fondo = Number(fondoInicial.value) || 0
  await addDoc(collection(db, 'turnos'), {
    abierto: true,
    fondoInicial: fondo,
    fechaApertura: serverTimestamp(),
    fechaCierre: null,
    ventasEfectivo: 0,
    ventasTarjeta: 0,
    totalVentas: 0,
    cantidadPedidos: 0,
    efectivoContado: null,
    diferencia: null
  })
  // El primer pedido de cada turno nuevo siempre empieza en #001,
  // aunque sea el mismo día y ya hayas cerrado un turno anterior.
  await reiniciarContadorPedidos()
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

async function cerrarTurno() {
  if (!turnoActual.value) return
  await updateDoc(doc(db, 'turnos', turnoActual.value.id), {
    abierto: false,
    fechaCierre: serverTimestamp(),
    ventasEfectivo: ventasEfectivo.value,
    ventasTarjeta: ventasTarjeta.value,
    totalVentas: ventasEfectivo.value + ventasTarjeta.value,
    cantidadPedidos: pedidosTurno.value.length,
    efectivoContado: Number(efectivoContado.value) || 0,
    diferencia: diferenciaCaja.value
  })
  modalCerrarTurno.value = false
  efectivoContado.value = null
}

function irAlHistorial() {
  menuAbierto.value = false
  router.push('/historial')
}

// ── Firebase ──
onMounted(() => {

    escucharExtras()

    limpiarDocumentosVacios()

    // ── Escucha el turno abierto ──
  const qTurno = query(
    collection(db, 'turnos'),
    where('abierto', '==', true),
    limit(1)
  )
  unsubTurno = onSnapshot(qTurno, (snap) => {
    turnoActual.value = snap.empty
      ? null
      : { id: snap.docs[0].id, ...snap.docs[0].data() }
    cargandoTurno.value = false
    if (!turnoActual.value) modalAbrirTurno.value = true
    else modalAbrirTurno.value = false
  })

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

/* ── TICKET ── */
.pedido {
  background: #1a1a1a; border-radius: 16px; padding: 20px;
  border: 1px solid rgba(255,255,255,0.08); position: relative;
  font-family: 'Plus Jakarta Sans', sans-serif;
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
.pedido__estado-badge { font-size: 16px; font-weight: 700; color: white; }
.pedido__tiempo { font-size: 13px; color: rgba(255,255,255,0.4); font-weight: 600; }

.pedido__info { margin-bottom: 12px; }
.pedido__cliente {
  font-size: 20px; font-weight: 700; color: white; margin: 0 0 4px;
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  font-family: 'Plus Jakarta Sans', sans-serif;
}
.pedido__numero {
  font-size: 12px; background: rgba(255,255,255,0.1);
  padding: 3px 10px; border-radius: 100px; color: rgba(255,255,255,0.6);
  font-weight: 700;
}
.pedido__sucursal { font-size: 15px; color: #e8621a; margin: 0 0 4px; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 600; }
.pedido__origen-web { font-size: 15px; font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 600; }
.pedido__comentario { font-size: 14px; color: rgba(255,255,255,0.5); margin: 6px 0 0; font-style: italic; }
.pedido__pagado { font-size: 13px; color: #25d366; margin: 6px 0 0; font-weight: 700; font-family: 'Plus Jakarta Sans', sans-serif; }
.pedido__pendiente { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 13px; color: #f5a623; margin: 6px 0 0; font-weight: 700; }

.pedido__productos {
  border-top: 1px solid rgba(255,255,255,0.08);
  border-bottom: 1px solid rgba(255,255,255,0.08);
  padding: 12px 0; margin-bottom: 12px;
  display: flex; flex-direction: column; gap: 8px;
  font-family: 'Plus Jakarta Sans', sans-serif;
}
.pedido__producto {
  display: flex; justify-content: space-between; align-items: flex-start;
  font-family: 'Plus Jakarta Sans', sans-serif;
}
.pedido__producto-texto { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.pedido__producto-texto > span:first-child {
  font-size: 16px; font-weight: 600; color: rgba(255,255,255,0.92);
}
.pedido__producto-nota { font-size: 12px; font-weight: 600; color: #f5a623; }
.pedido__producto-precio { font-size: 16px; font-weight: 600; color: rgba(255,255,255,0.92); flex-shrink: 0; margin-left: 10px; }

.pedido__footer {
  display: flex; justify-content: space-between; align-items: center;
  gap: 10px; flex-wrap: wrap;
}

.pedido__totales { display: flex; flex-direction: column; gap: 2px; }
.pedido__resta { font-size: 13px; color: #f5a623; font-weight: 700; }

.pedido__total { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 20px; color: #f5a623; font-weight: 800; }
.pedido__acciones { display: flex; gap: 8px; flex-wrap: wrap; }

.pedido__hint {
  font-size: 11px; color: rgba(255,255,255,0.25); margin: 10px 0 0;
  text-align: center; letter-spacing: 0.05em; font-weight: 600;
}

.accion-btn {
  padding: 10px 18px; border-radius: 8px; border: none;
  font-family: 'Plus Jakarta Sans', sans-serif; font-size: 14px; font-weight: 700;
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
.nombre-modal__ok:hover { background: #c04e10; }

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
  position: fixed; inset: 0; background: rgba(26,14,6,0.6);
  display: flex; align-items: center; justify-content: center; z-index: 1100; padding: 20px;
}
.cobro {
  background: white; border-radius: 22px; width: 100%; max-width: 440px;
  padding: 24px; display: flex; flex-direction: column; gap: 18px;
  max-height: 92vh; overflow-y: auto;
}
.cobro__header { display: flex; justify-content: space-between; align-items: center; }
.cobro__header h2 { font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800; font-size: 24px; margin: 0; color: #2c1a0e; }
.cobro__cerrar {
  width: 34px; height: 34px; border-radius: 50%; border: none;
  background: #f0e6d8; cursor: pointer; color: #6b3a1f;
}
.cobro__monto {
  background: #1a0e06; border-radius: 14px; padding: 18px;
  display: flex; justify-content: space-between; align-items: center;
  color: rgba(255,255,255,0.6); font-weight: 700;
}
.cobro__monto strong { font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800; font-size: 32px; color: #f5a623; }
.cobro__metodos { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.metodo-btn {
  padding: 18px; border-radius: 12px; border: 2px solid #e8ddd0; background: white;
  font-family: 'Plus Jakarta Sans', sans-serif; font-size: 16px; font-weight: 700;
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
  font-family: 'Plus Jakarta Sans', sans-serif; font-size: 28px; font-weight: 800;
  color: #2c1a0e; outline: none; text-align: center;
}
.cobro__input:focus { border-color: #e8621a; }
.cobro__sugerencias { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.sug-btn {
  padding: 14px 4px; border-radius: 10px; border: 2px solid #e8ddd0; background: white;
  font-family: 'Plus Jakarta Sans', sans-serif; font-size: 15px; font-weight: 700;
  color: #6b3a1f; cursor: pointer; transition: border-color 0.1s, color 0.1s;
}
.sug-btn:hover { border-color: #e8621a; color: #e8621a; }
.cobro__cambio {
  display: flex; justify-content: space-between; align-items: center;
  background: #eaf9ee; border: 1px solid #b7e8c4; border-radius: 12px;
  padding: 14px 18px; font-weight: 700; color: #1a6b32;
}
.cobro__cambio strong { font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 800; font-size: 28px; }
.cobro__falta {
  background: #fff0f0; border: 1px solid #ffcccc; color: #cc0000;
  border-radius: 12px; padding: 12px 16px; font-size: 14px;
  font-weight: 700; margin: 0; text-align: center;
}
.cobro__confirmar {
  padding: 20px; border-radius: 14px; border: none; background: #25d366;
  color: white; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 18px;
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

.cierre-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px 16px; }
.cierre-stat { display: flex; flex-direction: column; gap: 3px; }
.cierre-stat__label { font-size: 11.5px; font-weight: 600; color: #b3a394; }
.cierre-stat__valor { font-size: 15px; font-weight: 700; color: #2c1a0e; }

.cierre-diferencia {
  padding: 11px; border-radius: 10px; font-size: 14px; text-align: center;
  font-weight: 700; margin-bottom: 18px;
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

/* ── DIVIDIR CUENTA ── */
.dividir-overlay {
  position: fixed; inset: 0; background: rgba(26,14,6,0.75);
  display: flex; align-items: center; justify-content: center;
  z-index: 1200; padding: 16px;
  font-family: 'Plus Jakarta Sans', sans-serif;
}

.dividir {
  background: white; border-radius: 20px;
  width: 100%; max-width: 900px; max-height: 92vh;
  display: flex; flex-direction: column; overflow: hidden;
}

.dividir__head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 18px 22px; border-bottom: 1px solid #f0e6d8;
}
.dividir__head h2 { font-size: 24px; font-weight: 800; margin: 0; color: #2c1a0e; }
.dividir__sub { font-size: 16px; color: #8c6a52; margin: 2px 0 0; font-weight: 600; }
.dividir__x {
  width: 34px; height: 34px; border-radius: 50%; border: none;
  background: #f0e6d8; color: #6b3a1f; cursor: pointer;
}

.dividir__cuerpo {
  flex: 1; display: grid; grid-template-columns: 1.2fr 1fr;
  gap: 0; overflow: hidden;
}

.dividir__col {
  padding: 18px 22px; overflow-y: auto;
  display: flex; flex-direction: column; gap: 12px;
}
.dividir__col--cobro { background: #fdf8f2; border-left: 1px solid #f0e6d8; }

.dividir__col-head {
  display: flex; align-items: center; justify-content: space-between;
}
.dividir__label {
  font-size: 13px; font-weight: 800; letter-spacing: 0.08em;
  text-transform: uppercase; color: #8c6a52;
}
.dividir__acciones-mini { display: flex; gap: 8px; }
.dividir__acciones-mini button {
  background: none; border: none; color: #e8621a;
  font-size: 15px; font-weight: 700; cursor: pointer;
  font-family: 'Plus Jakarta Sans', sans-serif;
}

.dividir__chips { display: flex; flex-wrap: wrap; gap: 8px; align-content: start; }

.chip {
  display: flex; flex-direction: column; gap: 4px;
  padding: 16px 20px; border-radius: 12px;
  border: 2px solid #e8ddd0; background: white;
  cursor: pointer; text-align: left;
  font-family: 'Plus Jakarta Sans', sans-serif;
  transition: border-color 0.1s, background 0.1s;
}
.chip:hover { border-color: #e8621a; }
.chip--sel { border-color: #e8621a; background: #fff5f0; }
.chip__nombre { font-size: 17px; font-weight: 700; color: #2c1a0e; }
.chip__precio { font-size: 18px; font-weight: 800; color: #e8621a; }

.dividir__vacio {
  color: #25d366; font-size: 18px; font-weight: 700;
  padding: 24px 0; margin: 0; width: 100%; text-align: center;
}

.dividir__monto {
  background: #1a0e06; border-radius: 12px; padding: 16px 20px;
  display: flex; justify-content: space-between; align-items: center;
  color: rgba(255,255,255,0.6); font-weight: 700; font-size: 16px;
}
.dividir__monto strong { font-size: 32px; font-weight: 800; color: #f5a623; }

.dividir__metodos { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }

.dividir__efectivo { display: flex; flex-direction: column; gap: 8px; }

.dividir__input {
  padding: 16px; border: 2px solid #e8ddd0; border-radius: 10px;
  font-family: 'Plus Jakarta Sans', sans-serif; font-size: 26px; font-weight: 800;
  color: #2c1a0e; outline: none; text-align: center;
}
.dividir__input:focus { border-color: #e8621a; }

.dividir__sugs { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }

.dividir__cambio {
  display: flex; justify-content: space-between; align-items: center;
  background: #eaf9ee; border: 1px solid #b7e8c4; border-radius: 10px;
  padding: 14px 18px; font-weight: 700; color: #1a6b32; font-size: 16px;
}
.dividir__cambio strong { font-size: 26px; font-weight: 800; }

.dividir__cobrar {
  padding: 18px; border-radius: 12px; border: none;
  background: #e8621a; color: white;
  font-family: 'Plus Jakarta Sans', sans-serif; font-size: 18px; font-weight: 800;
  cursor: pointer;
}
.dividir__cobrar:disabled { opacity: 0.3; cursor: not-allowed; }
.dividir__cobrar:hover:not(:disabled) { background: #c04e10; }

.dividir__pagos { display: flex; flex-direction: column; gap: 8px; margin-top: 4px; }

.pago-row {
  display: grid; grid-template-columns: auto 1fr auto;
  gap: 10px; align-items: center;
  background: white; border: 1px solid #e8ddd0;
  border-radius: 10px; padding: 10px 12px;
}
.pago-row__metodo { font-size: 22px; }
.pago-row__info { display: flex; flex-direction: column; min-width: 0; }
.pago-row__info strong { font-size: 17px; color: #2c1a0e; font-weight: 700; }
.pago-row__info span {
  font-size: 13px; color: #8c6a52; font-weight: 600;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.pago-row__x {
  width: 26px; height: 26px; border-radius: 50%; border: none;
  background: #f0e6d8; color: #8c6a52; cursor: pointer; font-size: 12px;
}
.pago-row__x:hover { background: #cc0000; color: white; }

.dividir__footer {
  display: flex; align-items: center; justify-content: space-between;
  gap: 16px; padding: 16px 22px; border-top: 1px solid #f0e6d8;
  background: white;
}
.dividir__resumen { display: flex; gap: 20px; font-size: 16px; color: #6b3a1f; font-weight: 600; }
.dividir__resumen strong { color: #2c1a0e; font-weight: 700; }
.dividir__falta strong { color: #cc0000; }
.dividir__ok { color: #25d366; font-weight: 800; }

.dividir__confirmar {
  padding: 18px 36px; border-radius: 12px; border: none;
  background: #25d366; color: white;
  font-family: 'Plus Jakarta Sans', sans-serif; font-size: 18px; font-weight: 800;
  cursor: pointer;
}
.dividir__confirmar:disabled { opacity: 0.3; cursor: not-allowed; }
.dividir__confirmar:hover:not(:disabled) { background: #1fb855; }

/* Botón dividir dentro del modal de cobro */
.cobro__dividir {
  padding: 16px; border-radius: 12px;
  border: 2px solid #e8ddd0; background: white;
  font-family: 'Plus Jakarta Sans', sans-serif; font-size: 15px; font-weight: 700;
  color: #6b3a1f; cursor: pointer;
}
.cobro__dividir:hover { border-color: #e8621a; color: #e8621a; }

@media (max-width: 900px) {
  .dividir__cuerpo { grid-template-columns: 1fr; }
  .dividir__col--cobro { border-left: none; border-top: 1px solid #f0e6d8; }
  .dividir__footer { flex-direction: column; align-items: stretch; }
}

/* ── PEDIDO DETALLE PAGO ── */
.pedido__pagos {
  margin-top: 8px; padding: 8px 10px;
  background: rgba(255,255,255,0.04); border-radius: 8px;
  display: flex; flex-direction: column; gap: 4px;
}
.pedido__pagos-titulo {
  font-size: 11px; font-weight: 800; letter-spacing: 0.08em;
  text-transform: uppercase; color: rgba(255,255,255,0.4);
}
.pedido__pago {
  display: flex; flex-direction: column; gap: 1px;
  font-size: 13px; color: rgba(255,255,255,0.75); font-weight: 600;
}
.pedido__pago-items {
  font-size: 11px; color: rgba(255,255,255,0.4);
}
</style>