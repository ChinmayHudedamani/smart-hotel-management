const express = require("express");
const router = express.Router();
const db = require("../db");

// GET all payments with booking info
router.get("/", (req, res) => {
  const sql = `
    SELECT p.payment_id, p.amount, p.payment_mode, p.payment_status,
           p.payment_date, p.transaction_ref,
           b.booking_id, c.full_name AS customer_name, r.room_number
    FROM payments p
    JOIN bookings b ON p.booking_id = b.booking_id
    JOIN customers c ON b.customer_id = c.customer_id
    JOIN rooms r ON b.room_id = r.room_id
    ORDER BY p.payment_date DESC
  `;
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
});

// GET single payment
router.get("/:id", (req, res) => {
  db.query("SELECT * FROM payments WHERE payment_id = ?", [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.length === 0) return res.status(404).json({ error: "Payment not found" });
    res.json(result[0]);
  });
});

// POST create payment
router.post("/", (req, res) => {
  const { booking_id, amount, payment_mode, payment_status, transaction_ref } = req.body;
  const sql = `
    INSERT INTO payments (booking_id, amount, payment_mode, payment_status, transaction_ref)
    VALUES (?, ?, ?, ?, ?)
  `;
  db.query(sql, [booking_id, amount, payment_mode, payment_status || "pending", transaction_ref], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Payment recorded", id: result.insertId });
  });
});

// PATCH update payment status
router.patch("/:id/status", (req, res) => {
  const { payment_status } = req.body;
  const validStatuses = ["pending", "paid", "failed", "refunded"];
  if (!validStatuses.includes(payment_status)) {
    return res.status(400).json({ error: "Invalid payment status" });
  }
  db.query(
    "UPDATE payments SET payment_status = ? WHERE payment_id = ?",
    [payment_status, req.params.id],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Payment status updated" });
    }
  );
});

module.exports = router;
