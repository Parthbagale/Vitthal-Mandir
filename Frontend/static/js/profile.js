/* Profile Page Specific JavaScript */

document.addEventListener('DOMContentLoaded', () => {
    initializeProfilePage();
});

function initializeProfilePage() {
    // Check authentication
    if (!isAuthenticated()) {
        window.location.href = 'index.html?showLogin=true';
        return;
    }
    
    // Load user profile data
    loadUserProfile();
    
    // Initialize profile edit functionality
    initializeProfileEdit();
    
    // Initialize booking history
    loadBookingHistory();
}

async function loadUserProfile() {
    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem('accessToken');
    
    if (!userId || !token) {
        console.error('Missing user credentials');
        return;
    }
    
    try {
        const response = await fetch(`http://localhost:8000/api/auth/profile/${userId}/`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            displayUserProfile(data);
        } else {
            console.error('Failed to load profile');
        }
    } catch (error) {
        console.error('Profile load error:', error);
    }
}

function displayUserProfile(userData) {
    // Update profile display elements
    const nameElement = document.getElementById('profile-name');
    const emailElement = document.getElementById('profile-email');
    const avatarElement = document.getElementById('profile-avatar');
    
    if (nameElement) nameElement.textContent = userData.full_name || userData.username;
    if (emailElement) emailElement.textContent = userData.email;
    if (avatarElement && userData.profile_image) {
        avatarElement.src = userData.profile_image;
    }
}

function initializeProfileEdit() {
    const editButton = document.getElementById('edit-profile-btn');
    const saveButton = document.getElementById('save-profile-btn');
    const cancelButton = document.getElementById('cancel-edit-btn');
    
    if (editButton) {
        editButton.addEventListener('click', enableProfileEdit);
    }
    
    if (saveButton) {
        saveButton.addEventListener('click', saveProfileChanges);
    }
    
    if (cancelButton) {
        cancelButton.addEventListener('click', cancelProfileEdit);
    }
}

function enableProfileEdit() {
    const editableFields = document.querySelectorAll('.profile-field[data-editable="true"]');
    editableFields.forEach(field => {
        field.removeAttribute('readonly');
        field.removeAttribute('disabled');
        field.classList.add('editable');
    });
    
    document.getElementById('edit-profile-btn')?.classList.add('hidden');
    document.getElementById('save-profile-btn')?.classList.remove('hidden');
    document.getElementById('cancel-edit-btn')?.classList.remove('hidden');
}

function cancelProfileEdit() {
    location.reload();
}

async function saveProfileChanges() {
    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem('accessToken');
    
    const formData = new FormData();
    formData.append('full_name', document.getElementById('profile-name-input')?.value || '');
    formData.append('email', document.getElementById('profile-email-input')?.value || '');
    
    try {
        const response = await fetch(`http://localhost:8000/api/auth/profile/${userId}/`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        if (response.ok) {
            showMessage('Profile updated successfully!', 'success');
            setTimeout(() => location.reload(), 1500);
        } else {
            showMessage('Failed to update profile', 'error');
        }
    } catch (error) {
        console.error('Profile update error:', error);
        showMessage('Network error. Please try again.', 'error');
    }
}

async function loadBookingHistory() {
    const userId = localStorage.getItem('userId');
    const token = localStorage.getItem('accessToken');
    
    try {
        const response = await fetch(`http://localhost:8000/api/bookings/history/${userId}/`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const bookings = await response.json();
            displayBookingHistory(bookings);
        }
    } catch (error) {
        console.error('Booking history error:', error);
    }
}

function displayBookingHistory(bookings) {
    const container = document.getElementById('booking-history-container');
    if (!container) return;
    
    if (bookings.length === 0) {
        container.innerHTML = '<p class="text-gray-500 text-center py-8">No bookings found</p>';
        return;
    }
    
    container.innerHTML = bookings.map(booking => `
        <div class="booking-history-item bg-white p-4 rounded-lg mb-4">
            <div class="flex justify-between items-start">
                <div>
                    <h4 class="font-semibold text-gray-900">${booking.service_type}</h4>
                    <p class="text-sm text-gray-600">${booking.date}</p>
                </div>
                <span class="px-3 py-1 rounded-full text-sm ${getStatusClass(booking.status)}">
                    ${booking.status}
                </span>
            </div>
        </div>
    `).join('');
}

function getStatusClass(status) {
    const classes = {
        'confirmed': 'bg-green-100 text-green-800',
        'pending': 'bg-yellow-100 text-yellow-800',
        'cancelled': 'bg-red-100 text-red-800'
    };
    return classes[status.toLowerCase()] || 'bg-gray-100 text-gray-800';
}

function showMessage(text, type = 'info') {
    const colors = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        info: 'bg-blue-500'
    };
    
    const message = document.createElement('div');
    message.className = `fixed top-4 right-4 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg z-50`;
    message.textContent = text;
    document.body.appendChild(message);
    
    setTimeout(() => {
        message.remove();
    }, 3000);
}
