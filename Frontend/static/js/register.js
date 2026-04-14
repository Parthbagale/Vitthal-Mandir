(function () {
  'use strict';

  // ── Helpers ──────────────────────────────────────────────
  function $(id) { return document.getElementById(id); }

  function setError(fieldId, msg) {
    const field = $(fieldId);
    const err   = $(fieldId + '_error');
    if (field) field.classList.toggle('error', !!msg);
    if (err)   err.textContent = msg || '';
  }

  function clearError(fieldId) { setError(fieldId, ''); }

  function getStrength(pwd) {
    let s = 0;
    if (pwd.length >= 8)          s++;
    if (/[A-Z]/.test(pwd))        s++;
    if (/[0-9]/.test(pwd))        s++;
    if (/[^A-Za-z0-9]/.test(pwd)) s++;
    return s;
  }

  function validateEmail(v) {
    const local  = (v.split('@')[0] || '');
    const domain = ((v.split('@')[1] || '').split('.')[0] || '');
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
      && /[a-zA-Z]/.test(local)
      && /[a-zA-Z]/.test(domain);
  }

  // Aadhaar validation using Verhoeff algorithm
  function validateAadhaar(aadhaar) {
    if (!/^[0-9]{12}$/.test(aadhaar)) return false;
    
    // Verhoeff algorithm tables
    const d = [
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
      [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
      [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
      [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
      [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
      [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
      [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
      [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
      [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
    ];
    const p = [
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
      [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
      [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
      [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
      [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
      [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
      [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
      [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
    ];
    const inv = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9];

    let c = 0;
    const digits = aadhaar.split('').reverse().map(Number);
    
    for (let i = 0; i < digits.length; i++) {
      c = d[c][p[(i % 8)][digits[i]]];
    }
    
    return c === 0;
  }

  // ── Password toggle ───────────────────────────────────────
  function initToggle(inputId, btnId) {
    const btn = $(btnId);
    const inp = $(inputId);
    if (!btn || !inp) return;
    btn.addEventListener('click', () => {
      const show = inp.type === 'password';
      inp.type = show ? 'text' : 'password';
      btn.querySelector('i').className = show ? 'fas fa-eye-slash' : 'fas fa-eye';
    });
  }

  initToggle('reg-password', 'toggle-password');
  initToggle('reg-confirm',  'toggle-confirm');

  // ── Password strength bar ─────────────────────────────────
  const strengthColors = ['weak', 'fair', 'good', 'strong'];
  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong'];
  const strengthTextColors = ['#ef4444', '#f97316', '#eab308', '#22c55e'];

  $('reg-password').addEventListener('input', function () {
    const score = getStrength(this.value);
    const bars  = document.querySelectorAll('.strength-bar span');
    bars.forEach((bar, i) => {
      bar.className = (i < score) ? strengthColors[score - 1] : '';
    });
    const lbl = $('strength-label');
    if (!this.value) {
      lbl.textContent = 'Enter a password';
      lbl.style.color = '#9ca3af';
    } else {
      lbl.textContent = strengthLabels[score - 1] || 'Weak';
      lbl.style.color = strengthTextColors[score - 1] || '#ef4444';
    }
  });

  // ── Live field validation ─────────────────────────────────
  // Name — letters and spaces only (block everything else)
  $('reg-name').addEventListener('keypress', (e) => {
    if (!/[A-Za-z\s]/.test(e.key)) e.preventDefault();
  });
  $('reg-name').addEventListener('input', () => {
    // strip any non-alpha chars that may come from paste
    $('reg-name').value = $('reg-name').value.replace(/[^A-Za-z\s]/g, '');
  });
  $('reg-name').addEventListener('blur', () => {
    const v = $('reg-name').value.trim();
    if (!v) setError('reg-name', 'Full name is required');
    else if (!/^[A-Za-z\s]+$/.test(v)) setError('reg-name', 'Name must contain only alphabets');
    else clearError('reg-name');
  });

  // Username — letters, digits, underscore only (no spaces, no special chars)
  $('reg-username').addEventListener('keypress', (e) => {
    if (!/[A-Za-z0-9_]/.test(e.key)) e.preventDefault();
  });
  $('reg-username').addEventListener('input', () => {
    $('reg-username').value = $('reg-username').value.replace(/[^A-Za-z0-9_]/g, '');
    clearError('reg-username');
  });

  // Mobile — digits only, block everything else
  $('reg-mobile').addEventListener('keypress', (e) => {
    if (!/[0-9]/.test(e.key)) e.preventDefault();
  });
  $('reg-mobile').addEventListener('input', () => {
    // strip non-digits from paste
    $('reg-mobile').value = $('reg-mobile').value.replace(/[^0-9]/g, '');
  });
  $('reg-mobile').addEventListener('blur', () => {
    const v = $('reg-mobile').value.trim();
    if (!v) setError('reg-mobile', 'Mobile number is required');
    else if (!/^[0-9]{10}$/.test(v)) setError('reg-mobile', 'Mobile number must be exactly 10 digits');
    else if (!/^[6-9]/.test(v)) setError('reg-mobile', 'Mobile number must start with 6, 7, 8, or 9');
    else clearError('reg-mobile');
  });

  // Aadhaar — digits only, 12 digits
  $('reg-aadhaar').addEventListener('keypress', (e) => {
    if (!/[0-9]/.test(e.key)) e.preventDefault();
  });
  $('reg-aadhaar').addEventListener('input', () => {
    // strip non-digits from paste
    $('reg-aadhaar').value = $('reg-aadhaar').value.replace(/[^0-9]/g, '');
  });
  $('reg-aadhaar').addEventListener('blur', () => {
    const v = $('reg-aadhaar').value.trim();
    if (!v) setError('reg-aadhaar', 'Aadhaar number is required');
    else if (!/^[0-9]{12}$/.test(v)) setError('reg-aadhaar', 'Aadhaar number must be exactly 12 digits');
    else if (!validateAadhaar(v)) setError('reg-aadhaar', 'Invalid Aadhaar number');
    else clearError('reg-aadhaar');
  });
  $('reg-email').addEventListener('blur', () => {
    const v = $('reg-email').value.trim();
    if (!v) setError('reg-email', 'Email is required');
    else if (!validateEmail(v)) setError('reg-email', 'Enter a valid email (e.g. name@gmail.com)');
    else clearError('reg-email');
  });

  // ── Form submit ───────────────────────────────────────────
  $('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const name     = $('reg-name').value.trim();
    const username = $('reg-username').value.trim();
    const email    = $('reg-email').value.trim();
    const mobile   = $('reg-mobile').value.trim();
    const aadhaar  = $('reg-aadhaar').value.trim();
    const password = $('reg-password').value;
    const confirm  = $('reg-confirm').value;
    const msgDiv   = $('reg-message');

    // Clear all errors
    ['reg-name','reg-username','reg-email','reg-mobile','reg-aadhaar','reg-password','reg-confirm']
      .forEach(id => clearError(id));
    msgDiv.className = 'hidden';
    msgDiv.textContent = '';

    let valid = true;

    if (!name)                          { setError('reg-name', 'Full name is required'); valid = false; }
    else if (!/^[A-Za-z\s]+$/.test(name)) { setError('reg-name', 'Name must contain only alphabets'); valid = false; }

    if (!username) { setError('reg-username', 'Username is required'); valid = false; }

    if (!email)                { setError('reg-email', 'Email is required'); valid = false; }
    else if (!validateEmail(email)) { setError('reg-email', 'Enter a valid email (e.g. name@gmail.com)'); valid = false; }

    if (!mobile)                       { setError('reg-mobile', 'Mobile number is required'); valid = false; }
    else if (!/^[0-9]{10}$/.test(mobile)) { setError('reg-mobile', 'Mobile number must be exactly 10 digits'); valid = false; }
    else if (!/^[6-9]/.test(mobile))      { setError('reg-mobile', 'Mobile must start with 6, 7, 8, or 9'); valid = false; }

    if (!aadhaar)                       { setError('reg-aadhaar', 'Aadhaar number is required'); valid = false; }
    else if (!/^[0-9]{12}$/.test(aadhaar)) { setError('reg-aadhaar', 'Aadhaar number must be exactly 12 digits'); valid = false; }
    else if (!validateAadhaar(aadhaar))    { 
      setError('reg-aadhaar', 'Invalid Aadhaar number (checksum verification failed)'); 
      console.log('❌ Aadhaar validation failed - registration blocked');
      valid = false; 
    }

    if (!password)              { setError('reg-password', 'Password is required'); valid = false; }
    else if (getStrength(password) < 3) { setError('reg-password', 'Too weak — use uppercase, numbers & symbols'); valid = false; }

    if (!confirm)              { setError('reg-confirm', 'Please confirm your password'); valid = false; }
    else if (password !== confirm) { setError('reg-confirm', 'Passwords do not match'); valid = false; }

    if (!valid) {
      console.log('❌ Validation failed - form submission blocked');
      return;
    }

    console.log('✅ All validations passed - proceeding with registration');

    // Submit
    const btn = $('reg-submit');
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
    const img = $('reg-image').files[0];
    if (img) formData.append('profile_image', img);

    try {
      const resp = await fetch('http://127.0.0.1:8000/api/auth/register/', {
        method: 'POST',
        body: formData
      });
      const data = await resp.json();

      if (resp.ok) {
        msgDiv.textContent = 'Registration successful! Redirecting to login...';
        msgDiv.className = 'success';
        setTimeout(() => { window.location.href = '/login.html'; }, 1500);
      } else {
        // Field-specific server errors
        if (data.username?.[0]) setError('reg-username', data.username[0]);
        if (data.email?.[0])    setError('reg-email',    data.email[0]);
        if (data.mobile?.[0])   setError('reg-mobile',   data.mobile[0]);
        if (data.aadhaar?.[0])  setError('reg-aadhaar',  data.aadhaar[0]);
        if (data.password?.[0]) setError('reg-password', data.password[0]);

        if (!data.username?.[0] && !data.email?.[0] && !data.mobile?.[0] && !data.aadhaar?.[0] && !data.password?.[0]) {
          msgDiv.textContent = data.detail || 'Registration failed. Please try again.';
          msgDiv.className = 'error';
        }

        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-user-plus mr-2"></i>Create Account';
      }
    } catch (err) {
      msgDiv.textContent = 'Network error: ' + err.message;
      msgDiv.className = 'error';
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-user-plus mr-2"></i>Create Account';
    }
  });
})();
