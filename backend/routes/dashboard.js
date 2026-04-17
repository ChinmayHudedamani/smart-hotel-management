const express = require("express");
const router = express.Router();
const db = require("../db");

// GET dashboard summary stats
router.get("/stats", (req, res) => {
  const queries = {
    totalRooms:       "SELECT COUNT(*) AS count FROM rooms",
    availableRooms:   "SELECT COUNT(*) AS count FROM rooms WHERE status = 'available'",
    occupiedRooms:    "SELECT COUNT(*) AS count FROM rooms WHERE status = 'occupied'",
    totalCustomers:   "SELECT COUNT(*) AS count FROM customers",
    activeBookings:   "SELECT COUNT(*) AS count FROM bookings WHERE booking_status IN ('confirmed','checked_in')",
    totalRevenue:     "SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE payment_status = 'paid'",
    pendingHousekeeping: "SELECT COUNT(*) AS count FROM housekeeping WHERE cleaning_status != 'completed'",
    avgRating:        "SELECT ROUND(AVG(rating), 1) AS avg FROM feedback"
  };

  const results = {};
  const keys = Object.keys(queries);
  let done = 0;

  keys.forEach(key => {
    db.query(queries[key], (err, rows) => {
      if (err) {
        results[key] = null;
      } else {
        results[key] = Object.values(rows[0])[0];
      }
      done++;
      if (done === keys.length) {
        res.json(results);
      }
    });
  });
});

// GET recent bookings (for dashboard table)
router.get("/recent-bookings", (req, res) => {
  const sql = `
    SELECT b.booking_id, c.full_name AS customer_name,
           r.room_number, rt.type_name AS room_type,
           b.check_in_date, b.check_out_date,
           b.booking_status, b.total_room_charge
    FROM bookings b
    JOIN customers c ON b.customer_id = c.customer_id
    JOIN rooms r ON b.room_id = r.room_id
    JOIN room_types rt ON r.room_type_id = rt.room_type_id
    ORDER BY b.booking_date DESC
    LIMIT 10
  `;
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
});

// GET room occupancy breakdown
router.get("/room-status", (req, res) => {
  const sql = `
    SELECT status, COUNT(*) AS count
    FROM rooms
    GROUP BY status
  `;
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
});

// GET revenue by payment mode
router.get("/revenue-by-mode", (req, res) => {
  const sql = `
    SELECT payment_mode, SUM(amount) AS total
    FROM payments
    WHERE payment_status = 'paid'
    GROUP BY payment_mode
  `;
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
});

module.exports = router;
