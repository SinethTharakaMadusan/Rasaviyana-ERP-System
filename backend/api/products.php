<?php
require_once __DIR__ . '/../db.php';
setCorsHeaders();

$method = $_SERVER['REQUEST_METHOD'];
$uri    = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
preg_match('#/products(?:/(\d+))?#', $uri, $m);
$id = $m[1] ?? null;

$db = getDB();

// GET /api/products  OR  GET /api/products/{id}
if ($method === 'GET') {
    if ($id) {
        $stmt = $db->prepare('SELECT * FROM products WHERE products_id = ?');
        $stmt->execute([$id]);
        $product = $stmt->fetch();
        if (!$product) errorResponse('Product not found', 404);

        $vStmt = $db->prepare('SELECT * FROM product_variants WHERE products_id = ?');
        $vStmt->execute([$id]);
        $product['variants'] = $vStmt->fetchAll();

        jsonResponse($product);
    } else {
        $stmt = $db->query('SELECT * FROM products ORDER BY product_name ASC');
        $products = $stmt->fetchAll();

        // Fetch variants for all products
        $vStmt = $db->query('SELECT * FROM product_variants');
        $allVariants = $vStmt->fetchAll();

        // Group variants by products_id
        $variantsByProduct = [];
        foreach ($allVariants as $v) {
            $variantsByProduct[$v['products_id']][] = $v;
        }

        foreach ($products as &$p) {
            $p['variants'] = $variantsByProduct[$p['products_id']] ?? [];
        }

        jsonResponse($products);
    }
}

// POST /api/products  - Add product
if ($method === 'POST') {
    $body = getRequestBody();
    $name = $body['product_name'] ?? null;
    $category = $body['category'] ?? null;
    $variants = $body['variants'] ?? [];

    if (!$name) errorResponse('Product name is required');

    try {
        $db->beginTransaction();

        $stmt = $db->prepare('INSERT INTO products (product_name, category) VALUES (?, ?)');
        $stmt->execute([$name, $category]);
        $newId = $db->lastInsertId();

        if (!empty($variants)) {
            $vStmt = $db->prepare('INSERT INTO product_variants (products_id, weight_size, unit_price, cost_price, reorder_level) VALUES (?, ?, ?, ?, ?)');
            $invStmt = $db->prepare('INSERT INTO inventory (product_name, code, category, stock_qty, unit, status) VALUES (?, ?, ?, ?, ?, ?)');
            foreach ($variants as $v) {
                $vStmt->execute([
                    $newId,
                    $v['weight_size'] ?? '',
                    $v['unit_price'] ?? 0,
                    $v['cost_price'] ?? 0,
                    $v['reorder_level'] ?? 0
                ]);

                $weightSize = $v['weight_size'] ?? '';
                $fullName = $name . ($weightSize ? ' (' . $weightSize . ')' : '');
                $code = strtoupper(substr($name, 0, 2)) . '-' . str_replace(' ', '', $weightSize);
                
                $invStmt->execute([
                    $fullName,
                    $code,
                    $category,
                    0,
                    'Packets',
                    'Out of Stock'
                ]);
            }
        }

        $db->commit();
        jsonResponse(['message' => 'Product created', 'products_id' => $newId], 201);
    } catch (Exception $e) {
        $db->rollBack();
        errorResponse('Failed to create product: ' . $e->getMessage());
    }
}

