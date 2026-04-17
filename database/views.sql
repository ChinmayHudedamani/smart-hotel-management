-- ============================================================
-- Smart Hotel Management System — SQL Views & JOIN Queries
-- Run this AFTER schema.sql and sampledata.sql
-- ============================================================

USE smart_hotel;

-- ──────────────────────────────────────────────────────────
-- VIEW 1: Full Booking Details
-- Combines bookings + customers + rooms + room_types
-- ──────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW vw_booking_details AS
SELECT
    b.booking_id,
    c.full_name        AS customer_name,
    c.phone            AS customer_phone,
    c.email            AS customer_email,
    r.room_number,
    rt.type_name       AS room_type,
    rt.base_price,
    b.check_in_date,
    b.check_out_date,
    DATEDIFF(b.check_out_date, b.check_in_date) AS nights,
    b.adults,
    b.children,
    b.booking_status,
    b.total_room_charge,
    b.special_request,
    b.booking_date
FROM bookings b
JOIN customers c  ON b.customer_id  = c.customer_id
JOIN rooms r      ON b.room_id      = r.room_id
JOIN room_types rt ON r.room_type_id = rt.room_type_id;

-- ──────────────────────────────────────────────────────────
-- VIEW 2: Room Availability Overview
-- ──────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW vw_room_overview AS
SELECT
    r.room_id,
    r.room_number,
    r.floor_number,
    r.status,
    rt.type_name,
    rt.base_price,
    rt.max_occupancy,
    r.has_ac,
    r.has_wifi,
    r.has_tv
FROM rooms r
JOIN room_types rt ON r.room_type_id = rt.room_type_id;

-- ──────────────────────────────────────────────────────────
-- VIEW 3: Payment Summary per Booking
-- ──────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW vw_payment_summary AS
SELECT
    p.payment_id,
    b.booking_id,
    c.full_name        AS customer_name,
    r.room_number,
    p.amount,
    p.payment_mode,
    p.payment_status,
    p.payment_date,
    p.transaction_ref
FROM payments p
JOIN bookings b  ON p.booking_id   = b.booking_id
JOIN customers c ON b.customer_id  = c.customer_id
JOIN rooms r     ON b.room_id      = r.room_id;

-- ──────────────────────────────────────────────────────────
-- VIEW 4: Housekeeping Status Board
-- ──────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW vw_housekeeping_board AS
SELECT
    h.housekeeping_id,
    r.room_number,
    r.floor_number,
    r.status         AS room_status,
    h.cleaning_date,
    h.cleaning_status,
    u.full_name      AS assigned_staff,
    h.notes
FROM housekeeping h
JOIN rooms r       ON h.room_id     = r.room_id
LEFT JOIN users u  ON h.assigned_to = u.user_id;

-- ──────────────────────────────────────────────────────────
-- VIEW 5: Customer Loyalty & Booking History
-- ──────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW vw_customer_summary AS
SELECT
    c.customer_id,
    c.full_name,
    c.phone,
    c.email,
    c.nationality,
    c.loyalty_points,
    COUNT(b.booking_id)        AS total_bookings,
    COALESCE(SUM(b.total_room_charge), 0) AS total_spent
FROM customers c
LEFT JOIN bookings b ON c.customer_id = b.customer_id
GROUP BY c.customer_id;

-- ──────────────────────────────────────────────────────────
-- USEFUL JOIN QUERIES (for demo / viva)
-- ──────────────────────────────────────────────────────────

-- Q1: Currently checked-in guests with room info
SELECT c.full_name, r.room_number, rt.type_name, b.check_in_date, b.check_out_date
FROM bookings b
JOIN customers c  ON b.customer_id = c.customer_id
JOIN rooms r      ON b.room_id = r.room_id
JOIN room_types rt ON r.room_type_id = rt.room_type_id
WHERE b.booking_status = 'checked_in';

-- Q2: Total revenue collected by payment mode
SELECT payment_mode, COUNT(*) AS transactions, SUM(amount) AS total_revenue
FROM payments
WHERE payment_status = 'paid'
GROUP BY payment_mode;

-- Q3: Top spending customers
SELECT c.full_name, COUNT(b.booking_id) AS bookings, SUM(b.total_room_charge) AS total_spent
FROM customers c
JOIN bookings b ON c.customer_id = b.customer_id
GROUP BY c.customer_id
ORDER BY total_spent DESC;

-- Q4: Service requests with status and staff assigned
SELECT s.service_name, sr.quantity, sr.total_charge, sr.request_status,
       c.full_name AS customer_name, r.room_number, u.full_name AS staff_name
FROM service_requests sr
JOIN services s   ON sr.service_id = s.service_id
JOIN bookings b   ON sr.booking_id = b.booking_id
JOIN customers c  ON b.customer_id = c.customer_id
JOIN rooms r      ON b.room_id = r.room_id
LEFT JOIN users u ON sr.handled_by_staff_id = u.user_id;

-- Q5: Average rating per room type
SELECT rt.type_name, ROUND(AVG(f.rating), 2) AS avg_rating, COUNT(f.feedback_id) AS total_reviews
FROM feedback f
JOIN bookings b   ON f.booking_id = b.booking_id
JOIN rooms r      ON b.room_id = r.room_id
JOIN room_types rt ON r.room_type_id = rt.room_type_id
GROUP BY rt.type_name;

-- Q6: Food orders with items and customer name
SELECT fo.food_order_id, c.full_name AS customer_name, r.room_number,
       rm.item_name, foi.quantity, foi.subtotal, fo.order_status
FROM food_orders fo
JOIN bookings b       ON fo.booking_id = b.booking_id
JOIN customers c      ON b.customer_id = c.customer_id
JOIN rooms r          ON b.room_id = r.room_id
JOIN food_order_items foi ON fo.food_order_id = foi.food_order_id
JOIN restaurant_menu rm   ON foi.item_id = rm.item_id;
