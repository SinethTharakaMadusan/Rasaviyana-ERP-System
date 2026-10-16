// --- Billing System Logic ---

// API Configuration
const API_BASE_URL = 'backend/api';

// Products loaded from database
let productsFromDB = [];

// Current shop data
let currentShopData = null;

let currentBill = [];
let payments = [];
let extraPayments = [];
let selectedShop = "";

let appliedDiscountPercent = 0;
let appliedDiscountAmount = 0;

let discountPercentInput;
let discountAmountInput;
let addDiscountBtn;


const billProductSelect = document.getElementById('bill-product-select');
const billQtyInput = document.getElementById('bill-qty');
const addToBillBtn = document.getElementById('add-to-bill-btn');
const billItemsBody = document.getElementById('bill-items-body');
const billTotalEl = document.getElementById('bill-total');


document.addEventListener("DOMContentLoaded", () => {

    discountPercentInput = document.getElementById("discount-percent-input");
    discountAmountInput = document.getElementById("discount-amount-input");
    addDiscountBtn = document.getElementById("add-discount-btn");


    addDiscountBtn?.addEventListener("click", () => {

        const billAmount = currentBill.reduce(
            (sum, item) => sum + item.subtotal, 
            0
        );

        let percent = parseFloat(discountPercentInput.value) || 0;
        let amount = parseFloat(discountAmountInput.value) || 0;


        if (percent > 0) {
            amount = (billAmount * percent) / 100;
            discountAmountInput.value = amount.toFixed(2);
        }


        appliedDiscountPercent = percent;
        appliedDiscountAmount = amount;


        renderBill();

    });

});


const billingShopName = document.getElementById('billing-shop-name');
const outstandingAmountEl = document.getElementById('outstanding-amount');
const extraDueAmountEl = document.getElementById('extra-due-amount');
const outstandingContainer = document.getElementById('outstanding-container');


// Mock Data for Shop Outstanding - Will be replaced by API data
const mockOutstanding = {
    "Kandy Spice Mart": 12500,
    "Colombo Retailers": 4500,
    "Galle Foods": 0,
    "Matara Spices": 8200
};

// Return Controls
const returnProductSelect = document.getElementById('return-product-select');
const returnQtyInput = document.getElementById('return-qty');
const addReturnBtn = document.getElementById('add-return-btn');

// Track initial outstanding for real-time updates
let initialOutstanding = 0;

// Selected shop ID from URL
let selectedShopId = null;

