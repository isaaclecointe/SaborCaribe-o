
import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore'
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
export const db = getFirestore(app)
export const auth = getAuth(app)