<template>
  <NavBar />
  <main class="acerca">

    <!-- ── HERO ── -->
    <section class="hero">
      <div class="hero__bg">
        <div class="hero__grain"></div>
        <div class="hero__circle hero__circle--1"></div>
        <div class="hero__circle hero__circle--2"></div>
      </div>
      <div class="hero__content">
        <span class="hero__eyebrow">Nuestra Historia</span>
        <h1 class="hero__title">
          15 años llevando<br/>
          <em>el sabor auténtico</em><br/>
          a Jutiapa
        </h1>
        <div class="hero__line"></div>
        <p class="hero__sub">
          Desde nuestros primeros días, una sola misión nos ha guiado:
          que cada persona en Jutiapa descubra el placer de una tortilla de harina
          hecha como debe ser.
        </p>
      </div>
      <div class="hero__year">
        <span class="hero__year-num">2009</span>
        <span class="hero__year-label">Año de fundación</span>
      </div>
    </section>

    <!-- ── ORIGEN ── -->
    <section class="origen">
      <div class="origen__container">
        <div class="origen__tag">El Comienzo</div>
        <div class="origen__grid">
          <div class="origen__texto">
            <h2 class="origen__titulo">Una marca<br/>con propósito</h2>
            <p>
              Sabor Caribeño nació de una convicción simple pero poderosa: Jutiapa
              merecía conocer las mejores tortillas de harina de Guatemala. No una
              imitación, no una versión rápida — sino la auténtica, la bien hecha,
              la que se recuerda.
            </p>
            <p>
              Desde el primer día apostamos por los ingredientes frescos, la
              elaboración a mano y un sabor que habla por sí solo. Esa apuesta
              no ha cambiado en 15 años.
            </p>
          </div>
          <div class="origen__numeros">
            <div class="numero-card">
              <span class="numero-card__cifra">15</span>
              <span class="numero-card__unidad">años</span>
              <span class="numero-card__label">de tradición</span>
            </div>
            <div class="numero-card numero-card--accent">
              <span class="numero-card__cifra">100%</span>
              <span class="numero-card__label">hecho a mano</span>
            </div>
            <div class="numero-card">
              <span class="numero-card__cifra">#1</span>
              <span class="numero-card__label">en Jutiapa</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── LÍNEA DE TIEMPO ── -->
    <section class="timeline">
      <div class="timeline__container">
        <div class="timeline__header">
          <span class="timeline__eyebrow">El camino recorrido</span>
          <h2 class="timeline__titulo">15 años de historia</h2>
        </div>
        <div class="timeline__items">
          <div
            v-for="(hito, i) in hitos"
            :key="i"
            class="hito"
            :class="{ 'hito--derecha': i % 2 !== 0 }"
          >
            <div class="hito__anio">{{ hito.anio }}</div>
            <div class="hito__dot"></div>
            <div class="hito__card">
              <span class="hito__emoji">{{ hito.emoji }}</span>
              <h3 class="hito__titulo">{{ hito.titulo }}</h3>
              <p class="hito__texto">{{ hito.texto }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── MISIÓN Y VISIÓN ── -->
    <section class="mv">
      <div class="mv__container">
        <div class="mv__card mv__card--mision">
          <div class="mv__icono">🎯</div>
          <h3 class="mv__titulo">Misión</h3>
          <p class="mv__texto">
            Llevar a cada mesa de Jutiapa una tortilla de harina elaborada con
            ingredientes frescos, tradición artesanal y el sabor auténtico que
            nos distingue desde nuestros inicios.
          </p>
        </div>
        <div class="mv__divisor"></div>
        <div class="mv__card mv__card--vision">
          <div class="mv__icono">🌟</div>
          <h3 class="mv__titulo">Visión</h3>
          <p class="mv__texto">
            Ser reconocidos como la marca de tortillas de harina más querida de
            Guatemala, expandiendo el sabor caribeño a cada rincón del país sin
            perder jamás nuestra esencia artesanal.
          </p>
        </div>
      </div>
    </section>

    <!-- ── VALORES ── -->
    <section class="valores">
      <div class="valores__container">
        <span class="valores__eyebrow">Lo que nos define</span>
        <h2 class="valores__titulo">Nuestros valores</h2>
        <div class="valores__grid">
          <div v-for="v in valores" :key="v.titulo" class="valor-card">
            <span class="valor-card__emoji">{{ v.emoji }}</span>
            <h4 class="valor-card__titulo">{{ v.titulo }}</h4>
            <p class="valor-card__texto">{{ v.texto }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ── CTA FINAL ── -->
    <section class="cta">
      <div class="cta__content">
        <h2 class="cta__titulo">¿Listo para probarlo?</h2>
        <p class="cta__sub">15 años de sabor te esperan en cada tortilla.</p>
        <RouterLink to="/menu" class="cta__btn">Ver nuestro menú →</RouterLink>
      </div>
    </section>

  </main>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import NavBar from '../Home/NavBar.vue'

const hitos = [
  {
    anio: '2009',
    emoji: '🌱',
    titulo: 'El nacimiento',
    texto: 'Sabor Caribeño abre sus puertas en Jutiapa con una promesa: ofrecer la mejor tortilla de harina de Guatemala hecha completamente a mano.'
  },
  {
    anio: '2012',
    emoji: '🔥',
    titulo: 'El sabor conquista Jutiapa',
    texto: 'La palabra se corre. Nuestras tortillas se convierten en el referente de la ciudad y la demanda crece semana a semana.'
  },
  {
    anio: '2016',
    emoji: '🌮',
    titulo: 'Ampliamos el menú',
    texto: 'Incorporamos tacos, quesadillas y frescos naturales, manteniendo siempre la misma dedicación artesanal en cada preparación.'
  },
  {
    anio: '2020',
    emoji: '💪',
    titulo: 'Resilencia y adaptación',
    texto: 'Ante los retos del mundo, nos reinventamos sin perder nuestra esencia. La comunidad de Jutiapa nos respalda más que nunca.'
  },
  {
    anio: '2024',
    emoji: '🚀',
    titulo: '15 años y seguimos',
    texto: 'Celebramos década y media de tradición, sabor y comunidad. La misión sigue siendo la misma: la mejor tortilla de harina para cada jutiapaneco.'
  },
]

const valores = [
  {
    emoji: '🤲',
    titulo: 'Artesanal',
    texto: 'Cada tortilla se elabora a mano, con el cuidado y dedicación que solo los procesos artesanales pueden ofrecer.'
  },
  {
    emoji: '🌿',
    titulo: 'Ingredientes frescos',
    texto: 'Seleccionamos los mejores ingredientes frescos para garantizar el sabor auténtico que nos caracteriza.'
  },
  {
    emoji: '❤️',
    titulo: 'Comunidad',
    texto: 'Jutiapa es nuestro hogar. Cada tortilla que preparamos es un acto de amor hacia nuestra comunidad.'
  },
  {
    emoji: '⭐',
    titulo: 'Calidad constante',
    texto: 'En 15 años nunca hemos cedido en calidad. El primer bocado debe ser tan bueno como el último.'
  },
]
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,700&family=DM+Sans:wght@300;400;500;600&display=swap');

/* ── Variables ── */
:root {
  --cream: #faf6f0;
  --warm: #f0e6d3;
  --orange: #d4581a;
  --orange-light: #e8793a;
  --brown: #2c1a0a;
  --brown-mid: #5c3a1e;
  --gold: #c9942a;
  --text: #1e1208;
  --muted: #7a5c3e;
  --white: #ffffff;
}

* { box-sizing: border-box; }

.acerca {
  font-family: 'DM Sans', sans-serif;
  background: var(--cream);
  color: var(--text);
}

/* ── HERO ── */
.hero {
  position: relative;
  min-height: 92vh;
  background: var(--brown);
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 120px 8% 80px;
  overflow: hidden;
}

.hero__bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.hero__grain {
  position: absolute;
  inset: 0;
  opacity: 0.04;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E");
  background-size: 200px;
}

.hero__circle {
  position: absolute;
  border-radius: 50%;
}

.hero__circle--1 {
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(212,88,26,0.25) 0%, transparent 70%);
  top: -200px;
  right: -100px;
}

.hero__circle--2 {
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(201,148,42,0.15) 0%, transparent 70%);
  bottom: -100px;
  left: 5%;
}

