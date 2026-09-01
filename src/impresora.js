// ══════════════════════════════════════════
//  Módulo de impresión — Epson TM-m30III
//  Ticket de cocina vía ePOS-Print
// ══════════════════════════════════════════

const IMPRESORA_IP = '192.168.1.9'   // ⚠️ cambia si la IP cambia

const ENDPOINT = `http://${IMPRESORA_IP}/cgi-bin/epos/service.cgi?devid=local_printer&timeout=10000`

// ── Escapa caracteres XML ──
function esc(texto) {
  return String(texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// ── Fecha y hora ──
function fechaHora() {
  const d = new Date()
  const hora = d.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' })
  const fecha = d.toLocaleDateString('es-GT', { day: '2-digit', month: '2-digit', year: 'numeric' })
  return `${hora}  ${fecha}`
}

// ── XML del ticket de cocina ──
function construirTicketCocina(pedido) {
  const tipoOrden = pedido.tipoOrden === 'local' ? 'COMER ACA' : 'PARA LLEVAR'
  const origen = pedido.origen === 'pos' ? 'MOSTRADOR' : 'PEDIDO WEB'

  // Productos
  let productos = ''
  pedido.productos.forEach(p => {
    productos += `<text>${esc(p.cantidad)}x ${esc(p.nombre)}&#10;</text>`
    if (p.opcion) {
      productos += `<text>   -- ${esc(p.opcion)}&#10;</text>`
    }
  })

  // Nota
  let nota = ''
  if (pedido.comentario) {
    nota = `
      <text align="left"/>
      <text>--------------------------------&#10;</text>
      <text>NOTA:&#10;</text>
      <text>${esc(pedido.comentario)}&#10;</text>`
  }

  // Sucursal (solo pedidos web)
  let sucursal = ''
  if (pedido.origen !== 'pos' && pedido.sucursal) {
    sucursal = `<text>${esc(pedido.sucursal)}&#10;</text>`
  }

  return `<?xml version="1.0" encoding="utf-8"?>
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">
  <s:Body>
    <epos-print xmlns="http://www.epson-pos.com/schemas/2011/03/epos-print">

      <text reverse="false" ul="false" em="false" color="color_1"/>

      <text align="center"/>
      <text width="2" height="2"/>
      <text>SABOR CARIBENO&#10;</text>
      <text width="1" height="1"/>
      <text>=== COCINA ===&#10;&#10;</text>

      <text align="center"/>
      <text width="2" height="2"/>
      <text>${esc(pedido.cliente || 'Mostrador')}&#10;</text>
      <text width="1" height="1"/>
      <text>&#10;</text>

      <text align="center"/>
      <text width="2" height="2"/>
      <text>${esc(tipoOrden)}&#10;</text>
      <text width="1" height="1"/>
      <text>${esc(origen)}&#10;</text>
      ${sucursal}

      <text align="left"/>
      <text>--------------------------------&#10;</text>

      <text width="2" height="2" em="true"/>
      ${productos}
      <text width="1" height="1" em="false"/>
      ${nota}

      <text align="left"/>
      <text>--------------------------------&#10;</text>
      <text align="center"/>
      <text>${esc(fechaHora())}&#10;</text>
      <feed line="3"/>
      <cut type="feed"/>

    </epos-print>
  </s:Body>
</s:Envelope>`
}

// ── Envía el ticket ──
export async function imprimirTicketCocina(pedido) {
  const xml = construirTicketCocina(pedido)

  try {
    const respuesta = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': '""'
      },
      body: xml
    })

    const texto = await respuesta.text()

    if (texto.includes('success="true"')) {
      console.log('✅ Ticket impreso')
      return { ok: true }
    } else {
      console.warn('⚠️ Error de la impresora:', texto)
      return { ok: false, error: texto }
    }

  } catch (e) {
    console.error('❌ No se pudo conectar con la impresora:', e)
    return { ok: false, error: e.message }
  }
}

// ── Prueba de conexión ──
export async function probarImpresora() {
  const xml = `<?xml version="1.0" encoding="utf-8"?>
<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/">
  <s:Body>
    <epos-print xmlns="http://www.epson-pos.com/schemas/2011/03/epos-print">
      <text reverse="false" ul="false" em="false" color="color_1"/>
      <text align="center"/>
      <text width="2" height="2"/>
      <text>PRUEBA OK&#10;</text>
      <text width="1" height="1"/>
      <text>Sabor Caribeno&#10;</text>
      <text>${esc(fechaHora())}&#10;</text>
      <feed line="3"/>
      <cut type="feed"/>
    </epos-print>
  </s:Body>
</s:Envelope>`

  try {
    const r = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'text/xml; charset=utf-8', 'SOAPAction': '""' },
      body: xml
    })
    const t = await r.text()
    return { ok: t.includes('success="true"'), respuesta: t }
  } catch (e) {
    return { ok: false, error: e.message }
  }
}