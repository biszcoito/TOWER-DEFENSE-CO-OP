// js/firebase-init.js

const firebaseConfig = {
  apiKey: "AIzaSyDDUBYUoNlE5YyqxxpjQlR82KhThCdyxxY",
  authDomain: "portifolio-6053a.firebaseapp.com",
  projectId: "portifolio-6053a",
  storageBucket: "portifolio-6053a.firebasestorage.app",
  messagingSenderId: "900479909820",
  appId: "1:900479909820:web:28bdd65fbfa139fbb9f5b9",
  measurementId: "G-GT60DHVRZW"
};

const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth(); // Instância de autenticação global