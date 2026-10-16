<?php
require_once __DIR__ . '/../db.php';
setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    errorResponse('Method not allowed', 405);
}

$body = getRequestBody();
$username = trim($body['username'] ?? '');
$password = $body['password'] ?? '';

if (!$username || !$password) {
    errorResponse('Username and password are required');
}

$db   = getDB();
$stmt = $db->prepare('SELECT * FROM users WHERE username = ? AND status = "Active"');
$stmt->execute([$username]);
$user = $stmt->fetch();

if (!$user || !password_verify($password, $user['password'])) {
    errorResponse('Invalid username or password', 401);
}

// Decode preferences JSON
if (!empty($user['preferences'])) {
    $user['preferences'] = json_decode($user['preferences'], true);
}

session_start();

$_SESSION['user_id'] = $user['id'];
$_SESSION['username'] = $user['username'];
$_SESSION['full_name'] = $user['full_name'];
$_SESSION['email'] = $user['email'];
$_SESSION['role'] = $user['role'];

unset($user['password']);
jsonResponse(['message' => 'Login successful', 'user' => $user]);