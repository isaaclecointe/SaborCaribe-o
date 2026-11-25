<template>

  <div class="logo">
     <img src="../../assets/Logo.svg" alt="logo" class="img-logo" />
  </div>

  <div class="login-container">
    <form class="login-card" @submit.prevent="enviar">
      <h2>{{ creando ? 'Crear cuenta' : 'Acceso Administrativo' }}</h2>

      <div class="field">
        <label>Correo</label>
        <input v-model="email" type="email" placeholder="usuario@correo.com" required />
      </div>

      <div class="field">
        <label>Contraseña</label>
        <input
          v-model="password" type="password" placeholder="••••••••" required
          :autocomplete="creando ? 'new-password' : 'current-password'"
        />
      </div>

      <div v-if="creando" class="field">
        <label>Repite la contraseña</label>
        <input v-model="password2" type="password" placeholder="••••••••" required autocomplete="new-password" />
      </div>

      <p v-if="errorMsg" class="error-text">{{ errorMsg }}</p>

      <button type="submit" :disabled="cargando">
        {{ cargando ? 'Verificando...' : (creando ? 'Crear cuenta' : 'Entrar al Panel') }}
      </button>

      <!-- El personal nuevo crea su cuenta aquí y luego escribe el código
           de acceso que le da el dueño -->
      <button type="button" class="cambiar-modo" @click="creando = !creando; errorMsg = ''">
        {{ creando ? 'Ya tengo cuenta, iniciar sesión' : '¿Eres personal nuevo? Crear cuenta' }}
      </button>
    </form>
  </div>
</template>


<script setup>
import { ref } from 'vue'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../../firebase'
import { useRouter, useRoute } from 'vue-router'

const email = ref('')
const password = ref('')
const password2 = ref('')
const creando = ref(false)
const errorMsg = ref('')
const cargando = ref(false)
const router = useRouter()
const route = useRoute()

function destino() {
  // Si llegamos a /login porque intentábamos entrar a una ruta protegida
  // (ej. /cocina), el router dejó esa ruta en ?redirect=...
  // El router decide después si hace falta configurar el acceso.
  return typeof route.query.redirect === 'string' ? route.query.redirect : '/pos'
}

const MENSAJES = {
  'auth/email-already-in-use': 'Ya existe una cuenta con ese correo. Inicia sesión.',
  'auth/invalid-email': 'Ese correo no es válido.',
  'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres.',
  'auth/network-request-failed': 'Sin conexión. Revisa el internet e intenta de nuevo.'
}

async function enviar() {
  errorMsg.value = ''
  if (creando.value && password.value !== password2.value) {
    errorMsg.value = 'Las contraseñas no coinciden.'
    return
  }
  cargando.value = true
  try {
    if (creando.value) {
      await createUserWithEmailAndPassword(auth, email.value.trim(), password.value)
    } else {
      await signInWithEmailAndPassword(auth, email.value.trim(), password.value)
    }
    router.push(destino())
  } catch (err) {
    errorMsg.value = MENSAJES[err?.code] || (creando.value
      ? 'No se pudo crear la cuenta. Intenta de nuevo.'
      : 'Correo o contraseña incorrectos.')
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
.cambiar-modo {
  display: block;
  width: 100%;
  margin-top: 1rem;
  padding: 0.5rem;
  border: none;
  background: none;
  cursor: pointer;
  color: #e8621a;
  font-size: 0.9rem;
  font-weight: 700;
}
.error-text {
  color: #cc0000;
  font-size: 0.85rem;
  margin-bottom: 1rem;
}
</style>