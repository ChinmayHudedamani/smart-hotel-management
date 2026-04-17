const express = require("express");
const router = express.Router();
const db = require("../db");

// GET all services
router.get("/", (req, res) => {
  db.query("SELECT * FROM services", (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
});

// GET all service requests with full details
router.get("/requests", (req, res) => {
  const sql = `
    SELECT sr.request_id, sr.quantity, sr.total_charge, sr.request_status,
           sr.request_time, s.service_name, s.service_charge,
           c.full_name AS customer_name, r.room_number,
           u.full_name AS handled_by
    FROM service_requests sr
    JOIN services s ON sr.service_id = s.service_id
    JOIN bookings b ON sr.booking_id = b.booking_id
    JOIN customers c ON b.customer_id = c.customer_id
    JOIN rooms r ON b.room_id = r.room_id
    LEFT JOIN users u ON sr.handled_by_staff_id = u.user_id
    ORDER BY sr.request_time DESC
  `;
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
});

// POST add a new service
router.post("/", (req, res) => {
  const { service_name, service_charge, description } = req.body;
  db.query(
    "INSERT INTO services (service_name, service_charge, description) VALUES (?, ?, ?)",
    [service_name, service_charge, description],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Service added", id: result.insertId });
    }
  );
});

// POST create a service request
router.post("/requests", (req, res) => {
  const { booking_id, service_id, quantity, handled_by_staff_id } = req.body;

  // Calculate total charge
  db.query("SELECT service_charge FROM services WHERE service_id = ?", [service_id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (rows.length === 0) return res.status(404).json({ error: "Service not found" });

    const total_charge = rows[0].service_charge * (quantity || 1);
    const sql = `
      INSERT INTO service_requests (booking_id, service_id, quantity, total_charge, handled_by_staff_id)
      VALUES (?, ?, ?, ?, ?)
    `;
    db.query(sql, [booking_id, service_id, quantity || 1, total_charge, handled_by_staff_id || null], (err2, result) => {
      if (err2) return res.status(500).json({ error: err2.message });
      res.json({ message: "Service request created", id: result.insertId });
    });
  });
});

// PATCH update service request status
router.patch("/requests/:id/status", (req, res) => {
  const { request_status } = req.body;
  const validStatuses = ["requested", "in_progress", "completed", "cancelled"];
  if (!validStatuses.includes(request_status)) {
    return res.status(400).json({ error: "Invalid status" });
  }
  db.query(
    "UPDATE service_requests SET request_status = ? WHERE request_id = ?",
    [request_status, req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Service request status updated" });
    }
  );
});

module.exports = router;
