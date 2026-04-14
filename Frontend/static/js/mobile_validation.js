/**
 * Mobile Number Validation for Indian Phone Numbers
 * Validates 10-digit numbers starting with 6, 7, 8, or 9
 */

document.addEventListener('DOMContentLoaded', function() {
    // Find all mobile input fields
    const mobileInputs = document.querySelectorAll('input[id="mobile"], input[name="mobile"]');
    
    mobileInputs.forEach(input => {
        // Prevent non-numeric key presses
        input.addEventListener('keypress', function(e) {
            // Allow only numbers (0-9)
            if (e.charCode < 48 || e.charCode > 57) {
                e.preventDefault();
                return false;
            }
        });
        
        // Prevent paste of non-numeric content
        input.addEventListener('paste', function(e) {
            e.preventDefault();
            const pastedText = (e.clipboardData || window.clipboardData).getData('text');
            const numericOnly = pastedText.replace(/\D/g, '');
            
            // Limit to 10 digits
            const limitedText = numericOnly.slice(0, 10);
            
            // Set the value
            e.target.value = limitedText;
            
            // Trigger input event for validation
            e.target.dispatchEvent(new Event('input', { bubbles: true }));
        });
        
        // Add input event listener for real-time validation
        input.addEventListener('input', function(e) {
            // Remove non-digit characters
            let value = e.target.value.replace(/\D/g, '');
            
            // Limit to 10 digits
            if (value.length > 10) {
                value = value.slice(0, 10);
            }
            
            e.target.value = value;
            
            // Visual feedback
            if (value.length === 0) {
                e.target.classList.remove('border-red-500', 'border-green-500');
            } else if (value.length === 10 && /^[6-9]/.test(value)) {
                e.target.classList.remove('border-red-500');
                e.target.classList.add('border-green-500');
            } else {
                e.target.classList.remove('border-green-500');
                e.target.classList.add('border-red-500');
            }
        });
        
        // Add blur event for final validation
        input.addEventListener('blur', function(e) {
            const value = e.target.value;
            
            if (value && !validateMobileNumber(value)) {
                showValidationMessage(e.target, 'Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9');
            } else {
                clearValidationMessage(e.target);
            }
        });
        
        // Prevent form submission if invalid
        const form = input.closest('form');
        if (form) {
            form.addEventListener('submit', function(e) {
                const mobileValue = input.value;
                
                if (!validateMobileNumber(mobileValue)) {
                    e.preventDefault();
                    input.focus();
                    showValidationMessage(input, 'Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9');
                    return false;
                }
            });
        }
    });
});

/**
 * Validate mobile number format
 * @param {string} mobile - The mobile number to validate
 * @returns {boolean} - True if valid, false otherwise
 */
function validateMobileNumber(mobile) {
    // Check if mobile is exactly 10 digits and starts with 6, 7, 8, or 9
    const mobileRegex = /^[6-9][0-9]{9}$/;
    return mobileRegex.test(mobile);
}

/**
 * Show validation message below input
 * @param {HTMLElement} input - The input element
 * @param {string} message - The validation message
 */
function showValidationMessage(input, message) {
    clearValidationMessage(input);
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'mobile-validation-error text-red-600 text-xs mt-1';
    errorDiv.textContent = message;
    errorDiv.setAttribute('role', 'alert');
    
    input.parentNode.appendChild(errorDiv);
}

/**
 * Clear validation message
 * @param {HTMLElement} input - The input element
 */
function clearValidationMessage(input) {
    const existingError = input.parentNode.querySelector('.mobile-validation-error');
    if (existingError) {
        existingError.remove();
    }
}

/**
 * Format mobile number for display (optional)
 * @param {string} mobile - The mobile number
 * @returns {string} - Formatted mobile number
 */
function formatMobileNumber(mobile) {
    if (mobile.length === 10) {
        return mobile.replace(/(\d{5})(\d{5})/, '$1 $2');
    }
    return mobile;
}
