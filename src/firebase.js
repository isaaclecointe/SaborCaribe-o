import { initializeApp } from "firebase/app";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentSingleTabManager
} from 'firebase/firestore'
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDoW2zlhNdx7mlys4JMGrozGWx0TtqYFxc",
  authDomain: "sabor-caribeno.firebaseapp.com",
  projectId: "sabor-caribeno",
  storageBucket: "sabor-caribeno.firebasestorage.app",
  messagingSenderId: "352593157889",
  appId: "1:352593157889:web:586d555f1cc8171ed9c500"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Firestore con caché offline: los pedidos se guardan primero en la
// tablet (en su almacenamiento del navegador) y se mandan al servidor en
// cuanto hay internet. Si el WiFi se cae y además la página se recarga,
// los pedidos en cola NO se pierden: se envían solos cuando vuelve la
// conexión.
//
// Una sola pestaña maneja la caché (SingleTab). Antes era "multi-pestaña":
// las pestañas se coordinaban entre sí y una hacía el trabajo de todas.
// En el iPad, Safari congela las pestañas de fondo, y si la congelada era
// la que coordinaba, las demás se quedaban esperando para siempre (el
// "Verificando..." que no avanzaba). Además, al cambiar de cuenta, una
// pestaña vieja podía pedir datos con el usuario anterior ("Missing or
// insufficient permissions"). Ahora cada pestaña es independiente: si ya
// hay otra pestaña del POS abierta, esta funciona igual, solo que sin
// caché propia (necesita internet).
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentSingleTabManager() })
})
export const auth = getAuth(app)