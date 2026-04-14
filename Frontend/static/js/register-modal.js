(function () {
  'use strict';

  // Wait for DOM to be ready
  function initRegisterModal() {
    const modal = document.getElementById('register-modal-overlay');
    const closeBtn = document.getElementById('close-register-modal');
    const form = document.getElementById('register-modal-form');

    if (!modal || !form) {
      console.warn('Register modal elements not found');
      return;
    }

    console.log('Register modal initialized');

    // Email verification state
    let emailVerified = false;
    let emailOtpSent = false;

    // Send Email OTP
    const sendEmailOtpBtn = document.getElementById('modal-send-email-otp');
    const emailOtpSection = document.getElementById('modal-email-otp-section');
    const verifyEmailOtpBtn = document.getElementById('modal-verify-email-otp');
    const emailVerifiedMsg = document.getElementById('modal-email-verified');

    if (sendEmailOtpBtn) {
      sendEmailOtpBtn.addEventListener('click', async function() {
        const email = document.getElementById('modal-reg-email').value.trim();
        
        if (!email) {
          setError('email', 'Please enter your email first');
          return;
        }

        if (!validateEmail(email)) {
          setError('email', 'Please enter a valid email address');
          return;
        }

        sendEmailOtpBtn.disabled = true;
        sendEmailOtpBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

        try {
          const response = await fetch('http://127.0.0.1:8000/api/auth/send-otp/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
          });

          const data = await response.json();

          if (response.ok) {
            emailOtpSent = true;
            emailOtpSection.classList.remove('hidden');
            sendEmailOtpBtn.textContent = 'Resend OTP';
            sendEmailOtpBtn.disabled = false;
            clearError('email');
            
            // Show success message
            const msgDiv = document.getElementById('modal-reg-message');
            msgDiv.textContent = 'OTP sent to your email!';
            msgDiv.className = 'bg-green-50 border border-green-300 text-green-700 text-sm rounded-lg px-4 py-2 mb-3';
            msgDiv.classList.remove('hidden');
            setTimeout(() => msgDiv.classList.add('hidden'), 3000);
          } else {
            throw new Error(data.detail || 'Failed to send OTP');
          }
        } catch (error) {
          setError('email', error.message);
          sendEmailOtpBtn.textContent = 'Send OTP';
          sendEmailOtpBtn.disabled = false;
        }
      });
    }

    // Verify Email OTP
    if (verifyEmailOtpBtn) {
      verifyEmailOtpBtn.addEventListener('click', async function() {
        const email = document.getElementById('modal-reg-email').value.trim();
        const otp = document.getElementById('modal-email-otp').value.trim();
        const otpError = document.getElementById('modal-email-otp_error');

        if (!otp) {
          otpError.textContent = 'Please enter the OTP';
          return;
        }

        if (!/^[0-9]{6}$/.test(otp)) {
          otpError.textContent = 'OTP must be 6 digits';
          return;
        }

        verifyEmailOtpBtn.disabled = true;
        verifyEmailOtpBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

        try {
          const response = await fetch('http://127.0.0.1:8000/api/auth/verify-otp/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, otp })
          });

          const data = await response.json();

          if (response.ok) {
            emailVerified = true;
            otpError.textContent = '';
            emailVerifiedMsg.classList.remove('hidden');
            verifyEmailOtpBtn.disabled = true;
            verifyEmailOtpBtn.textContent = 'Verified';
            verifyEmailOtpBtn.classList.remove('bg-green-500', 'hover:bg-green-600');
            verifyEmailOtpBtn.classList.add('bg-gray-400', 'cursor-not-allowed');
            document.getElementById('modal-reg-email').disabled = true;
            document.getElementById('modal-email-otp').disabled = true;
            sendEmailOtpBtn.disabled = true;
          } else {
            throw new Error(data.detail || 'Invalid OTP');
          }
        } catch (error) {
          otpError.textContent = error.message;
          verifyEmailOtpBtn.textContent = 'Verify';
          verifyEmailOtpBtn.disabled = false;
        }
      });
    }

    // Only allow digits in OTP field
    const emailOtpInput = document.getElementById('modal-email-otp');
    if (emailOtpInput) {
      emailOtpInput.addEventListener('keypress', (e) => {
        if (!/[0-9]/.test(e.key)) e.preventDefault();
      });
      emailOtpInput.addEventListener('input', () => {
        emailOtpInput.value = emailOtpInput.value.replace(/[^0-9]/g, '');
      });
    }

    // Close modal
    function closeModal() {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
      form.reset();
      // Clear all errors
      ['name','username','email','mobile','aadhaar','password','confirm'].forEach(id => {
        const err = document.getElementById(`modal-reg-${id}_error`);
        const field = document.getElementById(`modal-reg-${id}`);
        if (err) err.textContent = '';
        if (field) field.classList.remove('error', 'border-red-500');
      });
      const msgDiv = document.getElementById('modal-reg-message');
      if (msgDiv) msgDiv.className = 'hidden';
      
      // Reset email verification state
      emailVerified = false;
      emailOtpSent = false;
      if (emailOtpSection) emailOtpSection.classList.add('hidden');
      if (emailVerifiedMsg) emailVerifiedMsg.classList.add('hidden');
      if (sendEmailOtpBtn) {
        sendEmailOtpBtn.textContent = 'Send OTP';
        sendEmailOtpBtn.disabled = false;
      }
      if (verifyEmailOtpBtn) {
        verifyEmailOtpBtn.textContent = 'Verify';
        verifyEmailOtpBtn.disabled = false;
        verifyEmailOtpBtn.classList.remove('bg-gray-400', 'cursor-not-allowed');
        verifyEmailOtpBtn.classList.add('bg-green-500', 'hover:bg-green-600');
      }
      const emailField = document.getElementById('modal-reg-email');
      const otpField = document.getElementById('modal-email-otp');
      if (emailField) emailField.disabled = false;
      if (otpField) {
        otpField.disabled = false;
        otpField.value = '';
      }
      const otpError = document.getElementById('modal-email-otp_error');
      if (otpError) otpError.textContent = '';
    }

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    // Helpers
    function setError(fieldId, msg) {
      const field = document.getElementById('modal-reg-' + fieldId);
      const err = document.getElementById('modal-reg-' + fieldId + '_error');
      if (field) field.classList.toggle('border-red-500', !!msg);
      if (err) err.textContent = msg || '';
    }
    function clearError(fieldId) { setError(fieldId, ''); }

  function getStrength(pwd) {
    let s = 0;
    if (pwd.length >= 8) s++;
    if (/[A-Z]/.test(pwd)) s++;
    if (/[0-9]/.test(pwd)) s++;
    if (/[^A-Za-z0-9]/.test(pwd)) s++;
    return s;
  }

  function validateEmail(v) {
    const local = (v.split('@')[0] || '');
    const domain = ((v.split('@')[1] || '').split('.')[0] || '');
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
      && /[a-zA-Z]/.test(local)
      && /[a-zA-Z]/.test(domain);
  }

  function validateAadhaar(aadhaar) {
    if (!/^[0-9]{12}$/.test(aadhaar)) return false;
    const d = [[0,1,2,3,4,5,6,7,8,9],[1,2,3,4,0,6,7,8,9,5],[2,3,4,0,1,7,8,9,5,6],[3,4,0,1,2,8,9,5,6,7],[4,0,1,2,3,9,5,6,7,8],[5,9,8,7,6,0,4,3,2,1],[6,5,9,8,7,1,0,4,3,2],[7,6,5,9,8,2,1,0,4,3],[8,7,6,5,9,3,2,1,0,4],[9,8,7,6,5,4,3,2,1,0]];
    const p = [[0,1,2,3,4,5,6,7,8,9],[1,5,7,6,2,8,3,0,9,4],[5,8,0,3,7,9,6,1,4,2],[8,9,1,6,0,4,3,5,2,7],[9,4,5,3,1,2,6,8,7,0],[4,2,8,6,5,7,3,9,0,1],[2,7,9,3,8,0,6,4,1,5],[7,0,4,6,9,1,3,2,5,8]];
    let c = 0;
    const digits = aadhaar.split('').reverse().map(Number);
    for (let i = 0; i < digits.length; i++) {
      c = d[c][p[(i % 8)][digits[i]]];
    }
    return c === 0;
  }

  // Password toggle
  function initToggle(inputId, btnId) {
    const btn = document.getElementById(btnId);
    const inp = document.getElementById(inputId);
    if (!btn || !inp) return;
    btn.addEventListener('click', () => {
      const show = inp.type === 'password';
      inp.type = show ? 'text' : 'password';
      btn.querySelector('i').className = show ? 'fas fa-eye-slash' : 'fas fa-eye';
    });
  }
  initToggle('modal-reg-password', 'modal-toggle-password');
  initToggle('modal-reg-confirm', 'modal-toggle-confirm');

  // Password strength
  const colors = ['bg-red-500', 'bg-orange-400', 'bg-yellow-400', 'bg-green-500'];
  const labels = ['Weak', 'Fair', 'Good', 'Strong'];
  const textColors = ['text-red-500', 'text-orange-400', 'text-yellow-500', 'text-green-600'];

  document.getElementById('modal-reg-password').addEventListener('input', function () {
    const score = getStrength(this.value);
    for (let i = 1; i <= 4; i++) {
      const bar = document.getElementById('modal-str-' + i);
      bar.className = 'flex-1 rounded ' + (i <= score ? colors[score - 1] : 'bg-gray-200');
    }
    const lbl = document.getElementById('modal-strength-label');
    if (!this.value) {
      lbl.textContent = 'Enter a password';
      lbl.className = 'text-xs mt-1 text-gray-400';
    } else {
      lbl.textContent = labels[score - 1] || 'Weak';
      lbl.className = 'text-xs mt-1 ' + textColors[score - 1];
    }
  });

    // Live validation
    const nameEl = document.getElementById('modal-reg-name');
    const usernameEl = document.getElementById('modal-reg-username');
    const emailEl = document.getElementById('modal-reg-email');
    const mobileEl = document.getElementById('modal-reg-mobile');
    const aadhaarEl = document.getElementById('modal-reg-aadhaar');

    if (!nameEl || !usernameEl || !emailEl || !mobileEl || !aadhaarEl) {
      console.error('Some form fields not found');
      return;
    }

    console.log('All form fields found, attaching validation');

    // Name - only letters and spaces
    nameEl.addEventListener('keypress', (e) => {
      if (!/[A-Za-z\s]/.test(e.key)) e.preventDefault();
    });
    nameEl.addEventListener('input', () => {
      nameEl.value = nameEl.value.replace(/[^A-Za-z\s]/g, '');
    });

    // Username - letters, numbers, underscore only
    usernameEl.addEventListener('keypress', (e) => {
      if (!/[A-Za-z0-9_]/.test(e.key)) e.preventDefault();
    });
    usernameEl.addEventListener('input', () => {
      usernameEl.value = usernameEl.value.replace(/[^A-Za-z0-9_]/g, '');
      clearError('username');
    });

    // Mobile - digits only
    mobileEl.addEventListener('keypress', (e) => {
      if (!/[0-9]/.test(e.key)) e.preventDefault();
    });
    mobileEl.addEventListener('input', () => {
      mobileEl.value = mobileEl.value.replace(/[^0-9]/g, '');
    });

    // Aadhaar - digits only
    aadhaarEl.addEventListener('keypress', (e) => {
      if (!/[0-9]/.test(e.key)) e.preventDefault();
    });
    aadhaarEl.addEventListener('input', () => {
      aadhaarEl.value = aadhaarEl.value.replace(/[^0-9]/g, '');
    });

  // Form submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = nameEl.value.trim();
    const username = usernameEl.value.trim();
    const email = emailEl.value.trim();
    const mobile = mobileEl.value.trim();
    const aadhaar = aadhaarEl.value.trim();
    const password = document.getElementById('modal-reg-password').value;
    const confirm = document.getElementById('modal-reg-confirm').value;
    const msgDiv = document.getElementById('modal-reg-message');

    // Clear errors
    ['name','username','email','mobile','aadhaar','password','confirm'].forEach(id => clearError(id));
    msgDiv.className = 'hidden';

    let valid = true;

    if (!name) { setError('name', 'Full name is required'); valid = false; }
    else if (!/^[A-Za-z\s]+$/.test(name)) { setError('name', 'Name must contain only alphabets'); valid = false; }

    if (!username) { setError('username', 'Username is required'); valid = false; }

    if (!email) { setError('email', 'Email is required'); valid = false; }
    else if (!validateEmail(email)) { setError('email', 'Enter a valid email'); valid = false; }
    else if (!emailVerified) { setError('email', 'Please verify your email first'); valid = false; }

    if (!mobile) { setError('mobile', 'Mobile number is required'); valid = false; }
    else if (!/^[0-9]{10}$/.test(mobile)) { setError('mobile', 'Must be exactly 10 digits'); valid = false; }
    else if (!/^[6-9]/.test(mobile)) { setError('mobile', 'Must start with 6, 7, 8, or 9'); valid = false; }

    if (!aadhaar) { setError('aadhaar', 'Aadhaar number is required'); valid = false; }
    else if (!/^[0-9]{12}$/.test(aadhaar)) { setError('aadhaar', 'Must be exactly 12 digits'); valid = false; }
    else if (!validateAadhaar(aadhaar)) { 
      setError('aadhaar', 'Invalid Aadhaar number (checksum verification failed)'); 
      console.log('❌ Aadhaar validation failed - registration blocked');
      valid = false; 
    }

    if (!password) { setError('password', 'Password is required'); valid = false; }
    else if (getStrength(password) < 3) { setError('password', 'Too weak — use uppercase, numbers & symbols'); valid = false; }

    if (!confirm) { setError('confirm', 'Please confirm your password'); valid = false; }
    else if (password !== confirm) { setError('confirm', 'Passwords do not match'); valid = false; }

    if (!valid) {
      console.log('❌ Validation failed - form submission blocked');
      return;
    }

    console.log('✅ All validations passed - proceeding with registration');

    const btn = document.getElementById('modal-reg-submit');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Creating account...';

    const formData = new FormData();
    formData.append('full_name', name);
    formData.append('username', username);
    formData.append('email', email);
    formData.append('mobile', mobile);
    formData.append('aadhaar', aadhaar);
    formData.append('password', password);
    formData.append('password_confirm', confirm);
    const img = document.getElementById('modal-reg-image').files[0];
    if (img) formData.append('profile_image', img);

    try {
      const resp = await fetch('http://127.0.0.1:8000/api/auth/register/', {
        method: 'POST',
        body: formData
      });
      const data = await resp.json();

      if (resp.ok) {
        msgDiv.textContent = 'Registration successful! Redirecting to login...';
        msgDiv.className = 'bg-green-50 border border-green-300 text-green-700 text-sm rounded-lg px-4 py-2 mb-3';
        setTimeout(() => { window.location.href = '/login.html'; }, 1500);
      } else {
        if (data.username?.[0]) setError('username', data.username[0]);
        if (data.email?.[0]) setError('email', data.email[0]);
        if (data.mobile?.[0]) setError('mobile', data.mobile[0]);
        if (data.aadhaar?.[0]) setError('aadhaar', data.aadhaar[0]);
        if (data.password?.[0]) setError('password', data.password[0]);

        if (!data.username?.[0] && !data.email?.[0] && !data.mobile?.[0] && !data.aadhaar?.[0] && !data.password?.[0]) {
          msgDiv.textContent = data.detail || 'Registration failed. Please try again.';
          msgDiv.className = 'bg-red-50 border border-red-300 text-red-700 text-sm rounded-lg px-4 py-2 mb-3';
        }

        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-user-plus mr-2"></i>Create Account';
      }
    } catch (err) {
      msgDiv.textContent = 'Network error: ' + err.message;
      msgDiv.className = 'bg-red-50 border border-red-300 text-red-700 text-sm rounded-lg px-4 py-2 mb-3';
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-user-plus mr-2"></i>Create Account';
    }
  });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRegisterModal);
  } else {
    initRegisterModal();
  }
})();
