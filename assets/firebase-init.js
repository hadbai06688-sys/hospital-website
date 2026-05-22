import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import { getAnalytics, isSupported } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-analytics.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB2Gv4UenYMc047xqpcE97QvpXxD6C8Ur8",
  authDomain: "banhaadbai-hospital.firebaseapp.com",
  projectId: "banhaadbai-hospital",
  storageBucket: "banhaadbai-hospital.firebasestorage.app",
  messagingSenderId: "1087940797605",
  appId: "1:1087940797605:web:2c4c13c45ea2b1a29bd94c",
  measurementId: "G-LSXECZN1CQ"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

isSupported()
  .then((supported) => {
    if (supported) {
      getAnalytics(app);
    }
  })
  .catch(() => {
    // Analytics can be unavailable in some browsers or local previews.
  });

window.firebaseApp = app;
window.firebaseAuth = auth;
window.firebaseDb = db;

export { app, auth, db };
