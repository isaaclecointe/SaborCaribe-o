<template>

  <div class="logo">
     <img src="../../assets/Logo.svg" alt="logo" class="img-logo" />
  </div>

  <div class="login-container">
    <form class="login-card" @submit.prevent="iniciarSesion">
      <h2>Acceso Administrativo</h2>

      <div class="field">
        <label>Correo</label>
        <input v-model="email" type="email" placeholder="usuario@correo.com" required />
      </div>

      <div class="field">
        <label>Contraseña</label>
        <input v-model="password" type="password" placeholder="••••••••" required />
      </div>

      <p v-if="errorMsg" class="error-text">{{ errorMsg }}</p>

      <button type="submit" :disabled="cargando">
        {{ cargando ? 'Verificando...' : 'Entrar al Panel' }}
      </button>
    </form>
  </div>
</template>


<script setup>
import { ref } from 'vue'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../../firebase'
import { useRouter, useRoute } from 'vue-router'

const email = ref('')
const password = ref('')
const errorMsg = ref('')
const cargando = ref(false)
const router = useRouter()
const route = useRoute()

async function iniciarSesion() {
  errorMsg.value = ''
  cargando.value = true
  try {
    await signInWithEmailAndPassword(auth, email.value, password.value)
    // Si llegamos a /login porque intentábamos entrar a una ruta
    // protegida (ej. /cocina), el router nos dejó esa ruta guardada en
    // ?redirect=... — la usamos para regresar ahí. Si no hay nada
    // guardado (entraste a /login directo), vamos a /pos como antes.
    const destino = typeof route.query.redirect === 'string' ? route.query.redirect : '/pos'
    router.push(destino)
  } catch (err) {
    errorMsg.value = 'Correo o contraseña incorrectos.'
  } finally {
    cargando.value = false
  }
}
</script>

<style scoped>

.img-logo {
  display: block;
  margin: 2rem auto;
  width: 150px;
}

.login-container {
  display: flex;
  justify-content: center;
  align-items: center;

}
.login-card {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  width: 100%;
  max-width: 360px;
}
.field {
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
}
.error-text {
  color: #cc0000;
  font-size: 0.85rem;
  margin-bottom: 1rem;
}
</style>