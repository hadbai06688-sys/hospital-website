const OPEN_HOUR = 8;
const OPEN_MINUTE = 30;
const CLOSE_HOUR = 16;
const CLOSE_MINUTE = 30;

function getBangkokTimeParts() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Bangkok",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).formatToParts(new Date());

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return {
    hour: Number(values.hour),
    minute: Number(values.minute),
    second: Number(values.second)
  };
}

function isOpenNow({ hour, minute }) {
  const currentMinutes = hour * 60 + minute;
  const openMinutes = OPEN_HOUR * 60 + OPEN_MINUTE;
  const closeMinutes = CLOSE_HOUR * 60 + CLOSE_MINUTE;

  return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function updateOpenStatus() {
  const time = getBangkokTimeParts();
  const open = isOpenNow(time);
  const text = open ? "เปิดทำการ" : "ปิดทำการ";
  const timeText = `${pad(time.hour)}:${pad(time.minute)}:${pad(time.second)}`;

  document.querySelectorAll("[data-open-status]").forEach((status) => {
    status.className = open
      ? "inline-flex shrink-0 items-center gap-2 rounded-full bg-green-500 px-4 py-2 text-sm font-semibold text-white shadow-sm"
      : "inline-flex shrink-0 items-center gap-2 rounded-full bg-gray-600 px-4 py-2 text-sm font-semibold text-white shadow-sm";

    status.innerHTML = `
      <span class="h-2.5 w-2.5 rounded-full bg-white"></span>
      <span>${text}</span>
      <span class="text-xs font-normal opacity-90">${timeText} น.</span>
    `;
  });
}

updateOpenStatus();
setInterval(updateOpenStatus, 1000);
