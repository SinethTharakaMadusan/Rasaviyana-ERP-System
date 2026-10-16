<?php
$_SERVER['REQUEST_METHOD'] = 'POST';
$_SERVER['REQUEST_URI'] = '/api/products';
$_POST = [
    'product_name' => 'Turmeric Powder',
    'category' => 'Spices',
    'variants' => [
        ['weight_size' => '100g', 'unit_price' => 200, 'cost_price' => 100, 'reorder_level' => 10],
        ['weight_size' => '250g', 'unit_price' => 450, 'cost_price' => 250, 'reorder_level' => 5],
    ]
];

// Mock file_get_contents for the input stream
function mock_file_get_contents($filename) {
    if ($filename === 'php://input') {
        global $_POST;
        return json_encode($_POST);
    }
    return \file_get_contents($filename);
}

// Intercept getRequestBody using runkit or similar is hard in a simple script.
// But we wrote getRequestBody in db.php which calls file_get_contents
// We can override $_SERVER and fake the stream if we use a wrapper,
// or just modify getRequestBody for testing...
// Let's just redefine the POST payload directly in the test file before inclusion.
// Actually, `products.php` gets it by `getRequestBody()`.
// I will just mock `file_get_contents` by using a stream wrapper or simply bypassing it.

require __DIR__ . '/db.php';
// Redefine getRequestBody to return our mock POST (override it) is not possible since it's already defined...
// For testing, I'll just change db.php temporarily? No, I'll just use curl!
