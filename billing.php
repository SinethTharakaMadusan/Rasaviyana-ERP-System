<?php
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

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Billing System | Rasaviyana Products</title>
    <link rel="stylesheet" href="style.css">
    <link rel="stylesheet" href="billing.css">
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
                <a href="dashboard.php#shops" class="nav-item active">
                    <i data-lucide="store"></i>
                    <span>Shops</span>
                </a>
                <a href="dashboard.php#outstanding" class="nav-item">
                    <i data-lucide="wallet-cards"></i>
                    <span>Outstanding</span>
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
                <a href="index.php#users" class="nav-item">
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
                <button id="sidebar-toggle" class="mobile-only">
                    <i data-lucide="menu"></i>
                </button>
                <a href="index.php" class="btn-text">
                    <i data-lucide="arrow-left"></i>
                </a>

                <h1>Billing System</h1>
                <div class="batch-btn">
                    <a href="index.php" style="text-decoration: none;">
                        <button style="background-color: var(--sidebar-hover); color: white;">Exit</button>
                    </a>
                </div>
            </header>

            <div class="dashboard-content mobile-scroll">
                <div class="section-header" style="justify-content: space-between; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 20px;">
                        <h2 id="billing-shop-name">Billing: Loading...</h2>
                        <div id="outstanding-container" class="outstanding-badge" style="display: none;">
                            <i data-lucide="alert-circle" class="outstanding-icon"
                                style="width: 16px; height: 16px;"></i>
                            Outstanding: <span id="outstanding-amount">LKR 0.00</span>
                        </div>
                    </div>
                    <a href="#" id="history-link" class="billing-history-btn">
                        <i data-lucide="history"></i>History
                    </a>
                </div>

                <div class="billing-layout">
                    <div class="billing-main">
                        <!-- Billing Controls -->
                        <div class="card billing-controls" id="add-products-section">
                            <div class="card-header">
                                <h3 style="padding: 15px 20px; border-bottom: 1px solid var(--border-color);">Add
                                    Products
                                </h3>
                            </div>
                            <div class="card-body" style="padding: 20px;">
                                <div class="form-row" style="display: flex; gap: 15px;">
                                    <div class="form-group" style="flex: 2;">
                                        <label>Select Product</label>
                                        <select id="bill-product-select">
                                            <option value="">-- Choose Product --</option>
                                        </select>
                                    </div>
                                    <div class="form-group" style="flex: 1;">
                                        <label>Quantity</label>
                                        <input type="number" id="bill-qty" min="1" value="1">
                                    </div>
                                    <div class="form-group"
                                        style="flex: 0; display: flex; align-items: flex-end; margin-bottom: 20px;">
                                        <button class="btn-primary" id="add-to-bill-btn">
                                            <i data-lucide="plus"></i> Add
                                        </button>
                                    </div>
                                </div>
                            </div>                     
                        </div>

                        <!-- Discount Section (Add Button එකත් සමඟ) -->
                        <div class="card discount-card">
                            <h3>Discount</h3>
                            <div class="discount-container">
                                <div class="discount-field-group">
                                    <label for="discount-percent-input">Discount (%)</label>
                                    <input type="number" id="discount-percent-input" min="0" max="100" value="0" placeholder="0">
                                </div>
                                <div class="discount-field-group">
                                    <label for="discount-amount-input">Discount (LKR)</label>
                                    <input type="number" id="discount-amount-input" min="0" value="0.00" placeholder="0.00">
                                </div>
                                <!-- Add Button එක සඳහා -->
                                <div class="discount-btn-group" style="align-self: flex-end;">
                                    <button type="button" id="add-discount-btn" class="btn-add-discount">
                                        <i data-lucide="plus"></i> Add
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- Return Packets Section -->
                        <div class="card billing-controls" id="return-packets-section"
                            style="border-top: 4px solid var(--danger-color); margin-top: 20px;">
                            <div class="card-header"
                                style="padding: 15px 20px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
                                <h3 style="color: var(--danger-color); margin: 0;">Return Packets</h3>
                                <button id="toggle-returns-btn" class="action-btn" style="color: var(--danger-color);">
                                    <i data-lucide="chevron-right"></i>
                                </button>
                            </div>
                            <div class="card-body hidden" id="return-packets-body" style="padding: 20px;">
                                <div class="form-row" style="display: flex; gap: 15px;">
                                    <div class="form-group" style="flex: 2;">
                                        <label>Select Product to Return</label>
                                        <select id="return-product-select">
                                            <option value="">-- Choose Product --</option>
                                        </select>
                                    </div>
                                    <div class="form-group" style="flex: 1;">
                                        <label>Quantity</label>
                                        <input type="number" id="return-qty" min="1" value="1">
                                    </div>
                                    <div class="form-group"
                                        style="flex: 0; display: flex; align-items: flex-end; margin-bottom: 20px;">
                                        <button class="btn-cancel" id="add-return-btn"
                                            style="background-color: var(--danger-color); color: white; border: none;">
                                            <i data-lucide="rotate-ccw"></i> Return
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Payment Collection Section (Current Bill) -->
                        <div class="card billing-controls" id="payment-collection-section"
                            style="border-top: 4px solid var(--success-color); margin-top: 20px;">
                            <div class="card-header"
                                style="padding: 15px 20px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
                                <h3 style="color: var(--success-color); margin: 0;">Payment Collection (Current Bill)
                                </h3>
                                <button id="toggle-payments-btn" class="action-btn"
                                    style="color: var(--success-color);">
                                    <i data-lucide="chevron-down"></i>
                                </button>
                            </div>
                            <div class="card-body" id="payment-collection-body" style="padding: 20px;">
                                <div class="form-row" style="display: flex; gap: 15px;">
                                    <div class="form-group" style="flex: 1.5;">
                                        <label>Payment Method</label>
                                        <select id="payment-method">
                                            <option value="Cash">Cash</option>
                                            <option value="Check">Check</option>
                                            <option value="Bank Transfer">Bank Transfer</option>
                                        </select>
                                    </div>
                                    <div class="form-group" style="flex: 1;">
                                        <label>Amount (LKR)</label>
                                        <input type="number" id="payment-amount" min="0" placeholder="0.00">
                                    </div>
                                    <div class="form-group" style="flex: 1.5;">
                                        <label>Reference (Optional)</label>
                                        <input type="text" id="payment-ref" placeholder="Check/Ref No">
                                    </div>
                                    <div class="form-group"
                                        style="flex: 0; display: flex; align-items: flex-end; margin-bottom: 20px;">
                                        <button class="btn-primary" id="add-payment-btn"
                                            style="background-color: var(--success-color); border: none;">
                                            <i data-lucide="dollar-sign"></i> Add
                                        </button>
                                    </div>
                                </div>
                                <div
                                    style="display: flex; align-items: center; gap: 10px; margin-top: 10px; padding: 10px; background: rgba(239, 68, 68, 0.05); border-radius: 8px; border: 1px dashed rgba(239, 68, 68, 0.2);">
                                    <input type="checkbox" id="mark-as-debt"
                                        style="width: 18px; height: 18px; cursor: pointer;">
                                    <label for="mark-as-debt"
                                        style="margin-bottom: 0; cursor: pointer; font-weight: 600; color: var(--danger-color); display: flex; align-items: center; gap: 5px;">
                                        <i data-lucide="alert-triangle" style="width: 14px; height: 14px;"></i> Mark
                                        Remaining Balance as Debt
                                    </label>
                                </div>
                            </div>
                        </div>

                        <!-- Additional Payment Section (Old Balance) -->
                        <div class="card billing-controls" id="extra-payment-card"
                            style="border-top: 4px solid var(--sidebar-hover); margin-top: 20px;">
                            <div class="card-header"
                                style="padding: 15px 20px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
                                <h3 style="color: var(--sidebar-hover); margin: 0;">Outstanding Payment</h3>
                                <div style="font-weight: 700; color: var(--danger-color); font-size: 1.1rem;">
                                    Balance: <span id="extra-due-amount">LKR 0.00</span>
                                </div>
                            </div>
                            <div class="card-body" id="extra-payment-body" style="padding: 20px;">
                                <div class="form-row" style="display: flex; gap: 15px;">
                                    <div class="form-group" style="flex: 1.5;">
                                        <label>Payment Method</label>
                                        <select id="extra-payment-method">
                                            <option value="Cash">Cash</option>
                                            <option value="Check">Check</option>
                                            <option value="Bank Transfer">Bank Transfer</option>
                                        </select>
                                    </div>
                                    <div class="form-group" style="flex: 1;">
                                        <label>Amount (LKR)</label>
                                        <input type="number" id="extra-payment-amount" min="0" placeholder="0.00">
                                    </div>
                                    <div class="form-group" style="flex: 1.5;">
                                        <label>Reference (Optional)</label>
                                        <input type="text" id="extra-payment-ref" placeholder="Check/Ref No">
                                    </div>
                                    <div class="form-group"
                                        style="flex: 0; display: flex; align-items: flex-end; margin-bottom: 20px;">
                                        <button class="btn-primary" id="add-extra-payment-btn"
                                            style="background-color: var(--sidebar-hover); border: none;">
                                            <i data-lucide="wallet"></i> Add
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="billing-sidebar">
                        <!-- Bill Table (Moved back to sidebar for vertical stacking with summary) -->
                        <div class="card table-card sidebar-bill"
                            style="margin-top: 0; border-bottom-left-radius: 0; border-bottom-right-radius: 0;">
                            <div class="card-header"
                                style="display: flex; justify-content: space-between; align-items: center; padding-right: 15px;">
                                <h3 style="padding: 15px 20px; border-bottom: none;">Current Bill</h3>
                                <button class="btn-primary" id="open-picker-btn"
                                    style="padding: 6px 12px; font-size: 0.8rem; height: auto;">
                                    <i data-lucide="plus"></i> Add
                                </button>
                            </div>
                            <div class="sidebar-table-handle">
                                <table class="data-table" id="bill-table">
                                    <thead>
                                        <tr>
                                            <th>Product</th>
                                            <th class="text-right">Qty</th>
                                            <th class="text-right">Total</th>
                                            <th class="text-right"></th>
                                        </tr>
                                    </thead>
                                    <tbody id="bill-items-body">
                                        <!-- Items will be added here -->
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <!-- Total Section (Summary) -->
                        <div class="billing-summary sidebar-summary"
                            style="flex-direction: column; align-items: stretch; border-top: 1px solid var(--border-color); border-top-left-radius: 0; border-top-right-radius: 0; margin-top: -1px;">
                            <div class="summary-details">
                                <div class="summary-row">
                                    <span>Net Bill:</span>
                                    <span id="net-bill-display">LKR 0.00</span>
                                </div>
                                <div class="summary-row">
                                    <span>Paid Amount:</span>
                                    <span id="paid-amount" style="color: var(--success-color);">LKR 0.00</span>
                                </div>
                                <div class="summary-row">
                                    <span>Outstanding Payment:</span>
                                    <span id="summary-extra-payment" style="color: var(--sidebar-hover);">LKR
                                        0.00</span>
                                </div>
                                 <div class="summary-row">
                                    <span>Discount:</span>
                                    <span id="discount-amount-display" style="color: var(--success-color);">LKR 0.00</span>
                                </div>
                                <div class="toggle-container"
                                    style="display: flex; align-items: center; gap: 10px; margin: 15px 0; padding-top: 10px; border-top: 1px dashed var(--border-color);">
                                    <label class="switch">
                                        <input type="checkbox" id="auto-send-bill-summary">
                                        <span class="slider round"></span>
                                    </label>
                                    <span style="font-size: 0.85rem; color: var(--text-muted); font-weight: 500;">
                                        Auto-send bill to seller mobile
                                    </span>
                                </div>
                            </div>
                            <div class="total-card"
                                style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                                <div>
                                    <span>Balance Due:</span>
                                    <h2 id="bill-total" style="margin: 0;">LKR 0.00</h2>
                                </div>
                                <div class="billing-actions">
                                    <button class="btn-cancel" id="clear-bill">Clear</button>
                                    <button class="btn-primary" id="save-invoice">
                                        <i data-lucide="file-text"></i> Save
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
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
    <!-- Product Picker Modal -->
    <div class="modal-overlay" id="picker-modal">
        <div class="modal">
            <div class="modal-header">
                <h3>Quick Add Product</h3>
                <button class="close-modal" id="close-picker-btn">
                    <i data-lucide="x"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label>Select Product</label>
                    <select id="modal-product-select">
                        <option value="">-- Choose Product --</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Quantity</label>
                    <input type="number" id="modal-qty" min="1" value="1">
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-cancel" id="cancel-picker-btn">Cancel</button>
                <button class="btn-save" id="modal-add-btn">Add to Bill</button>
            </div>
        </div>
    </div>

    <!-- Bill Success Modal -->
    <div class="modal-overlay" id="success-modal">
        <div class="modal success-modal">
            <button class="modal-close-btn" id="close-success-btn">
                <i data-lucide="x"></i>
            </button>
            
            <div class="success-header">
                <div class="success-icon">
                    <i data-lucide="check-circle"></i>
                </div>
                <h3>Bill Saved Successfully!</h3>
                <p>Your bill has been saved to the database</p>
            </div>
            
            <div class="bill-number-display" id="success-bill-number">BL-0000</div>
            
            <div class="bill-info-grid">
                <div class="bill-info-item">
                    <div class="icon shop">
                        <i data-lucide="store"></i>
                    </div>
                    <div class="details">
                        <span class="label">Shop</span>
                        <span class="value" id="success-shop-name">-</span>
                    </div>
                </div>
                <div class="bill-info-item">
                    <div class="icon date">
                        <i data-lucide="calendar"></i>
                    </div>
                    <div class="details">
                        <span class="label">Date</span>
                        <span class="value" id="success-date">-</span>
                    </div>
                </div>
                <div class="bill-info-item">
                    <div class="icon amount">
                        <i data-lucide="receipt"></i>
                    </div>
                    <div class="details">
                        <span class="label">Net Bill</span>
                        <span class="value" id="success-net-bill">LKR 0.00</span>
                    </div>
                </div>
                <div class="bill-info-item">
                    <div class="icon paid">
                        <i data-lucide="wallet"></i>
                    </div>
                    <div class="details">
                        <span class="label">Paid Amount</span>
                        <span class="value" id="success-paid" style="color: #28a745;">LKR 0.00</span>
                    </div>
                </div>
                <div class="bill-info-item full-width">
                    <div class="icon balance">
                        <i data-lucide="alert-circle"></i>
                    </div>
                    <div class="details">
                        <span class="label">Balance Due</span>
                        <span class="value" id="success-balance" style="color: #dc3545;">LKR 0.00</span>
                    </div>
                </div>
            </div>
            
            <div id="success-extra-info" class="outstanding-info" style="display: none;">
                <div class="outstanding-row">
                    <span>Outstanding Payment Applied</span>
                    <span id="success-outstanding-text">LKR 0.00</span>
                </div>
            </div>
            
            <div id="success-status-badges" class="status-badges" style="margin: 15px 0; text-align: center;">
                <!-- Status badges will be added dynamically -->
            </div>
            
            <div class="success-footer">
                <button id="success-new-bill-btn">
                    <i data-lucide="plus"></i> New Bill
                </button>
                <button id="success-view-history-btn">
                    <i data-lucide="history"></i> View History
                </button>
            </div>
        </div>
    </div>

    <script src="billing.js"></script>
    <script>
        lucide.createIcons();
    </script>
</body>

</html>