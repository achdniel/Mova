const CART_KEY = "mova_cart";

const getCart = () => JSON.parse(localStorage.getItem(CART_KEY) || "[]");
const saveCart = c => { localStorage.setItem(CART_KEY, JSON.stringify(c)); updateCartBadge(); };

function addToCart(id) {
  const cart = getCart();
  const item = cart.find(i => i.id === id);
  if (item) item.qty++;
  else cart.push({ id, qty: 1 });
  saveCart(cart);

  // Toast-style feedback (no blocking alert)
  const btn = document.querySelector('[data-add-to-cart]');
  const original = btn ? btn.textContent : '';
  if (btn) { btn.textContent = '✓ Added!'; btn.disabled = true; }
  setTimeout(() => { if (btn) { btn.textContent = original; btn.disabled = false; } }, 1200);
}

function removeFromCart(id) {
  saveCart(getCart().filter(i => i.id !== id));
}

function updateCartBadge() {
  const total = getCart().reduce((s, i) => s + i.qty, 0);
  document.querySelectorAll("#cart-count").forEach(el => el.textContent = total);
}

document.addEventListener("DOMContentLoaded", updateCartBadge);
// Also update badge after partial navbar is loaded
document.addEventListener("partialLoaded", updateCartBadge);
