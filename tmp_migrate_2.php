<?php
require_once __DIR__ . '/backend/db.php';
try {
    $db = getDB();
    $db->exec("ALTER TABLE bills ADD COLUMN shop_total_outstanding_after FLOAT DEFAULT 0 AFTER extra_paid");
    echo "Column 'shop_total_outstanding_after' added successfully to 'bills' table.\n";
} catch (Exception $e) {
    if (strpos($e->getMessage(), 'Duplicate column name') !== false) {
        echo "Column 'shop_total_outstanding_after' already exists.\n";
    } else {
        echo "Error: " . $e->getMessage() . "\n";
    }
}
?>
