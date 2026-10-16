<?php
require_once 'backend/db.php';
$db = getDB();

echo "--- products table ---\n";
$stmt = $db->query("DESCRIBE products");
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));

echo "\n--- product_variants table ---\n";
$stmt = $db->query("DESCRIBE product_variants");
print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
?>
