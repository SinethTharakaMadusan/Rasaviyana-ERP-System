// window.addEventListener('beforeunload', function (e) {
//     navigator.sendBeacon('backend/api/logout.php');
// });


// API Configuration - PHP Backend
const API_BASE_URL = 'backend/api';

// Sidebar Toggle Logic for Mobile
const sidebar = document.querySelector('.sidebar');
const sidebarToggle = document.getElementById('sidebar-toggle');
const appContainer = document.querySelector('.app-container');

// Create overlay for mobile
const overlay = document.createElement('div');
overlay.className = 'overlay';
appContainer.appendChild(overlay);

sidebarToggle.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    overlay.classList.toggle('active');
});

overlay.addEventListener('click', () => {
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
});

// User Session & Sidebar Logic
document.addEventListener('DOMContentLoaded', () => {
    const userJson = sessionStorage.getItem('user');
    if (userJson) {
        try {
            const user = JSON.parse(userJson);

            // Update Sidebar Info
            const userNameEl = document.getElementById('sidebar-user-name');
            const userRoleEl = document.getElementById('sidebar-user-role');
            const userImgEl = document.getElementById('sidebar-user-img');

            if (userNameEl) userNameEl.textContent = user.full_name || user.username;
            if (userRoleEl) userRoleEl.textContent = user.role || 'Staff';
            if (userImgEl) {
                const nameForAvatar = (user.full_name || user.username).replace(' ', '+');
                userImgEl.src = `https://ui-avatars.com/api/?name=${nameForAvatar}&background=random&color=fff`;
            }
        } catch (e) {
            console.error('Error parsing user data:', e);
        }
    }

    // Logout Functionality
    const userInfoBtn = document.getElementById('sidebar-user-container');
    if (userInfoBtn) {
        userInfoBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to logout?')) {
                sessionStorage.removeItem('user');
                window.location.href = 'login.php';
            }
        });
    }
});


// Navigation & View Switching Logic
const navItems = document.querySelectorAll('.nav-item');
const views = {
    'Dashboard': document.getElementById('dashboard-view'),
    'Inventory': document.getElementById('inventory-view'),
    'Inventory/Stock': document.getElementById('inventory-view'),
    'Products': document.getElementById('products-view'),
    'Shops': document.getElementById('shop-view'),
    'Expenses': document.getElementById('expenses-view'),
    'Outstanding': document.getElementById('outstanding-view'),
    'Reports': document.getElementById('reports-view'),
    'Users': document.getElementById('users-view'),
    'Alert': document.getElementById('alert-view'),
    'Settings': document.getElementById('settings-view')
};
const pageTitle = document.querySelector('.top-bar h1');

navItems.forEach(item => {
    item.addEventListener('click', (e) => {
        // Get the href attribute
        const href = item.getAttribute('href');

        // If it's an external page (not # or index.html#), allow navigation
        if (href && href !== '#' && !href.startsWith('#') && href !== 'index.php') {
            // Allow the link to navigate normally
            return;
        }

        e.preventDefault();

        // 1. Update Active State
        navItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');

        // 2. Get View Name
        const viewName = item.querySelector('span').textContent;

        // 3. Switch View
        // Hide all views first
        document.querySelectorAll('.dashboard-content').forEach(content => {
            content.style.display = 'none';
        });

        if (views[viewName]) {
            views[viewName].style.display = 'block';
            pageTitle.textContent = viewName; // Update Header Title

            // Load view-specific content
            if (viewName === 'Reports') {
                setTimeout(() => {
                    loadReportsData();
                }, 100);
            }
            if (viewName === 'Products') {
                loadProducts();
            }
            if (viewName === 'Inventory' || viewName === 'Inventory/Stock') {
                loadInventory();
            }
            if (viewName === 'Shops') {
                loadShops();
            }
            if (viewName === 'Alert') {
                loadAlerts();
            }
            if (viewName === 'Users') {
                loadUsers();
            }
            if (viewName === 'Outstanding') {
                if (typeof loadOutstandingData === 'function') loadOutstandingData();
            }
            if (viewName === 'Expenses') {
                if (typeof loadExpenses === 'function') loadExpenses();
            }
        }

        // On mobile, close sidebar after selection
        if (window.innerWidth <= 768) {
            sidebar.classList.remove('open');
            overlay.classList.remove('active');
        }
    });
});

// Handle hash navigation on page load (for links from other pages)
function handleHashNavigation() {
    const hash = window.location.hash;
    if (hash) {
        const viewMap = {
            '#dashboard': 'Dashboard',
            '#inventory': 'Inventory',
            '#products': 'Products',
            '#shops': 'Shops',
            '#expenses': 'Expenses',
            '#outstanding': 'Outstanding',
            '#reports': 'Reports',
            '#users': 'Users',
            '#alert': 'Alert'
        };

        const viewName = viewMap[hash.toLowerCase()];
        if (viewName && views[viewName]) {
            // Hide all views
            document.querySelectorAll('.dashboard-content').forEach(content => {
                content.style.display = 'none';
            });

            // Show the target view
            views[viewName].style.display = 'block';
            pageTitle.textContent = viewName;

            // Update active nav item
            navItems.forEach(nav => {
                nav.classList.remove('active');
                if (nav.querySelector('span')?.textContent === viewName) {
                    nav.classList.add('active');
                }
            });

            // Load view-specific content
            if (viewName === 'Reports') {
                setTimeout(() => loadReportsData(), 100);
            }
            if (viewName === 'Products') {
                loadProducts();
            }
            if (viewName === 'Inventory') {
                loadInventory();
            }
            if (viewName === 'Shops') {
                loadShops();
            }
            if (viewName === 'Alert') {
                loadAlerts();
            }
            if (viewName === 'Users') {
                loadUsers();
            }
            if (viewName === 'Outstanding') {
                if (typeof loadOutstandingData === 'function') loadOutstandingData();
            }
            if (viewName === 'Expenses') {
                if (typeof loadExpenses === 'function') loadExpenses();
            }
        }
    }
}

// Run hash navigation check on page load
window.addEventListener('load', handleHashNavigation);
window.addEventListener('hashchange', handleHashNavigation);

// Link Dashboard Stat Cards
document.addEventListener('DOMContentLoaded', () => {
    const stockAlertCard = document.querySelector('.stat-card .icon-stock')?.closest('.stat-card');
    if (stockAlertCard) {
        stockAlertCard.style.cursor = 'pointer';
        stockAlertCard.addEventListener('click', () => {
            window.location.hash = '#alert';
        });
    }
});


// --- Dashboard Logic ---

// Mock Data for Recent Sales
const mockSales = [
    { shop: "Kandy Spice Mart", date: "2026-01-28", amount: "LKR 12,500" },
    { shop: "Colombo Retail", date: "2026-01-28", amount: "LKR 8,200" },
    { shop: "Galle Traders", date: "2026-01-27", amount: "LKR 15,000" },
    { shop: "Negombo Spices", date: "2026-01-27", amount: "LKR 5,400" },
    { shop: "Matara Distributors", date: "2026-01-26", amount: "LKR 22,100" }
];

// Mock Data for Expiry Warning
const mockExpiry = [
    { id: "TP-2025-089", name: "Cinnamon Stick A1", daysLeft: 12, status: "warning" },
    { id: "TP-2025-082", name: "Cardamom Whole", daysLeft: 5, status: "expired" }, // Just expired or very close
    { id: "TP-2025-095", name: "Chilli Powder Extra", daysLeft: 28, status: "fresh" }, // Actually fresh but in list for demo? Or close to cutoff? 
];

// Rerender Recent Sales
const salesTableBody = document.getElementById('recent-sales-body');
if (salesTableBody) {
    salesTableBody.innerHTML = mockSales.map(sale => `
        <tr>
            <td>${sale.shop}</td>
            <td>${sale.date}</td>
            <td class="text-right">${sale.amount}</td>
        </tr>
    `).join('');
}

// Render Expiry List
const expiryList = document.getElementById('expiry-list');
if (expiryList) {
    mockExpiry.forEach(item => {
        let statusClass = '';
        let statusText = '';

        if (item.daysLeft <= 5) {
            statusClass = 'status-expired'; // Or critical
            statusText = 'Expiring Soon'; // Or Expired if logic demanded, but assuming 'days left'
            if (item.status === 'expired') statusText = 'Expired';
        } else if (item.daysLeft <= 15) {
            statusClass = 'status-warning';
            statusText = `${item.daysLeft} Days Left`;
        } else {
            statusClass = 'status-fresh'; // Greenish
            statusText = `${item.daysLeft} Days Left`;
        }

        const li = document.createElement('li');
        li.className = 'expiry-item';
        li.innerHTML = `
            <div class="batch-info">
                <h4>${item.name}</h4>
                <span>Batch: ${item.id}</span>
            </div>
            <span class="expiry-status ${statusClass}">${statusText}</span>
        `;
        expiryList.appendChild(li);
    });
}

// --- Day Payments Logic ---
const mockDayPayments = [
    { time: "04:30 PM", shop: "Kandy Spice Mart", type: "Bill Payment", method: "Cash", ref: "-", amount: 3000 },
    { time: "02:15 PM", shop: "Colombo Retail", type: "Old Balance", method: "Check", ref: "CHQ-992", amount: 5000 },
    { time: "11:00 AM", shop: "Galle Traders", type: "Bill Payment", method: "Bank Transfer", ref: "TXN-881", amount: 12500 },
    { time: "09:45 AM", shop: "Matara Spices", type: "Bill Payment", method: "Cash", ref: "-", amount: 4500 }
];

function renderDayPayments() {
    const tableBody = document.getElementById('day-payments-body');
    if (!tableBody) return;

    let total = 0, cash = 0, check = 0, bank = 0;

    tableBody.innerHTML = mockDayPayments.map(p => {
        total += p.amount;
        if (p.method === "Cash") cash += p.amount;
        if (p.method === "Check") check += p.amount;
        if (p.method === "Bank Transfer") bank += p.amount;

        return `
            <tr>
                <td style="color: var(--text-muted); font-size: 0.85rem;">${p.time}</td>
                <td style="font-weight: 500;">${p.shop}</td>
                <td>
                    <span class="status-badge ${p.type === 'Bill Payment' ? 'status-fresh' : 'status-warning'}" style="font-size: 0.7rem;">
                        ${p.type}
                    </span>
                </td>
                <td>${p.method}</td>
                <td style="color: var(--text-muted);">${p.ref}</td>
                <td class="text-right" style="font-weight: 600; color: var(--success-color);">
                    ${p.amount.toLocaleString()}.00
                </td>
            </tr>
        `;
    }).join('');

    // Update Summary Labels
    const totalEl = document.getElementById('today-total-collection');
    const dashTotalEl = document.getElementById('dash-today-collection');
    const cashEl = document.getElementById('today-cash');
    const checkEl = document.getElementById('today-check');
    const bankEl = document.getElementById('today-bank');

    if (totalEl) totalEl.textContent = `LKR ${total.toLocaleString()}.00`;
    if (dashTotalEl) dashTotalEl.textContent = `LKR ${total.toLocaleString()}.00`;
    if (cashEl) cashEl.textContent = `LKR ${cash.toLocaleString()}.00`;
    if (checkEl) checkEl.textContent = `LKR ${check.toLocaleString()}.00`;
    if (bankEl) bankEl.textContent = `LKR ${bank.toLocaleString()}.00`;
}

// Initialize Day Payments
renderDayPayments();

// --- Special Functionalities: Auto Batch ID ---
const PRODUCT_BATCH_PREFIXES = {
    'Chilli powder': 'R',
    'Chilli pieces': 'S',
    'Curry powder': 'T',
    'Meat curry powder': 'U',
    'Turmeric Powder': 'V',
    'Chilli paste': 'W',
    'black pepper': 'Y',
    'Sambal': 'Z'
};

function generateBatchId(prefix, dateStr, sequence = 1) {
    // Pad sequence with zeros (e.g., 01)
    const paddedSeq = String(sequence).padStart(2, '0');
    return `${prefix}${dateStr}${paddedSeq}`;
}


// --- Modal & Batch generation Logic ---
const batchModal = document.getElementById('batch-modal');
const openBatchBtn = document.querySelector('.batch-btn button');
const generateBtn = document.getElementById('generate-btn');
const saveBatchBtn = document.getElementById('save-batch-btn');

// Inputs
const productSelect = document.getElementById('product-select');
const mfdDate = document.getElementById('mfd-date');
const expDate = document.getElementById('exp-date');
const batchOutput = document.getElementById('batch-output');

// Load products into the batch modal dropdown from the API
async function loadProductsForBatchModal() {
    try {
        const response = await fetch(`${API_BASE_URL}/products`);
        if (!response.ok) throw new Error('Failed to fetch products');
        const products = await response.json();

        productSelect.innerHTML = '<option value="">-- Select Product --</option>';

        if (!products || products.length === 0) {
            throw new Error("No products found from API");
        }

        products.forEach(p => {
            const option = document.createElement('option');
            const pName = p.product_name || p.name || '';
            // Use the product code as the value (used for batch ID prefix)
            option.value = p.code || pName.substring(0, 2).toUpperCase();
            option.textContent = pName + (p.code ? ` (${p.code})` : '');
            productSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading products for batch modal, using fallback:', error);
        productSelect.innerHTML = '<option value="">-- Select Product --</option>';

        // Fallback to predefined products so generation can still be tested
        if (typeof PRODUCT_BATCH_PREFIXES !== 'undefined') {
            Object.keys(PRODUCT_BATCH_PREFIXES).forEach(name => {
                const option = document.createElement('option');
                option.value = PRODUCT_BATCH_PREFIXES[name];
                option.textContent = name;
                productSelect.appendChild(option);
            });
        }
    }
}

// Open Modal
if (openBatchBtn) {
    openBatchBtn.addEventListener('click', () => {
        batchModal.classList.add('active');
        productSelect.value = "";
        mfdDate.value = "";
        expDate.value = "";
        batchOutput.value = "";
        // Dynamically load products from API
        loadProductsForBatchModal();
    });
}

// Close Logic for all modals
const allCloseBtns = document.querySelectorAll('.close-modal, .close-modal-btn');
allCloseBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.modal-overlay').forEach(modal => {
            modal.classList.remove('active');
        });
    });
});

// Close Modals on outside click
document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
});

if (productSelect) {
    productSelect.addEventListener('change', () => {
        console.log("Product changed, sequence reset.");
    });
}

