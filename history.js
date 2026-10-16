// --- Shop History Logic ---

// API Configuration
const API_BASE_URL = 'backend/api';

const urlParams = new URLSearchParams(window.location.search);
const selectedShopId = urlParams.get('shop_id');
const selectedShopName = urlParams.get('shop') || "General History";

// UI Elements
const shopNameEl = document.getElementById('history-shop-name');
const shopDetailsEl = document.getElementById('history-shop-details');
const currentOutstandingEl = document.getElementById('current-outstanding-val');
const historyContainer = document.getElementById('history-container');
const backButton = document.getElementById('back-to-billing');

// Current shop data
let currentShop = null;
let billsData = [];

// Load shop data from API
async function loadShopData() {
    try {
        let shop = null;
        
        if (selectedShopId) {
            // Load by ID
            const response = await fetch(`${API_BASE_URL}/shops/${selectedShopId}`);
            if (response.ok) {
                shop = await response.json();
            }
        } else if (selectedShopName !== "General History") {
            // Load by name (fallback)
            const response = await fetch(`${API_BASE_URL}/shops`);
            if (response.ok) {
                const shops = await response.json();
                shop = shops.find(s => s.name === selectedShopName);
            }
        }
        
        if (shop) {
            currentShop = shop;
            
            // Update UI
            if (shopNameEl) shopNameEl.textContent = `History: ${shop.name}`;
            if (shopDetailsEl) {
                shopDetailsEl.textContent = `Seller: ${shop.seller || 'N/A'} | ${shop.city || ''} ${shop.address || ''}`;
            }
            if (currentOutstandingEl) {
                currentOutstandingEl.textContent = `LKR ${(shop.outstanding || 0).toLocaleString()}.00`;
            }
            
            // Load bills for this shop
            await loadBillsData(shop.id);
        } else if (selectedShopName === "General History") {
            // Load all shops history
            if (shopNameEl) shopNameEl.textContent = 'General History: All Shops';
            if (shopDetailsEl) shopDetailsEl.textContent = 'Viewing billing information for all shops across the system';
            if (currentOutstandingEl && currentOutstandingEl.parentElement) {
                currentOutstandingEl.parentElement.style.display = 'none';
            }
            await loadBillsData(null);
        } else {
            if (shopNameEl) shopNameEl.textContent = 'History: Shop not found';
            if (shopDetailsEl) shopDetailsEl.textContent = '';
        }
    } catch (error) {
        console.error('Error loading shop data:', error);
        if (shopNameEl) shopNameEl.textContent = 'History: Error loading data';
    }
}

// Load bills from API
async function loadBillsData(shopId) {
    try {
        const url = shopId 
            ? `${API_BASE_URL}/bills/by-shop/${shopId}` 
            : `${API_BASE_URL}/bills`;
            
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Failed to fetch bills');
        }
        
        billsData = await response.json();
        
        // Group bills by month
        const groupedBills = groupBillsByMonth(billsData);
        
        // Render the history
        renderHistory(groupedBills);
        
    } catch (error) {
        console.error('Error loading bills:', error);
        if (historyContainer) {
            historyContainer.innerHTML = `
                <div class="card" style="padding: 40px; text-align: center;">
                    <i data-lucide="file-x" style="width: 48px; height: 48px; color: var(--text-muted); margin-bottom: 15px;"></i>
                    <h3 style="color: var(--text-muted);">No billing history found</h3>
                    <p style="color: var(--text-muted);">Bills for this shop will appear here after they are created.</p>
                </div>
            `;
            lucide.createIcons();
        }
    }
}

