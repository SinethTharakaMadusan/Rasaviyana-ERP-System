<?php
require_once __DIR__ . '/backend/db.php';

header('Content-Type: text/html');

echo "<h2>Database Debug</h2>";

try {
    $db = getDB();
    echo "✅ Database connected OK<br><br>";

    // Check if users table exists
    $stmt = $db->query("SHOW TABLES LIKE 'users'");
    if ($stmt->rowCount() === 0) {
        echo "❌ Table 'users' does NOT exist! Run setup_db.php first.<br>";
        exit;
    }
    echo "✅ Table 'users' exists<br><br>";

    // Show all users
    $stmt = $db->query("SELECT id, username, role, status, LEFT(password,40) as pass_preview FROM users");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (empty($users)) {
        echo "❌ No users found in database! Run setup_db.php to create admin user.<br>";
        exit;
    }

    echo "<b>Users in database (" . count($users) . "):</b><br>";
    echo "<table border='1' cellpadding='5'>";
    echo "<tr><th>ID</th><th>Username</th><th>Role</th><th>Status</th><th>Password Hash (first 40 chars)</th></tr>";
    foreach ($users as $u) {
        echo "<tr><td>{$u['id']}</td><td>{$u['username']}</td><td>{$u['role']}</td><td>{$u['status']}</td><td>{$u['pass_preview']}...</td></tr>";
    }
    echo "</table><br>";

    // Test password_verify for admin
    $stmt = $db->prepare("SELECT * FROM users WHERE username = 'admin'");
    $stmt->execute();
    $admin = $stmt->fetch();

    if ($admin) {
        echo "<b>Testing admin password:</b><br>";
        $tests = ['admin', 'admin123', 'Admin123', 'Admin', 'password', '1234', 'admin@123'];
        foreach ($tests as $pass) {
            $ok = password_verify($pass, $admin['password']) ? "✅ CORRECT" : "❌ Wrong";
            echo "Password '$pass': $ok<br>";
        }
        echo "<br><b>Full hash in DB:</b> " . $admin['password'] . "<br>";
        echo "<b>Is bcrypt?</b> " . (str_starts_with($admin['password'], '$2y$') ? "✅ Yes (bcrypt)" : "❌ No — may be plain text!") . "<br>";
    } else {
        echo "❌ No 'admin' user found.<br>";
    }

} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage();
}
?>
