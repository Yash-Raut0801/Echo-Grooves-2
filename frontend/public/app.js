// ════════════════════════════════════════════════════════════
//  ECHO-GROOVES  |  Frontend App
// ════════════════════════════════════════════════════════════

const API = "http://localhost:8000/api";

let currentUser = JSON.parse(localStorage.getItem("eg_user")) || null;
let cart = JSON.parse(localStorage.getItem("eg_cart")) || [];
let allVinyls = [];

// ── Init ─────────────────────────────────────────────────────
window.addEventListener("DOMContentLoaded", () => {
  updateAuthUI();
  updateCartBadge();
  loadVinyls();
});

// ── Section Navigation ───────────────────────────────────────
function showSection(id) {
  document.querySelectorAll(".section").forEach(s => s.classList.remove("active"));
  const sec = document.getElementById(id);
  if (sec) sec.classList.add("active");

  if (id === "cart") renderCart();
  if (id === "orders") loadOrders();

  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ── Toast ─────────────────────────────────────────────────────
function toast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 2800);
}

// ════════════════════════════════════════════════════════════
//  AUTH
// ════════════════════════════════════════════════════════════
function showModal(type) {
  closeModal();
  document.getElementById("modal-overlay").classList.add("open");
  document.getElementById(`modal-${type}`).classList.add("open");
}
function closeModal() {
  document.getElementById("modal-overlay").classList.remove("open");
  document.querySelectorAll(".modal").forEach(m => m.classList.remove("open"));
  clearErrors();
}
function clearErrors() {
  ["login-error", "reg-error"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = "";
  });
}

