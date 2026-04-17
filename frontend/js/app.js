const API = "http://localhost:5000/api";

// ── Clock ───────────────────────────────────────────────────
function updateClock() {
  document.getElementById("currentTime").textContent =
    new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}
setInterval(updateClock, 1000);
updateClock();

// ── Toast ───────────────────────────────────────────────────
function showToast(msg, type = "success") {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.className = `toast ${type}`;
  setTimeout(() => (t.className = "toast hidden"), 3000);
}

// ── Fetch helper ────────────────────────────────────────────
async function api(path) {
  try {
    const res = await fetch(`${API}${path}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    showToast("API error: " + e.message, "error");
    return null;
  }
}

async function apiPatch(path, body) {
  try {
    const res = await fetch(`${API}${path}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error");
    showToast(data.message || "Updated!", "success");
    return true;
  } catch (e) {
    showToast(e.message, "error");
    return false;
  }
}

// ── Status badge helper ─────────────────────────────────────
function badge(status) {
  const map = {
    available: "green", confirmed: "blue", checked_in: "green", checked_out: "gray",
    cancelled: "red", pending: "yellow", occupied: "red", booked: "purple",
    cleaning: "yellow", maintenance: "gray", paid: "green", failed: "red",
    refunded: "yellow", completed: "green", requested: "blue", in_progress: "yellow",
    delivered: "green", placed: "blue", preparing: "yellow"
  };
  const cls = map[status] || "gray";
  return `<span class="badge badge-${cls}">${status?.replace(/_/g, " ")}</span>`;
}

function stars(rating) {
  return `<span class="stars">${"★".repeat(rating)}${"☆".repeat(5 - rating)}</span>`;
}

// ── Nav ─────────────────────────────────────────────────────
const sections = {
  dashboard: renderDashboard,
  rooms: renderRooms,
  customers: renderCustomers,
  bookings: renderBookings,
  payments: renderPayments,
  services: renderServices,
  food: renderFood,
  housekeeping: renderHousekeeping,
  feedback: renderFeedback
};

const titles = {
  dashboard: "Dashboard", rooms: "Rooms", customers: "Customers",
  bookings: "Bookings", payments: "Payments", services: "Services",
  food: "Food Orders", housekeeping: "Housekeeping", feedback: "Guest Feedback"
};

document.querySelectorAll(".nav-item").forEach(el => {
  el.addEventListener("click", e => {
    e.preventDefault();
    document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
    el.classList.add("active");
    const sec = el.dataset.section;
    document.getElementById("pageTitle").textContent = titles[sec];
    document.getElementById("content").innerHTML = `<div class="loading">Loading...</div>`;
    sections[sec]();
  });
});

// ── DASHBOARD ───────────────────────────────────────────────
async function renderDashboard() {
  const [stats, recent] = await Promise.all([
    api("/dashboard/stats"),
    api("/dashboard/recent-bookings")
  ]);
  if (!stats) return;

  const statCards = [
    { label: "Total Rooms",      value: stats.totalRooms,          icon: "🏠" },
    { label: "Available",        value: stats.availableRooms,       icon: "✅" },
    { label: "Occupied",         value: stats.occupiedRooms,        icon: "🔴" },
    { label: "Customers",        value: stats.totalCustomers,       icon: "👥" },
    { label: "Active Bookings",  value: stats.activeBookings,       icon: "📋" },
    { label: "Revenue (₹)",      value: "₹" + Number(stats.totalRevenue).toLocaleString("en-IN"), icon: "💰" },
    { label: "Pending Cleaning", value: stats.pendingHousekeeping,  icon: "🧹" },
    { label: "Avg Rating",       value: stats.avgRating ? stats.avgRating + " ★" : "N/A", icon: "⭐" }
  ];

  let html = `<div class="stat-grid">`;
  statCards.forEach(c => {
    html += `<div class="stat-card">
      <div class="stat-icon">${c.icon}</div>
      <div class="stat-label">${c.label}</div>
      <div class="stat-value">${c.value ?? 0}</div>
    </div>`;
  });
  html += `</div>`;

  html += `<div class="section-card">
    <div class="section-header"><h2>Recent Bookings</h2></div>
    <div class="table-wrap"><table>
      <thead><tr>
        <th>ID</th><th>Customer</th><th>Room</th><th>Type</th>
        <th>Check In</th><th>Check Out</th><th>Status</th><th>Amount</th>
      </tr></thead><tbody>`;
  (recent || []).forEach(b => {
    html += `<tr>
      <td>#${b.booking_id}</td>
      <td>${b.customer_name}</td>
      <td>${b.room_number}</td>
      <td>${b.room_type}</td>
      <td>${b.check_in_date?.split("T")[0]}</td>
      <td>${b.check_out_date?.split("T")[0]}</td>
      <td>${badge(b.booking_status)}</td>
      <td>₹${Number(b.total_room_charge).toLocaleString("en-IN")}</td>
    </tr>`;
  });
  html += `</tbody></table></div></div>`;

  document.getElementById("content").innerHTML = html;
}

// ── ROOMS ────────────────────────────────────────────────────
async function renderRooms() {
  const rooms = await api("/rooms");
  if (!rooms) return;

  const statusGroups = {};
  rooms.forEach(r => {
    if (!statusGroups[r.status]) statusGroups[r.status] = 0;
    statusGroups[r.status]++;
  });

  let html = `<div class="stat-grid">`;
  Object.entries(statusGroups).forEach(([s, c]) => {
    html += `<div class="stat-card">
      <div class="stat-label">${s}</div>
      <div class="stat-value">${c}</div>
    </div>`;
  });
  html += `</div>
  <div class="section-card">
    <div class="section-header"><h2>All Rooms</h2></div>
    <div class="room-grid">`;

  rooms.forEach(r => {
    html += `<div class="room-card room-${r.status}" onclick="changeRoomStatus(${r.room_id}, '${r.status}')">
      <div class="room-num">${r.room_number}</div>
      <div class="room-type">${r.type_name}</div>
      <div class="room-floor">Floor ${r.floor_number}</div>
      <div style="margin-top:8px">${badge(r.status)}</div>
      <div style="margin-top:6px;color:var(--muted);font-size:12px">₹${r.base_price}/night</div>
    </div>`;
  });
  html += `</div></div>`;
  document.getElementById("content").innerHTML = html;
}

async function changeRoomStatus(id, current) {
  const options = ["available", "booked", "occupied", "cleaning", "maintenance"].filter(s => s !== current);
  const newStatus = prompt(`Change room status from "${current}" to:\n${options.join(", ")}`);
  if (!newStatus || !options.includes(newStatus)) return;
  const ok = await apiPatch(`/rooms/${id}/status`, { status: newStatus });
  if (ok) renderRooms();
}

// ── CUSTOMERS ────────────────────────────────────────────────
async function renderCustomers() {
  const data = await api("/customers");
  if (!data) return;

  let html = `<div class="section-card">
    <div class="section-header"><h2>All Customers</h2></div>
    <div class="table-wrap"><table>
      <thead><tr>
        <th>ID</th><th>Name</th><th>Phone</th><th>Email</th>
        <th>Nationality</th><th>Loyalty Pts</th><th>Joined</th>
      </tr></thead><tbody>`;
  data.forEach(c => {
    html += `<tr>
      <td>#${c.customer_id}</td>
      <td><strong>${c.full_name}</strong></td>
      <td>${c.phone}</td>
      <td>${c.email || "—"}</td>
      <td>${c.nationality || "—"}</td>
      <td><span class="badge badge-blue">${c.loyalty_points} pts</span></td>
      <td>${c.created_at?.split("T")[0]}</td>
    </tr>`;
  });
  html += `</tbody></table></div></div>`;
  document.getElementById("content").innerHTML = html;
}

// ── BOOKINGS ─────────────────────────────────────────────────
async function renderBookings() {
  const data = await api("/bookings");
  if (!data) return;

  let html = `<div class="section-card">
    <div class="section-header"><h2>All Bookings</h2></div>
    <div class="table-wrap"><table>
      <thead><tr>
        <th>ID</th><th>Customer</th><th>Room</th><th>Check In</th>
        <th>Check Out</th><th>Status</th><th>Amount</th><th>Action</th>
      </tr></thead><tbody>`;
  data.forEach(b => {
    html += `<tr>
      <td>#${b.booking_id}</td>
      <td>${b.customer_name}</td>
      <td>${b.room_number}</td>
      <td>${b.check_in_date?.split("T")[0]}</td>
      <td>${b.check_out_date?.split("T")[0]}</td>
      <td>${badge(b.booking_status)}</td>
      <td>₹${Number(b.total_room_charge).toLocaleString("en-IN")}</td>
      <td>
        ${b.booking_status === "confirmed" ? `<button class="btn btn-primary btn-sm" onclick="updateBookingStatus(${b.booking_id},'checked_in')">Check In</button>` : ""}
        ${b.booking_status === "checked_in" ? `<button class="btn btn-outline btn-sm" onclick="updateBookingStatus(${b.booking_id},'checked_out')">Check Out</button>` : ""}
        ${b.booking_status === "pending" ? `<button class="btn btn-primary btn-sm" onclick="updateBookingStatus(${b.booking_id},'confirmed')">Confirm</button>` : ""}
      </td>
    </tr>`;
  });
  html += `</tbody></table></div></div>`;
  document.getElementById("content").innerHTML = html;
}

async function updateBookingStatus(id, status) {
  const ok = await apiPatch(`/bookings/${id}/status`, { booking_status: status });
  if (ok) renderBookings();
}

// ── PAYMENTS ─────────────────────────────────────────────────
async function renderPayments() {
  const data = await api("/payments");
  if (!data) return;

  const totalPaid = data.filter(p => p.payment_status === "paid").reduce((s, p) => s + Number(p.amount), 0);
  const totalPending = data.filter(p => p.payment_status === "pending").reduce((s, p) => s + Number(p.amount), 0);

  let html = `<div class="stat-grid">
    <div class="stat-card"><div class="stat-label">Total Collected</div><div class="stat-value">₹${totalPaid.toLocaleString("en-IN")}</div></div>
    <div class="stat-card"><div class="stat-label">Pending Amount</div><div class="stat-value">₹${totalPending.toLocaleString("en-IN")}</div></div>
    <div class="stat-card"><div class="stat-label">Total Transactions</div><div class="stat-value">${data.length}</div></div>
  </div>
  <div class="section-card">
    <div class="section-header"><h2>All Payments</h2></div>
    <div class="table-wrap"><table>
      <thead><tr>
        <th>ID</th><th>Customer</th><th>Room</th><th>Amount</th>
        <th>Mode</th><th>Status</th><th>Ref</th><th>Date</th><th>Action</th>
      </tr></thead><tbody>`;
  data.forEach(p => {
    html += `<tr>
      <td>#${p.payment_id}</td>
      <td>${p.customer_name}</td>
      <td>${p.room_number}</td>
      <td><strong>₹${Number(p.amount).toLocaleString("en-IN")}</strong></td>
      <td>${p.payment_mode}</td>
      <td>${badge(p.payment_status)}</td>
      <td>${p.transaction_ref || "—"}</td>
      <td>${p.payment_date?.split("T")[0]}</td>
      <td>
        ${p.payment_status === "pending" ? `<button class="btn btn-primary btn-sm" onclick="markPaymentPaid(${p.payment_id})">Mark Paid</button>` : ""}
      </td>
    </tr>`;
  });
  html += `</tbody></table></div></div>`;
  document.getElementById("content").innerHTML = html;
}

async function markPaymentPaid(id) {
  const ok = await apiPatch(`/payments/${id}/status`, { payment_status: "paid" });
  if (ok) renderPayments();
}

// ── SERVICES ─────────────────────────────────────────────────
async function renderServices() {
  const [services, requests] = await Promise.all([
    api("/services"),
    api("/services/requests")
  ]);

  let html = `<div class="section-card">
    <div class="section-header"><h2>Available Services</h2></div>
    <div class="table-wrap"><table>
      <thead><tr><th>ID</th><th>Service</th><th>Charge</th><th>Description</th></tr></thead><tbody>`;
  (services || []).forEach(s => {
    html += `<tr>
      <td>#${s.service_id}</td>
      <td><strong>${s.service_name}</strong></td>
      <td>₹${s.service_charge}</td>
      <td>${s.description || "—"}</td>
    </tr>`;
  });
  html += `</tbody></table></div></div>`;

  html += `<div class="section-card">
    <div class="section-header"><h2>Service Requests</h2></div>
    <div class="table-wrap"><table>
      <thead><tr>
        <th>ID</th><th>Customer</th><th>Room</th><th>Service</th>
        <th>Qty</th><th>Charge</th><th>Status</th><th>Staff</th><th>Action</th>
      </tr></thead><tbody>`;
  (requests || []).forEach(r => {
    html += `<tr>
      <td>#${r.request_id}</td>
      <td>${r.customer_name}</td>
      <td>${r.room_number}</td>
      <td>${r.service_name}</td>
      <td>${r.quantity}</td>
      <td>₹${r.total_charge}</td>
      <td>${badge(r.request_status)}</td>
      <td>${r.handled_by || "—"}</td>
      <td>
        ${r.request_status === "requested" ? `<button class="btn btn-primary btn-sm" onclick="updateServiceStatus(${r.request_id},'in_progress')">Start</button>` : ""}
        ${r.request_status === "in_progress" ? `<button class="btn btn-primary btn-sm" onclick="updateServiceStatus(${r.request_id},'completed')">Done</button>` : ""}
      </td>
    </tr>`;
  });
  html += `</tbody></table></div></div>`;
  document.getElementById("content").innerHTML = html;
}

async function updateServiceStatus(id, status) {
  const ok = await apiPatch(`/services/requests/${id}/status`, { request_status: status });
  if (ok) renderServices();
}

// ── FOOD ORDERS ──────────────────────────────────────────────
async function renderFood() {
  const data = await api("/food-orders");
  if (!data) return;

  let html = `<div class="section-card">
    <div class="section-header"><h2>Food Orders</h2></div>
    <div class="table-wrap"><table>
      <thead><tr>
        <th>ID</th><th>Customer</th><th>Room</th><th>Order Time</th>
        <th>Total</th><th>Status</th><th>Action</th>
      </tr></thead><tbody>`;
  data.forEach(o => {
    html += `<tr>
      <td>#${o.food_order_id}</td>
      <td>${o.customer_name}</td>
      <td>${o.room_number}</td>
      <td>${o.order_time?.replace("T", " ").split(".")[0]}</td>
      <td>₹${Number(o.total_amount).toLocaleString("en-IN")}</td>
      <td>${badge(o.order_status)}</td>
      <td>
        ${o.order_status === "placed"    ? `<button class="btn btn-primary btn-sm" onclick="updateFoodStatus(${o.food_order_id},'preparing')">Prepare</button>` : ""}
        ${o.order_status === "preparing" ? `<button class="btn btn-primary btn-sm" onclick="updateFoodStatus(${o.food_order_id},'delivered')">Deliver</button>` : ""}
      </td>
    </tr>`;
  });
  html += `</tbody></table></div></div>`;
  document.getElementById("content").innerHTML = html;
}

async function updateFoodStatus(id, status) {
  const ok = await apiPatch(`/food-orders/${id}/status`, { order_status: status });
  if (ok) renderFood();
}

// ── HOUSEKEEPING ─────────────────────────────────────────────
async function renderHousekeeping() {
  const data = await api("/housekeeping");
  if (!data) return;

  const pending = data.filter(h => h.cleaning_status !== "completed").length;

  let html = `<div class="stat-grid">
    <div class="stat-card"><div class="stat-label">Pending Tasks</div><div class="stat-value">${pending}</div></div>
    <div class="stat-card"><div class="stat-label">Total Tasks</div><div class="stat-value">${data.length}</div></div>
  </div>
  <div class="section-card">
    <div class="section-header"><h2>Housekeeping Tasks</h2></div>
    <div class="table-wrap"><table>
      <thead><tr>
        <th>ID</th><th>Room</th><th>Floor</th><th>Date</th>
        <th>Status</th><th>Assigned To</th><th>Notes</th><th>Action</th>
      </tr></thead><tbody>`;
  data.forEach(h => {
    html += `<tr>
      <td>#${h.housekeeping_id}</td>
      <td>${h.room_number}</td>
      <td>${h.floor_number}</td>
      <td>${h.cleaning_date?.split("T")[0]}</td>
      <td>${badge(h.cleaning_status)}</td>
      <td>${h.assigned_to_name || "Unassigned"}</td>
      <td>${h.notes || "—"}</td>
      <td>
        ${h.cleaning_status === "pending"     ? `<button class="btn btn-primary btn-sm" onclick="updateHKStatus(${h.housekeeping_id},'in_progress')">Start</button>` : ""}
        ${h.cleaning_status === "in_progress" ? `<button class="btn btn-primary btn-sm" onclick="updateHKStatus(${h.housekeeping_id},'completed')">Done</button>` : ""}
      </td>
    </tr>`;
  });
  html += `</tbody></table></div></div>`;
  document.getElementById("content").innerHTML = html;
}

async function updateHKStatus(id, status) {
  const ok = await apiPatch(`/housekeeping/${id}/status`, { cleaning_status: status });
  if (ok) renderHousekeeping();
}

// ── FEEDBACK ─────────────────────────────────────────────────
async function renderFeedback() {
  const [data, summary] = await Promise.all([
    api("/feedback"),
    api("/feedback/summary")
  ]);

  let html = `<div class="rating-summary">
    <div class="rating-big">
      <div class="rating-num">${summary?.average_rating ?? "—"}</div>
      <div class="stars">${"★".repeat(Math.round(summary?.average_rating || 0))}</div>
      <div class="rating-label">${summary?.total_reviews} reviews</div>
    </div>
    <div class="stat-grid" style="flex:1;align-content:start">
      <div class="stat-card"><div class="stat-label">5 Star</div><div class="stat-value">${summary?.five_star ?? 0}</div></div>
      <div class="stat-card"><div class="stat-label">4 Star</div><div class="stat-value">${summary?.four_star ?? 0}</div></div>
      <div class="stat-card"><div class="stat-label">3 Star</div><div class="stat-value">${summary?.three_star ?? 0}</div></div>
      <div class="stat-card"><div class="stat-label">Low (≤2)</div><div class="stat-value">${summary?.low_rating ?? 0}</div></div>
    </div>
  </div>
  <div class="section-card">
    <div class="section-header"><h2>Guest Reviews</h2></div>
    <div class="table-wrap"><table>
      <thead><tr>
        <th>ID</th><th>Customer</th><th>Room</th><th>Rating</th>
        <th>Comments</th><th>Date</th>
      </tr></thead><tbody>`;
  (data || []).forEach(f => {
    html += `<tr>
      <td>#${f.feedback_id}</td>
      <td>${f.customer_name}</td>
      <td>${f.room_number}</td>
      <td>${stars(f.rating)}</td>
      <td>${f.comments || "—"}</td>
      <td>${f.feedback_date?.split("T")[0]}</td>
    </tr>`;
  });
  html += `</tbody></table></div></div>`;
  document.getElementById("content").innerHTML = html;
}

// ── Init ─────────────────────────────────────────────────────
renderDashboard();
