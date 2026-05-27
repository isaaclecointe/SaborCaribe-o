<template>
  <section class="contacto">

    <div class="ola-top">
      <svg viewBox="0 0 1440 80" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0,40 C360,80 1080,0 1440,40 L1440,0 L0,0 Z" fill="#f5f0e8"/>
      </svg>
    </div>

    <div class="contacto-inner">

      <div class="contacto-header">
        <span class="etiqueta">¿Dónde encontrarnos?</span>
        <h2 class="titulo">Visítanos</h2>
        <p class="subtitulo">Te esperamos con las tortillas recién hechas 🫓</p>
      </div>

      <div class="grid-principal">

        <!-- ✅ Mapa embebido: ve a Google Maps, busca tu negocio,
             haz clic en "Compartir > Insertar mapa" y pega la URL del src aquí -->
        <div class="mapa-contenedor">
          <Mapa />
        </div>

        <!-- Info derecha -->
        <div class="info-columna">

          <!-- Horario -->
          <div class="tarjeta">
            <div class="tarjeta-icono">🕐</div>
            <h3>Horarios</h3>
            <h3> Jicaro</h3>
            <ul class="horario-lista">
              <li><span>Lunes – Sabado</span><span>3:00 pm – 8:00 pm</span></li>
            <!-- <li><span>Sábado</span><span>8:00 am – 9:00 pm</span></li> -->
              <li><span>Domingo</span><span>4:00 pm – 8:00 pm</span></li>
              <h3> Yupiltepeque Municipalidad</h3>
              <li><span>Lunes – Sabado</span><span>9:00 am – 5:00 pm</span></li>
               <li><span>Domingo</span><span>9:00 am – 2:00 pm</span></li>
               <h3> Atescatempa Barrio el centro </h3>
                <li><span>Lunes – Domingo</span><span>10:00 am – 9:00 pm</span></li>
            </ul>
          </div>

          <!-- Redes sociales -->
          <div class="tarjeta">
            <div class="tarjeta-icono">📱</div>
            <h3>Síguenos</h3>
            <div class="redes">

              <a href="https://www.instagram.com/_sabor_caribeno_/" target="_blank" class="btn-red instagram">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="icono-social">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                </svg>
                Instagram
              </a>

              <a href="https://www.facebook.com/TortillasdeHarinaSC/" target="_blank" class="btn-red facebook">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="icono-social">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Facebook
              </a>

            </div>
          </div>

        </div>
      </div>
    </div>

    <div class="ola-bottom">
      <svg viewBox="0 0 1440 60" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0,30 C480,60 960,0 1440,30 L1440,60 L0,60 Z" fill="#f5f0e8"/>
      </svg>
    </div>

  </section>
</template>

<script>

import Mapa from '../Ubicaciones/Mapa.vue'

export default {
  name: 'ContactoSection',
  components: {
    Mapa
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Nunito:wght@400;600;700&display=swap');

.contacto {
  position: relative;
  background: linear-gradient(135deg, #2d5a27 0%, #4a8c3f 50%, #3d7a34 100%);
  overflow: hidden;
}

.ola-top svg, .ola-bottom svg {
  width: 100%;
  height: 60px;
  display: block;
}

.contacto-inner {
  padding: 10px 32px 40px;
  max-width: 1100px;
  margin: 0 auto;
}

.contacto-header {
  text-align: center;
  margin-bottom: 40px;
}

.etiqueta {
  display: inline-block;
  background: rgba(255,255,255,0.15);
  color: #d4f0c0;
  font-family: 'Nunito', sans-serif;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 2px;
  text-transform: uppercase;
  padding: 6px 16px;
  border-radius: 20px;
  border: 1px solid rgba(255,255,255,0.2);
  margin-bottom: 10px;
}

.titulo {
  font-family: 'Playfair Display', serif;
  font-size: clamp(2rem, 5vw, 3.2rem);
  color: #ffffff;
  margin: 8px 0 10px;
  text-shadow: 0 2px 12px rgba(0,0,0,0.2);
}

.subtitulo {
  font-family: 'Nunito', sans-serif;
  color: #c8eab0;
  font-size: 1rem;
}

.grid-principal {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 28px;
  align-items: start;
}

.mapa-contenedor {
  height: 420px;
  border-radius: 20px;
  overflow: visible;
  box-shadow: 0 8px 32px rgba(0,0,0,0.25);
}

.info-columna {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.tarjeta {
  background: rgba(255,255,255,0.95);
  border-radius: 20px;
  padding: 24px 20px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  transition: transform 0.3s ease;
}

.tarjeta:hover {
  transform: translateY(-4px);
}

.tarjeta-icono {
  font-size: 1.8rem;
  margin-bottom: 10px;
}

.tarjeta h3 {
  font-family: 'Playfair Display', serif;
  font-size: 1.3rem;
  color: #2d5a27;
  margin-bottom: 14px;
}

.horario-lista {
  list-style: none;
}

.horario-lista li {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px dashed #ddd;
  font-family: 'Nunito', sans-serif;
  font-size: 0.88rem;
  color: #444;
}

.horario-lista li:last-child {
  border-bottom: none;
}

.horario-lista li span:first-child {
  font-weight: 700;
  color: #2d5a27;
}

.redes {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.btn-red {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 11px 16px;
  border-radius: 12px;
  text-decoration: none;
  font-family: 'Nunito', sans-serif;
  font-weight: 700;
  font-size: 0.95rem;
  color: white;
  transition: transform 0.2s, opacity 0.2s;
}

.btn-red:hover {
  transform: scale(1.02);
  opacity: 0.9;
}

.instagram { background: linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045); }
.facebook  { background: #1877F2; }

.icono-social {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .grid-principal {
    grid-template-columns: 1fr;
  }

  .mapa-contenedor {
    height: 260px;
  }

  .contacto-inner {
    padding: 10px 16px 30px;
  }
}
</style>