// Generate Logic
if (generateBtn) {
    generateBtn.addEventListener('click', async () => {
        const productVal = productSelect.value;
        const selectedOption = productSelect.options[productSelect.selectedIndex];
        const productName = selectedOption ? selectedOption.text.split(' (')[0].trim() : '';
        const mfd = mfdDate.value;

        if (!productVal || !mfd) {
            alert("Please select a Product and Manufacture Date (MFD) before generating.");
            return;
        }

        let prefix = '';
        const searchName = productName.toLowerCase();

        if (searchName.includes('chilli powder') || searchName.includes('chili powder')) prefix = 'Q';
        else if (searchName.includes('soya')) prefix = 'R';
        else if (searchName.includes('chilli piece') || searchName.includes('chili piece')) prefix = 'S';
        else if (searchName.includes('meat curry')) prefix = 'U';
        else if (searchName.includes('curry powder')) prefix = 'T';
        else if (searchName.includes('turmeric') || searchName.includes('tumaric')) prefix = 'V';
        else if (searchName.includes('paste') || searchName.includes('paset')) prefix = 'W';
        else if (searchName.includes('pepper') || searchName.includes('pepar')) prefix = 'Y';
        else if (searchName.includes('sambal') || searchName.includes('sambo')) prefix = 'Z';

        if (!prefix) {
            prefix = productVal.substring(0, 1).toUpperCase();
        }

        const mfdDateObj = new Date(mfd);
        const day = String(mfdDateObj.getDate()).padStart(2, '0');
        const month = String(mfdDateObj.getMonth() + 1).padStart(2, '0');
        const dateStr = `${day}${month}`;

        try {
            
            const response = await fetch('backend/api/get_next_batch.php?prefix=' + prefix + '&date=' + dateStr, {
                method: 'GET',
                credentials: 'include'
            });

            const resultText = await response.text();
            console.log("Server Response:", resultText);

            let data;
            try {
                data = JSON.parse(resultText);
            } catch (e) {
                console.error("JSON Parse Error. Server output was:", resultText);
                alert("Server returned an invalid response. Check F12 Console.");
                return;
            }

            if (response.ok && data.batch_id) {
                if (batchOutput) {
                    batchOutput.value = data.batch_id;
                }
            } else {
                alert(data.error || "Failed to generate batch number.");
            }
        } catch (error) {
            console.error('Network or Fetch Error:', error);
            alert("Network error while generating batch number.");
        }
    });
}

if (saveBatchBtn) {
    saveBatchBtn.addEventListener('click', async () => {
        const batchId = batchOutput.value;
        const selectedOption = productSelect.options[productSelect.selectedIndex];
        const productName = selectedOption ? selectedOption.text.split(' (')[0].trim() : '';
        const mfd = mfdDate.value;
        const exp = expDate.value;

        if (!batchId) {
            alert("Please generate a batch number first!");
            return;
        }

        if (!productName || !mfd || !exp) {
            alert("Please select Product, MFD Date, and EXP Date.");
            return;
        }

        try {
            saveBatchBtn.disabled = true;
            saveBatchBtn.textContent = "Saving...";

            const response = await fetch('backend/api/save_batch.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    batch_id: batchId,
                    product_name: productName,
                    mfd_date: mfd,
                    exp_date: exp
                })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                alert(data.message || `Batch ${batchId} Saved Successfully!`);
                batchModal.classList.remove('active');

                // Clear modal fields
                batchOutput.value = "";
                productSelect.value = "";
                mfdDate.value = "";
                expDate.value = "";

                // Refresh batches list if loadBatches function exists
                if (typeof loadBatches === 'function') {
                    loadBatches();
                }
            } else {
                alert(data.message || "Failed to save batch to database.");
            }
        } catch (error) {
            console.error('Error saving batch:', error);
            alert("Network error while saving batch to database.");
        } finally {
            saveBatchBtn.disabled = false;
            saveBatchBtn.textContent = "Save Batch";
        }
    });
}


// --- Stock Update Modal Logic ---
const stockModal = document.getElementById('stock-modal');
const stockModalTitle = document.getElementById('stock-modal-title');
const saveStockBtn = document.getElementById('save-stock-btn');
const stockQtyInput = document.getElementById('stock-qty');

// Open Shop Modal (Placeholder)
const addShopBtn = document.getElementById('add-shop-btn');
if (addShopBtn) {
    addShopBtn.addEventListener('click', () => {
        alert("Add Shop Modal functionality is being prepared!");
    });
}

// Event Delegation for Table Actions
const inventoryTable = document.querySelector('#inventory-view .data-table');
if (inventoryTable) {
    inventoryTable.addEventListener('click', (e) => {
        const btn = e.target.closest('.action-btn');
        if (btn) {
            const row = btn.closest('tr');
            if (row) {
                const nameEl = row.querySelector('.product-cell h4');
                const weightEl = row.querySelector('.product-cell span');

                if (nameEl && weightEl) {
                    const productName = nameEl.textContent;
                    const productWeight = weightEl.textContent;
                    stockModalTitle.textContent = `Update Stock: ${productName} (${productWeight})`;
                    stockModal.classList.add('active');
                    stockQtyInput.value = "";
                    stockQtyInput.focus();
                }
            }
        }
    });
}

if (saveStockBtn) {
    saveStockBtn.addEventListener('click', () => {
        const qty = stockQtyInput.value;
        if (!qty) {
            alert("Please enter a quantity.");
            return;
        }
        alert(`Stock Updated Successfully!`);
        stockModal.classList.remove('active');
    });
}

// --- Universal Search Filtering Logic ---
function setupSearch(viewId, rowSelector) {
    const searchInput = document.querySelector(`${viewId} .search-bar input`);
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const rows = document.querySelectorAll(`${viewId} ${rowSelector}`);

        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(searchTerm) ? '' : 'none';
        });
    });
}

// Initialize searches
setupSearch('#inventory-view', '.data-table tbody tr');

// --- Navigation to Billing ---
const shopTableBody = document.querySelector('#shop-view .data-table tbody');
if (shopTableBody) {
    shopTableBody.addEventListener('click', (e) => {
        const shopNameEl = e.target.closest('h4');
        if (shopNameEl) {
            const shopName = shopNameEl.textContent;
            window.location.href = `billing.php?shop=${encodeURIComponent(shopName)}`;
        }
    });
}


// --- Expenses Logic ---

// Expenses data loaded from database
let expenses = [];

// DOM Elements
const expensesBody = document.getElementById("expenses-body");
const expenseForm = document.getElementById("expense-form");

// Stats elements
const todayTotalEl = document.getElementById("today-total");
const materialsTotalEl = document.getElementById("materials-total");
const transportTotalEl = document.getElementById("transport-total");
const otherTotalEl = document.getElementById("other-total");
const monthlyTotalEl = document.getElementById("monthly-total");
const monthlyMaterialsEl = document.getElementById("monthly-materials");
const monthlyTransportEl = document.getElementById("monthly-transport");
const monthlyOtherEl = document.getElementById("monthly-other");

// Set today"s date as default
if (document.getElementById("expense-date")) {
    document.getElementById("expense-date").valueAsDate = new Date();
}

// Populate month filter with last 3 months
function populateMonthFilter() {
    const monthFilter = document.getElementById("expense-month-filter");
    if (!monthFilter) return;

    // Clear existing options except "All Months"
    monthFilter.innerHTML = '<option value="all">All Months</option>';

    const now = new Date();
    for (let i = 0; i < 3; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthValue = date.toISOString().substring(0, 7); // "2026-02"
        const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

        const option = document.createElement('option');
        option.value = monthValue;
        option.textContent = monthName;
        monthFilter.appendChild(option);
    }
}

// Initialize month filter
populateMonthFilter();

// Category labels and colors
const categoryConfig = {
    materials: { label: "Raw Materials", class: "category-materials" },
    transport: { label: "Transport", class: "category-transport" },
    salary: { label: "Salary", class: "category-salary" },
    utilities: { label: "Utilities", class: "category-utilities" },
    maintenance: { label: "Maintenance", class: "category-maintenance" },
    other: { label: "Other", class: "category-other" }
};

// Payment labels
const paymentLabels = {
    cash: "Cash",
    bank: "Bank Transfer",
    check: "Check"
};

// Format currency
function formatCurrency(amount) {
    return `LKR ${amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: "numeric", month: "short", day: "numeric" };
    return date.toLocaleDateString("en-US", options);
}

// Load expenses from database
async function loadExpenses() {
    try {
        const response = await fetch(`${API_BASE_URL}/expenses`);
        if (!response.ok) throw new Error('Failed to load expenses');

        const data = await response.json();
        expenses = data.map(expense => ({
            id: expense.id,
            date: expense.date,
            description: expense.description || 'No description',
            category: expense.category,
            payment: expense.payment_method || 'cash',
            amount: expense.amount,
            materials: expense.materials
        }));

        updateExpenseStats();
        renderExpensesTable();
    } catch (error) {
        console.error('Error loading expenses:', error);
    }
}

// Calculate and update stats
function updateExpenseStats() {
    if (!monthlyTotalEl) return;
    const today = new Date().toISOString().split("T")[0];

    // Today"s expenses
    const todayExpenses = expenses.filter(e => e.date === today);
    const todayTotal = todayExpenses.reduce((sum, e) => sum + e.amount, 0);
    if (todayTotalEl) todayTotalEl.textContent = formatCurrency(todayTotal);

    // Category totals (all time)
    const materialsTotal = expenses.filter(e => e.category === "materials").reduce((sum, e) => sum + e.amount, 0);
    const transportTotal = expenses.filter(e => e.category === "transport").reduce((sum, e) => sum + e.amount, 0);
    const otherTotal = expenses.filter(e => !["materials", "transport"].includes(e.category)).reduce((sum, e) => sum + e.amount, 0);

    if (materialsTotalEl) materialsTotalEl.textContent = formatCurrency(materialsTotal);
    if (transportTotalEl) transportTotalEl.textContent = formatCurrency(transportTotal);
    if (otherTotalEl) otherTotalEl.textContent = formatCurrency(otherTotal);

    // Monthly totals (current month)
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyExpenses = expenses.filter(e => {
        const date = new Date(e.date);
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });

    const monthlyTotal = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);
    const monthlyMaterials = monthlyExpenses.filter(e => e.category === "materials").reduce((sum, e) => sum + e.amount, 0);
    const monthlyTransport = monthlyExpenses.filter(e => e.category === "transport").reduce((sum, e) => sum + e.amount, 0);
    const monthlyOther = monthlyExpenses.filter(e => !["materials", "transport"].includes(e.category)).reduce((sum, e) => sum + e.amount, 0);

    monthlyTotalEl.textContent = formatCurrency(monthlyTotal);
    if (monthlyMaterialsEl) monthlyMaterialsEl.textContent = formatCurrency(monthlyMaterials);
    if (monthlyTransportEl) monthlyTransportEl.textContent = formatCurrency(monthlyTransport);
    if (monthlyOtherEl) monthlyOtherEl.textContent = formatCurrency(monthlyOther);
}

// Get category badge
function getCategoryBadge(category) {
    const config = categoryConfig[category] || categoryConfig.other;
    return `<span class="category-badge ${config.class}">${config.label}</span>`;
}

// Filter elements for expenses
const expenseMonthFilter = document.getElementById("expense-month-filter");
const expenseCategoryFilter = document.getElementById("expense-category-filter");
const expenseSearchInput = document.getElementById("expense-search");

// Filter and render expenses table
function filterAndRenderExpenses() {
    if (!expensesBody) return;

    let filtered = [...expenses];

    // Month filter
    if (expenseMonthFilter) {
        const monthValue = expenseMonthFilter.value;
        if (monthValue === 'current') {
            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();
            filtered = filtered.filter(e => {
                const date = new Date(e.date);
                return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
            });
        } else if (monthValue !== 'all') {
            // Format: "2026-01"
            filtered = filtered.filter(e => e.date.startsWith(monthValue));
        }
    }

    // Category filter
    if (expenseCategoryFilter && expenseCategoryFilter.value !== 'all') {
        filtered = filtered.filter(e => e.category === expenseCategoryFilter.value);
    }

    // Search filter
    if (expenseSearchInput && expenseSearchInput.value.trim()) {
        const searchTerm = expenseSearchInput.value.toLowerCase().trim();
        filtered = filtered.filter(e =>
            e.description.toLowerCase().includes(searchTerm) ||
            e.category.toLowerCase().includes(searchTerm)
        );
    }

    // Sort by date descending
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Render filtered expenses
    renderFilteredExpenses(filtered);

    // Update filtered stats
    updateFilteredExpenseStats(filtered);
}

// Render filtered expenses to table
function renderFilteredExpenses(filteredExpenses) {
    if (!expensesBody) return;
    expensesBody.innerHTML = "";

    if (filteredExpenses.length === 0) {
        expensesBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px; color: var(--text-muted);">
                    <i data-lucide="inbox" style="width: 48px; height: 48px; margin-bottom: 10px;"></i>
                    <p>No expenses found</p>
                </td>
            </tr>
        `;
        if (typeof lucide !== "undefined") lucide.createIcons();
        return;
    }

    // Group by month for sectioned display
    const groupedByMonth = {};
    filteredExpenses.forEach(expense => {
        const monthKey = expense.date.substring(0, 7); // "2026-01"
        if (!groupedByMonth[monthKey]) {
            groupedByMonth[monthKey] = [];
        }
        groupedByMonth[monthKey].push(expense);
    });

    // Render grouped expenses
    Object.keys(groupedByMonth).sort().reverse().forEach(monthKey => {
        const monthExpenses = groupedByMonth[monthKey];
        const monthTotal = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
        const monthDate = new Date(monthKey + '-01');
        const monthName = monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

        // Month section header
        const sectionRow = document.createElement("tr");
        sectionRow.className = "expense-section-header";
        sectionRow.innerHTML = `
            <td colspan="4">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <i data-lucide="calendar" style="width: 16px; height: 16px;"></i>
                    <strong>${monthName}</strong>
                    <span style="color: var(--text-muted); font-size: 0.85rem;">(${monthExpenses.length} expense${monthExpenses.length > 1 ? 's' : ''})</span>
                </div>
            </td>
            <td class="amount-cell" style="font-weight: 600; color: var(--primary-color);">${formatCurrency(monthTotal)}</td>
            <td></td>
        `;
        expensesBody.appendChild(sectionRow);

        // Expense rows for this month
        monthExpenses.forEach(expense => {
            const row = document.createElement("tr");
            row.className = "expense-row-clickable";
            row.dataset.expenseId = expense.id;
            row.innerHTML = `
                <td class="date-cell">${formatDate(expense.date)}</td>
                <td>${expense.description}</td>
                <td>${getCategoryBadge(expense.category)}</td>
                <td>${paymentLabels[expense.payment] || expense.payment}</td>
                <td class="amount-cell">${formatCurrency(expense.amount)}</td>
            `;
            // Add click handler to show details modal
            row.addEventListener('click', () => showExpenseDetails(expense.id));
            expensesBody.appendChild(row);
        });
    });

    if (typeof lucide !== "undefined") lucide.createIcons();
}

// Update stats based on filtered expenses
function updateFilteredExpenseStats(filteredExpenses) {
    const total = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const materials = filteredExpenses.filter(e => e.category === "materials").reduce((sum, e) => sum + e.amount, 0);
    const transport = filteredExpenses.filter(e => e.category === "transport").reduce((sum, e) => sum + e.amount, 0);
    const other = filteredExpenses.filter(e => !["materials", "transport"].includes(e.category)).reduce((sum, e) => sum + e.amount, 0);

    if (monthlyTotalEl) monthlyTotalEl.textContent = formatCurrency(total);
    if (monthlyMaterialsEl) monthlyMaterialsEl.textContent = formatCurrency(materials);
    if (monthlyTransportEl) monthlyTransportEl.textContent = formatCurrency(transport);
    if (monthlyOtherEl) monthlyOtherEl.textContent = formatCurrency(other);
}

// Render expenses table (original function for initial load)
function renderExpensesTable() {
    filterAndRenderExpenses();
}

