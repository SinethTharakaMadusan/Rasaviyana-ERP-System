// window.addEventListener('beforeunload', function (e) {
//     navigator.sendBeacon('backend/api/logout.php');
// });

const API_BASE_URL = 'backend/api';

// Alert data storage
let allAlerts = [];

// Main load function called by navigation
function loadAlerts() {
    loadAlertsEnhanced();
}

// Refresh alerts function called by refresh button
function refreshAlerts() {
    loadAlertsEnhanced();
}

// Initialize alerts when page loads
document.addEventListener('DOMContentLoaded', function () {
    // Load alerts if on alert view
    const alertView = document.getElementById('alert-view');
    if (alertView && alertView.style.display !== 'none') {
        loadAlertsEnhanced();
    }
});

// Main function to load and generate alerts
async function loadAlertsEnhanced() {
    try {
        // Show loading state
        const container = document.getElementById('alerts-container');
        if (container) {
            container.innerHTML = `
                <div style="text-align: center; padding: 60px 20px;">
                    <i data-lucide="loader" style="width: 48px; height: 48px; color: #888; animation: spin 1s linear infinite;"></i>
                    <p style="margin-top: 16px; color: #888;">Loading alerts...</p>
                </div>
            `;
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }

        // Fetch data from the new centralized alerts endpoint
        const response = await fetch(`${API_BASE_URL}/alerts`);
        if (!response.ok) throw new Error('Failed to fetch alerts');

        allAlerts = await response.json();

        // Update summary counts
        updateAlertSummary();

        // Display alerts
        displayAlerts(allAlerts);

    } catch (error) {
        console.error('Error loading alerts:', error);
        showErrorState();
    }
}

// Update alert summary cards
function updateAlertSummary() {
    const criticalCount = allAlerts.filter(a => a.type === 'critical').length;
    const warningCount = allAlerts.filter(a => a.type === 'warning').length;
    const infoCount = allAlerts.filter(a => a.type === 'info').length;

    const criticalEl = document.getElementById('critical-count');
    const warningEl = document.getElementById('warning-count');
    const infoEl = document.getElementById('info-count');

    if (criticalEl) criticalEl.textContent = criticalCount;
    if (warningEl) warningEl.textContent = warningCount;
    if (infoEl) infoEl.textContent = infoCount;
}

// Display alerts in the container
function displayAlerts(alerts) {
    const container = document.getElementById('alerts-container');
    if (!container) return;

    if (alerts.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 60px 20px;">
                <i data-lucide="check-circle" style="width: 64px; height: 64px; color: #10b981;"></i>
                <h3 style="margin-top: 16px; color: #10b981;">All Clear!</h3>
                <p style="color: #888; margin-top: 8px;">No alerts at this time. Your system is running smoothly.</p>
            </div>
        `;
        if (typeof lucide !== 'undefined') lucide.createIcons();
        return;
    }

    // Sort alerts: critical first, then warning, then info
    const sortedAlerts = alerts.sort((a, b) => {
        const priority = { critical: 0, warning: 1, info: 2 };
        return priority[a.type] - priority[b.type];
    });

    // Generate HTML for each alert
    const alertsHTML = sortedAlerts.map(alert => {
        const typeColors = {
            critical: { bg: '#fef2f2', border: '#ef4444', text: '#991b1b', icon: '#ef4444' },
            warning: { bg: '#fffbeb', border: '#f59e0b', text: '#92400e', icon: '#f59e0b' },
            info: { bg: '#eff6ff', border: '#3b82f6', text: '#1e40af', icon: '#3b82f6' }
        };

        const colors = typeColors[alert.type];

        return `
            <div class="alert-item" style="
                background: ${colors.bg};
                border-left: 4px solid ${colors.border};
                padding: 20px;
                margin-bottom: 12px;
                border-radius: 8px;
                display: flex;
                align-items: start;
                gap: 16px;
            ">
                <div style="flex-shrink: 0;">
                    <i data-lucide="${alert.icon}" style="width: 24px; height: 24px; color: ${colors.icon};"></i>
                </div>
                <div style="flex: 1;">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                        <div>
                            <h4 style="margin: 0; color: ${colors.text}; font-size: 16px; font-weight: 600;">
                                ${alert.title}
                            </h4>
                            <span style="
                                display: inline-block;
                                background: ${colors.border};
                                color: white;
                                padding: 2px 8px;
                                border-radius: 12px;
                                font-size: 11px;
                                font-weight: 600;
                                text-transform: uppercase;
                                margin-top: 4px;
                            ">${alert.type}</span>
                        </div>
                    </div>
                    <p style="margin: 8px 0; color: ${colors.text}; font-size: 14px;">
                        ${alert.message}
                    </p>
                    <p style="margin: 8px 0; color: #666; font-size: 13px;">
                        ${alert.details}
                    </p>
                    ${alert.action ? `
                        <button style="
                            background: ${colors.border};
                            color: white;
                            border: none;
                            padding: 8px 16px;
                            border-radius: 6px;
                            font-size: 13px;
                            font-weight: 500;
                            cursor: pointer;
                            margin-top: 8px;
                        " onclick="handleAlertAction('${alert.id}', '${alert.category}')">
                            ${alert.action}
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = `<div style="padding: 20px;">${alertsHTML}</div>`;
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// Filter alerts based on selected filters
function filterAlerts() {
    const typeFilter = document.getElementById('alert-filter')?.value || 'all';
    const categoryFilter = document.getElementById('alert-category-filter')?.value || 'all';

    let filtered = allAlerts;

    if (typeFilter !== 'all') {
        filtered = filtered.filter(alert => alert.type === typeFilter);
    }

    if (categoryFilter !== 'all') {
        filtered = filtered.filter(alert => alert.category === categoryFilter);
    }

    displayAlerts(filtered);
}

// Handle alert action buttons
function handleAlertAction(alertId, category) {
    console.log('Alert action:', alertId, category);

    // Navigate to appropriate section based on category
    if (category === 'inventory') {
        // Navigate to inventory view
        const inventoryNav = document.querySelector('.nav-item:nth-child(2)');
        if (inventoryNav) inventoryNav.click();
    } else if (category === 'payment') {
        // Navigate to outstanding view
        const outstandingNav = document.querySelector('.nav-item:nth-child(5)');
        if (outstandingNav) outstandingNav.click();
    }
}

// Refresh alerts
function refreshAlerts() {
    loadAlertsEnhanced();
}

// Show error state
function showErrorState() {
    const container = document.getElementById('alerts-container');
    if (container) {
        container.innerHTML = `
            <div style="text-align: center; padding: 60px 20px;">
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




