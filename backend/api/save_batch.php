<?php
session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/',
    'domain' => '',
    'secure' => false,
    'httponly' => true,
    'samesite' => 'Lax'
]);

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require_once __DIR__ . '/../db.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Unauthorized']);
    exit();
}

$data = json_decode(file_get_contents('php://input'), true);

$batchId     = $data['batch_id'] ?? '';
$productName = $data['product_name'] ?? '';
$mfdDate     = $data['mfd_date'] ?? '';
$expDate     = $data['exp_date'] ?? '';

if (!$batchId || !$productName || !$mfdDate || !$expDate) {
    echo json_encode(['success' => false, 'message' => 'All fields are required.']);
    exit();
}

try {
    $db = getDB();

    $stmt = $db->prepare("INSERT INTO batches (batch_id, product_name, mfd_date, exp_date, created_at) VALUES (?, ?, ?, ?, NOW())");
    $stmt->execute([$batchId, $productName, $mfdDate, $expDate]);

    echo json_encode(['success' => true, 'message' => 'Batch saved successfully!']);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
exit();
?>