// Event listeners for filters
if (expenseMonthFilter) {
    expenseMonthFilter.addEventListener('change', filterAndRenderExpenses);
}
if (expenseCategoryFilter) {
    expenseCategoryFilter.addEventListener('change', filterAndRenderExpenses);
}
if (expenseSearchInput) {
    expenseSearchInput.addEventListener('input', filterAndRenderExpenses);
}

// Get selected materials from checkboxes
function getSelectedMaterials() {
    const checkboxes = document.querySelectorAll('#materials-selection-section input[type="checkbox"]:checked');
    return Array.from(checkboxes).map(cb => cb.value);
}

// Update description with selected materials
function updateDescriptionWithMaterials() {
    const selected = getSelectedMaterials();
    const descriptionField = document.getElementById("expense-description");

    if (selected.length > 0 && descriptionField) {
        descriptionField.value = selected.join(", ");
    }
}

// Toggle Material Selection for checkboxes in form
document.getElementById('expense-category')?.addEventListener('change', function () {
    const materialsSection = document.getElementById('materials-selection-section');
    if (this.value === 'materials' && materialsSection) {
        materialsSection.style.display = 'block';
    } else if (materialsSection) {
        materialsSection.style.display = 'none';
    }
});

// Material checkbox change handler
document.querySelectorAll('#materials-selection-section input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', updateDescriptionWithMaterials);
});

// ===== Expense Details Modal =====
let currentExpenseDetailId = null;

function showExpenseDetails(expenseId) {
    const expense = expenses.find(e => e.id === expenseId);
    if (!expense) return;

    currentExpenseDetailId = expenseId;

    // Populate modal
    document.getElementById('expense-detail-date').textContent = formatDate(expense.date);
    document.getElementById('expense-detail-description').textContent = expense.description;
    document.getElementById('expense-detail-category').innerHTML = getCategoryBadge(expense.category);
    document.getElementById('expense-detail-payment').textContent = paymentLabels[expense.payment] || expense.payment;
    document.getElementById('expense-detail-amount').textContent = formatCurrency(expense.amount);

    // Show materials if present
    const materialsRow = document.getElementById('expense-detail-materials-row');
    if (expense.materials) {
        document.getElementById('expense-detail-materials').textContent = expense.materials;
        materialsRow.style.display = 'flex';
    } else {
        materialsRow.style.display = 'none';
    }

    // Show modal
    const modal = document.getElementById('expense-details-modal');
    modal.classList.add('active');
    if (typeof lucide !== 'undefined') lucide.createIcons();

    // Handle Add User Profile Card Form
    document.addEventListener('DOMContentLoaded', function () {
        const addUserForm = document.getElementById('add-user-profile-form');
        if (addUserForm) {
            addUserForm.addEventListener('submit', function (e) {
                e.preventDefault();
                const fullName = document.getElementById('new-user-fullname').value.trim();
                const mind = document.getElementById('new-user-mind').value.trim();
                if (!fullName || !mind) return;
                // Create a new user object (minimal fields for demo)
                const newUser = {
                    id: Date.now(),
                    username: fullName.toLowerCase().replace(/\s+/g, ''),
                    full_name: fullName,
                    email: '-',
                    role: 'Staff',
                    status: 'Active',
                    last_login: null,
                    seller_name: '-',
                    phone: '-',
                    mind: mind
                };
                usersData.push(newUser);
                renderUsersTable(usersData);
                updateUserSummaryCards(usersData);
                // Optionally clear form
                addUserForm.reset();
            });
        }
    });
}

function closeExpenseDetailsModal() {
    const modal = document.getElementById('expense-details-modal');
    modal.classList.remove('active');
    currentExpenseDetailId = null;
}

// Delete expense from details modal
document.getElementById('delete-expense-detail-btn')?.addEventListener('click', async function () {
    if (currentExpenseDetailId && confirm('Are you sure you want to delete this expense?')) {
        await deleteExpense(currentExpenseDetailId);
        closeExpenseDetailsModal();
    }
});

// Close modal when clicking outside
document.getElementById('expense-details-modal')?.addEventListener('click', function (e) {
    if (e.target === this) {
        closeExpenseDetailsModal();
    }
});

// Add new expense to database
if (expenseForm) {
    expenseForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const selectedMaterials = getSelectedMaterials();
        const expenseData = {
            date: document.getElementById("expense-date").value,
            description: document.getElementById("expense-description").value || "No description",
            category: document.getElementById("expense-category").value,
            payment_method: document.getElementById("expense-payment").value,
            amount: parseFloat(document.getElementById("expense-amount").value),
            materials: selectedMaterials.length > 0 ? selectedMaterials.join(", ") : null
        };

        try {
            const response = await fetch(`${API_BASE_URL}/expenses`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(expenseData)
            });

            if (!response.ok) throw new Error('Failed to add expense');

            // Reset form
            expenseForm.reset();
            document.getElementById("expense-date").valueAsDate = new Date();
            document.getElementById('materials-selection-section').style.display = 'none';
            document.querySelectorAll('#materials-selection-section input[type="checkbox"]').forEach(cb => cb.checked = false);

            // Reload expenses
            await loadExpenses();

            // Show success toast
            showExpenseSuccessToast(expenseData.amount);
        } catch (error) {
            console.error('Error adding expense:', error);
            alert('Failed to add expense. Please check if the server is running.');
        }
    });
}

