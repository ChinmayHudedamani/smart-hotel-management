const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

// Serve frontend static files
app.use(express.static(path.join(__dirname, "../frontend")));

// ── API Routes ──────────────────────────────────────────────
app.use("/api/customers",    require("./routes/customers"));
app.use("/api/rooms",        require("./routes/rooms"));
app.use("/api/bookings",     require("./routes/bookings"));
app.use("/api/payments",     require("./routes/payments"));
app.use("/api/services",     require("./routes/services"));
app.use("/api/food-orders",  require("./routes/foodOrders"));
app.use("/api/feedback",     require("./routes/feedback"));
app.use("/api/housekeeping", require("./routes/housekeeping"));
app.use("/api/dashboard",    require("./routes/dashboard"));

app.get("/api", (req, res) => {
  res.json({ message: "Smart Hotel Management API Running ✅" });
});

// Serve frontend for all non-API routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});