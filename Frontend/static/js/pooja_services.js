/* Pooja Services Page Specific JavaScript */

document.addEventListener('DOMContentLoaded', () => {
    initializePoojaServices();
});

function initializePoojaServices() {
    // Check authentication
    if (!isAuthenticated()) {
        window.location.href = 'index.html?showLogin=true';
        return;
    }
    
    // Initialize pooja selection
    initializePoojaSelection();
    
    // Date picker
    initializeDatePicker();
    
    // Booking form
    initializeBookingForm();
}

function initializePoojaSelection() {
    const poojaCards = document.querySelectorAll('.pooja-card');
    
    poojaCards.forEach(card => {
        card.addEventListener('click', () => {
            poojaCards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            
            const poojaType = card.dataset.pooja;
            const poojaPrice = card.dataset.price;
            
            updateBookingForm(poojaType, poojaPrice);
        });
    });
}

function updateBookingForm(poojaType, price) {
    const poojaTypeInput = document.getElementById('pooja-type');
    const priceDisplay = document.getElementById('price-display');
    
    if (poojaTypeInput) poojaTypeInput.value = poojaType;
    if (priceDisplay) priceDisplay.textContent = `₹${price}`;
}

function initializeDatePicker() {
    const dateInput = document.getElementById('pooja-date');
    
    if (dateInput) {
        // Set minimum date to today
        const today = new Date().toISOString().split('T')[0];
        dateInput.min = today;
        
        // Set maximum date to 3 months from now
        const maxDate = new Date();
        maxDate.setMonth(maxDate.getMonth() + 3);
        dateInput.max = maxDate.toISOString().split('T')[0];
    }
}

function initializeBookingForm() {
    const bookingForm = document.getElementById('pooja-booking-form');
    
    if (bookingForm) {
        bookingForm.addEventListener('submit', handlePoojaBooking);
    }
}

async function handlePoojaBooking(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const submitButton = form.querySelector('button[type="submit"]');
    
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Booking...';
    
    try {
        const token = localStorage.getItem('accessToken');
        
        const response = await fetch('http://localhost:8000/api/bookings/pooja/', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showBookingSuccess(data);
            form.reset();
        } else {
            showMessage('Booking failed. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Booking error:', error);
        showMessage('Network error. Please try again.', 'error');
    } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = '<i class="fas fa-check mr-2"></i>Confirm Booking';
    }
}

function showBookingSuccess(data) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-white rounded-2xl p-8 max-w-md text-center">
            <div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i class="fas fa-check text-4xl text-green-500"></i>
            </div>
            <h2 class="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
            <p class="text-gray-600 mb-4">Your pooja has been booked successfully.</p>
            <p class="text-sm text-gray-500 mb-2">Booking ID: ${data.booking_id || 'N/A'}</p>
            <p class="text-sm text-gray-500 mb-6">Date: ${data.date || 'N/A'}</p>
            <button class="bg-primary text-white py-2 px-6 rounded-full font-semibold hover:bg-primary-dark transition">
                Close
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.querySelector('button').addEventListener('click', () => {
        modal.remove();
    });
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