// PUT /api/products/{id}
if ($method === 'PUT') {
    if (!$id) errorResponse('Product ID required');
    $body = getRequestBody();
    $name = $body['product_name'] ?? null;
    $category = $body['category'] ?? null;
    $variants = $body['variants'] ?? [];

    if (!$name) errorResponse('Product name is required');

    try {
        $db->beginTransaction();

        $oldStmt = $db->prepare('SELECT product_name FROM products WHERE products_id = ?');
        $oldStmt->execute([$id]);
        $oldProduct = $oldStmt->fetch();
        $oldName = $oldProduct['product_name'] ?? '';

        $stmt = $db->prepare('UPDATE products SET product_name = ?, category = ? WHERE products_id = ?');
        $stmt->execute([$name, $category, $id]);

        // Manage variants
        // 1. Find existing variants
        $existingVariantsStmt = $db->prepare('SELECT product_variants_id FROM product_variants WHERE products_id = ?');
        $existingVariantsStmt->execute([$id]);
        $existingVariantIds = $existingVariantsStmt->fetchAll(PDO::FETCH_COLUMN);

        // 2. Identify variants to delete
        $sentVariantIds = [];
        foreach ($variants as $v) {
            if (!empty($v['product_variants_id'])) {
                $sentVariantIds[] = $v['product_variants_id'];
            }
        }
        
        $idsToDelete = array_diff($existingVariantIds, $sentVariantIds);

        if (!empty($idsToDelete)) {
            $inQuery = implode(',', array_fill(0, count($idsToDelete), '?'));
            $delStmt = $db->prepare("DELETE FROM product_variants WHERE product_variants_id IN ($inQuery)");
            $delStmt->execute(array_values($idsToDelete));
        }

        // 3. Insert new / Update existing
        $insStmt = $db->prepare('INSERT INTO product_variants (products_id, weight_size, unit_price, cost_price, reorder_level) VALUES (?, ?, ?, ?, ?)');
        $updStmt = $db->prepare('UPDATE product_variants SET weight_size = ?, unit_price = ?, cost_price = ?, reorder_level = ? WHERE product_variants_id = ? AND products_id = ?');
        $invInsStmt = $db->prepare('INSERT INTO inventory (product_name, code, category, stock_qty, unit, status) VALUES (?, ?, ?, ?, ?, ?)');

        foreach ($variants as $v) {
            $weightSize = $v['weight_size'] ?? '';
            $fullName = $name . ($weightSize ? ' (' . $weightSize . ')' : '');
            $code = strtoupper(substr($name, 0, 2)) . '-' . str_replace(' ', '', $weightSize);

            if (!empty($v['product_variants_id'])) {
                $updStmt->execute([
                    $v['weight_size'] ?? '',
                    $v['unit_price'] ?? 0,
                    $v['cost_price'] ?? 0,
                    $v['reorder_level'] ?? 0,
                    $v['product_variants_id'],
                    $id
                ]);
            } else {
                $insStmt->execute([
                    $id,
                    $v['weight_size'] ?? '',
                    $v['unit_price'] ?? 0,
                    $v['cost_price'] ?? 0,
                    $v['reorder_level'] ?? 0
                ]);
            }
        }

        $db->commit();
        jsonResponse(['message' => 'Product updated']);
    } catch (Exception $e) {
        $db->rollBack();
        errorResponse('Failed to update product: ' . $e->getMessage());
    }
}

// DELETE /api/products/{id}
if ($method === 'DELETE') {
    if (!$id) errorResponse('Product ID required');
    try {
        $db->beginTransaction();
        
        $prodStmt = $db->prepare('SELECT product_name FROM products WHERE products_id = ?');
        $prodStmt->execute([$id]);
        $prod = $prodStmt->fetch();

        $varStmt = $db->prepare('SELECT weight_size FROM product_variants WHERE products_id = ?');
        $varStmt->execute([$id]);
        $vars = $varStmt->fetchAll(PDO::FETCH_ASSOC);

        if ($prod) {
            foreach ($vars as $v) {
                $fullName = $prod['product_name'] . ($v['weight_size'] ? ' (' . $v['weight_size'] . ')' : '');
                $db->prepare('DELETE FROM inventory WHERE product_name = ?')->execute([$fullName]);
            }
        }

        $db->prepare('DELETE FROM product_variants WHERE products_id = ?')->execute([$id]);
        $db->prepare('DELETE FROM products WHERE products_id = ?')->execute([$id]);
        
        $db->commit();
        jsonResponse(['message' => 'Product deleted']);
    } catch (Exception $e) {
        $db->rollBack();
        errorResponse('Failed to delete product: ' . $e->getMessage());
    }
}

errorResponse('Method not allowed', 405);
