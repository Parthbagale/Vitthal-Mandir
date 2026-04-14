/**
 * Custom Date Picker with dd-mm-yyyy format and calendar view
 * Converts between dd-mm-yyyy display format and yyyy-mm-dd internal format
 */

document.addEventListener('DOMContentLoaded', function() {
    initializeDatePickers();
});

function initializeDatePickers() {
    // Find all date inputs that need custom formatting
    const dateInputs = document.querySelectorAll('input[type="date"]');
    
    dateInputs.forEach(input => {
        setupDatePicker(input);
    });
}

function setupDatePicker(input) {
    // Set minimum date to today
    const today = new Date();
    const minDate = formatDateForInput(today);
    input.setAttribute('min', minDate);
    
    // Add placeholder
    input.setAttribute('placeholder', 'dd-mm-yyyy');
    
    // Set pattern for validation
    input.setAttribute('pattern', '\\d{2}-\\d{2}-\\d{4}');
    
    // Add custom styling class
    input.classList.add('custom-date-picker');
    
    // Handle date change to format display
    input.addEventListener('change', function(e) {
        if (this.value) {
            // Store the yyyy-mm-dd value
            const isoDate = this.value;
            // Display as dd-mm-yyyy
            this.setAttribute('data-date', formatDateForDisplay(isoDate));
        }
    });
    
    // Handle focus to show calendar
    input.addEventListener('focus', function(e) {
        // Browser's native date picker will show
        this.showPicker && this.showPicker();
    });
}

/**
 * Format date from yyyy-mm-dd to dd-mm-yyyy for display
 */
function formatDateForDisplay(isoDate) {
    if (!isoDate) return '';
    const [year, month, day] = isoDate.split('-');
    return `${day}-${month}-${year}`;
}

/**
 * Format date from dd-mm-yyyy to yyyy-mm-dd for input
 */
function formatDateForInput(date) {
    if (date instanceof Date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    return date;
}

/**
 * Parse dd-mm-yyyy string to Date object
 */
function parseDateString(dateStr) {
    if (!dateStr) return null;
    const [day, month, year] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
}

/**
 * Format date for display in tokens/receipts (e.g., "22 February 2026")
 */
function formatDateLong(isoDate) {
    if (!isoDate) return '';
    const [year, month, day] = isoDate.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    
    const options = { day: '2-digit', month: 'long', year: 'numeric' };
    return date.toLocaleDateString('en-GB', options);
}

/**
 * Get date range (for check-in/check-out validation)
 */
function getDateDifference(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

/**
 * Validate date range (check-out must be after check-in)
 */
function validateDateRange(checkinInput, checkoutInput) {
    const checkinDate = checkinInput.value;
    const checkoutDate = checkoutInput.value;
    
    if (checkinDate && checkoutDate) {
        const checkin = new Date(checkinDate);
        const checkout = new Date(checkoutDate);
        
        if (checkout <= checkin) {
            checkoutInput.setCustomValidity('Check-out date must be after check-in date');
            return false;
        } else {
            checkoutInput.setCustomValidity('');
            return true;
        }
    }
    return true;
}

// Make functions globally available
window.formatDateForDisplay = formatDateForDisplay;
window.formatDateForInput = formatDateForInput;
window.formatDateLong = formatDateLong;
window.parseDateString = parseDateString;
window.getDateDifference = getDateDifference;
window.validateDateRange = validateDateRange;

console.log('Date picker initialized');