.hero__content {
  position: relative;
  z-index: 1;
  max-width: 780px;
  animation: fadeUp 0.9s ease both;
}

.hero__eyebrow {
  display: inline-block;
  font-size: 30px;
  font-weight: 600;
  letter-spacing: 0.25em;
  text-transform: uppercase;
  color: var(--gold);
  margin-bottom: 20px;
}

.hero__title {
  font-family: 'Cormorant Garamond', serif;
  font-size: clamp(48px, 7vw, 96px);
  font-weight: 700;
  color: var(--white);
  line-height: 1.05;
  margin: 0 0 28px;
}

.hero__title em {
  color: var(--gold);
  font-style: italic;
  font-size: 30px;
}

.hero__line {
  width: 60px;
  height: 2px;
  background: var(--orange);
  margin-bottom: 24px;
}

.hero__sub {
  font-size: clamp(15px, 1.4vw, 18px);
  color: rgba(3, 3, 3, 0.65);
  line-height: 1.8;
  max-width: 560px;
  margin: 0;
}

.hero__year {
  position: absolute;
  bottom: 60px;
  right: 8%;
  text-align: right;
  z-index: 1;
  animation: fadeUp 0.9s ease both 0.3s;
}

.hero__year-num {
  display: block;
  font-family: 'Cormorant Garamond', serif;
  font-size: clamp(100px, 12vw, 160px);
  font-weight: 700;
  color: rgba(70, 50, 50, 0.411);
  line-height: 1;
}

