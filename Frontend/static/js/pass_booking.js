/* Pass Booking Page Specific JavaScript */

document.addEventListener('DOMContentLoaded', () => {
    initializePassBooking();
});

function initializePassBooking() {
    // Check authentication
    if (!isAuthenticated()) {
        window.location.href = 'index.html?showLogin=true';
        return;
    }
    
    // Initialize pass type selection
    initializePassTypeSelection();
    
    // Date and time picker
    initializeDateTimePicker();
    
    // Visitor count
    initializeVisitorCount();
    
    // Booking form
    initializePassBookingForm();
}

function initializePassTypeSelection() {
    const passCards = document.querySelectorAll('.pass-type-card');
    
    passCards.forEach(card => {
        card.addEventListener('click', () => {
            passCards.forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            
            const passType = card.dataset.passType;
            updatePassDetails(passType);
        });
    });
}

function updatePassDetails(passType) {
    const passTypeInput = document.getElementById('pass-type');
    if (passTypeInput) passTypeInput.value = passType;
}

function initializeDateTimePicker() {
    const dateInput = document.getElementById('visit-date');
    const timeSlotSelect = document.getElementById('time-slot');
    
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.min = today;
        
        const maxDate = new Date();
        maxDate.setMonth(maxDate.getMonth() + 2);
        dateInput.max = maxDate.toISOString().split('T')[0];
        
        dateInput.addEventListener('change', () => {
            loadAvailableTimeSlots(dateInput.value);
        });
    }
}

