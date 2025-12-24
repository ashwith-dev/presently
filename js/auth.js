/* =========================================================
   FORM TOGGLE (LOGIN <-> REGISTER)
========================================================= */
const container = document.querySelector(".container");
const signUpLink = document.querySelector(".SignUpLink");
const signInLink = document.querySelector(".SignInLink");

if (container && signUpLink && signInLink) {
  signUpLink.addEventListener("click", (e) => {
    e.preventDefault();
    container.classList.add("active");
  });

  signInLink.addEventListener("click", (e) => {
    e.preventDefault();
    container.classList.remove("active");
  });
}

/* =========================================================
   FIREBASE CONFIG (COMPAT SDK)
   ⚠️ DO NOT COMMIT REAL KEYS
========================================================= */
const firebaseConfig = {
  apiKey: "AIzaSyC-AXGlzlduk4x0VLSR6-kf7v1D1P0zdQc",
  authDomain: "presently-dc0f5.firebaseapp.com",
  projectId: "presently-dc0f5",
  storageBucket: "presently-dc0f5.firebasestorage.app",
  messagingSenderId: "641158943378",
  appId: "1:641158943378:web:1d344c67393dfbe6998c4b",
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

console.log("🔥 Firebase initialized:", firebaseConfig.projectId);

/* =========================================================
   GOOGLE PROVIDER
========================================================= */
const provider = new firebase.auth.GoogleAuthProvider();

/* =========================================================
   HELPERS
========================================================= */
async function upsertUserDoc(user) {
  try {
    const ref = db.collection("users").doc(user.uid);
    const snap = await ref.get();

    if (!snap.exists) {
      await ref.set({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || "",
        photoURL: user.photoURL || "",
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
      });
      console.log("✅ Firestore user created");
    } else {
      await ref.update({
        lastLogin: firebase.firestore.FieldValue.serverTimestamp(),
      });
      console.log("♻️ Firestore lastLogin updated");
    }
  } catch (err) {
    console.warn("Firestore user write failed (non-fatal):", err);
  }
}

function saveUserToLocal(user) {
  localStorage.setItem(
    "giftwhisperer_user",
    JSON.stringify({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
    })
  );
}

/* =========================================================
   GOOGLE SIGN-IN (LOGIN + SIGNUP)
========================================================= */
async function signInWithGoogle(button) {
  if (!button) return;

  let user;

  try {
    button.classList.add("loading");
    const result = await auth.signInWithPopup(provider);
    user = result.user;
    console.log("Google login success:", user.email);
  } catch (error) {
    button.classList.remove("loading");
    console.error("Google auth error:", error);

    if (error.code === "auth/popup-closed-by-user") return;
    if (error.code === "auth/cancelled-popup-request") return;

    if (error.code === "auth/unauthorized-domain") {
      alert(
        "Unauthorized domain.\nAdd localhost / domain in Firebase → Auth → Settings."
      );
      return;
    }

    alert(error.message);
    return;
  }

  /* ---------- FIRST TIME GOOGLE USER FLOW ---------- */
  if (!user.displayName) {
    const username = prompt("Choose a username");
    const password = prompt("Set a local password");

    if (!username || !password) {
      alert("Username and password required.");
      return;
    }

    try {
      const credential =
        firebase.auth.EmailAuthProvider.credential(
          user.email,
          password
        );

      await user.linkWithCredential(credential);
      await user.updateProfile({ displayName: username });

      console.log("🔗 Email/password linked to Google account");
    } catch (err) {
      alert("Failed to link password: " + err.message);
      return;
    }
  }

  await upsertUserDoc(user);
  saveUserToLocal(user);

  button.classList.remove("loading");
  window.location.href = "/app.html";
}

/* =========================================================
   EMAIL SIGNUP
========================================================= */
async function emailSignup() {
  const username = document.getElementById("su-username").value.trim();
  const email = document.getElementById("su-email").value.trim();
  const password = document.getElementById("su-password").value;

  if (!username || !email || !password) {
    alert("All fields are required");
    return;
  }

  try {
    const res = await auth.createUserWithEmailAndPassword(email, password);
    await res.user.updateProfile({ displayName: username });

    await upsertUserDoc(res.user);
    saveUserToLocal(res.user);

    window.location.href = "/app.html";
  } catch (err) {
    alert(err.message);
  }
}

/* =========================================================
   EMAIL LOGIN
========================================================= */
async function emailLogin() {
  const email = document.getElementById("li-email").value.trim();
  const password = document.getElementById("li-password").value;

  if (!email || !password) {
    alert("Email and password required");
    return;
  }

  try {
    const res = await auth.signInWithEmailAndPassword(email, password);
    await upsertUserDoc(res.user);
    saveUserToLocal(res.user);

    window.location.href = "/app.html";
;
  } catch (err) {
    alert(err.message);
  }
}

/* =========================================================
   SIGN OUT
========================================================= */
function signOut() {
  auth.signOut().then(() => {
    localStorage.removeItem("giftwhisperer_user");
    window.location.href = "/index.html";
  });
}

/* =========================================================
   EXPOSE TO WINDOW
========================================================= */
window.gwGoogleLogin = (btn) => signInWithGoogle(btn);
window.gwSignup = emailSignup;
window.gwLogin = emailLogin;
window.gwSignOut = signOut;
