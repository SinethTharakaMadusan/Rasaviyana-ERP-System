document.addEventListener('DOMContentLoaded', () => {
    let allBatches = [];
    let currentFilter = 'all';

    const batchesTableBody = document.getElementById('batchesTableBody');
    const batchSearchInput = document.getElementById('batchSearchInput');
    const totalBatchesCount = document.getElementById('total-batches-count');
    const activeBatchesCount = document.getElementById('active-batches-count');
    const expiredBatchesCount = document.getElementById('expired-batches-count');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const openBatchModalBtn = document.getElementById('open-batch-modal-btn');
    const batchModal = document.getElementById('batch-modal');

    // Modal Elements
    const generateBtn = document.getElementById('generate-btn');
    const saveBatchBtn = document.getElementById('save-batch-btn');
    const productSelect = document.getElementById('product-select');
    const mfdDate = document.getElementById('mfd-date');
    const expDate = document.getElementById('exp-date');
    const batchOutput = document.getElementById('batch-output');

    // Fetch Batches from API
    async function loadBatches() {
        try {
            if (batchesTableBody) {
                batchesTableBody.innerHTML = `<tr><td colspan="8" class="no-data">Loading batches...</td></tr>`;
            }
            
            const response = await fetch('backend/api/get_batches.php', {
                method: 'GET',
                credentials: 'include'
            });

            if (!response.ok) throw new Error('Failed to fetch batches');
            
            const data = await response.json();
            
            if (Array.isArray(data)) {
                allBatches = data;
            } else {
                allBatches = [];
            }

            updateMetrics();
            renderBatches();
        } catch (error) {
            console.error('Error loading batches:', error);
            if (batchesTableBody) {
                batchesTableBody.innerHTML = `<tr><td colspan="8" class="no-data" style="color: #ef4444;">Failed to load batches from server.</td></tr>`;
            }
        }
    }

    // Update Top Summary Cards
    function updateMetrics() {
        const total = allBatches.length;
        const active = allBatches.filter(b => b.status === 'Active').length;
        const expired = allBatches.filter(b => b.status !== 'Active').length;

        if (totalBatchesCount) totalBatchesCount.textContent = total;
        if (activeBatchesCount) activeBatchesCount.textContent = active;
        if (expiredBatchesCount) expiredBatchesCount.textContent = expired;
    }

    // Render Table Rows
    function renderBatches() {
        if (!batchesTableBody) return;
        const query = (batchSearchInput ? batchSearchInput.value : '').toLowerCase().trim();

        const filtered = allBatches.filter(batch => {
            const matchesQuery = !query || 
                (batch.batch_id && batch.batch_id.toLowerCase().includes(query)) ||
                (batch.product_name && batch.product_name.toLowerCase().includes(query)) ||
                (batch.mfd_date && batch.mfd_date.includes(query)) ||
                (batch.exp_date && batch.exp_date.includes(query));

            const isBatchActive = batch.status === 'Active';
            let matchesFilter = true;
            if (currentFilter === 'active') {
                matchesFilter = isBatchActive;
            } else if (currentFilter === 'non-active') {
                matchesFilter = !isBatchActive;
            }

            return matchesQuery && matchesFilter;
        });

        if (filtered.length === 0) {
            batchesTableBody.innerHTML = `<tr><td colspan="8" class="no-data">No matching batches found.</td></tr>`;
            return;
        }

        batchesTableBody.innerHTML = filtered.map((batch, index) => {
            const isActive = batch.status === 'Active';
            const statusBadge = isActive
                ? `<span class="badge-active"><i data-lucide="check-circle" style="width: 14px; height: 14px;"></i> Active</span>`
                : `<span class="badge-expired"><i data-lucide="alert-triangle" style="width: 14px; height: 14px;"></i> Non-Active</span>`;

            return `
                <tr>
                    <td>${index + 1}</td>
                    <td><strong>${escapeHtml(batch.batch_id)}</strong></td>
                    <td>${escapeHtml(batch.product_name)}</td>
                    <td>${escapeHtml(batch.mfd_date || '-')}</td>
                    <td>${escapeHtml(batch.exp_date || '-')}</td>
                    <td>${statusBadge}</td>
                    <td>${escapeHtml(batch.created_at || '-')}</td>
                    <td>
                        <button class="btn-danger" onclick="deleteBatch(${batch.id}, '${escapeHtml(batch.batch_id)}')">
                            <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i> Delete
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        if (window.lucide) {
            lucide.createIcons();
        }
    }

    // Delete Batch Function
    window.deleteBatch = async function(id, batchId) {
        if (!confirm(`Are you sure you want to delete batch "${batchId}"?`)) return;

        try {
            const response = await fetch('backend/api/delete_batch.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ id: id })
            });

            const data = await response.json();
            if (data.success) {
                alert(data.message || 'Batch deleted successfully.');
                loadBatches();
            } else {
                alert(data.message || 'Failed to delete batch.');
            }
        } catch (error) {
            console.error('Error deleting batch:', error);
            alert('Network error while deleting batch.');
        }
    };

    // Helper: Escape HTML
    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    // Search Input Event Listener
    if (batchSearchInput) {
        batchSearchInput.addEventListener('input', renderBatches);
    }

    // Filter Buttons Event Listener
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.getAttribute('data-filter');
            renderBatches();
        });
    });

    // Load products into the batch modal dropdown from the API
    async function loadProductsForBatchModal() {
        if (!productSelect) return;
        try {
            const response = await fetch('backend/api/test_products.php', {
                method: 'GET',
                credentials: 'include'
            });
            if (!response.ok) throw new Error('Failed to fetch products');
            const products = await response.json();

            productSelect.innerHTML = '<option value="">-- Select Product --</option>';

            if (products && products.length > 0) {
                products.forEach(p => {
                    const option = document.createElement('option');
                    const pName = p.product_name || p.name || '';
                    option.value = p.code || pName.substring(0, 2).toUpperCase();
                    option.textContent = pName + (p.code ? ` (${p.code})` : '');
                    productSelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error('Error loading products for batch modal, using fallback:', error);
            productSelect.innerHTML = '<option value="">-- Select Product --</option>';
            
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

            Object.keys(PRODUCT_BATCH_PREFIXES).forEach(name => {
                const option = document.createElement('option');
                option.value = PRODUCT_BATCH_PREFIXES[name];
                option.textContent = name;
                productSelect.appendChild(option);
            });
        }
    }

    // Helper to open batch modal cleanly
    function openBatchModal() {
        if (!batchModal) return;
        batchModal.classList.add('active');
        
        if (productSelect) productSelect.value = "";
        if (mfdDate) mfdDate.value = "";
        if (expDate) expDate.value = "";
        if (batchOutput) batchOutput.value = "";

        loadProductsForBatchModal();
    }

    // Open Modal Listener
    if (openBatchModalBtn) {
        openBatchModalBtn.addEventListener('click', openBatchModal);
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

    // Generate Logic
    if (generateBtn) {
        generateBtn.addEventListener('click', async () => {
            if (!productSelect || !mfdDate) return;
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
                    alert(data.error || data.message || "Failed to generate batch number.");
                }
            } catch (error) {
                console.error('Network or Fetch Error:', error);
                alert("Network error while generating batch number.");
            }
        });
    }

    // Save Batch Logic
    if (saveBatchBtn) {
        saveBatchBtn.addEventListener('click', async () => {
            if (!batchOutput || !productSelect || !mfdDate || !expDate) return;
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
                    if (batchModal) batchModal.classList.remove('active');

                    // Clear modal fields
                    batchOutput.value = "";
                    productSelect.value = "";
                    mfdDate.value = "";
                    expDate.value = "";

                    // Refresh batches list
                    loadBatches();
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

    // Check URL parameters / hash to auto-open modal when navigating from other pages
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('openModal') === 'true' || window.location.hash === '#generate') {
        openBatchModal();
    }

    // Expose loadBatches globally so script.js can refresh on batch save
    window.loadBatches = loadBatches;

    // Initial Load
    loadBatches();
});