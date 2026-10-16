<?php
// කිසිදු අනවශ්‍ය අවුට්පුට් එකක් හෝ වෝර්නිං එකක් යාම වැළැක්වීම
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

$query = "SELECT s.name AS shop_name, 
                     b.bill_date AS sale_date, 
                     b.total_amount 
              FROM bills b 
              JOIN shops s ON b.shop_id = s.id 
              ORDER BY b.bill_date DESC 
              LIMIT 5";
    
    $stmt = $db->prepare($query);
    $stmt->execute();
    $sales = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // ඩේටා නැත්නම් හිස් ඇරේ එකක් යැවීම
    if (!is_array($sales)) {
        $sales = [];
    }

    echo json_encode($sales);

} catch (Exception $e) {
    // කිසියම් එරර් එකක් වුණොත් ජාවාස්ක්‍රිප්ට් එක කැඩී යාම වැළැක්වීමට හිස් ඇරේ එකක් යැවීම
    echo json_encode([]);
}
?>