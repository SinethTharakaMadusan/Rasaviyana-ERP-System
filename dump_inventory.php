<?php
require __DIR__.'/backend/db.php';
$db = getDB();

echo "--- INVENTORY ---\n";
$stmt = $db->query("SELECT product_name, stock_qty FROM inventory LIMIT 10");
foreach($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
    echo $row['product_name'] . " | Qty: " . $row['stock_qty'] . "\n";
}

echo "\n--- PRODUCTS ---\n";
$stmt = $db->query("SELECT p.product_name, pv.variant_name, pv.weight_size FROM products p LEFT JOIN product_variants pv ON p.products_id = pv.product_id LIMIT 10");
foreach($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
    echo $row['product_name'] . " | Variant: " . $row['variant_name'] . " | Weight: " . $row['weight_size'] . "\n";
}
?>
