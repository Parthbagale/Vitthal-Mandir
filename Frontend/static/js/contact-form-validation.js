// Enhanced Contact Form Validation
(function() {
  'use strict';
  
  document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('form[action*="contact"]');
    if (!form) {
      console.log('Contact form not found');
      return;
    }

    console.log('Contact form validation initialized');

    // Get form elements
    const firstName = document.getElementById('firstName');
    const lastName = document.getElementById('lastName');
    const email = document.getElementById('email');
    const phone = document.getElementById('phone');
    const subject = document.getElementById('subject');
    const message = document.getElementById('message');

    // Show error function
    function showError(element, errorMessage) {
      if (!element) return;
      
      // Remove existing error
      clearError(element);
      
      // Add error styling
      element.classList.add('border-red-500', 'border-2');
      element.classList.remove('border-gray-300');
      
      // Create and add error message
      if (errorMessage) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message text-red-600 text-sm mt-1 font-medium';
        errorDiv.textContent = errorMessage;
        element.parentElement.appendChild(errorDiv);
      }
    }

    // Clear error function
    function clearError(element) {
      if (!element) return;
      
      element.classList.remove('border-red-500', 'border-2');
      element.classList.add('border-gray-300');
      
      const existingError = element.parentElement.querySelector('.error-message');
      if (existingError) {
        existingError.remove();
      }
    }

    // Input restrictions and clear errors on input
    if (firstName) {
      firstName.addEventListener('keypress', function(e) {
        if (!/[A-Za-z\s]/.test(e.key)) e.preventDefault();
      });
      firstName.addEventListener('input', function() {
        clearError(this);
      });
    }

    if (lastName) {
      lastName.addEventListener('keypress', function(e) {
        if (!/[A-Za-z\s]/.test(e.key)) e.preventDefault();
      });
      lastName.addEventListener('input', function() {
        clearError(this);
      });
    }

    if (phone) {
      phone.addEventListener('keypress', function(e) {
        if (!/[0-9]/.test(e.key)) e.preventDefault();
      });
      phone.setAttribute('maxlength', '10');
      phone.setAttribute('inputmode', 'numeric');
      phone.addEventListener('input', function() {
        clearError(this);
      });
    }

    if (email) {
      email.addEventListener('input', function() {
        clearError(this);
      });
    }

    if (subject) {
      subject.addEventListener('change', function() {
        clearError(this);
      });
    }

    if (message) {
      message.addEventListener('input', function() {
        clearError(this);
      });
    }

    // Form submission
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      console.log('Form submit triggered');
      
      let isValid = true;
      let firstErrorElement = null;

      // Validate all fields
      if (!firstName || !firstName.value || firstName.value.trim().length === 0) {
        showError(firstName, 'First name is required');
        isValid = false;
        if (!firstErrorElement) firstErrorElement = firstName;
      } else if (firstName.value.trim().length < 2) {
        showError(firstName, 'First name must be at least 2 characters');
        isValid = false;
        if (!firstErrorElement) firstErrorElement = firstName;
      }

      if (!lastName || !lastName.value || lastName.value.trim().length === 0) {
        showError(lastName, 'Last name is required');
        isValid = false;
        if (!firstErrorElement) firstErrorElement = lastName;
      }

      if (!email || !email.value || email.value.trim().length === 0) {
        showError(email, 'Email is required');
        isValid = false;
        if (!firstErrorElement) firstErrorElement = email;
      } else {
        // Enhanced email validation
        const emailPattern = /^[a-zA-Z][a-zA-Z0-9._-]*@[a-zA-Z][a-zA-Z0-9.-]*\.[a-zA-Z]{2,}$/;
        if (!emailPattern.test(email.value)) {
          showError(email, 'Please enter a valid email address (e.g., user@example.com)');
          isValid = false;
          if (!firstErrorElement) firstErrorElement = email;
        } else if (/^[0-9]+@[0-9]+\.[a-zA-Z]+$/.test(email.value)) {
          showError(email, 'Email username and domain must contain letters, not only numbers');
          isValid = false;
          if (!firstErrorElement) firstErrorElement = email;
        }
      }

      if (phone && phone.value && phone.value.trim().length > 0) {
        if (phone.value.length !== 10) {
          showError(phone, 'Phone number must be exactly 10 digits');
          isValid = false;
          if (!firstErrorElement) firstErrorElement = phone;
        } else if (!/^[6-9]/.test(phone.value)) {
          showError(phone, 'Phone number must start with 6, 7, 8, or 9');
          isValid = false;
          if (!firstErrorElement) firstErrorElement = phone;
        }
      }

      if (!subject || !subject.value || subject.value === '') {
        showError(subject, 'Please select a subject');
        isValid = false;
        if (!firstErrorElement) firstErrorElement = subject;
      }

      if (!message || !message.value || message.value.trim().length === 0) {
        showError(message, 'Message is required');
        isValid = false;
        if (!firstErrorElement) firstErrorElement = message;
      } else if (message.value.trim().length < 10) {
        showError(message, 'Message must be at least 10 characters');
        isValid = false;
        if (!firstErrorElement) firstErrorElement = message;
      }

      if (!isValid) {
        if (firstErrorElement) {
          firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setTimeout(() => firstErrorElement.focus(), 300);
        }
        return false;
      }

      // Get submit button
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn ? submitBtn.innerHTML : '';
      
      // Disable button and show loading
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Sending...';
      }

      // Prepare form data
      const formData = new FormData(form);

      // Submit via AJAX
      fetch(form.action, {
        method: 'POST',
        body: formData
      })
      .then(response => response.json())
      .then(data => {
        if (data.ok) {
          // Show success message
          const successDiv = document.createElement('div');
          successDiv.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg z-50';
          successDiv.innerHTML = `
            <div class="flex items-center gap-3">
              <i class="fas fa-check-circle text-2xl"></i>
              <div>
                <div class="font-semibold">Message Sent Successfully!</div>
                <div class="text-sm">We'll get back to you soon.</div>
              </div>
            </div>
          `;
          document.body.appendChild(successDiv);
          
          // Reset form
          form.reset();
          
          // Remove success message after 5 seconds
          setTimeout(() => successDiv.remove(), 5000);
        } else {
          throw new Error(data.detail || 'Failed to send message');
        }
      })
      .catch(error => {
        console.error('Error:', error);
        const errorDiv = document.createElement('div');
        errorDiv.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-4 rounded-lg shadow-lg z-50';
        errorDiv.innerHTML = `
          <div class="flex items-center gap-3">
            <i class="fas fa-exclamation-circle text-2xl"></i>
            <div>
              <div class="font-semibold">Error Sending Message</div>
              <div class="text-sm">Please try again later.</div>
            </div>
          </div>
        `;
        document.body.appendChild(errorDiv);
        setTimeout(() => errorDiv.remove(), 5000);
      })
      .finally(() => {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnText;
        }
      });
    });
  });
})();
