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

$conn = getDB();

// 1. Total Monthly Sales (extra_paid + notes amount = extra_paid + (total_amount - net_amount))
$current_month = date('Y-m');
$stmt = $conn->prepare("
    SELECT 
        COALESCE(SUM(COALESCE(extra_paid, 0) + (COALESCE(total_amount, 0) - COALESCE(net_amount, 0))), 0) AS total_collected
    FROM bills 
    WHERE DATE_FORMAT(created_at, '%Y-%m') = ?
");
$stmt->execute([$current_month]);
$result = $stmt->fetch(PDO::FETCH_ASSOC);
$monthly_sales = $result['total_collected'] ?? 0;

// 2. Today's Payment (extra_paid + (total_amount - net_amount))
$today = date('Y-m-d');
$stmt = $conn->prepare("
    SELECT 
        COALESCE(SUM(COALESCE(extra_paid, 0) + (COALESCE(total_amount, 0) - COALESCE(net_amount, 0))), 0) AS total_collected
    FROM bills 
    WHERE DATE(bill_date) = ?
");
$stmt->execute([$today]);
$today_result = $stmt->fetch(PDO::FETCH_ASSOC);
$today_payment = $today_result['total_collected'] ?? 0;

// 3. Total Debt
$stmt = $conn->prepare("SELECT SUM(net_amount) as total_debt, COUNT(DISTINCT shop_id) as shop_count FROM bills");
$stmt->execute();
$debt_data = $stmt->fetch(PDO::FETCH_ASSOC);
$total_debt = $debt_data['total_debt'] ?? 0;
$shop_count = $debt_data['shop_count'] ?? 0;

// 4. Active Batches
$active_batches = 0;
try {
    $stmt = $conn->prepare("SELECT COUNT(*) as active_batches FROM batches");
    $stmt->execute();
    $active_batches_data = $stmt->fetch(PDO::FETCH_ASSOC);
    $active_batches = $active_batches_data['active_batches'] ?? 0;
} catch (PDOException $e) {
    $active_batches = 0;
}

$low_stock_count = 0;
try {
    $stmt = $conn->prepare("SELECT COUNT(*) as low_stock FROM inventory WHERE status = 'Out of Stock'");
    $stmt->execute();
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    $low_stock_count = $result['low_stock'] ?? 0;
} catch (PDOException $e) {
    $low_stock_count = 0;
}
?>

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Spice ERP Admin | Thunapaha Business</title>
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
                <a href="#" class="nav-item active">
                    <i data-lucide="layout-dashboard"></i>
                    <span>Dashboard</span>
                </a>
                <a href="#" class="nav-item">
                    <i data-lucide="package"></i>
                    <span>Inventory</span>
                </a>
                <a href="#" class="nav-item">
                    <i data-lucide="box"></i>
                    <span>Products</span>
                </a>
                <a href="#" class="nav-item">
                    <i data-lucide="store"></i>
                    <span>Shops</span>
                </a>
                <a href="#" class="nav-item">
                    <i data-lucide="wallet-cards"></i>
                    <span>Outstanding</span>
                </a>
                <a href="#" class="nav-item">
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

        <!-- Main Content (Placeholder for next step) -->
        <main class="main-content">
            <header class="top-bar">
                <button id="sidebar-toggle" class="mobile-only">
                    <i data-lucide="menu"></i>
                </button>
                <h1>Dashboard</h1>
                <div class="batch-btn">
                    <button id="open-batch-modal-btn" class="btn-primary" style="display: flex; align-items: center; gap: 6px; padding: 10px 18px; border-radius: 8px; background: #ff8c00; color: #fff; border: none; font-weight: 600; cursor: pointer;">
                        <i data-lucide="plus-circle" style="width: 18px; height: 18px;"></i>
                        <span>Generate Batch</span>
                    </button>
                </div>
            </header>

            <!-- Dashboard content -->
            <div class="dashboard-content" id="dashboard-view">
            <!-- Settings Page Content (hidden by default) -->
            <div class="dashboard-content" id="settings-view" style="display:none;">
                <div class="settings-container" style="display: flex; min-height: 500px;">
                    <div class="settings-sidebar" style="width:220px; background:#222e3c; color:#fff; padding:30px 0; border-radius:8px 0 0 8px;">
                        <h2 style="text-align:center; margin-bottom:30px; font-size:1.5em;">Settings</h2>
                        <ul style="list-style:none; padding:0;">
                            <li style="margin:20px 0;"><a href="#profile" class="settings-link" style="color:#fff; text-decoration:none; padding:10px 20px; display:block; border-radius:4px;">Profile</a></li>
                            <li style="margin:20px 0;"><a href="#account" class="settings-link" style="color:#fff; text-decoration:none; padding:10px 20px; display:block; border-radius:4px;">Account</a></li>
                            <li style="margin:20px 0;"><a href="#notifications" class="settings-link" style="color:#fff; text-decoration:none; padding:10px 20px; display:block; border-radius:4px;">Notifications</a></li>
                            <li style="margin:20px 0;"><a href="#security" class="settings-link" style="color:#fff; text-decoration:none; padding:10px 20px; display:block; border-radius:4px;">Security</a></li>
                        </ul>
                    </div>
                    <div class="settings-main" id="settings-content" style="flex:1; background:#fff; padding:40px; border-radius:0 8px 8px 0; min-height:400px;">
                        <h2>Profile Settings</h2>
                        <p>Select a section from the sidebar.</p>
                    </div>
                </div>
            </div>

            <!-- Alert Page Content (hidden by default) -->
            <div class="dashboard-content" id="alert-view" style="display:none;">
                <div class="section-header">
                    <h2>System Alerts</h2>
                </div>
                <div class="card" style="padding: 24px; max-width: 600px; margin: 40px auto; text-align: center;">
                    <i data-lucide="alert-triangle" style="color: #f59e42; width: 48px; height: 48px;"></i>
                    <h3 style="margin-top: 16px; color: #f59e42;">No critical alerts at this time.</h3>
                    <p style="color: #888; margin-top: 8px;">All systems are running smoothly. Any important alerts will appear here.</p>
                </div>
            </div>

                <!-- Statistics Row -->
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon icon-sales">
                            <i data-lucide="trending-up"></i>
                        </div>
                        <div class="stat-info">
                            <h3>Total Monthly Sales</h3>
                            <p class="stat-value">LKR <?php echo number_format($monthly_sales, 2); ?></p>
                            <span class="stat-trend trend-up">
                                <i data-lucide="arrow-up-right"></i> +12.5%
                            </span>
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-icon icon-income" style="background: rgba(16, 185, 129, 0.1); color: #10b981;">
                            <i data-lucide="banknote"></i>
                        </div>
                        <div class="stat-info">
                            <h3>Today's Payment</h3>
                            <p class="stat-value" id="dash-today-collection">LKR <?php echo number_format($today_payment, 2); ?> </p>
                            <span class="stat-sub">Daily Total</span>
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-icon icon-debt">
                            <i data-lucide="wallet-cards"></i>
                        </div>
                        <div class="stat-info">
                            <h3>Total Debt</h3>
                            <p class="stat-value text-danger">LKR <?php echo number_format($total_debt, 2); ?></p>
                            <span class="stat-sub">From <?php echo $shop_count; ?> Shops</span>
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-icon icon-batch">
                            <i data-lucide="package-check"></i>
                        </div>
                        <div class="stat-info">
                            <h3>Active Batches</h3>
                            <p class="stat-value"><?php echo $active_batches; ?></p>
                            <span class="stat-sub">In Stock</span>
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-icon icon-stock">
                            <i data-lucide="alert-triangle"></i>
                        </div>
                        <div class="stat-info">
                            <h3>Low Stock Alert</h3>
                            <p class="stat-value"><?php echo $low_stock_count; ?> Items</p>
                            <span class="stat-sub text-warning">Restock Needed</span>
                        </div>
                    </div>
                </div>

                <!-- Main Grid: Recent Sales & Batch Warnings -->
                <div class="main-grid">

                    <!-- Recent Sales Column -->
                    <div class="grid-col sales-section">
                        <div class="section-header">
                            <h2>Recent Sales</h2>
                            <button class="btn-text">View All</button>
                        </div>
                        <div class="card table-card">
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th>Shop Name</th>
                                        <th>Date</th>
                                        <th class="text-right">Amount (LKR)</th>
                                    </tr>
                                </thead>
                                <tbody id="recent-sales-body">
                                    <!-- Populated by JS -->
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- Batch Expiry Column -->
                    <div class="grid-col expiry-section">
                        <div class="section-header">
                            <h2>Batch Expiry Warning</h2>
                            <span class="badge badge-warning">Next 30 Days</span>
                        </div>
                        <div class="card list-card">
                            <ul class="expiry-list" id="expiry-list">
                    <!-- Populated by JS -->
                            </ul>
                        </div>
                    </div>

                </div>

            </div>

            <!-- Inventory Content (Initially Hidden) -->
            <div class="dashboard-content mobile-scroll" id="inventory-view" style="display: none;">

                <!-- Inventory Controls -->
                <div class="inventory-controls card">
                    <div class="search-bar">
                        <i data-lucide="search"></i>
                        <input type="text" placeholder="Search products, codes...">
                    </div>
                    <div class="filters">
                        <select>
                            <option>All Categories</option>
                            <option>Spices</option>
                            <option>Powders</option>
                            <option>Mixes</option>
                        </select>
                        <select>
                            <option>All Status</option>
                            <option>In Stock</option>
                            <option>Low Stock</option>
                            <option>Out of Stock</option>
                        </select>
                    </div>
                </div>

                <!-- Inventory Table -->
                <div class="card table-card">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Product Name</th>
                                <th>Code</th>
                                <th>Category</th>
                                <th class="text-right">Stock Qty</th>
                                <th>Unit</th>
                                <th>Status</th>
                                <th class="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="inventory-table-body">
                            <tr>
                                <td colspan="7" style="text-align: center; padding: 40px;">
                                    <i data-lucide="loader" style="animation: spin 1s linear infinite;"></i>
                                    <p style="margin-top: 10px; color: #666;">Loading inventory...</p>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

            </div>

            <!-- Edit Inventory Modal -->
            <div class="modal" id="edit-inventory-modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2><i data-lucide="package"></i> Update Inventory</h2>
                        <button class="close-btn" onclick="closeEditInventoryModal()">
                            <i data-lucide="x"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="product-info-header" id="edit-inventory-product-info">
                            <h3 id="edit-inventory-product-name">Product Name</h3>
                            <span class="product-code" id="edit-inventory-code">Code: R-001</span>
                        </div>
                        
                        <div class="form-group">
                            <label>Current Stock</label>
                            <div class="current-stock-display" id="edit-inventory-current-stock">
                                <span class="stock-value">0</span>
                                <span class="stock-unit">Packets</span>
                            </div>
                        </div>

                        <div class="form-group">
                            <label for="edit-inventory-new-qty">New Stock Quantity *</label>
                            <input type="number" id="edit-inventory-new-qty" min="0" placeholder="Enter new quantity" oninput="autoUpdateInventoryStatus()">
                        </div>

                        <div class="form-group">
                            <label for="edit-inventory-unit">Unit</label>
                            <select id="edit-inventory-unit">
                                <option value="Packets">Packets</option>
                                <option value="Kg">Kg</option>
                                <option value="Pieces">Pieces</option>
                                <option value="Bottles">Bottles</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label for="edit-inventory-status">Status <small style="color: #888;">(Auto-calculated)</small></label>
                            <select id="edit-inventory-status" disabled style="background-color: #f5f5f5;">
                                <option value="In Stock">In Stock</option>
                                <option value="Low Stock">Low Stock</option>
                                <option value="Out of Stock">Out of Stock</option>
                            </select>
                            <small style="color: #666; font-size: 0.8rem;">0 = Out of Stock, 1-10 = Low Stock, 11+ = In Stock</small>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn-secondary" onclick="closeEditInventoryModal()">Cancel</button>
                        <button class="btn-primary" id="save-inventory-btn">
                            <i data-lucide="save"></i> Update Stock
                        </button>
                    </div>
                </div>
            </div>

            <!-- Products View (New) -->
            <div class="dashboard-content mobile-scroll" id="products-view" style="display: none;">
                
                <!-- Products Controls -->
                <div class="inventory-controls card">
                    <div class="search-bar">
                        <i data-lucide="search"></i>
                        <input type="text" placeholder="Search products...">
                    </div>
                    <div class="filters">
                        <select>
                            <option>All Products</option>
                            <option>Active</option>
                            <option>Inactive</option>
                        </select>
                        <button class="btn-primary" onclick="openAddProductModal()">
                            <i data-lucide="plus"></i> Add New Product
                        </button>
                    </div>
                </div>

                <!-- Products Table -->
                <div class="card table-card">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Product Name</th>
                                <th>Category</th>
                                <th>Sizes Available</th>
                                <th class="text-right">Unit Price (LKR)</th>
                                <th>Status</th>
                                <th class="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="products-table-body">
                            <tr>
                                <td colspan="6" style="text-align: center; padding: 40px;">
                                    <div style="display: inline-block;">
                                        <i data-lucide="loader" style="animation: spin 1s linear infinite;"></i>
                                        <p style="margin-top: 10px; color: #666;">Loading products...</p>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

            </div>

            <!-- Shops View -->
            <div class="dashboard-content mobile-scroll" id="shop-view" style="display: none;">
                <!-- Shop Controls -->
                <div class="inventory-controls card">
                    <div class="search-bar">
                        <i data-lucide="search"></i>
                        <input type="text" id="shop-search-input" placeholder="Search shops..." oninput="filterShops()">
                    </div>
                    <div class="filters">
                        <select id="shop-filter-city" onchange="filterShops()">
                            <option value="">All Cities</option>
                        </select>
                        <select id="shop-filter-status" onchange="filterShops()">
                            <option value="">Status: All</option>
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                        </select>
                        <button class="btn-primary" onclick="openAddShopModal()">
                            <i data-lucide="plus"></i> Add Shop
                        </button>
                    </div>
                </div>

                <!-- Shop List Table -->
                <div class="card table-card">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Shop & Seller</th>
                                <th>Phone</th>
                                <th>Location</th>
                                <th class="text-right">Outstanding (LKR)</th>
                                <th>Status</th>
                                <th class="text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="shop-table-body">
                            <tr>
                                <td colspan="6" style="text-align: center; padding: 40px;">
                                    <i data-lucide="loader" style="animation: spin 1s linear infinite;"></i>
                                    <p style="margin-top: 10px; color: #666;">Loading shops...</p>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Add Shop Modal -->
            <div class="modal" id="add-shop-modal">
                <div class="modal-content" style="max-width: 550px;">
                    <div class="modal-header">
                        <h2><i data-lucide="store"></i> Add New Shop</h2>
                        <button class="modal-close" onclick="closeAddShopModal()">
                            <i data-lucide="x"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label>Shop Name *</label>
                            <input type="text" id="add-shop-name" placeholder="Enter shop name" required>
                        </div>
                        
                        <div class="form-group">
                            <label>Seller Name</label>
                            <input type="text" id="add-shop-seller" placeholder="Enter seller/owner name">
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label><i data-lucide="phone" style="width:14px;height:14px;"></i> Phone Number</label>
                                <input type="tel" id="add-shop-phone" placeholder="07X-XXXXXXX">
                            </div>
                            <div class="form-group">
                                <label><i data-lucide="message-circle" style="width:14px;height:14px;color:#25D366;"></i> WhatsApp</label>
                                <input type="tel" id="add-shop-whatsapp" placeholder="07X-XXXXXXX">
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label><i data-lucide="building-2" style="width:14px;height:14px;"></i> City</label>
                                <input type="text" id="add-shop-city" placeholder="Enter city">
                            </div>
                            <div class="form-group">
                                <label>Opening Outstanding (LKR)</label>
                                <input type="number" id="add-shop-outstanding" placeholder="0.00" min="0" step="0.01" value="0">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label><i data-lucide="map-pin" style="width:14px;height:14px;"></i> Address</label>
                            <input type="text" id="add-shop-address" placeholder="Enter full address">
                        </div>
                        
                        <div class="form-group" style="background: #f0f9ff; padding: 10px; border-radius: 6px; border-left: 3px solid #3b82f6;">
                            <small style="color: #64748b;"><i data-lucide="info" style="width:12px;height:12px;"></i> Status will be automatically set based on activity. Shops with no sales/payments for 30 days will be marked as Inactive.</small>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn-cancel" onclick="closeAddShopModal()">Cancel</button>
                        <button class="btn-save" id="save-shop-btn">
                            <i data-lucide="save"></i> Save Shop
                        </button>
                    </div>
                </div>
            </div>

            <!-- Edit Shop Modal -->
            <div class="modal" id="edit-shop-modal">
                <div class="modal-content" style="max-width: 550px;">
                    <div class="modal-header">
                        <h2><i data-lucide="edit-2"></i> Edit Shop</h2>
                        <button class="modal-close" onclick="closeEditShopModal()">
                            <i data-lucide="x"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <input type="hidden" id="edit-shop-id">
                        
                        <div class="form-group">
                            <label>Shop Name *</label>
                            <input type="text" id="edit-shop-name" placeholder="Enter shop name" required>
                        </div>
                        
                        <div class="form-group">
                            <label>Seller Name</label>
                            <input type="text" id="edit-shop-seller" placeholder="Enter seller/owner name">
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label><i data-lucide="phone" style="width:14px;height:14px;"></i> Phone Number</label>
                                <input type="tel" id="edit-shop-phone" placeholder="07X-XXXXXXX">
                            </div>
                            <div class="form-group">
                                <label><i data-lucide="message-circle" style="width:14px;height:14px;color:#25D366;"></i> WhatsApp</label>
                                <input type="tel" id="edit-shop-whatsapp" placeholder="07X-XXXXXXX">
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label><i data-lucide="building-2" style="width:14px;height:14px;"></i> City</label>
                                <input type="text" id="edit-shop-city" placeholder="Enter city">
                            </div>
                            <div class="form-group">
                                <label>Outstanding (LKR)</label>
                                <input type="number" id="edit-shop-outstanding" placeholder="0.00" min="0" step="0.01">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label><i data-lucide="map-pin" style="width:14px;height:14px;"></i> Address</label>
                            <input type="text" id="edit-shop-address" placeholder="Enter full address">
                        </div>
                        
                        <div class="form-group" style="background: #f0f9ff; padding: 10px; border-radius: 6px; border-left: 3px solid #3b82f6;">
                            <small style="color: #64748b;"><i data-lucide="info" style="width:12px;height:12px;"></i> Status is auto-calculated. Recording a sale or payment will update the last activity date.</small>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn-cancel" onclick="closeEditShopModal()">Cancel</button>
                        <button class="btn-save" id="update-shop-btn">
                            <i data-lucide="save"></i> Update Shop
                        </button>
                    </div>
                </div>
            </div>

            

            <!-- Outstanding View -->
            <div id="outstanding-view" class="dashboard-content mobile-scroll" style="display: none;">
                <!-- Stats Cards -->
                <div class="outstanding-stats">
                    <div class="outstanding-stat-card">
                        <div class="stat-icon total">
                            <i data-lucide="alert-triangle"></i>
                        </div>
                        <div class="stat-info">
                            <h4>Total Outstanding</h4>
                            <h2 id="total-outstanding">LKR 0.00</h2>
                        </div>
                    </div>
                    <div class="outstanding-stat-card">
                        <div class="stat-icon shops">
                            <i data-lucide="store"></i>
                        </div>
                        <div class="stat-info">
                            <h4>Shops with Debt</h4>
                            <h2 id="shops-with-debt">0</h2>
                        </div>
                    </div>
                    <div class="outstanding-stat-card">
                        <div class="stat-icon collected">
                            <i data-lucide="trending-up"></i>
                        </div>
                        <div class="stat-info">
                            <h4>Collected This Month</h4>
                            <h2 id="collected-month">LKR 0.00</h2>
                        </div>
                    </div>
                </div>

                <!-- Filter Bar -->
                <div class="filter-bar">
                    <div class="search-box">
                        <i data-lucide="search" style="width: 18px; height: 18px;"></i>
                        <input type="text" id="search-shop" placeholder="Search by shop name or location...">
                    </div>
                    <div class="filter-group">
                        <i data-lucide="filter" style="width: 16px; height: 16px; color: var(--text-muted);"></i>
                        <select id="filter-status">
                            <option value="all">All Status</option>
                            <option value="overdue">Overdue</option>
                            <option value="pending">Pending</option>
                            <option value="good">Good Standing</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <i data-lucide="arrow-up-down" style="width: 16px; height: 16px; color: var(--text-muted);"></i>
                        <select id="sort-by">
                            <option value="amount-desc">Highest Amount</option>
                            <option value="amount-asc">Lowest Amount</option>
                            <option value="name">Shop Name</option>
                            <option value="date">Last Payment</option>
                        </select>
                    </div>
                </div>

                <!-- Outstanding Table -->
                <div class="outstanding-table-container">
                    <table class="outstanding-table">
                        <thead>
                            <tr>
                                <th>Shop</th>
                                <th>Outstanding Amount</th>
                                <th>Last Payment</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="outstanding-body">
                            <!-- Dynamic content will be added here -->
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Expenses View -->
            <div class="dashboard-content mobile-scroll" id="expenses-view" style="display: none;">
                <!-- Monthly Summary -->
                <div class="monthly-summary">
                    <h3><i data-lucide="calendar" style="width: 18px; height: 18px;"></i> January 2026 Summary</h3>
                    <div class="summary-grid">
                        <div class="summary-item">
                            <span>Total Expenses</span>
                            <h4 id="monthly-total">LKR 0.00</h4>
                        </div>
                        <div class="summary-item">
                            <span>Raw Materials</span>
                            <h4 id="monthly-materials">LKR 0.00</h4>
                        </div>
                        <div class="summary-item">
                            <span>Transport</span>
                            <h4 id="monthly-transport">LKR 0.00</h4>
                        </div>
                        <div class="summary-item">
                            <span>Other</span>
                            <h4 id="monthly-other">LKR 0.00</h4>
                        </div>
                    </div>
                </div>

                
                <!-- Add Expense & Materials Grid -->
                <div class="expense-controls">
                    <div class="add-expense-card">
                        <h3><i data-lucide="plus-circle"></i> Add New Expense</h3>
                        <form class="expense-form" id="expense-form">
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Date</label>
                                    <input type="date" id="expense-date" required>
                                </div>
                                <div class="form-group">
                                    <label>Category</label>
                                    <select id="expense-category" required>
                                        <option value="">Select Category</option>
                                        <option value="materials">Raw Materials</option>
                                        <option value="transport">Transport/Fuel</option>
                                        <option value="salary">Salary/Wages</option>
                                        <option value="utilities">Bills & Utilities</option>
                                        <option value="maintenance">Maintenance</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Amount (LKR)</label>
                                    <input type="number" id="expense-amount" min="0" step="0.01" placeholder="0.00"
                                        required>
                                </div>
                                <div class="form-group">
                                    <label>Payment Method</label>
                                    <select id="expense-payment">
                                        <option value="cash">Cash</option>
                                        <option value="bank">Bank Transfer</option>
                                        <option value="check">Check</option>
                                    </select>
                                </div>
                            </div>
                            <div class="form-group">
                                <label>Description</label>
                                <textarea id="expense-description" placeholder="Enter expense details..."></textarea>
                            </div>
                            
                            <!-- Materials Selection Section (Hidden by default) -->
                            <div id="materials-selection-section" style="display: none; margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--border-color);">
                                <h4 style="margin-bottom: 15px; color: var(--primary-color);"><i data-lucide="package"></i> Select Raw Materials</h4>
                                <div class="materials-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; margin-bottom: 15px;">
                                    <label class="material-checkbox-item">
                                        <input type="checkbox" value="Coriander"> Coriander
                                    </label>
                                    <label class="material-checkbox-item">
                                        <input type="checkbox" value="Suduru"> Suduru
                                    </label>
                                    <label class="material-checkbox-item">
                                        <input type="checkbox" value="Maduru"> Maduru
                                    </label>
                                    <label class="material-checkbox-item">
                                        <input type="checkbox" value="Chili Pods"> Chili Pods
                                    </label>
                                    <label class="material-checkbox-item">
                                        <input type="checkbox" value="Enasal"> Enasal
                                    </label>
                                    <label class="material-checkbox-item">
                                        <input type="checkbox" value="Rice"> Rice
                                    </label>
                                    <label class="material-checkbox-item">
                                        <input type="checkbox" value="Cinnamon"> Cinnamon
                                    </label>
                                    <label class="material-checkbox-item">
                                        <input type="checkbox" value="Gingerbread"> Gingerbread
                                    </label>
                                    <label class="material-checkbox-item">
                                        <input type="checkbox" value="Pepper"> Pepper
                                    </label>
                                    <label class="material-checkbox-item">
                                        <input type="checkbox" value="Puluhal"> Puluhal
                                    </label>
                                    <label class="material-checkbox-item">
                                        <input type="checkbox" value="Mung Beans"> Mung Beans
                                    </label>
                                    <label class="material-checkbox-item">
                                        <input type="checkbox" value="Cloves"> Cloves
                                    </label>
                                    <label class="material-checkbox-item">
                                        <input type="checkbox" value="Yellow Potatoes"> Yellow Potatoes
                                    </label>
                                    <label class="material-checkbox-item">
                                        <input type="checkbox" value="Chili Powder"> Chili Powder
                                    </label>
                                    <label class="material-checkbox-item">
                                        <input type="checkbox" value="Yellow Powder"> Yellow Powder
                                    </label>
                                </div>
                            </div>
                            
                            <button type="submit" class="btn-add-expense">
                                <i data-lucide="plus"></i> Add Expense
                            </button>
                        </form>
                    </div>
                </div>

                <!-- Expenses Filter Bar -->
                <div class="filter-bar" style="margin-bottom: 20px;">
                    <div class="filter-group">
                        <i data-lucide="calendar" style="width: 16px; height: 16px; color: var(--text-muted);"></i>
                        <select id="expense-month-filter">
                            <option value="all">All Months</option>
                            <!-- Options will be populated dynamically -->
                        </select>
                    </div>
                    <div class="filter-group">
                        <i data-lucide="tag" style="width: 16px; height: 16px; color: var(--text-muted);"></i>
                        <select id="expense-category-filter">
                            <option value="all">All Categories</option>
                            <option value="materials">Raw Materials</option>
                            <option value="transport">Transport/Fuel</option>
                            <option value="salary">Salary/Wages</option>
                            <option value="utilities">Bills & Utilities</option>
                            <option value="maintenance">Maintenance</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div class="search-box">
                        <i data-lucide="search" style="width: 18px; height: 18px;"></i>
                        <input type="text" id="expense-search" placeholder="Search expenses...">
                    </div>
                </div>

                <!-- Expenses Table -->
                <div class="expenses-table-container">
                    <table class="expenses-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Description</th>
                                <th>Category</th>
                                <th>Payment</th>
                                <th>Amount</th>
                            </tr>
                        </thead>
                        <tbody id="expenses-body"></tbody>
                    </table>
                </div>
            </div>


                            </h3>
                            <div style="display: flex; gap: 8px;">
                                <select id="pie-chart-month" style="padding: 6px 10px; border-radius: 6px; border: 1px solid var(--border-color); font-size: 0.85rem;">
                                    <option value="">All Months</option>
                                    <option value="1">January</option>
                                    <option value="2">February</option>
                                    <option value="3">March</option>
                                    <option value="4">April</option>
                                    <option value="5">May</option>
                                    <option value="6">June</option>
                                    <option value="7">July</option>
                                    <option value="8">August</option>
                                    <option value="9">September</option>
                                    <option value="10">October</option>
                                    <option value="11">November</option>
                                    <option value="12">December</option>
                                </select>
                                <select id="pie-chart-year" style="padding: 6px 10px; border-radius: 6px; border: 1px solid var(--border-color); font-size: 0.85rem;">
                                    <!-- Years will be populated dynamically -->
                                </select>
                            </div>
                        </div>
                        <canvas id="salesPieChart" style="max-height: 300px;"></canvas>
                    </div>

                    <!-- Sales by Weight - Pie Chart -->
                    <div class="card" style="padding: 20px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 10px;">
                            <h3 style="color: var(--primary-color); display: flex; align-items: center; gap: 10px; margin: 0;">
                                <i data-lucide="scale"></i> Sales by Weight
                            </h3>
                            <div style="display: flex; gap: 8px;">
                                <select id="weight-chart-month" style="padding: 6px 10px; border-radius: 6px; border: 1px solid var(--border-color); font-size: 0.85rem;">
                                    <option value="">All Months</option>
                                    <option value="1">January</option>
                                    <option value="2">February</option>
                                    <option value="3">March</option>
                                    <option value="4">April</option>
                                    <option value="5">May</option>
                                    <option value="6">June</option>
                                    <option value="7">July</option>
                                    <option value="8">August</option>
                                    <option value="9">September</option>
                                    <option value="10">October</option>
                                    <option value="11">November</option>
                                    <option value="12">December</option>
                                </select>
                                <select id="weight-chart-year" style="padding: 6px 10px; border-radius: 6px; border: 1px solid var(--border-color); font-size: 0.85rem;">
                                    <!-- Years will be populated dynamically -->
                                </select>
                            </div>
                        </div>
                        <canvas id="weightPieChart" style="max-height: 300px;"></canvas>
                    </div>
                </div>

                <!-- Second Row of Pie Charts -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(450px, 1fr)); gap: 25px; margin-bottom: 25px;">
                    <!-- Expenses by Category - Pie Chart -->
                    <div class="card" style="padding: 20px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 10px;">
                            <h3 style="color: var(--primary-color); display: flex; align-items: center; gap: 10px; margin: 0;">
                                <i data-lucide="wallet"></i> Expenses by Category
                            </h3>
                            <div style="display: flex; gap: 8px;">
                                <select id="expense-pie-month" style="padding: 6px 10px; border-radius: 6px; border: 1px solid var(--border-color); font-size: 0.85rem;">
                                    <option value="">All Months</option>
                                    <option value="1">January</option>
                                    <option value="2">February</option>
                                    <option value="3">March</option>
                                    <option value="4">April</option>
                                    <option value="5">May</option>
                                    <option value="6">June</option>
                                    <option value="7">July</option>
                                    <option value="8">August</option>
                                    <option value="9">September</option>
                                    <option value="10">October</option>
                                    <option value="11">November</option>
                                    <option value="12">December</option>
                                </select>
                                <select id="expense-pie-year" style="padding: 6px 10px; border-radius: 6px; border: 1px solid var(--border-color); font-size: 0.85rem;">
                                    <!-- Years will be populated dynamically -->
                                </select>
                            </div>
                        </div>
                        <canvas id="expensePieChart" style="max-height: 300px;"></canvas>
                    </div>

                    <!-- Top Shops - Pie Chart -->
                    <div class="card" style="padding: 20px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 10px;">
                            <h3 style="color: var(--primary-color); display: flex; align-items: center; gap: 10px; margin: 0;">
                                <i data-lucide="store"></i> Top Shops by Sales
                            </h3>
                            <div style="display: flex; gap: 8px;">
                                <select id="shops-pie-month" style="padding: 6px 10px; border-radius: 6px; border: 1px solid var(--border-color); font-size: 0.85rem;">
                                    <option value="">All Months</option>
                                    <option value="1">January</option>
                                    <option value="2">February</option>
                                    <option value="3">March</option>
                                    <option value="4">April</option>
                                    <option value="5">May</option>
                                    <option value="6">June</option>
                                    <option value="7">July</option>
                                    <option value="8">August</option>
                                    <option value="9">September</option>
                                    <option value="10">October</option>
                                    <option value="11">November</option>
                                    <option value="12">December</option>
                                </select>
                                <select id="shops-pie-year" style="padding: 6px 10px; border-radius: 6px; border: 1px solid var(--border-color); font-size: 0.85rem;">
                                    <!-- Years will be populated dynamically -->
                                </select>
                            </div>
                        </div>
                        <canvas id="shopsPieChart" style="max-height: 300px;"></canvas>
                    </div>
                </div>

                <!-- Monthly Weight Sales - Stacked Bar Chart -->
                <div class="card" style="padding: 20px; margin-bottom: 25px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 10px;">
                        <h3 style="color: var(--primary-color); display: flex; align-items: center; gap: 10px; margin: 0;">
                            <i data-lucide="bar-chart-3"></i> Monthly Sales by Weight (Packet Count)
                        </h3>
                        <select id="monthly-weight-year" style="padding: 6px 10px; border-radius: 6px; border: 1px solid var(--border-color); font-size: 0.85rem;">
                            <!-- Years will be populated dynamically -->
                        </select>
                    </div>
                    <canvas id="monthlyWeightChart" style="max-height: 350px;"></canvas>
                </div>

                <!-- Monthly Revenue - Bar Chart -->
                <div class="card" style="padding: 20px; margin-bottom: 25px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 10px;">
                        <h3 style="color: var(--primary-color); display: flex; align-items: center; gap: 10px; margin: 0;">
                            <i data-lucide="bar-chart-2"></i> Monthly Revenue
                        </h3>
                        <div style="display: flex; gap: 8px;">
                            <select id="revenue-chart-year" style="padding: 6px 10px; border-radius: 6px; border: 1px solid var(--border-color); font-size: 0.85rem;">
                                <!-- Years will be populated dynamically -->
                            </select>
                        </div>
                    </div>
                    <canvas id="revenueBarChart" style="max-height: 300px;"></canvas>
                </div>

                <!-- Summary Stats -->
                <div class="card" style="padding: 20px; margin-bottom: 25px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 10px;">
                        <h3 style="color: var(--primary-color); display: flex; align-items: center; gap: 10px; margin: 0;">
                            <i data-lucide="calculator"></i> Financial Summary
                        </h3>
                        <div style="display: flex; gap: 8px;">
                            <select id="summary-month" style="padding: 6px 10px; border-radius: 6px; border: 1px solid var(--border-color); font-size: 0.85rem;">
                                <option value="">All Months</option>
                                <option value="1">January</option>
                                <option value="2">February</option>
                                <option value="3">March</option>
                                <option value="4">April</option>
                                <option value="5">May</option>
                                <option value="6">June</option>
                                <option value="7">July</option>
                                <option value="8">August</option>
                                <option value="9">September</option>
                                <option value="10">October</option>
                                <option value="11">November</option>
                                <option value="12">December</option>
                            </select>
                            <select id="summary-year" style="padding: 6px 10px; border-radius: 6px; border: 1px solid var(--border-color); font-size: 0.85rem;">
                                <!-- Years will be populated dynamically -->
                            </select>
                        </div>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                        <div style="padding: 15px; text-align: center; background: var(--bg-secondary); border-radius: 8px;">
                            <h4 style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 8px;">Total Revenue</h4>
                            <p id="summary-revenue" style="font-size: 1.5rem; font-weight: 700; color: var(--primary-color);">LKR 0</p>
                        </div>
                        <div style="padding: 15px; text-align: center; background: var(--bg-secondary); border-radius: 8px;">
                            <h4 style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 8px;">Total Expenses</h4>
                            <p id="summary-expenses" style="font-size: 1.5rem; font-weight: 700; color: #ef4444;">LKR 0</p>
                        </div>
                        <div style="padding: 15px; text-align: center; background: var(--bg-secondary); border-radius: 8px;">
                            <h4 style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 8px;">Net Profit</h4>
                            <p id="summary-profit" style="font-size: 1.5rem; font-weight: 700; color: #10b981;">LKR 0</p>
                        </div>
                        <div style="padding: 15px; text-align: center; background: var(--bg-secondary); border-radius: 8px;">
                            <h4 style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 8px;">Profit Margin</h4>
                            <p id="summary-margin" style="font-size: 1.5rem; font-weight: 700; color: var(--accent-color);">0%</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Users View -->
            <div class="dashboard-content mobile-scroll" id="users-view" style="display: none; justify-content: center; align-items: center; min-height: 60vh;">
                <div class="section-header" style="margin-bottom: 24px;">
                    <h2><i data-lucide="users"></i> Users</h2>
                    <button class="btn-primary" onclick="openAddUserModal()"><i data-lucide="plus"></i> Add User</button>
                </div>
                <div class="users-summary" style="display: flex; gap: 24px; margin-bottom: 24px; flex-wrap: wrap;">
                    <div class="card" style="flex:1; min-width:180px; text-align:center;">
                        <h4>Total Users</h4>
                        <p id="users-total" style="font-size:2rem; font-weight:700;">0</p>
                    </div>
                    <div class="card" style="flex:1; min-width:180px; text-align:center;">
                        <h4>Active</h4>
                        <p id="users-active" style="font-size:2rem; font-weight:700; color:#10b981;">0</p>
                    </div>
                    <div class="card" style="flex:1; min-width:180px; text-align:center;">
                        <h4>Admins</h4>
                        <p id="users-admin" style="font-size:2rem; font-weight:700; color:#ef4444;">0</p>
                    </div>
                    <div class="card" style="flex:1; min-width:180px; text-align:center;">
                        <h4>Managers</h4>
                        <p id="users-manager" style="font-size:2rem; font-weight:700; color:#f59e42;">0</p>
                    </div>
                </div>
                <div class="card" style="overflow-x:auto;">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Username</th>
                                <th>Full Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Last Login</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="users-body"></tbody>
                    </table>
                </div>
            </div>
        </main>
    </div>


    <!-- Batch Generator Modal -->
    <div class="modal-overlay" id="batch-modal">
        <div class="modal">
            <div class="modal-header">
                <h3>Generate New Batch</h3>
                <button class="close-modal"><i data-lucide="x"></i></button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label>Select Product</label>
                    <select id="product-select">
                        <option value="">-- Loading products... --</option>
                    </select>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Manufacture Date</label>
                        <input type="date" id="mfd-date">
                    </div>
                    <div class="form-group">
                        <label>Expiry Date</label>
                        <input type="date" id="exp-date">
                    </div>
                </div>
                <div class="form-group">
                    <label>Batch Number (Auto-Generated)</label>
                    <div class="batch-output">
                        <input type="text" id="batch-output" readonly placeholder="e.g. R260401">
                        <button id="generate-btn">Generate</button>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-cancel close-modal-btn">Cancel</button>
                <button class="btn-save" id="save-batch-btn">Save Batch</button>
            </div>
        </div>
    </div>

    <!-- Stock Management Modal -->
    <div class="modal-overlay" id="stock-modal">
        <div class="modal">
            <div class="modal-header">
                <h3 id="stock-modal-title">Update Stock</h3>
                <button class="close-modal"><i data-lucide="x"></i></button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label>Action</label>
                    <select id="stock-action">
                        <option value="add">Add Stock</option>
                        <option value="remove">Remove Stock (Damage/Loss)</option>
                        <option value="set">Set Total Quantity</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Quantity (Packets)</label>
                    <input type="number" id="stock-qty" placeholder="Enter quantity">
                </div>
                <!-- Read-only info could go here -->
            </div>
            <div class="modal-footer">
                <button class="btn-cancel close-modal-btn">Cancel</button>
                <button class="btn-save" id="save-stock-btn">Update Stock</button>
            </div>
        </div>
    </div>

    <!-- Raw Material Modal -->
    <div class="modal-overlay" id="material-modal">
        <div class="modal">
            <div class="modal-header">
                <h3>Add New Raw Material</h3>
                <button class="close-modal"><i data-lucide="x"></i></button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label>Material Name</label>
                    <input type="text" id="new-material-name" placeholder="e.g. Saffron, Garlic Powder">
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-cancel close-modal-btn">Cancel</button>
                <button class="btn-save" onclick="saveNewMaterial()">Save Material</button>
            </div>
        </div>
    </div>

    <!-- Add Product Modal -->
    <div class="modal" id="add-product-modal">
        <div class="modal-content" style="max-width: 700px;">
            <div class="modal-header">
                <h2>Add New Product</h2>
                <button class="modal-close" onclick="closeAddProductModal()">
                    <i data-lucide="x"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label>Product Name *</label>
                    <input type="text" id="add-product-name" placeholder="Enter product name" required>
                </div>
                <div class="form-group">
                    <label>Category *</label>
                    <select id="add-product-category" required>
                        <option value="">Select category</option>
                        <option value="Powders">Powders</option>
                        <option value="Spices">Spices</option>
                        <option value="Mixes">Mixes</option>
                    </select>
                </div>
                
                <hr style="margin: 20px 0; border: none; border-top: 1px solid #e0e0e0;">
                
                <h3 style="margin-bottom: 15px; font-size: 1.1rem;">Product Variants</h3>
                
                <div id="variants-container">
                    <!-- Variant rows will be added here -->
                </div>
                
                <button class="btn-secondary" onclick="addVariantRow()" type="button" style="margin-top: 10px;">
                    <i data-lucide="plus"></i> Add Variant
                </button>
            </div>
            <div class="modal-footer">
                <button class="btn-cancel" onclick="closeAddProductModal()">Cancel</button>
                <button class="btn-save" onclick="saveNewProduct()">Save Product</button>
            </div>
        </div>
    </div>

    <!-- Edit Product Modal -->
    <div class="modal" id="edit-product-modal">
        <div class="modal-content" style="max-width: 700px;">
            <div class="modal-header">
                <h2><i data-lucide="edit-2"></i> Edit Product</h2>
                <button class="modal-close" onclick="closeEditProductModal()">
                    <i data-lucide="x"></i>
                </button>
            </div>
            <div class="modal-body">
                <input type="hidden" id="edit-product-id">
                
                <div class="form-group">
                    <label>Product Name *</label>
                    <input type="text" id="edit-product-name" placeholder="Enter product name" required>
                </div>
                <div class="form-group">
                    <label>Category *</label>
                    <select id="edit-product-category" required>
                        <option value="">Select category</option>
                        <option value="Powders">Powders</option>
                        <option value="Spices">Spices</option>
                        <option value="Mixes">Mixes</option>
                    </select>
                </div>
                
                <hr style="margin: 20px 0; border: none; border-top: 1px solid #e0e0e0;">
                
                <h3 style="margin-bottom: 15px; font-size: 1.1rem;">Product Variants</h3>
                
                <div id="edit-variants-container">
                    <!-- Variant rows will be loaded here -->
                </div>
                
                <button class="btn-secondary" onclick="addEditVariantRow()" type="button" style="margin-top: 10px;">
                    <i data-lucide="plus"></i> Add Variant
                </button>
            </div>
            <div class="modal-footer">
                <button class="btn-cancel" onclick="closeEditProductModal()">Cancel</button>
                <button class="btn-save" id="update-product-btn">
                    <i data-lucide="save"></i> Update Product
                </button>
            </div>
        </div>
    </div>

    <!-- Collect Payment Modal -->
    <div class="modal-overlay" id="collect-payment-modal">
        <div class="modal collect-modal">
            <button class="modal-close-btn" id="close-collect-btn" onclick="closeCollectModal()">
                <i data-lucide="x"></i>
            </button>
            
            <div class="collect-header">
                <div class="collect-icon">
                    <i data-lucide="wallet"></i>
                </div>
                <h3>Collect Payment</h3>
                <p id="collect-shop-name">Shop Name</p>
            </div>
            
            <div class="collect-body">
                <div class="outstanding-display">
                    <span class="label">Current Outstanding</span>
                    <span class="amount" id="collect-current-outstanding">LKR 0.00</span>
                </div>
                
                <div class="form-group">
                    <label><i data-lucide="banknote" style="width:14px;height:14px;"></i> Payment Amount (LKR)</label>
                    <input type="number" id="collect-amount" placeholder="Enter amount" min="0" step="0.01">
                </div>
                
                <div class="quick-amounts">
                    <button class="quick-amount-btn" data-percent="25">25%</button>
                    <button class="quick-amount-btn" data-percent="50">50%</button>
                    <button class="quick-amount-btn" data-percent="75">75%</button>
                    <button class="quick-amount-btn" data-percent="100">Full</button>
                </div>
                
                <div class="new-outstanding-display">
                    <span class="label">Remaining Outstanding</span>
                    <span class="amount" id="collect-new-outstanding">LKR 0.00</span>
                </div>
                
                <div class="form-group">
                    <label><i data-lucide="file-text" style="width:14px;height:14px;"></i> Note (Optional)</label>
                    <input type="text" id="collect-note" placeholder="e.g., Cash payment, Bank transfer...">
                </div>
            </div>
            
            <div class="collect-footer">
                <button class="btn-cancel" onclick="closeCollectModal()">Cancel</button>
                <button class="btn-collect-confirm" id="confirm-collect-btn">
                    <i data-lucide="check"></i> Confirm Payment
                </button>
            </div>
        </div>
    </div>

    <!-- Expense Details Modal -->
    <div class="modal-overlay" id="expense-details-modal">
        <div class="modal expense-details-modal">
            <button class="modal-close-btn" onclick="closeExpenseDetailsModal()">
                <i data-lucide="x"></i>
            </button>
            
            <div class="expense-details-header">
                <div class="expense-details-icon">
                    <i data-lucide="receipt"></i>
                </div>
                <h3>Expense Details</h3>
            </div>
            
            <div class="expense-details-body">
                <div class="expense-detail-row">
                    <div class="detail-icon date">
                        <i data-lucide="calendar"></i>
                    </div>
                    <div class="detail-content">
                        <span class="detail-label">Date</span>
                        <span class="detail-value" id="expense-detail-date">-</span>
                    </div>
                </div>
                
                <div class="expense-detail-row">
                    <div class="detail-icon desc">
                        <i data-lucide="file-text"></i>
                    </div>
                    <div class="detail-content">
                        <span class="detail-label">Description</span>
                        <span class="detail-value" id="expense-detail-description">-</span>
                    </div>
                </div>
                
                <div class="expense-detail-row">
                    <div class="detail-icon category">
                        <i data-lucide="tag"></i>
                    </div>
                    <div class="detail-content">
                        <span class="detail-label">Category</span>
                        <span class="detail-value" id="expense-detail-category">-</span>
                    </div>
                </div>
                
                <div class="expense-detail-row">
                    <div class="detail-icon payment">
                        <i data-lucide="credit-card"></i>
                    </div>
                    <div class="detail-content">
                        <span class="detail-label">Payment Method</span>
                        <span class="detail-value" id="expense-detail-payment">-</span>
                    </div>
                </div>
                
                <div class="expense-detail-row highlight">
                    <div class="detail-icon amount">
                        <i data-lucide="banknote"></i>
                    </div>
                    <div class="detail-content">
                        <span class="detail-label">Amount</span>
                        <span class="detail-value" id="expense-detail-amount">LKR 0.00</span>
                    </div>
                </div>
                
                <div class="expense-detail-row" id="expense-detail-materials-row" style="display: none;">
                    <div class="detail-icon materials">
                        <i data-lucide="package"></i>
                    </div>
                    <div class="detail-content">
                        <span class="detail-label">Materials</span>
                        <span class="detail-value" id="expense-detail-materials">-</span>
                    </div>
                </div>
            </div>
            
            <div class="expense-details-footer">
                <button class="btn-cancel" onclick="closeExpenseDetailsModal()">Close</button>
                <button class="btn-delete-expense" id="delete-expense-detail-btn">
                    <i data-lucide="trash-2"></i> Delete
                </button>
            </div>
        </div>
    </div>

    <!-- User Modal -->
    <div class="modal-overlay" id="user-modal">
        <div class="modal" style="max-width: 500px;">
            <div class="modal-header">
                <h3 id="user-modal-title">Add New User</h3>
                <button class="close-modal"><i data-lucide="x"></i></button>
            </div>
            <div class="modal-body">
                <input type="hidden" id="user-id">
                <div class="form-group">
                    <label>Username <span style="color: #ef4444;">*</span></label>
                    <input type="text" id="user-username" placeholder="Enter username">
                </div>
                <div class="form-group">
                    <label>Full Name <span style="color: #ef4444;">*</span></label>
                    <input type="text" id="user-fullname" placeholder="Enter full name">
                </div>
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" id="user-email" placeholder="Enter email address">
                </div>
                <div class="form-group">
                    <label>Phone</label>
                    <input type="text" id="user-phone" placeholder="Enter phone number">
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Password <span style="color: #ef4444;">*</span></label>
                        <input type="password" id="user-password" placeholder="Enter password">
                    </div>
                    <div class="form-group">
                        <label>Confirm Password</label>
                        <input type="password" id="user-confirm-password" placeholder="Confirm password">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Role <span style="color: #ef4444;">*</span></label>
                        <select id="user-role">
                            <option value="Admin">Admin</option>
                            <option value="Manager">Manager</option>
                            <option value="Staff">Staff</option>
                            <option value="Viewer">Viewer</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Status</label>
                        <select id="user-status">
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                        </select>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-cancel close-modal-btn">Cancel</button>
                <button class="btn-save" id="save-user-btn">Save User</button>
            </div>
        </div>
    </div>

    <script src="script.js?v=<?php echo time(); ?>"></script>
    <script>
        lucide.createIcons();
    </script>
</body>

</html>