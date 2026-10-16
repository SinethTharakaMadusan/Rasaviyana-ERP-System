<?php
require_once __DIR__ . '/../db.php';
header('Content-Type: application/json');

try {
    $db = getDB();
    $stmt = $db->query('SELECT * FROM inventory');
    $data = $stmt->fetchAll();
    echo json_encode([
        'status' => 'success',
        'count' => count($data),
        'data' => $data
    ]);
} catch (Exception $e) {
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage()
    ]);
}
