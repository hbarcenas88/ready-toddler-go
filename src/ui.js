export function renderApp() {
  const root = document.getElementById("app");
  if (root && !root.dataset.ready) {
    root.dataset.ready = "true";
    root.innerHTML = "<main class=\"card\"><h1>Ready, Toddler, Go!</h1><p>Loading app...</p></main>";
  }
}