// Show success toast for expense
function showExpenseSuccessToast(amount) {
    const toast = document.createElement('div');
    toast.className = 'collect-success-toast';
    toast.innerHTML = `
        <div class="toast-icon" style="background: linear-gradient(135deg, #f44336 0%, #e91e63 100%);"><i data-lucide="receipt"></i></div>
        <div class="toast-content">
            <strong>Expense Added!</strong>
            <p>${formatCurrency(amount)}</p>
        </div>
    `;
    document.body.appendChild(toast);
    if (typeof lucide !== 'undefined') lucide.createIcons();

    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Delete expense from database
async function deleteExpense(id) {
    if (confirm("Are you sure you want to delete this expense?")) {
        try {
            const response = await fetch(`${API_BASE_URL}/expenses/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Failed to delete expense');

            // Reload expenses
            await loadExpenses();
        } catch (error) {
            console.error('Error deleting expense:', error);
            alert('Failed to delete expense. Please try again.');
        }
    }
}

// Initial load for expenses
loadExpenses();


// --- Outstanding Logic ---

// Outstanding data loaded from database
let outstandingShopsData = [];

// DOM Elements for Outstanding
const totalOutstandingEl = document.getElementById("total-outstanding");
const shopsWithDebtEl = document.getElementById("shops-with-debt");
const collectedMonthEl = document.getElementById("collected-month");
const outstandingBodyEl = document.getElementById("outstanding-body");
const osearchInput = document.getElementById("search-shop");
const filterStatus = document.getElementById("filter-status");
const oSortBy = document.getElementById("sort-by");

// Load outstanding data from database
async function loadOutstandingData() {
    try {
        // Load shops data
        const shopsResponse = await fetch(`${API_BASE_URL}/shops`);
        if (!shopsResponse.ok) {
            throw new Error('Failed to fetch shops');
        }
        const shops = await shopsResponse.json();

        // Load bills to calculate collected this month
        const billsResponse = await fetch(`${API_BASE_URL}/bills`);
        let collectedThisMonth = 0;

        if (billsResponse.ok) {
            const bills = await billsResponse.json();

            // Calculate payments collected this month
            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();

            bills.forEach(bill => {
                const billDate = new Date(bill.bill_date);
                if (billDate.getMonth() === currentMonth && billDate.getFullYear() === currentYear) {
                    // Paid amount = total_amount - net_amount (balance due)
                    const paidAmount = bill.total_amount - bill.net_amount;
                    if (paidAmount > 0) {
                        collectedThisMonth += paidAmount;
                    }
                }
            });
        }

        // Transform shops data for outstanding display
        const colors = ['#1E88E5', '#8E24AA', '#F4511E', '#00897B', '#795548', '#D81B60', '#5E35B1', '#00ACC1'];

        // Calculate total outstanding from ALL shops (not just filtered)
        const totalOutstandingAmount = shops.reduce((sum, shop) => sum + (shop.outstanding || 0), 0);
        const totalShopsWithDebt = shops.filter(shop => (shop.outstanding || 0) > 0).length;

        outstandingShopsData = shops
            .filter(shop => shop.outstanding > 0) // Only shops with outstanding for table
            .map((shop, index) => {
                // Determine status based on last_activity
                let status = 'good';
                if (shop.last_activity) {
                    const lastActivity = new Date(shop.last_activity);
                    const daysSinceActivity = Math.floor((new Date() - lastActivity) / (1000 * 60 * 60 * 24));

                    if (daysSinceActivity > 30) {
                        status = 'overdue';
                    } else if (daysSinceActivity > 14) {
                        status = 'pending';
                    }
                } else {
                    status = 'overdue';
                }

                return {
                    id: shop.id,
                    name: shop.name,
                    location: shop.city || 'N/A',
                    outstanding: shop.outstanding || 0,
                    lastPayment: shop.last_activity ? shop.last_activity.split('T')[0] : 'N/A',
                    lastPaymentAmount: 0,
                    status: status,
                    color: colors[index % colors.length]
                };
            });

        // Update stats with correct totals
        updateOutstandingStatsFromData(totalOutstandingAmount, totalShopsWithDebt, collectedThisMonth);

        // Render table
        filterAndSortOutstanding();

    } catch (error) {
        console.error('Error loading outstanding data:', error);
    }
}

// Calculate and display stats
function updateOutstandingStatsFromData(totalOutstanding, shopsWithDebt, collectedThisMonth = 0) {
    if (!totalOutstandingEl) return;

    totalOutstandingEl.textContent = `LKR ${totalOutstanding.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
    shopsWithDebtEl.textContent = shopsWithDebt;
    collectedMonthEl.textContent = `LKR ${collectedThisMonth.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
}

// Legacy function for compatibility
function updateOutstandingStats() {
    updateOutstandingStatsFromData(0);
}

// Get status badge for outstanding
function getOutstandingStatusBadge(status) {
    const statusMap = {
        'overdue': '<span class="status-badge status-overdue">Overdue</span>',
        'pending': '<span class="status-badge status-pending">Pending</span>',
        'good': '<span class="status-badge status-good">Good</span>'
    };
    return statusMap[status] || "";
}

// Render outstanding table
function renderOutstandingTable(data) {
    if (!outstandingBodyEl) return;
    outstandingBodyEl.innerHTML = "";

    if (data.length === 0) {
        outstandingBodyEl.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 40px; color: var(--text-muted);">
                    <i data-lucide="inbox" style="width: 48px; height: 48px; margin-bottom: 10px;"></i>
                    <p>No shops found</p>
                </td>
            </tr>
        `;
        if (typeof lucide !== "undefined") lucide.createIcons();
        return;
    }

    data.forEach(shop => {
        const initials = shop.name.split(" ").map(w => w[0]).join("").substring(0, 2);
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>
                <div class="shop-name-cell">
                    <div class="shop-avatar" style="background-color: ${shop.color};">${initials}</div>
                    <div>
                        <h4>${shop.name}</h4>
                        <span>${shop.location}</span>
                    </div>
                </div>
            </td>
            <td class="amount-cell">LKR ${shop.outstanding.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
            <td class="last-payment">${formatDate(shop.lastPayment)}</td>
            <td>${getOutstandingStatusBadge(shop.status)}</td>
            <td>
                <div class="action-buttons">
                    <a href="#" onclick="event.preventDefault(); window.location.href='billing.html?shop_id=${shop.id}'" class="btn-view">
                        <i data-lucide="file-text" style="width: 14px; height: 14px;"></i> Bill
                    </a>
                    <button class="btn-collect" onclick="collectPayment(${shop.id})">
                        <i data-lucide="wallet" style="width: 14px; height: 14px;"></i> Collect
                    </button>
                </div>
            </td>
        `;
        outstandingBodyEl.appendChild(row);
    });

    if (typeof lucide !== "undefined") lucide.createIcons();
}

// Filter and sort outstanding data
function filterAndSortOutstanding() {
    let filtered = [...outstandingShopsData];

    // Search filter
    if (osearchInput) {
        const searchTerm = osearchInput.value.toLowerCase();
        if (searchTerm) {
            filtered = filtered.filter(shop =>
                shop.name.toLowerCase().includes(searchTerm) ||
                shop.location.toLowerCase().includes(searchTerm)
            );
        }
    }

    // Status filter
    if (filterStatus) {
        const status = filterStatus.value;
        if (status !== "all") {
            filtered = filtered.filter(shop => shop.status === status);
        }
    }

    // Sort
    if (oSortBy) {
        const sort = oSortBy.value;
        switch (sort) {
            case "amount-desc":
                filtered.sort((a, b) => b.outstanding - a.outstanding);
                break;
            case "amount-asc":
                filtered.sort((a, b) => a.outstanding - b.outstanding);
                break;
            case "name":
                filtered.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case "date":
                filtered.sort((a, b) => new Date(b.lastPayment) - new Date(a.lastPayment));
                break;
        }
    }

    renderOutstandingTable(filtered);
}

// Collect Payment Modal Variables
let currentCollectShopId = null;
let currentCollectShopOutstanding = 0;

// Open Collect Payment Modal
function collectPayment(shopId) {
    const shop = outstandingShopsData.find(s => s.id === shopId);
    if (!shop) return;

    currentCollectShopId = shopId;
    currentCollectShopOutstanding = shop.outstanding;

    // Populate modal
    document.getElementById('collect-shop-name').textContent = shop.name;
    document.getElementById('collect-current-outstanding').textContent = `LKR ${shop.outstanding.toLocaleString()}`;
    document.getElementById('collect-amount').value = '';
    document.getElementById('collect-note').value = '';
    document.getElementById('collect-new-outstanding').textContent = `LKR ${shop.outstanding.toLocaleString()}`;

    // Reset quick amount buttons
    document.querySelectorAll('.quick-amount-btn').forEach(btn => btn.classList.remove('active'));

    // Show modal
    const modal = document.getElementById('collect-payment-modal');
    modal.classList.add('active');
    if (typeof lucide !== 'undefined') lucide.createIcons();

    // Focus on amount input
    setTimeout(() => {
        document.getElementById('collect-amount').focus();
    }, 100);
}

// Close Collect Payment Modal
function closeCollectModal() {
    const modal = document.getElementById('collect-payment-modal');
    modal.classList.remove('active');
    currentCollectShopId = null;
    currentCollectShopOutstanding = 0;
}

// Update remaining outstanding display
function updateRemainingOutstanding() {
    const amountInput = document.getElementById('collect-amount');
    const amount = parseFloat(amountInput.value) || 0;
    const remaining = Math.max(0, currentCollectShopOutstanding - amount);
    document.getElementById('collect-new-outstanding').textContent = `LKR ${remaining.toLocaleString()}`;

    // Update color based on remaining
    const displayEl = document.querySelector('.new-outstanding-display');
    if (remaining === 0) {
        displayEl.style.background = 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)';
        displayEl.style.borderColor = '#a5d6a7';
        displayEl.querySelector('.amount').style.color = '#2e7d32';
    } else {
        displayEl.style.background = 'linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%)';
        displayEl.style.borderColor = '#ffe082';
        displayEl.querySelector('.amount').style.color = '#f57c00';
    }
}

// Quick Amount Button Handler
document.querySelectorAll('.quick-amount-btn').forEach(btn => {
    btn.addEventListener('click', function () {
        const percent = parseInt(this.dataset.percent);
        const amount = (currentCollectShopOutstanding * percent) / 100;
        document.getElementById('collect-amount').value = amount.toFixed(2);

        // Update active state
        document.querySelectorAll('.quick-amount-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');

        updateRemainingOutstanding();
    });
});

// Amount input change handler
document.getElementById('collect-amount')?.addEventListener('input', function () {
    document.querySelectorAll('.quick-amount-btn').forEach(b => b.classList.remove('active'));
    updateRemainingOutstanding();
});

// Confirm Collect Payment
document.getElementById('confirm-collect-btn')?.addEventListener('click', async function () {
    const amount = parseFloat(document.getElementById('collect-amount').value);

    if (!amount || amount <= 0) {
        alert('Please enter a valid payment amount');
        return;
    }

    if (amount > currentCollectShopOutstanding) {
        alert('Payment amount cannot exceed outstanding amount');
        return;
    }

    const shop = outstandingShopsData.find(s => s.id === currentCollectShopId);
    if (!shop) return;

    const newOutstanding = Math.max(0, currentCollectShopOutstanding - amount);
    const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format

    try {
        // Update shop outstanding and last_activity in database
        const response = await fetch(`${API_BASE_URL}/shops/${currentCollectShopId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                outstanding: newOutstanding,
                last_activity: today  // Update last_activity to today - this updates the status automatically
            })
        });

        if (!response.ok) {
            throw new Error('Failed to update payment');
        }

        // Close modal
        closeCollectModal();

        // Show success message
        showCollectSuccessMessage(shop.name, amount, newOutstanding);

        // Reload outstanding data
        await loadOutstandingData();

    } catch (error) {
        console.error('Error collecting payment:', error);
        alert('Failed to record payment. Please try again.');
    }
});

// Show success message after collection
function showCollectSuccessMessage(shopName, amount, newOutstanding) {
    // Create toast notification
    const toast = document.createElement('div');
    toast.className = 'collect-success-toast';
    toast.innerHTML = `
        <div class="toast-icon"><i data-lucide="check-circle"></i></div>
        <div class="toast-content">
            <strong>Payment Collected!</strong>
            <p>LKR ${amount.toLocaleString()} from ${shopName}</p>
            ${newOutstanding === 0 ? '<span class="cleared-badge">Outstanding Cleared!</span>' : `<span>Remaining: LKR ${newOutstanding.toLocaleString()}</span>`}
        </div>
    `;
    document.body.appendChild(toast);
    if (typeof lucide !== 'undefined') lucide.createIcons();

    // Animate in
    setTimeout(() => toast.classList.add('show'), 10);

    // Remove after 4 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// Close modal when clicking outside
document.getElementById('collect-payment-modal')?.addEventListener('click', function (e) {
    if (e.target === this) {
        closeCollectModal();
    }
});

// Event Listeners for Outstanding
if (osearchInput) {
    osearchInput.addEventListener("input", filterAndSortOutstanding);
    filterStatus.addEventListener("change", filterAndSortOutstanding);
    oSortBy.addEventListener("change", filterAndSortOutstanding);
}

// Initial load for Outstanding
loadOutstandingData();


// ============================================
// Expense Category Materials Toggle
// ============================================

// Show/hide materials section when Raw Materials category is selected
const expenseCategory = document.getElementById('expense-category');
const materialsSection = document.getElementById('materials-selection-section');

if (expenseCategory && materialsSection) {
    expenseCategory.addEventListener('change', function () {
        if (this.value === 'materials') {
            materialsSection.style.display = 'block';
            // Re-initialize icons after showing the section
            setTimeout(() => { if (typeof lucide !== 'undefined') lucide.createIcons(); }, 100);
        } else {
            materialsSection.style.display = 'none';
        }
    });
}


// ============================================
// Edit Product Modal Functions
// ============================================

let currentEditingProductRow = null;

// Open Edit Product Modal
window.openEditProductModal = function (button) {
    console.log('Opening edit product modal', button);
    const modal = document.getElementById('edit-product-modal');
    if (!modal) {
        console.error('Modal not found!');
        alert('Modal element not found!');
        return;
    }

    const row = button.closest('tr');
    if (!row) {
        console.error('Row not found!');
        alert('Could not find table row!');
        return;
    }

    currentEditingProductRow = row;

    // Extract current product data from the row
    const cells = row.querySelectorAll('td');
    const productName = cells[0].querySelector('h4').textContent;
    const productDescription = cells[0].querySelector('span').textContent;
    const category = cells[1].textContent;
    const sizes = cells[2].textContent;
    const priceRange = cells[3].textContent.trim();
    const status = cells[4].querySelector('.status-badge').textContent.trim();

    // Parse price range
    const prices = priceRange.split('-').map(p => p.trim());

    // Populate modal fields
    document.getElementById('edit-product-name').value = productName;
    document.getElementById('edit-product-description').value = productDescription;
    document.getElementById('edit-product-category').value = category;
    document.getElementById('edit-product-sizes').value = sizes;
    document.getElementById('edit-product-price-min').value = prices[0] || '';
    document.getElementById('edit-product-price-max').value = prices[1] || '';
    document.getElementById('edit-product-status').value = status;

    // Show modal
    modal.classList.add('active');
    console.log('Modal should be visible now');
}

// Close Edit Product Modal
window.closeEditProductModal = function () {
    const modal = document.getElementById('edit-product-modal');
    modal.classList.remove('active');
    currentEditingProductRow = null;
}

// Save Product Changes
window.saveProductChanges = function () {
    if (!currentEditingProductRow) return;

    const name = document.getElementById('edit-product-name').value.trim();
    const description = document.getElementById('edit-product-description').value.trim();
    const category = document.getElementById('edit-product-category').value;
    const sizes = document.getElementById('edit-product-sizes').value.trim();
    const priceMin = document.getElementById('edit-product-price-min').value.trim();
    const priceMax = document.getElementById('edit-product-price-max').value.trim();
    const status = document.getElementById('edit-product-status').value;

    // Validation
    if (!name) {
        alert('Please enter a product name');
        return;
    }

    // Update the row with new data
    const cells = currentEditingProductRow.querySelectorAll('td');

    // Update product name and description
    cells[0].querySelector('h4').textContent = name;
    cells[0].querySelector('span').textContent = description;

    // Update category
    cells[1].textContent = category;

    // Update sizes
    cells[2].textContent = sizes;

    // Update price range
    cells[3].textContent = `${priceMin} - ${priceMax}`;

    // Update status
    const statusBadge = cells[4].querySelector('.status-badge');
    statusBadge.textContent = status;
    statusBadge.className = 'status-badge ' + (status === 'Active' ? 'status-fresh' : 'status-expired');

    // Close modal
    closeEditProductModal();

    // Reinitialize icons
    if (typeof lucide !== 'undefined') lucide.createIcons();

    alert('Product updated successfully!');
}

// Attach event listeners to all edit buttons in products view
document.addEventListener('DOMContentLoaded', function () {
    // Wait a bit for the DOM to be fully ready
    setTimeout(() => {
        const productsView = document.getElementById('products-view');
        if (productsView) {
            productsView.addEventListener('click', function (e) {
                const editBtn = e.target.closest('.action-btn');
                if (editBtn) {
                    // Check if this button is in the products view table
                    const productsTable = productsView.querySelector('.data-table');
                    if (productsTable && productsTable.contains(editBtn)) {
                        openEditProductModal(editBtn);
                    }
                }
            });
        }

        // Close modal when clicking outside
        const modal = document.getElementById('edit-product-modal');
        if (modal) {
            modal.addEventListener('click', function (e) {
                if (e.target === modal) {
                    closeEditProductModal();
                }
            });
        }
    }, 100);
});

// ============================================
// Reports Page - Charts
// ============================================

let salesPieChart = null;
let weightPieChart = null;
let revenueBarChart = null;
let expensePieChart = null;
let shopsPieChart = null;

// Initialize pie chart filters
function initPieChartFilters() {
    const yearSelect = document.getElementById('pie-chart-year');
    const monthSelect = document.getElementById('pie-chart-month');

    if (!yearSelect) return;

    // Populate years (current year and 2 previous years)
    const currentYear = new Date().getFullYear();
    yearSelect.innerHTML = '<option value="">All Years</option>';
    for (let y = currentYear; y >= currentYear - 2; y--) {
        yearSelect.innerHTML += `<option value="${y}">${y}</option>`;
    }

    // Set default to current month/year
    const currentMonth = new Date().getMonth() + 1;
    if (monthSelect) monthSelect.value = currentMonth;
    yearSelect.value = currentYear;

    // Add event listeners
    yearSelect.addEventListener('change', loadPieChartData);
    if (monthSelect) monthSelect.addEventListener('change', loadPieChartData);
}

// Initialize weight chart filters
function initWeightChartFilters() {
    const yearSelect = document.getElementById('weight-chart-year');
    const monthSelect = document.getElementById('weight-chart-month');

    if (!yearSelect) return;

    // Populate years (current year and 2 previous years)
    const currentYear = new Date().getFullYear();
    yearSelect.innerHTML = '<option value="">All Years</option>';
    for (let y = currentYear; y >= currentYear - 2; y--) {
        yearSelect.innerHTML += `<option value="${y}">${y}</option>`;
    }

    // Set default to current month/year
    const currentMonth = new Date().getMonth() + 1;
    if (monthSelect) monthSelect.value = currentMonth;
    yearSelect.value = currentYear;

    // Add event listeners
    yearSelect.addEventListener('change', loadWeightChartData);
    if (monthSelect) monthSelect.addEventListener('change', loadWeightChartData);
}

// Initialize expense pie chart filters
function initExpenseChartFilters() {
    const yearSelect = document.getElementById('expense-pie-year');
    const monthSelect = document.getElementById('expense-pie-month');

    if (!yearSelect) return;

    // Populate years (current year and 2 previous years)
    const currentYear = new Date().getFullYear();
    yearSelect.innerHTML = '<option value="">All Years</option>';
    for (let y = currentYear; y >= currentYear - 2; y--) {
        yearSelect.innerHTML += `<option value="${y}">${y}</option>`;
    }

    // Set default to current month/year
    const currentMonth = new Date().getMonth() + 1;
    if (monthSelect) monthSelect.value = currentMonth;
    yearSelect.value = currentYear;

    // Add event listeners
    yearSelect.addEventListener('change', loadExpenseChartData);
    if (monthSelect) monthSelect.addEventListener('change', loadExpenseChartData);
}

// Initialize shops pie chart filters
function initShopsChartFilters() {
    const yearSelect = document.getElementById('shops-pie-year');
    const monthSelect = document.getElementById('shops-pie-month');

    if (!yearSelect) return;

    // Populate years (current year and 2 previous years)
    const currentYear = new Date().getFullYear();
    yearSelect.innerHTML = '<option value="">All Years</option>';
    for (let y = currentYear; y >= currentYear - 2; y--) {
        yearSelect.innerHTML += `<option value="${y}">${y}</option>`;
    }

    // Set default to current month/year
    const currentMonth = new Date().getMonth() + 1;
    if (monthSelect) monthSelect.value = currentMonth;
    yearSelect.value = currentYear;

    // Add event listeners
    yearSelect.addEventListener('change', loadShopsChartData);
    if (monthSelect) monthSelect.addEventListener('change', loadShopsChartData);
}

// Load pie chart data with filters
async function loadPieChartData() {
    const month = document.getElementById('pie-chart-month')?.value || '';
    const year = document.getElementById('pie-chart-year')?.value || '';

    let url = `${API_BASE_URL}/reports/sales-by-category`;
    const params = new URLSearchParams();
    if (month) params.append('month', month);
    if (year) params.append('year', year);
    if (params.toString()) url += '?' + params.toString();

    try {
        const response = await fetch(url);
        const categoryData = await response.json();
        updatePieChart(categoryData);
    } catch (error) {
        console.error('Error loading pie chart:', error);
    }
}

// Load weight chart data with filters
async function loadWeightChartData() {
    const month = document.getElementById('weight-chart-month')?.value || '';
    const year = document.getElementById('weight-chart-year')?.value || '';

    let url = `${API_BASE_URL}/reports/sales-by-weight`;
    const params = new URLSearchParams();
    if (month) params.append('month', month);
    if (year) params.append('year', year);
    if (params.toString()) url += '?' + params.toString();

    try {
        const response = await fetch(url);
        const weightData = await response.json();
        updateWeightChart(weightData);
    } catch (error) {
        console.error('Error loading weight chart:', error);
    }
}

// Load expense chart data with filters
async function loadExpenseChartData() {
    const month = document.getElementById('expense-pie-month')?.value || '';
    const year = document.getElementById('expense-pie-year')?.value || '';

    let url = `${API_BASE_URL}/reports/expenses-by-category`;
    const params = new URLSearchParams();
    if (month) params.append('month', month);
    if (year) params.append('year', year);
    if (params.toString()) url += '?' + params.toString();

    try {
        const response = await fetch(url);
        const expenseData = await response.json();
        updateExpenseChart(expenseData);
    } catch (error) {
        console.error('Error loading expense chart:', error);
    }
}

// Load shops chart data with filters
async function loadShopsChartData() {
    const month = document.getElementById('shops-pie-month')?.value || '';
    const year = document.getElementById('shops-pie-year')?.value || '';

    let url = `${API_BASE_URL}/reports/top-shops`;
    const params = new URLSearchParams();
    if (month) params.append('month', month);
    if (year) params.append('year', year);
    if (params.toString()) url += '?' + params.toString();

    try {
        const response = await fetch(url);
        const shopsData = await response.json();
        updateShopsChart(shopsData);
    } catch (error) {
        console.error('Error loading shops chart:', error);
    }
}

// Update pie chart with new data
function updatePieChart(categoryData) {
    const pieCtx = document.getElementById('salesPieChart');
    if (!pieCtx) return;

    if (salesPieChart) {
        salesPieChart.destroy();
    }

    salesPieChart = new Chart(pieCtx, {
        type: 'pie',
        data: {
            labels: categoryData.labels,
            datasets: [{
                data: categoryData.values,
                backgroundColor: [
                    '#f97316',
                    '#3b82f6',
                    '#10b981',
                    '#f59e0b',
                    '#ef4444',
                    '#8b5cf6',
                    '#ec4899'
                ],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        font: { size: 12 }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            let label = context.label || '';
                            if (label) label += ': ';
                            label += 'LKR ' + context.parsed.toLocaleString();
                            return label;
                        }
                    }
                }
            }
        }
    });
}

// Update weight pie chart with new data
function updateWeightChart(weightData) {
    const pieCtx = document.getElementById('weightPieChart');
    if (!pieCtx) return;

    if (weightPieChart) {
        weightPieChart.destroy();
    }

    weightPieChart = new Chart(pieCtx, {
        type: 'pie',
        data: {
            labels: weightData.labels,
            datasets: [{
                data: weightData.values,
                backgroundColor: [
                    '#10b981',
                    '#3b82f6',
                    '#f97316',
                    '#8b5cf6',
                    '#ef4444',
                    '#f59e0b',
                    '#ec4899',
                    '#06b6d4',
                    '#84cc16'
                ],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        font: { size: 12 }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            let label = context.label || '';
                            if (label) label += ': ';
                            label += 'LKR ' + context.parsed.toLocaleString();
                            return label;
                        }
                    }
                }
            }
        }
    });
}

