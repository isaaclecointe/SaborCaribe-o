<template>
  <NavBar />
<div class="foto-container">
  <picture>
    <source media="(max-width: 480px)" :srcset="mobileImg">
    <img :src="desktopImg" alt="imagen" class="foto-negocio">
  </picture>
</div>

  <div>
    <p>hola</p>
  </div>
</template>

<script>
import NavBar from './NavBar.vue';
import mobileImg from '../../assets/img movil.jpg';
import desktopImg from '../../assets/imagen principal4.png';

export default {
  components: {
    NavBar
  },
  data() {
    return {
      mobileImg,
      desktopImg
    };
  }
}
</script>

<style>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.foto-container {
  width: 100%;
  height: calc(100vh - 120px);
  background-color: #d6d4d0; /* ← color gris que tiene la imagen de fondo */
  display: grid;
  place-items: center;
  overflow: hidden;
}

.foto-negocio {
  width: 100%;
  height: 100%;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;     /* ← muestra la imagen completa sin recortar */
  object-position: top center;
  display: block;
}

/* Tablet */
@media (max-width: 768px) {
  .foto-container {
    height: calc(100vh - 100px);
  }

  .foto-negocio {
    max-height: calc(100vh - 100px);
  }
}

/* Móvil */
@media (max-width: 480px) {
  .foto-container {
    height: auto;
    min-height: calc(100vh - 70px);
  }

  .foto-negocio {
    width: 100%;
    height: auto;
    max-width: 100%;
    max-height: calc(100vh - 70px);
    object-fit: scale-down;
  }
}
</style>