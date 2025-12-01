// firebase-init.js
// Firebase compat SDKs must be loaded in HTML before this file.

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  // add the rest from your Firebase web app config: storageBucket, messagingSenderId, appId, etc.
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();