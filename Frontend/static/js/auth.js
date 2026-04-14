// Simple frontend auth utilities (classic script-compatible)
// This project stores JWT under 'accessToken'/'refreshToken' (UI) but also supports 'access_token'/'refresh_token' fallback

function getToken() {
  try {
    return (
      localStorage.getItem('accessToken') ||
      localStorage.getItem('access_token')
    );
  } catch (_) {
    return null;
  }
}

function hasValidToken() {
  const t = getToken();
  return !!t && t !== 'null' && t !== 'undefined';
}

function isAuthenticated() {
  // Check both the token and the isLoggedIn flag for consistency
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  return isLoggedIn && hasValidToken();
}

function isAdminAuthenticated() {
  // Admin flow uses dedicated keys so normal user tokens don't grant admin access
  try {
    const t = localStorage.getItem('admin_access_token') || localStorage.getItem('adminAccessToken');
    return !!t && t !== 'null' && t !== 'undefined';
  } catch (_) {
    return false;
  }
}

function requireAuth(options = {}) {
  const { redirectTo = '/login.html', message = 'Please login to continue.' } = options;
  if (!isAuthenticated()) {
    try { 
      // Store the current page URL for redirect after login
      sessionStorage.setItem('redirectAfterLogin', location.href);
    } catch(_) {}
    location.href = redirectTo;
  }
}

function clearAuth() {
  try {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('admin_access_token');
    localStorage.removeItem('admin_refresh_token');
    localStorage.removeItem('adminAccessToken');
    localStorage.removeItem('adminRefreshToken');
  } catch(_) {}
}

function requireAdminAuth(options = {}) {
  const { redirectTo = 'Admin_login.html', message = 'Please login as admin to continue.' } = options;
  if (!isAdminAuthenticated()) {
    try {
      sessionStorage.setItem('redirectAfterLogin', location.href);
    } catch(_) {}
    location.href = redirectTo;
  }
}

function authFetch(input, init = {}) {
  const token = getToken();
  const headers = new Headers(init.headers || {});
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return fetch(input, { ...init, headers });
}

// Expose globally for non-module pages
if (typeof window !== 'undefined') {
  window.__auth = { getToken, isAuthenticated, requireAuth, requireAdminAuth, authFetch, clearAuth };
  // Also expose directly for backward compatibility
  window.getToken = getToken;
  window.isAuthenticated = isAuthenticated;
  window.requireAuth = requireAuth;
  window.requireAdminAuth = requireAdminAuth;
  window.authFetch = authFetch;
  window.clearAuth = clearAuth;
}
