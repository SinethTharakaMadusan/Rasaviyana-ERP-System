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
$shopNameParam = $_GET['shop'] ?? '';
$back_url = "billing.php" . (!empty($shopNameParam) ? "?shop=" . urlencode($shopNameParam) : "");
?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Shop History | Rasaviyana Products</title>
    <link rel="stylesheet" href="style.css">
    <link rel="stylesheet" href="billing.css">
    <link rel="stylesheet" href="history.css">
   
    <!-- Lucide Icons -->
    <script src="https://unpkg.com/lucide@latest"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
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

            <nav class="sidebar-nav">
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
                <a href="dashboard.php#shops" class="nav-item active">
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
                <a href="dashboard.php" class="nav-item">
                    <i data-lucide="bar-chart-3"></i>
                    <span>Reports</span>
                </a>
                <a href="dashboard.php#users" class="nav-item">
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
                    <img src="https://ui-avatars.com/api/?name=Admin+User&background=random" alt="User">
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
                <button id="sidebar-toggle" class="mobile-only">
                    <i data-lucide="menu"></i>
                </button>
                <a href="<?php echo $back_url; ?>" id="back-to-billing" class="btn-text">
                    <i data-lucide="arrow-left"></i>
                </a>

                <h1>Shop History</h1>
                
            </header>

            <div class="dashboard-content mobile-scroll">
                <div class="section-header"
                    style="justify-content: space-between; align-items: center; margin-bottom: 25px;">
                    <div>
                        <h2 id="history-shop-name" style="font-size: 1.5rem; color: var(--primary-color);">History:
                            Loading...</h2>
                        <p id="history-shop-details" style="color: var(--text-muted); font-size: 0.9rem;">Seller Details
                            Placeholder</p>
                    </div>
                    <div class="outstanding-badge" id="total-outstanding-badge">
                        <i data-lucide="alert-circle" class="outstanding-icon" style="width: 16px; height: 16px;"></i>
                        Current Outstanding: <span id="current-outstanding-val">LKR 0.00</span>
                    </div>
                </div>

                <!-- Monthly History Container -->
                <div id="history-container">
                    <!-- Months will be injected here by history.js -->
                </div>
            </div>
        </main>
    </div>

    <!-- For sidebar toggle on mobile -->
    <script>
        const sidebar = document.querySelector('.sidebar');
        const sidebarToggle = document.getElementById('sidebar-toggle');
        const overlay = document.createElement('div');
        overlay.className = 'overlay';
        document.querySelector('.app-container').appendChild(overlay);

        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
            overlay.classList.toggle('active');
        });

        overlay.addEventListener('click', () => {
            sidebar.classList.remove('open');
            overlay.classList.remove('active');
        });
    </script>
    <script src="history.js"></script>
    <script>
        lucide.createIcons();
    </script>
</body>

</html>