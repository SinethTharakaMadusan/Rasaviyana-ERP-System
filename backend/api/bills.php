<?php
require_once __DIR__ . '/../db.php';
setCorsHeaders();

$method = $_SERVER['REQUEST_METHOD'];
$uri    = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Match /api/bills or /api/bills/by-shop/{shopId} or /api/bills/{id}
preg_match('#/bills(?:/by-shop/(\d+)|/(\d+))?#', $uri, $m);
$byShopId = $m[1] ?? null;
$billId   = $m[2] ?? null;

$db = getDB();

// Helper to fetch items for bills
function attachItemsToBills(PDO $db, array &$bills): void {
    if (empty($bills)) return;
    $billIds = array_column($bills, 'id');
    $placeholders = implode(',', array_fill(0, count($billIds), '?'));
    $stmt = $db->prepare("SELECT * FROM bill_items WHERE bill_id IN ($placeholders)");
    $stmt->execute($billIds);
    $items = $stmt->fetchAll();
    
    $itemsByBill = [];
    foreach ($items as $item) {
        $itemsByBill[$item['bill_id']][] = [
            'product_variant_id' => $item['product_variant_id'] ?? null,
            'product_name' => $item['product_name'],
            'variant_name' => $item['variant_name'] ?? '',
            'item_type'    => $item['item_type'] ?? 'sale',
            'quantity'     => $item['quantity'],
            'unit_price'   => (float)$item['unit_price'],
            'subtotal'     => (float)$item['total_price']
        ];
    }
    
    foreach ($bills as &$b) {
        $b['items'] = $itemsByBill[$b['id']] ?? [];
        $b['total'] = (float)($b['total_amount'] ?? $b['total'] ?? 0);
        $b['net_amount'] = (float)($b['net_amount'] ?? 0);
    }
}

// GET /api/bills
if ($method === 'GET' && !$byShopId && !$billId) {
    try {
        $stmt = $db->query('SELECT b.*, s.name AS shop_name FROM bills b LEFT JOIN shops s ON b.shop_id = s.id ORDER BY b.created_at DESC');
        $bills = $stmt->fetchAll();
        attachItemsToBills($db, $bills);
        jsonResponse($bills);
    } catch (Exception $e) {
        errorResponse($e->getMessage(), 500);
    }
}

// GET /api/bills/by-shop/{shopId}
if ($method === 'GET' && $byShopId) {
    $stmt = $db->prepare('SELECT b.*, s.name AS shop_name FROM bills b LEFT JOIN shops s ON b.shop_id = s.id WHERE b.shop_id = ? ORDER BY b.created_at DESC');
    $stmt->execute([$byShopId]);
    $bills = $stmt->fetchAll();
    attachItemsToBills($db, $bills);
    jsonResponse($bills);
}

// GET /api/bills/{id}
if ($method === 'GET' && $billId) {
    $stmt = $db->prepare('SELECT * FROM bills WHERE id = ?');
    $stmt->execute([$billId]);
    $bill = $stmt->fetch();
    if (!$bill) errorResponse('Bill not found', 404);
    $bills = [$bill];
    attachItemsToBills($db, $bills);
    jsonResponse($bills[0]);
}

