const API_BASE_URL = 'backend/api';

document.addEventListener('DOMContentLoaded', () => {
    // Initialize icons
    lucide.createIcons();

    const form = document.getElementById('login-form');
    if (form) {
        form.addEventListener('submit', handleLogin);
    }
});

async function handleLogin(e) {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const msg = document.getElementById('login-message');
    const submitBtn = document.querySelector('button[type="submit"]');

    try {
        // Disable button
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="btn-text">Logging in...</span> <i data-lucide="loader" class="spin checkbox" style="width:16px;"></i>';
        lucide.createIcons();
        msg.textContent = '';

        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            msg.innerHTML = '<span style="color: #10b981"><i data-lucide="check-circle" style="vertical-align:middle;margin-right:5px;width:16px;"></i> Login successful! Redirecting...</span>';
            lucide.createIcons();

            // Store user info in both sessionStorage (tab) and localStorage (cross-tab)
            sessionStorage.setItem('user', JSON.stringify(data.user));
            localStorage.setItem('user', JSON.stringify(data.user));

            // Redirect after 1 second
            setTimeout(() => {
                window.location.href = 'dashboard.php';
            }, 1000);
        } else {
            msg.innerHTML = `<span style="color: #e11d48"><i data-lucide="alert-circle" style="vertical-align:middle;margin-right:5px;width:16px;"></i> ${data.error || 'Login failed.'}</span>`;
            lucide.createIcons();

            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span class="btn-text">Sign In</span> <i data-lucide="log-in" class="btn-icon-right" style="width:16px;"></i>';
            lucide.createIcons();
        }
    } catch (error) {
        console.error('Error:', error);
        msg.innerHTML = '<span style="color: #e11d48">Network error. Is the server running?</span>';
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span class="btn-text">Sign In</span> <i data-lucide="log-in" class="btn-icon-right" style="width:16px;"></i>';
        lucide.createIcons();
    }
}
