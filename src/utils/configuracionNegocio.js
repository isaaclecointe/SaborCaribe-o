import { db } from '../firebase.js'
import {
  collection, doc, getDoc, getDocs, setDoc, writeBatch, query, where,
  limit, serverTimestamp, Timestamp
} from 'firebase/firestore'

// ── Crear un negocio, pasar los datos viejos e invitar personal ──
// Lo usan ConfigurarNegocio.vue (primera vez) y GestionNegocio.vue (dueño).

// "Sabor Caribeño" → "sabor-caribeno"
export function slug(texto) {
  return String(texto || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
}

// ── Datos de antes (colecciones sueltas, sin negocio ni sucursal) ──
const COLECCIONES_VIEJAS = ['turnos', 'pedidos', 'productosPos', 'extras']

export async function hayDatosAnteriores() {
  for (const nombre of COLECCIONES_VIEJAS) {
    try {
      const snap = await getDocs(query(collection(db, nombre), limit(1)))
      if (!snap.empty) return true
    } catch {
      // Sin permiso para leer lo viejo: no hay nada que ofrecer migrar
    }
  }
  return false
}

// ¿A qué sucursal va un pedido viejo? Los de la web ya dicen su sucursal
// (jicaro, yupiltepeque, atescatempa); los del POS eran todos del mostrador
// donde estaba la tablet.
export function sucursalDePedido(pedido, idsSucursales, porDefecto) {
  return idsSucursales.includes(pedido.sucursalId) ? pedido.sucursalId : porDefecto
}

// Escribe en tandas de 400 (Firebase acepta hasta 500 por tanda)
async function escribirEnTandas(escrituras, progreso, texto) {
  for (let i = 0; i < escrituras.length; i += 400) {
    const batch = writeBatch(db)
    escrituras.slice(i, i + 400).forEach(([ref, datos]) => batch.set(ref, datos))
    await batch.commit()
    progreso?.(`${texto} (${Math.min(i + 400, escrituras.length)} de ${escrituras.length})`)
  }
}

// Copia (no mueve) lo viejo dentro del negocio. Los documentos conservan
// su id, así que repetirla no duplica nada. Lo viejo queda como respaldo.
export async function migrarDatosAnteriores(negocioId, sucursalDestino, idsSucursales, progreso) {
  const rutaSucursal = s => ['negocios', negocioId, 'sucursales', s]
  const resumen = { turnos: 0, pedidos: 0, productos: 0, extras: 0 }

  progreso?.('Leyendo los datos actuales…')
  const [turnos, pedidos, productos, extras, contador] = await Promise.all([
    getDocs(collection(db, 'turnos')),
    getDocs(collection(db, 'pedidos')),
    getDocs(collection(db, 'productosPos')),
    getDocs(collection(db, 'extras')),
    getDoc(doc(db, 'contadores', 'pedidosDiarios')).catch(() => null)
  ])

  const escrituras = []
  turnos.forEach(d => {
    escrituras.push([doc(db, ...rutaSucursal(sucursalDestino), 'turnos', d.id), d.data()])
    resumen.turnos++
  })
  pedidos.forEach(d => {
    const s = sucursalDePedido(d.data(), idsSucursales, sucursalDestino)
    escrituras.push([doc(db, ...rutaSucursal(s), 'pedidos', d.id), d.data()])
    resumen.pedidos++
  })
  productos.forEach(d => {
    escrituras.push([doc(db, 'negocios', negocioId, 'productosPos', d.id), d.data()])
    resumen.productos++
  })
  extras.forEach(d => {
    escrituras.push([doc(db, 'negocios', negocioId, 'extras', d.id), d.data()])
    resumen.extras++
  })
  if (contador?.exists()) {
    escrituras.push([doc(db, ...rutaSucursal(sucursalDestino), 'contadores', 'pedidosDiarios'), contador.data()])
  }

  await escribirEnTandas(escrituras, progreso, 'Copiando datos')
  return resumen
}

// ── Crear el negocio (la primera vez) ──
// El orden importa por las reglas de seguridad: primero el negocio (dice
// quién es el dueño), luego el dueño como miembro, luego lo demás. El
// puntero usuarios/{uid} va al final: si algo falla a medias, la pantalla
// de configuración vuelve a aparecer y se puede repetir sin duplicar.
export async function crearNegocio({ user, nombre, negocioId, sucursales, migrarA, progreso }) {
  const refNegocio = doc(db, 'negocios', negocioId)

  progreso?.('Creando el negocio…')
  let existente = null
  try {
    existente = await getDoc(refNegocio)
  } catch (e) {
    // Sin permiso para leerlo: es de otra persona
    if (e?.code === 'permission-denied') throw new Error('Ya existe un negocio con ese nombre. Usa otro nombre.')
    throw e
  }
  if (existente.exists() && existente.data().duenoUid !== user.uid) {
    throw new Error('Ya existe un negocio con ese nombre. Usa otro nombre.')
  }
  if (!existente.exists()) {
    await setDoc(refNegocio, { nombre: nombre.trim(), duenoUid: user.uid, creado: serverTimestamp() })
  }

  await setDoc(doc(db, 'negocios', negocioId, 'miembros', user.uid), {
    rol: 'dueno', sucursales: [], email: user.email || '', creado: serverTimestamp()
  })

  progreso?.('Creando las sucursales…')
  const batch = writeBatch(db)
  sucursales.forEach((s, i) => {
    batch.set(doc(db, 'negocios', negocioId, 'sucursales', s.id), {
      nombre: s.nombre.trim(), orden: (i + 1) * 10, creado: serverTimestamp()
    }, { merge: true })
  })
  await batch.commit()

  let resumen = null
  if (migrarA) {
    resumen = await migrarDatosAnteriores(negocioId, migrarA, sucursales.map(s => s.id), progreso)
  }

  await setDoc(doc(db, 'usuarios', user.uid), { negocioId, actualizado: serverTimestamp() })
  return resumen
}

// ── Invitaciones ──
// Un código de 8 letras/números (sin 0/O ni 1/I para no confundirlos).
// Vale 7 días y una sola vez.
const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function generarCodigo() {
  const bytes = new Uint8Array(8)
  crypto.getRandomValues(bytes)
  return [...bytes].map(b => ALFABETO[b % ALFABETO.length]).join('')
}

// "abcd-1234 " → "ABCD1234"
export function normalizarCodigo(texto) {
  return String(texto || '').toUpperCase().replace(/[^A-Z0-9]/g, '')
}

export function formatoCodigo(codigo) {
  return `${codigo.slice(0, 4)}-${codigo.slice(4)}`
}

export async function crearInvitacion({ negocioId, rol, sucursales, creadoPor }) {
  const codigo = generarCodigo()
  const vence = Timestamp.fromMillis(Date.now() + 7 * 24 * 3600 * 1000)
  await setDoc(doc(db, 'invitaciones', codigo), {
    negocioId, rol, sucursales: rol === 'dueno' ? [] : sucursales,
    creadoPor, creado: serverTimestamp(), vence, usada: false
  })
  return codigo
}

// Usar un código: crea el miembro, marca el código como usado y guarda el
// puntero, todo en UNA tanda (las reglas exigen que vayan juntos, así un
// código no se puede usar dos veces).
export async function unirseConCodigo(user, textoCodigo) {
  const codigo = normalizarCodigo(textoCodigo)
  if (codigo.length !== 8) throw new Error('El código tiene 8 letras y números.')

  const snap = await getDoc(doc(db, 'invitaciones', codigo)).catch(() => null)
  if (!snap?.exists()) throw new Error('Ese código no existe. Revísalo con el dueño.')
  const inv = snap.data()
  if (inv.usada) throw new Error('Ese código ya se usó. Pide uno nuevo.')
  if (inv.vence?.toMillis && inv.vence.toMillis() < Date.now()) throw new Error('Ese código ya venció. Pide uno nuevo.')

  const batch = writeBatch(db)
  batch.set(doc(db, 'negocios', inv.negocioId, 'miembros', user.uid), {
    rol: inv.rol, sucursales: inv.sucursales || [], email: user.email || '',
    invitacion: codigo, creado: serverTimestamp()
  })
  batch.update(doc(db, 'invitaciones', codigo), { usada: true, usadaPor: user.uid, usadaEn: serverTimestamp() })
  batch.set(doc(db, 'usuarios', user.uid), { negocioId: inv.negocioId, actualizado: serverTimestamp() })
  await batch.commit()
  return inv
}

// Los códigos sin usar que creó este dueño (las reglas solo dejan ver los propios)
export function invitacionesPendientesQuery(negocioId, uid) {
  return query(
    collection(db, 'invitaciones'),
    where('creadoPor', '==', uid),
    where('negocioId', '==', negocioId),
    where('usada', '==', false)
  )
}