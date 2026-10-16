const API = 'backend/api';

let allAlerts = [];

async function fetchAlerts() {
    const container = document.getElementById('alert-feed-container');
    try {
        const resp = await fetch(`${API}/alerts`);
        if (!resp.ok) throw new Error('API Error');
        
        allAlerts = await resp.json();
        
        updateSummary();
        renderAlerts(allAlerts);
    } catch (e) {
        console.error(e);
        container.innerHTML = `
            <div class="alert-loading">
                <i data-lucide="alert-circle" style="width: 48px; height: 48px; color: #ef4444;"></i>
                <p style="margin-top: 16px; color: #ef4444; font-weight: 600;">Failed to load system health data.</p>
                <button class="btn-primary" onclick="fetchAlerts()" style="margin-top: 10px;">Retry</button>
            </div>
        `;
        lucide.createIcons();
    }
}

function updateSummary() {
    const critical = allAlerts.filter(a => a.type === 'critical').length;
    const warning  = allAlerts.filter(a => a.type === 'warning').length;
    
    document.getElementById('critical-count').textContent = critical;
    document.getElementById('warning-count').textContent = warning;
    document.getElementById('total-count').textContent    = allAlerts.length;
}

function renderAlerts(alerts) {
    const container = document.getElementById('alert-feed-container');
    
    if (alerts.length === 0) {
        container.innerHTML = `
            <div class="alert-loading">
                <i data-lucide="check-circle" style="width: 64px; height: 64px; color: #10b981;"></i>
                <h3 style="margin-top: 16px; color: #10b981;">System Health: Optimal</h3>
                <p>No critical or warning alerts detected at this time.</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    container.innerHTML = alerts.map(alert => `
        <div class="alert-item ${alert.type}" data-id="${alert.id}">
            <div class="alert-icon-container">
                <i data-lucide="${alert.icon}"></i>
            </div>
            <div class="alert-body">
                <h4>
                    <span class="alert-type-badge">${alert.type}</span>
                    ${alert.title}
                </h4>
                <p class="message">${alert.message}</p>
                <p class="details">${alert.details}</p>
                <div class="alert-actions">
                    <button class="btn-fix" onclick="handleFix('${alert.target_url}')">
                        <i data-lucide="arrow-right-circle"></i> ${alert.action}
                    </button>
                </div>
            </div>
        </div>
    `).join('');
    
    lucide.createIcons();
}

function handleFix(url) {
    window.location.href = url;
}

// Filters
function applyFilters() {
    const type = document.getElementById('filter-type').value;
    const cat  = document.getElementById('filter-category').value;
    const q    = document.getElementById('alert-search').value.toLowerCase();
    
    let filtered = allAlerts;
    
    if (type !== 'all') filtered = filtered.filter(a => a.type === type);
    if (cat !== 'all')  filtered = filtered.filter(a => a.category === cat);
    if (q) {
        filtered = filtered.filter(a => 
            a.title.toLowerCase().includes(q) || 
            a.message.toLowerCase().includes(q) ||
            a.details.toLowerCase().includes(q)
        );
    }
    
    renderAlerts(filtered);
}

// Initializers
document.addEventListener('DOMContentLoaded', () => {
    fetchAlerts();
    
    document.getElementById('alert-refresh-btn').onclick = fetchAlerts;
    document.getElementById('filter-type').onchange     = applyFilters;
    document.getElementById('filter-category').onchange = applyFilters;
    document.getElementById('alert-search').oninput     = applyFilters;
});
