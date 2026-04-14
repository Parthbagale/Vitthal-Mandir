(function(){
  const API_BASE = localStorage.getItem('API_BASE') || 'http://127.0.0.1:8000';

  function clearAdminAuth() {
    try {
      localStorage.removeItem('admin_access_token');
      localStorage.removeItem('admin_refresh_token');
      localStorage.removeItem('adminAccessToken');
      localStorage.removeItem('adminRefreshToken');
    } catch (_) {}
  }

  function showError(msg) {
    const box = document.getElementById('errorBox');
    if (!box) return;
    box.textContent = msg;
    box.style.display = 'block';
  }

  function hideError() {
    const box = document.getElementById('errorBox');
    if (!box) return;
    box.style.display = 'none';
    box.textContent = '';
  }

  function redirectIfAlreadyAuthed() {
    try {
      const t = localStorage.getItem('admin_access_token') || localStorage.getItem('adminAccessToken');
      if (!t || t === 'null' || t === 'undefined') return;

      fetch(`${API_BASE}/api/auth/admin-verify/`, {
        headers: { 'Authorization': `Bearer ${t}` }
      }).then((res) => {
        if (res && res.ok) {
          window.location.replace('Admin_home.html');
        } else {
          clearAdminAuth();
        }
      }).catch(() => {
        clearAdminAuth();
      });
    } catch (_) {}
  }

  async function login(evt) {
    evt.preventDefault();
    hideError();

    const username = (document.getElementById('username')?.value || '').trim();
    const password = document.getElementById('password')?.value || '';

    if (!username || !password) {
      showError('Please enter username and password.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/auth/admin-login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const message = (data && (data.detail || data.non_field_errors || data.username || data.password)) || data || 'Login failed';
        showError(typeof message === 'string' ? message : JSON.stringify(message));
        return;
      }

      if (!data.tokens || !data.tokens.access) {
        showError('Login succeeded but token missing from response.');
        return;
      }

      localStorage.setItem('admin_access_token', data.tokens.access);
      localStorage.setItem('admin_refresh_token', data.tokens.refresh || '');
      localStorage.setItem('adminAccessToken', data.tokens.access);
      localStorage.setItem('adminRefreshToken', data.tokens.refresh || '');
      localStorage.setItem('auth_user', JSON.stringify(data.user || {}));

      window.location.replace('Admin_home.html');
    } catch (err) {
      showError('Network error: ' + err.message);
    }
  }

  function bind() {
    redirectIfAlreadyAuthed();

    const form = document.getElementById('loginForm');
    if (form) form.addEventListener('submit', login);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }
})();
