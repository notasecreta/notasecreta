function money(n) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0
  }).format(n);
}

function getCart() {
  return JSON.parse(localStorage.getItem("notaSecretaCart") || "[]");
}

function saveCart(cart) {
  localStorage.setItem("notaSecretaCart", JSON.stringify(cart));
  updateCartCount();
}

function updateCartCount() {
  const count = getCart().reduce((acc, item) => acc + item.qty, 0);
  document.querySelectorAll("#cart-count").forEach(el => el.textContent = count);
}

function productCard(p) {
  return `
    <article class="product-card">
      <a href="producto.html?id=${p.id}" class="product-image ${p.imageClass}">
        <div class="bottle-shape"></div>
      </a>
      <div class="product-info">
        <div>
          <p class="product-subtitle">${p.subtitle}</p>
          <h3>${p.name}</h3>
        </div>
        <strong>${money(p.price)}</strong>
      </div>
      <button class="quick-add" onclick="quickAdd('${p.id}')">Agregar al carrito</button>
    </article>
  `;
}

function renderHomeProducts() {
  const packs = document.getElementById("packs-grid");
  const perfumes = document.getElementById("perfumes-grid");
  if (packs) packs.innerHTML = PRODUCTS.filter(p => p.type === "pack").map(productCard).join("");
  if (perfumes) perfumes.innerHTML = PRODUCTS.filter(p => p.type === "perfume").map(productCard).join("");
}

function quickAdd(id) {
  const p = PRODUCTS.find(x => x.id === id);
  if (!p) return;
  addToCart(p, p.price, null);
  alert(`${p.name} se agregó al carrito.`);
}

function addToCart(product, price, variant) {
  const cart = getCart();
  const key = product.id + (variant ? `-${variant}` : "");
  const existing = cart.find(i => i.key === key);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      key,
      id: product.id,
      name: product.name,
      price,
      variant,
      qty: 1,
      type: product.type
    });
  }
  saveCart(cart);
}

function renderProductDetail() {
  const container = document.getElementById("product-detail");
  if (!container) return;

  const id = new URLSearchParams(location.search).get("id");
  const p = PRODUCTS.find(x => x.id === id) || PRODUCTS[0];

  let selector = "";
  if (p.sizes) {
    selector = `
      <div class="variant-block">
        <span>Tamaño</span>
        <div class="variant-options">
          ${Object.entries(p.sizes).map(([size, price], i) => `
            <button class="variant-btn ${i===0?'active':''}" data-size="${size}" data-price="${price}" onclick="selectVariant(this)">
              ${size}
            </button>`).join("")}
        </div>
      </div>
    `;
  }

  const notes = p.notes ? `
    <div class="included">
      <h4>Incluye</h4>
      <ul>${p.notes.map(n => `<li>${n}</li>`).join("")}</ul>
    </div>` : "";

  container.innerHTML = `
    <div class="detail-image ${p.imageClass}">
      <div class="bottle-shape large"></div>
    </div>
    <div class="detail-copy">
      <p class="eyebrow">${p.type === "pack" ? "DISCOVERY PACK" : "FULL SIZE"}</p>
      <h1>${p.name}</h1>
      <p class="detail-sub">${p.subtitle}</p>
      <p class="detail-price" id="detail-price">${money(p.sizes ? Object.values(p.sizes)[0] : p.price)}</p>
      <p class="detail-description">${p.description}</p>
      ${selector}
      ${notes}
      ${p.type === "perfume" ? '<div class="benefit-note">¿Lo descubriste con un Discovery Pack? Aplicá <strong>SECRET25</strong> en el carrito.</div>' : ''}
      <button class="btn btn-dark full" onclick="addCurrentProduct('${p.id}')">Agregar al carrito</button>
    </div>
  `;
}

