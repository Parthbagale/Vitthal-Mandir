// Shared validation utility for Vitthal Mandir Token System

const Validator = {

  // Only A-Z, a-z, spaces allowed
  validateName(value) {
    return /^[A-Za-z\s]+$/.test(value.trim());
  },

  // Only digits, exactly 10
  validateMobile(value) {
    return /^[0-9]{10}$/.test(value.trim());
  },

  // Valid email: local part must have alpha chars, domain must have alpha chars
  // Rejects: 234567@gmail.com, 12367@123457.com
  validateEmail(value) {
    const v = value.trim();
    const basic = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    if (!basic) return false;
    const parts = v.split('@');
    const localPart = parts[0] || '';
    const domain = parts[1] || '';
    const domainLabel = domain.split('.')[0] || '';
    // local part must contain at least one letter
    if (!/[a-zA-Z]/.test(localPart)) return false;
    // domain label must contain at least one letter
    if (!/[a-zA-Z]/.test(domainLabel)) return false;
    return true;
  },

  // Show inline error under a field
  showError(fieldId, message) {
    const field = document.getElementById(fieldId);
    if (!field) return;
    let err = document.getElementById(fieldId + '_error');
    if (!err) {
      err = document.createElement('p');
      err.id = fieldId + '_error';
      err.className = 'text-red-500 text-xs mt-1';
      field.parentNode.appendChild(err);
    }
    err.textContent = message;
    field.classList.add('border-red-500');
  },

  // Clear inline error
  clearError(fieldId) {
    const field = document.getElementById(fieldId);
    if (field) field.classList.remove('border-red-500');
    const err = document.getElementById(fieldId + '_error');
    if (err) err.textContent = '';
  },

  // Validate a single field and show/clear error
  validateField(fieldId, type) {
    const field = document.getElementById(fieldId);
    if (!field) return true;
    const value = field.value;

    if (!value.trim()) {
      this.showError(fieldId, 'This field is required');
      return false;
    }

    if (type === 'name' && !this.validateName(value)) {
      this.showError(fieldId, 'Name must contain only alphabets');
      return false;
    }

    if (type === 'mobile' && !this.validateMobile(value)) {
      this.showError(fieldId, 'Mobile number must be exactly 10 digits');
      return false;
    }

    if (type === 'email' && !this.validateEmail(value)) {
      this.showError(fieldId, 'Enter a valid email address');
      return false;
    }

    this.clearError(fieldId);
    return true;
  },

  // Attach live validation listeners to a field
  attachLive(fieldId, type) {
    const field = document.getElementById(fieldId);
    if (!field) return;

    if (type === 'name') {
      field.addEventListener('keypress', (e) => {
        if (!/[A-Za-z\s]/.test(e.key)) e.preventDefault();
      });
    }

    if (type === 'mobile') {
      field.addEventListener('keypress', (e) => {
        if (!/[0-9]/.test(e.key)) e.preventDefault();
      });
    }

    field.addEventListener('blur', () => this.validateField(fieldId, type));
    field.addEventListener('input', () => {
      if (field.value.trim()) this.validateField(fieldId, type);
    });
  },

  // Generate unique filename for camera capture
  uniqueFilename(userId, ext = 'jpg') {
    return `${userId}_${Date.now()}.${ext}`;
  }
};

if (typeof window !== 'undefined') window.Validator = Validator;
