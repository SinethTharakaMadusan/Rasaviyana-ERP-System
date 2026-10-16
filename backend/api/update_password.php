<?php
session_start();
require_once __DIR__ . '/../db.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized access']);
    exit();
}

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['current_password']) || !isset($data['new_password'])) {
    echo json_encode(['success' => false, 'message' => 'All fields are required']);
    exit();
}

$currentPassword = $data['current_password'];
$newPassword = $data['new_password'];

try {
    $db = getDB();

    $stmt = $db->prepare("SELECT password FROM users WHERE id = ?");
    $stmt->execute([$_SESSION['user_id']]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        echo json_encode(['success' => false, 'message' => 'User not found']);
        exit();
    }

    if (!password_verify($currentPassword, $user['password'])) {
        echo json_encode(['success' => false, 'message' => 'Incorrect current password']);
        exit();
    }

    $newPasswordHash = password_hash($newPassword, PASSWORD_DEFAULT);

    $updateStmt = $db->prepare("UPDATE users SET password = ? WHERE id = ?");
    $updateStmt->execute([$newPasswordHash, $_SESSION['user_id']]);

    echo json_encode(['success' => true]);

} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>