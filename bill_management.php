<?php

session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/',
    'domain' => '',
    'secure' => false,
    'httponly' => true,
    'samesite' => 'Lax'
]);

session_start();

if (!isset($_SESSION['user_id'])) {
    header("Location: index.php");
    exit();
}

$displayName = $_SESSION['full_name'] ?? $_SESSION['username'] ?? 'User';
$roleStr = strtoupper($_SESSION['role'] ?? '');
$isAdmin = (strtolower($_SESSION['role'] ?? '') === 'admin');
$avatarBg = $isAdmin ? 'ff8c00' : '3b82f6';
?>
<?php
require_once __DIR__ . '/backend/db.php';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="bill_management.css">
    <link rel="stylesheet" href="style.css">
    <!-- Lucide Icons -->
    <script src="https://unpkg.com/lucide@latest"></script>
    <!-- Chart.js -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <title>Bill Management</title>
</head>
<body>

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

                <a href="bill_management.php" class="nav-item active">
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
    <div class="main-content">
        <!-- Top Navbar -->
        <div class="top-navbar">
            <h2>Bills Management</h2>
        </div>

        <!-- Content Body -->
        <div class="content-body">
            <div class="card">
                <div class="header-section">
                    <!-- Search Input -->
                    <div class="search-box">
                        <i data-lucide="search" class="search-icon"></i>
                        <input type="text" id="searchInput" placeholder="Search by Bill No, Date, Notes..." onkeyup="filterBills()">
                    </div>
                </div>

                <!-- Bills Table -->
                <div class="table-responsive">
                    <table id="billsTable">
                        <thead>
                            <tr>
                                <th>Bill ID / No</th>
                                <th>Date</th>
                                <th>Total Amount (LKR)</th>
                                <th>Net Amount</th>
                                <th>Notes</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody id="billsTableBody">
                            <tr>
                                <td colspan="6" class="no-data">Loading bills...</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>

    <script>
        lucide.createIcons();
    </script>

<script src="bill_management.js"></script>
</body>
</html>