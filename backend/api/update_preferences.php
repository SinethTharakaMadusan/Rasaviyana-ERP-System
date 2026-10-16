<?php
session_start();
require_once __DIR__ . '/../db.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit();
}

$data = json_decode(file_get_contents('php://input'), true);

if (isset($data['preferences'])) {
    try {
        $db = getDB();
        $preferencesJson = json_encode($data['preferences']);

        $stmt = $db->prepare("UPDATE users SET preferences = ? WHERE id = ?");
        $stmt->execute([$preferencesJson, $_SESSION['user_id']]);

        echo json_encode(['success' => true]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid data']);
}
?>