import { initializeApp } from "firebase/app";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
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
// conexión. persistentMultipleTabManager permite tener el POS abierto en
// más de una pestaña sin que la caché choque.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
})
export const auth = getAuth(app)