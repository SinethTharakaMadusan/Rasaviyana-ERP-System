<?php
require_once __DIR__ . '/../db.php';
setCorsHeaders();

$method = $_SERVER['REQUEST_METHOD'];
$uri    = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
preg_match('#/shops(?:/(\d+))?#', $uri, $m);
$id = $m[1] ?? null;

$db = getDB();

// ── Normalise a shops row so the frontend always gets consistent keys ──
function normaliseShop(array $shop): array {
    return [
        'id'          => (int)$shop['id'],
        'name'        => $shop['name'],
        'seller'      => $shop['seller']   ?? $shop['owner']   ?? null,
        'phone'       => $shop['phone']    ?? null,
        'whatsapp'    => $shop['whatsapp'] ?? null,
        'city'        => $shop['city']     ?? null,
        'address'     => $shop['address']  ?? null,
        'outstanding' => (float)($shop['outstanding'] ?? $shop['outstanding_balance'] ?? 0),
        'last_activity' => $shop['last_activity'] ?? null,
        'status'      => $shop['status']   ?? 'Active',
        'created_at'  => $shop['created_at'] ?? null,
    ];
}

// ── GET /api/shops  OR  GET /api/shops/{id} ──
if ($method === 'GET') {
    if ($id) {
        $stmt = $db->prepare('SELECT * FROM shops WHERE id = ?');
        $stmt->execute([$id]);
        $shop = $stmt->fetch();
        if (!$shop) errorResponse('Shop not found', 404);

        // Recent bills for this shop
        $billStmt = $db->prepare('SELECT * FROM bills WHERE shop_id = ? ORDER BY created_at DESC LIMIT 20');
        $billStmt->execute([$id]);
        $bills = $billStmt->fetchAll();
        foreach ($bills as &$bill) {
            if ($bill['items']) $bill['items'] = json_decode($bill['items'], true);
        }
        $normalised = normaliseShop($shop);
        $normalised['bills'] = $bills;
        jsonResponse($normalised);
    } else {
        $stmt = $db->query('SELECT * FROM shops ORDER BY name ASC');
        $rows = $stmt->fetchAll();
        jsonResponse(array_map('normaliseShop', $rows));
    }
}

// ── Helper: build dynamic UPDATE/INSERT using available columns ──
function shopColumns(PDO $db): array {
    $stmt = $db->query("SHOW COLUMNS FROM shops");
    return array_column($stmt->fetchAll(), 'Field');
}

// ── POST /api/shops ──
if ($method === 'POST') {
    $body = getRequestBody();
    if (empty($body['name'])) errorResponse('Shop name is required');

    $cols = shopColumns($db);

    // Map frontend keys → DB columns, only insert if column exists
    $mapping = [
        'name'                => $body['name']                         ?? null,
        'seller'              => $body['seller']                       ?? null,
        'owner'               => $body['seller']                       ?? null,  // legacy alias
        'phone'               => $body['phone']                        ?? null,
        'whatsapp'            => $body['whatsapp']                     ?? null,
        'city'                => $body['city']                         ?? null,
        'address'             => $body['address']                      ?? null,
        'outstanding'         => $body['outstanding']                  ?? 0,
        'outstanding_balance' => $body['outstanding']                  ?? 0,     // legacy alias
        'status'              => $body['status']                       ?? 'Active',
    ];

    $fields = [];
    $values = [];
    foreach ($mapping as $col => $val) {
        if (in_array($col, $cols) && !isset($usedFrontendKey[$col])) {
            // Skip legacy alias if the new column exists
            if ($col === 'owner'               && in_array('seller', $cols))              continue;
            if ($col === 'outstanding_balance' && in_array('outstanding', $cols))         continue;
            $fields[] = $col;
            $values[] = $val;
        }
    }

    $placeholders = implode(', ', array_fill(0, count($fields), '?'));
    $db->prepare('INSERT INTO shops (' . implode(', ', $fields) . ') VALUES (' . $placeholders . ')')->execute($values);

    $newId = $db->lastInsertId();
    $stmt2 = $db->prepare('SELECT * FROM shops WHERE id = ?');
    $stmt2->execute([$newId]);
    jsonResponse(normaliseShop($stmt2->fetch()), 201);
}

// ── PUT /api/shops/{id} ──
if ($method === 'PUT') {
    if (!$id) errorResponse('Shop ID required');
    $body = getRequestBody();
    $cols = shopColumns($db);

    $mapping = [
        'name'                => $body['name']        ?? null,
        'seller'              => $body['seller']      ?? null,
        'owner'               => $body['seller']      ?? null,
        'phone'               => $body['phone']       ?? null,
        'whatsapp'            => $body['whatsapp']    ?? null,
        'city'                => $body['city']        ?? null,
        'address'             => $body['address']     ?? null,
        'outstanding'         => $body['outstanding'] ?? null,
        'outstanding_balance' => $body['outstanding'] ?? null,
        'status'              => $body['status']      ?? null,
    ];

    $setClauses = [];
    $values     = [];
    foreach ($mapping as $col => $val) {
        if ($val === null)              continue;
        if (!in_array($col, $cols))     continue;
        if ($col === 'owner'               && in_array('seller', $cols))      continue;
        if ($col === 'outstanding_balance' && in_array('outstanding', $cols))  continue;
        $setClauses[] = "$col = ?";
        $values[]     = $val;
    }

    if (empty($setClauses)) errorResponse('No valid fields to update');
    $values[] = $id;
    $db->prepare('UPDATE shops SET ' . implode(', ', $setClauses) . ' WHERE id = ?')->execute($values);

    $stmt = $db->prepare('SELECT * FROM shops WHERE id = ?');
    $stmt->execute([$id]);
    jsonResponse(normaliseShop($stmt->fetch()));
}

// ── DELETE /api/shops/{id} ──
if ($method === 'DELETE') {
    if (!$id) errorResponse('Shop ID required');
    $db->prepare('DELETE FROM shops WHERE id = ?')->execute([$id]);
    jsonResponse(['message' => 'Shop deleted']);
}

errorResponse('Method not allowed', 405);
