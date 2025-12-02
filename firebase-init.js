// firebase-init.js
// Firebase compat SDKs must be loaded in HTML before this file.

const firebaseConfig = {
  apiKey: "AIzaSyATkdlmcWJzuZJLWwoPbR9pUbXwCXEmbvY",
  authDomain: "playhub-17.firebaseapp.com",
  projectId: "playhub-17",
  storageBucket: "playhub-17.firebasestorage.app",
  messagingSenderId: "834190204182",
  appId: "1:834190204182:web:026fc55307a639c0428437",
  measurementId: "G-GEBV0NMBF6"
  // add the rest from your Firebase web app config: storageBucket, messagingSenderId, appId, etc.
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();