async function login() {
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;
  const errEl = document.getElementById("login-error");

  // ── Frontend Validation ──
  if (!email || !password) { errEl.textContent = "All fields are required."; return; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { errEl.textContent = "Enter a valid email address."; return; }
  if (password.length < 6) { errEl.textContent = "Password must be at least 6 characters."; return; }

  try {
    const res = await fetch(`${API}/login`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) { errEl.textContent = data.error; return; }

    currentUser = data.user;
    localStorage.setItem("eg_user", JSON.stringify(currentUser));
    updateAuthUI();
    closeModal();
    toast(`Welcome back, ${currentUser.name}! 🎵`);
  } catch {
    errEl.textContent = "Server error. Is the backend running?";
  }
}

async function register() {
  const name = document.getElementById("reg-name").value.trim();
  const email = document.getElementById("reg-email").value.trim();
  const password = document.getElementById("reg-password").value;
  const errEl = document.getElementById("reg-error");

  // ── Frontend Validation ──
  if (!name || !email || !password) { errEl.textContent = "All fields are required."; return; }
  if (name.length < 2) { errEl.textContent = "Name must be at least 2 characters."; return; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { errEl.textContent = "Enter a valid email address (e.g. you@example.com)."; return; }
  if (password.length < 6) { errEl.textContent = "Password must be at least 6 characters."; return; }
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) { errEl.textContent = "Password must contain letters and at least one number."; return; }

  try {
    const res = await fetch(`${API}/register`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    if (!res.ok) { errEl.textContent = data.error; return; }

    toast("Account created! Please login.");
    showModal("login");
  } catch {
    errEl.textContent = "Server error. Is the backend running?";
  }
}

function logout() {
  currentUser = null;
  localStorage.removeItem("eg_user");
  updateAuthUI();
  showSection("shop");
  toast("Logged out.");
}

function updateAuthUI() {
  const loggedIn = !!currentUser;
  document.getElementById("btn-login").style.display = loggedIn ? "none" : "";
  document.getElementById("btn-register").style.display = loggedIn ? "none" : "";
  document.getElementById("user-info").style.display = loggedIn ? "flex" : "none";
  document.getElementById("orders-nav").style.display = loggedIn ? "" : "none";
  if (loggedIn) document.getElementById("user-name").textContent = currentUser.name;
}

// ════════════════════════════════════════════════════════════
//  VINYLS
// ════════════════════════════════════════════════════════════
async function loadVinyls() {
  try {
    const res = await fetch(`${API}/vinyls`);
    allVinyls = await res.json();
    renderVinyls(allVinyls);
  } catch {
    document.getElementById("vinyl-grid").innerHTML =
      `<p style="color:var(--muted)">Could not load vinyls. Make sure the backend is running.</p>`;
  }
}

function filterVinyls() {
  const search = document.getElementById("search-input").value.toLowerCase();
  const genre = document.getElementById("genre-filter").value;

  const filtered = allVinyls.filter(v => {
    const matchSearch = !search ||
      v.title.toLowerCase().includes(search) ||
      v.artist.toLowerCase().includes(search);
    const matchGenre = !genre || v.genre === genre;
    return matchSearch && matchGenre;
  });

  renderVinyls(filtered);
}

function renderVinyls(vinyls) {
  const grid = document.getElementById("vinyl-grid");
  if (!vinyls.length) {
    grid.innerHTML = `<p style="color:var(--muted); grid-column:1/-1">No records found.</p>`;
    return;
  }

  grid.innerHTML = vinyls.map(v => `
    <div class="vinyl-card">
      <img src="${v.image_url}" alt="${v.title}" onerror="this.src='https://via.placeholder.com/300x300/1e1e1e/c9a84c?text=♪'" />
      <div class="card-body">
        <h3>${v.title}</h3>
        <p class="artist">${v.artist}</p>
        <span class="genre-tag">${v.genre || "Various"}</span>
        <p style="color:var(--muted); font-size:13px; margin-bottom:10px;">${v.description ? v.description.slice(0, 80) + "…" : ""}</p>
        <div class="card-footer">
          <span class="price">$${parseFloat(v.price).toFixed(2)}</span>
          <span class="stock-badge ${v.stock <= 3 ? 'low' : ''}">
            ${v.stock === 0 ? "Out of stock" : v.stock <= 3 ? `Only ${v.stock} left` : `${v.stock} in stock`}
          </span>
        </div>
        <button class="btn-add" onclick="addToCart(${v.id})" ${v.stock === 0 ? "disabled style='opacity:.5;cursor:not-allowed'" : ""}>
          ${v.stock === 0 ? "Out of Stock" : "+ Add to Cart"}
        </button>
      </div>
    </div>
  `).join("");
}

// ════════════════════════════════════════════════════════════
//  CART
// ════════════════════════════════════════════════════════════
function addToCart(vinylId) {
  const vinyl = allVinyls.find(v => v.id === vinylId);
  if (!vinyl) return;

  const existing = cart.find(i => i.id === vinylId);
  if (existing) {
    if (existing.qty >= vinyl.stock) { toast("No more stock available."); return; }
    existing.qty++;
  } else {
    cart.push({
      id: vinyl.id, title: vinyl.title, artist: vinyl.artist,
      price: vinyl.price, image_url: vinyl.image_url, qty: 1
    });
  }

  saveCart();
  toast(`"${vinyl.title}" added to cart 🎶`);
}

function saveCart() {
  localStorage.setItem("eg_cart", JSON.stringify(cart));
  updateCartBadge();
}

function updateCartBadge() {
  const total = cart.reduce((s, i) => s + i.qty, 0);
  document.getElementById("cart-count").textContent = total;
}

function renderCart() {
  const container = document.getElementById("cart-items");
  const footer = document.getElementById("cart-footer");
  const emptyMsg = document.getElementById("cart-empty");

  if (!cart.length) {
    container.innerHTML = "";
    footer.style.display = "none";
    emptyMsg.style.display = "";
    return;
  }

  emptyMsg.style.display = "none";
  footer.style.display = "block";

  container.innerHTML = cart.map(item => `
    <div class="cart-item">
      <img src="${item.image_url}" alt="${item.title}" onerror="this.src='https://via.placeholder.com/70x70/1e1e1e/c9a84c?text=♪'" />
      <div class="cart-item-info">
        <h4>${item.title}</h4>
        <p>${item.artist}</p>
        <p>$${parseFloat(item.price).toFixed(2)} each</p>
      </div>
      <div class="cart-item-controls">
        <button class="qty-btn" onclick="changeQty(${item.id}, -1)">−</button>
        <span class="qty-display">${item.qty}</span>
        <button class="qty-btn" onclick="changeQty(${item.id}, 1)">+</button>
        <button class="btn-remove" onclick="removeFromCart(${item.id})">✕</button>
      </div>
      <strong style="color:var(--gold); min-width:60px; text-align:right;">
        $${(item.price * item.qty).toFixed(2)}
      </strong>
    </div>
  `).join("");

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  document.getElementById("cart-total").textContent = `$${total.toFixed(2)}`;
}

function changeQty(id, delta) {
  const item = cart.find(i => i.id === id);
  const vinyl = allVinyls.find(v => v.id === id);
  if (!item) return;

  item.qty += delta;
  if (item.qty <= 0) return removeFromCart(id);
  if (vinyl && item.qty > vinyl.stock) { item.qty = vinyl.stock; toast("Max stock reached."); }

  saveCart();
  renderCart();
}

function removeFromCart(id) {
  cart = cart.filter(i => i.id !== id);
  saveCart();
  renderCart();
}

// ════════════════════════════════════════════════════════════
//  ORDERS
// ════════════════════════════════════════════════════════════
async function placeOrder() {
  if (!currentUser) {
    toast("Please login to place an order.");
    showModal("login");
    return;
  }
  if (!cart.length) return;

  const items = cart.map(i => ({
    vinylId: i.id,
    quantity: i.qty,
    price: parseFloat(i.price)
  }));

  try {
    const res = await fetch(`${API}/orders`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: currentUser.id, items })
    });
    const data = await res.json();
    if (!res.ok) { toast("Order failed: " + data.error); return; }

    cart = [];
    saveCart();
    toast(`Order #${data.orderId} placed! 🎉`);
    showSection("orders");

    // refresh vinyl stock
    loadVinyls();
  } catch {
    toast("Server error. Is the backend running?");
  }
}

async function loadOrders() {
  if (!currentUser) {
    document.getElementById("orders-list").innerHTML =
      `<p class="empty-msg">Please <a onclick="showModal('login')">login</a> to see your orders.</p>`;
    return;
  }

  try {
    const res = await fetch(`${API}/orders/${currentUser.id}`);
    const orders = await res.json();
    const list = document.getElementById("orders-list");

    if (!orders.length) {
      list.innerHTML = `<p class="empty-msg">No orders yet. <a onclick="showSection('shop')">Start shopping →</a></p>`;
      return;
    }

    list.innerHTML = orders.map(o => `
      <div class="order-card">
        <h4>Order #${o.id}</h4>
        <div class="order-meta">
          <span>Total: <strong style="color:var(--gold)">$${parseFloat(o.total).toFixed(2)}</strong></span>
          <span class="status">${o.status}</span>
          <span>${new Date(o.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</span>
        </div>
      </div>
    `).join("");
  } catch {
    document.getElementById("orders-list").innerHTML =
      `<p class="empty-msg">Could not load orders.</p>`;
  }
}