// POST /api/bills
if ($method === 'POST') {
    $body = getRequestBody();
    if (empty($body['shop_id'])) errorResponse('shop_id is required');

    $items        = $body['items'] ?? [];
    $subtotal     = $body['subtotal'] ?? array_sum(array_column($items, 'subtotal'));
    
    $disc_percent = $body['discount_percent'] ?? 0;
    $disc_amount  = $body['discount_amount'] ?? 0;
    
    $calculated_total = $subtotal - $disc_amount;
    $total_amount     = $body['total'] ?? $body['total_amount'] ?? $calculated_total;
    $net_amount       = $body['net_amount'] ?? $total_amount;


    $db->beginTransaction();
    try {
        $stmt = $db->prepare('INSERT INTO bills (shop_id, subtotal, discount_percent, discount_amount, total_amount, return_total, net_amount, extra_paid, shop_total_outstanding_after, payment_status, notes, bill_date, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())');

        $stmt->execute([
        $body['shop_id'],
        $subtotal,
        $disc_percent,
        $disc_amount,
        $total_amount,
        $body['return_total'] ?? 0,
        $net_amount,
        $body['extra_paid'] ?? 0,
        $body['shop_total_outstanding_after'] ?? 0,
        $body['payment_status'] ?? 'Pending',
        $body['notes'] ?? ''
    ]);
        
        $newId = $db->lastInsertId();

        $billNumber = 'BILL-' . str_pad($newId, 4, '0', STR_PAD_LEFT);
        $db->prepare('UPDATE bills SET bill_number = ? WHERE id = ?')->execute([$billNumber, $newId]);

        if (!empty($items)) {
            $itemStmt = $db->prepare('INSERT INTO bill_items (bill_id, product_variant_id, product_name, variant_name, quantity, unit_price, total_price, item_type, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())');
            $invCheckStmt = $db->prepare('SELECT stock_qty FROM inventory WHERE product_name = ?');
            $invUpdateStmt = $db->prepare('UPDATE inventory SET stock_qty = stock_qty - ?, status = CASE WHEN stock_qty - ? <= 20 THEN "Out of Stock" WHEN stock_qty - ? <= 40 THEN "Low Stock" ELSE "In Stock" END WHERE product_name = ?');

            foreach ($items as $item) {
                $prodName = $item['product_name'] ?? $item['name'] ?? '';
                $varName = $item['variant_name'] ?? '';
                $qty = $item['quantity'] ?? $item['qty'] ?? 1;
                $iType = $item['item_type'] ?? 'sale';

                if ($iType === 'sale') {
                    $pName = trim($prodName);
                    $vName = trim($varName);

                    $invNameParens = $vName !== '' ? "$pName ($vName)" : $pName;
                    $invNamePlain  = $vName !== '' ? "$pName $vName" : $pName;
                    
                    $invCheckStmt->execute([$invNameParens]);
                    $invRow = $invCheckStmt->fetch();
                    $resolvedInvName = $invNameParens;

                    if (!$invRow) {
                        $invCheckStmt->execute([$invNamePlain]);
                        $invRow = $invCheckStmt->fetch();
                        $resolvedInvName = $invNamePlain;
                    }
                    
                    if (!$invRow) {
                        throw new Exception("Product not found in inventory: '$invNameParens' or '$invNamePlain'. Please check inventory.");
                    }
                    if ($invRow['stock_qty'] < $qty) {
                        throw new Exception("Not enough stock for '$resolvedInvName'. Available: " . $invRow['stock_qty'] . ", Requested: $qty");
                    }

                    $itemStmt->execute([
                        $newId,
                        $item['product_variant_id'] ?? null,
                        $prodName,
                        $varName,
                        $qty,
                        $item['unit_price'] ?? $item['price'] ?? 0,
                        $item['total_price'] ?? $item['subtotal'] ?? 0,
                        $iType
                    ]);

                    $invUpdateStmt->execute([$qty, $qty, $qty, $resolvedInvName]);
                    
                } else {
                    $itemStmt->execute([
                        $newId,
                        $item['product_variant_id'] ?? null,
                        $prodName,
                        $varName,
                        $qty,
                        $item['unit_price'] ?? $item['price'] ?? 0,
                        $item['total_price'] ?? $item['subtotal'] ?? 0,
                        $iType
                    ]);

                    $pName = trim($prodName);
                    $vName = trim($varName);
                    $invNameParens = $vName !== '' ? "$pName ($vName)" : $pName;
                    $invNamePlain  = $vName !== '' ? "$pName $vName" : $pName;

                    $invCheckStmt->execute([$invNameParens]);
                    $invRowR = $invCheckStmt->fetch();
                    $resolvedReturnName = $invNameParens;
                    if (!$invRowR) {
                        $invCheckStmt->execute([$invNamePlain]);
                        $invRowR = $invCheckStmt->fetch();
                        $resolvedReturnName = $invNamePlain;
                    }
                    if ($invRowR) {
                        $db->prepare('UPDATE inventory SET stock_qty = stock_qty + ?, status = CASE WHEN stock_qty + ? <= 20 THEN "Out of Stock" WHEN stock_qty + ? <= 40 THEN "Low Stock" ELSE "In Stock" END WHERE product_name = ?')->execute([$qty, $qty, $qty, $resolvedReturnName]);
                    }
                }
            }
        }

        $cols = array_column($db->query("SHOW COLUMNS FROM shops")->fetchAll(), 'Field');
        if (in_array('outstanding', $cols)) {
            $db->prepare('UPDATE shops SET outstanding = outstanding + ? WHERE id = ?')->execute([$net_amount, $body['shop_id']]);
        }
        if (in_array('outstanding_balance', $cols)) {
            $db->prepare('UPDATE shops SET outstanding_balance = outstanding_balance + ? WHERE id = ?')->execute([$net_amount, $body['shop_id']]);
        }

        $db->commit();
        
        $getStmt = $db->prepare('SELECT * FROM bills WHERE id = ?');
        $getStmt->execute([$newId]);
        $bill = $getStmt->fetch();
        $bills = [$bill];
        attachItemsToBills($db, $bills);
        jsonResponse($bills[0], 201);
    } catch (Exception $e) {
        $db->rollBack();
        errorResponse($e->getMessage(), 500);
    }
}

errorResponse('Method not allowed', 405);