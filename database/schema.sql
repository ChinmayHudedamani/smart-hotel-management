CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'manager', 'receptionist', 'staff') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE customers (
    customer_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(100) UNIQUE,
    address TEXT,
    id_proof_type VARCHAR(50),
    id_proof_number VARCHAR(100) UNIQUE,
    nationality VARCHAR(50),
    loyalty_points INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE room_types (
    room_type_id INT AUTO_INCREMENT PRIMARY KEY,
    type_name VARCHAR(50) NOT NULL UNIQUE,
    base_price DECIMAL(10,2) NOT NULL,
    max_occupancy INT NOT NULL,
    description TEXT
);

CREATE TABLE rooms (
    room_id INT AUTO_INCREMENT PRIMARY KEY,
    room_number VARCHAR(10) NOT NULL UNIQUE,
    room_type_id INT NOT NULL,
    floor_number INT NOT NULL,
    status ENUM('available', 'booked', 'occupied', 'cleaning', 'maintenance') DEFAULT 'available',
    has_ac BOOLEAN DEFAULT TRUE,
    has_wifi BOOLEAN DEFAULT TRUE,
    has_tv BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (room_type_id) REFERENCES room_types(room_type_id)
);

CREATE TABLE bookings (
    booking_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    room_id INT NOT NULL,
    booked_by_user_id INT,
    booking_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    adults INT DEFAULT 1,
    children INT DEFAULT 0,
    booking_status ENUM('pending', 'confirmed', 'cancelled', 'checked_in', 'checked_out') DEFAULT 'pending',
    total_room_charge DECIMAL(10,2) DEFAULT 0,
    special_request TEXT,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id),
    FOREIGN KEY (room_id) REFERENCES rooms(room_id),
    FOREIGN KEY (booked_by_user_id) REFERENCES users(user_id)
);

CREATE TABLE payments (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    amount DECIMAL(10,2) NOT NULL,
    payment_mode ENUM('cash', 'card', 'upi', 'net_banking') NOT NULL,
    payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
    transaction_ref VARCHAR(100),
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id)
);

CREATE TABLE services (
    service_id INT AUTO_INCREMENT PRIMARY KEY,
    service_name VARCHAR(100) NOT NULL UNIQUE,
    service_charge DECIMAL(10,2) NOT NULL,
    description TEXT
);

CREATE TABLE service_requests (
    request_id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    service_id INT NOT NULL,
    request_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    quantity INT DEFAULT 1,
    total_charge DECIMAL(10,2) DEFAULT 0,
    request_status ENUM('requested', 'in_progress', 'completed', 'cancelled') DEFAULT 'requested',
    handled_by_staff_id INT NULL,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id),
    FOREIGN KEY (service_id) REFERENCES services(service_id),
    FOREIGN KEY (handled_by_staff_id) REFERENCES users(user_id)
);

CREATE TABLE restaurant_menu (
    item_id INT AUTO_INCREMENT PRIMARY KEY,
    item_name VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(50),
    price DECIMAL(10,2) NOT NULL,
    availability_status ENUM('available', 'unavailable') DEFAULT 'available'
);

CREATE TABLE food_orders (
    food_order_id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    order_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    order_status ENUM('placed', 'preparing', 'delivered', 'cancelled') DEFAULT 'placed',
    total_amount DECIMAL(10,2) DEFAULT 0,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id)
);

CREATE TABLE food_order_items (
    order_item_id INT AUTO_INCREMENT PRIMARY KEY,
    food_order_id INT NOT NULL,
    item_id INT NOT NULL,
    quantity INT NOT NULL,
    item_price DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) DEFAULT 0,
    FOREIGN KEY (food_order_id) REFERENCES food_orders(food_order_id),
    FOREIGN KEY (item_id) REFERENCES restaurant_menu(item_id)
);

CREATE TABLE feedback (
    feedback_id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    customer_id INT NOT NULL,
    rating INT NOT NULL,
    comments TEXT,
    feedback_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(booking_id),
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
);

CREATE TABLE housekeeping (
    housekeeping_id INT AUTO_INCREMENT PRIMARY KEY,
    room_id INT NOT NULL,
    assigned_to INT NULL,
    cleaning_date DATE NOT NULL,
    cleaning_status ENUM('pending', 'in_progress', 'completed') DEFAULT 'pending',
    notes TEXT,
    FOREIGN KEY (room_id) REFERENCES rooms(room_id),
    FOREIGN KEY (assigned_to) REFERENCES users(user_id)
);