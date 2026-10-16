<?php
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
    <title>Account Settings | Rasaviyana Products</title>
    <link rel="stylesheet" href="style.css">
    <script src="auth_guard.js"></script>
    <script src="path/to/your/auth-guard.js"></script>
    <link rel="stylesheet" href="settings.css">
    <script src="https://unpkg.com/lucide@latest"></script>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
</head>
<body class="premium-theme">
    <div class="app-container">
        <!-- Sidebar -->
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
                <a href="alert.php" class="nav-item">
                    <i data-lucide="alert-triangle"></i>
                    <span>Alert</span>
                </a>
                <a href="settings.php" class="nav-item active">
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
            <header class="top-bar-premium">
                <div class="header-breadcrumb">
                    <button id="sidebar-toggle" class="mobile-only"><i data-lucide="menu"></i></button>
                    <span class="breadcrumb-item">Preferences</span>
                    <span class="breadcrumb-sep">/</span>
                    <span class="breadcrumb-current">Account Settings</span>
                </div>
                <div class="header-actions">
                    <span id="settings-save-status" class="status-indicator">All changes synced</span>
                </div>
            </header>

            <div class="dashboard-content mobile-scroll">
                <div class="settings-standalone-container">
                    
                    <!-- Settings Tab Control -->
                    <div class="settings-glass-sidebar">
                        <div class="settings-tab-btn active" data-section="profile">
                            <i data-lucide="user"></i> <span>Profile Details</span>
                        </div>
                        <div class="settings-tab-btn" data-section="notifications">
                            <i data-lucide="bell"></i> <span>Notifications</span>
                        </div>
                        <div class="settings-tab-btn" data-section="security">
                            <i data-lucide="shield-check"></i> <span>Security</span>
                        </div>
                        <div class="settings-tab-btn" data-section="account">
                            <i data-lucide="key-round"></i> <span>Password</span>
                        </div>
                        <div class="settings-tab-btn" onclick="handleLogout()">
                            <i data-lucide="log-out"></i> <span>Logout</span>
                        </div>
                        
                    </div>

                    <!-- Dynamic Settings Content Area -->
                    <div id="settings-content" class="settings-main-portal">
                        <!-- Content loaded by JS -->
                        <div class="settings-loading-state">
                            <i data-lucide="loader" class="spin"></i>
                            <p>Loading your preferences...</p>
                        </div>
                    </div>

                </div>
            </div>
        </main>
    </div>

    <script src="settings.js"></script>
    <script>
        lucide.createIcons();
    </script>
</body>
</html>
