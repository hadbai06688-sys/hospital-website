import { db } from "./firebase-init.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "2552";
const SESSION_KEY = "banhaadbai-admin-logged-in";

const loginPanel = document.getElementById("admin-login-panel");
const dashboard = document.getElementById("admin-dashboard");
const loginForm = document.getElementById("admin-login-form");
const loginError = document.getElementById("admin-login-error");
const logoutButton = document.getElementById("admin-logout");
const refreshButton = document.getElementById("refresh-admin-data");
const dataError = document.getElementById("admin-data-error");
const totalUsers = document.getElementById("total-users");
const usersWithBirthdate = document.getElementById("users-with-birthdate");
const averageAge = document.getElementById("average-age");
const totalVisits = document.getElementById("total-visits");
const ageBreakdown = document.getElementById("age-breakdown");
const usersTable = document.getElementById("users-table");
const pageVisits = document.getElementById("page-visits");

const ageGroups = [
  { label: "ต่ำกว่า 18 ปี", min: 0, max: 17 },
  { label: "18-24 ปี", min: 18, max: 24 },
  { label: "25-34 ปี", min: 25, max: 34 },
  { label: "35-44 ปี", min: 35, max: 44 },
  { label: "45-59 ปี", min: 45, max: 59 },
  { label: "60 ปีขึ้นไป", min: 60, max: Infinity }
];

function setAdminVisible(isLoggedIn) {
  loginPanel.classList.toggle("hidden", isLoggedIn);
  dashboard.classList.toggle("hidden", !isLoggedIn);

  if (isLoggedIn) {
    loadAdminData();
  }
}

function showLoginError(message) {
  loginError.textContent = message;
  loginError.classList.remove("hidden");
}

function showDataError(message) {
  dataError.textContent = message;
  dataError.classList.remove("hidden");
}

function clearDataError() {
  dataError.classList.add("hidden");
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

function formatTimestamp(value) {
  if (!value) return "-";

  const date = typeof value.toDate === "function" ? value.toDate() : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("th-TH", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

function formatBirthDate(value) {
  if (!value) return "-";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("th-TH", { dateStyle: "medium" });
}

function groupForAge(age) {
  return ageGroups.find((group) => age >= group.min && age <= group.max)?.label || "ไม่ระบุ";
}

function renderAgeBreakdown(users) {
  const counts = Object.fromEntries(ageGroups.map((group) => [group.label, 0]));
  const ages = users.map((user) => user.age).filter((age) => age !== null);

  ages.forEach((age) => {
    counts[groupForAge(age)] += 1;
  });

  const max = Math.max(...Object.values(counts), 1);

  ageBreakdown.innerHTML = ageGroups.map((group) => {
    const count = counts[group.label];
    const width = Math.max((count / max) * 100, count > 0 ? 8 : 0);

    return `
      <div>
        <div class="flex items-center justify-between gap-4 text-sm mb-2">
          <span class="font-medium text-gray-700">${group.label}</span>
          <span class="text-rose-700">${count} คน</span>
        </div>
        <div class="h-3 rounded-full bg-rose-50 overflow-hidden">
          <div class="h-full rounded-full bg-rose-400" style="width:${width}%"></div>
        </div>
      </div>
    `;
  }).join("");
}

function renderUsersTable(users) {
  if (!users.length) {
    usersTable.innerHTML = `
      <tr>
        <td colspan="5" class="py-6 text-center text-gray-500">ยังไม่มีข้อมูลผู้ใช้ที่สมัครสมาชิก</td>
      </tr>
    `;
    return;
  }

  usersTable.innerHTML = users.map((user) => `
    <tr class="text-sm">
      <td class="py-4 pr-4 text-gray-700">${user.displayName || "-"}</td>
      <td class="py-4 pr-4 text-gray-600">${user.email || "-"}</td>
      <td class="py-4 pr-4 text-rose-700 font-medium">${user.age === null ? "-" : `${user.age} ปี`}</td>
      <td class="py-4 pr-4 text-gray-600">${formatBirthDate(user.birthDate)}</td>
      <td class="py-4 pr-4 text-gray-600">${formatTimestamp(user.lastLoginAt)}</td>
    </tr>
  `).join("");
}

function renderPageVisits(visits) {
  if (!visits.length) {
    pageVisits.innerHTML = `<p class="text-gray-500">ยังไม่มีข้อมูลการเข้าเว็บ</p>`;
    return;
  }

  const counts = visits.reduce((result, visit) => {
    const page = visit.page || "ไม่ระบุหน้า";
    result[page] = (result[page] || 0) + 1;
    return result;
  }, {});

  pageVisits.innerHTML = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([page, count]) => `
      <div class="rounded-2xl bg-rose-50 p-5">
        <p class="font-semibold text-rose-700 mb-1">${page}</p>
        <p class="text-gray-600">${count} ครั้ง</p>
      </div>
    `).join("");
}

async function readCollection(name) {
  const snapshot = await getDocs(collection(db, name));
  return snapshot.docs.map((document) => ({
    id: document.id,
    ...document.data()
  }));
}

async function loadAdminData() {
  clearDataError();
  totalUsers.textContent = "...";
  usersWithBirthdate.textContent = "...";
  averageAge.textContent = "...";
  totalVisits.textContent = "...";

  let users = [];
  let visits = [];

  try {
    users = await readCollection("users");
  } catch (error) {
    showDataError("ยังอ่านข้อมูลผู้ใช้ไม่ได้ กรุณาตรวจว่าเปิด Cloud Firestore และตั้งค่า rules แล้ว");
  }

  try {
    visits = await readCollection("siteVisits");
  } catch (error) {
    showDataError("ยังอ่านข้อมูลการเข้าเว็บไม่ได้ กรุณาตรวจว่าเปิด Cloud Firestore และตั้งค่า rules แล้ว");
  }

  const usersWithAges = users.map((user) => ({
    ...user,
    age: calculateAge(user.birthDate)
  }));
  const ages = usersWithAges.map((user) => user.age).filter((age) => age !== null);
  const average = ages.length ? Math.round(ages.reduce((sum, age) => sum + age, 0) / ages.length) : null;

  totalUsers.textContent = String(users.length);
  usersWithBirthdate.textContent = String(ages.length);
  averageAge.textContent = average === null ? "-" : `${average} ปี`;
  totalVisits.textContent = String(visits.length);

  renderAgeBreakdown(usersWithAges);
  renderUsersTable(usersWithAges);
  renderPageVisits(visits);
}

if (sessionStorage.getItem(SESSION_KEY) === "true") {
  setAdminVisible(true);
}

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = new FormData(loginForm);
  const username = String(formData.get("username") || "").trim();
  const password = String(formData.get("password") || "");

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    sessionStorage.setItem(SESSION_KEY, "true");
    loginForm.reset();
    loginError.classList.add("hidden");
    setAdminVisible(true);
    return;
  }

  showLoginError("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
});

logoutButton.addEventListener("click", () => {
  sessionStorage.removeItem(SESSION_KEY);
  setAdminVisible(false);
});

refreshButton.addEventListener("click", loadAdminData);
