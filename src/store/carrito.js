import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCarritoStore = defineStore('carrito', () => {

  const items = ref([])
  const abierto = ref(false)

  // Agregar producto
  function agregar(producto) {
    const existente = items.value.find(i => i.id === producto.id)
    if (existente) {
      existente.cantidad++
    } else {
      items.value.push({ ...producto, cantidad: 1 })
    }
    abierto.value = true  // abre el panel automáticamente
  }

  // Quitar una unidad
  function quitar(id) {
    const item = items.value.find(i => i.id === id)
    if (item.cantidad > 1) {
      item.cantidad--
    } else {
      items.value = items.value.filter(i => i.id !== id)
    }
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

  return { items, abierto, agregar, quitar, vaciar, totalItems, totalPrecio }
})