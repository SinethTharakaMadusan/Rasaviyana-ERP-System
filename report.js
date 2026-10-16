// window.addEventListener('beforeunload', function (e) {
//     navigator.sendBeacon('backend/api/logout.php');
// });

// Standard Analytics JS (V1)
const CHART_COLORS = [
    '#2A9D8F', '#E76F51', '#F4A261', '#E9C46A', '#264653', 
    '#0077b6', '#00b4d8', '#90e0ef', '#03045e', '#caf0f8'
];

let timelineChartInstance = null;
let compositionChartInstance = null;
let allCategories = []; 
let currentCategoryFilter = 'all';

document.addEventListener('DOMContentLoaded', () => {
    initFilters();
    loadDashboardData();
    populateCategoryFilter();

    document.getElementById('refresh-reports-btn').addEventListener('click', loadDashboardData);
    document.getElementById('rpt-year').addEventListener('change', loadDashboardData);
    document.getElementById('rpt-month').addEventListener('change', loadDashboardData);
    document.getElementById('rpt-product-filter').addEventListener('change', (e) => {
        currentCategoryFilter = e.target.value;
        loadTimelineChart();
    });
});

function initFilters() {
    const yearSelect = document.getElementById('rpt-year');
    const currentYear = new Date().getFullYear();
    for (let y = currentYear - 2; y <= currentYear + 1; y++) {
        const option = document.createElement('option');
        option.value = y;
        option.textContent = y;
        if (y === currentYear) option.selected = true;
        yearSelect.appendChild(option);
    }
}

async function populateCategoryFilter() {
    try {
        const res = await fetch('backend/api/reports.php/categories');
        const categories = await res.json();
        allCategories = categories;
        
        const filter = document.getElementById('rpt-product-filter');
        filter.innerHTML = '<option value="all">All Products</option>';
        categories.forEach(c => {
            if (c) {
                const opt = document.createElement('option');
                opt.value = c;
                opt.textContent = c;
                filter.appendChild(opt);
            }
        });
    } catch (e) {
        console.error('Failed to load categories', e);
    }
}

async function loadDashboardData() {
    loadSummary();
    loadTimelineChart();
    loadCompositionChartAndTable();
    loadProfitChart();
}

function getFilterParams() {
    const y = document.getElementById('rpt-year').value;
    const m = document.getElementById('rpt-month').value;
    return `year=${y}&month=${m}`;
}

async function loadSummary() {
    try {
        const res = await fetch('backend/api/reports.php/summary');
        const data = await res.json();
        
        document.getElementById('rpt-total-revenue').textContent = formatCurrency(data.total_revenue || 0);
        document.getElementById('rpt-total-packets').textContent = (data.total_packets || 0).toLocaleString();
        
        // Update Net Profit KPI
        const netProfit = (data.total_revenue || 0) - (data.total_expenses || 0);
        const netProfitEl = document.getElementById('rpt-net-profit');
        if (netProfitEl) {
            netProfitEl.textContent = formatCurrency(netProfit);
            netProfitEl.style.color = netProfit >= 0 ? '#10b981' : '#ef4444';
        }

        // Fetch top category from composition endpoint to show in KPI
        const compRes = await fetch(`backend/api/reports.php/category-packet-sales?${getFilterParams()}`);
        const compData = await compRes.json();
        if (compData.labels && compData.labels.length > 0 && compData.labels[0] !== 'No data') {
            document.getElementById('rpt-top-category').textContent = compData.labels[0];
        } else {
            document.getElementById('rpt-top-category').textContent = 'N/A';
        }
    } catch (err) {
        console.error('Error loading summary:', err);
    }
}

