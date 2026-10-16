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

$productCode = $_GET['prefix'] ?? '';
$dateStr = $_GET['date'] ?? '';

if (!$productCode || !$dateStr) {
    echo json_encode(['success' => false, 'message' => 'Product prefix and date are required']);
    exit();
}

try {
    $db = getDB();

    $pattern = $productCode . '%' . $dateStr;
    
    $stmt = $db->prepare("SELECT batch_id FROM batches WHERE batch_id LIKE ? ORDER BY id DESC LIMIT 1");
    $stmt->execute([$pattern]);
    $lastBatch = $stmt->fetch(PDO::FETCH_ASSOC);

    $nextSeq = 1;
    if ($lastBatch && isset($lastBatch['batch_id'])) {
        $lastBatchNo = $lastBatch['batch_id'];
        preg_match('/^[A-Z](\d{2})/', $lastBatchNo, $matches);
        if (isset($matches[1])) {
            $nextSeq = intval($matches[1]) + 1;
        }
    }

    $formattedSeq = str_pad($nextSeq, 2, '0', STR_PAD_LEFT);
    $generatedBatchID = $productCode . $formattedSeq . $dateStr;

    echo json_encode(['success' => true, 'batch_id' => $generatedBatchID]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Database error']);
}
exit();
?>