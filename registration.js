const API_BASE_URL = 'backend/api';

document.addEventListener('DOMContentLoaded', () => {
    // Initialize icons
    lucide.createIcons();

    const form = document.getElementById('registration-form');
    if (form) {
        form.addEventListener('submit', handleRegistration);
    }
});

async function handleRegistration(e) {
    e.preventDefault();

    const username = document.getElementById('reg-username').value;
    const fullName = document.getElementById('reg-fullname').value;
    const email = document.getElementById('reg-email').value;
    // const phone = document.getElementById('reg-phone').value; // Removed
    const password = document.getElementById('reg-password').value;
    const confirm = document.getElementById('reg-confirm-password').value;
    const msg = document.getElementById('reg-message');
    const submitBtn = document.querySelector('button[type="submit"]');

    // Validation
    if (password !== confirm) {
        msg.innerHTML = `<span style="color: #e11d48"><i data-lucide="alert-circle" style="vertical-align:middle;margin-right:5px;width:16px;"></i> Passwords do not match!</span>`;
        lucide.createIcons();
        return;
    }

    // Prepare data
    const userData = {
        username: username,
        full_name: fullName,
        password: password,
        email: email,
        // phone: phone, // Removed
        role: 'Staff', // Default role
        status: 'Active'
    };

    try {
        // Disable button
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="btn-text">Registering...</span> <i data-lucide="loader" class="spin checkbox" style="width:16px;"></i>';
        lucide.createIcons();
        msg.textContent = '';

        const response = await fetch(`${API_BASE_URL}/users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });

        const data = await response.json();

        if (response.ok) {
            msg.innerHTML = '<span style="color: #10b981"><i data-lucide="check-circle" style="vertical-align:middle;margin-right:5px;width:16px;"></i> Registration successful! Redirecting...</span>';
            lucide.createIcons();

            // Clear form
            document.getElementById('registration-form').reset();

            // Redirect after 2 seconds
            setTimeout(() => {
                window.location.href = 'index.php';
            }, 2000);
        } else {
            msg.innerHTML = `<span style="color: #e11d48"><i data-lucide="alert-circle" style="vertical-align:middle;margin-right:5px;width:16px;"></i> ${data.error || 'Registration failed. Please try again.'}</span>`;
            lucide.createIcons();

            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span class="btn-text">Create Account</span> <i data-lucide="arrow-right" class="btn-icon-right" style="width:16px;"></i>';
            lucide.createIcons();
        }
    } catch (error) {
        console.error('Error:', error);
        msg.innerHTML = '<span style="color: #e11d48">Network error. Is the server running?</span>';
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span class="btn-text">Create Account</span> <i data-lucide="arrow-right" class="btn-icon-right" style="width:16px;"></i>';
        lucide.createIcons();
    }
}
