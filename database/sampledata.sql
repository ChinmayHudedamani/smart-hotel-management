INSERT INTO users (full_name, email, password_hash, role) VALUES
('Admin User', 'admin@hotel.com', 'admin123', 'admin'),
('Manager One', 'manager@hotel.com', 'manager123', 'manager'),
('Receptionist One', 'reception@hotel.com', 'recept123', 'receptionist'),
('Staff One', 'staff1@hotel.com', 'staff123', 'staff');

INSERT INTO customers (full_name, phone, email, address, id_proof_type, id_proof_number, nationality, loyalty_points) VALUES
('Arvind Patel', '9876543210', 'rahul@gmail.com', 'Mumbai', 'Aadhar', 'AAD12345', 'Indian', 120),
('Chinmay', '9876543211', 'priya@gmail.com', 'Delhi', 'Passport', 'PPT67890', 'Indian', 80),
('Krutick', '9876543212', 'amit@gmail.com', 'Bangalore', 'PAN', 'PAN11223', 'Indian', 40);

INSERT INTO room_types (type_name, base_price, max_occupancy, description) VALUES
('Single', 2000.00, 1, 'Single room'),
('Double', 3500.00, 2, 'Double room'),
('Suite', 6000.00, 4, 'Luxury suite');

INSERT INTO rooms (room_number, room_type_id, floor_number, status, has_ac, has_wifi, has_tv) VALUES
('101', 1, 1, 'available', TRUE, TRUE, TRUE),
('102', 2, 1, 'available', TRUE, TRUE, TRUE),
('201', 3, 2, 'occupied', TRUE, TRUE, TRUE),
('202', 2, 2, 'cleaning', TRUE, TRUE, TRUE),
('301', 1, 3, 'maintenance', TRUE, TRUE, FALSE);

INSERT INTO bookings (customer_id, room_id, booked_by_user_id, check_in_date, check_out_date, adults, children, booking_status, total_room_charge, special_request) VALUES
(1, 2, 3, '2026-04-08', '2026-04-10', 2, 0, 'confirmed', 7000.00, 'Near elevator'),
(2, 3, 3, '2026-04-06', '2026-04-09', 2, 1, 'checked_in', 18000.00, 'Extra bed'),
(3, 1, 2, '2026-04-10', '2026-04-11', 1, 0, 'pending', 2000.00, 'No smoking room');

INSERT INTO payments (booking_id, amount, payment_mode, payment_status, transaction_ref) VALUES
(1, 7000.00, 'upi', 'paid', 'UPI123456'),
(2, 10000.00, 'card', 'paid', 'CARD987654'),
(3, 0.00, 'cash', 'pending', 'CASH000');

INSERT INTO services (service_name, service_charge, description) VALUES
('Laundry', 300.00, 'Clothes washing service'),
('Room Service', 200.00, 'Food and room delivery'),
('Spa', 1500.00, 'Spa and wellness');

INSERT INTO service_requests (booking_id, service_id, quantity, total_charge, request_status, handled_by_staff_id) VALUES
(2, 1, 2, 600.00, 'completed', 4),
(2, 2, 1, 200.00, 'requested', 4),
(1, 3, 1, 1500.00, 'completed', 4);

INSERT INTO restaurant_menu (item_name, category, price, availability_status) VALUES
('Veg Biryani', 'Main Course', 250.00, 'available'),
('Paneer Butter Masala', 'Main Course', 220.00, 'available'),
('Coffee', 'Beverage', 80.00, 'available'),
('Ice Cream', 'Dessert', 120.00, 'available');

INSERT INTO food_orders (booking_id, order_status, total_amount) VALUES
(2, 'delivered', 550.00),
(1, 'placed', 80.00);

INSERT INTO food_order_items (food_order_id, item_id, quantity, item_price, subtotal) VALUES
(1, 1, 1, 250.00, 250.00),
(1, 3, 2, 80.00, 160.00),
(1, 4, 1, 120.00, 120.00),
(2, 3, 1, 80.00, 80.00);

INSERT INTO feedback (booking_id, customer_id, rating, comments) VALUES
(2, 2, 5, 'Excellent stay and service'),
(1, 1, 4, 'Very good room and food');

INSERT INTO housekeeping (room_id, assigned_to, cleaning_date, cleaning_status, notes) VALUES
(4, 4, '2026-04-07', 'in_progress', 'Cleaning after checkout'),
(5, 4, '2026-04-07', 'pending', 'Maintenance room cleanup');
