import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCarritoStore = defineStore('carrito', () => {

  const items = ref([])
  const abierto = ref(false)

  // Agregar producto
  function agregar(producto, opcion = null) {
    // productos con opcion se tratan como items distintos 
    const key = opcion ? `${producto.id}-${opcion}` : `${producto.id}`
    const existente = items.value.find(i => i.key === key)
    if (existente) {
      existente.cantidad++
    } else {
      items.value.push({ ...producto, key, opcion,cantidad: 1 })
    }
    abierto.value = true  // abre el panel automáticamente
  }

  // Quitar una unidad
  function quitar(key) {
    const item = items.value.find(i => i.key === key)
    if (item.cantidad > 1) {
      item.cantidad--
    } else {
      items.value = items.value.filter(i => i.key !== key)
    }
  }

  function aumentar(key) {
  const item = items.value.find(i => i.key === key)
  if (item) item.cantidad++
}



  // Vaciar carrito
  function vaciar() {
    items.value = []
  }

  // Total de items (para el contador del botón flotante)
  const totalItems = computed(() =>
    items.value.reduce((sum, i) => sum + i.cantidad, 0)
  )

  // Total en quetzales
  const totalPrecio = computed(() =>
    items.value.reduce((sum, i) => sum + i.precio * i.cantidad, 0)
  )

  return { items, abierto, agregar, quitar, aumentar, vaciar, totalItems, totalPrecio }
})