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
    <title>System Alerts | Rasaviyana Products</title>
    <link rel="stylesheet" href="style.css">
    <!-- <script src="auth_guard.js"></script> -->
    <link rel="stylesheet" href="alert.css">
    <script src="https://unpkg.com/lucide@latest"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body>
    <div class="app-container">
        <!-- Sidebar (Reused from existing pages) -->
        <aside class="sidebar">
            <div class="sidebar-header">
                <div class="logo-icon"><i data-lucide="chef-hat"></i></div>
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

                <a href="report.php" class="nav-item">
                    <i data-lucide="bar-chart-3"></i>
                    <span>Reports</span>
                </a>
                <a href="users.php" class="nav-item">
                    <i data-lucide="users"></i>
                    <span>Users</span>
                </a>
                <a href="alert.php" class="nav-item active">
                    <i data-lucide="alert-triangle"></i>
                    <span>Alert</span>
                </a>
                <a href="settings.php" class="nav-item">
                    <i data-lucide="settings"></i>
                    <span>Settings</span>
                </a>
            </nav>
            <div class="sidebar-footer" id="sidebar-user-container" style="cursor: pointer;">
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
                <div class="header-left">
                    <a href="index.php" class="btn-text"><i data-lucide="arrow-left"></i></a>
                    <h1>System Alerts</h1>
                </div>
                <!-- <div class="header-right">
                    <button id="alert-refresh-btn" class="btn-primary">
                        <i data-lucide="refresh-cw"></i> Refresh Alerts
                    </button>
                </div> -->
            </header>

            <div class="alert-page-content dashboard-content mobile-scroll">
                <!-- Alert Summary Cards -->
                <div class="alert-summary-grid">
                    <div class="alert-card-kpi kpi-critical">
                        <div class="kpi-icon"><i data-lucide="alert-circle"></i></div>
                        <div class="kpi-body">
                            <span class="kpi-label">Critical Issues</span>
                            <span class="kpi-value" id="critical-count">0</span>
                        </div>
                    </div>
                    <div class="alert-card-kpi kpi-warning">
                        <div class="kpi-icon"><i data-lucide="alert-triangle"></i></div>
                        <div class="kpi-body">
                            <span class="kpi-label">Warnings</span>
                            <span class="kpi-value" id="warning-count">0</span>
                        </div>
                    </div>
                    <div class="alert-card-kpi kpi-total">
                        <div class="kpi-icon"><i data-lucide="bell"></i></div>
                        <div class="kpi-body">
                            <span class="kpi-label">Total Notifications</span>
                            <span class="kpi-value" id="total-count">0</span>
                        </div>
                    </div>
                </div>

                <!-- Filters & Controls -->
                <div class="alert-filter-bar card">
                    <div class="filter-group">
                        <label for="filter-type">Severity</label>
                        <select id="filter-type">
                            <option value="all">All Severities</option>
                            <option value="critical">Critical Only</option>
                            <option value="warning">Warnings Only</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label for="filter-category">Category</label>
                        <select id="filter-category">
                            <option value="all">All Categories</option>
                            <option value="inventory">Inventory & Stock</option>
                            <option value="payment">Shops & Collection</option>
                        </select>
                    </div>
                    <div class="filter-search">
                        <i data-lucide="search"></i>
                        <input type="text" id="alert-search" placeholder="Search alerts...">
                    </div>
                </div>

                <!-- Alert Feed -->
                <div id="alert-feed-container" class="alert-feed">
                    <div class="alert-loading">
                        <div class="alert-spinner"></div>
                        <p>Analyzing system health...</p>
                    </div>
                </div>
            </div>
        </main>
    </div>

    <script src="alert_page.js"></script>
    <script>
        lucide.createIcons();
    </script>
</body>
</html>
