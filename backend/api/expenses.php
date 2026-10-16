<?php
require_once __DIR__ . '/../db.php';
setCorsHeaders();

$method = $_SERVER['REQUEST_METHOD'];
$uri    = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
preg_match('#/expense(?:/(\d+))?#', $uri, $m);
$id = $m[1] ?? null;

$db = getDB();

// GET /api/expenses
if ($method === 'GET') {
    $stmt = $db->query('SELECT * FROM expense ORDER BY date DESC, created_at DESC');
    jsonResponse($stmt->fetchAll());
}

// POST /api/expenses
if ($method === 'POST') {
    $body = getRequestBody();
    if (empty($body['date']))   errorResponse('date is required');
    if (empty($body['amount'])) errorResponse('amount is required');

    $stmt = $db->prepare('INSERT INTO expense (date, description, category, payment_method, amount, materials) VALUES (?, ?, ?, ?, ?, ?)');
    $stmt->execute([
        $body['date'],
        $body['description']    ?? null,
        $body['category']       ?? 'other',
        $body['payment_method'] ?? 'cash',
        $body['amount'],
        $body['materials']      ?? null,
    ]);
    $newId = $db->lastInsertId();
    $stmt2 = $db->prepare('SELECT * FROM expense WHERE id = ?');
    $stmt2->execute([$newId]);
    jsonResponse($stmt2->fetch(), 201);
}

// DELETE /api/expenses/{id}
if ($method === 'DELETE') {
    if (!$id) errorResponse('Expense ID required');
    $db->prepare('DELETE FROM expenses WHERE id = ?')->execute([$id]);
    jsonResponse(['message' => 'Expense deleted']);
}

errorResponse('Method not allowed', 405);
