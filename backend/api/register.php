<?php
require_once __DIR__ . '/../db.php';
setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    errorResponse('Method not allowed', 405);
}

$body    = getRequestBody();
$username = trim($body['username'] ?? '');
$fullname = trim($body['fullname'] ?? '');
$email    = trim($body['email'] ?? '');
$phone    = trim($body['phone'] ?? '');
$password = $body['password'] ?? '';

// Validate required fields
if (!$username || !$fullname || !$password) {
    errorResponse('Username, full name and password are required');
}

if (strlen($password) < 6) {
    errorResponse('Password must be at least 6 characters');
}

$db = getDB();

// Check if username already exists
$stmt = $db->prepare('SELECT id FROM users WHERE username = ?');
$stmt->execute([$username]);
if ($stmt->fetch()) {
    errorResponse('Username already exists. Please choose a different one.');
}

// Check if email already exists (if provided)
if ($email) {
    $stmt = $db->prepare('SELECT id FROM users WHERE email = ?');
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        errorResponse('Email is already registered.');
    }
}

// Hash the password
$hashedPassword = password_hash($password, PASSWORD_BCRYPT);

// Insert the new user
$stmt = $db->prepare(
    'INSERT INTO users (username, password, full_name, email, phone, role, status, preferences, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())'
);

$stmt->execute([
    $username,
    $hashedPassword,
    $fullname,
    $email ?: null,
    $phone ?: null,
    'Staff',       // default role
    'Active',      // default status
    '{}'           // empty preferences JSON
]);

$newUserId = $db->lastInsertId();

jsonResponse([
    'message' => 'Registration successful!',
    'user_id' => $newUserId,
    'username' => $username
], 201);
