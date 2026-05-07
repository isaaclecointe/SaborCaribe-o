<template>
    <navbar />

  <section class="menu">
    <!-- Header -->
    <div class="menu__header">
      <p class="menu__pretitle">— Lo que tenemos hoy —</p>
      <h2 class="menu__title">Nuestro <span>Menú</span></h2>
      <p class="menu__subtitle">Todo hecho con sabor, todo hecho con amor.</p>
    </div>

    <!-- Filtros de categoría -->
    <div class="menu__filters">
      <button
        v-for="cat in categorias"
        :key="cat.nombre"
        class="filter-btn"
        :class="{ 'filter-btn--active': categoriaActiva === cat.nombre }"
        @click="categoriaActiva = cat.nombre"
      >
        <span class="filter-btn__emoji">{{ cat.emoji }}</span>
        <span>{{ cat.nombre }}</span>
      </button>
    </div>

    <!-- Grid de productos -->
    <div class="menu__grid">
      <div
        v-for="(producto, index) in productosFiltrados"
        :key="producto.id"
        class="card"
        :style="{ animationDelay: `${index * 0.07}s` }"
        @click="abrirModal(producto)"
      >
        <!-- Badge -->
        <div v-if="producto.tag" class="card__badge">{{ producto.tag }}</div>

        <!-- Imagen / Emoji placeholder -->
<div class="card__image">
  <img
    v-if="producto.imagen"
    :src="getImagen(producto.imagen)"
    :alt="producto.nombre"
    class="card__img"
  />
  <span v-else class="card__emoji">{{ producto.emoji }}</span>
  <div class="card__image-glow"></div>
</div>

        <!-- Contenido -->
        <div class="card__body">
          <span class="card__categoria">{{ producto.categoria }}</span>
          <h3 class="card__nombre">{{ producto.nombre }}</h3>
          <p class="card__descripcion">{{ producto.descripcion }}</p>

          <div class="card__footer">
            <span class="card__precio">Q{{ producto.precio }}</span>
            <button class="card__btn" @click.stop="abrirModal(producto)">
              Ver detalle →
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de detalle -->
    <Transition name="modal">
      <div v-if="modalProducto" class="modal-overlay" @click.self="cerrarModal">
        <div class="modal">
          <button class="modal__close" @click="cerrarModal">✕</button>

          <div class="modal__image">
  <img
    v-if="modalProducto.imagen"
    :src="getImagen(modalProducto.imagen)"
    :alt="modalProducto.nombre"
    class="modal__img"
  />
  <span v-else class="modal__emoji">{{ modalProducto.emoji }}</span>
</div>

          <div class="modal__content">
            <div v-if="modalProducto.tag" class="card__badge card__badge--modal">
              {{ modalProducto.tag }}
            </div>
            <span class="card__categoria">{{ modalProducto.categoria }}</span>
            <h2 class="modal__nombre">{{ modalProducto.nombre }}</h2>
            <p class="modal__descripcion">{{ modalProducto.descripcion }}</p>

            <!-- Opciones -->
            <div v-if="modalProducto.opciones" class="modal__opciones">
              <p class="modal__opciones-titulo">Disponible en:</p>
              <div class="modal__opciones-lista">
                <span
                  v-for="op in modalProducto.opciones"
                  :key="op"
                  class="opcion-tag"
                >{{ op }}</span>
              </div>
            </div>

            <div class="modal__footer">
              <span class="modal__precio">Q{{ modalProducto.precio }}</span>
              <button class="modal__btn" @click="cerrarModal">
                ¡Lo quiero! 🔥
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue'
import productos from '../../assets/data/productos.json'
import navbar from '../Home/NavBar.vue'

const imagenesMenu = import.meta.glob('../../assets/FotosMenu/*.{jpg,png,webp}', { eager: true, })
function getImagen(archivo) {
  const key = `../../assets/FotosMenu/${archivo}`;
  return imagenesMenu[key]?.default
}
const categorias = [
  { nombre: 'Todos', emoji: '🍽️' },
  { nombre: 'Tortillas de Harina', emoji: '🌯' },
  { nombre: 'Quesadillas', emoji: '🧀' },
  { nombre: 'Tacos', emoji: '🌮' },
  { nombre: 'Frescos', emoji: '🍹' },
]

