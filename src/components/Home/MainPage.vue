<template>
  <NavBar />
  <div class="foto-container">
    <picture>
      <source media="(max-width: 480px)" :srcset="mobileImg">
      <img :src="desktopImg" alt="imagen" class="foto-negocio">
    </picture>
  </div>

  <div class="historia">
   <div class="historia-contenido">  <!-- ✅ Adentro del div.historia y bien cerrado -->
     <div class="video-contenedor"> 
        <video autoplay loop muted playsinline>
          <source src="/src/assets/videoTortilla.mp4" type="video/mp4" />
        </video>
        <h1 class="a-mano">HECHAS A MANO!! 🔥</h1>
      </div>

   
      <p class="info">“Nuestras tortillas de harina son ese gusto que acompaña momentos especiales, 
                       antojos y reuniones donde la comida se disfruta sin prisa. 
                       Elaboradas a mano con ingredientes frescos, cada una conserva un sabor 
                       auténtico que refleja dedicación, tradición y el placer de lo bien hecho.”</p>

    </div>
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

.historia {
  width: 100%;
  padding: 220px 16px;
  text-align: center;
  display: flex;
  justify-content: center;
}

.info {
  font-size: 1.5rem;
  text-align: justify;
  line-height: 1.6;
  margin: 0;
  flex: 1;
}

.historia-contenido {
  display: flex;
  align-items: center;
  gap: 2rem;
  max-width: 1465px;
  margin: 0 auto; /* Centra el contenido */
}

.video-contenedor {
  flex: 1;
  border-radius: 10px;
  box-shadow:0 12px 12px rgb(156 227 134);
  padding: 15px;
  padding-block-end: 60px;
  
}
.video-contenedor video {
  width: 100%;
  border-radius: 17px;
}

.a-mano {
  margin-top: 15px;
  font-size: 1.5rem;
  color: #333;
  margin-right: 50%;
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

  .historia{
    padding: 30px 16px;
  }

  .video-contenedor {
    padding: 10px;
    padding-block-end: 20px;
  }

    .video-contenedor video {
    border-radius: 8px;
  }

  .a-mano {
    font-size: 1.1rem;
    margin-right: 0;
  }

  .info {
    font-size: 1rem;
    text-align: justify;
 }
}
 @media (max-width: 768px) {
  .historia-contenido {
    flex-direction: column;
  } 
 }  


</style>