/**
 * Aadhaar Validation for Booking Forms
 * This script checks if the user has a valid Aadhaar number before allowing bookings
 */

(function() {
    'use strict';

    const API_BASE = localStorage.getItem('API_BASE') || 'http://127.0.0.1:8000';
    let userAadhaar = null;
    let aadhaarCheckComplete = false;

    /**
     * Check if user has Aadhaar number in their profile
     */
    async function checkUserAadhaar() {
        const accessToken = localStorage.getItem('accessToken') || localStorage.getItem('access_token');
        
        if (!accessToken) {
            return false;
        }

        try {
            const response = await fetch(`${API_BASE}/api/auth/profile/`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                const user = data.user || data;
                userAadhaar = user.aadhaar;
                aadhaarCheckComplete = true;
                return !!userAadhaar;
            }
        } catch (error) {
            console.error('Error checking Aadhaar:', error);
        }
        
        aadhaarCheckComplete = true;
        return false;
    }

    /**
     * Show Aadhaar required modal
     */
    function showAadhaarRequiredModal() {
        // Remove existing modal if any
        const existingModal = document.getElementById('aadhaar-required-modal');
        if (existingModal) {
            existingModal.remove();
        }

        const modal = document.createElement('div');
        modal.id = 'aadhaar-required-modal';
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
        modal.innerHTML = `
            <div class="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
                <div class="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i class="fas fa-id-card text-4xl text-orange-500"></i>
                </div>
                <h2 class="text-2xl font-bold text-gray-900 mb-3 text-center">Aadhaar Card Required</h2>
                <p class="text-gray-600 mb-4 text-center">
                    To proceed with booking, you need to add your Aadhaar card number to your profile.
                </p>
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                    <p class="text-sm text-blue-800">
                        <i class="fas fa-info-circle mr-2"></i>
                        <strong>Why is Aadhaar required?</strong><br>
                        Aadhaar verification helps us ensure secure bookings and prevent fraud.
                    </p>
                </div>
                <div class="flex gap-3">
                    <button class="flex-1 bg-gray-200 text-gray-800 py-3 px-4 rounded-xl font-semibold hover:bg-gray-300 transition" onclick="document.getElementById('aadhaar-required-modal').remove()">
                        Cancel
                    </button>
                    <button class="flex-1 bg-orange-500 text-white py-3 px-4 rounded-xl font-semibold hover:bg-orange-600 transition" onclick="window.location.href='profile.html'">
                        <i class="fas fa-user-edit mr-2"></i>Update Profile
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    /**
     * Show Aadhaar info banner on booking pages
     */
    function showAadhaarInfoBanner() {
        const bookingForms = document.querySelectorAll('#booking-form, #pass-booking-form, #pooja-booking-form, #bhakta-nivas-form');
        
        bookingForms.forEach(form => {
            if (!form) return;
            
            const banner = document.createElement('div');
            banner.className = 'bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-r-lg';
            banner.innerHTML = `
                <div class="flex items-start">
                    <div class="flex-shrink-0">
                        <i class="fas fa-exclamation-triangle text-yellow-400 text-xl"></i>
                    </div>
                    <div class="ml-3 flex-1">
                        <p class="text-sm text-yellow-800 font-medium">
                            <strong>Aadhaar Verification Required</strong>
                        </p>
                        <p class="text-sm text-yellow-700 mt-1">
                            You need to add your Aadhaar card number to your profile before making a booking.
                            <a href="profile.html" class="underline font-semibold hover:text-yellow-900">Update your profile now</a>
                        </p>
                    </div>
                </div>
            `;
            
            form.parentElement.insertBefore(banner, form);
        });
    }

    /**
     * Disable booking forms if no Aadhaar
     */
    function disableBookingForms() {
        const bookingForms = document.querySelectorAll('#booking-form, #pass-booking-form, #pooja-booking-form, #bhakta-nivas-form');
        
        bookingForms.forEach(form => {
            if (!form) return;
            
            // Disable all input fields
            const inputs = form.querySelectorAll('input, select, textarea, button[type="submit"]');
            inputs.forEach(input => {
                input.disabled = true;
                input.style.opacity = '0.5';
                input.style.cursor = 'not-allowed';
            });
            
            // Add overlay
            const overlay = document.createElement('div');
            overlay.className = 'absolute inset-0 bg-gray-100 bg-opacity-50 cursor-not-allowed z-10';
            overlay.style.borderRadius = 'inherit';
            
            if (form.parentElement.style.position !== 'relative' && form.parentElement.style.position !== 'absolute') {
                form.parentElement.style.position = 'relative';
            }
            
            form.parentElement.appendChild(overlay);
        });
    }

    /**
     * Intercept form submissions
     */
    function interceptFormSubmissions() {
        const bookingForms = document.querySelectorAll('#booking-form, #pass-booking-form, #pooja-booking-form, #bhakta-nivas-form');
        
        bookingForms.forEach(form => {
            if (!form) return;
            
            form.addEventListener('submit', async (e) => {
                if (!aadhaarCheckComplete) {
                    e.preventDefault();
                    e.stopPropagation();
                    await checkUserAadhaar();
                }
                
                if (!userAadhaar) {
                    e.preventDefault();
                    e.stopPropagation();
                    showAadhaarRequiredModal();
                    return false;
                }
            }, true); // Use capture phase
        });
    }

    /**
     * Handle booking API errors related to Aadhaar
     */
    function setupErrorHandling() {
        // Override fetch to intercept booking errors
        const originalFetch = window.fetch;
        window.fetch = async function(...args) {
            const response = await originalFetch.apply(this, args);
            
            // Check if this is a booking endpoint
            const url = args[0];
            if (typeof url === 'string' && 
                (url.includes('/api/bookings/') || 
                 url.includes('/api/booking/') ||
                 url.includes('/passes/') ||
                 url.includes('/poojas/') ||
                 url.includes('/bhakta-nivas/'))) {
                
                if (!response.ok) {
                    const clonedResponse = response.clone();
                    try {
                        const data = await clonedResponse.json();
                        if (data.detail && data.detail.toLowerCase().includes('aadhaar')) {
                            showAadhaarRequiredModal();
                        }
                    } catch (e) {
                        // Ignore JSON parse errors
                    }
                }
            }
            
            return response;
        };
    }

    /**
     * Initialize Aadhaar validation
     */
    async function initializeAadhaarValidation() {
        // Check if we're on a booking page
        const isBookingPage = document.querySelector('#booking-form, #pass-booking-form, #pooja-booking-form, #bhakta-nivas-form');
        
        if (!isBookingPage) {
            return;
        }

        // Check user's Aadhaar status
        const hasAadhaar = await checkUserAadhaar();
        
        if (!hasAadhaar) {
            showAadhaarInfoBanner();
            disableBookingForms();
        }
        
        // Setup form interception
        interceptFormSubmissions();
        
        // Setup error handling
        setupErrorHandling();
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeAadhaarValidation);
    } else {
        initializeAadhaarValidation();
    }

    // Export for external use
    window.AadhaarValidation = {
        checkUserAadhaar,
        showAadhaarRequiredModal
    };
})();
