const express = require("express");
const router = express.Router();
const db = require("../db");

// GET all housekeeping tasks with room & staff info
router.get("/", (req, res) => {
  const sql = `
    SELECT h.housekeeping_id, h.cleaning_date, h.cleaning_status, h.notes,
           r.room_number, r.floor_number, r.status AS room_status,
           u.full_name AS assigned_to_name
    FROM housekeeping h
    JOIN rooms r ON h.room_id = r.room_id
    LEFT JOIN users u ON h.assigned_to = u.user_id
    ORDER BY h.cleaning_date DESC, h.cleaning_status
  `;
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
});

// GET pending tasks only
router.get("/pending", (req, res) => {
  const sql = `
    SELECT h.housekeeping_id, h.cleaning_date, h.notes,
           r.room_number, r.floor_number,
           u.full_name AS assigned_to_name
    FROM housekeeping h
    JOIN rooms r ON h.room_id = r.room_id
    LEFT JOIN users u ON h.assigned_to = u.user_id
    WHERE h.cleaning_status != 'completed'
    ORDER BY h.cleaning_date
  `;
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
});

// POST assign housekeeping task
router.post("/", (req, res) => {
  const { room_id, assigned_to, cleaning_date, notes } = req.body;
  const sql = `
    INSERT INTO housekeeping (room_id, assigned_to, cleaning_date, notes)
    VALUES (?, ?, ?, ?)
  `;
  db.query(sql, [room_id, assigned_to || null, cleaning_date, notes], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });

    // Set room to cleaning status
    db.query("UPDATE rooms SET status = 'cleaning' WHERE room_id = ?", [room_id], () => {});
    res.json({ message: "Housekeeping task assigned", id: result.insertId });
  });
});

// PATCH update cleaning status
router.patch("/:id/status", (req, res) => {
  const { cleaning_status } = req.body;
  const validStatuses = ["pending", "in_progress", "completed"];
  if (!validStatuses.includes(cleaning_status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  db.query(
    "UPDATE housekeeping SET cleaning_status = ? WHERE housekeeping_id = ?",
    [cleaning_status, req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });

      // If completed, set room back to available
      if (cleaning_status === "completed") {
        db.query(
          `UPDATE rooms r
           JOIN housekeeping h ON r.room_id = h.room_id
           SET r.status = 'available'
           WHERE h.housekeeping_id = ?`,
          [req.params.id],
          () => {}
        );
      }
      res.json({ message: "Housekeeping status updated" });
    }
  );
});

module.exports = router;
