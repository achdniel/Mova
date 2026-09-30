# Mova: Manual Implementation Guide (Steps 2–6)

Repo: https://github.com/achdniel/Mova
Live: https://achdniel.github.io/Mova/

Do the steps in order and **commit after each one** so any mistake is easy to undo.

## Before you start

```bash
git clone https://github.com/achdniel/Mova.git
cd Mova
code .
```

- Install the **Live Server** extension in VS Code. Right-click `index.html` → **Open with Live Server**. Always test this way, not by double-clicking the HTML file, because browsers block `fetch()` on `file://` pages.
- GitHub Pages is **case-sensitive**: `Logo.png` and `logo.png` are different files online.
- Use **relative paths** (`assets/img/x.jpg`), never a leading slash (`/assets/img/x.jpg`), because the site lives under `/Mova/`.

Push workflow after each step:

```bash
git add .
git commit -m "Describe what you changed"
git push
```

The site rebuilds in 1 to 2 minutes. Hard-refresh with **Ctrl+Shift+R** to see the new version.

---

## Step 2. Structure and code cleanup

### 2.1 Organize folders

```bash
mkdir -p assets/css assets/js assets/data assets/partials
git mv style.css assets/css/style.css
```

In VS Code press **Ctrl+Shift+H** (replace in files):

| Find | Replace with |
|------|--------------|
| `href="style.css"` | `href="assets/css/style.css"` |

Open each page in Live Server afterwards to confirm the styling still loads.

Target structure:

```
Mova/
├── assets/
│   ├── css/style.css
│   ├── js/            (main.js, products.js, cart.js, include.js)
│   ├── img/
│   ├── data/products.json
│   └── partials/      (navbar.html, footer.html)
├── index.html
├── products.html
├── product-detail.html
├── about.html
├── login.html
├── register.html
├── payment.html
└── README.md
```

### 2.2 Move inline scripts into a file

If a page has a `<script>` block with your own code (not the CDN libraries), cut it into `assets/js/main.js` and link it just before `</body>`:

```html
<script src="assets/js/main.js"></script>
```

Put the AOS and OwlCarousel initialization there too, for example:

```js
AOS.init({ duration: 800, once: true });
$(".owl-carousel").owlCarousel({ loop: true, margin: 16, nav: true, responsive: { 0: { items: 1 }, 768: { items: 3 } } });
```

(Keep the options you already use.)

### 2.3 Create `products.json`

This one data file will power the detail page, listing, search, filters, pagination, and cart.

`assets/data/products.json`:

```json
[
  {
    "id": "aj1-retro-high",
    "brand": "Air Jordan",
    "name": "Air Jordan 1 Retro High",
    "price": 2500000,
    "image": "assets/img/airjordan1.jpg",
    "description": "Short description here."
  },
  {
    "id": "yeezy-boost-350",
    "brand": "Yeezy",
    "name": "Yeezy Boost 350 V2",
    "price": 3200000,
    "image": "assets/img/yeezy350.jpg",
    "description": "Short description here."
  }
]
```

Rules:
- Copy every product currently shown on `airjordan.html`, `yeezy.html`, and `newbalance.html`.
- `id` must be unique, lowercase, with no spaces.
- Prices are plain numbers (no dots, no "Rp").
- No trailing comma after the last item. Validate at https://jsonlint.com if the list comes up empty.

### 2.4 Create the shared detail page

Create `product-detail.html`. Copy the `<head>`, navbar, and footer from your existing pages, then put this in the body:

```html
<div class="container my-5" id="detail"></div>
<script>
  const id = new URLSearchParams(location.search).get("id");
  const rupiah = n => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

  fetch("assets/data/products.json")
    .then(r => r.json())
    .then(list => {
      const p = list.find(x => x.id === id);
      const box = document.getElementById("detail");
      if (!p) { box.innerHTML = "<p>Product not found.</p>"; return; }
      document.title = p.name + " | Mova";
      box.innerHTML = `
        <div class="row g-4">
          <div class="col-md-6"><img src="${p.image}" class="img-fluid rounded" alt="${p.name}"></div>
          <div class="col-md-6">
            <small class="text-muted">${p.brand}</small>
            <h2>${p.name}</h2>
            <h4>${rupiah(p.price)}</h4>
            <p>${p.description}</p>
            <button class="btn btn-dark" onclick="addToCart('${p.id}')">Add to cart</button>
          </div>
        </div>`;
    });
</script>
```

The "Add to cart" button needs `cart.js` from Step 3.4, so load it here later. Until then, temporarily replace it with a plain link to `payment.html`.

### 2.5 Reuse the navbar and footer

Cut the `<nav>...</nav>` block from one page into `assets/partials/navbar.html`, and the `<footer>...</footer>` block into `assets/partials/footer.html`. Then create `assets/js/include.js`:

```js
document.querySelectorAll("[data-include]").forEach(async el => {
  const res = await fetch(el.dataset.include);
  el.innerHTML = await res.text();
});
```

In each HTML page, replace the pasted navbar/footer with:

```html
<div data-include="assets/partials/navbar.html"></div>
...page content...
<div data-include="assets/partials/footer.html"></div>
<script src="assets/js/include.js"></script>
```

Update the navbar links so brand pages point to the new listing:

```html
<a class="nav-link" href="products.html?brand=Air%20Jordan">Air Jordan</a>
<a class="nav-link" href="products.html?brand=Yeezy">Yeezy</a>
<a class="nav-link" href="products.html?brand=New%20Balance">New Balance</a>
```

If you use the Bootstrap JS bundle for the mobile navbar toggle, it still works because it binds to the elements by `data-bs-toggle`, which are present after the fetch. If the toggle stops working, load `include.js` before the Bootstrap script and wait for the include to finish before initializing anything that touches the navbar.

### 2.6 Delete the old pages

Only after everything above works:

```bash
git rm airjordan.html yeezy.html newbalance.html product.html
```

Search the project (Ctrl+Shift+F) for `airjordan.html`, `yeezy.html`, `newbalance.html`, and `product.html` to fix any leftover links.

**Commit:** `Refactor: move to products.json and shared templates`

---

## Step 3. Search, filter, sort, pagination, and cart

### 3.1 Create `products.html`

Use the same `<head>` as your other pages, the navbar and footer includes from 2.5, and this body content:

```html
<div class="container my-5">
  <div class="row g-2 mb-4">
    <div class="col-md-5">
      <input id="search" class="form-control" placeholder="Search products..." aria-label="Search products">
    </div>
    <div class="col-md-3">
      <select id="brand" class="form-select" aria-label="Filter by brand">
        <option value="">All brands</option>
      </select>
    </div>
    <div class="col-md-4">
      <select id="sort" class="form-select" aria-label="Sort products">
        <option value="">Sort by</option>
        <option value="price-asc">Price: low to high</option>
        <option value="price-desc">Price: high to low</option>
        <option value="name">Name A–Z</option>
      </select>
    </div>
  </div>

  <div id="product-list" class="row g-4"></div>
  <nav aria-label="Product pages">
    <ul id="pagination" class="pagination justify-content-center mt-4"></ul>
  </nav>
</div>
<script src="assets/js/products.js"></script>
```

### 3.2 Create `assets/js/products.js`

```js
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
    : `<p class="text-center text-muted">No products found.</p>`;
  renderPagination(pages);
}

async function init() {
  products = await (await fetch("assets/data/products.json")).json();

  const brandSelect = document.getElementById("brand");
  [...new Set(products.map(p => p.brand))].forEach(b =>
    brandSelect.insertAdjacentHTML("beforeend", `<option>${b}</option>`)
  );

  // supports links like products.html?brand=Yeezy
  state.brand = new URLSearchParams(location.search).get("brand") || "";
  brandSelect.value = state.brand;

  document.getElementById("search").oninput = e => { state.q = e.target.value; state.page = 1; render(); };
  brandSelect.onchange = e => { state.brand = e.target.value; state.page = 1; render(); };
  document.getElementById("sort").onchange = e => { state.sort = e.target.value; state.page = 1; render(); };

  render();
}
init();
```

### 3.3 Test pagination

Pagination only appears when there are more products than `PER_PAGE`. To test quickly, temporarily set `PER_PAGE = 2`, then set it back to 8 (or 12) when finished.

Test checklist:
- [ ] Typing in search filters results instantly
- [ ] Brand dropdown filters, and `products.html?brand=Yeezy` opens pre-filtered
- [ ] Each sort option works
- [ ] Changing a filter returns you to page 1
- [ ] Clicking a card opens the correct detail page

### 3.4 Optional: cart with `localStorage`

Create `assets/js/cart.js`:

```js
const CART_KEY = "mova_cart";

const getCart = () => JSON.parse(localStorage.getItem(CART_KEY) || "[]");
const saveCart = c => { localStorage.setItem(CART_KEY, JSON.stringify(c)); updateCartBadge(); };

function addToCart(id) {
  const cart = getCart();
  const item = cart.find(i => i.id === id);
  if (item) item.qty++; else cart.push({ id, qty: 1 });
  saveCart(cart);
  alert("Added to cart");
}

function removeFromCart(id) {
  saveCart(getCart().filter(i => i.id !== id));
}

function updateCartBadge() {
  const total = getCart().reduce((s, i) => s + i.qty, 0);
  const el = document.getElementById("cart-count");
  if (el) el.textContent = total;
}
document.addEventListener("DOMContentLoaded", updateCartBadge);
```

