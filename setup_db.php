<?php
require_once __DIR__ . '/backend/db.php';

$db = getDB();

// 1. Ensure tables exist (Basic check, though they should exist already)
$tables = [
    "CREATE TABLE IF NOT EXISTS shops (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        seller VARCHAR(255),
        phone VARCHAR(20),
        whatsapp VARCHAR(20),
        city VARCHAR(100),
        address TEXT,
        outstanding DECIMAL(15,2) DEFAULT 0,
        status VARCHAR(20) DEFAULT 'Active',
        last_activity DATETIME
    )",
    "CREATE TABLE IF NOT EXISTS products (
        products_id INT AUTO_INCREMENT PRIMARY KEY,
        product_name VARCHAR(100) NOT NULL,
        category VARCHAR(50),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )",
    "CREATE TABLE IF NOT EXISTS inventory (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_name VARCHAR(100) NOT NULL,
        code VARCHAR(50),
        category VARCHAR(50),
        stock_qty INT DEFAULT 0,
        unit VARCHAR(20),
        status VARCHAR(20),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )",
    "CREATE TABLE IF NOT EXISTS bills (
        id INT AUTO_INCREMENT PRIMARY KEY,
        bill_number VARCHAR(50) UNIQUE,
        shop_id INT,
        bill_date DATE,
        subtotal DECIMAL(15,2),
        discount_percent DECIMAL(5,2) DEFAULT 0,
        discount_amount DECIMAL(15,2) DEFAULT 0,
        total_amount DECIMAL(15,2),
        return_total DECIMAL(15,2) DEFAULT 0,
        net_amount DECIMAL(15,2),
        payment_status VARCHAR(20),
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )",
    "CREATE TABLE IF NOT EXISTS bill_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        bill_id INT,
        product_variant_id INT,
        product_name VARCHAR(255),
        variant_name VARCHAR(100),
        quantity INT,
        unit_price DECIMAL(15,2),
        total_price DECIMAL(15,2),
        item_type VARCHAR(20) DEFAULT 'sale',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )",
    "CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        full_name VARCHAR(100),
        email VARCHAR(100),
        phone VARCHAR(20),
        role VARCHAR(50) DEFAULT 'Staff',
        status VARCHAR(50) DEFAULT 'Active',
        bio TEXT,
        location VARCHAR(100),
        avatar_url VARCHAR(255),
        preferences TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;"
];

foreach ($tables as $sql) {
    try {
        $db->exec($sql);
    } catch (PDOException $e) {
        echo "Error creating table: " . $e->getMessage() . "<br>";
    }
}

// 2. Clear old data and re-seed
try {
    // Disable foreign key checks if any (MySQL doesn't usually have them unless defined, but good practice)
    $db->exec("SET FOREIGN_KEY_CHECKS = 0");
    
    $db->exec("TRUNCATE TABLE shops");
    $db->exec("TRUNCATE TABLE products");
    $db->exec("TRUNCATE TABLE inventory");
    $db->exec("TRUNCATE TABLE bills");
    $db->exec("TRUNCATE TABLE bill_items");
    $db->exec("TRUNCATE TABLE users");
    
    // Seed Shops
    $db->exec("INSERT INTO shops (id, name, seller, phone, whatsapp, city, address, outstanding, last_activity) VALUES
    (1, 'Kandy Spice Mart', 'Nimal Perera', '0771234567', '0771234567', 'Kandy', '123 Main St, Kandy', 12500.00, '2026-03-01 10:00:00'),
    (2, 'Colombo Retailers', 'Sunil Silva', '0719876543', '0719876543', 'Pettah', '45 Supply Rd, Colombo', 45200.00, '2026-03-02 11:30:00'),
    (3, 'Galle Foods', 'Aruna Jay', '0721112223', '0721112223', 'Galle', '88 Coast Rd, Galle', 0, '2026-03-05 09:15:00')");

    // Seed Products
    $db->exec("INSERT INTO products (products_id, product_name, category) VALUES
    (1, 'Cinnamon Powder', 'Spices'),
    (2, 'Cardamom Whole', 'Spices'),
    (3, 'Black Pepper', 'Spices')");

    // Seed Inventory
    $db->exec("INSERT INTO inventory (product_name, code, category, stock_qty, unit, status) VALUES
    ('Cinnamon Powder 50g', 'CP-50', 'Spices', 150, 'Packets', 'In Stock'),
    ('Cardamom Whole 100g', 'CW-100', 'Spices', 5, 'Packets', 'Low Stock'),
    ('Black Pepper 200g', 'BP-200', 'Spices', 0, 'Packets', 'Out of Stock')");

    // Seed Bills (Revenue for March 2026)
    $db->exec("INSERT INTO bills (id, bill_number, shop_id, bill_date, subtotal, total_amount, net_amount, payment_status, created_at) VALUES
    (1, 'BILL-001', 1, '2026-03-01', 5000.00, 5000.00, 0, 'Paid', '2026-03-01 10:00:00'),
    (2, 'BILL-002', 2, '2026-03-02', 20000.00, 20000.00, 20000.00, 'Pending', '2026-03-02 11:30:00')");

    // Seed Bill Items
    $db->exec("INSERT INTO bill_items (bill_id, product_variant_id, product_name, variant_name, quantity, unit_price, total_price) VALUES
    (1, 1, 'Cinnamon Powder', '50g', 10, 500, 5000),
    (2, 2, 'Cardamom Whole', '100g', 20, 1000, 20000)");

    // Seed Admin User
    $adminPassword = password_hash('admin123', PASSWORD_DEFAULT);
    $db->prepare("INSERT INTO users (username, password, full_name, role, status) VALUES (?, ?, ?, ?, ?)")
       ->execute(['admin', $adminPassword, 'Admin User', 'Admin', 'Active']);

    $db->exec("SET FOREIGN_KEY_CHECKS = 1");
    
    echo "Database setup and seeding completed successfully!<br>";
    echo "Shops seeded: 3<br>";
    echo "Products seeded: 3<br>";
    echo "Bills seeded: 2 (Sum: 25,000)<br>";
    
} catch (PDOException $e) {
    echo "Fatal Error: " . $e->getMessage();
}
?>
