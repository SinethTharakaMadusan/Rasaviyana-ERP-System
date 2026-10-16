<?php
require_once __DIR__ . '/backend/db.php';

// Reset admin password to 'admin123'
$newPassword = password_hash('admin123', PASSWORD_DEFAULT);

try {
    $db = getDB();
    
    // Check if admin exists
    $check = $db->prepare("SELECT id, username, role, status FROM users WHERE username = 'admin'");
    $check->execute();
    $adminUser = $check->fetch();
    
    if ($adminUser) {
        // Update password
        $stmt = $db->prepare("UPDATE users SET password = ? WHERE username = 'admin'");
        $stmt->execute([$newPassword]);
        echo "<h2 style='color:green'>✅ Admin password reset successfully!</h2>";
        echo "<p><strong>Username:</strong> admin<br><strong>New Password:</strong> admin123</p>";
        echo "<p><a href='index.php' style='color:blue'>Click here to Login</a></p>";
    } else {
        // Create admin user
        $stmt = $db->prepare("INSERT INTO users (username, full_name, password, role, status) VALUES ('admin', 'Administrator', ?, 'Admin', 'Active')");
        $stmt->execute([$newPassword]);
        echo "<h2 style='color:green'>✅ Admin user created!</h2>";
        echo "<p><strong>Username:</strong> admin<br><strong>Password:</strong> admin123</p>";
        echo "<p><a href='index.php' style='color:blue'>Click here to Login</a></p>";
    }

    // Show all users
    $all = $db->query('SELECT id, username, role, status FROM users');
    $rows = $all->fetchAll();
    echo "<h3>All Users:</h3><table border='1' cellpadding='8' style='border-collapse:collapse'>";
    echo "<tr style='background:#eee'><th>ID</th><th>Username</th><th>Role</th><th>Status</th></tr>";
    foreach ($rows as $r) {
        echo "<tr><td>{$r['id']}</td><td>{$r['username']}</td><td>{$r['role']}</td><td>{$r['status']}</td></tr>";
    }
    echo "</table>";
    echo "<br><p style='color:gray; font-size:12px'>⚠️ Delete this file after use for security.</p>";
} catch (Exception $e) {
    echo "<h2 style='color:red'>❌ ERROR: " . $e->getMessage() . "</h2>";
}
?>
