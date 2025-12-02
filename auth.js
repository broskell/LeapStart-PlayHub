// auth.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// --- YOUR FIREBASE CONFIG ---
const firebaseConfig = {
  apiKey: "AIzaSyATkdlmcWJzuZJLWwoPbR9pUbXwCXEmbvY",
  authDomain: "playhub-17.firebaseapp.com",
  projectId: "playhub-17",
  storageBucket: "playhub-17.firebasestorage.app",
  messagingSenderId: "834190204182",
  appId: "1:834190204182:web:026fc55307a639c0428437",
  measurementId: "G-GEBV0NMBF6",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Optional: persist session
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn("Persistence error:", err.code, err.message);
});

console.log("Firebase initialized for project:", app.options.projectId);

// Helper to display messages
function setMessage(id, text, isError = false) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  el.style.color = isError ? "red" : "limegreen";
}

// Centralized error handler
function handleAuthError(context, id, err) {
  console.error(`[${context}]`, err.code, err.message);

  if (err.code === "auth/configuration-not-found" || err.code === "auth/operation-not-allowed") {
    setMessage(
      id,
      "Auth provider not configured. In Firebase Console → Authentication → Sign-in method, enable Email/Password and Google.",
      true
    );
  } else if (err.code === "auth/unauthorized-domain") {
    setMessage(
      id,
      "Unauthorized domain. Make sure your dev host (e.g. 127.0.0.1) is added in Firebase → Authentication → Settings → Authorized domains.",
      true
    );
  } else if (err.code === "auth/network-request-failed") {
    setMessage(
      id,
      "Network error. Check your internet connection and try again.",
      true
    );
  } else if (err.code === "auth/invalid-api-key") {
    setMessage(
      id,
      "Invalid Firebase API key. Double-check firebaseConfig in auth.js.",
      true
    );
  } else {
    setMessage(id, `${err.code}: ${err.message}`, true);
  }
}

// Run after DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  /* EMAIL/PASSWORD LOGIN */
  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("login-email").value.trim();
      const password = document.getElementById("login-password").value;

      try {
        await signInWithEmailAndPassword(auth, email, password);
        // Redirect to your main page after login:
        window.location.href = "playhub.html"; // <-- change if your main page has a different name
      } catch (err) {
        handleAuthError("email-login", "login-msg", err);
      }
    });
  }

  /* GOOGLE LOGIN */
  const googleBtn = document.getElementById("google-login-btn");
  if (googleBtn) {
    googleBtn.addEventListener("click", async () => {
      try {
        await signInWithPopup(auth, googleProvider);
        // Redirect to your main page after Google login:
        window.location.href = "playhub.html"; // <-- change if needed
      } catch (err) {
        handleAuthError("google-login", "login-msg", err);
      }
    });
  }

  /* FORGOT PASSWORD */
  const forgotLink = document.getElementById("forgot-password-link");
  if (forgotLink) {
    forgotLink.addEventListener("click", async (e) => {
      e.preventDefault();
      const email = document.getElementById("login-email").value.trim();
      if (!email) {
        setMessage("login-msg", "Please enter your email above first.", true);
        return;
      }
      try {
        await sendPasswordResetEmail(auth, email);
        setMessage("login-msg", "Password reset link sent. Check your email.");
      } catch (err) {
        handleAuthError("forgot-password", "login-msg", err);
      }
    });
  }

  /* SIGNUP */
  const signupForm = document.getElementById("signup-form");
  if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = document.getElementById("signup-email").value.trim();
      const password = document.getElementById("signup-password").value;

      const terms = document.getElementById("terms");
      if (terms && !terms.checked) {
        setMessage("signup-msg", "You must accept the terms.", true);
        return;
      }

      try {
        await createUserWithEmailAndPassword(auth, email, password);
        setMessage("signup-msg", "Account created! You can now log in.");
        signupForm.reset();
      } catch (err) {
        handleAuthError("signup", "signup-msg", err);
      }
    });
  }
});