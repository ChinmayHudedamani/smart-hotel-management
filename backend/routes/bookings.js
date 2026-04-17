const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/", (req, res) => {
  const sql = `
    SELECT b.booking_id, c.full_name AS customer_name, r.room_number,
           b.check_in_date, b.check_out_date, b.booking_status, b.total_room_charge
    FROM bookings b
    JOIN customers c ON b.customer_id = c.customer_id
    JOIN rooms r ON b.room_id = r.room_id
  `;

  db.query(sql, (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(result);
  });
});

router.post("/", (req, res) => {
  const {
    customer_id,
    room_id,
    booked_by_user_id,
    check_in_date,
    check_out_date,
    booking_status,
    total_room_charge
  } = req.body;

  const sql = `
    INSERT INTO bookings
    (customer_id, room_id, booked_by_user_id, check_in_date, check_out_date, booking_status, total_room_charge)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [
      customer_id,
      room_id,
      booked_by_user_id,
      check_in_date,
      check_out_date,
      booking_status,
      total_room_charge
    ],
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: "Booking added", id: result.insertId });
    }
  );
});

// PATCH update booking status (check-in / check-out / cancel)
router.patch("/:id/status", (req, res) => {
  const { booking_status } = req.body;
  const validStatuses = ["pending", "confirmed", "checked_in", "checked_out", "cancelled"];
  if (!validStatuses.includes(booking_status)) {
    return res.status(400).json({ error: "Invalid booking status" });
  }

  // Get room_id for this booking to update room status too
  db.query("SELECT room_id FROM bookings WHERE booking_id = ?", [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (rows.length === 0) return res.status(404).json({ error: "Booking not found" });

    const roomId = rows[0].room_id;

    db.query(
      "UPDATE bookings SET booking_status = ? WHERE booking_id = ?",
      [booking_status, req.params.id],
      (err2) => {
        if (err2) return res.status(500).json({ error: err2.message });

        // Sync room status
        let roomStatus = null;
        if (booking_status === "checked_in")  roomStatus = "occupied";
        if (booking_status === "checked_out" || booking_status === "cancelled") roomStatus = "available";

        if (roomStatus) {
          db.query("UPDATE rooms SET status = ? WHERE room_id = ?", [roomStatus, roomId], () => {});
        }

        res.json({ message: `Booking status updated to ${booking_status}` });
      }
    );
  });
});

// GET single booking details
router.get("/:id", (req, res) => {
  const sql = `
    SELECT b.*, c.full_name AS customer_name, c.phone, c.email,
           r.room_number, rt.type_name AS room_type, rt.base_price
    FROM bookings b
    JOIN customers c ON b.customer_id = c.customer_id
    JOIN rooms r ON b.room_id = r.room_id
    JOIN room_types rt ON r.room_type_id = rt.room_type_id
    WHERE b.booking_id = ?
  `;
  db.query(sql, [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.length === 0) return res.status(404).json({ error: "Booking not found" });
    res.json(result[0]);
  });
});

module.exports = router;