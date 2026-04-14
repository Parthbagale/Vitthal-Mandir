/**
 * Aadhaar Field Validation for Booking Forms
 * Validates Aadhaar input in real-time
 */

(function() {
    'use strict';

    /**
     * Validate Aadhaar number format
     */
    function validateAadhaarFormat(aadhaar) {
        if (!aadhaar) {
            return { valid: false, message: 'Aadhaar number is required' };
        }
        
        aadhaar = aadhaar.trim();
        
        if (!/^\d+$/.test(aadhaar)) {
            return { valid: false, message: 'Aadhaar must contain only digits' };
        }
        
        if (aadhaar.length !== 12) {
            return { valid: false, message: 'Aadhaar must be exactly 12 digits' };
        }
        
        return { valid: true, message: '' };
    }

    /**
     * Setup real-time validation for Aadhaar field
     */
    function setupAadhaarValidation() {
        const aadhaarInputs = document.querySelectorAll('#aadhaar, input[name="aadhaar"]');
        
        aadhaarInputs.forEach(input => {
            if (!input) return;
            
            const errorElement = document.getElementById('aadhaar_error');
            
            // Validate on input
            input.addEventListener('input', function() {
                const value = this.value.trim();
                const result = validateAadhaarFormat(value);
                
                if (errorElement) {
                    if (!result.valid && value.length > 0) {
                        errorElement.textContent = result.message;
                        errorElement.classList.remove('hidden');
                        input.classList.add('border-red-500');
                        input.classList.remove('border-green-500');
                    } else if (result.valid) {
                        errorElement.textContent = '';
                        errorElement.classList.add('hidden');
                        input.classList.remove('border-red-500');
                        input.classList.add('border-green-500');
                    } else {
                        errorElement.textContent = '';
                        errorElement.classList.add('hidden');
                        input.classList.remove('border-red-500', 'border-green-500');
                    }
                }
            });
            
            // Validate on blur
            input.addEventListener('blur', function() {
                const value = this.value.trim();
                const result = validateAadhaarFormat(value);
                
                if (errorElement && !result.valid) {
                    errorElement.textContent = result.message;
                    errorElement.classList.remove('hidden');
                    input.classList.add('border-red-500');
                }
            });
        });
    }

    /**
     * Validate Aadhaar before form submission
     */
    function validateAadhaarOnSubmit(form) {
        const aadhaarInput = form.querySelector('#aadhaar, input[name="aadhaar"]');
        
        if (!aadhaarInput) {
            console.warn('Aadhaar field not found in form');
            return true; // Allow submission if field doesn't exist
        }
        
        const value = aadhaarInput.value.trim();
        const result = validateAadhaarFormat(value);
        
        if (!result.valid) {
            const errorElement = document.getElementById('aadhaar_error');
            if (errorElement) {
                errorElement.textContent = result.message;
                errorElement.classList.remove('hidden');
            }
            
            aadhaarInput.classList.add('border-red-500');
            aadhaarInput.focus();
            
            // Show alert
            showMessage(result.message, 'error');
            
            return false;
        }
        
        return true;
    }

    /**
     * Intercept form submissions to validate Aadhaar
     */
    function interceptFormSubmissions() {
        const forms = document.querySelectorAll('#booking-form, #pass-booking-form, #pooja-booking-form, #bhakta-nivas-form, form');
        
        forms.forEach(form => {
            // Check if form has Aadhaar field
            const hasAadhaarField = form.querySelector('#aadhaar, input[name="aadhaar"]');
            if (!hasAadhaarField) return;
            
            form.addEventListener('submit', function(e) {
                const isValid = validateAadhaarOnSubmit(form);
                
                if (!isValid) {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                }
            }, true); // Use capture phase
        });
    }

    /**
     * Show message helper
     */
    function showMessage(text, type = 'info') {
        // Check if showMessage function exists globally
        if (typeof window.showMessage === 'function') {
            window.showMessage(text, type);
            return;
        }
        
        // Fallback: create simple message
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

    /**
     * Initialize Aadhaar field validation
     */
    function initializeAadhaarFieldValidation() {
        setupAadhaarValidation();
        interceptFormSubmissions();
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeAadhaarFieldValidation);
    } else {
        initializeAadhaarFieldValidation();
    }

    // Export for external use
    window.AadhaarFieldValidation = {
        validateAadhaarFormat,
        validateAadhaarOnSubmit
    };
})();
