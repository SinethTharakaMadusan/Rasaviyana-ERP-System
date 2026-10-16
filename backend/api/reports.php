<?php
require_once __DIR__ . '/../db.php';
setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') errorResponse('Method not allowed', 405);

$db  = getDB();
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

preg_match('#/reports(?:\.php)?/([a-z0-9-]+)#', $uri, $m);
$report = $m[1] ?? '';

$year      = intval($_GET['year']  ?? date('Y'));
$month     = intval($_GET['month'] ?? 0);
$total_col = "(COALESCE(extra_paid, 0) + COALESCE(net_amount, 0))";
$product   = trim($_GET['category'] ?? ''); // Still using 'category' as param name for JS compatibility

// ------------------------------------------------------------------
// /api/reports/categories  — Now mapped to Product Names
// ------------------------------------------------------------------
if ($report === 'categories') {
    $rows = $db->query("
        SELECT DISTINCT product_name 
        FROM bill_items 
        WHERE item_type = 'sale' AND product_name IS NOT NULL
        ORDER BY product_name
    ")->fetchAll();
    jsonResponse(array_column($rows, 'product_name'));
}

// ------------------------------------------------------------------
// /api/reports/monthly-packets-by-category — Now by Product Name
// ------------------------------------------------------------------
if ($report === 'monthly-packets-by-category') {
    $labels = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    if ($product !== '') {
        // Single-product mode
        $stmt = $db->prepare("
            SELECT MONTH(b.created_at) AS month, COALESCE(SUM(bi.quantity),0) AS packets
            FROM bill_items bi
            JOIN bills b ON bi.bill_id = b.id
            WHERE bi.item_type = 'sale'
              AND YEAR(b.created_at) = ?
              AND bi.product_name = ?
            GROUP BY MONTH(b.created_at)
            ORDER BY month
        ");
        $stmt->execute([$year, $product]);
        $rows = $stmt->fetchAll();
        $data = array_fill(1,12,0);
        foreach ($rows as $r) $data[(int)$r['month']] = (int)$r['packets'];
        jsonResponse([
            'labels'   => $labels,
            'category' => $product, // keeping key name 'category' for JS
            'packets'  => array_values($data),
            'year'     => $year
        ]);
    }

    // All-products stacked mode
    $stmt = $db->prepare("
        SELECT
            bi.product_name AS product,
            MONTH(b.created_at) AS month,
            COALESCE(SUM(bi.quantity),0) AS packets
        FROM bill_items bi
        JOIN bills b ON bi.bill_id = b.id
        WHERE bi.item_type = 'sale'
          AND YEAR(b.created_at) = ?
        GROUP BY bi.product_name, month
        ORDER BY bi.product_name, month
    ");
    $stmt->execute([$year]);
    $rows = $stmt->fetchAll();

    $prodData = [];
    foreach ($rows as $r) {
        $p = $r['product'];
        if (!isset($prodData[$p])) $prodData[$p] = array_fill(1,12,0);
        $prodData[$p][(int)$r['month']] = (int)$r['packets'];
    }

    $datasets = [];
    $palette  = ['#c36c02','#2a9d8f','#264653','#e9c46a','#e76f51','#8338ec','#3a86ff','#06d6a0','#f72585','#4cc9f0'];
    $i = 0;
    foreach ($prodData as $p => $monthData) {
        $datasets[] = [
            'label'           => $p, // Corrected for Chart.js legend 
            'data'            => array_values($monthData),
            'backgroundColor'=> $palette[$i % count($palette)],
            'borderRadius'    => 4,
        ];
        $i++;
    }
    jsonResponse(['labels' => $labels, 'datasets' => $datasets, 'year' => $year]);
}

// ------------------------------------------------------------------
// /api/reports/summary — Enhanced with Net Profit (Total Rev - Total Exp)
// ------------------------------------------------------------------
if ($report === 'summary') {
    $totalRev     = $db->query("SELECT COALESCE(SUM(COALESCE(extra_paid, 0) + COALESCE(net_amount, 0)),0) AS v FROM bills")->fetch()['v'];
    $totalExp     = $db->query('SELECT COALESCE(SUM(amount),0) AS v FROM expense')->fetch()['v'];
    $shopCount    = $db->query('SELECT COUNT(*) AS v FROM shops')->fetch()['v'];
    $totalPackets = $db->query("SELECT COALESCE(SUM(quantity),0) AS v FROM bill_items WHERE item_type='sale'")->fetch()['v'];

    // Net Profit = Total Revenue - Total Expenses
    $netProfit    = $totalRev - $totalExp;

    // This Month
    $thisMonthRev = $db->query("SELECT COALESCE(SUM(COALESCE(extra_paid, 0) + COALESCE(net_amount, 0)),0) AS v FROM bills WHERE YEAR(created_at)=YEAR(CURDATE()) AND MONTH(created_at)=MONTH(CURDATE())")->fetch()['v'];
    $thisMonthExp = $db->query("SELECT COALESCE(SUM(amount),0) AS v FROM expense WHERE YEAR(date)=YEAR(CURDATE()) AND MONTH(date)=MONTH(CURDATE())")->fetch()['v'];
    $thisMonthPkt = $db->query("SELECT COALESCE(SUM(bi.quantity),0) AS v FROM bill_items bi JOIN bills b ON bi.bill_id=b.id WHERE bi.item_type='sale' AND YEAR(b.created_at)=YEAR(CURDATE()) AND MONTH(b.created_at)=MONTH(CURDATE())")->fetch()['v'];
    $thisMonthNetProfit = $thisMonthRev - $thisMonthExp;

    // Last Month
    $lastMonthRev = $db->query("SELECT COALESCE(SUM(COALESCE(extra_paid, 0) + COALESCE(net_amount, 0)),0) AS v FROM bills WHERE created_at >= DATE_SUB(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL 1 MONTH) AND created_at < DATE_FORMAT(CURDATE(), '%Y-%m-01')")->fetch()['v'];
    $lastMonthPkt = $db->query("SELECT COALESCE(SUM(bi.quantity),0) AS v FROM bill_items bi JOIN bills b ON bi.bill_id=b.id WHERE bi.item_type='sale' AND b.created_at >= DATE_SUB(DATE_FORMAT(CURDATE(), '%Y-%m-01'), INTERVAL 1 MONTH) AND b.created_at < DATE_FORMAT(CURDATE(), '%Y-%m-01')")->fetch()['v'];

    $revGrowth = $lastMonthRev > 0 ? (($thisMonthRev - $lastMonthRev) / $lastMonthRev) * 100 : 100;
    $pktGrowth = $lastMonthPkt > 0 ? (($thisMonthPkt - $lastMonthPkt) / $lastMonthPkt) * 100 : 100;

    jsonResponse([
        'total_revenue'      => (float)$totalRev,
        'total_expenses'     => (float)$totalExp,
        'net_profit'         => (float)$netProfit,
        'monthly_revenue'    => (float)$thisMonthRev,
        'monthly_net_profit' => (float)$thisMonthNetProfit,
        'revenue_growth'     => (float)round($revGrowth, 1),
        'monthly_packets'    => (int)$thisMonthPkt,
        'packets_growth'     => (float)round($pktGrowth, 1),
        'today_collection'   => (float)$db->query("SELECT COALESCE(SUM(COALESCE(extra_paid, 0) + COALESCE(net_amount, 0)),0) AS v FROM bills WHERE DATE(created_at)=CURDATE()")->fetch()['v'],
        'shop_count'         => (int)$shopCount,
        'total_packets'      => (int)$totalPackets
    ]);
}

// ------------------------------------------------------------------
// /api/reports/monthly-revenue
// ------------------------------------------------------------------
if ($report === 'monthly-revenue' || $report === 'monthly-revenue-by-year') {
    $stmt = $db->prepare("SELECT MONTH(created_at) AS month, COALESCE(SUM($total_col),0) AS revenue FROM bills WHERE YEAR(created_at)=? GROUP BY MONTH(created_at) ORDER BY month");
    $stmt->execute([$year]);
    $rows = $stmt->fetchAll();
    $months = array_fill(1,12,0);
    foreach ($rows as $r) $months[(int)$r['month']] = (float)$r['revenue'];
    $labels = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    $response = ['labels'=>$labels,'values'=>array_values($months)];
    if ($report==='monthly-revenue-by-year') $response['year']=$year;
    jsonResponse($response);
}

// ------------------------------------------------------------------
// /api/reports/monthly-profit
// ------------------------------------------------------------------
if ($report === 'monthly-profit') {
    // Get Monthly Revenue
    $stmtRev = $db->prepare("SELECT MONTH(created_at) AS month, COALESCE(SUM($total_col),0) AS amount FROM bills WHERE YEAR(created_at)=? GROUP BY MONTH(created_at)");
    $stmtRev->execute([$year]);
    $revRows = $stmtRev->fetchAll();
    
    // Get Monthly Expenses (Table name corrected to 'expense')
    $stmtExp = $db->prepare("SELECT MONTH(date) AS month, COALESCE(SUM(amount),0) AS amount FROM expense WHERE YEAR(date)=? GROUP BY MONTH(date)");
    $stmtExp->execute([$year]);
    $expRows = $stmtExp->fetchAll();

    $profitArray = array_fill(1,12,0);

    // Add Revenue
    foreach ($revRows as $r) {
        $profitArray[(int)$r['month']] += (float)$r['amount'];
    }
    // Subtract Expenses
    foreach ($expRows as $r) {
        $profitArray[(int)$r['month']] -= (float)$r['amount'];
    }

    $labels = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    jsonResponse(['labels' => $labels, 'profit' => array_values($profitArray), 'year' => $year]);
}

// ------------------------------------------------------------------
// /api/reports/monthly-weight-sales
// ------------------------------------------------------------------
if ($report === 'monthly-weight-sales') {
    $stmt = $db->prepare("SELECT MONTH(b.created_at) AS month, SUM(bi.quantity) AS qty FROM bills b JOIN bill_items bi ON b.id=bi.bill_id WHERE YEAR(b.created_at)=? AND bi.item_type='sale' GROUP BY MONTH(b.created_at)");
    $stmt->execute([$year]);
    $rows = $stmt->fetchAll();
    $months = array_fill(1,12,0);
    foreach ($rows as $r) $months[(int)$r['month']] = (float)$r['qty'];
    $labels = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    jsonResponse(['labels'=>$labels,'values'=>array_values($months),'year'=>$year]);
}

// ------------------------------------------------------------------
// /api/reports/monthly-packet-sales
// ------------------------------------------------------------------
if ($report === 'monthly-packet-sales') {
    $stmt = $db->prepare("
        SELECT
            MONTH(b.created_at)  AS month,
            COALESCE(SUM(bi.quantity),0)    AS packets,
            COALESCE(SUM(bi.total_price),0) AS revenue,
            COUNT(DISTINCT b.id) AS bill_count
        FROM bills b
        JOIN bill_items bi ON b.id = bi.bill_id
        WHERE YEAR(b.created_at) = ? AND bi.item_type = 'sale'
        GROUP BY MONTH(b.created_at)
        ORDER BY month
    ");
    $stmt->execute([$year]);
    $rows = $stmt->fetchAll();

    $packets = array_fill(1,12,0);
    $revenue = array_fill(1,12,0);
    $bills   = array_fill(1,12,0);
    foreach ($rows as $r) {
        $packets[(int)$r['month']] = (int)$r['packets'];
        $revenue[(int)$r['month']] = (float)$r['revenue'];
        $bills[(int)$r['month']]   = (int)$r['bill_count'];
    }
    $labels = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    jsonResponse(['labels'=>$labels,'packets'=>array_values($packets),'revenue'=>array_values($revenue),'bills'=>array_values($bills),'year'=>$year]);
}

// ------------------------------------------------------------------
// /api/reports/category-packet-sales — Now by Product
// ------------------------------------------------------------------
if ($report === 'category-packet-sales') {
    $where  = "WHERE bi.item_type = 'sale'";
    $params = [];
    if ($year  > 0) { $where .= ' AND YEAR(b.created_at) = ?';  $params[] = $year;  }
    if ($month > 0) { $where .= ' AND MONTH(b.created_at) = ?'; $params[] = $month; }

    $stmt = $db->prepare("
        SELECT
            bi.product_name AS product,
            COALESCE(SUM(bi.quantity),0)    AS packets,
            COALESCE(SUM(bi.total_price),0) AS revenue
        FROM bill_items bi
        JOIN bills b ON bi.bill_id = b.id
        $where
        GROUP BY product
        ORDER BY packets DESC
    ");
    $stmt->execute($params);
    $rows = $stmt->fetchAll();
    $labels  = array_column($rows,'product');
    $packets = array_map(fn($r)=>(int)$r['packets'], $rows);
    $revenue = array_map(fn($r)=>(float)$r['revenue'], $rows);
    if (empty($labels)) { $labels=['No data']; $packets=[0]; $revenue=[0]; }
    jsonResponse(['labels'=>$labels,'packets'=>$packets,'revenue'=>$revenue]);
}

// ------------------------------------------------------------------
// /api/reports/top-products
// ------------------------------------------------------------------
if ($report === 'top-products') {
    $where  = "WHERE bi.item_type = 'sale'";
    $params = [];
    if ($year  > 0) { $where .= ' AND YEAR(b.created_at) = ?';  $params[] = $year;  }
    if ($month > 0) { $where .= ' AND MONTH(b.created_at) = ?'; $params[] = $month; }

    $stmt = $db->prepare("
        SELECT
            CONCAT(bi.product_name, IF(bi.variant_name != '', CONCAT(' ', bi.variant_name), '')) AS product,
            COALESCE(SUM(bi.quantity),0)    AS packets,
            COALESCE(SUM(bi.total_price),0) AS revenue
        FROM bill_items bi
        JOIN bills b ON bi.bill_id = b.id
        $where
        GROUP BY bi.product_name, bi.variant_name
        ORDER BY packets DESC
        LIMIT 10
    ");
    $stmt->execute($params);
    $rows = $stmt->fetchAll();
    $labels  = array_column($rows,'product');
    $packets = array_map(fn($r)=>(int)$r['packets'], $rows);
    $revenue = array_map(fn($r)=>(float)$r['revenue'], $rows);
    if (empty($labels)) { $labels=['No data']; $packets=[0]; $revenue=[0]; }
    jsonResponse(['labels'=>$labels,'packets'=>$packets,'revenue'=>$revenue]);
}

// ------------------------------------------------------------------
// /api/reports/inventory-status
// ------------------------------------------------------------------
if ($report === 'inventory-status') {
    $rows = $db->query("
        SELECT product_name, category, stock_qty, unit,
            CASE WHEN stock_qty <= 20 THEN 'Out of Stock'
                 WHEN stock_qty <= 40 THEN 'Low Stock'
                 ELSE 'In Stock' END AS computed_status
        FROM inventory
        ORDER BY stock_qty ASC
    ")->fetchAll();

    $summary = ['In Stock'=>0,'Low Stock'=>0,'Out of Stock'=>0];
    foreach ($rows as $r) $summary[$r['computed_status']]++;

    jsonResponse(['items'=>$rows,'summary'=>$summary,'total'=>count($rows)]);
}

// ------------------------------------------------------------------
// /api/reports/sales-by-category — Now by Product
// ------------------------------------------------------------------
if ($report === 'sales-by-category') {
    $stmt = $db->query("
        SELECT bi.product_name AS product, SUM(bi.total_price) AS revenue
        FROM bill_items bi
        WHERE bi.item_type = 'sale'
        GROUP BY product ORDER BY revenue DESC
    ");
    $rows = $stmt->fetchAll();
    $labels = array_column($rows,'product');
    $values = array_map(fn($r)=>(float)$r['revenue'], $rows);
    if (empty($labels)) { $labels=['No data']; $values=[0]; }
    jsonResponse(['labels'=>$labels,'values'=>$values]);
}

// ------------------------------------------------------------------
// /api/reports/sales-by-weight
// ------------------------------------------------------------------
if ($report === 'sales-by-weight') {
    $stmt = $db->query("SELECT variant_name AS weight, SUM(quantity) AS qty FROM bill_items WHERE item_type='sale' GROUP BY variant_name ORDER BY qty DESC");
    $rows = $stmt->fetchAll();
    $labels = array_column($rows,'weight');
    $values = array_map(fn($r)=>(float)$r['qty'], $rows);
    if (empty($labels)) { $labels=['No data']; $values=[0]; }
    jsonResponse(['labels'=>$labels,'values'=>array_values($values)]);
}

// ------------------------------------------------------------------
// /api/reports/expenses-by-category (Table name corrected to 'expense')
// ------------------------------------------------------------------
if ($report === 'expenses-by-category') {
    $where=''; $params=[];
    if ($month>0) { $where.=' AND MONTH(date)=?'; $params[]=$month; }
    if ($year>0)  { $where.=' AND YEAR(date)=?';  $params[]=$year;  }
    $stmt = $db->prepare("SELECT category, COALESCE(SUM(amount),0) AS total FROM expense WHERE 1=1 $where GROUP BY category ORDER BY total DESC");
    $stmt->execute($params);
    $rows = $stmt->fetchAll();
    $labels = array_column($rows,'category');
    $values = array_map(fn($r)=>(float)$r['total'], $rows);
    if (empty($labels)) { $labels=['No data']; $values=[0]; }
    jsonResponse(['labels'=>$labels,'values'=>$values]);
}

// ------------------------------------------------------------------
// /api/reports/top-shops
// ------------------------------------------------------------------
if ($report === 'top-shops') {
    $where=''; $params=[];
    if ($month>0) { $where.=' AND MONTH(b.created_at)=?'; $params[]=$month; }
    if ($year>0)  { $where.=' AND YEAR(b.created_at)=?';  $params[]=$year;  }
    $stmt = $db->prepare("SELECT s.name, COALESCE(SUM(b.$total_col),0) AS revenue FROM bills b LEFT JOIN shops s ON b.shop_id=s.id WHERE 1=1 $where GROUP BY b.shop_id, s.name ORDER BY revenue DESC LIMIT 10");
    $stmt->execute($params);
    $rows = $stmt->fetchAll();
    $labels = array_column($rows,'name');
    $values = array_map(fn($r)=>(float)$r['revenue'], $rows);
    if (empty($labels)) { $labels=['No data']; $values=[0]; }
    jsonResponse(['labels'=>$labels,'values'=>$values]);
}

errorResponse("Unknown report: $report", 404);