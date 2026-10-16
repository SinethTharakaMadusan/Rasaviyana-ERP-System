<?php
require_once __DIR__ . '/backend/db.php';
try {
    $db = getDB();
    $db->exec("ALTER TABLE bills ADD COLUMN extra_paid FLOAT DEFAULT 0 AFTER net_amount");
    echo "Column 'extra_paid' added successfully to 'bills' table.\n";
} catch (Exception $e) {
    if (strpos($e->getMessage(), 'Duplicate column name') !== false) {
        echo "Column 'extra_paid' already exists.\n";
    } else {
        echo "Error: " . $e->getMessage() . "\n";
    }
}
?>
