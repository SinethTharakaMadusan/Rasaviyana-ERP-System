<?php
require_once __DIR__ . '/backend/db.php';
$db = getDB();

echo "<h2>Auth Debug Tool</h2>";

// 1. Check if users table exists
try {
    $db->query("SELECT 1 FROM users LIMIT 1");
    echo "✅ Table 'users' exists.<br>";
} catch (Exception $e) {
    echo "❌ Table 'users' does NOT exist. Error: " . $e->getMessage() . "<br>";
    exit;
}

// 2. Check admin user
$username = 'admin';
$stmt = $db->prepare("SELECT * FROM users WHERE username = ?");
$stmt->execute([$username]);
$user = $stmt->fetch();

if ($user) {
    echo "✅ User 'admin' found.<br>";
    echo "Role: " . $user['role'] . "<br>";
    echo "Status: " . $user['status'] . "<br>";
    
    // 3. Verify password logic
    $passToTest = 'admin123';
    if (password_verify($passToTest, $user['password'])) {
        echo "✅ Password 'admin123' is CORRECT for this hash.<br>";
    } else {
        echo "❌ Password 'admin123' is INCORRECT for this hash.<br>";
        echo "Hash in DB: " . $user['password'] . "<br>";
        echo "New Hash for 'admin123': " . password_hash($passToTest, PASSWORD_DEFAULT) . "<br>";
    }
} else {
    echo "❌ User 'admin' NOT found in database.<br>";
    echo "Try running setup_db.php again.<br>";
}
?>