// Update expense pie chart
function updateExpenseChart(expenseData) {
    const pieCtx = document.getElementById('expensePieChart');
    if (!pieCtx) return;

    if (expensePieChart) {
        expensePieChart.destroy();
    }

    expensePieChart = new Chart(pieCtx, {
        type: 'pie',
        data: {
            labels: expenseData.labels,
            datasets: [{
                data: expenseData.values,
                backgroundColor: [
                    '#ef4444',
                    '#f97316',
                    '#f59e0b',
                    '#84cc16',
                    '#10b981',
                    '#06b6d4',
                    '#3b82f6',
                    '#8b5cf6',
                    '#ec4899'
                ],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        font: { size: 12 }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            let label = context.label || '';
                            if (label) label += ': ';
                            label += 'LKR ' + context.parsed.toLocaleString();
                            return label;
                        }
                    }
                }
            }
        }
    });
}

// Update shops pie chart
function updateShopsChart(shopsData) {
    const pieCtx = document.getElementById('shopsPieChart');
    if (!pieCtx) return;

    if (shopsPieChart) {
        shopsPieChart.destroy();
    }

    shopsPieChart = new Chart(pieCtx, {
        type: 'pie',
        data: {
            labels: shopsData.labels,
            datasets: [{
                data: shopsData.values,
                backgroundColor: [
                    '#3b82f6',
                    '#10b981',
                    '#f97316',
                    '#8b5cf6',
                    '#ef4444',
                    '#f59e0b',
                    '#ec4899',
                    '#06b6d4',
                    '#84cc16',
                    '#6366f1'
                ],
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        font: { size: 12 }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            let label = context.label || '';
                            if (label) label += ': ';
                            label += 'LKR ' + context.parsed.toLocaleString();
                            return label;
                        }
                    }
                }
            }
        }
    });
}

let monthlyWeightChart = null;

// Initialize monthly weight chart filter
function initMonthlyWeightFilter() {
    const yearSelect = document.getElementById('monthly-weight-year');
    if (!yearSelect) return;

    const currentYear = new Date().getFullYear();
    yearSelect.innerHTML = '';
    for (let y = currentYear; y >= currentYear - 2; y--) {
        yearSelect.innerHTML += `<option value="${y}">${y}</option>`;
    }
    yearSelect.value = currentYear;

    yearSelect.addEventListener('change', loadMonthlyWeightChart);
}

// Load monthly weight sales chart
async function loadMonthlyWeightChart() {
    const year = document.getElementById('monthly-weight-year')?.value || new Date().getFullYear();

    try {
        const response = await fetch(`${API_BASE_URL}/reports/monthly-weight-sales?year=${year}`);
        const data = await response.json();
        updateMonthlyWeightChart(data);
    } catch (error) {
        console.error('Error loading monthly weight chart:', error);
    }
}

// Update monthly weight chart
function updateMonthlyWeightChart(data) {
    const ctx = document.getElementById('monthlyWeightChart');
    if (!ctx) return;

    if (monthlyWeightChart) {
        monthlyWeightChart.destroy();
    }

    monthlyWeightChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.labels,
            datasets: data.datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        font: { size: 11 }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return `${context.dataset.label}: ${context.parsed.y} packets`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    stacked: true,
                    grid: { display: false }
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    ticks: {
                        callback: function (value) {
                            return value + ' pcs';
                        }
                    }
                }
            }
        }
    });
}

// Load reports data from API
async function loadReportsData() {
    try {
        // Initialize filters first
        initPieChartFilters();
        initWeightChartFilters();
        initExpenseChartFilters();
        initShopsChartFilters();
        initMonthlyWeightFilter();

        // Fetch all reports data in parallel
        const [revenueRes, summaryRes] = await Promise.all([
            fetch(`${API_BASE_URL}/reports/monthly-revenue`),
            fetch(`${API_BASE_URL}/reports/summary`)
        ]);

        const revenueData = await revenueRes.json();
        const summaryData = await summaryRes.json();

        // Load pie charts with filters
        await loadPieChartData();
        await loadWeightChartData();
        await loadExpenseChartData();
        await loadShopsChartData();
        await loadMonthlyWeightChart();

        // Initialize new filters
        initRevenueChartFilter();
        initSummaryFilters();

        // Initialize bar chart
        initializeBarChart(revenueData);

        // Update summary stats
        updateReportsSummary(summaryData);

    } catch (error) {
        console.error('Error loading reports:', error);
    }
}

// Initialize revenue chart year filter
function initRevenueChartFilter() {
    const yearSelect = document.getElementById('revenue-chart-year');
    if (!yearSelect) return;

    const currentYear = new Date().getFullYear();
    yearSelect.innerHTML = '';
    for (let y = currentYear; y >= currentYear - 2; y--) {
        yearSelect.innerHTML += `<option value="${y}">${y}</option>`;
    }
    yearSelect.value = currentYear;

    yearSelect.addEventListener('change', loadRevenueChartData);
}

// Load revenue chart data by year
async function loadRevenueChartData() {
    const year = document.getElementById('revenue-chart-year')?.value || new Date().getFullYear();

    try {
        const response = await fetch(`${API_BASE_URL}/reports/monthly-revenue-by-year?year=${year}`);
        const data = await response.json();
        initializeBarChart(data);
    } catch (error) {
        console.error('Error loading revenue chart:', error);
    }
}

// Initialize summary filters
function initSummaryFilters() {
    const yearSelect = document.getElementById('summary-year');
    const monthSelect = document.getElementById('summary-month');

    if (!yearSelect) return;

    const currentYear = new Date().getFullYear();
    yearSelect.innerHTML = '<option value="">All Years</option>';
    for (let y = currentYear; y >= currentYear - 2; y--) {
        yearSelect.innerHTML += `<option value="${y}">${y}</option>`;
    }

    const currentMonth = new Date().getMonth() + 1;
    if (monthSelect) monthSelect.value = currentMonth;
    yearSelect.value = currentYear;

    yearSelect.addEventListener('change', loadSummaryData);
    if (monthSelect) monthSelect.addEventListener('change', loadSummaryData);
}

// Load summary data with filters
async function loadSummaryData() {
    const month = document.getElementById('summary-month')?.value || '';
    const year = document.getElementById('summary-year')?.value || '';

    let url = `${API_BASE_URL}/reports/summary`;
    const params = new URLSearchParams();
    if (month) params.append('month', month);
    if (year) params.append('year', year);
    if (params.toString()) url += '?' + params.toString();

    try {
        const response = await fetch(url);
        const data = await response.json();
        updateReportsSummary(data);
    } catch (error) {
        console.error('Error loading summary:', error);
    }
}

// Update summary statistics
function updateReportsSummary(data) {
    const formatCurrency = (amount) => `LKR ${amount.toLocaleString('en-US', { minimumFractionDigits: 0 })}`;

    // Update summary cards by ID
    const revenueEl = document.getElementById('summary-revenue');
    const expensesEl = document.getElementById('summary-expenses');
    const profitEl = document.getElementById('summary-profit');
    const marginEl = document.getElementById('summary-margin');

    if (revenueEl) revenueEl.textContent = formatCurrency(data.total_revenue);
    if (expensesEl) expensesEl.textContent = formatCurrency(data.total_expenses);
    if (profitEl) profitEl.textContent = formatCurrency(data.net_profit);
    if (marginEl) marginEl.textContent = `${data.profit_margin}%`;
}

// Initialize Bar Chart only
function initializeBarChart(revenueData) {
    // Revenue Bar Chart
    const barCtx = document.getElementById('revenueBarChart');
    if (barCtx) {
        if (revenueBarChart) {
            revenueBarChart.destroy();
        }
        revenueBarChart = new Chart(barCtx, {
            type: 'bar',
            data: {
                labels: revenueData.labels,
                datasets: [{
                    label: 'Revenue',
                    data: revenueData.values,
                    backgroundColor: '#f97316',
                    borderRadius: 6,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                return 'Revenue: LKR ' + context.parsed.y.toLocaleString();
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function (value) {
                                return 'LKR ' + (value / 1000) + 'K';
                            }
                        }
                    }
                }
            }
        });
    }
}

// Refresh Reports
window.refreshReports = function () {
    loadReportsData();
    if (typeof lucide !== 'undefined') lucide.createIcons();
};



// ============================================
// Products API Functions
// ============================================

let productsData = [];

// Fetch all products from API
async function loadProducts() {
    try {
        const response = await fetch(`${API_BASE_URL}/products`);
        if (!response.ok) {
            throw new Error('Failed to fetch products');
        }
        productsData = await response.json();
        renderProductsTable(productsData);
    } catch (error) {
        console.error('Error loading products:', error);
        showProductsError('Failed to load products. Make sure the backend server is running on http://localhost:5000');
    }
}

