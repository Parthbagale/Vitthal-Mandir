// Admin Navigation JavaScript
(function() {
  'use strict';

  const API_BASE = localStorage.getItem('API_BASE') || 'http://127.0.0.1:8000';

  function isAdminLoggedIn() {
    try {
      const access = localStorage.getItem('admin_access_token') || localStorage.getItem('adminAccessToken');
      return !!(access && access !== 'null' && access !== 'undefined');
    } catch (_) {
      return false;
    }
  }

  function pickDisplayName(user) {
    const u = user && typeof user === 'object' ? user : {};
    return (
      u.username ||
      u.full_name ||
      u.fullName ||
      u.email ||
      [u.first_name || u.firstName || '', u.last_name || u.lastName || ''].join(' ').trim() ||
      'Admin'
    );
  }

  async function displayAdminInfo() {
    const user = JSON.parse(localStorage.getItem('auth_user') || '{}');
    const greetingEl = document.getElementById('admin-user-greeting');
    const usernameEl = document.getElementById('admin-username');
    const loggedIn = isAdminLoggedIn();

    if (!loggedIn) {
      if (greetingEl) greetingEl.classList.add('hidden');
      if (usernameEl) usernameEl.textContent = 'Admin';
      try { localStorage.removeItem('auth_user'); } catch (_) {}
      return;
    }

    if (!greetingEl || !usernameEl) return;

    let name = pickDisplayName(user);
    if ((!name || name === 'Admin') && loggedIn) {
      const access = localStorage.getItem('admin_access_token') || localStorage.getItem('adminAccessToken');
      if (access) {
        try {
          const res = await fetch(`${API_BASE}/api/auth/profile/`, {
            headers: { 'Authorization': `Bearer ${access}` }
          });
          const data = await res.json().catch(() => ({}));
          if (res.ok) {
            try { localStorage.setItem('auth_user', JSON.stringify(data || {})); } catch (_) {}
            name = pickDisplayName(data);
          }
        } catch (_) {}
      }
    }

    usernameEl.textContent = name || 'Admin';
    greetingEl.classList.remove('hidden');
  }

  async function logout() {
    const refresh = localStorage.getItem('admin_refresh_token') || localStorage.getItem('adminRefreshToken');
    try {
      if (refresh) {
        await fetch(`${API_BASE}/api/auth/logout/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh })
        });
      }
    } catch (e) {
      console.error('Logout error:', e);
    }

    localStorage.removeItem('admin_access_token');
    localStorage.removeItem('admin_refresh_token');
    localStorage.removeItem('adminAccessToken');
    localStorage.removeItem('adminRefreshToken');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');

    window.location.href = 'Admin_login.html';
  }

  function initializeNavbar() {
    try {
      document.body.classList.add('admin-has-sidebar');
    } catch (_) {}

    const loggedIn = isAdminLoggedIn();

    const sidebarEl = document.getElementById('admin-header');
    if (sidebarEl) sidebarEl.classList.toggle('hidden', !loggedIn);
    if (!loggedIn) {
      try { document.body.classList.remove('admin-has-sidebar'); } catch (_) {}
    }

    const navEl = document.querySelector('#admin-header nav');
    if (navEl) navEl.classList.toggle('hidden', !loggedIn);

    const mobileMenuBtn = document.getElementById('admin-mobile-menu-btn');
    const mobileMenu = document.getElementById('admin-mobile-menu');

    if (mobileMenuBtn && mobileMenu) {
      mobileMenuBtn.addEventListener('click', () => {
        const isExpanded = mobileMenuBtn.getAttribute('aria-expanded') === 'true';
        mobileMenuBtn.setAttribute('aria-expanded', String(!isExpanded));
        mobileMenu.classList.toggle('hidden', isExpanded);
      });
    }

    const logoutBtn = document.getElementById('admin-logout-btn');
    const mobileLogoutBtn = document.getElementById('admin-mobile-logout-btn');

    if (logoutBtn) logoutBtn.classList.toggle('hidden', !loggedIn);
    if (mobileLogoutBtn) mobileLogoutBtn.classList.toggle('hidden', !loggedIn);

    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        logout();
      });
    }

    if (mobileLogoutBtn) {
      mobileLogoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        logout();
      });
    }

    displayAdminInfo();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeNavbar);
  } else {
    initializeNavbar();
  }
})();
