/* Bhakta Nivas Page Specific JavaScript */

document.addEventListener('DOMContentLoaded', () => {
    initializeBhaktaNivas();
});

function initializeBhaktaNivas() {
    // Check authentication
    if (!isAuthenticated()) {
        window.location.href = 'index.html?showLogin=true';
        return;
    }
    
    // Initialize room selection
    initializeRoomSelection();
    
    // Date range picker
    initializeDateRangePicker();
    
    // Guest count
    initializeGuestCount();
    
    // Booking form
    initializeBhaktaNivasBookingForm();
    
    // Image gallery
    initializeImageGallery();
}

function initializeRoomSelection() {
    const roomCards = document.querySelectorAll('.room-card');
    
    roomCards.forEach(card => {
        card.addEventListener('click', () => {
            roomCards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            
            const roomType = card.dataset.roomType;
            const roomPrice = card.dataset.price;
            
            updateBookingDetails(roomType, roomPrice);
        });
    });
}

function updateBookingDetails(roomType, price) {
    const roomTypeInput = document.getElementById('room-type');
    const priceDisplay = document.getElementById('price-display');
    
    if (roomTypeInput) roomTypeInput.value = roomType;
    if (priceDisplay) priceDisplay.textContent = `₹${price}/night`;
}

function initializeDateRangePicker() {
    const checkInInput = document.getElementById('check-in-date');
    const checkOutInput = document.getElementById('check-out-date');
    
    if (checkInInput && checkOutInput) {
        const today = new Date().toISOString().split('T')[0];
        checkInInput.min = today;
        
        checkInInput.addEventListener('change', () => {
            const checkInDate = new Date(checkInInput.value);
            const minCheckOut = new Date(checkInDate);
            minCheckOut.setDate(minCheckOut.getDate() + 1);
            checkOutInput.min = minCheckOut.toISOString().split('T')[0];
            
            calculateTotalPrice();
        });
        
        checkOutInput.addEventListener('change', () => {
            calculateTotalPrice();
        });
    }
}

function calculateTotalPrice() {
    const checkInInput = document.getElementById('check-in-date');
    const checkOutInput = document.getElementById('check-out-date');
    const priceDisplay = document.getElementById('total-price-display');
    
    if (!checkInInput.value || !checkOutInput.value) return;
    
    const checkIn = new Date(checkInInput.value);
    const checkOut = new Date(checkOutInput.value);
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    
    const selectedRoom = document.querySelector('.room-card.selected');
    if (selectedRoom && nights > 0) {
        const pricePerNight = parseInt(selectedRoom.dataset.price);
        const totalPrice = pricePerNight * nights;
        
        if (priceDisplay) {
            priceDisplay.textContent = `Total: ₹${totalPrice} (${nights} night${nights > 1 ? 's' : ''})`;
        }
    }
}

function initializeGuestCount() {
    const decreaseBtn = document.getElementById('decrease-guests');
    const increaseBtn = document.getElementById('increase-guests');
    const guestCountInput = document.getElementById('guest-count');
    
    if (decreaseBtn && increaseBtn && guestCountInput) {
        decreaseBtn.addEventListener('click', () => {
            const current = parseInt(guestCountInput.value);
            if (current > 1) {
                guestCountInput.value = current - 1;
            }
        });
        
        increaseBtn.addEventListener('click', () => {
            const current = parseInt(guestCountInput.value);
            if (current < 6) {
                guestCountInput.value = current + 1;
            }
        });
    }
}

function initializeBhaktaNivasBookingForm() {
    const bookingForm = document.getElementById('bhakta-nivas-booking-form');
    
    if (bookingForm) {
        bookingForm.addEventListener('submit', handleBhaktaNivasBooking);
    }
}

async function handleBhaktaNivasBooking(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const submitButton = form.querySelector('button[type="submit"]');
    
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Booking...';
    
    try {
        const token = localStorage.getItem('accessToken');
        
        const response = await fetch('http://localhost:8000/api/bookings/bhakta-nivas/', {
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
        submitButton.innerHTML = '<i class="fas fa-bed mr-2"></i>Confirm Booking';
    }
}

function initializeImageGallery() {
    const galleryImages = document.querySelectorAll('.gallery-image');
    
    galleryImages.forEach(img => {
        img.addEventListener('click', () => {
            openImageModal(img.src, img.alt);
        });
    });
}

function openImageModal(src, alt) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center';
    modal.innerHTML = `
        <button class="absolute top-4 right-4 text-white text-3xl hover:text-gray-300">
            <i class="ph ph-x"></i>
        </button>
        <img src="${src}" alt="${alt}" class="max-w-[90%] max-h-[90%] object-contain">
    `;
    
    document.body.appendChild(modal);
    
    modal.querySelector('button').addEventListener('click', () => {
        modal.remove();
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
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
            <p class="text-gray-600 mb-4">Your accommodation has been booked successfully.</p>
            <p class="text-sm text-gray-500 mb-2">Booking ID: ${data.booking_id || 'N/A'}</p>
            <p class="text-sm text-gray-500 mb-6">Check-in: ${data.check_in || 'N/A'}</p>
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
