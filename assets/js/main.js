// ------------------------------------
// AOS & Carousel init
// ------------------------------------
if (typeof AOS !== 'undefined') {
  AOS.init({ duration: 800, once: true });
}

if (typeof $ !== 'undefined') {
  var owl = $('.owl-carousel');
  if (owl.length) {
    owl.owlCarousel({
      items: 6,
      loop: true,
      margin: 45,
      autoplay: true,
      autoplayTimeout: 1700,
      autoplayHoverPause: false,
      smartSpeed: 1000,
      autoplaySpeed: 1000,
      responsive: {
        0: { items: 2 },
        576: { items: 3 },
        768: { items: 4 },
        992: { items: 6 }
      }
    });
  }
}

// ------------------------------------
// Scroll-aware sticky navbar (bg stays white via inline style, shadow added on scroll)
// ------------------------------------
(function () {
  var nav = document.querySelector('nav');
  if (!nav) return;
  window.addEventListener('scroll', function () {
    if (window.pageYOffset > 10) {
      nav.classList.add('shadow');
    } else {
      nav.classList.remove('shadow');
    }
  });
})();

// ------------------------------------
// Dark mode
// ------------------------------------
(function () {
  const root = document.documentElement;
  const saved = localStorage.getItem('theme');
  if (saved) root.setAttribute('data-bs-theme', saved);

  document.addEventListener('click', function (e) {
    if (!e.target || e.target.id !== 'theme-toggle') return;
    const next = root.getAttribute('data-bs-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-bs-theme', next);
    localStorage.setItem('theme', next);
    e.target.textContent = next === 'dark' ? '☀️' : '🌙';
  });

  // set icon on load
  window.addEventListener('DOMContentLoaded', function () {
    const toggle = document.getElementById('theme-toggle');
    if (toggle && saved === 'dark') toggle.textContent = '☀️';
  });
})();

// ------------------------------------
// Bootstrap form validation
// ------------------------------------
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.needs-validation').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      if (!form.checkValidity()) {
        e.preventDefault();
        e.stopPropagation();
      }
      form.classList.add('was-validated');
    });
  });
});
