<?php
require_once __DIR__ . '/backend/db.php';
$db = getDB();
try {
    $stmt = $db->query("SELECT id, username, role, status FROM users");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($users, JSON_PRETTY_PRINT);
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
