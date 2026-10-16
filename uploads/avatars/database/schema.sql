-- ============================================================
-- Rasaviyana System Database Schema (MySQL)
-- Import this file in phpMyAdmin to set up the database
-- ============================================================

CREATE DATABASE IF NOT EXISTS rasaviyana_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE rasaviyana_db;

-- -------------------------------------------------------
-- Users Table
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    username     VARCHAR(100) NOT NULL UNIQUE,
    full_name    VARCHAR(150),
    email        VARCHAR(150),
    phone        VARCHAR(30),
    password     VARCHAR(255) NOT NULL,
    role         VARCHAR(50)  DEFAULT 'Staff',
    status       VARCHAR(30)  DEFAULT 'Active',
    bio          TEXT,
    location     VARCHAR(150),
    avatar_url   VARCHAR(500),
    preferences  JSON,
    created_at   DATETIME     DEFAULT CURRENT_TIMESTAMP
);

-- Default admin account (password: admin123)
INSERT INTO users (username, full_name, email, role, status, password) VALUES
('admin', 'Administrator', 'admin@rasaviyana.com', 'Admin', 'Active',
 '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi')
ON DUPLICATE KEY UPDATE id=id;

-- -------------------------------------------------------
-- Inventory Table (Main product-stock table)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS inventory (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    product_name VARCHAR(200) NOT NULL,
    code         VARCHAR(100),
    category     VARCHAR(100),
    stock_qty    INT          DEFAULT 0,
    unit         VARCHAR(50)  DEFAULT 'Packets',
    status       VARCHAR(50)  DEFAULT 'In Stock',
    created_at   DATETIME     DEFAULT CURRENT_TIMESTAMP
);

-- -------------------------------------------------------
-- Shops Table
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS shops (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    name                VARCHAR(200) NOT NULL,
    owner               VARCHAR(150),
    phone               VARCHAR(30),
    address             TEXT,
    outstanding_balance DECIMAL(12,2) DEFAULT 0,
    created_at          DATETIME      DEFAULT CURRENT_TIMESTAMP
);

-- -------------------------------------------------------
-- Bills Table
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS bills (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    shop_id        INT,
    items          JSON,
    total          DECIMAL(12,2) DEFAULT 0,
    payment_method VARCHAR(50)   DEFAULT 'Cash',
    created_at     DATETIME      DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shop_id) REFERENCES shops(id) ON DELETE SET NULL
);

-- -------------------------------------------------------
-- Expenses Table
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS expenses (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    date           DATE         NOT NULL,
    description    VARCHAR(300),
    category       VARCHAR(100),
    payment_method VARCHAR(50)  DEFAULT 'cash',
    amount         DECIMAL(12,2) DEFAULT 0,
    materials      TEXT,
    created_at     DATETIME     DEFAULT CURRENT_TIMESTAMP
);
