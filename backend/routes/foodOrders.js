const express = require("express");
const router = express.Router();
const db = require("../db");

// GET all food orders with customer & room info
router.get("/", (req, res) => {
  const sql = `
    SELECT fo.food_order_id, fo.order_time, fo.order_status, fo.total_amount,
           c.full_name AS customer_name, r.room_number
    FROM food_orders fo
    JOIN bookings b ON fo.booking_id = b.booking_id
    JOIN customers c ON b.customer_id = c.customer_id
    JOIN rooms r ON b.room_id = r.room_id
    ORDER BY fo.order_time DESC
  `;
  db.query(sql, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
});

// GET single food order with all items
router.get("/:id", (req, res) => {
  const orderSql = `
    SELECT fo.food_order_id, fo.order_time, fo.order_status, fo.total_amount,
           c.full_name AS customer_name, r.room_number
    FROM food_orders fo
    JOIN bookings b ON fo.booking_id = b.booking_id
    JOIN customers c ON b.customer_id = c.customer_id
    JOIN rooms r ON b.room_id = r.room_id
    WHERE fo.food_order_id = ?
  `;
  const itemsSql = `
    SELECT foi.order_item_id, foi.quantity, foi.item_price, foi.subtotal,
           rm.item_name, rm.category
    FROM food_order_items foi
    JOIN restaurant_menu rm ON foi.item_id = rm.item_id
    WHERE foi.food_order_id = ?
  `;
  db.query(orderSql, [req.params.id], (err, orderRows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (orderRows.length === 0) return res.status(404).json({ error: "Order not found" });

    db.query(itemsSql, [req.params.id], (err2, itemRows) => {
      if (err2) return res.status(500).json({ error: err2.message });
      res.json({ order: orderRows[0], items: itemRows });
    });
  });
});

// GET restaurant menu
router.get("/menu/all", (req, res) => {
  db.query("SELECT * FROM restaurant_menu WHERE availability_status = 'available'", (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(result);
  });
});

// POST create food order with items
router.post("/", (req, res) => {
  const { booking_id, items } = req.body;
  // items = [{ item_id, quantity }, ...]

  if (!items || items.length === 0) {
    return res.status(400).json({ error: "No items in order" });
  }

  // Get prices for all items
  const itemIds = items.map(i => i.item_id);
  db.query(
    `SELECT item_id, price FROM restaurant_menu WHERE item_id IN (${itemIds.map(() => "?").join(",")})`,
    itemIds,
    (err, menuRows) => {
      if (err) return res.status(500).json({ error: err.message });

      const priceMap = {};
      menuRows.forEach(row => { priceMap[row.item_id] = row.price; });

      let total = 0;
      const orderItems = items.map(i => {
        const subtotal = priceMap[i.item_id] * i.quantity;
        total += subtotal;
        return [i.item_id, i.quantity, priceMap[i.item_id], subtotal];
      });

      // Insert food order
      db.query(
        "INSERT INTO food_orders (booking_id, total_amount) VALUES (?, ?)",
        [booking_id, total],
        (err2, orderResult) => {
          if (err2) return res.status(500).json({ error: err2.message });
          const orderId = orderResult.insertId;

          // Insert all items
          const itemValues = orderItems.map(i => [orderId, ...i]);
          db.query(
            "INSERT INTO food_order_items (food_order_id, item_id, quantity, item_price, subtotal) VALUES ?",
            [itemValues],
            (err3) => {
              if (err3) return res.status(500).json({ error: err3.message });
              res.json({ message: "Food order placed", id: orderId, total_amount: total });
            }
          );
        }
      );
    }
  );
});

// PATCH update order status
router.patch("/:id/status", (req, res) => {
  const { order_status } = req.body;
  const validStatuses = ["placed", "preparing", "delivered", "cancelled"];
  if (!validStatuses.includes(order_status)) {
    return res.status(400).json({ error: "Invalid order status" });
  }
  db.query(
    "UPDATE food_orders SET order_status = ? WHERE food_order_id = ?",
    [order_status, req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "Order status updated" });
    }
  );
});

module.exports = router;