function selectVariant(btn) {
  document.querySelectorAll(".variant-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  document.getElementById("detail-price").textContent = money(Number(btn.dataset.price));
}

function addCurrentProduct(id) {
  const p = PRODUCTS.find(x => x.id === id);
  if (!p) return;
  let price = p.price;
  let variant = null;
  const active = document.querySelector(".variant-btn.active");
  if (active) {
    price = Number(active.dataset.price);
    variant = active.dataset.size;
  }
  addToCart(p, price, variant);
  alert("Producto agregado al carrito.");
}

function renderCart() {
  const list = document.getElementById("cart-items");
  if (!list) return;
  const cart = getCart();

  if (!cart.length) {
    list.innerHTML = `<div class="empty-cart"><h2>Tu carrito está vacío.</h2><a class="btn btn-dark" href="index.html">Descubrir productos</a></div>`;
  } else {
    list.innerHTML = cart.map((item, idx) => `
      <article class="cart-item">
        <div class="cart-thumb"></div>
        <div class="cart-item-copy">
          <h3>${item.name}</h3>
          ${item.variant ? `<p>${item.variant}</p>` : ""}
          <strong>${money(item.price)}</strong>
        </div>
        <div class="qty-control">
          <button onclick="changeQty(${idx}, -1)">−</button>
          <span>${item.qty}</span>
          <button onclick="changeQty(${idx}, 1)">+</button>
        </div>
        <button class="remove" onclick="removeItem(${idx})">Eliminar</button>
      </article>
    `).join("");
  }

  refreshTotals();
}

function changeQty(index, delta) {
  const cart = getCart();
  cart[index].qty += delta;
  if (cart[index].qty <= 0) cart.splice(index, 1);
  saveCart(cart);
  renderCart();
}

function removeItem(index) {
  const cart = getCart();
  cart.splice(index, 1);
  saveCart(cart);
  renderCart();
}

function couponIsApplied() {
  return localStorage.getItem("notaSecretaCoupon") === "SECRET25";
}

function applyCoupon() {
  const input = document.getElementById("coupon");
  const msg = document.getElementById("coupon-message");
  if (input.value.trim().toUpperCase() === "SECRET25") {
    localStorage.setItem("notaSecretaCoupon", "SECRET25");
    msg.textContent = "Cupón aplicado correctamente.";
  } else {
    localStorage.removeItem("notaSecretaCoupon");
    msg.textContent = "Código inválido.";
  }
  refreshTotals();
}

function refreshTotals() {
  const cart = getCart();
  const subtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const perfumeSubtotal = cart.filter(i => i.type === "perfume").reduce((sum, i) => sum + i.price * i.qty, 0);
  const discount = couponIsApplied() && perfumeSubtotal > 0 ? Math.min(25000, perfumeSubtotal) : 0;
  const total = subtotal - discount;

  const s = document.getElementById("subtotal");
  const d = document.getElementById("discount");
  const t = document.getElementById("total");
  if (s) s.textContent = money(subtotal);
  if (d) d.textContent = `-${money(discount)}`;
  if (t) t.textContent = money(total);
}

function checkout() {
  const cart = getCart();
  if (!cart.length) {
    alert("Tu carrito está vacío.");
    return;
  }
  alert("Compra simulada con éxito. En una tienda real, este botón conectaría con el checkout y medio de pago.");
  localStorage.removeItem("notaSecretaCart");
  localStorage.removeItem("notaSecretaCoupon");
  location.href = "index.html";
}


const SAMPLE_OPTIONS = [
  { id: "sample-libre", name: "YSL Libre", family: "Floral · vainilla" },
  { id: "sample-good-girl", name: "Good Girl", family: "Dulce · intensa" },
  { id: "sample-paradoxe", name: "Prada Paradoxe", family: "Floral · ambarada" },
  { id: "sample-born-in-roma", name: "Born in Roma", family: "Vainilla · floral" },
  { id: "sample-la-vie", name: "La Vie Est Belle", family: "Gourmand · iris" },
  { id: "sample-light-blue", name: "Light Blue", family: "Cítrico · fresco" },
  { id: "sample-sauvage", name: "Dior Sauvage", family: "Aromático · amaderado" },
  { id: "sample-bleu", name: "Bleu de Chanel", family: "Amaderado · fresco" },
  { id: "sample-acqua", name: "Acqua di Giò", family: "Acuático · cítrico" },
  { id: "sample-ck-one", name: "CK One", family: "Cítrico · unisex" },
  { id: "sample-black-opium", name: "Black Opium", family: "Café · vainilla" },
  { id: "sample-chance", name: "Chance Eau Tendre", family: "Floral · frutal" }
];

let selectedSamples = [];

function renderSampleSelector() {
  const container = document.getElementById("sample-selector");
  if (!container) return;

  container.innerHTML = SAMPLE_OPTIONS.map((s, i) => `
    <button class="sample-option" data-id="${s.id}" onclick="toggleSample('${s.id}')">
      <span class="sample-number">${String(i + 1).padStart(2, "0")}</span>
      <span class="sample-copy">
        <strong>${s.name}</strong>
        <small>${s.family}</small>
      </span>
      <span class="sample-check">+</span>
    </button>
  `).join("");

  updateCustomPackUI();
}

function toggleSample(id) {
  const exists = selectedSamples.includes(id);

  if (exists) {
    selectedSamples = selectedSamples.filter(x => x !== id);
  } else {
    if (selectedSamples.length >= 5) {
      alert("Tu Discovery Pack puede tener exactamente 5 muestras.");
      return;
    }
    selectedSamples.push(id);
  }

  updateCustomPackUI();
}

function updateCustomPackUI() {
  const count = document.getElementById("selected-count");
  const selected = document.getElementById("selected-samples");
  const addBtn = document.getElementById("add-custom-pack");

  if (count) count.textContent = selectedSamples.length;

  document.querySelectorAll(".sample-option").forEach(btn => {
    const active = selectedSamples.includes(btn.dataset.id);
    btn.classList.toggle("selected", active);
    const check = btn.querySelector(".sample-check");
    if (check) check.textContent = active ? "✓" : "+";
  });

  if (selected) {
    if (!selectedSamples.length) {
      selected.innerHTML = `<p class="empty-selection">Todavía no elegiste ninguna muestra.</p>`;
    } else {
      selected.innerHTML = selectedSamples.map((id, index) => {
        const sample = SAMPLE_OPTIONS.find(s => s.id === id);
        return `
          <div class="selected-sample-row">
            <span>${index + 1}</span>
            <strong>${sample.name}</strong>
            <button onclick="toggleSample('${id}')" aria-label="Quitar">×</button>
          </div>
        `;
      }).join("");
    }
  }

  if (addBtn) {
    addBtn.disabled = selectedSamples.length !== 5;
    addBtn.textContent = selectedSamples.length === 5
      ? "Agregar pack personalizado"
      : `Elegí ${5 - selectedSamples.length} muestra${5 - selectedSamples.length === 1 ? "" : "s"} más`;
  }
}

function addCustomPack() {
  if (selectedSamples.length !== 5) {
    alert("Tenés que elegir exactamente 5 muestras.");
    return;
  }

  const chosen = selectedSamples.map(id => SAMPLE_OPTIONS.find(s => s.id === id).name);
  const cart = getCart();
  cart.push({
    key: "custom-pack-" + Date.now(),
    id: "custom-pack",
    name: "Discovery Pack Personalizado",
    price: 25000,
    variant: chosen.join(" · "),
    qty: 1,
    type: "pack",
    customSamples: chosen
  });

  saveCart(cart);
  alert("Tu Discovery Pack personalizado se agregó al carrito.");
  selectedSamples = [];
  updateCustomPackUI();
}


document.addEventListener("DOMContentLoaded", () => {
  renderHomeProducts();
  renderSampleSelector();
  updateCartCount();

  const toggle = document.querySelector(".menu-toggle");
  const links = document.querySelector(".nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", () => links.classList.toggle("open"));
  }
});
