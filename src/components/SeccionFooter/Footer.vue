<template>
  <footer class="footer">

    <!-- Ola de transición suave -->
    <div class="footer__ola">
      <svg viewBox="0 0 1440 80" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0,40 C240,80 480,0 720,40 C960,80 1200,0 1440,40 L1440,80 L0,80 Z" fill="#1a0e06"/>
      </svg>
    </div>

    <div class="footer__inner">

      <!-- Logo y descripción -->
      <div class="footer__brand">
        <img src="../../assets/Logo.svg" alt="Sabor Caribeño" class="footer__logo" />
        <p class="footer__tagline">
          Tortillas de harina artesanales.<br/>
          Hechas a mano desde 2013.
        </p>
        <div class="footer__separador"></div>
        <p class="footer__ubicacion">📍 Jutiapa, Guatemala</p>
      </div>

      <!-- Navegación -->
      <div class="footer__nav">
        <p class="footer__nav-titulo">Explora</p>
        <ul class="footer__nav-lista">
          <li><RouterLink to="/" class="footer__link">Inicio</RouterLink></li>
          <li><RouterLink to="/menu" class="footer__link">Nuestro Menú</RouterLink></li>
          <li><RouterLink to="/acerca" class="footer__link">Acerca de</RouterLink></li>
        </ul>
      </div>

    </div>

    <!-- Copyright -->
    <div class="footer__bottom">
      <div class="footer__bottom-inner">
        <p class="footer__copy">© {{ anio }} Sabor Caribeño · Todos los derechos reservados</p>
       
      </div>
    </div>

  </footer>
</template>

<script setup>
import { RouterLink } from 'vue-router'
const anio = new Date().getFullYear()
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=Nunito:wght@400;600;700&display=swap');

.footer {
  background: #1a0e06;
  position: relative;
  font-family: 'Nunito', sans-serif;
}

/* ── Ola de transición ── */
.footer__ola {
  line-height: 0;
  margin-top: -1px;
}

.footer__ola svg {
  display: block;
  width: 100%;
  height: 80px;
}

/* ── Inner ── */
.footer__inner {
  max-width: 1100px;
  margin: 0 auto;
  padding: 60px 48px 48px;
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 60px;
  align-items: start;
}

/* ── Brand ── */
.footer__logo {
  width: 180px;
  height: 180px;
  margin-bottom: 16px;
  filter: brightness(1.1);
  transition: transform 0.3s ease;
}

.footer__logo:hover {
  transform: scale(1.08) rotate(-3deg);
}

.footer__tagline {
  font-size: 25px;
  color: rgba(255,255,255,0.55);
  line-height: 1.7;
  margin: 0 0 20px;
}

.footer__separador {
  width: 40px;
  height: 2px;
  background: #e8621a;
  margin-bottom: 16px;
  border-radius: 2px;
}

.footer__ubicacion {
  font-size: 19px;
  color: rgba(255,255,255,0.4);
  margin: 0;
}

/* ── Nav ── */
.footer__nav-titulo {
  font-size: 25px;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #e8621a;
  margin: 0 0 20px;
}

.footer__nav-lista {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.footer__link {
  font-size: 19px;
  color: rgba(255,255,255,0.6);
  text-decoration: none;
  transition: color 0.2s, padding-left 0.2s;
  display: inline-block;
}

.footer__link:hover {
  color: #f5a623;
  padding-left: 6px;
}

/* ── Bottom ── */
.footer__bottom {
  border-top: 1px solid rgba(255,255,255,0.08);
}

.footer__bottom-inner {
  max-width: 1100px;
  margin: 0 auto;
  padding: 20px 48px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
}

.footer__copy {
  font-size: 18px;
  color: rgba(255,255,255,0.3);
  margin: 0;
}

.footer__made {
  font-size: 18px;
  color: rgba(255,255,255,0.3);
  margin: 0;
}

/* ── Tablet ── */
@media (max-width: 1023px) {
  .footer__inner {
    padding: 48px 32px 40px;
    gap: 40px;
  }
}

/* ── Mobile ── */
@media (max-width: 767px) {
  .footer__inner {
    grid-template-columns: 1fr;
    gap: 32px;
    padding: 40px 24px 32px;
  }

  .footer__bottom-inner {
    padding: 16px 24px;
    flex-direction: column;
    text-align: center;
  }

  .footer__ola svg {
    height: 50px;
  }
}
</style>