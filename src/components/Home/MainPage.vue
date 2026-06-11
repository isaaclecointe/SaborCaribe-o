<template>
  <NavBar />
  <div class="foto-container">
    <picture>
      <source media="(max-width: 480px)" :srcset="mobileImg">
      <img :src="desktopImg" alt="imagen" class="foto-negocio">
    </picture>

    <div class="hero-cta">
    <RouterLink to="/menu" class="hero-cta__btn">
      🌮 Ver Menú y Hacer Pedido
    </RouterLink>
  </div>
  </div>

  <!-- Sección Cómo Pedir -->
<section class="como-pedir">
  <p class="como-pedir__eyebrow">— Así de fácil —</p>
  <h2 class="como-pedir__titulo">¿Cómo hacer tu pedido?</h2>
  <div class="como-pedir__pasos">
    <div class="paso">
      <span class="paso__numero">01</span>
      <span class="paso__emoji">🍽️</span>
      <h3 class="paso__titulo">Elige tu antojo</h3>
      <p class="paso__texto">Entra al menú y selecciona lo que más se te antoje. Tortillas, tacos, quesadillas y más.</p>
    </div>
    <div class="paso__linea"></div>
    <div class="paso">
      <span class="paso__numero">02</span>
      <span class="paso__emoji">🛒</span>
      <h3 class="paso__titulo">Arma tu pedido</h3>
      <p class="paso__texto">Agrega tus productos al carrito, elige tu sucursal y deja cualquier indicación especial.</p>
    </div>
    <div class="paso__linea"></div>
    <div class="paso">
      <span class="paso__numero">03</span>
      <span class="paso__emoji">📲</span>
      <h3 class="paso__titulo">Envía por WhatsApp</h3>
      <p class="paso__texto">Con un solo toque tu pedido llega directo a la sucursal. ¡Nosotros lo preparamos!</p>
    </div>
  </div>
  <RouterLink to="/menu" class="como-pedir__btn">
    Ver el Menú →
  </RouterLink>
</section>

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

    <SeccionContacto />

    <Footer />
</template>

<script>
import { RouterLink } from 'vue-router';
import NavBar from './NavBar.vue';
import mobileImg from '../../assets/img movil.jpg';
import desktopImg from '../../assets/imagen principal4.png';
import SeccionContacto from './SeccionContacto.vue';
import Footer from '../SeccionFooter/Footer.vue';

export default {
  components: {
    NavBar,
    SeccionContacto,
    Footer,
    RouterLink
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


/* ── Hero CTA ── */
.foto-container {
  position: relative; /* ← asegúrate que ya lo tiene o agrégalo */
}

.hero-cta {
 position: absolute;
  bottom: 40px;
  right: 40px;
  z-index: 2;
}

.hero-cta__texto {
  color: white;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  text-shadow: 0 2px 8px rgba(0,0,0,0.5);
  font-family: 'Nunito', sans-serif;
}

.hero-cta__btn {
  display: inline-block;
  background: #e8621a;
  color: white;
  padding: 16px 36px;
  border-radius: 100px;
  font-family: 'Nunito', sans-serif;
  font-size: 17px;
  font-weight: 700;
  text-decoration: none;
  box-shadow: 0 8px 28px rgba(232,98,26,0.5);
  transition: all 0.25s ease;
  white-space: nowrap;
}

.hero-cta__btn:hover {
  background: #c04e10;
  transform: translateY(-3px);
  box-shadow: 0 12px 36px rgba(232,98,26,0.6);
}

/* ── Cómo Pedir ── */
.como-pedir {
  background: #fdf6ec;
  padding: 100px 24px;
  text-align: center;
}

.como-pedir__eyebrow {
  font-size: 13px;
  color: #e8621a;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  font-weight: 600;
  margin-bottom: 12px;
  font-family: 'Nunito', sans-serif;
}

.como-pedir__titulo {
  font-family: 'Playfair Display', serif;
  font-size: clamp(32px, 5vw, 56px);
  color: #3d1f0a;
  margin: 0 0 60px;
  line-height: 1.1;
}

.como-pedir__pasos {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  max-width: 1000px;
  margin: 0 auto 48px;
  flex-wrap: wrap;
}

.paso {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  max-width: 260px;
  padding: 32px 24px;
  background: white;
  border-radius: 20px;
  box-shadow: 0 4px 24px rgba(61,31,10,0.08);
  transition: transform 0.3s ease;
}

.paso:hover {
  transform: translateY(-8px);
}

.paso__numero {
  font-family: 'Playfair Display', serif;
  font-size: 13px;
  font-weight: 700;
  color: #e8621a;
  letter-spacing: 0.15em;
}

.paso__emoji {
  font-size: 48px;
}

.paso__titulo {
  font-family: 'Playfair Display', serif;
  font-size: 22px;
  color: #3d1f0a;
  margin: 0;
}

.paso__texto {
  font-size: 14px;
  color: #8c6a52;
  line-height: 1.7;
  margin: 0;
  font-family: 'Nunito', sans-serif;
}

.paso__linea {
  width: 60px;
  height: 2px;
  background: linear-gradient(90deg, #e8621a, #f5a623);
  flex-shrink: 0;
  margin: 0 8px;
}

.como-pedir__btn {
  display: inline-block;
  background: #3d1f0a;
  color: white;
  padding: 14px 32px;
  border-radius: 100px;
  font-family: 'Nunito', sans-serif;
  font-size: 16px;
  font-weight: 700;
  text-decoration: none;
  transition: all 0.25s ease;
}

.como-pedir__btn:hover {
  background: #e8621a;
  transform: translateY(-2px);
}

/* ── Mobile ── */
@media (max-width: 767px) {
  .paso__linea {
    width: 2px;
    height: 40px;
    margin: 4px 0;
  }

  .como-pedir__pasos {
    flex-direction: column;
    align-items: center;
  }

  .hero-cta {
    bottom: 20px;
    right: 50%;
    transform: translateX(50%);
  }

  .hero-cta__btn {
    font-size: 15px;
    padding: 14px 28px;
  }
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