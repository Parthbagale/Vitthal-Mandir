(function() {
  'use strict';

  const form = document.getElementById('register-form');
  if (!form) return;

  let emailVerified = false;
  let verifiedEmail = '';

  // Helpers
  function setError(fieldId, msg) {
    const field = document.getElementById(fieldId);
    const err = document.getElementById(fieldId + '_error');
    if (field) {
      field.classList.toggle('border-red-500', !!msg);
      if (msg) {
        field.classList.add('bg-red-50');
      } else {
        field.classList.remove('bg-red-50');
      }
    }
    if (err) {
      err.textContent = msg || '';
      if (msg) {
        err.classList.add('font-semibold');
      } else {
        err.classList.remove('font-semibold');
      }
    }
  }
  function clearError(fieldId) { setError(fieldId, ''); }

  function validateEmail(v) {
    // Must have basic email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return false;
    
    const local = (v.split('@')[0] || '');
    const domain = ((v.split('@')[1] || '').split('.')[0] || '');
    
    // Local part (before @) must contain at least one letter
    if (!/[a-zA-Z]/.test(local)) return false;
    
    // Domain (between @ and .) must contain at least one letter
    if (!/[a-zA-Z]/.test(domain)) return false;
    
    return true;
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

  // Live validation
  const nameEl = document.getElementById('register-name');
  const usernameEl = document.getElementById('register-username');
  const emailEl = document.getElementById('register-email');
  const mobileEl = document.getElementById('register-mobile');
  const aadhaarEl = document.getElementById('register-aadhaar');

  if (nameEl) {
    nameEl.addEventListener('keypress', (e) => {
      if (!/[A-Za-z\s]/.test(e.key)) e.preventDefault();
    });
    nameEl.addEventListener('input', () => {
      nameEl.value = nameEl.value.replace(/[^A-Za-z\s]/g, '');
    });
  }

  if (usernameEl) {
    usernameEl.addEventListener('keypress', (e) => {
      if (!/[A-Za-z0-9_]/.test(e.key)) e.preventDefault();
    });
    usernameEl.addEventListener('input', () => {
      usernameEl.value = usernameEl.value.replace(/[^A-Za-z0-9_]/g, '');
      clearError('register-username');
    });
  }

  if (mobileEl) {
    mobileEl.addEventListener('keypress', (e) => {
      if (!/[0-9]/.test(e.key)) e.preventDefault();
    });
    mobileEl.addEventListener('input', () => {
      mobileEl.value = mobileEl.value.replace(/[^0-9]/g, '');
      clearError('register-mobile');
    });
    mobileEl.addEventListener('blur', () => {
      const val = mobileEl.value.trim();
      if (val && !/^[6-9][0-9]{9}$/.test(val)) {
        if (val.length !== 10) {
          setError('register-mobile', 'Must be exactly 10 digits');
        } else if (!/^[6-9]/.test(val)) {
          setError('register-mobile', 'Must start with 6, 7, 8, or 9');
        }
      }
    });
  }

  if (aadhaarEl) {
    aadhaarEl.addEventListener('keypress', (e) => {
      if (!/[0-9]/.test(e.key)) e.preventDefault();
    });
    aadhaarEl.addEventListener('input', () => {
      aadhaarEl.value = aadhaarEl.value.replace(/[^0-9]/g, '');
      clearError('register-aadhaar');
    });
    aadhaarEl.addEventListener('blur', () => {
      const val = aadhaarEl.value.trim();
      if (val) {
        if (val.length !== 12) {
          setError('register-aadhaar', 'Must be exactly 12 digits');
        } else if (!validateAadhaar(val)) {
          setError('register-aadhaar', 'Invalid Aadhaar number (checksum verification failed)');
        }
      }
    });
  }

  if (emailEl) {
    emailEl.addEventListener('blur', () => {
      const val = emailEl.value.trim();
      if (val && !validateEmail(val)) {
        setError('register-email', 'Invalid email format (must contain letters, e.g., name@gmail.com)');
      }
    });
    emailEl.addEventListener('input', () => {
      clearError('register-email');
      // Reset verification if email changes
      if (emailVerified && emailEl.value.trim().toLowerCase() !== verifiedEmail) {
        emailVerified = false;
        verifiedEmail = '';
        document.getElementById('otp-verification-section').classList.add('hidden');
        document.getElementById('send-otp-btn').textContent = 'Send OTP';
        document.getElementById('send-otp-btn').disabled = false;
      }
    });
  }

  // Send OTP Button
  const sendOtpBtn = document.getElementById('send-otp-btn');
  if (sendOtpBtn) {
    sendOtpBtn.addEventListener('click', async () => {
      const email = emailEl ? emailEl.value.trim() : '';
      
      if (!email) {
        setError('register-email', 'Please enter your email address');
        return;
      }
      
      if (!validateEmail(email)) {
        setError('register-email', 'Please enter a valid email address');
        return;
      }
      
      sendOtpBtn.disabled = true;
      sendOtpBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
      
      try {
        const response = await fetch('http://127.0.0.1:8000/api/auth/send-otp/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.toLowerCase() })
        });
        
        const data = await response.json();
        
        if (response.ok) {
          document.getElementById('otp-verification-section').classList.remove('hidden');
          document.getElementById('otp-status').textContent = 'OTP sent to your email. Check your inbox!';
          document.getElementById('otp-status').className = 'text-xs mt-1 text-green-600';
          sendOtpBtn.textContent = 'Resend OTP';
          sendOtpBtn.disabled = false;
          emailEl.disabled = true;
        } else {
          setError('register-email', data.detail || 'Failed to send OTP');
          sendOtpBtn.textContent = 'Send OTP';
          sendOtpBtn.disabled = false;
        }
      } catch (error) {
        setError('register-email', 'Network error. Please try again.');
        sendOtpBtn.textContent = 'Send OTP';
        sendOtpBtn.disabled = false;
      }
    });
  }

  // Verify OTP Button
  const verifyOtpBtn = document.getElementById('verify-otp-btn');
  const otpInput = document.getElementById('register-otp');
  if (verifyOtpBtn && otpInput) {
    verifyOtpBtn.addEventListener('click', async () => {
      const email = emailEl ? emailEl.value.trim().toLowerCase() : '';
      const otp = otpInput.value.trim();
      
      if (!otp) {
        setError('register-otp', 'Please enter the OTP');
        return;
      }
      
      if (otp.length !== 6) {
        setError('register-otp', 'OTP must be 6 digits');
        return;
      }
      
      verifyOtpBtn.disabled = true;
      verifyOtpBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';
      
      try {
        const response = await fetch('http://127.0.0.1:8000/api/auth/verify-otp/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, otp })
        });
        
        const data = await response.json();
        
        if (response.ok && data.verified) {
          emailVerified = true;
          verifiedEmail = email;
          document.getElementById('otp-status').textContent = '✓ Email verified successfully!';
          document.getElementById('otp-status').className = 'text-xs mt-1 text-green-600 font-semibold';
          verifyOtpBtn.innerHTML = '<i class="fas fa-check"></i> Verified';
          verifyOtpBtn.disabled = true;
          verifyOtpBtn.classList.remove('bg-green-500', 'hover:bg-green-600');
          verifyOtpBtn.classList.add('bg-gray-400', 'cursor-not-allowed');
          otpInput.disabled = true;
          clearError('register-otp');
        } else {
          setError('register-otp', data.detail || 'Invalid OTP');
          verifyOtpBtn.textContent = 'Verify';
          verifyOtpBtn.disabled = false;
        }
      } catch (error) {
        setError('register-otp', 'Network error. Please try again.');
        verifyOtpBtn.textContent = 'Verify';
        verifyOtpBtn.disabled = false;
      }
    });
    
    // Allow only numbers in OTP field
    otpInput.addEventListener('keypress', (e) => {
      if (!/[0-9]/.test(e.key)) e.preventDefault();
    });
  }

  if (emailEl) {
    emailEl.addEventListener('blur', () => {
      const val = emailEl.value.trim();
      if (val && !validateEmail(val)) {
        setError('register-email', 'Invalid email format (must contain letters, e.g., name@gmail.com)');
      }
    });
    emailEl.addEventListener('input', () => {
      clearError('register-email');
    });
  }

  // Form submit validation
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const name = nameEl ? nameEl.value.trim() : '';
    const username = usernameEl ? usernameEl.value.trim() : '';
    const email = emailEl ? emailEl.value.trim() : '';
    const mobile = mobileEl ? mobileEl.value.trim() : '';
    const aadhaar = aadhaarEl ? aadhaarEl.value.trim() : '';
    const password = document.getElementById('register-password') ? document.getElementById('register-password').value : '';
    const confirm = document.getElementById('register-password-confirm') ? document.getElementById('register-password-confirm').value : '';

    console.log('🔍 Starting registration validation...');
    console.log('  Name:', name);
    console.log('  Username:', username);
    console.log('  Email:', email);
    console.log('  Mobile:', mobile);
    console.log('  Aadhaar:', aadhaar);

    // Clear all errors
    ['register-name','register-username','register-email','register-mobile','register-aadhaar','register-password','register-password-confirm'].forEach(id => clearError(id));

    let valid = true;

    if (!name) { setError('register-name', 'Full name is required'); valid = false; }
    else if (!/^[A-Za-z\s]+$/.test(name)) { setError('register-name', 'Name must contain only alphabets'); valid = false; }

    if (!username) { setError('register-username', 'Username is required'); valid = false; }

    if (!email) { setError('register-email', 'Email is required'); valid = false; }
    else if (!validateEmail(email)) { 
      setError('register-email', 'Invalid email format (must contain letters, e.g., name@gmail.com)'); 
      console.log('❌ Email validation failed for:', email);
      console.log('  - Local part (before @):', email.split('@')[0]);
      console.log('  - Domain part (after @):', email.split('@')[1]);
      valid = false; 
    }
    else if (!emailVerified) {
      setError('register-email', 'Please verify your email with OTP');
      valid = false;
    }

    if (!mobile) { setError('register-mobile', 'Mobile number is required'); valid = false; }
    else if (!/^[0-9]{10}$/.test(mobile)) { setError('register-mobile', 'Must be exactly 10 digits'); valid = false; }
    else if (!/^[6-9]/.test(mobile)) { setError('register-mobile', 'Must start with 6, 7, 8, or 9'); valid = false; }

    if (!aadhaar) { setError('register-aadhaar', 'Aadhaar number is required'); valid = false; }
    else if (!/^[0-9]{12}$/.test(aadhaar)) { setError('register-aadhaar', 'Must be exactly 12 digits'); valid = false; }
    else if (!validateAadhaar(aadhaar)) { 
      setError('register-aadhaar', 'Invalid Aadhaar number (checksum verification failed)'); 
      console.log('❌ Aadhaar validation failed for:', aadhaar);
      console.log('  - Verhoeff checksum algorithm failed');
      valid = false; 
    }

    if (!password) { setError('register-password', 'Password is required'); valid = false; }
    else if (password.length < 8) { setError('register-password', 'Password must be at least 8 characters'); valid = false; }

    if (!confirm) { setError('register-password-confirm', 'Please confirm your password'); valid = false; }
    else if (password !== confirm) { setError('register-password-confirm', 'Passwords do not match'); valid = false; }

    // Block submission if validation failed
    if (!valid) {
      console.log('❌ Validation failed - form submission blocked');
      
      // Scroll to first error
      const firstError = form.querySelector('.border-red-500');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstError.focus();
      }
      
      return false;
    }

    console.log('✅ All validations passed - proceeding with registration');

    // Submit to backend
    const formData = new FormData();
    formData.append('full_name', name);
    formData.append('username', username);
    formData.append('email', email);
    formData.append('mobile', mobile);
    formData.append('aadhaar', aadhaar);
    formData.append('password', password);
    formData.append('password_confirm', confirm);
    const img = document.getElementById('profile-image');
    if (img && img.files[0]) formData.append('profile_image', img.files[0]);

    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...';
    }

    try {
      const resp = await fetch('http://127.0.0.1:8000/api/auth/register/', {
        method: 'POST',
        body: formData
      });
      const data = await resp.json();

      if (resp.ok) {
        const msgDiv = document.getElementById('register-message');
        if (msgDiv) {
          msgDiv.textContent = 'Registration successful! Redirecting to login...';
          msgDiv.className = 'text-center mt-2 text-xs text-green-600';
        }
        setTimeout(() => { window.location.href = '/login.html'; }, 1500);
      } else {
        if (data.username?.[0]) setError('register-username', data.username[0]);
        if (data.email?.[0]) setError('register-email', data.email[0]);
        if (data.mobile?.[0]) setError('register-mobile', data.mobile[0]);
        if (data.aadhaar?.[0]) setError('register-aadhaar', data.aadhaar[0]);
        if (data.password?.[0]) setError('register-password', data.password[0]);

        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<i class="fas fa-user-plus"></i> <span>Create Account</span>';
        }
      }
    } catch (err) {
      const msgDiv = document.getElementById('register-message');
      if (msgDiv) {
        msgDiv.textContent = 'Network error: ' + err.message;
        msgDiv.className = 'text-center mt-2 text-xs text-red-600';
      }
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-user-plus"></i> <span>Create Account</span>';
      }
    }
  });
})();