// Group bills by month
function groupBillsByMonth(bills) {
    const grouped = {};
    
    bills.forEach(bill => {
        const date = new Date(bill.bill_date);
        const monthKey = date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
        
        if (!grouped[monthKey]) {
            grouped[monthKey] = [];
        }
        
        // Transform bill data to match the display format
        const transaction = {
            id: bill.id,
            dateTime: formatDateTime(bill.bill_date || bill.created_at),
            billNumber: bill.bill_number || `BL-${bill.id.toString().padStart(4, '0')}`,
            shopName: bill.shop_name || '',
            products: bill.items.filter(item => (item.item_type || 'sale') === 'sale').map(item => ({
                name: `${item.product_name} ${item.variant_name || ''}`.trim(),
                qty: item.quantity,
                price: item.unit_price,
                total: item.total_price || (item.quantity * item.unit_price)
            })),
            returns: bill.items.filter(item => item.item_type === 'return').map(item => ({
                name: `${item.product_name} ${item.variant_name || ''}`.trim(),
                qty: item.quantity,
                amount: item.total_price || (item.quantity * item.unit_price)
            })),
            payment: {
                method: getPaymentMethod(bill.notes),
                ref: getPaymentRef(bill.notes),
                amount: (bill.total_amount || 0) - (bill.net_amount || 0), // Paid for current bill
                extraAmount: bill.extra_paid || 0, // Paid for old debt
                type: 'split'
            },
            subtotal: bill.subtotal || bill.total_amount,
            returnTotal: bill.return_total || 0,
            netAmount: bill.net_amount || 0,
            paymentStatus: bill.payment_status || 'Paid',
            outstandingAfter: (bill.shop_total_outstanding_after !== null && bill.shop_total_outstanding_after !== undefined) ? bill.shop_total_outstanding_after : (bill.net_amount || 0)
        };
        
        grouped[monthKey].push(transaction);
    });
    
    // Convert to array format sorted by month (most recent first)
    return Object.keys(grouped)
        .sort((a, b) => new Date(b) - new Date(a))
        .map(month => ({
            month: month,
            transactions: grouped[month]
        }));
}

// Format date time
function formatDateTime(dateString) {
    const date = new Date(dateString);
    const options = { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    };
    return date.toLocaleString('en-US', options).replace(',', '');
}

// Extract payment method from notes
function getPaymentMethod(notes) {
    if (!notes) return 'N/A';
    
    if (notes.includes('Cash')) return 'Cash';
    if (notes.includes('Check')) return 'Check';
    if (notes.includes('Bank Transfer')) return 'Bank Transfer';
    
    return 'N/A';
}

// Extract payment reference from notes
function getPaymentRef(notes) {
    if (!notes) return '';
    
    const refMatch = notes.match(/\(Ref: ([^)]+)\)/);
    return refMatch ? refMatch[1] : '';
}

