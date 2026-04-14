/* Admin Page Specific JavaScript */

document.addEventListener('DOMContentLoaded', () => {
    initializeAdminPage();
});

function initializeAdminPage() {
    // Check admin authentication
    if (!isAdminAuthenticated()) {
        window.location.href = 'Admin_login.html';
        return;
    }
    
    // Load dashboard stats
    loadDashboardStats();
    
    // Initialize data tables
    initializeDataTables();
    
    // Admin logout
    initializeAdminLogout();
}

async function loadDashboardStats() {
    const token = localStorage.getItem('accessToken');
    
    try {
        const response = await fetch('http://localhost:8000/api/admin/stats/', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const stats = await response.json();
            displayDashboardStats(stats);
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

function displayDashboardStats(stats) {
    // Update stat cards with data
    const statElements = {
        totalUsers: document.getElementById('total-users'),
        totalBookings: document.getElementById('total-bookings'),
        totalDonations: document.getElementById('total-donations'),
        activeServices: document.getElementById('active-services')
    };
    
    if (statElements.totalUsers) statElements.totalUsers.textContent = stats.total_users || 0;
    if (statElements.totalBookings) statElements.totalBookings.textContent = stats.total_bookings || 0;
    if (statElements.totalDonations) statElements.totalDonations.textContent = `₹${stats.total_donations || 0}`;
    if (statElements.activeServices) statElements.activeServices.textContent = stats.active_services || 0;
}

function initializeDataTables() {
    // Initialize any data tables or lists
    console.log('Data tables initialized');
}

function initializeAdminLogout() {
    const logoutBtn = document.getElementById('admin-logout-btn');
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.clear();
            window.location.href = 'Admin_login.html';
        });
    }
}