// Load shop data from database by ID
async function loadShopDataById(shopId) {
    try {
        const response = await fetch(`${API_BASE_URL}/shops/${shopId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch shop');
        }
        currentShopData = await response.json();

        if (currentShopData) {
            // Update shop name display
            selectedShop = currentShopData.name;
            if (billingShopName) {
                billingShopName.textContent = `Billing: ${currentShopData.name}`;
            }

            initialOutstanding = currentShopData.outstanding || 0;

            if (outstandingAmountEl && outstandingContainer) {
                if (initialOutstanding > 0) {
                    outstandingAmountEl.textContent = `LKR ${initialOutstanding.toLocaleString()}.00`;
                    if (extraDueAmountEl) {
                        extraDueAmountEl.textContent = `LKR ${initialOutstanding.toLocaleString()}.00`;
                    }
                    outstandingContainer.style.display = 'flex';
                } else {
                    outstandingContainer.style.display = 'none';
                    if (extraDueAmountEl) {
                        extraDueAmountEl.textContent = `LKR 0.00`;
                    }
                }
            }

            // Set History Link with shop ID
            const historyLink = document.getElementById('history-link');
            if (historyLink) {
                historyLink.href = `history.php?shop_id=${shopId}`;
            }
        }
    } catch (error) {
        console.error('Error loading shop data:', error);
        if (billingShopName) {
            billingShopName.textContent = 'Billing: Shop not found';
        }
    }
}

// Load shop data from database by name (fallback)
async function loadShopData(shopName) {
    try {
        const response = await fetch(`${API_BASE_URL}/shops`);
        if (!response.ok) {
            throw new Error('Failed to fetch shops');
        }
        const shops = await response.json();

        // Find shop by name
        currentShopData = shops.find(s => s.name === shopName);

        if (currentShopData) {
            selectedShopId = currentShopData.id;
            initialOutstanding = currentShopData.outstanding || 0;

            if (outstandingAmountEl && outstandingContainer) {
                if (initialOutstanding > 0) {
                    outstandingAmountEl.textContent = `LKR ${initialOutstanding.toLocaleString()}.00`;
                    if (extraDueAmountEl) {
                        extraDueAmountEl.textContent = `LKR ${initialOutstanding.toLocaleString()}.00`;
                    }
                    outstandingContainer.style.display = 'flex';
                } else {
                    outstandingContainer.style.display = 'none';
                    if (extraDueAmountEl) {
                        extraDueAmountEl.textContent = `LKR 0.00`;
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error loading shop data:', error);
    }
}

// Load products from database
// Inventory stock map: key = inventory product_name, value = stock_qty
let inventoryStockMap = {};

async function loadProductsForBilling() {
    try {
        // Fetch products and inventory simultaneously
        const [productsRes, inventoryRes] = await Promise.all([
            fetch(`${API_BASE_URL}/products`),
            fetch(`${API_BASE_URL}/inventory`)
        ]);

        if (!productsRes.ok) throw new Error('Failed to fetch products');
        const products = await productsRes.json();

        // Build inventory stock map for quick lookups
        inventoryStockMap = {};
        if (inventoryRes.ok) {
            const inventoryItems = await inventoryRes.json();
            inventoryItems.forEach(inv => {
                inventoryStockMap[inv.product_name] = parseInt(inv.stock_qty) || 0;
            });
        }

        // Flatten products with variants into individual items
        productsFromDB = [];
        products.forEach(product => {
            if (product.variants && product.variants.length > 0) {
                product.variants.forEach(variant => {
                    // Try both inventory name formats: "Name (Size)" and "Name Size"
                    const invNameParens = `${product.product_name} (${variant.weight_size})`;
                    const invNamePlain = `${product.product_name} ${variant.weight_size}`;
                    const stockQty = inventoryStockMap[invNameParens] ?? inventoryStockMap[invNamePlain] ?? null;

                    productsFromDB.push({
                        id: `${product.products_id}-${variant.product_variants_id}`,
                        product_id: product.products_id,
                        variant_id: variant.product_variants_id,
                        product_name: product.product_name,
                        variant_name: variant.weight_size,
                        name: `${product.product_name} ${variant.weight_size}`,
                        price: variant.unit_price || 0,
                        stock_qty: stockQty,
                        inv_name_parens: invNameParens,
                        inv_name_plain: invNamePlain
                    });
                });
            } else {
                // Product without variants
                const stockQty = inventoryStockMap[product.product_name] ?? null;
                productsFromDB.push({
                    id: product.products_id,
                    product_id: product.products_id,
                    variant_id: null,
                    product_name: product.product_name,
                    variant_name: '',
                    name: product.product_name,
                    price: 0,
                    stock_qty: stockQty,
                    inv_name_parens: product.product_name,
                    inv_name_plain: product.product_name
                });
            }
        });

        // Populate dropdowns
        populateProductDropdowns();

    } catch (error) {
        console.error('Error loading products:', error);
        alert('Failed to load products. Make sure the backend server is running.');
    }
}

// Helper: format stock label (thresholds: <=20 Out of Stock, <=40 Low Stock, >40 In Stock)
function stockLabel(qty) {
    if (qty === null) return '';
    if (qty <= 20) return ` [OUT OF STOCK: ${qty}]`;
    if (qty <= 40) return ` [Low Stock: ${qty}]`;
    return ` [Stock: ${qty}]`;
}

// Populate product dropdowns
function populateProductDropdowns() {
    if (billProductSelect) {
        // Clear existing options except first
        billProductSelect.innerHTML = '<option value="">-- Choose Product --</option>';

        productsFromDB.forEach(product => {
            const option = document.createElement('option');
            option.value = product.id;
            const stock = stockLabel(product.stock_qty);
            option.textContent = `${product.name} - LKR ${product.price.toFixed(2)}${stock}`;
            if (product.stock_qty !== null && product.stock_qty <= 20) {
                option.disabled = true;
                option.style.color = '#999';
            }
            billProductSelect.appendChild(option);
        });
    }

    if (returnProductSelect) {
        // Clear existing options except first
        returnProductSelect.innerHTML = '<option value="">-- Choose Product --</option>';

        productsFromDB.forEach(product => {
            const option = document.createElement('option');
            option.value = product.id;
            option.textContent = `${product.name} - LKR ${product.price.toFixed(2)}`;
            returnProductSelect.appendChild(option);
        });
    }

    // Also populate modal dropdown
    const modalProductSelect = document.getElementById('modal-product-select');
    if (modalProductSelect) {
        modalProductSelect.innerHTML = '<option value="">-- Choose Product --</option>';

        productsFromDB.forEach(product => {
            const option = document.createElement('option');
            option.value = product.id;
            const stock = stockLabel(product.stock_qty);
            option.textContent = `${product.name} - LKR ${product.price.toFixed(2)}${stock}`;
            if (product.stock_qty !== null && product.stock_qty <= 20) {
                option.disabled = true;
                option.style.color = '#999';
            }
            modalProductSelect.appendChild(option);
        });
    }

    // Attach stock info display listeners
    attachStockInfoListeners();
}

// Show stock info hint below a select when product changes
function showStockHint(selectEl, product) {
    let hint = selectEl.parentElement.querySelector('.stock-hint');
    if (!hint) {
        hint = document.createElement('div');
        hint.className = 'stock-hint';
        hint.style.cssText = 'font-size:0.78rem; margin-top:4px; font-weight:600; padding: 3px 8px; border-radius:4px;';
        selectEl.parentElement.appendChild(hint);
    }
    if (!product) { hint.textContent = ''; hint.style.display = 'none'; return; }
    const qty = product.stock_qty;
    if (qty === null) { hint.textContent = '⚠ Stock info not available'; hint.style.color = '#888'; hint.style.background = 'transparent'; }
    else if (qty <= 20) { hint.textContent = `✗ Out of Stock (${qty} packets)`; hint.style.color = '#dc3545'; hint.style.background = 'rgba(220,53,69,0.1)'; }
    else if (qty <= 40) { hint.textContent = `⚠ Low Stock: ${qty} packets remaining`; hint.style.color = '#f59e0b'; hint.style.background = 'rgba(245,158,11,0.1)'; }
    else { hint.textContent = `✓ In Stock: ${qty} packets available`; hint.style.color = '#28a745'; hint.style.background = 'rgba(40,167,69,0.1)'; }
    hint.style.display = 'block';
}

function attachStockInfoListeners() {
    [billProductSelect, document.getElementById('modal-product-select')].forEach(sel => {
        if (!sel) return;
        sel.addEventListener('change', () => {
            const product = productsFromDB.find(p => p.id === sel.value || p.id === parseInt(sel.value));
            showStockHint(sel, product || null);
        });
    });
}

// Get Shop ID or Name from URL
const urlParams = new URLSearchParams(window.location.search);
selectedShopId = urlParams.get('shop_id');
selectedShop = urlParams.get('shop') || "Select a Shop";

// Load shop data - prefer ID over name
if (selectedShopId) {
    loadShopDataById(selectedShopId);
} else if (selectedShop !== "Select a Shop") {
    if (billingShopName) {
        billingShopName.textContent = `Billing: ${selectedShop}`;
    }
    loadShopData(selectedShop);

    // Set History Link
    const historyLink = document.getElementById('history-link');
    if (historyLink) {
        if (selectedShopId) {
            historyLink.href = `history.php?shop_id=${selectedShopId}`;
        } else if (selectedShop && selectedShop !== "Select a Shop") {
            historyLink.href = `history.php?shop=${encodeURIComponent(selectedShop)}`;
        } else {
            historyLink.href = 'history.php';
        }
    }
} else {
    if (billingShopName) {
        billingShopName.textContent = 'Billing: No shop selected';
    }
}

// Load products when page loads
loadProductsForBilling();

// Helper: get total quantity already in bill for a product (sales only)
function getQtyAlreadyInBill(productId) {
    return currentBill
        .filter(item => item.type === 'sale' && (item.id === productId || item.id === parseInt(productId)))
        .reduce((sum, item) => sum + item.qty, 0);
}

// Add to Bill Logic
if (addToBillBtn) {
    addToBillBtn.addEventListener('click', () => {
        const productId = billProductSelect.value;
        const qty = parseInt(billQtyInput.value);

        if (!productId) {
            alert("Please select a product");
            return;
        }

        if (!qty || qty < 1) {
            alert("Please enter a valid quantity");
            return;
        }

        const product = productsFromDB.find(p => p.id === productId || p.id === parseInt(productId));
        if (!product) {
            alert("Product not found");
            return;
        }

        // Frontend stock validation (<=20 = Out of Stock, cannot sell)
        if (product.stock_qty !== null) {
            if (product.stock_qty <= 20) {
                alert(`"${product.name}" is Out of Stock (${product.stock_qty} packets). Cannot add to bill.`);
                return;
            }
            const alreadyInBill = getQtyAlreadyInBill(productId);
            const totalRequested = alreadyInBill + qty;
            if (totalRequested > product.stock_qty) {
                const available = Math.max(0, product.stock_qty - alreadyInBill);
                alert(`Not enough stock for "${product.name}".
Available: ${product.stock_qty} packet(s)${alreadyInBill > 0 ? ` (${alreadyInBill} already in bill)` : ''}.
You can add at most ${available} more.`);
                return;
            }
        }

        const subtotal = product.price * qty;

        currentBill.push({
            ...product,
            qty,
            subtotal,
            type: 'sale'
        });

        renderBill();

        // Reset Inputs
        billProductSelect.value = "";
        billQtyInput.value = "1";
        // Clear stock hint after adding
        showStockHint(billProductSelect, null);
    });
}

// Add Return Logic
if (addReturnBtn) {
    addReturnBtn.addEventListener('click', () => {
        const productId = returnProductSelect.value;
        const qty = parseInt(returnQtyInput.value);

        if (!productId) {
            alert("Please select a product to return");
            return;
        }

        if (!qty || qty < 1) {
            alert("Please enter a valid quantity");
            return;
        }

        const product = productsFromDB.find(p => p.id === productId || p.id === parseInt(productId));
        if (!product) {
            alert("Product not found");
            return;
        }
        const subtotal = -(product.price * qty); // Negative subtotal

        currentBill.push({
            ...product,
            qty,
            subtotal,
            type: 'return'
        });

        renderBill();

        // Reset Inputs
        returnProductSelect.value = "";
        returnQtyInput.value = "1";
    });
}

// Add Payment Logic
const addPaymentBtn = document.getElementById('add-payment-btn');
const paymentMethodSelect = document.getElementById('payment-method');
const paymentAmountInput = document.getElementById('payment-amount');
const paymentRefInput = document.getElementById('payment-ref');

if (addPaymentBtn) {
    addPaymentBtn.addEventListener('click', () => {
        const method = paymentMethodSelect.value;
        const amount = parseFloat(paymentAmountInput.value);
        const ref = paymentRefInput.value;

        if (!amount || amount <= 0) {
            alert("Please enter a valid payment amount");
            return;
        }

        payments.push({
            method,
            amount,
            ref: ref || "-",
            type: 'payment'
        });

        renderBill();

        // Reset
        paymentAmountInput.value = "";
        paymentRefInput.value = "";
    });
}

// Add Extra Payment Logic (Old Balance)
const addExtraPaymentBtn = document.getElementById('add-extra-payment-btn');
const extraPaymentMethodSelect = document.getElementById('extra-payment-method');
const extraPaymentAmountInput = document.getElementById('extra-payment-amount');
const extraPaymentRefInput = document.getElementById('extra-payment-ref');

if (addExtraPaymentBtn) {
    addExtraPaymentBtn.addEventListener('click', () => {
        const method = extraPaymentMethodSelect.value;
        const amount = parseFloat(extraPaymentAmountInput.value);
        const ref = extraPaymentRefInput.value;

        if (!amount || amount <= 0) {
            alert("Please enter a valid amount");
            return;
        }

        extraPayments.push({
            method,
            amount,
            ref: ref || "-",
            type: 'old-balance-payment'
        });

        renderBill();

        // Reset
        extraPaymentAmountInput.value = "";
        extraPaymentRefInput.value = "";
    });

    // Real-time Balance Reduction Preview
    extraPaymentAmountInput.addEventListener('input', () => {
        const extraPaid = extraPayments.reduce((sum, p) => sum + p.amount, 0);
        const inputAmount = parseFloat(extraPaymentAmountInput.value) || 0;
        const remaining = initialOutstanding - extraPaid - inputAmount;

        if (extraDueAmountEl) {
            extraDueAmountEl.textContent = `LKR ${Math.max(0, remaining).toLocaleString()}.00`;
            if (remaining < 0) {
                extraDueAmountEl.style.color = 'var(--success-color)';
            } else {
                extraDueAmountEl.style.color = 'var(--danger-color)';
            }
        }
    });
}

// Render Bill Table
function renderBill() {
    if (!billItemsBody) return;

    billItemsBody.innerHTML = currentBill.map((item, index) => `
        <tr class="${item.type === 'return' ? 'return-row' : ''}">
            <td style="max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                ${item.name}
            </td>
            <td class="text-right">${item.type === 'return' ? '-' : ''}${item.qty}</td>
            <td class="text-right" style="${item.type === 'return' ? 'color: var(--danger-color); font-weight: 600;' : ''}">
                ${item.type === 'return' ? '-' : ''}${Math.abs(item.subtotal).toLocaleString()}
            </td>
            <td class="text-right">
                <button class="action-btn" style="color: var(--danger-color); padding: 5px;" onclick="removeFromBill(${index})">
                    <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
                </button>
            </td>
        </tr>
    `).join('') + payments.map((p, index) => `
        <tr class="payment-row">
            <td style="max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--success-color); font-weight: 600;">
                PAYMENT: ${p.method} ${p.ref !== '-' ? '(' + p.ref + ')' : ''}
            </td>
            <td class="text-right">-</td>
            <td class="text-right" style="color: var(--success-color); font-weight: 600;">
                -${p.amount.toLocaleString()}
            </td>
            <td class="text-right">
                <button class="action-btn" style="color: var(--danger-color); padding: 5px;" onclick="removePayment(${index})">
                    <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
                </button>
            </td>
        </tr>
    `).join('');

const netBill = currentBill.reduce((sum, item) => sum + item.subtotal, 0);

let discount = appliedDiscountAmount;

if (discount > netBill) {
    discount = netBill;
}

const finalBill = netBill - discount;

const billPaid = payments.reduce((sum, p) => sum + p.amount, 0);

const extraPaid = extraPayments.reduce((sum, p) => sum + p.amount, 0);

const balanceDue = finalBill - billPaid;

billTotalEl.textContent =
    `LKR ${finalBill.toLocaleString(undefined,{
        minimumFractionDigits:2,
        maximumFractionDigits:2
    })}`;

// Update Outstanding in Header and Extra Payment Section

const remainingOutstanding = initialOutstanding - extraPaid;

if (outstandingAmountEl) {
    outstandingAmountEl.textContent =
        `LKR ${Math.max(0, remainingOutstanding).toLocaleString()}.00`;
}

if (extraDueAmountEl) {
    extraDueAmountEl.textContent =
        `LKR ${Math.max(0, remainingOutstanding).toLocaleString()}.00`;
}


// Update Discount Display
const discountDisplay = document.getElementById("discount-amount-display");

if(discountDisplay){
    discountDisplay.textContent =
        `LKR ${discount.toLocaleString(undefined,{
            minimumFractionDigits:2,
            maximumFractionDigits:2
        })}`;
}

    // Update Summary Elements
    const netBillEl = document.getElementById('net-bill-display');
    const paidAmountEl = document.getElementById('paid-amount');
    const extraPaidEl = document.getElementById('summary-extra-payment');

    if (netBillEl) netBillEl.textContent = `LKR ${netBill.toLocaleString()}.00`;
    if (paidAmountEl) paidAmountEl.textContent = `LKR ${billPaid.toLocaleString()}.00`;
    if (extraPaidEl) extraPaidEl.textContent = `LKR ${extraPaid.toLocaleString()}.00`;
    billTotalEl.textContent = `LKR ${balanceDue.toLocaleString(undefined,{
        minimumFractionDigits:2,
        maximumFractionDigits:2
    })}`;

    // Toggle Outstanding Payment Section Visibility
    const extraPaymentCard = document.getElementById('extra-payment-card');
    const markAsDebtCheckbox = document.getElementById('mark-as-debt');
    if (extraPaymentCard) {
        // Show if shop has old debt OR if the "Mark as Debt" tick is checked
        const isDebtTicked = markAsDebtCheckbox?.checked;
        if (initialOutstanding > 0 || isDebtTicked) {
            extraPaymentCard.style.display = 'block';
        } else {
            extraPaymentCard.style.display = 'none';
        }
    }

    // Sidebar activation - Visible if there are 4+ products OR any payments recorded
    const billingLayout = document.querySelector('.billing-layout');
    if (billingLayout) {
        if (currentBill.length >= 4 || payments.length > 0 || extraPayments.length > 0) {
            billingLayout.classList.add('sidebar-active');
        } else {
            billingLayout.classList.remove('sidebar-active');
        }
    }

    // Handle negative total display
    if (balanceDue < 0) {
        billTotalEl.style.color = 'var(--danger-color)';
    } else {
        billTotalEl.style.color = 'var(--primary-color)';
    }

    lucide.createIcons();
}


// Initial Render
renderBill();

// Add listener to Debt Toggle to show/hide section dynamically
document.getElementById('mark-as-debt')?.addEventListener('change', () => {
    renderBill();
});

// Remove from Bill (Global for onclick)
window.removeFromBill = (index) => {
    currentBill.splice(index, 1);
    renderBill();
};

// Remove Payment
window.removePayment = (index) => {
    payments.splice(index, 1);
    renderBill();
};

// Remove Extra Payment
window.removeExtraPayment = (index) => {
    extraPayments.splice(index, 1);
    renderBill();
};

// Clear Bill
document.getElementById('clear-bill')?.addEventListener('click', () => {
    if (confirm("Are you sure you want to clear the entire bill?")) {
        currentBill = [];
        payments = [];
        extraPayments = [];
        renderBill();
    }
});

// Save Bill to Database
async function saveBillToDatabase() {
    if (currentBill.length === 0 && payments.length === 0 && extraPayments.length === 0) {
        alert("Cannot save an empty bill");
        return;
    }

    // Check if we have shop data
    if (!currentShopData || !currentShopData.id) {
        alert("Shop not found. Please select a valid shop.");
        return;
    }

    const isDebt = document.getElementById('mark-as-debt')?.checked;
    const isAutoSend = document.getElementById('auto-send-bill-summary')?.checked;

    // Calculate totals
    const salesItems = currentBill.filter(item => item.type === 'sale');
    const returnItems = currentBill.filter(item => item.type === 'return');

    const subtotal = salesItems.reduce((sum, item) => sum + item.subtotal, 0);
    const returnTotal = Math.abs(returnItems.reduce((sum, item) => sum + item.subtotal, 0));
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const extraPaid = extraPayments.reduce((sum, p) => sum + p.amount, 0);

    const netBillAmount = subtotal - returnTotal;
    
    // Apply discount
    let discount = appliedDiscountAmount;
    if (discount > netBillAmount) {
        discount = netBillAmount;
    }
    const finalBillAmount = netBillAmount - discount;
    const balanceDue = finalBillAmount - totalPaid;

    // Determine payment status
    let paymentStatus = 'Pending';
    if (totalPaid >= finalBillAmount) {
        paymentStatus = 'Paid';
    } else if (totalPaid > 0) {
        paymentStatus = 'Partial';
    }

    // If mark as debt is checked and there's a balance, mark as pending
    if (isDebt && balanceDue > 0) {
        paymentStatus = 'Pending';
    }

    // Build bill items array - use stored product_name/variant_name directly (no fragile string splitting)
    const billItems = currentBill.map(item => ({
        product_variant_id: item.variant_id || item.product_id,
        product_name: item.product_name || item.name,
        variant_name: item.variant_name || '',
        quantity: item.qty,
        unit_price: item.price,
        total_price: Math.abs(item.subtotal),
        item_type: item.type
    }));

    // Build payment notes
    let notes = '';
    if (payments.length > 0) {
        notes += 'Payments: ' + payments.map(p => `${p.method} LKR ${p.amount} ${p.ref !== '-' ? '(Ref: ' + p.ref + ')' : ''}`).join(', ');
    }
    if (extraPayments.length > 0) {
        notes += (notes ? ' | ' : '') + 'Outstanding Payments: ' + extraPayments.map(p => `${p.method} LKR ${p.amount} ${p.ref !== '-' ? '(Ref: ' + p.ref + ')' : ''}`).join(', ');
    }

    const remainingOldOutstanding = Math.max(0, initialOutstanding - extraPaid);
    const shopTotalOutstandingAfter = remainingOldOutstanding + balanceDue;

    // Prepare bill data
    const billData = {
        shop_id: currentShopData.id,
        subtotal: subtotal,
        discount_percent: appliedDiscountPercent,
        discount_amount: discount,
        total_amount: finalBillAmount,
        return_total: returnTotal,
        net_amount: balanceDue,
        extra_paid: extraPaid,
        shop_total_outstanding_after: shopTotalOutstandingAfter,
        payment_status: paymentStatus,
        notes: notes,
        items: billItems
    };

    try {
        // Save the bill
        const response = await fetch(`${API_BASE_URL}/bills`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(billData)
        });

        if (!response.ok) {
            let errorMsg = 'Failed to save bill';
            try {
                const errData = await response.json();
                if (errData.error) errorMsg = errData.error;
            } catch (e) { }
            throw new Error(errorMsg);
        }

        const savedBill = await response.json();

        // Update shop outstanding if extra payments were made
        if (extraPaid > 0) {
            const newOutstanding = Math.max(0, (currentShopData.outstanding || 0) - extraPaid);
            await fetch(`${API_BASE_URL}/shops/${currentShopData.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    outstanding: newOutstanding
                })
            });
        }

        // Show success modal instead of alert
        showSuccessModal({
            billNumber: savedBill.bill_number,
            shopName: selectedShop,
            date: new Date().toLocaleDateString('en-GB'),
            netBill: finalBillAmount,
            paidAmount: totalPaid,
            balanceDue: balanceDue,
            extraPaid: extraPaid,
            isDebt: isDebt && balanceDue > 0,
            isAutoSend: isAutoSend,
            paymentStatus: paymentStatus
        });

        // Clear the bill
        currentBill = [];
        payments = [];
        extraPayments = [];
        appliedDiscountPercent = 0;
        appliedDiscountAmount = 0;
        if (discountPercentInput) discountPercentInput.value = '0';
        if (discountAmountInput) discountAmountInput.value = '0.00';
        if (document.getElementById('mark-as-debt')) document.getElementById('mark-as-debt').checked = false;
        if (document.getElementById('auto-send-bill-summary')) document.getElementById('auto-send-bill-summary').checked = false;

        // Reload shop data to get updated outstanding
        if (selectedShopId) {
            await loadShopDataById(selectedShopId);
        } else {
            await loadShopData(selectedShop);
        }

        // Reload products + inventory so stock counts refresh in the dropdown
        await loadProductsForBilling();

        renderBill();

    } catch (error) {
        console.error('Error saving bill:', error);
        alert(error.message || 'Failed to save bill. Please check if the backend server is running.');
    }
}

