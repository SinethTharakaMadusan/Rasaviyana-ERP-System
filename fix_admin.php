<?php
require_once __DIR__ . '/backend/db.php';

header('Content-Type: text/html; charset=utf-8');

echo "<h2>Fix Admin User</h2>";

try {
    $db = getDB();

    // Fix admin user: set role to Admin
    $stmt = $db->prepare("UPDATE users SET role = 'Admin' WHERE username = 'admin'");
    $stmt->execute();
    $affected = $stmt->rowCount();

    if ($affected > 0) {
        echo "✅ <b>Fixed!</b> Admin user role updated to 'Admin'.<br><br>";
    } else {
        echo "⚠️ No rows updated. Checking if admin user exists...<br>";

        // Check if user exists
        $stmt = $db->prepare("SELECT * FROM users WHERE username = 'admin'");
        $stmt->execute();
        $user = $stmt->fetch();

        if (!$user) {
            echo "❌ Admin user does not exist. Creating admin user...<br>";
            // Create admin user
            $hash = password_hash('admin123', PASSWORD_DEFAULT);
            $stmt = $db->prepare("INSERT INTO users (username, password, role, status) VALUES ('admin', ?, 'Admin', 'Active')");
            $stmt->execute([$hash]);
            echo "✅ Admin user created! Username: <b>admin</b> | Password: <b>admin123</b><br>";
        } else {
            echo "ℹ️ Admin user already has role: <b>" . $user['role'] . "</b><br>";
        }
    }

    echo "<br><b>Current users:</b><br>";
    echo "<table border='1' cellpadding='6' style='border-collapse:collapse'>";
    echo "<tr style='background:#eee'><th>ID</th><th>Username</th><th>Role</th><th>Status</th></tr>";
    $stmt = $db->query("SELECT id, username, role, status FROM users ORDER BY id");
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($users as $u) {
        $bg = ($u['role'] === 'Admin') ? '#d4edda' : '#fff';
        echo "<tr style='background:$bg'><td>{$u['id']}</td><td><b>{$u['username']}</b></td><td>{$u['role']}</td><td>{$u['status']}</td></tr>";
    }
    echo "</table><br>";

    echo "<a href='index.php' style='padding:10px 20px;background:#0d6efd;color:#fff;text-decoration:none;border-radius:5px;'>→ Go to Login Page</a>";

} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage();
}
?>
