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
    <title>Document</title>
    <link rel="stylesheet" href="users.css">
    <link rel="stylesheet" href="style.css">
    <!-- Lucide Icons -->
    <script src="https://unpkg.com/lucide@latest"></script>
    <!-- Chart.js -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
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
                <a href="users.php" class="nav-item active">
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

        <main class="main-content">
            <header class="top-bar">
                <button id="sidebar-toggle" class="mobile-only">
                    <i data-lucide="menu"></i>
                </button>
                <h1>User Management</h1>
                    <div class="header-actions">
                        <button class="btn-text" id="add-user-btn" onclick="openAddUserModal()">
                            <i data-lucide="user-plus"></i>
                        </button>
                    </div>
            </header>

            <div class="dashboard-content mobile-scroll">

                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon users-total"><i data-lucide="users"></i></div>
                        <div class="stat-info">
                            <h3>Total Users</h3>
                            <p class="stat-value" id="total-users-count">05</p>
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-icon users-admin"><i data-lucide="shield-check"></i></div>
                        <div class="stat-info">
                            <h3>Active Admin</h3>
                            <p class="stat-value" id="total-admin-count">02</p>
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon users-manager"><i data-lucide="user-check"></i></div>
                        <div class="stat-info">
                            <h3>Active Manager</h3>
                            <p class="stat-value" id="total-manager-count">02</p>
                        </div>
                    </div>
                </div>

                <!-- Filter & Search Bar -->

                <div class="filter-bar">
                    <div class="filter-group">
                        <select id="role-filter">
                            <option value="">All Toles</option>
                            <option value="Admin">Admin</option>
                            <option value="Manager">Manager</option>
                        </select>
                    </div>

                    <div class="search-group">
                        <i data-lucide="search" class="search"></i>
                        <input type="text" id="search-users" placeholder="Search users by name or email ...">
                    </div>
                </div>

                <!-- USer Card List -->

                <div class="users-list" id="users-container">

                    <!-- User Card 1 -->

                    
                    <!-- User Card 2 -->

                    
                </div>

                <!-- Edit User Modal -->
<div id="edit-user-modal" class="modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); justify-content: center; align-items: center; z-index: 1000;">
    <div class="modal-content" style="background: #fff; padding: 30px; border-radius: 8px; width: 400px; max-width: 90%;">
        <h3>Edit User Details</h3>
        <form id="edit-user-form" style="margin-top: 15px;">
            <input type="hidden" id="edit-user-id">
            <input type="hidden" id="edit-username">
            
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; font-weight: 500;">Full Name</label>
                <input type="text" id="edit-full-name" required style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
            </div>

            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; font-weight: 500;">Email</label>
                <input type="email" id="edit-email" required style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
            </div>

            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; font-weight: 500;">Phone</label>
                <input type="text" id="edit-phone" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
            </div>

            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 5px; font-weight: 500;">Role</label>
                <select id="edit-role" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                    <option value="">Select Role</option>
                    <option value="Admin">Admin</option>
                    <option value="Manager">Manager</option>
                    <option value="Staff">Staff</option>
                </select>
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 10px;">
                <button type="button" onclick="closeEditModal()" style="padding: 8px 15px; background: #ccc; border: none; border-radius: 4px; cursor: pointer;">Cancel</button>
                <button type="submit" style="padding: 8px 15px; background: #ff8c00; color: #fff; border: none; border-radius: 4px; cursor: pointer;">Save Changes</button>
            </div>
        </form>
    </div>
</div>

            </div>         

        </main>

    </div>


<!-- Add User Modal -->
<div id="add-user-modal" class="modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); justify-content: center; align-items: center; z-index: 1000;">
    <div class="modal-content" style="background: #fff; padding: 30px; border-radius: 8px; width: 400px; max-width: 90%;">
        <h3>Add New User</h3>
        <form id="add-user-form" style="margin-top: 15px;">
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; font-weight: 500;">Username</label>
                <input type="text" id="add-username" required style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
            </div>

            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; font-weight: 500;">Full Name</label>
                <input type="text" id="add-full-name" required style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
            </div>

            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; font-weight: 500;">Email</label>
                <input type="email" id="add-email" required style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
            </div>

            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; font-weight: 500;">Phone</label>
                <input type="text" id="add-phone" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
            </div>

            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; font-weight: 500;">Role</label>
                <select id="add-role" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                    <option value="Admin">Admin</option>
                    <option value="Manager">Manager</option>
                    <option value="Staff">Staff</option>
                </select>
            </div>

            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 5px; font-weight: 500;">Password</label>
                <input type="password" id="add-password" required placeholder="Default: 123456" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
            </div>

            <div style="display: flex; justify-content: flex-end; gap: 10px;">
                <button type="button" onclick="closeAddUserModal()" style="padding: 8px 15px; background: #ccc; border: none; border-radius: 4px; cursor: pointer;">Cancel</button>
                <button type="submit" style="padding: 8px 15px; background: #ff8c00; color: #fff; border: none; border-radius: 4px; cursor: pointer;">Add User</button>
            </div>
        </form>
    </div>
</div>






















    <script>
        lucide.createIcons();
    </script>
    <script src="users.js"></script>
</body>
</html>