// Save Invoice Button Click
document.getElementById('save-invoice')?.addEventListener('click', saveBillToDatabase);

// Toggle Return Packets Visibility
document.getElementById('toggle-returns-btn')?.addEventListener('click', function () {
    const body = document.getElementById('return-packets-body');
    const icon = this.querySelector('[data-lucide]');

    if (body && icon) {
        body.classList.toggle('hidden');
        const isHidden = body.classList.contains('hidden');
        icon.setAttribute('data-lucide', isHidden ? 'chevron-right' : 'chevron-down');
    }
});

// Toggle Payment Collection Visibility
document.getElementById('toggle-payments-btn')?.addEventListener('click', function () {
    const body = document.getElementById('payment-collection-body');
    const icon = this.querySelector('[data-lucide]');

    if (body && icon) {
        body.classList.toggle('hidden');
        const isHidden = body.classList.contains('hidden');

        // Update Lucide Icon
        icon.setAttribute('data-lucide', isHidden ? 'chevron-right' : 'chevron-down');
        lucide.createIcons();
    }
});


// --- Sidebar Product Picker Modal Logic ---
const pickerModal = document.getElementById('picker-modal');
const openPickerBtn = document.getElementById('open-picker-btn');
const closePickerBtn = document.getElementById('close-picker-btn');
const cancelPickerBtn = document.getElementById('cancel-picker-btn');
const modalAddBtn = document.getElementById('modal-add-btn');
// Modal product select is populated in populateProductDropdowns()
const modalQtyInput = document.getElementById('modal-qty');