Add a badge to the navbar partial:

```html
<a class="nav-link" href="payment.html">Cart <span id="cart-count" class="badge bg-dark">0</span></a>
```

Load `cart.js` in `product-detail.html` and `payment.html`:

```html
<script src="assets/js/cart.js"></script>
```

To show an order summary on `payment.html`, add `<div id="summary"></div>` and:

```html
<script>
  fetch("assets/data/products.json").then(r => r.json()).then(list => {
    const cart = getCart();
    let total = 0;
    const rows = cart.map(i => {
      const p = list.find(x => x.id === i.id);
      if (!p) return "";
      total += p.price * i.qty;
      return `<li class="list-group-item d-flex justify-content-between">
                <span>${p.name} × ${i.qty}</span><span>${rupiah(p.price * i.qty)}</span></li>`;
    }).join("");
    document.getElementById("summary").innerHTML =
      `<ul class="list-group mb-3">${rows}
         <li class="list-group-item d-flex justify-content-between fw-bold">
           <span>Total</span><span>${rupiah(total)}</span></li></ul>`;
  });
</script>
```

(Define `rupiah` in this page too, or move it into a shared `utils.js`.)

**Commit:** `Add product search, filters, pagination and cart`

---

## Step 4. Styling

### 4.1 CSS variables

At the top of `assets/css/style.css`:

```css
:root {
  --brand: #111111;
  --brand-accent: #e63946;
  --font-main: "Poppins", system-ui, sans-serif;
  --radius: 12px;
}

body { font-family: var(--font-main); }
.btn-dark { background: var(--brand); border-color: var(--brand); }
.text-accent { color: var(--brand-accent); }
```

Then replace repeated hard-coded colors in the file with `var(--brand)` and `var(--brand-accent)`.

### 4.2 Google Font

In every page's `<head>` (or once in a shared head snippet):

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
```

### 4.3 Card hover and sticky navbar

```css
.product-card { border: 0; border-radius: var(--radius); overflow: hidden; transition: transform .2s, box-shadow .2s; }
.product-card:hover { transform: translateY(-4px); box-shadow: 0 10px 24px rgba(0,0,0,.15) !important; }
.product-card img { aspect-ratio: 1 / 1; object-fit: cover; }
```

For a sticky navbar, add Bootstrap's `sticky-top` class to the `<nav>` element, for example `<nav class="navbar navbar-expand-lg bg-white sticky-top shadow-sm">`.

### 4.4 Responsive check

1. Open the site, press **F12**, then click the device toolbar icon (**Ctrl+Shift+M**).
2. Test widths 360px, 768px, and 1280px on every page.
3. Pay special attention to the login, register, and payment forms, plus the navbar collapse and carousel.

Common fixes: use `col-12 col-md-6` on form fields, add `img-fluid` to images, and avoid fixed `width` in pixels on containers.

### 4.5 Optional: dark mode

This works with Bootstrap 5.3 and newer. Check the Bootstrap CDN version in your `<head>` first. Add a button to the navbar partial:

```html
<button id="theme-toggle" class="btn btn-outline-secondary btn-sm">Dark mode</button>
```

And in `main.js`:

```js
const root = document.documentElement;
const saved = localStorage.getItem("theme");
if (saved) root.setAttribute("data-bs-theme", saved);

document.addEventListener("click", e => {
  if (e.target.id !== "theme-toggle") return;
  const next = root.getAttribute("data-bs-theme") === "dark" ? "light" : "dark";
  root.setAttribute("data-bs-theme", next);
  localStorage.setItem("theme", next);
});
```

Remove hard-coded `bg-white` or `bg-light` classes from the navbar, or dark mode will look patchy.

**Commit:** `Improve styling and responsiveness`

---

## Step 5. Quality

### 5.1 Compress images

Large images are the most common reason a site feels slow.

1. Go to https://squoosh.app and drop in an image.
2. Choose **WebP**, quality around 75, and resize to a sensible width (around 800px for product images, around 1600px for banners).
3. Save it into `assets/img/` and update the path in `products.json` or the HTML.
4. Repeat for all images. Keep the originals somewhere outside the repo.

Then add `loading="lazy"` to all images that are below the fold (not the top banner).

### 5.2 Alt text, titles, and meta tags

Every `<img>` needs a meaningful `alt`:

```html
<img src="assets/img/airjordan1.jpg" alt="Air Jordan 1 Retro High in red and black">
```

Every page needs its own title and description in the `<head>`:

```html
<title>Products | Mova</title>
<meta name="description" content="Browse sneakers from Air Jordan, Yeezy and New Balance at Mova.">
<meta name="viewport" content="width=device-width, initial-scale=1">
```

### 5.3 Favicon

Create a 32×32 or 64×64 PNG (or use https://favicon.io), save it as `assets/img/favicon.png`, and add to every `<head>`:

```html
<link rel="icon" type="image/png" href="assets/img/favicon.png">
```

### 5.4 Form validation

On `login.html`, `register.html`, and `payment.html`, add `novalidate` and the class to each form, and mark inputs with `required`:

```html
<form class="needs-validation" novalidate>
  <input type="email" class="form-control" required>
  <div class="invalid-feedback">Please enter a valid email.</div>
  <button class="btn btn-dark mt-3" type="submit">Submit</button>