// Render products table
function renderProductsTable(products) {
    const tbody = document.querySelector('#products-view table tbody');

    if (!tbody) {
        console.error('Products table body not found');
        return;
    }

    if (!products || products.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px;">
                    <p style="color: #666;">No products found. Add a product to get started.</p>
                </td>
            </tr>
        `;
        if (typeof lucide !== 'undefined') lucide.createIcons();
        return;
    }

    tbody.innerHTML = products.map(product => {
        // Get variant information
        const variants = product.variants || [];
        const sizes = variants.map(v => v.weight_size).join(', ');

        // Get unit price (first variant's price or base price)
        let unitPrice = 'N/A';
        if (variants.length > 0 && variants[0].unit_price != null) {
            unitPrice = variants[0].unit_price.toFixed(2);
        }

        return `
            <tr data-product-id="${product.products_id}">
                <td>
                    <div class="product-cell">
                        <h4>${product.product_name}</h4>
                        <span>${variants.length} variant(s) available</span>
                    </div>
                </td>
                <td>${product.category || 'N/A'}</td>
                <td>${sizes || 'No sizes'}</td>
                <td class="text-right">${unitPrice}</td>
                <td><span class="status-badge status-fresh">Active</span></td>
                <td class="text-right">
                    <button class="action-btn" onclick="viewProductDetails(${product.products_id})">
                        <i data-lucide="eye"></i>
                    </button>
                    <button class="action-btn" onclick="editProduct(${product.products_id})">
                        <i data-lucide="edit-2"></i>
                    </button>
                    <button class="action-btn" onclick="deleteProduct(${product.products_id}, '${product.product_name}')">
                        <i data-lucide="trash-2"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');

    // Reinitialize Lucide icons
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// Show error message
function showProductsError(message) {
    const tbody = document.querySelector('#products-view table tbody');
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px;">
                    <p style="color: #e74c3c; margin-bottom: 10px;">⚠️ ${message}</p>
                    <button class="btn-primary" onclick="loadProducts()">
                        <i data-lucide="refresh-cw"></i> Retry
                    </button>
                </td>
            </tr>
        `;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
}

// View product details (opens modal with all variants)
window.viewProductDetails = function (productId) {
    const product = productsData.find(p => p.products_id === productId);
    if (!product) return;

    const variantsHtml = product.variants.map(v => `
        <tr>
            <td>${v.weight_size}</td>
            <td class="text-right">Rs. ${v.unit_price.toFixed(2)}</td>
            <td class="text-right">Rs. ${v.cost_price.toFixed(2)}</td>
            <td class="text-right">${v.reorder_level || 'N/A'}</td>
        </tr>
    `).join('');

    const modalHtml = `
        <div class="modal active" id="product-details-modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>${product.product_name}</h2>
                    <button class="modal-close" onclick="closeProductDetailsModal()">
                        <i data-lucide="x"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <p><strong>Category:</strong> ${product.category || 'N/A'}</p>
                    <p><strong>Created:</strong> ${new Date(product.created_at).toLocaleDateString()}</p>
                    
                    <h3 style="margin-top: 20px; margin-bottom: 10px;">Product Variants</h3>
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Size</th>
                                <th class="text-right">Unit Price</th>
                                <th class="text-right">Cost Price</th>
                                <th class="text-right">Reorder Level</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${variantsHtml}
                        </tbody>
                    </table>
                </div>
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="closeProductDetailsModal()">Close</button>
                    <button class="btn-primary" onclick="closeProductDetailsModal(); editProduct(${productId})">
                        <i data-lucide="edit-2"></i> Edit Product
                    </button>
                </div>
            </div>
        </div>
    `;

    // Add modal to body
    const existingModal = document.getElementById('product-details-modal');
    if (existingModal) existingModal.remove();

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    if (typeof lucide !== 'undefined') lucide.createIcons();
};

window.closeProductDetailsModal = function () {
    const modal = document.getElementById('product-details-modal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    }
};

// ============================================
// Edit Product Functions
// ============================================

let editVariantCounter = 0;
let currentEditProductId = null;

// Open Edit Product Modal
window.editProduct = function (productId) {
    const product = productsData.find(p => p.products_id === productId);
    if (!product) return;

    currentEditProductId = productId;
    editVariantCounter = 0;

    // Populate form fields
    document.getElementById('edit-product-id').value = productId;
    document.getElementById('edit-product-name').value = product.product_name;
    document.getElementById('edit-product-category').value = product.category || '';

    // Clear and populate variants
    const container = document.getElementById('edit-variants-container');
    container.innerHTML = '';

    if (product.variants && product.variants.length > 0) {
        product.variants.forEach(variant => {
            addEditVariantRow(variant);
        });
    } else {
        addEditVariantRow(); // Add empty row if no variants
    }

    // Show modal
    const modal = document.getElementById('edit-product-modal');
    modal.classList.add('active');
    if (typeof lucide !== 'undefined') lucide.createIcons();
};

// Close Edit Product Modal
window.closeEditProductModal = function () {
    const modal = document.getElementById('edit-product-modal');
    modal.classList.remove('active');
    currentEditProductId = null;

    // Clear form
    document.getElementById('edit-product-name').value = '';
    document.getElementById('edit-product-category').value = '';
    document.getElementById('edit-variants-container').innerHTML = '';
};

// Add variant row for edit modal
window.addEditVariantRow = function (variant = null) {
    editVariantCounter++;
    const container = document.getElementById('edit-variants-container');

    const variantRow = document.createElement('div');
    variantRow.className = 'variant-row';
    variantRow.id = `edit-variant-row-${editVariantCounter}`;
    variantRow.dataset.variantId = variant ? variant.product_variants_id : '';

    variantRow.innerHTML = `
        <div class="form-group">
            <label>Size</label>
            <input type="text" class="variant-size" placeholder="e.g., 50g" value="${variant ? variant.weight_size : ''}" required>
        </div>
        <div class="form-group">
            <label>Unit Price (Rs.)</label>
            <input type="number" class="variant-unit-price" placeholder="0.00" step="0.01" min="0" value="${variant ? variant.unit_price : ''}" required>
        </div>
        <div class="form-group">
            <label>Cost Price (Rs.)</label>
            <input type="number" class="variant-cost-price" placeholder="0.00" step="0.01" min="0" value="${variant ? variant.cost_price : ''}" required>
        </div>
        <div class="form-group">
            <label>Reorder Level</label>
            <input type="number" class="variant-reorder-level" placeholder="0" min="0" value="${variant ? variant.reorder_level || '' : ''}">
        </div>
        <button type="button" class="remove-variant-btn" onclick="removeEditVariantRow(${editVariantCounter})" title="Remove variant">
            <i data-lucide="trash-2"></i>
        </button>
    `;

    container.appendChild(variantRow);
    if (typeof lucide !== 'undefined') lucide.createIcons();
};

// Remove variant row from edit modal
window.removeEditVariantRow = function (rowId) {
    const row = document.getElementById(`edit-variant-row-${rowId}`);
    if (row) {
        const container = document.getElementById('edit-variants-container');
        if (container.children.length <= 1) {
            alert('Product must have at least one variant.');
            return;
        }
        row.remove();
    }
};

// Update Product
window.updateProduct = async function () {
    const productId = currentEditProductId;
    const productName = document.getElementById('edit-product-name').value.trim();
    const category = document.getElementById('edit-product-category').value;

    // Validate
    if (!productName) {
        alert('Please enter a product name.');
        return;
    }
    if (!category) {
        alert('Please select a category.');
        return;
    }

    // Collect variants
    const variantRows = document.querySelectorAll('#edit-variants-container .variant-row');
    const variants = [];

    for (let row of variantRows) {
        const size = row.querySelector('.variant-size').value.trim();
        const unitPrice = parseFloat(row.querySelector('.variant-unit-price').value);
        const costPrice = parseFloat(row.querySelector('.variant-cost-price').value);
        const reorderLevel = parseInt(row.querySelector('.variant-reorder-level').value) || 0;
        const variantId = row.dataset.variantId ? parseInt(row.dataset.variantId) : null;

        if (!size) {
            alert('Please enter a size for all variants.');
            return;
        }
        if (isNaN(unitPrice) || unitPrice < 0) {
            alert('Please enter a valid unit price for all variants.');
            return;
        }
        if (isNaN(costPrice) || costPrice < 0) {
            alert('Please enter a valid cost price for all variants.');
            return;
        }

        variants.push({
            product_variants_id: variantId,
            weight_size: size,
            unit_price: unitPrice,
            cost_price: costPrice,
            reorder_level: reorderLevel
        });
    }

    if (variants.length === 0) {
        alert('Please add at least one variant.');
        return;
    }

    // Show loading state
    const updateBtn = document.getElementById('update-product-btn');
    const originalText = updateBtn.innerHTML;
    updateBtn.innerHTML = '<i data-lucide="loader" class="spin"></i> Updating...';
    updateBtn.disabled = true;
    if (typeof lucide !== 'undefined') lucide.createIcons();

    try {
        const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                product_name: productName,
                category: category,
                variants: variants
            })
        });

        if (!response.ok) {
            throw new Error('Failed to update product');
        }

        closeEditProductModal();
        await loadProducts();
        showToast(`Product "${productName}" updated successfully!`, 'success');

    } catch (error) {
        console.error('Error updating product:', error);
        alert('Failed to update product. Please try again.');
        updateBtn.innerHTML = originalText;
        updateBtn.disabled = false;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
};

// Setup update button click handler
document.addEventListener('DOMContentLoaded', function () {
    const updateBtn = document.getElementById('update-product-btn');
    if (updateBtn) {
        updateBtn.addEventListener('click', updateProduct);
    }
});

// Delete product
window.deleteProduct = async function (productId, productName) {
    if (!confirm(`Are you sure you want to delete "${productName}"?\n\nThis will also delete all its variants.`)) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Failed to delete product');
        }

        // Reload products
        await loadProducts();
        alert(`Product "${productName}" has been deleted successfully.`);
    } catch (error) {
        console.error('Error deleting product:', error);
        alert('Failed to delete product. Please try again.');
    }
};

// Search products
function setupProductSearch() {
    const searchInput = document.querySelector('#products-view .search-bar input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const filteredProducts = productsData.filter(product =>
                product.product_name.toLowerCase().includes(searchTerm) ||
                (product.category && product.category.toLowerCase().includes(searchTerm))
            );
            renderProductsTable(filteredProducts);
        });
    }
}

// Initialize products page
document.addEventListener('DOMContentLoaded', function () {
    // Setup search functionality
    setupProductSearch();

    // Load products if Products view is already visible
    const productsView = document.getElementById('products-view');
    if (productsView && productsView.style.display !== 'none') {
        loadProducts();
    }
});

// ============================================
// Add Product Modal Functions
// ============================================

let variantCounter = 0;

// Open Add Product Modal
window.openAddProductModal = function () {
    const modal = document.getElementById('add-product-modal');
    modal.classList.add('active');

    // Reset form
    document.getElementById('add-product-name').value = '';
    document.getElementById('add-product-category').value = '';
    document.getElementById('variants-container').innerHTML = '';
    variantCounter = 0;

    // Add one default variant row
    addVariantRow();

    if (typeof lucide !== 'undefined') lucide.createIcons();
};

// Close Add Product Modal
window.closeAddProductModal = function () {
    const modal = document.getElementById('add-product-modal');
    modal.classList.remove('active');
};

// Add Variant Row
window.addVariantRow = function () {
    variantCounter++;
    const container = document.getElementById('variants-container');

    const variantRow = document.createElement('div');
    variantRow.className = 'variant-row';
    variantRow.id = `variant-row-${variantCounter}`;

    variantRow.innerHTML = `
        <div class="form-group">
            <label>Size</label>
            <input type="text" class="variant-size" placeholder="e.g., 50g" required>
        </div>
        <div class="form-group">
            <label>Unit Price (Rs.)</label>
            <input type="number" class="variant-unit-price" placeholder="0.00" step="0.01" min="0" required>
        </div>
        <div class="form-group">
            <label>Cost Price (Rs.)</label>
            <input type="number" class="variant-cost-price" placeholder="0.00" step="0.01" min="0" required>
        </div>
        <div class="form-group">
            <label>Reorder Level</label>
            <input type="number" class="variant-reorder-level" placeholder="0" min="0">
        </div>
        <button type="button" class="remove-variant-btn" onclick="removeVariantRow(${variantCounter})" title="Remove variant">
            <i data-lucide="trash-2"></i>
        </button>
    `;

    container.appendChild(variantRow);
    if (typeof lucide !== 'undefined') lucide.createIcons();
};

// Remove Variant Row
window.removeVariantRow = function (rowId) {
    const row = document.getElementById(`variant-row-${rowId}`);
    if (row) {
        // Don't allow removing if it's the only variant
        const container = document.getElementById('variants-container');
        if (container.children.length <= 1) {
            alert('Product must have at least one variant.');
            return;
        }
        row.remove();
    }
};

// Save New Product
window.saveNewProduct = async function () {
    const productName = document.getElementById('add-product-name').value.trim();
    const category = document.getElementById('add-product-category').value;

    // Validate product info
    if (!productName) {
        alert('Please enter a product name.');
        return;
    }

    if (!category) {
        alert('Please select a category.');
        return;
    }

    // Collect variants
    const variantRows = document.querySelectorAll('.variant-row');
    const variants = [];

    for (let row of variantRows) {
        const size = row.querySelector('.variant-size').value.trim();
        const unitPrice = parseFloat(row.querySelector('.variant-unit-price').value);
        const costPrice = parseFloat(row.querySelector('.variant-cost-price').value);
        const reorderLevel = parseInt(row.querySelector('.variant-reorder-level').value) || 0;

        if (!size) {
            alert('Please fill in all variant sizes.');
            return;
        }

        if (!unitPrice || unitPrice <= 0) {
            alert('Please enter valid unit prices for all variants.');
            return;
        }

        if (!costPrice || costPrice <= 0) {
            alert('Please enter valid cost prices for all variants.');
            return;
        }

        variants.push({
            weight_size: size,
            unit_price: unitPrice,
            cost_price: costPrice,
            reorder_level: reorderLevel
        });
    }

    if (variants.length === 0) {
        alert('Please add at least one variant.');
        return;
    }

    // Prepare product data
    const productData = {
        product_name: productName,
        category: category,
        variants: variants
    };

    // Show loading state on save button
    const saveBtn = document.querySelector('#add-product-modal .btn-save');
    const originalText = saveBtn.innerHTML;
    saveBtn.innerHTML = '<i data-lucide="loader" style="animation: spin 1s linear infinite;"></i> Saving...';
    saveBtn.disabled = true;
    if (typeof lucide !== 'undefined') lucide.createIcons();

    try {
        const response = await fetch(`${API_BASE_URL}/products`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(productData)
        });

        if (!response.ok) {
            throw new Error('Failed to create product');
        }

        const result = await response.json();

        // Success
        closeAddProductModal();
        await loadProducts(); // Reload the products table
        alert(`Product "${productName}" with ${variants.length} variant(s) created successfully!`);

    } catch (error) {
        console.error('Error creating product:', error);
        alert('Failed to create product. Make sure the backend server is running.');
        saveBtn.innerHTML = originalText;
        saveBtn.disabled = false;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
};

// ============================================
// Inventory API Functions
// ============================================

let inventoryData = [];

// Load all inventory items
async function loadInventory() {
    try {
        const response = await fetch(`${API_BASE_URL}/inventory`);
        if (!response.ok) {
            throw new Error('Failed to fetch inventory');
        }
        inventoryData = await response.json();
        renderInventoryTable(inventoryData);
    } catch (error) {
        console.error('Error loading inventory:', error);
        showInventoryError('Failed to load inventory. Make sure the backend server is running.');
    }
}

// Render inventory table
function renderInventoryTable(items) {
    const tbody = document.getElementById('inventory-table-body');

    if (!tbody) {
        console.error('Inventory table body not found');
        return;
    }

    if (!items || items.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px;">
                    <p style="color: #666; margin-bottom: 15px;">No inventory items found.</p>
                    <button class="btn-primary" onclick="initInventoryFromProducts()">
                        <i data-lucide="plus"></i> Initialize from Products
                    </button>
                </td>
            </tr>
        `;
        if (typeof lucide !== 'undefined') lucide.createIcons();
        return;
    }

    tbody.innerHTML = items.map(item => {
        // Determine status badge class
        let statusClass = 'status-fresh';
        if (item.status === 'Low Stock') {
            statusClass = 'status-warning';
        } else if (item.status === 'Out of Stock') {
            statusClass = 'status-expired';
        }

        return `
            <tr data-inventory-id="${item.id}">
                <td>
                    <div class="product-cell">
                        <h4>${item.product_name}</h4>
                    </div>
                </td>
                <td>${item.code}</td>
                <td>${item.category || '-'}</td>
                <td class="text-right">${item.stock_qty}</td>
                <td>${item.unit}</td>
                <td><span class="status-badge ${statusClass}">${item.status}</span></td>
                <td class="text-right">
                    <button class="action-btn" onclick="openUpdateStockModal(${item.id})">
                        <i data-lucide="edit-2"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// Show error message for inventory
function showInventoryError(message) {
    const tbody = document.getElementById('inventory-table-body');
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px;">
                    <p style="color: #e74c3c; margin-bottom: 10px;">⚠️ ${message}</p>
                    <button class="btn-primary" onclick="loadInventory()">
                        <i data-lucide="refresh-cw"></i> Retry
                    </button>
                </td>
            </tr>
        `;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
}

// Initialize inventory from products
window.initInventoryFromProducts = async function () {
    try {
        const response = await fetch(`${API_BASE_URL}/inventory/init-from-products`, {
            method: 'POST'
        });

        if (!response.ok) {
            throw new Error('Failed to initialize inventory');
        }

        const result = await response.json();
        alert(result.message);
        await loadInventory();
    } catch (error) {
        console.error('Error initializing inventory:', error);
        alert('Failed to initialize inventory. Make sure the backend server is running.');
    }
};

// Current editing inventory item
let currentEditingInventoryId = null;

// Open update stock modal
window.openUpdateStockModal = function (inventoryId) {
    const item = inventoryData.find(i => i.id === inventoryId);
    if (!item) return;

    currentEditingInventoryId = inventoryId;

    // Populate modal with item data
    document.getElementById('edit-inventory-product-name').textContent = item.product_name;
    document.getElementById('edit-inventory-code').textContent = `Code: ${item.code}`;
    document.getElementById('edit-inventory-current-stock').innerHTML = `
        <span class="stock-value">${item.stock_qty}</span>
        <span class="stock-unit">${item.unit}</span>
    `;
    document.getElementById('edit-inventory-new-qty').value = item.stock_qty;
    document.getElementById('edit-inventory-unit').value = item.unit;
    document.getElementById('edit-inventory-status').value = item.status;

    // Show modal
    const modal = document.getElementById('edit-inventory-modal');
    modal.classList.add('active');
    if (typeof lucide !== 'undefined') lucide.createIcons();
};

// Close edit inventory modal
window.closeEditInventoryModal = function () {
    const modal = document.getElementById('edit-inventory-modal');
    modal.classList.remove('active');
    currentEditingInventoryId = null;
};

// Auto-update status based on quantity
window.autoUpdateInventoryStatus = function () {
    const qty = parseInt(document.getElementById('edit-inventory-new-qty').value) || 0;
    const statusSelect = document.getElementById('edit-inventory-status');

    if (qty <= 0) {
        statusSelect.value = 'Out of Stock';
    } else if (qty <= 10) {
        statusSelect.value = 'Low Stock';
    } else {
        statusSelect.value = 'In Stock';
    }
};

// Save inventory update
window.saveInventoryUpdate = async function () {
    if (!currentEditingInventoryId) return;

    const newQty = parseInt(document.getElementById('edit-inventory-new-qty').value);
    const unit = document.getElementById('edit-inventory-unit').value;

    if (isNaN(newQty) || newQty < 0) {
        alert('Please enter a valid quantity');
        return;
    }

    const saveBtn = document.getElementById('save-inventory-btn');
    const originalText = saveBtn.innerHTML;
    saveBtn.innerHTML = '<i data-lucide="loader" class="spin"></i> Saving...';
    saveBtn.disabled = true;
    if (typeof lucide !== 'undefined') lucide.createIcons();

    try {
        const response = await fetch(`${API_BASE_URL}/inventory/${currentEditingInventoryId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                stock_qty: newQty,
                unit: unit
            })
        });

        if (!response.ok) {
            throw new Error('Failed to update stock');
        }

        closeEditInventoryModal();
        await loadInventory();

        // Show success message
        showToast('Stock updated successfully!', 'success');

    } catch (error) {
        console.error('Error updating stock:', error);
        alert('Failed to update stock. Please try again.');
        saveBtn.innerHTML = originalText;
        saveBtn.disabled = false;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
};

// Simple toast notification
function showToast(message, type = 'success') {
    // Remove existing toast
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) existingToast.remove();

    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    toast.innerHTML = `
        <i data-lucide="${type === 'success' ? 'check-circle' : 'alert-circle'}"></i>
        <span>${message}</span>
    `;
    document.body.appendChild(toast);
    if (typeof lucide !== 'undefined') lucide.createIcons();

    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Setup save button click handler
document.addEventListener('DOMContentLoaded', function () {
    const saveBtn = document.getElementById('save-inventory-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', saveInventoryUpdate);
    }
});

// Search inventory
function setupInventorySearch() {
    const searchInput = document.querySelector('#inventory-view .search-bar input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const filteredItems = inventoryData.filter(item =>
                item.product_name.toLowerCase().includes(searchTerm) ||
                item.code.toLowerCase().includes(searchTerm) ||
                item.category.toLowerCase().includes(searchTerm)
            );
            renderInventoryTable(filteredItems);
        });
    }
}

// Initialize inventory on page load
document.addEventListener('DOMContentLoaded', function () {
    setupInventorySearch();
});

// ============================================
// Shop API Functions
// ============================================

let shopsApiData = [];

// Load all shops
async function loadShops() {
    try {
        const response = await fetch(`${API_BASE_URL}/shops`);
        if (!response.ok) {
            throw new Error('Failed to fetch shops');
        }
        shopsApiData = await response.json();
        populateShopFilters(shopsApiData);
        renderShopsTable(shopsApiData);
    } catch (error) {
        console.error('Error loading shops:', error);
        showShopsError('Failed to load shops. Make sure the backend server is running.');
    }
}

// Populate filter dropdowns with unique cities
function populateShopFilters(shops) {
    // Get unique cities
    const cities = [...new Set(shops.map(s => s.city).filter(c => c && c.trim()))].sort();
    const cityDropdown = document.getElementById('shop-filter-city');
    if (cityDropdown) {
        cityDropdown.innerHTML = '<option value="">All Cities</option>' +
            cities.map(city => `<option value="${city}">${city}</option>`).join('');
    }
}

// Filter shops based on search and dropdown filters
window.filterShops = function () {
    const searchTerm = document.getElementById('shop-search-input')?.value.toLowerCase() || '';
    const cityFilter = document.getElementById('shop-filter-city')?.value || '';
    const statusFilter = document.getElementById('shop-filter-status')?.value || '';

    const filteredShops = shopsApiData.filter(shop => {
        // Search filter
        const matchesSearch = !searchTerm ||
            shop.name.toLowerCase().includes(searchTerm) ||
            (shop.seller && shop.seller.toLowerCase().includes(searchTerm)) ||
            (shop.phone && shop.phone.includes(searchTerm)) ||
            (shop.city && shop.city.toLowerCase().includes(searchTerm)) ||
            (shop.address && shop.address.toLowerCase().includes(searchTerm));

        // City filter
        const matchesCity = !cityFilter || shop.city === cityFilter;

        // Status filter
        const matchesStatus = !statusFilter || shop.status === statusFilter;

        return matchesSearch && matchesCity && matchesStatus;
    });

    renderShopsTable(filteredShops);
}

// Render shops table
function renderShopsTable(shops) {
    const tbody = document.getElementById('shop-table-body');

    if (!tbody) {
        console.error('Shop table body not found');
        return;
    }

    if (!shops || shops.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px;">
                    <p style="color: #666; margin-bottom: 15px;">No shops found.</p>
                    <button class="btn-primary" onclick="openAddShopModal()">
                        <i data-lucide="plus"></i> Add First Shop
                    </button>
                </td>
            </tr>
        `;
        if (typeof lucide !== 'undefined') lucide.createIcons();
        return;
    }

    tbody.innerHTML = shops.map(shop => {
        // Get initials for icon
        const initials = shop.name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase();

        // Determine status class
        let statusClass = 'status-fresh';
        if (shop.status === 'Inactive') {
            statusClass = 'status-expired';
        } else if (shop.outstanding > 10000) {
            statusClass = 'status-warning';
        }

        // Format location (city + address)
        const location = shop.city ? (shop.address ? `${shop.city}, ${shop.address}` : shop.city) : (shop.address || 'N/A');

        return `
            <tr data-shop-id="${shop.id}">
                <td>
                    <div class="product-cell">
                        <div class="product-icon" style="background: linear-gradient(135deg, var(--primary-color), var(--accent-color)); color: white;">${initials}</div>
                        <div>
                            <h4>${shop.name}</h4>
                            <span>Seller: ${shop.seller || 'N/A'}</span>
                        </div>
                    </div>
                </td>
                <td>${shop.phone || 'N/A'}</td>
                <td>${location}</td>
                <td class="text-right">${shop.outstanding ? shop.outstanding.toLocaleString() : '0'}</td>
                <td><span class="status-badge ${statusClass}">${shop.status}</span></td>
                <td class="text-right">
                    <button class="action-btn" onclick="callShop('${shop.phone}')" title="Call">
                        <i data-lucide="phone"></i>
                    </button>
                    <button class="action-btn" onclick="openEditShopModal(${shop.id})" title="Edit">
                        <i data-lucide="edit-2"></i>
                    </button>
                    <button class="action-btn" onclick="deleteShop(${shop.id}, '${shop.name}')" title="Delete">
                        <i data-lucide="trash-2"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// Show error message for shops
function showShopsError(message) {
    const tbody = document.getElementById('shop-table-body');
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px;">
                    <p style="color: #e74c3c; margin-bottom: 10px;">⚠️ ${message}</p>
                    <button class="btn-primary" onclick="loadShops()">
                        <i data-lucide="refresh-cw"></i> Retry
                    </button>
                </td>
            </tr>
        `;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
}

// Open Add Shop Modal
window.openAddShopModal = function () {
    // Clear form
    document.getElementById('add-shop-name').value = '';
    document.getElementById('add-shop-seller').value = '';
    document.getElementById('add-shop-phone').value = '';
    document.getElementById('add-shop-whatsapp').value = '';
    document.getElementById('add-shop-city').value = '';
    document.getElementById('add-shop-address').value = '';
    document.getElementById('add-shop-outstanding').value = '0';

    // Show modal
    const modal = document.getElementById('add-shop-modal');
    modal.classList.add('active');
    if (typeof lucide !== 'undefined') lucide.createIcons();
};

// Close Add Shop Modal
window.closeAddShopModal = function () {
    const modal = document.getElementById('add-shop-modal');
    modal.classList.remove('active');
};

// Save New Shop
window.saveNewShop = async function () {
    const name = document.getElementById('add-shop-name').value.trim();
    const seller = document.getElementById('add-shop-seller').value.trim();
    const phone = document.getElementById('add-shop-phone').value.trim();
    const whatsapp = document.getElementById('add-shop-whatsapp').value.trim();
    const city = document.getElementById('add-shop-city').value.trim();
    const address = document.getElementById('add-shop-address').value.trim();
    const outstanding = parseFloat(document.getElementById('add-shop-outstanding').value) || 0;

    if (!name) {
        alert('Please enter a shop name.');
        return;
    }

    const saveBtn = document.getElementById('save-shop-btn');
    const originalText = saveBtn.innerHTML;
    saveBtn.innerHTML = '<i data-lucide="loader" class="spin"></i> Saving...';
    saveBtn.disabled = true;
    if (typeof lucide !== 'undefined') lucide.createIcons();

    try {
        const response = await fetch(`${API_BASE_URL}/shops`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: name,
                seller: seller,
                phone: phone,
                whatsapp: whatsapp,
                city: city,
                address: address,
                outstanding: outstanding
            })
        });

        if (!response.ok) {
            throw new Error('Failed to create shop');
        }

        closeAddShopModal();
        await loadShops();
        showToast(`Shop "${name}" added successfully!`, 'success');

    } catch (error) {
        console.error('Error creating shop:', error);
        alert('Failed to create shop. Please try again.');
        saveBtn.innerHTML = originalText;
        saveBtn.disabled = false;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
};

// Open Edit Shop Modal
window.openEditShopModal = function (shopId) {
    const shop = shopsApiData.find(s => s.id === shopId);
    if (!shop) return;

    document.getElementById('edit-shop-id').value = shopId;
    document.getElementById('edit-shop-name').value = shop.name;
    document.getElementById('edit-shop-seller').value = shop.seller || '';
    document.getElementById('edit-shop-phone').value = shop.phone || '';
    document.getElementById('edit-shop-whatsapp').value = shop.whatsapp || '';
    document.getElementById('edit-shop-city').value = shop.city || '';
    document.getElementById('edit-shop-address').value = shop.address || '';
    document.getElementById('edit-shop-outstanding').value = shop.outstanding || 0;

    const modal = document.getElementById('edit-shop-modal');
    modal.classList.add('active');
    if (typeof lucide !== 'undefined') lucide.createIcons();
};

// Close Edit Shop Modal
window.closeEditShopModal = function () {
    const modal = document.getElementById('edit-shop-modal');
    modal.classList.remove('active');
};

// Update Shop
window.updateShop = async function () {
    const shopId = document.getElementById('edit-shop-id').value;
    const name = document.getElementById('edit-shop-name').value.trim();
    const seller = document.getElementById('edit-shop-seller').value.trim();
    const phone = document.getElementById('edit-shop-phone').value.trim();
    const whatsapp = document.getElementById('edit-shop-whatsapp').value.trim();
    const city = document.getElementById('edit-shop-city').value.trim();
    const address = document.getElementById('edit-shop-address').value.trim();
    const outstanding = parseFloat(document.getElementById('edit-shop-outstanding').value) || 0;

    if (!name) {
        alert('Please enter a shop name.');
        return;
    }

    const updateBtn = document.getElementById('update-shop-btn');
    const originalText = updateBtn.innerHTML;
    updateBtn.innerHTML = '<i data-lucide="loader" class="spin"></i> Updating...';
    updateBtn.disabled = true;
    if (typeof lucide !== 'undefined') lucide.createIcons();

    try {
        const response = await fetch(`${API_BASE_URL}/shops/${shopId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: name,
                seller: seller,
                phone: phone,
                whatsapp: whatsapp,
                city: city,
                address: address,
                outstanding: outstanding
            })
        });

        if (!response.ok) {
            throw new Error('Failed to update shop');
        }

        closeEditShopModal();
        await loadShops();
        showToast(`Shop "${name}" updated successfully!`, 'success');

    } catch (error) {
        console.error('Error updating shop:', error);
        alert('Failed to update shop. Please try again.');
        updateBtn.innerHTML = originalText;
        updateBtn.disabled = false;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
};

// Delete Shop
window.deleteShop = async function (shopId, shopName) {
    if (!confirm(`Are you sure you want to delete "${shopName}"?`)) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/shops/${shopId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Failed to delete shop');
        }

        await loadShops();
        showToast(`Shop "${shopName}" deleted successfully!`, 'success');

    } catch (error) {
        console.error('Error deleting shop:', error);
        alert('Failed to delete shop. Please try again.');
    }
};

// Call Shop
window.callShop = function (phone) {
    if (phone) {
        window.open(`tel:${phone}`, '_self');
    } else {
        alert('No phone number available for this shop.');
    }
};

// Search shops
function setupShopSearch() {
    const searchInput = document.querySelector('#shop-view .search-bar input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const filteredShops = shopsApiData.filter(shop =>
                shop.name.toLowerCase().includes(searchTerm) ||
                (shop.city && shop.city.toLowerCase().includes(searchTerm)) ||
                (shop.address && shop.address.toLowerCase().includes(searchTerm))
            );
            renderShopsTable(filteredShops);
        });
    }
}

// Setup shop button handlers
document.addEventListener('DOMContentLoaded', function () {
    setupShopSearch();

    const saveShopBtn = document.getElementById('save-shop-btn');
    if (saveShopBtn) {
        saveShopBtn.addEventListener('click', saveNewShop);
    }

    const updateShopBtn = document.getElementById('update-shop-btn');
    if (updateShopBtn) {
        updateShopBtn.addEventListener('click', updateShop);
    }
});

// ============================================
// Users Page Functions
// ============================================

let usersData = [];

// Load users from API
async function loadUsers() {
    const tbody = document.getElementById('users-body');
    if (tbody) tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:30px;color:#888;"><i data-lucide="loader" style="animation:spin 1s linear infinite;vertical-align:middle;"></i> Loading users...</td></tr>';
    try {
        const response = await fetch(`${API_BASE_URL}/users`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to load users');
        if (!Array.isArray(data)) throw new Error('Invalid response from server');
        usersData = data;
        renderUsersTable(usersData);
        updateUserSummaryCards(usersData);
        if (typeof lucide !== 'undefined') lucide.createIcons();
    } catch (error) {
        console.error('Error loading users:', error);
        if (tbody) tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:30px;color:#ef4444;"><i data-lucide="alert-circle" style="vertical-align:middle;margin-right:6px;"></i> Failed to load users: ${error.message}</td></tr>`;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
}

// Update account summary cards
function updateUserSummaryCards(users) {
    const total = users.length;
    const active = users.filter(u => u.status === 'Active').length;
    const admin = users.filter(u => u.role === 'Admin').length;
    const manager = users.filter(u => u.role === 'Manager').length;
    document.getElementById('users-total').textContent = total;
    document.getElementById('users-active').textContent = active;
    document.getElementById('users-admin').textContent = admin;
    document.getElementById('users-manager').textContent = manager;
}

// Render users table
function renderUsersTable(users) {
    const tbody = document.getElementById('users-body');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: var(--text-muted);">No users found</td></tr>';
        return;
    }

    users.forEach(user => {
        const statusClass = user.status === 'Active' ? 'status-active' : 'status-inactive';
        const roleColor = {
            'Admin': '#ef4444',
            'Manager': '#f97316',
            'Staff': '#3b82f6',
            'Viewer': '#6b7280'
        }[user.role] || '#6b7280';
        const lastLogin = user.last_login ? new Date(user.last_login).toLocaleString() : 'Never';
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.id}</td>
            <td><strong>${user.username}</strong></td>
            <td>${user.full_name || '-'}</td>
            <td>${user.email || '-'}</td>
            <td><span style="background: ${roleColor}; color: white; padding: 3px 10px; border-radius: 12px; font-size: 0.8rem;">${user.role}</span></td>
            <td><span class="status-badge ${statusClass}">${user.status}</span></td>
            <td style="font-size: 0.85rem; color: var(--text-muted);">${lastLogin}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon edit" onclick="editUser(${user.id})" title="Edit">
                        <i data-lucide="pencil"></i>
                    </button>
                    <button class="btn-icon delete" onclick="deleteUser(${user.id})" title="Delete">
                        <i data-lucide="trash-2"></i>
                    </button>
                    <button class="btn-icon view" onclick="showUserProfileCard(${user.id})" title="View Profile">
                        <i data-lucide="eye"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Show user profile card — inline popup (no missing DOM dependency)
function showUserProfileCard(userId) {
    const user = usersData.find(u => u.id === userId);
    if (!user) return;

    // Remove existing popup if any
    const existing = document.getElementById('user-profile-popup');
    if (existing) existing.remove();

    const roleColor = { 'Admin': '#ef4444', 'Manager': '#f97316', 'Staff': '#3b82f6', 'Viewer': '#6b7280' }[user.role] || '#6b7280';
    const statusColor = user.status === 'Active' ? '#10b981' : '#9ca3af';
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name || user.username)}&background=random&size=80`;
    const lastLogin = user.last_login ? new Date(user.last_login).toLocaleString() : 'Never';

    const popup = document.createElement('div');
    popup.id = 'user-profile-popup';
    popup.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:center;justify-content:center;';
    popup.innerHTML = `
        <div style="background:var(--surface,#fff);border-radius:16px;padding:32px;max-width:400px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,0.3);position:relative;">
            <button onclick="document.getElementById('user-profile-popup').remove()" style="position:absolute;top:12px;right:16px;background:none;border:none;font-size:1.4rem;cursor:pointer;color:#666;">&times;</button>
            <div style="text-align:center;margin-bottom:20px;">
                <img src="${avatarUrl}" style="width:80px;height:80px;border-radius:50%;border:3px solid ${roleColor};">
                <h3 style="margin:12px 0 4px;">${user.full_name || user.username}</h3>
                <span style="background:${roleColor};color:#fff;padding:3px 12px;border-radius:12px;font-size:0.8rem;">${user.role}</span>
            </div>
            <table style="width:100%;border-collapse:collapse;font-size:0.9rem;">
                <tr><td style="padding:8px 0;color:#888;width:110px;">Username</td><td><strong>@${user.username}</strong></td></tr>
                <tr><td style="padding:8px 0;color:#888;">Email</td><td>${user.email || '-'}</td></tr>
                <tr><td style="padding:8px 0;color:#888;">Phone</td><td>${user.phone || '-'}</td></tr>
                <tr><td style="padding:8px 0;color:#888;">Status</td><td><span style="color:${statusColor};font-weight:600;">${user.status}</span></td></tr>
                <tr><td style="padding:8px 0;color:#888;">Last Login</td><td>${lastLogin}</td></tr>
            </table>
            <div style="margin-top:20px;display:flex;gap:10px;justify-content:flex-end;">
                <button onclick="document.getElementById('user-profile-popup').remove();editUser(${user.id})" style="padding:8px 16px;background:${roleColor};color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:0.9rem;">Edit User</button>
                <button onclick="document.getElementById('user-profile-popup').remove()" style="padding:8px 16px;background:#f3f4f6;color:#374151;border:none;border-radius:8px;cursor:pointer;font-size:0.9rem;">Close</button>
            </div>
        </div>
    `;
    popup.addEventListener('click', e => { if (e.target === popup) popup.remove(); });
    document.body.appendChild(popup);
}

if (typeof lucide !== 'undefined') lucide.createIcons();

// Open add user modal
function openAddUserModal() {
    document.getElementById('user-modal-title').textContent = 'Add New User';
    document.getElementById('user-id').value = '';
    document.getElementById('user-username').value = '';
    document.getElementById('user-fullname').value = '';
    document.getElementById('user-email').value = '';
    document.getElementById('user-phone').value = '';
    document.getElementById('user-password').value = '';
    document.getElementById('user-confirm-password').value = '';
    document.getElementById('user-role').value = 'Staff';
    document.getElementById('user-status').value = 'Active';

    // Enable username field for new user
    document.getElementById('user-username').disabled = false;

    document.getElementById('user-modal').classList.add('active');
}

// Edit user
function editUser(userId) {
    const user = usersData.find(u => u.id === userId);
    if (!user) return;

    document.getElementById('user-modal-title').textContent = 'Edit User';
    document.getElementById('user-id').value = user.id;
    document.getElementById('user-username').value = user.username;
    document.getElementById('user-fullname').value = user.full_name;
    document.getElementById('user-email').value = user.email || '';
    document.getElementById('user-phone').value = user.phone || '';
    document.getElementById('user-password').value = '';
    document.getElementById('user-confirm-password').value = '';
    document.getElementById('user-role').value = user.role;
    document.getElementById('user-status').value = user.status;

    document.getElementById('user-modal').classList.add('active');
}

// Save user
async function saveUser() {
    const userId = document.getElementById('user-id').value;
    const username = document.getElementById('user-username').value.trim();
    const fullName = document.getElementById('user-fullname').value.trim();
    const email = document.getElementById('user-email').value.trim();
    const phone = document.getElementById('user-phone').value.trim();
    const password = document.getElementById('user-password').value;
    const confirmPassword = document.getElementById('user-confirm-password').value;
    const role = document.getElementById('user-role').value;
    const status = document.getElementById('user-status').value;

    // Validation
    if (!username || !fullName) {
        alert('Username and Full Name are required!');
        return;
    }

    if (!userId && !password) {
        alert('Password is required for new user!');
        return;
    }

    if (password && password !== confirmPassword) {
        alert('Passwords do not match!');
        return;
    }

    const userData = {
        username,
        full_name: fullName,
        email,
        phone,
        role,
        status
    };

    if (password) {
        userData.password = password;
    }

    try {
        let response;
        if (userId) {
            // Update existing user profile (without password)
            const profileData = { full_name: fullName, email, phone, role, status };
            response = await fetch(`${API_BASE_URL}/users/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(profileData)
            });

            // Update password separately if provided
            if (response.ok && password) {
                await fetch(`${API_BASE_URL}/users/${userId}/password`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ new_password: password })
                });
            }
        } else {
            // Create new user
            response = await fetch(`${API_BASE_URL}/users`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });
        }

        if (response.ok) {
            document.getElementById('user-modal').classList.remove('active');
            loadUsers();
        } else {
            const error = await response.json();
            alert(error.error || 'Error saving user');
        }
    } catch (error) {
        console.error('Error saving user:', error);
        alert('Error saving user');
    }
}

