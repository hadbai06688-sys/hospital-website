import { auth, db } from "./firebase-init.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";
import {
  addDoc,
  collection,
  doc,
  increment,
  serverTimestamp,
  setDoc
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

const pageName = location.pathname.split("/").pop() || "index.html";
const sessionKey = `banhaadbai-visited-${pageName}`;
const visitorKey = "banhaadbai-visitor-id";

function getVisitorId() {
  let visitorId = localStorage.getItem(visitorKey);

  if (!visitorId) {
    visitorId = crypto.randomUUID
      ? crypto.randomUUID()
      : `visitor-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(visitorKey, visitorId);
  }

  return visitorId;
}

async function recordVisit(user) {
  if (sessionStorage.getItem(sessionKey) === "true") {
    return;
  }

  sessionStorage.setItem(sessionKey, "true");

  const visit = {
    page: pageName,
    visitorId: getVisitorId(),
    uid: user?.uid || "",
    isLoggedIn: Boolean(user),
    createdAt: serverTimestamp()
  };

  await addDoc(collection(db, "siteVisits"), visit);
  await setDoc(doc(db, "siteStats", pageName), {
    page: pageName,
    totalVisits: increment(1),
    updatedAt: serverTimestamp()
  }, { merge: true });
}

onAuthStateChanged(auth, (user) => {
  recordVisit(user).catch(() => {
    // Firestore rules or offline previews can block visitor logging.
  });
});
