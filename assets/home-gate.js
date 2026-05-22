const gate = document.getElementById("memorial-gate");
const enterButton = document.getElementById("enter-site-button");

if (gate && enterButton) {
  document.body.classList.add("overflow-hidden");

  enterButton.addEventListener("click", () => {
    gate.classList.add("hidden");
    document.body.classList.remove("overflow-hidden");
  });
}