function renderHistory(groupedData) {
    if (!historyContainer) return;
    
    if (groupedData.length === 0) {
        historyContainer.innerHTML = `
            <div class="card" style="padding: 40px; text-align: center;">
                <i data-lucide="file-x" style="width: 48px; height: 48px; color: var(--text-muted); margin-bottom: 15px;"></i>
                <h3 style="color: var(--text-muted);">No billing history found</h3>
                <p style="color: var(--text-muted);">Bills for this shop will appear here after they are created.</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    historyContainer.innerHTML = groupedData.map(monthData => {
        // --- Calculate Monthly Totals ---
        let totalRevenue = 0;
        let totalReturns = 0;
        let totalPayments = 0;

        monthData.transactions.forEach(t => {
            totalRevenue += t.products.reduce((sum, p) => sum + p.total, 0);
            totalReturns += t.returns.reduce((sum, r) => sum + r.amount, 0);
            totalPayments += t.payment.amount + t.payment.extraAmount;
        });

        // The outstanding for the month is the sum of net amounts
        const totalOutstanding = monthData.transactions.reduce((sum, t) => sum + t.netAmount, 0);

        return `
            <div class="card history-month-card">
                <div class="month-header">
                    <h3 style="margin: 0; display: flex; align-items: center; gap: 10px;">
                        <i data-lucide="calendar"></i> ${monthData.month}
                    </h3>
                </div>
                
                <div class="card-body" style="padding: 0; overflow-x: auto;">
                    <table class="data-table history-table-unified">
                        <thead>
                            <tr>
                                <th style="min-width: 120px;">Bill #</th>
                                ${currentShop ? '' : '<th style="min-width: 150px;">Shop Name</th>'}
                                <th style="min-width: 150px;">Date & Time</th>
                                <th style="min-width: 200px;">Products</th>
                                <th class="text-right">Qty</th>
                                <th class="text-right">Unit Price</th>
                                <th class="text-right">Total</th>
                                <th class="text-right">Returns</th>
                                <th class="text-right">Return Amt</th>
                                <th class="text-center">Payment</th>
                                <th class="text-right">Balance Due</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${monthData.transactions.map(t => {
                                const isDebtOnly = t.products.length === 0 && t.returns.length === 0 && t.payment.extraAmount > 0;
                                
                                // Format multi-line columns
                                const productNames = isDebtOnly 
                                    ? '<span style="color: var(--accent-color); font-weight: 600;"><i data-lucide="hand-coins" style="width:14px;height:14px;display:inline-block;vertical-align:middle;margin-right:5px;"></i>Debt Collection</span>'
                                    : (t.products.length > 0 
                                        ? t.products.map(p => p.name).join('<br>') 
                                        : '<span style="color: var(--text-muted);">-</span>');
                                        
                                const qtys = isDebtOnly ? '-' : (t.products.length > 0 
                                    ? t.products.map(p => p.qty).join('<br>') 
                                    : '-');
                                const unitPrices = isDebtOnly ? '-' : (t.products.length > 0 
                                    ? t.products.map(p => p.price.toLocaleString()).join('<br>') 
                                    : '-');
                                const totals = isDebtOnly ? '-' : (t.products.length > 0 
                                    ? t.products.map(p => p.total.toLocaleString()).join('<br>') 
                                    : '-');

                                const returnCount = t.returns.length > 0 
                                    ? t.returns.reduce((sum, r) => sum + r.qty, 0) 
                                    : '-';
                                const returnAmt = t.returns.length > 0 
                                    ? t.returns.reduce((sum, r) => sum + r.amount, 0) 
                                    : 0;

                                // Payment status badge
                                const statusClass = isDebtOnly ? 'tag-current' : (t.paymentStatus === 'Paid' ? 'tag-current' : 
                                                   t.paymentStatus === 'Partial' ? 'tag-partial' : 'tag-outstanding');
                                const statusLabel = isDebtOnly ? 'Collected' : t.paymentStatus;

                                return `
                                    <tr>
                                        <td style="font-weight: 600; color: var(--primary-color);">
                                            ${t.billNumber}
                                        </td>
                                        ${currentShop ? '' : '<td style="font-weight: 600; color: var(--sidebar-hover);">' + t.shopName + '</td>'}
                                        <td style="font-size: 0.85rem; color: var(--text-muted); font-weight: 500;">
                                            ${t.dateTime}
                                        </td>
                                        <td style="font-weight: 500;">${productNames}</td>
                                        <td class="text-right">${qtys}</td>
                                        <td class="text-right">${unitPrices}</td>
                                        <td class="text-right" style="color: var(--primary-color); font-weight: 600;">
                                            ${totals}
                                        </td>
                                        <td class="text-right" style="color: var(--danger-color);">${returnCount}</td>
                                        <td class="text-right" style="color: var(--danger-color);">
                                            ${returnAmt > 0 ? returnAmt.toLocaleString() : '-'}
                                        </td>
                                        <td class="text-center">
                                            <span class="payment-type-tag ${statusClass}">
                                                ${statusLabel}
                                            </span>
                                            <div class="payment-method-badge" style="margin-top: 5px;">
                                                <i data-lucide="credit-card" style="width: 12px; height: 12px;"></i> ${t.payment.method}
                                            </div>
                                            ${isDebtOnly ? `
                                                <strong class="text-success" style="font-size: 1.1rem;">LKR ${t.payment.extraAmount.toLocaleString()}</strong>
                                            ` : `
                                                <strong class="text-success">LKR ${t.payment.amount.toLocaleString()}</strong>
                                                ${t.payment.extraAmount > 0 ? `<br><small style="color: var(--success-color); font-weight: 600;">+ LKR ${t.payment.extraAmount.toLocaleString()} (Old Debt)</small>` : ''}
                                            `}
                                        </td>
                                        <td class="text-right" style="font-weight: 700; color: ${t.outstandingAfter > 0 ? 'var(--danger-color)' : 'var(--success-color)'};">
                                            LKR ${t.outstandingAfter.toLocaleString()}
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>

                <!-- Monthly Summary Footer -->
                <div class="history-summary-footer">
                    <div class="stat-item-box revenue">
                        <span>Total Revenue</span>
                        <strong>LKR ${totalRevenue.toLocaleString()}.00</strong>
                    </div>
                    <div class="stat-item-box returns">
                        <span>Returns Value</span>
                        <strong>LKR ${totalReturns.toLocaleString()}.00</strong>
                    </div>
                    <div class="stat-item-box revenue" style="border-left-color: var(--success-color);">
                        <span>Payments Collected</span>
                        <strong>LKR ${totalPayments.toLocaleString()}.00</strong>
                    </div>
                    <div class="stat-item-box outstanding">
                        <span>Outstanding Added</span>
                        <strong>LKR ${totalOutstanding.toLocaleString()}.00</strong>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    lucide.createIcons();
}

// Initialize
loadShopData();
