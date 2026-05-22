import { auth, db } from "./firebase-init.js";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";
import {
  doc,
  getDoc,
  increment,
  serverTimestamp,
  setDoc
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

const loginPanel = document.getElementById("login-panel");
const registerPanel = document.getElementById("register-panel");
const memberPanel = document.getElementById("member-panel");
const birthdayPanel = document.getElementById("birthday-panel");
const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const birthdayForm = document.getElementById("birthday-form");
const googleLogin = document.getElementById("google-login");
const logoutButton = document.getElementById("member-logout");
const memberName = document.getElementById("member-name");
const memberSummary = document.getElementById("member-summary");

let currentUser = null;

function showError(id, message) {
  const element = document.getElementById(id);
  element.textContent = message;
  element.classList.remove("hidden");
}

function hideError(id) {
  document.getElementById(id).classList.add("hidden");
}

function calculateAge(birthDate) {
  if (!birthDate) return null;
  const today = new Date();
  const born = new Date(`${birthDate}T00:00:00`);
  let age = today.getFullYear() - born.getFullYear();
  const monthDiff = today.getMonth() - born.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < born.getDate())) {
    age -= 1;
  }

  return Number.isFinite(age) && age >= 0 ? age : null;
}

async function saveUserProfile(user, data = {}) {
  const profileRef = doc(db, "users", user.uid);
  const profile = {
    uid: user.uid,
    email: user.email || "",
    displayName: data.displayName || user.displayName || user.email || "ผู้ใช้งาน",
    provider: user.providerData[0]?.providerId || "password",
    lastLoginAt: serverTimestamp(),
    loginCount: increment(1),
    updatedAt: serverTimestamp()
  };

  if (data.birthDate !== undefined) {
    profile.birthDate = data.birthDate;
  }

  if (data.setCreatedAt) {
    profile.createdAt = serverTimestamp();
  }

  await setDoc(profileRef, profile, { merge: true });
}

async function getUserProfile(uid) {
  const profileSnapshot = await getDoc(doc(db, "users", uid));
  return profileSnapshot.exists() ? profileSnapshot.data() : null;
}

function setLoggedOutView() {
  loginPanel.classList.remove("hidden");
  registerPanel.classList.remove("hidden");
  memberPanel.classList.add("hidden");
  birthdayPanel.classList.add("hidden");
}

async function setLoggedInView(user) {
  const profile = await getUserProfile(user.uid);

  if (!profile?.birthDate) {
    loginPanel.classList.add("hidden");
    registerPanel.classList.add("hidden");
    memberPanel.classList.add("hidden");
    birthdayPanel.classList.remove("hidden");
    return;
  }

  const age = calculateAge(profile.birthDate);
  memberName.textContent = `ยินดีต้อนรับ ${profile.displayName || user.displayName || user.email || ""}`;
  memberSummary.textContent = age === null ? "บันทึกข้อมูลวันเกิดแล้ว" : `อายุปัจจุบันประมาณ ${age} ปี`;
  loginPanel.classList.add("hidden");
  registerPanel.classList.add("hidden");
  birthdayPanel.classList.add("hidden");
  memberPanel.classList.remove("hidden");
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  hideError("login-error");

  const formData = new FormData(loginForm);
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    await saveUserProfile(credential.user);
    loginForm.reset();
    await setLoggedInView(credential.user);
  } catch (error) {
    showError("login-error", "เข้าสู่ระบบไม่สำเร็จ กรุณาตรวจสอบอีเมลและรหัสผ่าน");
  }
});

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  hideError("register-error");

  const formData = new FormData(registerForm);
  const displayName = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const birthDate = String(formData.get("birthDate") || "");

  if (!birthDate) {
    showError("register-error", "กรุณาระบุวันเกิด");
    return;
  }

  try {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(credential.user, { displayName });
    await saveUserProfile(credential.user, { displayName, birthDate, setCreatedAt: true });
    registerForm.reset();
    await setLoggedInView(credential.user);
  } catch (error) {
    showError("register-error", "สมัครสมาชิกไม่สำเร็จ อีเมลอาจถูกใช้แล้วหรือรหัสผ่านสั้นเกินไป");
  }
});

googleLogin.addEventListener("click", async () => {
  hideError("login-error");

  try {
    const provider = new GoogleAuthProvider();
    const credential = await signInWithPopup(auth, provider);
    await saveUserProfile(credential.user);
    await setLoggedInView(credential.user);
  } catch (error) {
    showError("login-error", "เข้าสู่ระบบด้วย Google ไม่สำเร็จ");
  }
});

birthdayForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  hideError("birthday-error");

  const formData = new FormData(birthdayForm);
  const birthDate = String(formData.get("birthDate") || "");

  if (!currentUser || !birthDate) {
    showError("birthday-error", "กรุณาระบุวันเกิด");
    return;
  }

  try {
    await saveUserProfile(currentUser, { birthDate });
    birthdayForm.reset();
    await setLoggedInView(currentUser);
  } catch (error) {
    showError("birthday-error", "บันทึกวันเกิดไม่สำเร็จ");
  }
});

logoutButton.addEventListener("click", async () => {
  await signOut(auth);
});

onAuthStateChanged(auth, async (user) => {
  currentUser = user;

  if (!user) {
    setLoggedOutView();
    return;
  }

  try {
    await setLoggedInView(user);
  } catch (error) {
    setLoggedOutView();
    showError("login-error", "ไม่สามารถโหลดข้อมูลผู้ใช้งานได้");
  }
});
