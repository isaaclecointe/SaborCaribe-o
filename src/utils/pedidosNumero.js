import { db } from '../firebase.js'
import { doc, runTransaction, setDoc } from 'firebase/firestore'

// Genera el siguiente número de orden para los pedidos WEB
// (CarritoSheet.vue). El POS ya no usa esta función: calcula su número
// en la tablet y luego avisa con registrarNumeroUsado() (más abajo), así
// las dos fuentes comparten una sola secuencia.
//
// ¿Cuándo se reinicia a #001?
//   1. Cada vez que se abre un turno nuevo (ver reiniciarContadorPedidos,
//      llamado desde abrirTurno() en POS.vue) — así el primer pedido de
//      cada turno siempre es el #001, aunque sea el mismo día y ya hayas
//      cerrado un turno anterior.
//   2. Como respaldo, también se reinicia solo si el documento es de un
//      día local anterior (por si alguna vez se deja un turno abierto de
//      un día para otro sin cerrarlo).
//
// ¿Por qué una transacción y no "contar cuántos pedidos hay hoy"?
// Porque desde la web el cliente NO tiene sesión (no hace login),
// y las reglas de Firestore solo dejan LEER la colección "pedidos"
// a usuarios autenticados. Si quisiéramos contar pedidos de hoy
// desde la web, Firestore rechazaría la lectura por permisos.
//
// En cambio, aquí solo leemos y escribimos UN documento contador
// (colección "contadores", doc "pedidosDiarios"), que sí dejamos
// abierto a cualquiera en las reglas. La transacción garantiza que,
// aunque lleguen dos pedidos al mismo tiempo (uno del POS y uno de
// la web, por ejemplo), nunca se repita el mismo número.
// OJO: no usar new Date().toISOString() aquí — eso da la fecha en UTC,
// y Guatemala va 6 horas detrás de UTC. Eso significa que a partir de
// las 6:00pm hora local, toISOString() ya "cree" que es el día siguiente
// y el contador se reinicia a mitad del día (el bug de "iba en #003 y
// volvió a #001"). Por eso armamos la fecha a mano con la hora LOCAL
// del dispositivo.
function fechaLocalHoy() {
  const d = new Date()
  const year = d.getFullYear()
  const mes = String(d.getMonth() + 1).padStart(2, '0')
  const dia = String(d.getDate()).padStart(2, '0')
  return `${year}-${mes}-${dia}`
}

export async function siguienteNumeroPedido() {
  const hoy = fechaLocalHoy()
  const ref = doc(db, 'contadores', 'pedidosDiarios')

  return await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(ref)

    // No existe el contador todavía, o es de un día anterior: reinicia en 1.
    if (!snap.exists() || snap.data().fecha !== hoy) {
      transaction.set(ref, { fecha: hoy, ultimo: 1 })
      return 1
    }

    const siguiente = (snap.data().ultimo || 0) + 1
    transaction.update(ref, { ultimo: siguiente })
    return siguiente
  })
}

// El POS calcula sus números en la propia tablet (sin esperar internet)
// y después llama a esta función para que el contador sepa qué número se
// usó, así el próximo pedido web sigue la misma secuencia. Solo sube el
// contador, nunca lo baja. Corre en segundo plano: si falla (por ejemplo,
// sin internet), el pedido del POS ya quedó guardado igual.
export function registrarNumeroUsado(numero) {
  const ref = doc(db, 'contadores', 'pedidosDiarios')
  return runTransaction(db, async (transaction) => {
    const snap = await transaction.get(ref)
    const actual = snap.exists() ? (snap.data().ultimo || 0) : 0
    if (numero > actual) {
      transaction.set(ref, { fecha: fechaLocalHoy(), ultimo: numero }, { merge: true })
    }
  }).catch(e => console.warn('No se pudo sincronizar el contador web (el pedido sí se guardó):', e))
}

// Reinicia el contador a 0 (el próximo pedido será #001).
// Se llama desde abrirTurno() en POS.vue, justo al abrir un turno nuevo.
export async function reiniciarContadorPedidos() {
  const ref = doc(db, 'contadores', 'pedidosDiarios')
  await setDoc(ref, { fecha: fechaLocalHoy(), ultimo: 0 })
}