// Open Modal
openPickerBtn?.addEventListener('click', () => {
    pickerModal?.classList.add('active');
    const modalProductSelect = document.getElementById('modal-product-select');
    setTimeout(() => modalProductSelect?.focus(), 100);
});

// Close Modal functions
const hidePickerModal = () => {
    pickerModal?.classList.remove('active');
    const modalProductSelect = document.getElementById('modal-product-select');
    if (modalProductSelect) modalProductSelect.value = "";
    if (modalQtyInput) modalQtyInput.value = "1";
};

closePickerBtn?.addEventListener('click', hidePickerModal);
cancelPickerBtn?.addEventListener('click', hidePickerModal);

// Close on outside click
pickerModal?.addEventListener('click', (e) => {
    if (e.target === pickerModal) hidePickerModal();
});

// Add from Modal
modalAddBtn?.addEventListener('click', () => {
    const modalProductSelect = document.getElementById('modal-product-select');
    const productId = modalProductSelect?.value;
    const qty = parseInt(modalQtyInput?.value);

    if (!productId) {
        alert("Please select a product");
        return;
    }

    if (!qty || qty < 1) {
        alert("Please enter a valid quantity");
        return;
    }

    const product = productsFromDB.find(p => p.id === productId || p.id === parseInt(productId));
    if (!product) {
        alert("Product not found");
        return;
    }

    // Frontend stock validation (<=20 = Out of Stock, cannot sell)
    if (product.stock_qty !== null) {
        if (product.stock_qty <= 20) {
            alert(`"${product.name}" is Out of Stock (${product.stock_qty} packets). Cannot add to bill.`);
            return;
        }
        const alreadyInBill = getQtyAlreadyInBill(productId);
        const totalRequested = alreadyInBill + qty;
        if (totalRequested > product.stock_qty) {
            const available = Math.max(0, product.stock_qty - alreadyInBill);
            alert(`Not enough stock for "${product.name}".\nAvailable: ${product.stock_qty} packet(s)${alreadyInBill > 0 ? ` (${alreadyInBill} already in bill)` : ''}.\nYou can add at most ${available} more.`);
            return;
        }
    }

    const subtotal = product.price * qty;

    currentBill.push({
        ...product,
        qty,
        subtotal,
        type: 'sale'
    });

    renderBill();
    hidePickerModal();
});

