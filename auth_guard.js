(function() {
    // 1. Authentication Check
    // Check sessionStorage first (current tab), then localStorage (cross-tab fallback)
    const userJson = sessionStorage.getItem('user') || localStorage.getItem('user');
    // Sync to sessionStorage if restored from localStorage
    if (!sessionStorage.getItem('user') && userJson) {
        sessionStorage.setItem('user', userJson);
    }
    const publicPages = ['index.php', 'registration.html'];
    const isPublicPage = publicPages.some(page => window.location.pathname.includes(page));

    if (!userJson && !isPublicPage) {
        window.location.href = 'index.php';
        return;
    }

    if (!userJson) return;

    const user = JSON.parse(userJson);
    
    // 2. Role-Based UI Restriction
    if (user.role === 'Staff') {
        const applyStaffRestrictions = () => {
            const restrictedViews = ['products', 'expenses', 'users'];
            
            // Select all navigation items in the sidebar
            const navItems = document.querySelectorAll('.nav-item');
            
            navItems.forEach(item => {
                // Check by data-view attribute (used in index.php)
                const viewAttr = item.getAttribute('data-view');
                if (viewAttr && restrictedViews.includes(viewAttr.toLowerCase())) {
                    item.classList.add('staff-hidden');
                    return;
                }
                
                // Check by href/hash (used in other pages like alert.php)
                const href = item.getAttribute('href') || '';
                if (restrictedViews.some(rv => href.includes('#' + rv))) {
                    item.classList.add('staff-hidden');
                }

                // Check by span text as a fallback
                const spanText = item.querySelector('span')?.textContent?.toLowerCase();
                if (spanText && restrictedViews.includes(spanText)) {
                    item.classList.add('staff-hidden');
                }
            });

            // 3. Prevent direct access via hash navigation
            const hash = window.location.hash.replace('#', '').toLowerCase();
            if (restrictedViews.includes(hash)) {
                console.warn('Access restricted for staff role.');
                window.location.hash = '#dashboard';
                // If not in index.php, just redirect to index.php
                if (!window.location.pathname.includes('index.php')) {
                    window.location.href = 'index.php';
                }
            }
        };

        // Run immediately if DOM is ready, otherwise wait
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', applyStaffRestrictions);
        } else {
            applyStaffRestrictions();
        }
    }
})();
