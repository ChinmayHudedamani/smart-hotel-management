const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/", (req, res) => {
  const sql = `
    SELECT r.room_id, r.room_number, r.floor_number, r.status, rt.type_name, rt.base_price
    FROM rooms r
    JOIN room_types rt ON r.room_type_id = rt.room_type_id
  `;

  db.query(sql, (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(result);
  });
});

router.get("/available", (req, res) => {
  const sql = `
    SELECT r.room_id, r.room_number, r.floor_number, rt.type_name, rt.base_price
    FROM rooms r
    JOIN room_types rt ON r.room_type_id = rt.room_type_id
    WHERE r.status = 'available'
  `;

  db.query(sql, (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(result);
  });
});

// PATCH update room status
router.patch("/:id/status", (req, res) => {
  const { status } = req.body;
  const validStatuses = ["available", "booked", "occupied", "cleaning", "maintenance"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid room status" });
  }
  db.query(
    "UPDATE rooms SET status = ? WHERE room_id = ?",
    [status, req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: `Room status updated to ${status}` });
    }
  );
});

// GET single room details
router.get("/:id", (req, res) => {
  const sql = `
    SELECT r.*, rt.type_name, rt.base_price, rt.max_occupancy, rt.description AS type_description
    FROM rooms r
    JOIN room_types rt ON r.room_type_id = rt.room_type_id
    WHERE r.room_id = ?
  `;
  db.query(sql, [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.length === 0) return res.status(404).json({ error: "Room not found" });
    res.json(result[0]);
  });
});

module.exports = router;