.hero__year-label {
  display: block;
  font-size: 12px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: rgb(0, 0, 0);
}

/* ── ORIGEN ── */
.origen {
  padding: 100px 8%;
  background: var(--white);
}

.origen__container {
  max-width: 1200px;
  margin: 0 auto;
}

.origen__tag {
  display: inline-block;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--orange);
  border-left: 3px solid var(--orange);
  padding-left: 12px;
  margin-bottom: 40px;
}

.origen__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 80px;
  align-items: center;
}

.origen__titulo {
  font-family: 'Cormorant Garamond', serif;
  font-size: clamp(36px, 4vw, 60px);
  font-weight: 700;
  color: var(--brown);
  margin: 0 0 28px;
  line-height: 1.1;
}

.origen__texto p {
  font-size: 16px;
  line-height: 1.8;
  color: var(--muted);
  margin: 0 0 16px;
}

.origen__numeros {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.numero-card {
  background: var(--cream);
  border-radius: 16px;
  padding: 24px 28px;
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
  border: 1px solid var(--warm);
  transition: transform 0.2s;
}

.numero-card:hover {
  transform: translateX(8px);
}

.numero-card--accent {
  background: var(--brown);
}

.numero-card--accent .numero-card__cifra,
.numero-card--accent .numero-card__label {
  color: var(--gold);
}

.numero-card__cifra {
  font-family: 'Cormorant Garamond', serif;
  font-size: 48px;
  font-weight: 700;
  color: var(--orange);
  line-height: 1;
}

.numero-card__unidad {
  font-size: 20px;
  font-weight: 600;
  color: var(--orange);
}

.numero-card__label {
  font-size: 13px;
  color: var(--muted);
  width: 100%;
  margin-top: -4px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

/* ── TIMELINE ── */
.timeline {
  padding: 100px 8%;
  background: var(--cream);
}

.timeline__container {
  max-width: 900px;
  margin: 0 auto;
}

.timeline__header {
  text-align: center;
  margin-bottom: 64px;
}

.timeline__eyebrow {
  display: block;
  font-size: 28px;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--orange);
  margin-bottom: 12px;
}

.timeline__titulo {
  font-family: 'Cormorant Garamond', serif;
  font-size: clamp(32px, 4vw, 52px);
  font-weight: 700;
  color: var(--brown);
  margin: 0;
}

.timeline__items {
  position: relative;
  padding: 0 0 0 0;
}

.timeline__items::before {
  content: '';
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 1px;
  background: var(--warm);
  transform: translateX(-50%);
}

.hito {
  display: grid;
  grid-template-columns: 1fr 40px 1fr;
  gap: 24px;
  align-items: center;
  margin-bottom: 48px;
}

.hito__anio {
  text-align: right;
  font-family: 'Cormorant Garamond', serif;
  font-size: 28px;
  font-weight: 700;
  color: var(--gold);
}

.hito__dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--orange);
  border: 3px solid var(--cream);
  box-shadow: 0 0 0 2px var(--orange);
  justify-self: center;
  z-index: 1;
}

.hito__card {
  background: var(--white);
  border-radius: 16px;
  padding: 20px 24px;
  border: 1px solid var(--warm);
  box-shadow: 0 2px 12px rgba(44,26,10,0.06);
}

.hito--derecha .hito__anio {
  order: 3;
  text-align: left;
}

.hito--derecha .hito__dot {
  order: 2;
}

