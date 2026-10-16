<?php
/**
 * Rasaviyana PHP Backend Router
 * All requests to /backend/api/* are routed here via .htaccess
 */
require_once __DIR__ . '/db.php';
setCorsHeaders();

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Route: /api/login
if (preg_match('#/api/login#', $uri)) {
    require __DIR__ . '/api/login.php';
    exit;
}

// Route: /api/users (and sub-paths)
if (preg_match('#/api/users#', $uri)) {
    require __DIR__ . '/api/users.php';
    exit;
}

// Route: /api/products
if (preg_match('#/api/products#', $uri)) {
    require __DIR__ . '/api/products.php';
    exit;
}

// Route: /api/inventory
if (preg_match('#/api/inventory#', $uri)) {
    require __DIR__ . '/api/inventory.php';
    exit;
}

// Route: /api/shops
if (preg_match('#/api/shops#', $uri)) {
    require __DIR__ . '/api/shops.php';
    exit;
}

// Route: /api/bills (including by-shop)
if (preg_match('#/api/bills#', $uri)) {
    require __DIR__ . '/api/bills.php';
    exit;
}

// Route: /api/expenses
if (preg_match('#/api/expenses#', $uri)) {
    require __DIR__ . '/api/expenses.php';
    exit;
}

// Route: /api/alerts
if (preg_match('#/api/alerts#', $uri)) {
    require __DIR__ . '/api/alerts.php';
    exit;
}

// Route: /api/reports/*
if (preg_match('#/api/reports#', $uri)) {
    require __DIR__ . '/api/reports.php';
    exit;
}

// 404 fallback
http_response_code(404);
header('Content-Type: application/json');
echo json_encode(['error' => 'API endpoint not found', 'uri' => $uri]);
