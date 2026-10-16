<?php
require_once __DIR__ . '/../db.php';
setCorsHeaders();

$db = getDB();

try {
    $query = "SELECT b.*, s.shop_name 
              FROM bills b 
              LEFT JOIN shops s ON b.shop_id = s.shop_id 
              ORDER BY b.bill_date DESC, b.id DESC";

    $stmt = $db->query($query);
    $bills = $stmt->fetchAll(PDO::FETCH_ASSOC);

    jsonResponse($bills);
} catch (Exception $e) {
    try {
        $stmt = $db->query("SELECT * FROM bills ORDER BY bill_date DESC, id DESC");
        $bills = $stmt->fetchAll(PDO::FETCH_ASSOC);
        jsonResponse($bills);
    } catch (Exception $ex) {
        errorResponse('Failed to fetch bills: ' . $ex->getMessage());
    }
}
?>