// ===== Success Modal Functions =====
function showSuccessModal(billData) {
    console.log('showSuccessModal called', billData);
    const modal = document.getElementById('success-modal');
    console.log('Modal element:', modal);
    if (!modal) {
        console.error('Success modal not found!');
        alert('Bill saved! Bill Number: ' + billData.billNumber);
        return;
    }

    // Populate modal with bill data
    document.getElementById('success-bill-number').textContent = billData.billNumber;
    document.getElementById('success-shop-name').textContent = billData.shopName;
    document.getElementById('success-date').textContent = billData.date;
    document.getElementById('success-net-bill').textContent = `LKR ${billData.netBill.toLocaleString()}`;
    document.getElementById('success-paid').textContent = `LKR ${billData.paidAmount.toLocaleString()}`;
    document.getElementById('success-balance').textContent = `LKR ${billData.balanceDue.toLocaleString()}`;

    // Show/hide extra info section
    const extraInfo = document.getElementById('success-extra-info');
    if (billData.extraPaid > 0) {
        document.getElementById('success-outstanding-text').textContent = `Outstanding Payment: LKR ${billData.extraPaid.toLocaleString()}`;
        extraInfo.style.display = 'block';
    } else {
        extraInfo.style.display = 'none';
    }

    // Add status badges
    const statusBadges = document.getElementById('success-status-badges');
    statusBadges.innerHTML = '';

    // Payment status badge
    let statusClass = '';
    let statusText = '';
    if (billData.paymentStatus === 'paid') {
        statusClass = 'paid';
        statusText = '✓ Fully Paid';
    } else if (billData.paymentStatus === 'partial') {
        statusClass = 'partial';
        statusText = '◐ Partially Paid';
    } else {
        statusClass = 'unpaid';
        statusText = '○ Unpaid';
    }

    statusBadges.innerHTML += `<span class="status-badge-popup ${statusClass}">${statusText}</span>`;

    if (billData.isDebt) {
        statusBadges.innerHTML += ` <span class="status-badge-popup partial">📋 Marked as Debt</span>`;
    }

    if (billData.isAutoSend) {
        statusBadges.innerHTML += ` <span class="status-badge-popup paid">📱 Auto-Send Enabled</span>`;
    }

    // Show the modal
    modal.classList.add('active');

    // Reinitialize lucide icons for modal
    lucide.createIcons();
}

