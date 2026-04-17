const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/", (req, res) => {
  db.query("SELECT * FROM customers", (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(result);
  });
});

router.post("/", (req, res) => {
  const { full_name, phone, email, address, nationality } = req.body;

  const sql = `
    INSERT INTO customers (full_name, phone, email, address, nationality)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [full_name, phone, email, address, nationality],
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: "Customer added", id: result.insertId });
    }
  );
});

module.exports = router;