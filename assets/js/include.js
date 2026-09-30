// Include shared partials (navbar, footer)
document.querySelectorAll("[data-include]").forEach(async el => {
  const res = await fetch(el.dataset.include);
  el.innerHTML = await res.text();
});