</form>
```

Then in `main.js`:

```js
document.querySelectorAll(".needs-validation").forEach(form => {
  form.addEventListener("submit", e => {
    if (!form.checkValidity()) { e.preventDefault(); e.stopPropagation(); }
    form.classList.add("was-validated");
  });
});
```

### 5.5 Run Lighthouse

1. Open the deployed site in Chrome.
2. Press **F12** → **Lighthouse** tab.
3. Select Performance, Accessibility, Best Practices, and SEO, and run the report on both mobile and desktop.
4. Fix the items flagged in red or orange, starting with the ones that mention images and missing labels.
5. Run it again and note the scores in your README if you like.

Also check your HTML at https://validator.w3.org (use **Validate by URL** with your live site address).

**Commit:** `Improve accessibility, SEO and performance`

---

## Step 6. Safe handling of login, register, and payment

The site is static, so there is no server to protect anything. Treat these pages as a **UI demo only**.

### 6.1 Add a demo notice

On the login, register, and payment pages, put this at the top of the main content:

```html
<div class="alert alert-warning" role="alert">
  Demo only. This site has no backend. Do not enter real passwords or payment details.
</div>
```

### 6.2 Login and register: never store passwords

Handle the submit without saving anything:

```js
document.querySelector("#login-form").addEventListener("submit", e => {
  e.preventDefault();
  if (!e.target.checkValidity()) return;
  alert("Demo mode: no account was created and nothing was saved.");
});
```

If you want a "Hello, name" greeting after login, store **only the display name** in `localStorage`, never the password or email.

### 6.3 Payment: no real card fields

Replace card number, expiry, and CVV inputs with a mock payment method choice:

```html
<div class="form-check"><input class="form-check-input" type="radio" name="pay" id="p1" checked><label class="form-check-label" for="p1">Bank transfer (demo)</label></div>
<div class="form-check"><input class="form-check-input" type="radio" name="pay" id="p2"><label class="form-check-label" for="p2">E-wallet (demo)</label></div>
<div class="form-check"><input class="form-check-input" type="radio" name="pay" id="p3"><label class="form-check-label" for="p3">Cash on delivery (demo)</label></div>
```

On submit, clear the cart and show a confirmation instead of sending data anywhere:

```js
document.querySelector("#payment-form").addEventListener("submit", e => {
  e.preventDefault();
  localStorage.removeItem("mova_cart");
  document.querySelector("main").innerHTML =
    `<div class="text-center py-5"><h2>Thank you!</h2><p>This was a demo order. No payment was processed.</p><a class="btn btn-dark" href="index.html">Back to home</a></div>`;
});
```

### 6.4 Final check

- [ ] No password, card number, or email is written to `localStorage` or `console.log`
- [ ] The demo notice is visible on all three pages
- [ ] The README states that these pages are demos
- [ ] Nothing in the repo contains real personal data or API keys (search for `password`, `key`, `token`)

**Commit:** `Mark auth and payment pages as demo, remove sensitive fields`

---

## Final deployment check

1. Wait 1 to 2 minutes after your last push, then open https://achdniel.github.io/Mova/ and hard-refresh (**Ctrl+Shift+R**).
2. Click through every page and every navbar link.
3. Open **F12 → Console** and confirm there are no red errors. A 404 means a wrong path or wrong capitalization.
4. Check the **Actions** tab in GitHub for a green "pages build and deployment" run.

## Troubleshooting

| Problem | Likely cause | Fix |
|---------|--------------|-----|
| Product list is empty | JSON error or opened via `file://` | Validate the JSON, use Live Server |
| Works locally, broken online | Filename capitalization or leading `/` in paths | Match case exactly, use relative paths |
| Styling disappeared | CSS path not updated after the move | Check `href="assets/css/style.css"` |
| Navbar toggle does nothing | Bootstrap JS loaded before the include finished | Load scripts at the end of `<body>`, after `include.js` |
| Old version still shows | Browser cache or build in progress | Ctrl+Shift+R, check the Actions tab |
| Images not loading | Wrong path in `products.json` | Compare with the real file path in `assets/img/` |
