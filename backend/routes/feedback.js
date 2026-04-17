const express = require("express");
const router = express.Router();
const db = require("../db");

// GET all feedback with customer & room info
router.get("/", (req, res) => {
  const sql = `
    SELECT f.feedback_id, f.rating, f.comments, f.feedback_date,
           c.full_name AS customer_name, r.room_number,
           b.check_in_date, b.check_out_date
    FROM feedback f
    JOIN customers c ON f.customer_id = c.customer_id
    JOIN bookings b ON f.booking_id = b.booking_id
    JOIN rooms r ON b.room_id = r.room_id
    ORDER BY f.feedback_date DESC
  `;
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
});

// GET average rating summary
router.get("/summary", (req, res) => {
  const sql = `
    SELECT
      COUNT(*) AS total_reviews,
      ROUND(AVG(rating), 2) AS average_rating,
      SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) AS five_star,
      SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) AS four_star,
      SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) AS three_star,
      SUM(CASE WHEN rating <= 2 THEN 1 ELSE 0 END) AS low_rating
    FROM feedback
  `;
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result[0]);
  });
});

// POST submit feedback
router.post("/", (req, res) => {
  const { booking_id, customer_id, rating, comments } = req.body;
  if (rating < 1 || rating > 5) {
    return res.status(400).json({ error: "Rating must be between 1 and 5" });
  }
  const sql = `
    INSERT INTO feedback (booking_id, customer_id, rating, comments)
    VALUES (?, ?, ?, ?)
  `;
  db.query(sql, [booking_id, customer_id, rating, comments], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Feedback submitted", id: result.insertId });
  });
});

// DELETE feedback
router.delete("/:id", (req, res) => {
  db.query("DELETE FROM feedback WHERE feedback_id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Feedback deleted" });
  });
});

module.exports = router;
