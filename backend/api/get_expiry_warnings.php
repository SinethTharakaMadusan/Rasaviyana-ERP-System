<?php
error_reporting(0);
ini_set('display_errors', 0);

header('Content-Type: application/json');
session_start();

try {
    $db_file = __DIR__ . '/../db.php';
    if (!file_exists($db_file)) {
        echo json_encode([]);
        exit;
    }
    
    require_once $db_file;
    $db = getDB();

  
    $query = "SELECT batch_id AS batch_number, 
                     product_name, 
                     exp_date AS expiry_date,
                     DATEDIFF(exp_date, CURDATE()) AS days_left
              FROM batches
              WHERE exp_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)
              ORDER BY exp_date ASC 
              LIMIT 5";
    
    $stmt = $db->prepare($query);
    $stmt->execute();
    $batches = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (!is_array($batches)) {
        $batches = [];
    }

    echo json_encode($batches);

} catch (Exception $e) {
    echo json_encode([]);
}
?>