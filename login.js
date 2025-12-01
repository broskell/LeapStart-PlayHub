// login.js

const container = document.getElementById("container");
const registerButton = document.getElementById("register");
const loginButton = document.getElementById("login");
const googleLoginBtn = document.getElementById("google-login-btn");

// Flip animation between login / register panels
registerButton.onclick = () => {
  container.className = "active";
};

loginButton.onclick = () => {
  container.className = "close";
};

// If already signed in, go straight to PlayHub
auth.onAuthStateChanged((user) => {
  if (user) {
    window.location.href = "playhub.html";
  }
});

// Google sign-in
googleLoginBtn.addEventListener("click", async () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  try {
    await auth.signInWithPopup(provider);
    // auth state listener will redirect
  } catch (err) {
    alert("Google sign-in failed: " + err.message);
  }
});