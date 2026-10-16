<?php
session_set_cookie_params(0);
ini_set('session.gc_maxlifetime', 0);

session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/',
    'domain' => '',
    'secure' => false,
    'httponly' => true,
    'samesite' => 'Lax'
]);

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

if (!isset($_SESSION['user_id'])) {
    header("Location: index.php");
    exit();
}

$displayName = $_SESSION['full_name'] ?? $_SESSION['username'] ?? 'User';
$roleStr = strtoupper($_SESSION['role'] ?? '');
$isAdmin = (strtolower($_SESSION['role'] ?? '') === 'admin');
$avatarBg = $isAdmin ? 'ff8c00' : '3b82f6';
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reports & Analytics | Rasaviyana Products</title>
    <link rel="stylesheet" href="style.css">
    <!-- <script src="auth_guard.js"></script> -->
    <link rel="stylesheet" href="report.css">
    <script src="https://unpkg.com/lucide@latest"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <!-- Chart.js -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
</head>
<body>
    <div class="app-container">
        <!-- Sidebar -->
       <aside class="sidebar">
            <div class="sidebar-header">
                <div class="logo-icon">
                    <i data-lucide="chef-hat"></i>
                </div>
                <h2>Rasaviyana Inventory</h2>
            </div>

          <nav class="sidebar-nav" style="scrollbar-width: none; -ms-overflow-style: none;">
                <a href="dashboard.php" class="nav-item">
                    <i data-lucide="layout-dashboard"></i>
                    <span>Dashboard</span>
                </a>
                <a href="dashboard.php#inventory" class="nav-item">
                    <i data-lucide="package"></i>
                    <span>Inventory</span>
                </a>
                <a href="dashboard.php#products" class="nav-item">
                    <i data-lucide="box"></i>
                    <span>Products</span>
                </a>
                <a href="dashboard.php#shops" class="nav-item">
                    <i data-lucide="store"></i>
                    <span>Shops</span>
                </a>
                <a href="dashboard.php#outstanding" class="nav-item">
                    <i data-lucide="wallet-cards"></i>
                    <span>Outstanding</span>
                </a>
                <a href="dashboard.php#expenses" class="nav-item">
                    <i data-lucide="receipt"></i>
                    <span>Expenses</span>
                </a>

                <a href="bill_management.php" class="nav-item">
                    <i data-lucide="file-text"></i>
                    <span>Bills</span>
                </a>

                <a href="batches.php" class="nav-item">
                    <i data-lucide="layers"></i>
                    <span>Batches</span>
                </a>

                <a href="report.php" class="nav-item active">
                    <i data-lucide="bar-chart-3"></i>
                    <span>Reports</span>
                </a>
                <a href="users.php" class="nav-item">
                    <i data-lucide="users"></i>
                    <span>Users</span>
                </a>
                <a href="alert.php" class="nav-item">
                    <i data-lucide="alert-triangle"></i>
                    <span>Alert</span>
                </a>
                <a href="settings.php" class="nav-item">
                    <i data-lucide="settings"></i>
                    <span>Settings</span>
                </a>
            </nav>
            <div class="sidebar-footer">
                <div class="user-info">
                    <img src="https://ui-avatars.com/api/?name=<?php echo urlencode($displayName); ?>&background=<?php echo $avatarBg; ?>" alt="User">
                    <div>
                        <h4><?php echo htmlspecialchars($displayName); ?></h4>
                        <p><?php echo htmlspecialchars($roleStr); ?></p>
                    </div>
                </div>
            </div>
        </aside>

        <!-- Main Content -->
        <main class="main-content">
            <header class="top-bar">
                <button id="sidebar-toggle" class="mobile-only"><i data-lucide="menu"></i></button>
                <h1>Reports & Analytics</h1>
                <div class="header-actions">
                    <button class="btn-text" id="refresh-reports-btn">
                        <i data-lucide="refresh-cw"></i> Refresh
                    </button>
                    <div style="display: flex; gap: 10px; margin-left: 15px;">
                        <select id="rpt-year" style="padding: 6px 12px; border-radius: 6px; border: 1px solid #ccc;"></select>
                        <select id="rpt-month" style="padding: 6px 12px; border-radius: 6px; border: 1px solid #ccc;">
                            <option value="0">All Year</option>
                            <option value="1">January</option><option value="2">February</option>
                            <option value="3">March</option><option value="4">April</option>
                            <option value="5">May</option><option value="6">June</option>
                            <option value="7">July</option><option value="8">August</option>
                            <option value="9">September</option><option value="10">October</option>
                            <option value="11">November</option><option value="12">December</option>
                        </select>
                    </div>
                </div>
            </header>

            <div class="dashboard-content mobile-scroll">
                
                <!-- KPI Statistics Row -->
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon icon-sales"><i data-lucide="banknote"></i></div>
                        <div class="stat-info">
                            <h3>Total Revenue</h3>
                            <p class="stat-value" id="rpt-total-revenue">LKR 0</p>
                            <span class="stat-sub">For selected period</span>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon icon-batch"><i data-lucide="shopping-bag"></i></div>
                        <div class="stat-info">
                            <h3>Packets Sold</h3>
                            <p class="stat-value" id="rpt-total-packets">0</p>
                            <span class="stat-sub">Across all products</span>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon icon-income" style="background: rgba(16, 185, 129, 0.1); color: #10b981;"><i data-lucide="line-chart"></i></div>
                        <div class="stat-info">
                            <h3>Total Net Profit</h3>
                            <p class="stat-value" id="rpt-net-profit" style="color: #10b981;">LKR 0</p>
                            <span class="stat-sub">Revenue - Expenses</span>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon icon-stock"><i data-lucide="box"></i></div>
                        <div class="stat-info">
                            <h3>Top Selling Category</h3>
                            <p class="stat-value" id="rpt-top-category" style="font-size: 1.2rem;">-</p>
                            <span class="stat-sub">Highest by volume</span>
                        </div>
                    </div>
                </div>

                <!-- Charts Layout -->
                <div class="main-grid" style="margin-top: 25px;">
                    <!-- Revenue Timeline -->
                    <div class="grid-col" style="grid-column: span 2;">
                        <div class="card">
                            <div class="card-header" style="padding: 15px 20px; border-bottom: 1px solid #eee;">
                                <h3 style="margin:0; font-size: 1.1rem;">Revenue Timeline View</h3>
                                
                                <div style="margin-top: 15px; margin-bottom: 5px;">
                                    <label style="font-size: 0.9rem; font-weight: 500; margin-right: 10px;">Filter Product Group:</label>
                                    <select id="rpt-product-filter" style="padding: 5px 10px; border-radius: 4px; border: 1px solid #ddd;">
                                        <option value="all">All Products</option>
                                    </select>
                                </div>
                            </div>
                            <div class="card-body" style="padding: 20px; height: 350px;">
                                <canvas id="timelineChart"></canvas>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Sales by Product -->
                    <div class="grid-col">
                        <div class="card">
                            <div class="card-header" style="padding: 15px 20px; border-bottom: 1px solid #eee;">
                                <h3 style="margin:0; font-size: 1.1rem;">Sales Distribution (By Packet)</h3>
                            </div>
                            <div class="card-body" style="padding: 20px; height: 350px; display: flex; justify-content: center; align-items: center;">
                                <canvas id="compositionChart"></canvas>
                            </div>
                        </div>
                    </div>

                    <!-- Monthly Profit Trend -->
                    <div class="grid-col">
                        <div class="card">
                            <div class="card-header" style="padding: 15px 20px; border-bottom: 1px solid #eee;">
                                <h3 style="margin:0; font-size: 1.1rem;">Monthly Profit Trend</h3>
                            </div>
                            <div class="card-body" style="padding: 20px; height: 350px;">
                                <canvas id="profitChart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Product Detail Performance Table -->
                <div class="card table-card" style="margin-top: 25px;">
                    <div class="card-header" style="padding: 15px 20px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
                        <h3 style="margin:0; font-size: 1.1rem;">Product Performance Detail</h3>
                    </div>
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Product Group</th>
                                <th>Avg. Price</th>
                                <th style="text-align: right;">Total Packets Sold</th>
                                <th style="text-align: right;">Gross Revenue (LKR)</th>
                                <th style="text-align: right;">Share</th>
                            </tr>
                        </thead>
                        <tbody id="rpt-performance-table">
                            <!-- JS Generated -->
                            <tr><td colspan="5" style="text-align:center; padding:30px;">Loading performance data...</td></tr>
                        </tbody>
                    </table>
                </div>

            </div>
        </main>
    </div>

    <script src="report.js"></script>
    <script>
        lucide.createIcons();
    </script>
</body>
</html>
