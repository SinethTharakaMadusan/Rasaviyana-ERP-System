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

require_once __DIR__ . '/backend/db.php';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Batches Management | Rasaviyana</title>
    <link rel="stylesheet" href="style.css">
    <link rel="stylesheet" href="bill_management.css">
    <!-- Lucide Icons -->
    <script src="https://unpkg.com/lucide@latest"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        .badge-active {
            background-color: #d1fae5;
            color: #065f46;
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            display: inline-flex;
            align-items: center;
            gap: 4px;
        }
        .badge-expired {
            background-color: #fee2e2;
            color: #991b1b;
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            display: inline-flex;
            align-items: center;
            gap: 4px;
        }
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 20px;
            margin-bottom: 25px;
        }
        .metric-card {
            background: #fff;
            padding: 20px;
            border-radius: 12px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.03);
            display: flex;
            align-items: center;
            gap: 15px;
            border: 1px solid #e2e8f0;
        }
        .metric-icon {
            width: 48px;
            height: 48px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 22px;
        }
        .icon-blue { background: #eff6ff; color: #3b82f6; }
        .icon-green { background: #ecfdf5; color: #10b981; }
        .icon-red { background: #fef2f2; color: #ef4444; }
        
        .metric-data h3 {
            font-size: 24px;
            font-weight: 700;
            color: #1e293b;
        }
        .metric-data p {
            font-size: 13px;
            color: #64748b;
        }
        .filter-tabs {
            display: flex;
            gap: 10px;
        }
        .filter-btn {
            padding: 8px 16px;
            border-radius: 8px;
            border: 1px solid #cbd5e1;
            background: #fff;
            color: #475569;
            font-weight: 500;
            font-size: 13px;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        .filter-btn.active {
            background: #ff8c00;
            color: #fff;
            border-color: #ff8c00;
        }
        .btn-danger {
            background: #ef4444;
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 12px;
            display: inline-flex;
            align-items: center;
            gap: 4px;
        }
        .btn-danger:hover { background: #dc2626; }
    </style>
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
            <a href="bill_management.php" class="nav-item">
                <i data-lucide="file-text"></i>
                <span>Bills</span>
            </a>
            <a href="batches.php" class="nav-item active">
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
            <h2>Batches Management</h2>
            <div style="display: flex; gap: 10px;">
                <button id="open-batch-modal-btn" class="btn-primary" style="display: flex; align-items: center; gap: 6px; padding: 10px 18px; border-radius: 8px; background: #ff8c00; color: #fff; border: none; font-weight: 600; cursor: pointer;">
                    <i data-lucide="plus-circle" style="width: 18px; height: 18px;"></i>
                    <span>Generate Batch</span>
                </button>
            </div>
        </div>

        <!-- Content Body -->
        <div class="content-body">

            <!-- Metrics Summary Cards -->
            <div class="metrics-grid">
                <div class="metric-card">
                    <div class="metric-icon icon-blue">
                        <i data-lucide="layers"></i>
                    </div>
                    <div class="metric-data">
                        <h3 id="total-batches-count">0</h3>
                        <p>Total Batches</p>
                    </div>
                </div>

                <div class="metric-card">
                    <div class="metric-icon icon-green">
                        <i data-lucide="check-circle-2"></i>
                    </div>
                    <div class="metric-data">
                        <h3 id="active-batches-count">0</h3>
                        <p>Active Batches</p>
                    </div>
                </div>

                <div class="metric-card">
                    <div class="metric-icon icon-red">
                        <i data-lucide="alert-octagon"></i>
                    </div>
                    <div class="metric-data">
                        <h3 id="expired-batches-count">0</h3>
                        <p>Non-Active / Expired</p>
                    </div>
                </div>
            </div>

            <!-- Table Card -->
            <div class="card">
                <div class="header-section">
                    <!-- Search Input -->
                    <div class="search-box">
                        <i data-lucide="search" class="search-icon"></i>
                        <input type="text" id="batchSearchInput" placeholder="Search by Batch ID, Product Name, Date...">
                    </div>

                    <!-- Filter Tabs -->
                    <div class="filter-tabs">
                        <button class="filter-btn active" data-filter="all">All Batches</button>
                        <button class="filter-btn" data-filter="active">Active Only</button>
                        <button class="filter-btn" data-filter="non-active">Non-Active (Expired)</button>
                    </div>
                </div>

                <!-- Batches Table -->
                <div class="table-responsive">
                    <table id="batchesTable">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Batch ID</th>
                                <th>Product Name</th>
                                <th>MFD Date</th>
                                <th>EXP Date</th>
                                <th>Status</th>
                                <th>Created At</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="batchesTableBody">
                            <tr>
                                <td colspan="8" class="no-data">Loading batches...</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
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

    <script src="auth_guard.js"></script>
    <script src="script.js"></script>
    <script src="batches.js"></script>
    <script>
        lucide.createIcons();
    </script>
</body>
</html>
