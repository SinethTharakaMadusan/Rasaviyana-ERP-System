<?php
require_once __DIR__ . '/../db.php';

try {
    $db = getDB();
    
    // Check if table is empty
    $count = $db->query("SELECT COUNT(*) FROM inventory")->fetchColumn();
    
    if ($count > 0) {
        die("Inventory table already has data. Seed skipped.");
    }

    $sql = file_get_contents(__DIR__ . '/seed_inventory.sql');
    $db->exec($sql);
    echo "Inventory table seeded successfully!";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
