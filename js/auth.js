/* =========================================================
   FORM TOGGLE (LOGIN <-> REGISTER)
========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  const container = document.querySelector(".container");
  const signUpLink = document.querySelector(".SignUpLink");
  const signInLink = document.querySelector(".SignInLink");

  if (!container) return;

  signUpLink?.addEventListener("click", (e) => {
    e.preventDefault();
    container.classList.add("active");
  });

  signInLink?.addEventListener("click", (e) => {
    e.preventDefault();
    container.classList.remove("active");
  });
});

/* =========================================================
   FIREBASE CONFIG
========================================================= */
const firebaseConfig = {
  apiKey: "AIzaSyC-AXGlzlduk4x0VLSR6-kf7v1D1P0zdQc",
  authDomain: "presently-dc0f5.firebaseapp.com",
  projectId: "presently-dc0f5",
  storageBucket: "presently-dc0f5.firebasestorage.app",
  messagingSenderId: "641158943378",
  appId: "1:641158943378:web:1d344c67393dfbe6998c4b",
};

// Initialize only if not already initialized
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();

/* =========================================================
   GOOGLE PROVIDER
========================================================= */
const provider = new firebase.auth.GoogleAuthProvider();

/* =========================================================
   HELPERS
========================================================= */
async function upsertUserDoc(user) {
  try {
    await db.collection("users").doc(user.uid).set(
      {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || "",
        photoURL: user.photoURL || "",
        lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn("Firestore write failed:", err);
  }
}

/* =========================================================
   GOOGLE SIGN-IN
========================================================= */
async function signInWithGoogle() {
  try {
    const res = await auth.signInWithPopup(provider);
    await upsertUserDoc(res.user);
    
    // Use replace instead of href to prevent back button issues
    window.location.replace("/app.html");
  } catch (err) {
    if (err.code !== 'auth/popup-closed-by-user') {
      alert(err.message);
    }
  }
}

/* =========================================================
   EMAIL SIGNUP
========================================================= */
async function emailSignup() {
  const btn = event.target;
  
  try {
    btn.disabled = true;
    btn.textContent = "Creating account...";
    
    const username = document.getElementById("su-username").value.trim();
    const email = document.getElementById("su-email").value.trim();
    const password = document.getElementById("su-password").value;

    if (!username || !email || !password) {
      alert("All fields are required");
      return;
    }

    const res = await auth.createUserWithEmailAndPassword(email, password);
    await res.user.updateProfile({ displayName: username });
    await upsertUserDoc(res.user);
    
    // Use replace instead of href to prevent back button issues
    window.location.replace("/app.html");
  } catch (err) {
    alert(err.message);
    btn.disabled = false;
    btn.textContent = "Create account";
  }
}

/* =========================================================
   EMAIL LOGIN
========================================================= */
async function emailLogin() {
  const btn = event.target;
  
  try {
    btn.disabled = true;
    btn.textContent = "Signing in...";
    
    const email = document.getElementById("li-email").value.trim();
    const password = document.getElementById("li-password").value;

    if (!email || !password) {
      alert("Email and password required");
      return;
    }

    const res = await auth.signInWithEmailAndPassword(email, password);
    await upsertUserDoc(res.user);
    
    // Use replace instead of href to prevent back button issues
    window.location.replace("/app.html");
  } catch (err) {
    alert(err.message);
    btn.disabled = false;
    btn.textContent = "Sign in";
  }
}

/* =========================================================
   EXPOSE TO WINDOW
========================================================= */
window.gwGoogleLogin = signInWithGoogle;
window.gwSignup = emailSignup;
window.gwLogin = emailLogin;