async function loadAvailableTimeSlots(date) {
    const timeSlotSelect = document.getElementById('time-slot');
    if (!timeSlotSelect) return;
    
    try {
        const token = localStorage.getItem('accessToken');
        const response = await fetch(`http://localhost:8000/api/bookings/available-slots/?date=${date}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const slots = await response.json();
            populateTimeSlots(slots);
        }
    } catch (error) {
        console.error('Error loading time slots:', error);
    }
}

function populateTimeSlots(slots) {
    const timeSlotSelect = document.getElementById('time-slot');
    if (!timeSlotSelect) return;
    
    timeSlotSelect.innerHTML = '<option value="">Select time slot</option>';
    
    slots.forEach(slot => {
        const option = document.createElement('option');
        option.value = slot.time;
        option.textContent = `${slot.time} (${slot.available} slots available)`;
        option.disabled = slot.available === 0;
        timeSlotSelect.appendChild(option);
    });
}

function initializeVisitorCount() {
    const decreaseBtn = document.getElementById('decrease-visitors');
    const increaseBtn = document.getElementById('increase-visitors');
    const visitorCountInput = document.getElementById('visitor-count');
    
    if (decreaseBtn && increaseBtn && visitorCountInput) {
        decreaseBtn.addEventListener('click', () => {
            const current = parseInt(visitorCountInput.value);
            if (current > 1) {
                visitorCountInput.value = current - 1;
            }
        });
        
        increaseBtn.addEventListener('click', () => {
            const current = parseInt(visitorCountInput.value);
            if (current < 10) {
                visitorCountInput.value = current + 1;
            }
        });
    }
}

function initializePassBookingForm() {
    const bookingForm = document.getElementById('pass-booking-form');
    
    if (bookingForm) {
        bookingForm.addEventListener('submit', handlePassBooking);
    }
}

async function handlePassBooking(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const submitButton = form.querySelector('button[type="submit"]');
    
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Booking...';
    
    try {
        const token = localStorage.getItem('accessToken');
        
        const response = await fetch('http://localhost:8000/api/bookings/pass/', {
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
        submitButton.innerHTML = '<i class="fas fa-ticket-alt mr-2"></i>Book Pass';
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
            <h2 class="text-2xl font-bold text-gray-900 mb-2">Pass Booked!</h2>
            <p class="text-gray-600 mb-4">Your entry pass has been booked successfully.</p>
            <p class="text-sm text-gray-500 mb-2">Pass ID: ${data.pass_id || 'N/A'}</p>
            <p class="text-sm text-gray-500 mb-6">Date: ${data.date || 'N/A'}</p>
            <div class="flex gap-3">
                <button class="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-full font-semibold hover:bg-gray-300 transition close-modal">
                    Close
                </button>
                <button class="flex-1 bg-primary text-white py-2 px-4 rounded-full font-semibold hover:bg-primary-dark transition download-pass">
                    Download Pass
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.querySelector('.close-modal').addEventListener('click', () => {
        modal.remove();
    });
    
    modal.querySelector('.download-pass').addEventListener('click', () => {
        window.open(data.pass_url, '_blank');
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



// SMS OTP Verification for Pass Booking
(function() {
    let mobileVerified = false;
    let verifiedMobile = '';

    const mobileInput = document.getElementById('mobile');
    const sendOtpBtn = document.getElementById('send-sms-otp-btn');
    const otpSection = document.getElementById('sms-otp-section');
    const otpInput = document.getElementById('sms-otp');
    const verifyOtpBtn = document.getElementById('verify-sms-otp-btn');
    const otpStatus = document.getElementById('sms-otp-status');

    if (!mobileInput || !sendOtpBtn) return;

    // Reset verification if mobile changes
    mobileInput.addEventListener('input', () => {
        if (mobileVerified && mobileInput.value.trim() !== verifiedMobile) {
            mobileVerified = false;
            verifiedMobile = '';
            if (otpSection) otpSection.classList.add('hidden');
            sendOtpBtn.textContent = 'Send OTP';
            sendOtpBtn.disabled = false;
            mobileInput.disabled = false;
        }
    });

    // Send OTP
    sendOtpBtn.addEventListener('click', async () => {
        const mobile = mobileInput.value.trim();

        if (!mobile) {
            showMessage('Please enter your mobile number', 'error');
            return;
        }

        if (!/^[6-9][0-9]{9}$/.test(mobile)) {
            showMessage('Please enter a valid 10-digit mobile number', 'error');
            return;
        }

        sendOtpBtn.disabled = true;
        sendOtpBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

        try {
            const response = await fetch('http://127.0.0.1:8000/api/booking/send-sms-otp/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mobile })
            });

            const data = await response.json();

            if (response.ok) {
                if (otpSection) otpSection.classList.remove('hidden');
                if (otpStatus) {
                    otpStatus.textContent = '📱 OTP sent to your mobile. Check your SMS!';
                    otpStatus.className = 'text-xs mt-1 text-green-600';
                }
                sendOtpBtn.textContent = 'Resend OTP';
                sendOtpBtn.disabled = false;
                mobileInput.disabled = true;
                showMessage('OTP sent successfully to your mobile', 'success');
            } else {
                showMessage(data.detail || 'Failed to send OTP', 'error');
                sendOtpBtn.textContent = 'Send OTP';
                sendOtpBtn.disabled = false;
            }
        } catch (error) {
            showMessage('Network error. Please try again.', 'error');
            sendOtpBtn.textContent = 'Send OTP';
            sendOtpBtn.disabled = false;
        }
    });

    // Verify OTP
    if (verifyOtpBtn && otpInput) {
        verifyOtpBtn.addEventListener('click', async () => {
            const mobile = mobileInput.value.trim();
            const otp = otpInput.value.trim();

            if (!otp) {
                showMessage('Please enter the OTP', 'error');
                return;
            }

            if (otp.length !== 6) {
                showMessage('OTP must be 6 digits', 'error');
                return;
            }

            verifyOtpBtn.disabled = true;
            verifyOtpBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';

            try {
                const response = await fetch('http://127.0.0.1:8000/api/booking/verify-sms-otp/', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ mobile, otp })
                });

                const data = await response.json();

                if (response.ok && data.verified) {
                    mobileVerified = true;
                    verifiedMobile = mobile;
                    if (otpStatus) {
                        otpStatus.textContent = '✓ Mobile number verified successfully!';
                        otpStatus.className = 'text-xs mt-1 text-green-600 font-semibold';
                    }
                    verifyOtpBtn.innerHTML = '<i class="fas fa-check"></i> Verified';
                    verifyOtpBtn.disabled = true;
                    verifyOtpBtn.classList.remove('bg-green-500', 'hover:bg-green-600');
                    verifyOtpBtn.classList.add('bg-gray-400', 'cursor-not-allowed');
                    otpInput.disabled = true;
                    showMessage('Mobile number verified successfully!', 'success');
                } else {
                    showMessage(data.detail || 'Invalid OTP', 'error');
                    verifyOtpBtn.textContent = 'Verify';
                    verifyOtpBtn.disabled = false;
                }
            } catch (error) {
                showMessage('Network error. Please try again.', 'error');
                verifyOtpBtn.textContent = 'Verify';
                verifyOtpBtn.disabled = false;
            }
        });
    }

    // Intercept form submission to check mobile verification
    const bookingForm = document.getElementById('booking-form');
    if (bookingForm) {
        const originalSubmitHandler = bookingForm.onsubmit;
        
        bookingForm.addEventListener('submit', (e) => {
            if (!mobileVerified) {
                e.preventDefault();
                e.stopPropagation();
                showMessage('Please verify your mobile number with OTP before booking', 'error');
                return false;
            }
        }, true); // Use capture phase to run before other handlers
    }
})();