// Delete user
async function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
        const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            loadUsers();
        } else {
            alert('Error deleting user');
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        alert('Error deleting user');
    }
}

// Make functions global
window.openAddUserModal = openAddUserModal;
window.editUser = editUser;
window.deleteUser = deleteUser;

// Setup user save button
document.addEventListener('DOMContentLoaded', function () {
    const saveUserBtn = document.getElementById('save-user-btn');
    if (saveUserBtn) {
        saveUserBtn.addEventListener('click', saveUser);
    }
});

// --- Alert Page Logic ---

async function loadAlerts() {
    const stockList = document.getElementById('stock-alerts-list');
    const paymentList = document.getElementById('payment-alerts-list');
    const totalBadge = document.getElementById('total-alerts-badge');
    const stockCount = document.getElementById('stock-alerts-count');
    const paymentCount = document.getElementById('payment-alerts-count');

    if (!stockList || !paymentList) return;

    // Show loading state
    stockList.innerHTML = '<div style="text-align:center;padding:20px;"><i data-lucide="loader" class="spin"></i></div>';
    paymentList.innerHTML = '<div style="text-align:center;padding:20px;"><i data-lucide="loader" class="spin"></i></div>';
    if (typeof lucide !== 'undefined') lucide.createIcons();

    try {
        const response = await fetch(`${API_BASE_URL}/alerts`);
        if (!response.ok) throw new Error('Failed to fetch alerts');

        const data = await response.json();

        // Update counts
        if (totalBadge) totalBadge.textContent = `${data.total_alerts} Alerts`;
        if (stockCount) stockCount.textContent = data.stock_alerts.length;
        if (paymentCount) paymentCount.textContent = data.payment_alerts.length;

        // Render Stock Alerts
        if (data.stock_alerts && data.stock_alerts.length > 0) {
            stockList.innerHTML = data.stock_alerts.map(alert => `
                <div class="alert-item" style="padding: 15px; border-bottom: 1px solid #f0f0f0; display: flex; align-items: flex-start; gap: 12px;">
                    <div style="background: ${alert.severity === 'high' ? 'rgba(225, 29, 72, 0.1)' : 'rgba(245, 158, 11, 0.1)'}; padding: 8px; border-radius: 8px;">
                        <i data-lucide="alert-triangle" style="color: ${alert.severity === 'high' ? '#e11d48' : '#f59e11'}; width: 20px; height: 20px;"></i>
                    </div>
                    <div style="flex: 1;">
                        <h4 style="font-size: 0.95rem; font-weight: 600; margin-bottom: 4px;">${alert.title}</h4>
                        <p style="color: #666; font-size: 0.85rem;">${alert.message}</p>
                    </div>
                    <button class="btn-text" onclick="window.location.hash='#inventory'" style="font-size: 0.8rem; color: var(--primary-color);">Fix</button>
                </div>
            `).join('');
        } else {
            stockList.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #888;">
                    <i data-lucide="check-circle" style="color: #10b981; width: 32px; height: 32px; margin-bottom: 8px;"></i>
                    <p>All stock levels are optimal.</p>
                </div>
            `;
        }

        // Render Payment Alerts
        if (data.payment_alerts && data.payment_alerts.length > 0) {
            paymentList.innerHTML = data.payment_alerts.map(alert => `
                <div class="alert-item" style="padding: 15px; border-bottom: 1px solid #f0f0f0; display: flex; align-items: flex-start; gap: 12px;">
                    <div style="background: ${alert.severity === 'high' ? 'rgba(225, 29, 72, 0.1)' : 'rgba(245, 158, 11, 0.1)'}; padding: 8px; border-radius: 8px;">
                        <i data-lucide="wallet-cards" style="color: ${alert.severity === 'high' ? '#e11d48' : '#f59e11'}; width: 20px; height: 20px;"></i>
                    </div>
                    <div style="flex: 1;">
                        <h4 style="font-size: 0.95rem; font-weight: 600; margin-bottom: 4px;">${alert.title}</h4>
                        <p style="color: #666; font-size: 0.85rem;">${alert.message}</p>
                    </div>
                    <button class="btn-text" onclick="window.location.hash='#outstanding'" style="font-size: 0.8rem; color: var(--primary-color);">View</button>
                </div>
            `).join('');
        } else {
            paymentList.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #888;">
                    <i data-lucide="check-circle" style="color: #10b981; width: 32px; height: 32px; margin-bottom: 8px;"></i>
                    <p>No overdue payments detected.</p>
                </div>
            `;
        }

        if (typeof lucide !== 'undefined') lucide.createIcons();

    } catch (error) {
        console.error('Error loading alerts:', error);
        stockList.innerHTML = '<p style="color: #e11d48; text-align: center; padding: 20px;">Failed to load alerts from server.</p>';
        paymentList.innerHTML = '<p style="color: #e11d48; text-align: center; padding: 20px;">Failed to load alerts from server.</p>';
    }
}