.hito--derecha .hito__card {
  order: 1;
}

.hito__emoji {
  font-size: 24px;
  display: block;
  margin-bottom: 8px;
}

.hito__titulo {
  font-family: 'Cormorant Garamond', serif;
  font-size: 30px;
  font-weight: 700;
  color: var(--brown);
  margin: 0 0 8px;
}

.hito__texto {
  font-size: 28px;
  line-height: 1.7;
  color: var(--muted);
  margin: 0;
}

/* ── MISIÓN Y VISIÓN ── */
.mv {
  padding: 100px 8%;
  background: var(--brown);
}

.mv__container {
  max-width: 1000px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 0;
  align-items: center;
}

.mv__divisor {
  width: 1px;
  height: 200px;
  background: rgba(255,255,255,0.1);
  margin: 0 60px;
}

.mv__card {
  padding: 40px;
}

.mv__icono {
  font-size: 36px;
  margin-bottom: 20px;
  display: block;
}

.mv__titulo {
  font-family: 'Cormorant Garamond', serif;
  font-size: 32px;
  font-weight: 700;
  color: var(--gold);
  margin: 0 0 16px;
}

.mv__texto {
  font-size: 28px;
  line-height: 1.8;
  color: rgba(0, 0, 0, 0.815);
  margin: 0;
  color: var(--muted);
}

/* ── VALORES ── */
.valores {
  padding: 100px 8%;
  background: var(--white);
}

.valores__container {
  max-width: 1200px;
  margin: 0 auto;
  text-align: center;
}

.valores__eyebrow {
  display: block;
  font-size: 22px;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--orange);
  margin-bottom: 12px;
}

.valores__titulo {
  font-family: 'Cormorant Garamond', serif;
  font-size: clamp(32px, 4vw, 52px);
  font-weight: 700;
  color: var(--brown);
  margin: 0 0 60px;
}

.valores__grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}

.valor-card {
  background: var(--cream);
  border-radius: 20px;
  padding: 36px 24px;
  border: 1px solid var(--warm);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.valor-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 40px rgba(44,26,10,0.1);
}

.valor-card__emoji {
  font-size: 36px;
  display: block;
  margin-bottom: 16px;
}

.valor-card__titulo {
  font-family: 'Cormorant Garamond', serif;
  font-size: 22px;
  font-weight: 700;
  color: var(--brown);
  margin: 0 0 12px;
}

.valor-card__texto {
  font-size: 22px;
  line-height: 1.7;
  color: var(--muted);
  margin: 0;
}

/* ── CTA ── */
.cta {
  padding: 120px 8%;
  background: linear-gradient(135deg, var(--orange) 0%, #b84010 100%);
  text-align: center;
}

.cta__titulo {
  font-family: 'Cormorant Garamond', serif;
  font-size: clamp(40px, 6vw, 72px);
  font-weight: 700;
  color: white;
  margin: 0 0 16px;
}

.cta__sub {
  font-size: 18px;
  color: rgba(255,255,255,0.8);
  margin: 0 0 40px;
}

.cta__btn {
  display: inline-block;
  background: white;
  color: var(--orange);
  padding: 16px 40px;
  border-radius: 100px;
  font-size: 16px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.25s ease;
  box-shadow: 0 8px 24px rgba(0,0,0,0.2);
}

.cta__btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 16px 40px rgba(0,0,0,0.25);
}

/* ── Animación ── */
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(30px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ── TABLET ── */
@media (max-width: 1023px) {
  .origen__grid { grid-template-columns: 1fr; gap: 48px; }
  .valores__grid { grid-template-columns: repeat(2, 1fr); }
  .mv__container { grid-template-columns: 1fr; }
  .mv__divisor { width: 80px; height: 1px; margin: 0 auto; }
  .timeline__items::before { left: 20px; }
  .hito { grid-template-columns: 40px 1fr; }
  .hito__anio { display: none; }
  .hito--derecha .hito__anio { display: none; }
  .hito--derecha .hito__dot { order: 1; }
  .hito--derecha .hito__card { order: 2; }
}

/* ── MOBILE ── */
@media (max-width: 767px) {
  .hero { padding: 100px 6% 60px; min-height: 80vh; }
  .hero__year { display: none; }
  .origen, .timeline, .mv, .valores, .cta { padding: 60px 6%; }
  .valores__grid { grid-template-columns: 1fr; }
  .mv__card { padding: 24px 0; }
}
</style>