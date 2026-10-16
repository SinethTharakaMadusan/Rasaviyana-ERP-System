<?php
require_once __DIR__ . '/../db.php';

session_start();
session_unset();
session_destroy();

// Clear session cookies
if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000,
        $params["path"], $params["domain"],
        $params["secure"], $params["httponly"]
    );
}

// Redirect or return JSON depending on caller
if ($_SERVER['REQUEST_METHOD'] === 'POST' || (isset($_SERVER['HTTP_ACCEPT']) && str_contains($_SERVER['HTTP_ACCEPT'], 'application/json'))) {
    header('Content-Type: application/json');
    echo json_encode(['message' => 'Logged out successfully']);
} else {
    header('Location: ../../index.php');
}
exit;
