/* Donations Page Specific JavaScript */

document.addEventListener('DOMContentLoaded', () => {
    initializeDonationsPage();
});

function initializeDonationsPage() {
    // Donation amount selection
    initializeDonationAmounts();
    
    // Payment method selection
    initializePaymentMethods();
    
    // Donation form submission
    initializeDonationForm();
}

function initializeDonationAmounts() {
    const amountButtons = document.querySelectorAll('.donation-amount-btn');
    const customAmountInput = document.getElementById('custom-amount');
    
    amountButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            amountButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const amount = btn.dataset.amount;
            if (customAmountInput) {
                customAmountInput.value = amount;
            }
        });
    });
    
    if (customAmountInput) {
        customAmountInput.addEventListener('input', () => {
            amountButtons.forEach(b => b.classList.remove('active'));
        });
    }
}

function initializePaymentMethods() {
    const paymentMethods = document.querySelectorAll('.payment-method');
    
    paymentMethods.forEach(method => {
        method.addEventListener('click', () => {
            paymentMethods.forEach(m => m.classList.remove('selected'));
            method.classList.add('selected');
            
            const methodType = method.dataset.method;
            showPaymentDetails(methodType);
        });
    });
}

function showPaymentDetails(methodType) {
    // Hide all payment detail sections
    document.querySelectorAll('.payment-details').forEach(section => {
        section.classList.add('hidden');
    });
    
    // Show selected payment method details
    const detailSection = document.getElementById(`${methodType}-details`);
    if (detailSection) {
        detailSection.classList.remove('hidden');
    }
}

function initializeDonationForm() {
    const donationForm = document.getElementById('donation-form');
    
    if (donationForm) {
        donationForm.addEventListener('submit', handleDonationSubmit);
    }
}

async function handleDonationSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const submitButton = form.querySelector('button[type="submit"]');
    
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Processing...';
    
    try {
        const response = await fetch(form.action, {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showDonationSuccess(data);
            form.reset();
        } else {
            showMessage('Sorry, there was an error processing your donation. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Donation error:', error);
        showMessage('Network error. Please check your connection and try again.', 'error');
    } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = '<i class="fas fa-heart mr-2"></i>Complete Donation';
    }
}

function showDonationSuccess(data) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-white rounded-2xl p-8 max-w-md text-center">
            <div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i class="fas fa-check text-4xl text-green-500"></i>
            </div>
            <h2 class="text-2xl font-bold text-gray-900 mb-2">Thank You!</h2>
            <p class="text-gray-600 mb-4">Your donation has been received successfully.</p>
            <p class="text-sm text-gray-500 mb-6">Transaction ID: ${data.transaction_id || 'N/A'}</p>
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
    }, 5000);
}
