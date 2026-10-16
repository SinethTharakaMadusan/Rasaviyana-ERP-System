document.addEventListener('DOMContentLoaded', () => {
    loadUserSettings();
    
    // ටැබ් ක්ලික් කළ විට මාරු වීමට (ඔයාගේ ප්‍රේමියම් තේම් එකට අදාළව)
    const tabButtons = document.querySelectorAll('.settings-tab-btn');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const section = btn.getAttribute('data-section');
            renderSettingsSection(section);
        });
    });
});

let currentUserData = {};

function loadUserSettings() {
    fetch('backend/api/get_user_settings.php')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                currentUserData = data.user;
                renderSettingsSection('profile'); // මුලින්ම Profile Details පෙන්වීම
            } else {
                document.getElementById('settings-content').innerHTML = `
                    <div class="error-state" style="padding: 20px; color: #ff4d4f;">
                        <p>Failed to load user preferences: ${data.message}</p>
                    </div>`;
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

function renderSettingsSection(section) {
    const container = document.getElementById('settings-content');
    
    if (section === 'profile') {
        container.innerHTML = `
            <div class="settings-card glass-panel">
                <h3>Profile Details</h3>
                <form id="profileForm" onsubmit="updateProfile(event)">
                    <div class="form-group">
                        <label>Full Name</label>
                        <input type="text" id="full_name" value="${currentUserData.full_name || ''}" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label>Username</label>
                        <input type="text" id="username" value="${currentUserData.username || ''}" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label>Email Address</label>
                        <input type="email" id="email" value="${currentUserData.email || ''}" class="form-control" required>
                    </div>
                    <button type="submit" class="btn-primary">Save Changes</button>
                </form>
            </div>
        `;
    } else if (section === 'notifications') {
        container.innerHTML = `
            <div class="settings-card glass-panel">
                <h3>Notification Preferences</h3>
                <p style="color: var(--text-muted, #aaa); margin-bottom: 20px;">Manage how you receive alerts and updates for Rasaviyana inventory.</p>
                
                <div class="form-group" style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <div>
                        <h4 style="margin: 0; font-size: 15px; color: var(--text-main, #fff);">Low Stock Alerts</h4>
                        <p style="margin: 0; font-size: 13px; color: var(--text-muted, #aaa);">Get notified and show items in the Alert page when inventory falls below minimum.</p>
                    </div>
                    <label class="switch">
                        <input type="checkbox" id="notif_low_stock" ${currentUserData.preferences?.notif_low_stock ? 'checked' : ''} onchange="autoSavePreference('notif_low_stock', this.checked)">
                        <span class="slider"></span>
                    </label>
                </div>

                <div class="form-group" style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <div>
                        <h4 style="margin: 0; font-size: 15px; color: var(--text-main, #fff);">Daily Summary Reports</h4>
                        <p style="margin: 0; font-size: 13px; color: var(--text-muted, #aaa);">Receive a daily email summary of sales and billing activities.</p>
                    </div>
                    <label class="switch">
                        <input type="checkbox" id="notif_daily_summary" ${currentUserData.preferences?.notif_daily_summary ? 'checked' : ''} onchange="autoSavePreference('notif_daily_summary', this.checked)">
                        <span class="slider"></span>
                    </label>
                </div>

                <div class="form-group" style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; margin-bottom: 20px;">
                    <div>
                        <h4 style="margin: 0; font-size: 15px; color: var(--text-main, #fff);">System Security Alerts</h4>
                        <p style="margin: 0; font-size: 13px; color: var(--text-muted, #aaa);">Alerts regarding new login sessions and password changes.</p>
                    </div>
                    <label class="switch">
                        <input type="checkbox" id="notif_security" ${currentUserData.preferences?.notif_security ? 'checked' : ''} onchange="autoSavePreference('notif_security', this.checked)">
                        <span class="slider"></span>
                    </label>
                </div>
            </div>
        `;
    } else if (section === 'security') {
        container.innerHTML = `
            <div class="settings-card glass-panel">
                <h3>Security Settings</h3>
                <p>Role: <strong>${currentUserData.role}</strong></p>
            </div>
        `;
    } else if (section === 'account') {
        container.innerHTML = `
            <div class="settings-card glass-panel">
                <h3>Change Password</h3>
                <form id="passwordForm" onsubmit="updatePassword(event)">
                    <div class="form-group">
                        <label>Current Password</label>
                        <input type="password" id="current_password" class="form-control" required>
                    </div>
                    <div class="form-group">
                        <label>New Password</label>
                        <input type="password" id="new_password" class="form-control" required>
                    </div>
                    <button type="submit" class="btn-primary">Update Password</button>
                </form>
            </div>
        `;
    }

    
    // Lucide අයිකන් අලුතින් රෙන්ඩර් කිරීමට
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

function saveNotifications(event) {
    event.preventDefault();
    
    const preferences = {
        notif_low_stock: document.getElementById('notif_low_stock').checked,
        notif_daily_summary: document.getElementById('notif_daily_summary').checked,
        notif_security: document.getElementById('notif_security').checked
    };

    fetch('backend/api/update_preferences.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ preferences: preferences })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Notification preferences updated successfully!');
        } else {
            alert('Failed to update: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function autoSavePreference(key, value) {
    if (!currentUserData.preferences) {
        currentUserData.preferences = {};
    }
    currentUserData.preferences[key] = value;

    const preferences = {
        notif_low_stock: document.getElementById('notif_low_stock')?.checked || false,
        notif_daily_summary: document.getElementById('notif_daily_summary')?.checked || false,
        notif_security: document.getElementById('notif_security')?.checked || false
    };

    fetch('backend/api/update_preferences.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ preferences: preferences })
    })
    .then(response => response.json())
    .then(data => {
        if (!data.success) {
            console.error('Failed to auto-save preference');
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function updatePassword(event) {
    event.preventDefault();

    const currentPassword = document.getElementById('current_password').value;
    const newPassword = document.getElementById('new_password').value;

    if (newPassword.length < 6) {
        alert('New password must be at least 6 characters long.');
        return;
    }

    fetch('backend/api/update_password.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            current_password: currentPassword,
            new_password: newPassword
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Password updated successfully!');
            document.getElementById('passwordForm').reset();
        } else {
            alert('Error: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('An unexpected error occurred.');
    });
}

// Logout 

function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        fetch('backend/api/logout.php')
        .then(() => {
            window.location.href = 'index.php';
        })
        .catch(error => {
            console.error('Logout error:', error);
            window.location.href = 'index.php';
        });
    }
}