// window.addEventListener('beforeunload', function (e) {
//     navigator.sendBeacon('backend/api/logout.php');
// });

document.addEventListener('DOMContentLoaded', () => {
    loadUsers();

    document.getElementById('search-users').addEventListener('input', filterUsers);
    document.getElementById('role-filter').addEventListener('change', filterUsers);

   
    document.getElementById('edit-user-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const userData = {
            id: document.getElementById('edit-user-id').value,
            username: document.getElementById('edit-username').value,
            full_name: document.getElementById('edit-full-name').value,
            email: document.getElementById('edit-email').value,
            phone: document.getElementById('edit-phone').value,
            role: document.getElementById('edit-role').value
        };

        await updateUserInDB(userData);
    });
});

async function loadUsers() {
    try {
        const response = await fetch('backend/api/users.php');
        const data = await response.json();

        document.getElementById('total-users-count').textContent = String(data.stats.total).padStart(2, '0');
        document.getElementById('total-admin-count').textContent = String(data.stats.admin).padStart(2, '0');
        document.getElementById('total-manager-count').textContent = String(data.stats.manager).padStart(2, '0');

        renderUsers(data.users);
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

function renderUsers(users) {
    const container = document.getElementById('users-container');
    container.innerHTML = '';

    if (users.length === 0) {
        container.innerHTML = '<p style="padding: 20px; text-align: center; color: #777;">No users found.</p>';
        return;
    }

    users.forEach(user => {
        const roleStr = user.role || '';
        const isAdmin = roleStr.toLowerCase() === 'admin';
        const badgeClass = isAdmin ? 'admin' : 'manager';
        const avatarBg = isAdmin ? 'ff8c00' : '3b82f6';
        const displayName = user.full_name || user.username || 'User';

        const card = document.createElement('div');
        card.className = 'card user-card';
        card.dataset.role = roleStr;
        card.dataset.name = displayName.toLowerCase();

        card.innerHTML = `
            <div class="user-details-left">
                <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=${avatarBg}&color=fff" alt="User">
                <div>
                    <div class="user-title-row">
                        <h4>${escapeHtml(displayName)}</h4>
                        <span class="role-badge ${badgeClass}">${escapeHtml(roleStr.toUpperCase())}</span>
                    </div>
                    <p>${escapeHtml(user.email || '')} | ${escapeHtml(user.phone || 'No Phone')}</p>
                </div>
            </div>
            <div class="user-actions">
                <button class="btn-action btn-edit" onclick='openEditModal(${JSON.stringify(user)})'><i data-lucide="edit" class="action"></i></button>
                <button class="btn-action btn-delete" onclick="deleteUser(${user.id})"><i data-lucide="trash" class="action"></i></button>
            </div>
        `;
        container.appendChild(card);
    });

    lucide.createIcons();
}


function openEditModal(user) {
    document.getElementById('edit-user-id').value = user.id;
    document.getElementById('edit-username').value = user.username || '';
    document.getElementById('edit-full-name').value = user.full_name || '';
    document.getElementById('edit-email').value = user.email || '';
    document.getElementById('edit-phone').value = user.phone || '';
    document.getElementById('edit-role').value = user.role || 'Admin';

    document.getElementById('edit-user-modal').style.display = 'flex';
}


function closeEditModal() {
    document.getElementById('edit-user-modal').style.display = 'none';
}

async function updateUserInDB(userData) {
    try {
        const response = await fetch('backend/api/users.php', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        const result = await response.json();
        if (result.success) {
            closeEditModal();
            loadUsers(); 
        } else {
            alert(result.error || 'Failed to update user');
        }
    } catch (error) {
        console.error('Error updating user:', error);
    }
}

function filterUsers() {
    const searchText = document.getElementById('search-users').value.toLowerCase();
    const selectedRole = document.getElementById('role-filter').value;
    const cards = document.querySelectorAll('.user-card');

    cards.forEach(card => {
        const name = card.dataset.name;
        const role = card.dataset.role;
        
        const matchesSearch = name.includes(searchText);
        const matchesRole = selectedRole === '' || role === selectedRole;

        if (matchesSearch && matchesRole) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
}

async function deleteUser(id) {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
        const response = await fetch(`backend/api/users.php?id=${id}`, { method: 'DELETE' });
        const result = await response.json();
        if (result.success) {
            loadUsers();
        } else {
            alert(result.error || 'Failed to delete user');
        }
    } catch (error) {
        console.error('Error deleting user:', error);
    }
}

function escapeHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}


function openAddUserModal() {
    document.getElementById('add-user-modal').style.display = 'flex';
}

function closeAddUserModal() {
    document.getElementById('add-user-modal').style.display = 'none';
    document.getElementById('add-user-form').reset(); 
}


document.addEventListener('DOMContentLoaded', () => {
    loadUsers();

    document.getElementById('search-users').addEventListener('input', filterUsers);
    document.getElementById('role-filter').addEventListener('change', filterUsers);
    
    document.getElementById('add-user-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        const newUser = {
            username: document.getElementById('add-username').value,
            full_name: document.getElementById('add-full-name').value,
            email: document.getElementById('add-email').value,
            phone: document.getElementById('add-phone').value,
            role: document.getElementById('add-role').value,
            password: document.getElementById('add-password').value || '123456'
        };

        try {
            const response = await fetch('backend/api/users.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newUser)
            });

            const result = await response.json();

            if (result.success) {
                closeAddUserModal();
                loadUsers();
            } else {
                alert(result.error || 'Failed to add user');
            }
        } catch (error) {
            console.error('Error adding user:', error);
        }
    });
});