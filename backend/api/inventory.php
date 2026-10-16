<?php
require_once __DIR__ . '/../db.php';
setCorsHeaders();

$method = $_SERVER['REQUEST_METHOD'];
$uri    = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
preg_match('#/inventory(?:\.php)?(?:/(\w[\w-]*))?#', $uri, $m);
$id     = isset($m[1]) && is_numeric($m[1]) ? $m[1] : null;
$action = isset($m[1]) && !is_numeric($m[1]) ? $m[1] : null;

$db = getDB();

// Auto-calculate status from stock_qty (thresholds: <=20 Out of Stock, <=40 Low Stock, >40 In Stock)
function calcStatus(int $qty): string {
    if ($qty <= 20) return 'Out of Stock';
    if ($qty <= 40) return 'Low Stock';
    return 'In Stock';
}

// GET /api/inventory
if ($method === 'GET' && !$id) {
    $stmt = $db->query('SELECT * FROM inventory ORDER BY product_name ASC');
    jsonResponse($stmt->fetchAll());
}

// GET /api/inventory/{id}
if ($method === 'GET' && $id) {
    $stmt = $db->prepare('SELECT * FROM inventory WHERE id = ?');
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    if (!$row) errorResponse('Item not found', 404);
    jsonResponse($row);
}

// POST /api/inventory  — Add new item
if ($method === 'POST' && !$action) {
    $body = getRequestBody();
    if (empty($body['product_name'])) errorResponse('product_name is required');
    $qty = (int)($body['stock_qty'] ?? 0);
    $stmt = $db->prepare('INSERT INTO inventory (product_name, code, category, stock_qty, unit, status) VALUES (?, ?, ?, ?, ?, ?)');
    $stmt->execute([
        $body['product_name'],
        $body['code']     ?? null,
        $body['category'] ?? null,
        $qty,
        $body['unit']     ?? 'Packets',
        $body['status']   ?? calcStatus($qty),
    ]);
    $newId = $db->lastInsertId();
    $s2 = $db->prepare('SELECT * FROM inventory WHERE id = ?');
    $s2->execute([$newId]);
    jsonResponse($s2->fetch(), 201);
}

// POST /api/inventory/init-from-products
if ($method === 'POST' && $action === 'init-from-products') {
    // Fetch products and their variants
    $stmt = $db->query("
        SELECT p.product_name, p.category, pv.weight_size 
        FROM products p
        JOIN product_variants pv ON p.products_id = pv.products_id
    ");
    $variants = $stmt->fetchAll();
    
    $addedCount = 0;
    foreach ($variants as $v) {
        $fullName = $v['product_name'] . ' (' . $v['weight_size'] . ')';
        // Simple code generation if missing
        $code = strtoupper(substr($v['product_name'], 0, 2)) . '-' . str_replace(' ', '', $v['weight_size']);
        
        // Check if already exists by name
        $check = $db->prepare("SELECT id FROM inventory WHERE product_name = ?");
        $check->execute([$fullName]);
        if (!$check->fetch()) {
            $ins = $db->prepare("INSERT INTO inventory (product_name, code, category, stock_qty, unit, status) VALUES (?, ?, ?, ?, ?, ?)");
            $ins->execute([
                $fullName,
                $code,
                $v['category'],
                0,
                'Packets',
                'Out of Stock'
            ]);
            $addedCount++;
        }
    }
    
    jsonResponse(['message' => "Initialized inventory. Added $addedCount new items from products."]);
}

// PUT /api/inventory/{id}  — Update item
if ($method === 'PUT' && $id) {
    $body   = getRequestBody();
    $fields = [];
    $values = [];

    $allowed = ['product_name', 'code', 'category', 'stock_qty', 'unit', 'status'];
    foreach ($allowed as $f) {
        if (array_key_exists($f, $body)) {
            $fields[] = "$f = ?";
            $values[] = $body[$f];
        }
    }
    // Auto-recalculate status if stock_qty changed and status not explicitly set
    if (array_key_exists('stock_qty', $body) && !array_key_exists('status', $body)) {
        $fields[] = 'status = ?';
        $values[] = calcStatus((int)$body['stock_qty']);
    }

    if (empty($fields)) errorResponse('No fields to update');
    $values[] = $id;
    $db->prepare('UPDATE inventory SET ' . implode(', ', $fields) . ' WHERE id = ?')->execute($values);

    $stmt = $db->prepare('SELECT * FROM inventory WHERE id = ?');
    $stmt->execute([$id]);
    jsonResponse($stmt->fetch());
}

// DELETE /api/inventory/{id}
if ($method === 'DELETE' && $id) {
    $db->prepare('DELETE FROM inventory WHERE id = ?')->execute([$id]);
    jsonResponse(['message' => 'Item deleted']);
}

errorResponse('Method not allowed', 405);
