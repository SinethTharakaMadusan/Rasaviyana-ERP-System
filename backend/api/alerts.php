<?php
require_once __DIR__ . '/../db.php';
setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') errorResponse('Method not allowed', 405);

$db = getDB();

$alerts = [];

// 1. Stock alerts from inventory
// Business rules: <= 20 is Out/Critical, <= 40 is Low/Warning
$stockStmt = $db->query("
    SELECT product_name, stock_qty, category,
           CASE WHEN stock_qty <= 20 THEN 'critical'
                WHEN stock_qty <= 40 THEN 'warning'
                ELSE 'none' END AS alert_type
    FROM inventory 
    WHERE stock_qty <= 40
    ORDER BY stock_qty ASC
");
$stockItems = $stockStmt->fetchAll();

foreach ($stockItems as $item) {
    if ($item['alert_type'] === 'none') continue;
    
    $isOut = $item['alert_type'] === 'critical';
    
    $alerts[] = [
        'id' => ($isOut ? 'out-' : 'low-') . slugify($item['product_name']),
        'type' => $item['alert_type'],
        'category' => 'inventory',
        'title' => ($isOut ? 'Out of Stock: ' : 'Low Stock: ') . $item['product_name'],
        'message' => $isOut ? "This item is critically low or out of stock ({$item['stock_qty']} left)." : "Only {$item['stock_qty']} packets remaining.",
        'details' => "Category: " . ($item['category'] ?? 'General') . ". Consider restocking immediately.",
        'action' => $isOut ? 'Restock Now' : 'Add Stock',
        'icon' => $isOut ? 'alert-circle' : 'alert-triangle',
        'target_url' => 'index.php#inventory' // Will be updated to inventory.php if it exists
    ];
}

// 2. High Outstanding Debt Alerts
// Rules: > 50,000 is Critical, > 25,000 is Warning
$shopStmt = $db->query("
    SELECT name, outstanding, id 
    FROM shops 
    WHERE outstanding > 25000 
    ORDER BY outstanding DESC
");
$debtShops = $shopStmt->fetchAll();

foreach ($debtShops as $shop) {
    $isCritical = $shop['outstanding'] > 50000;
    $type = $isCritical ? 'critical' : 'warning';
    
    $alerts[] = [
        'id' => 'debt-' . $shop['id'],
        'type' => $type,
        'category' => 'payment',
        'title' => ($isCritical ? 'CRITICAL DEBT: ' : 'High Outstanding: ') . $shop['name'],
        'message' => "Outstanding balance: LKR " . number_format($shop['outstanding']),
        'details' => $isCritical ? "Extremely high credit risk. Immediate collection required." : "Credit limit approaching. Follow up for payment.",
        'action' => 'Collect Now',
        'icon' => 'banknote',
        'target_url' => 'billing.php?shop_id=' . $shop['id']
    ];
}

function slugify($text) {
    return strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $text)));
}

// Sort by type: critical first
usort($alerts, function($a, $b) {
    $p = ['critical' => 0, 'warning' => 1, 'info' => 2];
    return $p[$a['type']] - $p[$b['type']];
});

jsonResponse($alerts);

$stmtPrefs = $db->prepare("SELECT preferences FROM users WHERE id = ?");
$stmtPrefs->execute([$_SESSION['user_id']]);
$userRow = $stmtPrefs->fetch(PDO::FETCH_ASSOC);
$userPrefs = json_decode($userRow['preferences'] ?? '{}', true);

$lowStockEnabled = ($userPrefs['notif_low_stock'] ?? false) ? 'true' : 'false';
