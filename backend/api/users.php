<?php
require_once __DIR__ . '/../db.php';
setCorsHeaders();

$db = getDB();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $db->query("SELECT id, username, full_name, email, phone, role FROM users ORDER BY id DESC");
    $users = $stmt->fetchAll();

    $totalUsers = count($users);
    $totalAdmin = 0;
    $totalManager = 0;

    foreach ($users as $u) {
        $role = strtolower($u['role']);
        if ($role === 'admin') $totalAdmin++;
        if ($role === 'manager') $totalManager++;
    }

    jsonResponse([
        'users' => $users,
        'stats' => [
            'total'   => $totalUsers,
            'admin'   => $totalAdmin,
            'manager' => $totalManager
        ]
    ]);
}

if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $username  = trim($data['username'] ?? '');
    $fullName  = trim($data['full_name'] ?? '');
    $email     = trim($data['email'] ?? '');
    $phone     = trim($data['phone'] ?? '');
    $role      = trim($data['role'] ?? '');
    $pass      = trim($data['password'] ?? '123456');

    if (empty($username) || empty($fullName) || empty($email) || empty($role)) {
        errorResponse('Username, full name, email and role are required', 400);
    }

    $hashedPass = password_hash($pass, PASSWORD_DEFAULT);

    try {
        $stmt = $db->prepare("INSERT INTO users (username, full_name, email, phone, role, password) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->execute([$username, $fullName, $email, $phone, $role, $hashedPass]);
        jsonResponse(['success' => true, 'message' => 'User added successfully']);
    } catch (PDOException $e) {
        errorResponse('Username or Email already exists', 400);
    }
}

if ($method === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $id       = intval($data['id'] ?? 0);
    $username = trim($data['username'] ?? '');
    $fullName = trim($data['full_name'] ?? '');
    $email    = trim($data['email'] ?? '');
    $phone    = trim($data['phone'] ?? '');
    $role     = trim($data['role'] ?? '');

    if ($id <= 0 || empty($fullName) || empty($email) || empty($role)) {
        errorResponse('Invalid data provided', 400);
    }

    try {
        
        $stmt = $db->prepare("UPDATE users SET full_name = ?, email = ?, phone = ?, role = ? WHERE id = ?");
        $stmt->execute([$fullName, $email, $phone, $role, $id]);
        
        jsonResponse(['success' => true, 'message' => 'User updated successfully']);
    } catch (PDOException $e) {
        errorResponse('Email already exists or database error', 400);
    }
}

if ($method === 'DELETE') {
    $id = intval($_GET['id'] ?? 0);
    if ($id <= 0) errorResponse('Invalid user ID', 400);

    $stmt = $db->prepare("DELETE FROM users WHERE id = ?");
    $stmt->execute([$id]);
    jsonResponse(['success' => true, 'message' => 'User deleted successfully']);
}

errorResponse('Method not allowed', 405);