function hideSuccessModal() {
    const modal = document.getElementById('success-modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Success Modal Button Handlers
document.getElementById('close-success-btn')?.addEventListener('click', hideSuccessModal);

document.getElementById('success-new-bill-btn')?.addEventListener('click', function () {
    hideSuccessModal();
    // Reset to new bill state
    currentBill = [];
    payments = [];
    extraPayments = [];
    if (document.getElementById('mark-as-debt')) document.getElementById('mark-as-debt').checked = false;
    if (document.getElementById('auto-send-bill-summary')) document.getElementById('auto-send-bill-summary').checked = false;
    renderBill();
});

document.getElementById('success-view-history-btn')?.addEventListener('click', function () {
    hideSuccessModal();
    // Navigate to history page
    if (currentShopData && currentShopData.id) {
        window.location.href = `history.php?shop_id=${currentShopData.id}`;
    } else if (selectedShop && selectedShop !== "Select a Shop") {
        window.location.href = `history.php?shop=${encodeURIComponent(selectedShop)}`;
    } else {
        window.location.href = 'history.php';
    }
});

// Close modal when clicking outside
document.getElementById('success-modal')?.addEventListener('click', function (e) {
    if (e.target === this) {
        hideSuccessModal();
    }
});


addDiscountBtn?.addEventListener("click", () => {

    const netBill = currentBill.reduce((sum, item) => sum + item.subtotal, 0);

    let percent = parseFloat(discountPercentInput.value) || 0;
    let amount = parseFloat(discountAmountInput.value) || 0;

    // If percentage entered
    if (percent > 0) {
        amount = (netBill * percent) / 100;
        discountAmountInput.value = amount.toFixed(2);
    }

    // If amount entered
    else if (amount > 0) {
        percent = (amount / netBill) * 100;
        discountPercentInput.value = percent.toFixed(2);
    }

    appliedDiscountPercent = percent;
    appliedDiscountAmount = amount;

    renderBill();
});

function saveBill() {
    const percent = typeof appliedDiscountPercent !== 'undefined' ? appliedDiscountPercent : (parseFloat(document.getElementById('discount-percent-input')?.value) || 0);
    const amount = typeof appliedDiscountAmount !== 'undefined' ? appliedDiscountAmount : (parseFloat(document.getElementById('discount-amount-input')?.value) || 0);

    const billData = {
        shop_id: selectedShopId,
        items: currentBill,
        payments: payments,
        subtotal: calculateSubtotal(),
        total: calculateTotal(),
        
        discount_amount: amount,
        discount_percent: percent
    };

    fetch('/api/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(billData)
    })
    .then(response => response.json())
.then(data => {
        if (data && (data.id || data.bill_number)) {
            showSuccessModal(data);
        } else {
            alert("දෝෂයක්: බිල් එක සේව් වුණේ නැත.");
        }
    })
    .catch(error => {
        console.error('Error saving bill:', error);
        alert("දෝෂයක් ඇති විය.");
    });
}