const categoriaActiva = ref('Todos')
const modalProducto = ref(null)

const productosFiltrados = computed(() =>
  categoriaActiva.value === 'Todos'
    ? productos
    : productos.filter(p => p.categoria === categoriaActiva.value)
)

function abrirModal(producto) {
  modalProducto.value = producto
  document.body.style.overflow = 'hidden'
}

function cerrarModal() {
  modalProducto.value = null
  document.body.style.overflow = ''
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Nunito:wght@400;500;600;700&display=swap');

/* ── Variables ── */
:root {
  --cream: #fdf6ec;
  --warm: #f5e6cc;
  --orange: #e8621a;
  --orange-dark: #c04e10;
  --brown: #3d1f0a;
  --brown-light: #6b3a1f;
  --text: #2c1a0e;
  --text-muted: #8c6a52;
  --card-bg: #fff;
  --shadow: 0 4px 24px rgba(61,31,10,0.10);
  --shadow-hover: 0 12px 40px rgba(232,98,26,0.18);
}

/* ── Sección ── */
.menu {
  background: var(--cream);
  min-height: 100vh;
  padding: 80px 24px;
  font-family: 'Nunito', sans-serif;
  position: relative;
  overflow: hidden;
}

.menu::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 6px;
  background: linear-gradient(90deg, var(--orange), #f5a623, var(--orange));
}

/* ── Header ── */
.menu__header {
  text-align: center;
  margin-bottom: 48px;
}

.menu__pretitle {
  font-size: 26px;
  color: var(--orange);
  letter-spacing: 0.2em;
  text-transform: uppercase;
  font-weight: 600;
  margin-bottom: 8px;
}

.menu__title {
  font-family: 'Playfair Display', serif;
  font-size: clamp(40px, 6vw, 72px);
  color: var(--brown);
  margin: 0 0 12px;
  line-height: 1;
}

.menu__title span {
  color: var(--orange);
  font-style: italic;
}

.menu__subtitle {
  color: var(--text-muted);
  font-size: 23px;
  margin: 0;
}

/* ── Filtros ── */
.menu__filters {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 48px;
}

.filter-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  border-radius: 100px;
  border: 2px solid var(--warm);
  background: white;
  color: var(--text-muted);
  font-family: 'Nunito', sans-serif;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.filter-btn:hover {
  border-color: var(--orange);
  color: var(--orange);
  transform: translateY(-2px);
}

.filter-btn--active {
  background: var(--orange);
  border-color: var(--orange);
  color: white;
  box-shadow: 0 4px 16px rgba(232,98,26,0.3);
}

.filter-btn__emoji {
  font-size: 16px;
}

/* ── Grid ── */
.menu__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

/* ── Card ── */
.card {
  background: var(--card-bg);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: var(--shadow);
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  position: relative;
  animation: fadeUp 0.5s ease both;
}

.card:hover {
  transform: translateY(-8px) scale(1.01);
  box-shadow: var(--shadow-hover);
}

@keyframes fadeUp {
  from { opacity: 0; transform: translateY(24px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Badge */
.card__badge {
  position: absolute;
  top: 14px;
  right: 14px;
  background: var(--orange);
  color: white;
  font-size: 11px;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 100px;
  letter-spacing: 0.05em;
  z-index: 2;
  text-transform: uppercase;
}

.card__badge--modal {
  position: static;
  display: inline-block;
  margin-bottom: 8px;
}

/* Imagen */
.card__image {
  height: 160px;
  background: linear-gradient(135deg, var(--warm) 0%, #fde9c9 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.card__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
 
}



.card__emoji {
  font-size: 72px;
  filter: drop-shadow(0 4px 12px rgba(0,0,0,0.15));
  transition: transform 0.3s ease;
}

.card:hover .card__emoji {
  transform: scale(1.15) rotate(-5deg);
}

.card__image-glow {
  position: absolute;
  width: 120px;
  height: 120px;
  background: radial-gradient(circle, rgba(232,98,26,0.15), transparent 70%);
  border-radius: 50%;
}

/* Body */
.card__body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.card__categoria {
  font-size: 11px;
  color: var(--orange);
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-weight: 700;
}

.card__nombre {
  font-family: 'Playfair Display', serif;
  font-size: 20px;
  color: var(--brown);
  margin: 0;
  line-height: 1.2;
}

.card__descripcion {
  font-size: 20px;
  color: var(--text-muted);
  line-height: 1.6;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
  padding-top: 12px;
  border-top: 1px solid var(--warm);
}

.card__precio {
  font-family: 'Playfair Display', serif;
  font-size: 24px;
  font-weight: 900;
  color: var(--brown);
}

.card__btn {
  font-family: 'Nunito', sans-serif;
  font-size: 13px;
  font-weight: 700;
  color: var(--orange);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  transition: letter-spacing 0.2s;
}

.card__btn:hover {
  letter-spacing: 0.05em;
}

/* ── Modal ── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(44, 26, 14, 0.7);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 24px;
}

.modal {
  background: white;
  border-radius: 28px;
  max-width: 480px;
  width: 100%;
  overflow: hidden;
  position: relative;
  box-shadow: 0 32px 80px rgba(0,0,0,0.3);
}

.modal__close {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: var(--warm);
  color: var(--brown);
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
  transition: background 0.2s;
}

.modal__close:hover {
  background: var(--orange);
  color: white;
}

.modal__image {
  height: 220px;
  background: linear-gradient(135deg, var(--warm) 0%, #fde9c9 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal__img {
  width: 100%;
  height: 220px;
  object-fit: cover;
  display: block;
}

.modal__emoji {
  font-size: 100px;
  filter: drop-shadow(0 8px 20px rgba(0,0,0,0.15));
}

.modal__content {
  padding: 28px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.modal__nombre {
  font-family: 'Playfair Display', serif;
  font-size: 28px;
  color: var(--brown);
  margin: 0;
  line-height: 1.2;
}

.modal__descripcion {
  font-size: 25px;
  color: var(--text-muted);
  line-height: 1.7;
  margin: 0;
}

.modal__opciones-titulo {
  font-size: 20px;
  color: var(--text-muted);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin: 0 0 8px;
}

.modal__opciones-lista {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.opcion-tag {
  background: var(--warm);
  color: var(--brown-light);
  padding: 4px 14px;
  border-radius: 100px;
  font-size: 23px;
  font-weight: 600;
}

.modal__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 16px;
  border-top: 1px solid var(--warm);
  margin-top: 4px;
}

.modal__precio {
  font-family: 'Playfair Display', serif;
  font-size: 36px;
  font-weight: 900;
  color: var(--brown);
}

.modal__btn {
  background: var(--orange);
  color: rgb(0, 0, 0);
  border: none;
  padding: 14px 28px;
  border-radius: 100px;
  font-family: 'Nunito', sans-serif;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 16px rgba(232,98,26,0.35);
}

.modal__btn:hover {
  background: var(--orange-dark);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(232,98,26,0.4);
}

/* ── Transición modal ── */
.modal-enter-active, .modal-leave-active {
  transition: opacity 0.3s ease;
}
.modal-enter-active .modal, .modal-leave-active .modal {
  transition: transform 0.3s ease;
}
.modal-enter-from, .modal-leave-to {
  opacity: 0;
}
.modal-enter-from .modal {
  transform: translateY(40px) scale(0.95);
}
.modal-leave-to .modal {
  transform: translateY(20px) scale(0.97);
}

/* ── Tablet ── */
@media (max-width: 1023px) {
  .menu__grid {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  }
}

/* ── Mobile ── */
@media (max-width: 767px) {
  .menu {
    padding: 60px 16px;
  }

  .menu__grid {
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }

  .card__image {
    height: 0;
    padding-bottom: 65%;
    position: relative;
  }

    .card__img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }


  .card__emoji {
    font-size: 52px;
  }

  .card__body {
    padding: 14px;
    gap: 6px;
  }

  .card__nombre {
    font-size: 15px;
  }

  .card__descripcion {
    display: none;
  }

  .card__precio {
    font-size: 18px;
  }

  .card__btn {
    font-size: 12px;
  }

  .filter-btn span:last-child {
    display: none;
  }

  .filter-btn {
    padding: 10px 14px;
  }
}

@media (max-width: 400px) {
  .menu__grid {
    grid-template-columns: 1fr;
  }
}
</style>