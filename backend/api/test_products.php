<?php
$_SERVER['REQUEST_METHOD'] = 'GET';
$_SERVER['REQUEST_URI'] = '/api/products';
ob_start();
require __DIR__ . '/products.php';
$out = ob_get_clean();
echo $out;