// Export to window
window.loadAlerts = loadAlerts;


// ============================================
// Enhanced Alert System
// ============================================

// Global variable to store alerts data
let alertsData = {
    stock_alerts: [],
    payment_alerts: [],
    expiry_alerts: [],
    total_alerts: 0
};

// Load alerts from API (Enhanced Version)
async function loadAlertsEnhanced() {
    const container = document.getElementById('alerts-container');
    if (!container) return;

    // Show loading state
    container.innerHTML = `
        <div class="card" style="padding: 40px; text-align: center;">
            <i data-lucide="loader" class="spin" style="width: 48px; height: 48px; color: var(--primary-color);"></i>
            <p style="margin-top: 16px; color: var(--text-muted);">Loading alerts...</p>
        </div>
    `;
    if (typeof lucide !== 'undefined') lucide.createIcons();

    try {
        const response = await fetch(`${API_BASE_URL}/alerts`);
        if (!response.ok) throw new Error('Failed to fetch alerts');

        alertsData = await response.json();

        // Update summary counts
        document.getElementById('alert-low-stock-count').textContent = alertsData.stock_alerts.length;
        document.getElementById('alert-expiring-count').textContent = alertsData.expiry_alerts ? alertsData.expiry_alerts.length : 0;
        document.getElementById('alert-outstanding-count').textContent = alertsData.payment_alerts.length;

        // Render alerts based on active tab
        const activeTab = document.querySelector('.alert-tab.active');
        const currentFilter = activeTab ? activeTab.dataset.tab : 'all';
        renderAlerts(currentFilter);

        // Setup tab click handlers
        setupAlertTabs();

    } catch (error) {
        console.error('Error loading alerts:', error);
        container.innerHTML = `
            <div class="card" style="padding: 40px; text-align: center;">
                <i data-lucide="alert-circle" style="width: 48px; height: 48px; color: #e11d48;"></i>
                <h3 style="margin-top: 16px; color: #e11d48;">Failed to Load Alerts</h3>
                <p style="color: var(--text-muted); margin-top: 8px;">Unable to connect to the server. Please try again.</p>
                <button class="btn-primary" onclick="loadAlertsEnhanced()" style="margin-top: 16px;">
                    <i data-lucide="refresh-cw"></i> Retry
                </button>
            </div>
        `;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
}

async function loadRecentSales() {
    const tableBody = document.getElementById('recent-sales-body');
    if (!tableBody) return;

    try {
        const response = await fetch('backend/api/get_recent_sales.php', {
            method: 'GET',
            credentials: 'include'
        });

        if (!response.ok) throw new Error('Failed to fetch recent sales');

        const sales = await response.json();

        if (!sales || sales.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="3" class="no-data">No recent sales found.</td></tr>`;
            return;
        }

        
        tableBody.innerHTML = sales.map(sale => {
            const formattedAmount = Number(sale.total_amount).toLocaleString();

            return `
                <tr>
                    <td>${escapeHtml(sale.shop_name)}</td>
                    <td>${escapeHtml(sale.sale_date)}</td>
                    <td class="text-right">LKR ${formattedAmount}</td>
                </tr>
            `;
        }).join('');

    } catch (error) {
        console.error('Error loading recent sales:', error);
        tableBody.innerHTML = `<tr><td colspan="3" class="no-data" style="color: #ef4444;">Failed to load sales.</td></tr>`;
    }
}

// expiry worning
function loadExpiryWarnings() {
    fetch('backend/api/get_expiry_warnings.php')
        .then(response => response.json())
        .then(data => {
            const expiryList = document.querySelector('#expiry-list');
            if (!expiryList) return;

            if (data.length === 0) {
                expiryList.innerHTML = '<li style="padding: 15px; text-align: center; color: #888;">No expiry warnings found.</li>';
                return;
            }

            let html = '';
            data.forEach(batch => {
                let badgeClass = 'bg-info';
                let badgeText = batch.days_left + ' Days Left';

                if (batch.days_left < 0) {
                    badgeClass = 'Expired'; // ඔබේ UI එකේ පාවිච්චි කර ඇති ස්ටייל එක අනුව
                    badgeText = 'Expired';
                } else if (batch.days_left === 0) {
                    badgeText = 'Expires Today';
                }

                html += `
                    <li class="expiry-item" style="padding: 12px 15px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <h6 style="margin: 0; font-size: 14px; font-weight: 600; color: #333;">${batch.product_name}</h6>
                            <small style="color: #666;">Batch: ${batch.batch_number}</small>
                        </div>
                        <span class="badge" style="background: ${batch.days_left < 0 ? '#ffebee' : '#e8f5e9'}; color: ${batch.days_left < 0 ? '#c62828' : '#2e7d32'}; padding: 4px 8px; border-radius: 4px; font-size: 11px;">
                            ${badgeText}
                        </span>
                    </li>
                `;
            });

            expiryList.innerHTML = html;
        })
        .catch(error => console.error('Error loading expiry warnings:', error));
}

// පේජ් එක ලෝඩ් වෙද්දී ක්‍රියාත්මක වීමට
document.addEventListener('DOMContentLoaded', () => {
    loadExpiryWarnings();
});

// Helper: Escape HTML
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// පේජ් එක ලෝඩ් වන විට රන් වීම සඳහා
document.addEventListener('DOMContentLoaded', () => {
    loadRecentSales();
});

