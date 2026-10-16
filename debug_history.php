<?php
require_once __DIR__ . '/backend/db.php';
$db = getDB();

echo '<h2>Shops List</h2><pre>';
$shops = $db->query('SELECT id, name, outstanding FROM shops')->fetchAll();
foreach ($shops as $s) {
    echo "ID: {$s['id']} | Name: {$s['name']} | Outstanding: {$s['outstanding']}\n";
}
echo '</pre>';

echo '<h2>All Bills</h2><pre>';
$bills = $db->query('SELECT id, bill_number, shop_id, total_amount, net_amount, extra_paid, payment_status, notes, bill_date, created_at FROM bills ORDER BY id DESC LIMIT 20')->fetchAll();
if (empty($bills)) {
    echo "NO BILLS FOUND IN DATABASE\n";
} else {
    foreach ($bills as $b) {
        echo "BillID: {$b['id']} | ShopID: {$b['shop_id']} | extra_paid: {$b['extra_paid']} | Status: {$b['payment_status']} | Notes: {$b['notes']} | Date: {$b['created_at']}\n";
    }
}
echo '</pre>';

echo '<h2>Bills for Shop ID 3 (Kandy Spice Mart assumed)</h2><pre>';
$bills = $db->prepare('SELECT * FROM bills WHERE shop_id = ? ORDER BY id DESC');
$bills->execute([3]);
$result = $bills->fetchAll();
if (empty($result)) {
    echo "NO BILLS FOR SHOP ID 3\n";
} else {
    foreach ($result as $b) {
        echo "BillID: {$b['id']} | extra_paid: {$b['extra_paid']} | net_amount: {$b['net_amount']} | Status: {$b['payment_status']} | Notes: {$b['notes']}\n";
    }
}
echo '</pre>';
?>
