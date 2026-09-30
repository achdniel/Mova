const PER_PAGE = 8;
let products = [];
const state = { q: "", brand: "", sort: "", page: 1 };

const rupiah = n =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

const card = p => `
  <div class="col-6 col-md-4 col-lg-3">
    <div class="card h-100 shadow-sm product-card">
      <img src="${p.image}" class="card-img-top" alt="${p.name}" loading="lazy">
      <div class="card-body">
        <small class="text-muted">${p.brand}</small>
        <h6 class="card-title">${p.name}</h6>
        <p class="fw-bold mb-0">${rupiah(p.price)}</p>
        <a href="product-detail.html?id=${p.id}" class="stretched-link" aria-label="View ${p.name}"></a>
      </div>
    </div>
  </div>`;

function getFiltered() {
  const list = products.filter(p =>
    p.name.toLowerCase().includes(state.q.toLowerCase()) &&
    (!state.brand || p.brand === state.brand)
  );
  if (state.sort === "price-asc") list.sort((a, b) => a.price - b.price);
  if (state.sort === "price-desc") list.sort((a, b) => b.price - a.price);
  if (state.sort === "name") list.sort((a, b) => a.name.localeCompare(b.name));
  return list;
}

function renderPagination(pages) {
  const ul = document.getElementById("pagination");
  let html = "";
  for (let i = 1; i <= pages; i++) {
    html += `<li class="page-item ${i === state.page ? "active" : ""}">
               <button class="page-link" data-page="${i}">${i}</button></li>`;
  }
  ul.innerHTML = pages > 1 ? html : "";
  ul.querySelectorAll("button").forEach(b => {
    b.onclick = () => {
      state.page = Number(b.dataset.page);
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
  });
}

function render() {
  const list = getFiltered();
  const pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
  state.page = Math.min(state.page, pages);
  const slice = list.slice((state.page - 1) * PER_PAGE, state.page * PER_PAGE);
  document.getElementById("product-list").innerHTML = slice.length
    ? slice.map(card).join("")
    : `<p class="text-center text-muted col-12 py-5">No products found.</p>`;
  renderPagination(pages);
}

async function init() {
  products = await (await fetch("assets/data/products.json")).json();

  const brandSelect = document.getElementById("brand");
  [...new Set(products.map(p => p.brand))].forEach(b =>
    brandSelect.insertAdjacentHTML("beforeend", `<option>${b}</option>`)
  );

  // Support links like products.html?brand=Yeezy
  state.brand = new URLSearchParams(location.search).get("brand") || "";
  brandSelect.value = state.brand;

  document.getElementById("search").oninput = e => { state.q = e.target.value; state.page = 1; render(); };
  brandSelect.onchange = e => { state.brand = e.target.value; state.page = 1; render(); };
  document.getElementById("sort").onchange = e => { state.sort = e.target.value; state.page = 1; render(); };

  render();
}
init();