async function loadTimelineChart() {
    try {
        const y = document.getElementById('rpt-year').value;
        const url = currentCategoryFilter === 'all' 
            ? `backend/api/reports.php/monthly-packets-by-category?year=${y}`
            : `backend/api/reports.php/monthly-packets-by-category?year=${y}&category=${encodeURIComponent(currentCategoryFilter)}`;
            
        const res = await fetch(url);
        const data = await res.json();
        
        const ctx = document.getElementById('timelineChart').getContext('2d');
        if (timelineChartInstance) timelineChartInstance.destroy();

        if (currentCategoryFilter === 'all') {
            // Stacked Bar Chart for packets by category
            timelineChartInstance = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: data.labels,
                    datasets: data.datasets
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: { stacked: true },
                        y: { stacked: true, beginAtZero: true, title: {display: true, text: 'Packets Sold'} }
                    }
                }
            });
        } else {
            // Line chart for specific product
            timelineChartInstance = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: data.labels,
                    datasets: [{
                        label: `${currentCategoryFilter} (Packets)`,
                        data: data.packets,
                        borderColor: '#2A9D8F',
                        backgroundColor: 'rgba(42, 157, 143, 0.1)',
                        borderWidth: 2,
                        pointBackgroundColor: '#2A9D8F',
                        fill: true,
                        tension: 0.3
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: { beginAtZero: true, title: {display: true, text: 'Packets Sold'} }
                    }
                }
            });
        }
        
    } catch (err) {
        console.error('Error loading timeline:', err);
    }
}

async function loadCompositionChartAndTable() {
    try {
        const res = await fetch(`backend/api/reports.php/category-packet-sales?${getFilterParams()}`);
        const data = await res.json();
        
        // Render Doughnut Chart
        const ctx = document.getElementById('compositionChart').getContext('2d');
        if (compositionChartInstance) compositionChartInstance.destroy();
        
        compositionChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.packets,
                    backgroundColor: CHART_COLORS,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'right' }
                }
            }
        });
        
        // Populate Table
        const tbody = document.getElementById('rpt-performance-table');
        tbody.innerHTML = '';
        
        const totalPkt = data.packets.reduce((a,b)=>a+b, 0);
        
        if (data.labels[0] === 'No data') {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 20px;">No sales data available for selected period.</td></tr>';
            return;
        }

        for (let i = 0; i < data.labels.length; i++) {
            const product = data.labels[i];
            const pkts = data.packets[i];
            const rev = data.revenue[i];
            const avg = pkts > 0 ? (rev / pkts).toFixed(2) : '0.00';
            const share = totalPkt > 0 ? ((pkts / totalPkt) * 100).toFixed(1) + '%' : '0%';
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="font-weight: 500;">${product}</td>
                <td>LKR ${avg}</td>
                <td style="text-align: right;">${pkts.toLocaleString()}</td>
                <td style="text-align: right; color: var(--success-color); font-weight: 600;">LKR ${rev.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                <td style="text-align: right;">${share}</td>
            `;
            tbody.appendChild(tr);
        }

    } catch (err) {
        console.error('Error loading composition data:', err);
    }
}

async function loadProfitChart() {
    try {
        const y = document.getElementById('rpt-year').value;
        const res = await fetch(`backend/api/reports.php/monthly-profit?year=${y}`);
        const data = await res.json();
        
        const ctx = document.getElementById('profitChart').getContext('2d');
        if (window.profitChartInstance) window.profitChartInstance.destroy();
        
        window.profitChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Net Profit (LKR)',
                    data: data.profit,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderWidth: 3,
                    pointBackgroundColor: '#10b981',
                    pointRadius: 4,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return 'Profit: ' + formatCurrency(context.parsed.y);
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: function(context) {
                                if (context.tick.value === 0) return '#666'; // Highlight zero line
                                return 'rgba(0,0,0,0.05)';
                            },
                            lineWidth: function(context) {
                                if (context.tick.value === 0) return 2;
                                return 1;
                            }
                        },
                        title: { display: true, text: 'Amount (LKR)' }
                    }
                }
            }
        });
    } catch (err) {
        console.error('Error loading profit chart:', err);
    }
}

function formatCurrency(val) {
    return 'LKR ' + Number(val).toLocaleString(undefined, {
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2
    });
}
