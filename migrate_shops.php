<?php
// Migration: Add missing columns to shops table
require_once __DIR__ . '/backend/db.php';
$db = getDB();

$alterations = [
    "seller VARCHAR(150) NULL AFTER name",
    "whatsapp VARCHAR(30) NULL AFTER phone",
    "city VARCHAR(100) NULL AFTER whatsapp",
    "outstanding DECIMAL(12,2) DEFAULT 0 AFTER city",
    "status VARCHAR(30) DEFAULT 'Active' AFTER outstanding",
];

// Get existing columns
$existing = $db->query("SHOW COLUMNS FROM shops")->fetchAll(PDO::FETCH_COLUMN);

$results = [];
foreach ($alterations as $col) {
    $colName = strtok($col, ' ');
    if (in_array($colName, $existing)) {
        $results[] = "⏭️ Column <b>$colName</b> already exists — skipped.";
    } else {
        try {
            $db->exec("ALTER TABLE shops ADD COLUMN $col");
            $results[] = "✅ Added column <b>$colName</b>.";
        } catch (Exception $e) {
            $results[] = "❌ Failed to add <b>$colName</b>: " . $e->getMessage();
        }
    }
}

// Show final table structure
$cols = $db->query("DESCRIBE shops")->fetchAll();
?>
<!DOCTYPE html>
<html>
<head>
    <title>Shops Migration</title>
    <style>
        body { font-family: sans-serif; padding: 30px; background: #f4f7f6; }
        .card { background: white; border-radius: 10px; padding: 24px; max-width: 700px; margin: 0 auto; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
        h2 { color: #d37400; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { padding: 10px 14px; text-align: left; border-bottom: 1px solid #eee; font-size: 0.9rem; }
        th { background: #f9f9f9; font-weight: 600; color: #555; }
        .result { padding: 8px 12px; margin: 6px 0; border-radius: 6px; background: #f1f5f9; }
        a.btn { display: inline-block; margin-top: 20px; padding: 10px 20px; background: #d37400; color: white; border-radius: 6px; text-decoration: none; font-weight: 600; }
    </style>
</head>
<body>
<div class="card">
    <h2>🛠️ Shops Table Migration</h2>
    <?php foreach ($results as $r): ?>
        <div class="result"><?= $r ?></div>
    <?php endforeach; ?>

    <h3 style="margin-top:24px;">Current shops table structure:</h3>
    <table>
        <tr><th>Column</th><th>Type</th><th>Null</th><th>Default</th></tr>
        <?php foreach ($cols as $c): ?>
        <tr>
            <td><strong><?= $c['Field'] ?></strong></td>
            <td><?= $c['Type'] ?></td>
            <td><?= $c['Null'] ?></td>
            <td><?= $c['Default'] ?? 'NULL' ?></td>
        </tr>
        <?php endforeach; ?>
    </table>

    <a class="btn" href="index.php">← Back to System</a>
    &nbsp;
    <a class="btn" style="background:#2A9D8F;" href="migrate_shops.php">Run Again</a>
</div>
</body>
</html>
