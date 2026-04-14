// Global variables
// Suppress animations during initial navigation/load
try {
    document.body.classList.add('no-anim');
} catch (_) {}

// Chatbot hover tooltip
(function bindChatbotTooltip(){
    if (window.__vitthalChatbotTooltipBound) return;
    window.__vitthalChatbotTooltipBound = true;

    function ensureTooltipEl() {
        let el = document.getElementById('chatbot-tooltip');
        if (el) return el;
        el = document.createElement('div');
        el.id = 'chatbot-tooltip';
        el.className = 'fixed z-[1100] hidden px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-900 text-white shadow-lg';
        el.textContent = 'Chatbot';
        document.body.appendChild(el);
        return el;
    }

    function position(tooltip, icon) {
        const r = icon.getBoundingClientRect();
        const pad = 10;
        const x = Math.round(r.left + r.width / 2);
        const y = Math.round(r.top - pad);
        tooltip.style.left = x + 'px';
        tooltip.style.top = y + 'px';
        tooltip.style.transform = 'translate(-50%, -100%)';
    }

    function bind() {
        const icon = document.getElementById('chatbot-icon');
        if (!icon) return;
        const tooltip = ensureTooltipEl();

        const show = () => {
            position(tooltip, icon);
            tooltip.classList.remove('hidden');
        };
        const hide = () => {
            tooltip.classList.add('hidden');
        };

        icon.addEventListener('mouseenter', show);
        icon.addEventListener('mouseleave', hide);
        icon.addEventListener('focus', show);
        icon.addEventListener('blur', hide);
        window.addEventListener('scroll', hide, { passive: true });
        window.addEventListener('resize', hide);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bind);
    } else {
        bind();
    }
})();

window.addEventListener('load', () => {
    // Give the browser a brief moment to render, then enable animations
    setTimeout(() => {
        try {
            document.body.classList.remove('no-anim');
            document.body.classList.add('anim-ready');
        } catch (_) {}
    }, 400);
});
const accessTokenLS = localStorage.getItem('access_token') || localStorage.getItem('accessToken');
let isLoggedIn = false;
let currentUser = localStorage.getItem('currentUser') || '';
// Centralized API base (align with Admin_login.html). Can be overridden via localStorage.setItem('API_BASE', 'http://host:port')
const API_BASE = (function() {
    try { return localStorage.getItem('API_BASE') || 'http://127.0.0.1:8000'; } catch(_) { return 'http://127.0.0.1:8000'; }
})();

function hasToken() {
    const t = (localStorage.getItem('access_token') || localStorage.getItem('accessToken') || '').toString().trim();
    if (!t) return false;
    if (t === 'null' || t === 'undefined') return false;
    return true;
}

function consumeRedirectAfterLogin() {
    try {
        const dest = (sessionStorage.getItem('redirectAfterLogin') || '').toString().trim();
        if (dest) {
            sessionStorage.removeItem('redirectAfterLogin');
            sessionStorage.removeItem('redirectServiceName');
            return dest;
        }
    } catch (_) {}
    return '';
}

try {
    isLoggedIn = hasToken();
} catch (_) {
    isLoggedIn = false;
}

// Authentication UI update function
function updateAuthUI() {
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const userGreeting = document.getElementById('user-greeting');
    const mobileLoginBtn = document.getElementById('mobile-login-btn');
    const mobileLogoutBtn = document.getElementById('mobile-logout-btn');
    const mobileUserGreeting = document.getElementById('mobile-user-greeting');
    const registerBtnNav = document.getElementById('registerBtn');
    const mobileRegisterBtnNav = document.getElementById('mobile-register-btn');
    const profileLink = document.getElementById('profileLink');
    const mobileProfileLink = document.getElementById('mobile-profile-link');

    // Helper to build attractive greeting chip
    const makeChip = (name, isMobile = false) => {
        const clean = (name || '').toString().trim();
        const parts = clean.split(/\s+|_|\.|-/).filter(Boolean);
        let initials = '';
        if (parts.length >= 2) initials = (parts[0][0] + parts[1][0]).toUpperCase();
        else initials = clean.slice(0, 2).toUpperCase();
        const chipClass = isMobile ? 'user-chip mobile' : 'user-chip';
        const avatarClass = isMobile ? 'user-avatar mobile' : 'user-avatar';
        const nameClass = isMobile ? 'user-name mobile' : 'user-name';
        return `<span class="${chipClass}" title="Logged in as ${clean}"><span class="${avatarClass}">${initials}</span><span class="${nameClass}">Welcome, ${clean}</span></span>`;
    };

    if (isLoggedIn && currentUser) {
        // Desktop
        if (loginBtn) loginBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'block';
        if (registerBtnNav) registerBtnNav.style.display = 'none';
        if (profileLink) profileLink.classList.remove('hidden');
        if (userGreeting) {
            userGreeting.innerHTML = makeChip(currentUser, false);
            userGreeting.style.display = 'inline-block';
        }
        
        // Mobile
        if (mobileLoginBtn) mobileLoginBtn.style.display = 'none';
        if (mobileLogoutBtn) mobileLogoutBtn.style.display = 'block';
        if (mobileRegisterBtnNav) mobileRegisterBtnNav.style.display = 'none';
        if (mobileProfileLink) mobileProfileLink.classList.remove('hidden');
        if (mobileUserGreeting) {
            mobileUserGreeting.innerHTML = makeChip(currentUser, true);
            mobileUserGreeting.style.display = 'block';
        }
    } else {
        // Desktop
        if (loginBtn) loginBtn.style.display = 'block';
        if (logoutBtn) logoutBtn.style.display = 'none';
        if (registerBtnNav) registerBtnNav.style.display = 'block';
        if (profileLink) profileLink.classList.add('hidden');
        if (userGreeting) { userGreeting.style.display = 'none'; userGreeting.innerHTML = ''; }
        
        // Mobile
        if (mobileLoginBtn) mobileLoginBtn.style.display = 'block';
        if (mobileLogoutBtn) mobileLogoutBtn.style.display = 'none';
        if (mobileRegisterBtnNav) mobileRegisterBtnNav.style.display = 'block';
        if (mobileProfileLink) mobileProfileLink.classList.add('hidden');
        if (mobileUserGreeting) { mobileUserGreeting.style.display = 'none'; mobileUserGreeting.innerHTML = ''; }
    }
}

// Modal functions
function openModal(modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    setTimeout(() => {
        modal.querySelector('.modal').classList.remove('scale-95', 'opacity-0');
        modal.querySelector('.modal').classList.add('scale-100', 'opacity-100');
    }, 50);
    document.body.classList.add('overflow-hidden');
}

function closeModal(modal) {
    modal.querySelector('.modal').classList.remove('scale-100', 'opacity-100');
    modal.querySelector('.modal').classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
        modal.classList.remove('flex');
        modal.classList.add('hidden');
        document.body.classList.remove('overflow-hidden');
    }, 300);
}

function showSuccessPopup(opts) {
    const o = opts || {};
    const title = (o.title || 'Success').toString();
    const message = (o.message || '').toString();
    const metaLines = Array.isArray(o.meta) ? o.meta : [];

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full relative overflow-hidden">
            <div class="bg-gradient-to-r from-green-500 to-green-600 px-8 py-6 relative">
                <button type="button" class="close-success-modal absolute top-4 right-4 text-white/80 hover:text-white transition-colors" aria-label="Close">
                    <i class="ph ph-x text-2xl"></i>
                </button>
                <div class="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mb-3">
                    <i class="fas fa-check text-2xl text-white"></i>
                </div>
                <div class="text-white text-xl font-semibold">${title}</div>
                ${message ? `<div class=\"text-white/90 text-sm mt-1\">${message}</div>` : ''}
            </div>
            <div class="px-8 py-6">
                <div class="space-y-2">
                    ${metaLines.map(x => {
                        const k = (x && x.label) ? String(x.label) : '';
                        const v = (x && x.value !== undefined) ? String(x.value) : '';
                        if (!k && !v) return '';
                        return `<div class=\"flex items-start justify-between gap-4 text-sm\"><div class=\"text-gray-600 font-semibold\">${k}</div><div class=\"text-gray-900 text-right\">${v}</div></div>`;
                    }).join('')}
                </div>
                <div class="mt-6 flex justify-end">
                    <button type="button" class="close-success-modal bg-primary text-white py-2 px-6 rounded-full font-semibold hover:bg-primary-dark transition">
                        Close
                    </button>
                </div>
            </div>
        </div>
    `;

    function close() {
        try { modal.remove(); } catch (_) {}
    }

    document.body.appendChild(modal);
    modal.querySelectorAll('.close-success-modal').forEach(btn => btn.addEventListener('click', close));
    modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
}

window.showSuccessPopup = showSuccessPopup;

// Authentication required modal function
function showAuthRequiredModal(serviceName) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-gradient-to-br from-gray-900/80 to-black/90 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full relative transform scale-95 opacity-0 overflow-hidden auth-required-modal">
            <div class="bg-gradient-to-r from-red-500 to-red-600 px-8 py-6 relative">
                <button class="close-auth-modal absolute top-4 right-4 text-white/80 hover:text-white transition-colors">
                    <i class="ph ph-x text-2xl"></i>
                </button>
                <div class="text-center">
                    <div class="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                        <i class="fas fa-lock text-2xl text-white"></i>
                    </div>
                    <h2 class="text-3xl font-bold text-white mb-2">Authentication Required</h2>
                    <p class="text-red-100 text-sm">Please login to access ${serviceName}</p>
                </div>
            </div>
            <div class="px-8 py-6 text-center">
                <p class="text-gray-600 mb-6">You need to be logged in to access our online services. Please sign in to your devotee account to continue.</p>
                <div class="space-y-3">
                    <button class="login-from-auth w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 rounded-xl font-semibold hover:from-orange-600 hover:to-orange-700 transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl flex items-center justify-center space-x-2">
                        <i class="fas fa-sign-in-alt"></i>
                        <span>Sign In</span>
                    </button>
                    <button class="register-from-auth w-full bg-gray-200 text-gray-800 py-3 rounded-xl font-semibold hover:bg-gray-300 transition-all duration-200 flex items-center justify-center space-x-2">
                        <i class="fas fa-user-plus"></i>
                        <span>Create Account</span>
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Animate in
    setTimeout(() => {
        const modalContent = modal.querySelector('.auth-required-modal');
        modalContent.classList.remove('scale-95', 'opacity-0');
        modalContent.classList.add('scale-100', 'opacity-100');
    }, 50);

    // Event listeners
    modal.querySelector('.close-auth-modal').addEventListener('click', () => {
        closeAuthModal(modal);
    });

    modal.querySelector('.login-from-auth').addEventListener('click', () => {
        closeAuthModal(modal);
        setTimeout(() => openModal(document.getElementById('login-modal')), 300);
    });

    modal.querySelector('.register-from-auth').addEventListener('click', () => {
        closeAuthModal(modal);
        setTimeout(() => openModal(document.getElementById('register-modal')), 300);
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeAuthModal(modal);
        }
    });
}

function closeAuthModal(modal) {
    const modalContent = modal.querySelector('.auth-required-modal');
    modalContent.classList.remove('scale-100', 'opacity-100');
    modalContent.classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
        document.body.removeChild(modal);
    }, 300);
}

// Global function to access services with authentication check
window.accessService = function(serviceName, url) {
    if (isLoggedIn || hasToken()) {
        window.location.href = url;
        return;
    }

    try {
        const dest = (url && (url.startsWith('/') || url.startsWith('http'))) ? url : ('/' + String(url || '').replace(/^\/+/, ''));
        sessionStorage.setItem('redirectAfterLogin', dest);
        if (serviceName) sessionStorage.setItem('redirectServiceName', serviceName);
    } catch (_) {}

    window.location.href = '/login.html';
};

// Always-available delegated handler for Online Services dropdown
// (works even if navbar.html inline script doesn't bind, or guards prevent re-binding)
(function bindOnlineServicesDelegated() {
    if (window.__vitthalOnlineServicesDelegatedBound) return;
    window.__vitthalOnlineServicesDelegatedBound = true;

    function getEls() {
        const btn = document.getElementById('online-services-btn');
        const menu = document.getElementById('online-services-menu');
        const root = document.getElementById('online-services-dropdown');
        return { btn, menu, root };
    }

    // Capture-phase so it runs before other bubbling handlers that might close the menu
    document.addEventListener('click', function (e) {
        const { btn, menu, root } = getEls();
        if (!btn || !menu) return;

        const clickedBtn = e.target && e.target.closest ? e.target.closest('#online-services-btn') : null;
        if (clickedBtn) {
            e.preventDefault();
            e.stopPropagation();

            const willOpen = menu.classList.contains('hidden');
            menu.classList.toggle('hidden', !willOpen);
            btn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
            return;
        }

        // Outside click closes
        try {
            if (menu.classList.contains('hidden')) return;
            if (root && root.contains(e.target)) return;
            menu.classList.add('hidden');
            btn.setAttribute('aria-expanded', 'false');
        } catch (_) {}
    }, true);

    document.addEventListener('keydown', function (e) {
        if (e.key !== 'Escape') return;
        const { btn, menu } = getEls();
        if (!btn || !menu) return;
        if (menu.classList.contains('hidden')) return;
        menu.classList.add('hidden');
        btn.setAttribute('aria-expanded', 'false');
    });
})();

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', async function() {
    // Home hero slider (index.html)
    (function initHomeHeroSlider() {
        try {
            const slider = document.getElementById('home-hero-slider');
            if (!slider) return;
            const slides = Array.from(slider.querySelectorAll('.hero-bg-slide'));
            if (!slides.length) return;

            let idx = Math.max(0, slides.findIndex(s => s.classList.contains('is-active')));
            function show(i) {
                slides.forEach((s, n) => s.classList.toggle('is-active', n === i));
            }
            show(idx);

            setInterval(() => {
                idx = (idx + 1) % slides.length;
                show(idx);
            }, 2000);
        } catch (_) { /* ignore */ }
    })();

    // Ensure standardized navbar is present by injecting partial
    async function injectNavbarPartial() {
        try {
            if (document.getElementById('site-header')) return;
            const resp = await fetch('partials/navbar.html', { cache: 'no-store' });
            if (!resp.ok) return;
            const html = await resp.text();
            const tmp = document.createElement('div');
            tmp.innerHTML = html.trim();
            const newHeader = tmp.querySelector('#site-header');
            if (!newHeader) return;
            const existing = document.getElementById('site-header');
            if (existing) {
                existing.replaceWith(newHeader);
            } else {
                document.body.insertBefore(newHeader, document.body.firstChild);
            }
            // Allow layout to settle
            await new Promise(r => setTimeout(r, 0));
        } catch (_) { /* ignore */ }
    }
    await injectNavbarPartial();
    // Ensure standardized footer is present by injecting partial
    async function injectFooterPartial() {
        try {
            if (document.getElementById('site-footer')) return;
            const resp = await fetch('partials/footer.html', { cache: 'no-store' });
            if (!resp.ok) return;
            const html = await resp.text();
            const tmp = document.createElement('div');
            tmp.innerHTML = html.trim();
            const newFooter = tmp.querySelector('#site-footer');
            if (!newFooter) return;
            const existing = document.getElementById('site-footer');
            if (existing) {
                existing.replaceWith(newFooter);
            } else {
                document.body.appendChild(newFooter);
            }
            // Dynamic year
            try {
                const y = newFooter.querySelector('#footer-year');
                if (y) y.textContent = new Date().getFullYear();
            } catch(_) {}
        } catch (_) { /* ignore */ }
    }
    await injectFooterPartial();

    // Ensure Online Services dropdown works everywhere (some pages may load/replace navbar dynamically)
    (function ensureOnlineServicesDropdownBound() {
        try {
            const servicesBtn = document.getElementById('online-services-btn');
            const servicesMenu = document.getElementById('online-services-menu');
            const dropdownRoot = document.getElementById('online-services-dropdown');
            if (!servicesBtn || !servicesMenu) return;

            // Prevent duplicate bindings
            if (servicesBtn.getAttribute('data-dropdown-initialized') === 'true') return;
            servicesBtn.setAttribute('data-dropdown-initialized', 'true');

            servicesBtn.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                const willOpen = servicesMenu.classList.contains('hidden');
                servicesMenu.classList.toggle('hidden', !willOpen);
                servicesBtn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
            });

            // Close when clicking outside
            document.addEventListener('click', function (e) {
                try {
                    if (servicesMenu.classList.contains('hidden')) return;
                    if (dropdownRoot && dropdownRoot.contains(e.target)) return;
                    servicesMenu.classList.add('hidden');
                    servicesBtn.setAttribute('aria-expanded', 'false');
                } catch (_) {}
            });

            // Close on escape
            document.addEventListener('keydown', function (e) {
                try {
                    if (e.key !== 'Escape') return;
                    if (servicesMenu.classList.contains('hidden')) return;
                    servicesMenu.classList.add('hidden');
                    servicesBtn.setAttribute('aria-expanded', 'false');
                } catch (_) {}
            });
        } catch (_) {}
    })();

    // If footer is already present (e.g., rendered via Django {% include %}),
    // ensure dynamic year is populated even when partial fetch is unavailable.
    try {
        const y = document.getElementById('footer-year');
        if (y && !y.textContent) y.textContent = new Date().getFullYear();
    } catch (_) { /* ignore */ }

    // Update authentication UI on page load
    updateAuthUI();

    // Cross-page auth buttons: if modals are missing on this page, redirect to index with hash
    (function wireGlobalAuthButtons() {
        try {
            const idx = (window.location.pathname || '').split('/').pop() || 'index.html';
            const onIndex = idx === '' || /index\.html$/i.test(idx);
            const loginBtnEl = document.getElementById('loginBtn');
            const mLoginBtnEl = document.getElementById('mobile-login-btn');
            const registerBtnEl = document.getElementById('registerBtn');
            const mRegisterBtnEl = document.getElementById('mobile-register-btn');
            const hasLoginModal = !!document.getElementById('login-modal');
            const hasRegisterModal = !!document.getElementById('register-modal');

            function ensureHandler(btn, target) {
                if (!btn) return;
                btn.addEventListener('click', (e) => {
                    // If modal exists here, let dedicated handlers open it.
                    if ((target === 'login' && hasLoginModal) || (target === 'register' && hasRegisterModal)) return;
                    e.preventDefault();
                    const dest = onIndex ? `#${target}` : `index.html#${target}`;
                    window.location.href = dest;
                });
            }

            // Auto-open modals on index based on URL hash (#login or #register)
            // IMPORTANT: do not reference variables like loginModal/registerModal here; they may be defined later.
            (function openModalFromHash(){
                try {
                    const h = (window.location.hash || '').toLowerCase();
                    const loginModalEl = document.getElementById('login-modal');
                    const registerModalEl = document.getElementById('register-modal');
                    if (h === '#login' && typeof openModal === 'function' && loginModalEl) {
                        openModal(loginModalEl);
                        history.replaceState('', document.title, window.location.pathname + window.location.search);
                    } else if (h === '#register' && typeof openModal === 'function' && registerModalEl) {
                        openModal(registerModalEl);
                        try {
                            // initGoogleSignUpButtonSoon is defined later; retry quickly so it renders reliably
                            setTimeout(() => { try { window.initGoogleSignUpButtonSoon && window.initGoogleSignUpButtonSoon(); } catch(_) {} }, 0);
                            setTimeout(() => { try { window.initGoogleSignUpButtonSoon && window.initGoogleSignUpButtonSoon(); } catch(_) {} }, 600);
                        } catch (_) {}
                        history.replaceState('', document.title, window.location.pathname + window.location.search);
                    }
                } catch(_) {}
            })();

            // Auto-open modals on index based on query params (?showLogin=true or ?showRegister=true)
            (function openModalFromQuery(){
                try {
                    const params = new URLSearchParams(window.location.search || '');
                    const wantLogin = ((params.get('showLogin') || '').toLowerCase() === 'true') || params.get('showLogin') === '1';
                    const wantRegister = ((params.get('showRegister') || '').toLowerCase() === 'true') || params.get('showRegister') === '1';
                    if (!wantLogin && !wantRegister) return;

                    const loginModalEl = document.getElementById('login-modal');
                    const registerModalEl = document.getElementById('register-modal');

                    if (wantRegister && typeof openModal === 'function' && registerModalEl) {
                        openModal(registerModalEl);
                        try { window.initGoogleSignUpButtonSoon && window.initGoogleSignUpButtonSoon(); } catch (_) {}
                    } else if (wantLogin && typeof openModal === 'function' && loginModalEl) {
                        openModal(loginModalEl);
                        try {
                            if (typeof window.initGoogleLoginButtonSoon === 'function') window.initGoogleLoginButtonSoon();
                        } catch (_) {}
                    }

                    // Clean URL so refresh/back doesn't reopen unintentionally
                    try {
                        params.delete('showLogin');
                        params.delete('showRegister');
                        const newQs = params.toString();
                        const newUrl = window.location.pathname + (newQs ? ('?' + newQs) : '');
                        history.replaceState('', document.title, newUrl);
                    } catch (_) {}
                } catch(_) {}
            })();

            ensureHandler(loginBtnEl, 'login');
            ensureHandler(mLoginBtnEl, 'login');
            ensureHandler(registerBtnEl, 'register');
            ensureHandler(mRegisterBtnEl, 'register');
        } catch(_) {}
    })();

    // Active navbar link highlight
    (function highlightActiveNav() {
        try {
            const path = (window.location.pathname || '').split('/').pop() || 'index.html';
            const href = window.location.href;
            const hash = window.location.hash;
            const candidates = Array.from(document.querySelectorAll('header a.nav-link, #mobile-menu a'));
            const isIndex = path === '' || path === 'index.html' || /index\.html$/i.test(href);

            // Map of pages to keywords
            const keys = [
                { key: 'About_temple.html', match: /About_temple\.html$/i },
                { key: 'E_library.html', match: /E_library\.html$/i },
                { key: 'Gallery.html', match: /Gallery\.html$/i },
                { key: 'Pass_booking.html', match: /Pass_booking\.html$/i },
                { key: 'Bhakta_nivas.html', match: /Bhakta_nivas\.html$/i },
                { key: 'Pooja_services.html', match: /Pooja_services\.html$/i },
                { key: 'Live_darshan.html', match: /Live_darshan\.html$/i },
                { key: 'profile.html', match: /profile\.html$/i }
            ];

            // Determine current key
            let currentKey = null;
            if (!isIndex) {
                for (const k of keys) { if (k.match.test(href)) { currentKey = k.key; break; } }
            }
            const isHome = isIndex || hash === '#home';

            candidates.forEach(a => {
                a.classList.remove('active');
                const ahref = a.getAttribute('href') || '';
                if (isHome && (ahref === '#home' || /index\.html$/i.test(ahref))) {
                    a.classList.add('active');
                } else if (currentKey && new RegExp(currentKey.replace('.', '\\.') + '$', 'i').test(ahref)) {
                    a.classList.add('active');
                }
            });
        } catch (_) { /* no-op */ }
    })();

    // Reveal-on-scroll activation
    (function initRevealOnScroll() {
        const els = Array.from(document.querySelectorAll('.reveal'));
        if (!('IntersectionObserver' in window) || els.length === 0) {
            els.forEach(el => el.classList.add('show'));
            return;
        }
        const obs = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('show');
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15 });
        els.forEach(el => obs.observe(el));
    })();

    // Subtle hero parallax effect
    (function initParallax() {
        const parallaxEls = Array.from(document.querySelectorAll('.hero-bg, .hero-parallax'));
        if (parallaxEls.length === 0) return;
        const apply = () => {
            const y = window.scrollY || window.pageYOffset || 0;
            parallaxEls.forEach(el => {
                const intensity = 0.25; // gentle
                el.style.backgroundPosition = `center calc(50% + ${Math.round(y * intensity)}px)`;
            });
        };
        apply();
        window.addEventListener('scroll', apply, { passive: true });
    })();

    // Scroll-to-top button
    (function initScrollTop() {
        if (document.getElementById('scrollTopBtn')) return;
        const btn = document.createElement('button');
        btn.id = 'scrollTopBtn';
        btn.setAttribute('aria-label', 'Scroll to top');
        btn.innerHTML = '↑';
        document.body.appendChild(btn);
        const toggle = () => {
            if (window.scrollY > 220) btn.classList.add('show');
            else btn.classList.remove('show');
        };
        window.addEventListener('scroll', toggle, { passive: true });
        toggle();
        btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    })();

    // Navbar scroll effect (glassmorphism enhancement)
    const siteHeader = document.getElementById('site-header');
    const handleHeaderScroll = () => {
        if (!siteHeader) return;
        if (window.scrollY > 10) siteHeader.classList.add('nav-scrolled');
        else siteHeader.classList.remove('nav-scrolled');
    };
    handleHeaderScroll();
    window.addEventListener('scroll', handleHeaderScroll, { passive: true });

    if (!window.__vitthalNavbarBound) {
        window.__vitthalNavbarBound = true;

        // Online Services Dropdown Functionality
        const onlineServicesBtn = document.getElementById('online-services-btn');
        const onlineServicesMenu = document.getElementById('online-services-menu');
        const onlineServicesDropdown = document.getElementById('online-services-dropdown');

        if (onlineServicesBtn && onlineServicesMenu) {
            // Toggle dropdown on button click
            onlineServicesBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();

                const isExpanded = onlineServicesBtn.getAttribute('aria-expanded') === 'true';
                
                if (isExpanded) {
                    onlineServicesMenu.classList.add('hidden');
                    onlineServicesBtn.setAttribute('aria-expanded', 'false');
                } else {
                    onlineServicesMenu.classList.remove('hidden');
                    onlineServicesBtn.setAttribute('aria-expanded', 'true');
                }
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!onlineServicesDropdown.contains(e.target)) {
                    onlineServicesMenu.classList.add('hidden');
                    onlineServicesBtn.setAttribute('aria-expanded', 'false');
                }
            });

            // Close dropdown when pressing Escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    onlineServicesMenu.classList.add('hidden');
                    onlineServicesBtn.setAttribute('aria-expanded', 'false');
                }
            });
        }

        // Mobile menu toggle
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        const mobileMenu = document.getElementById('mobile-menu');

        if (mobileMenuBtn && mobileMenu) {
            mobileMenuBtn.addEventListener('click', () => {
                mobileMenu.classList.toggle('hidden');
            });
        }
    }

    // Get DOM elements
    const loginBtn = document.getElementById('loginBtn');
    const mobileLoginBtn = document.getElementById('mobile-login-btn');
    const loginModal = document.getElementById('login-modal');
    const closeLoginModalBtn = document.getElementById('close-login-modal-btn');
    const loginForm = document.getElementById('login-form');
    const loginMessage = document.getElementById('login-message');
    let googleSignInHost = document.getElementById('googleSignInBtn');

    // Google Identity Services (GIS) should be initialized only once per page.
    // Re-initializing multiple times (e.g. login + register) can cause popup issues like postMessage null errors.
    let gsiInitialized = false;
    let gsiClientId = '';
    let gsiOnCredential = null;
    let gsiOnError = null;
    let gsiCodeClient = null;
    let gsiCodeMode = false;
    let gsiCodeTarget = 'login';

    function getGoogleClientId() {
        let clientId = '';
        try {
            const meta = document.querySelector('meta[name="google-client-id"]');
            clientId = (meta && meta.getAttribute('content')) ? meta.getAttribute('content').trim() : '';
        } catch (_) {
            clientId = '';
        }
        if (!clientId) {
            try { clientId = localStorage.getItem('GOOGLE_CLIENT_ID') || ''; } catch(_) { clientId = ''; }
        }
        return (clientId || '').trim();
    }

    function ensureGsiInitialized() {
        if (!(window.google && window.google.accounts && window.google.accounts.id)) return false;
        if (gsiInitialized) return true;

        gsiClientId = getGoogleClientId();
        if (!gsiClientId) return false;

        try {
            window.google.accounts.id.initialize({
                client_id: gsiClientId,
                ux_mode: 'popup',
                auto_select: false,
                itp_support: true,
                callback: (resp) => {
                    try {
                        if (resp && resp.credential && typeof gsiOnCredential === 'function') {
                            gsiOnCredential(resp.credential);
                        }
                    } catch (e) {
                        console.error('GIS callback error:', e);
                    }
                },
                error_callback: (err) => {
                    console.error('Google Identity error:', err);
                    try {
                        if (typeof gsiOnError === 'function') gsiOnError(err);
                    } catch (e) {
                        console.error('GIS error handler error:', e);
                    }
                }
            });
            gsiInitialized = true;
            return true;
        } catch (e) {
            console.error('Failed to initialize GIS:', e);
            return false;
        }
    }

    function loadGoogleIdentityScript(onReady) {
        const hasGoogle = () => !!(window.google && window.google.accounts && (window.google.accounts.oauth2 || window.google.accounts.id));
        if (hasGoogle()) {
            try { onReady && onReady(); } catch (_) {}
            return;
        }

        const existing = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
        if (!existing) {
            const s = document.createElement('script');
            s.src = 'https://accounts.google.com/gsi/client';
            s.async = true;
            s.defer = true;
            s.onload = () => { try { onReady && onReady(); } catch (_) {} };
            s.onerror = () => {
                try {
                    const el = (typeof getAuthMessageEl === 'function') ? getAuthMessageEl('login') : (loginMessage || null);
                    if (el) {
                        el.classList.remove('hidden');
                        el.textContent = 'Google script blocked or failed to load. Disable adblock/VPN and allow third-party cookies.';
                        el.style.color = '#EF4444';
                    }
                } catch (_) {}
            };
            document.head.appendChild(s);
        }

        let tries = 0;
        const intId = setInterval(() => {
            tries += 1;
            if (hasGoogle()) {
                clearInterval(intId);
                try { onReady && onReady(); } catch (_) {}
            } else if (tries > 40) {
                clearInterval(intId);
            }
        }, 150);
    }

    function ensureGoogleSignInHostStandalone() {
        googleSignInHost = document.getElementById('googleSignInBtn');
        return googleSignInHost;
    }

    function initGoogleLoginButton(target = 'login') {
        ensureGoogleSignInHostStandalone();
        if (!googleSignInHost) return;

        // Avoid repeated renders into the same host
        if (googleSignInHost.dataset && googleSignInHost.dataset.gsiRendered === 'true') return;

        // Ensure host is empty before GIS injects its iframe/button
        try { googleSignInHost.innerHTML = ''; } catch (_) {}

        loadGoogleIdentityScript(() => {
            // Prefer OAuth2 code flow (uses backend client secret) if available
            try {
                if (ensureGsiCodeClient()) {
                    gsiCodeMode = true;
                    gsiCodeTarget = target || 'login';
                    googleSignInHost.innerHTML = '';

                    const btn = document.createElement('button');
                    btn.type = 'button';
                    btn.className = 'w-full bg-white border border-gray-300 text-gray-800 py-2.5 rounded-xl font-semibold';
                    btn.textContent = 'Continue with Google';
                    btn.addEventListener('click', () => {
                        try { gsiCodeClient.requestCode(); } catch (e) { console.error('requestCode failed:', e); }
                    });
                    googleSignInHost.appendChild(btn);
                    try { googleSignInHost.dataset.gsiRendered = 'true'; } catch (_) {}
                    return;
                }
            } catch (_) {}

            // Fallback: ID token flow
            if (!ensureGsiInitialized()) {
                googleSignInHost.innerHTML = '<button type="button" class="w-full bg-white border border-gray-300 text-gray-800 py-2.5 rounded-xl font-semibold" disabled>Google login not configured</button>';
                return;
            }

            try {
                window.google.accounts.id.renderButton(googleSignInHost, {
                    theme: 'outline',
                    size: 'large',
                    text: 'continue_with',
                    shape: 'pill',
                    width: 320
                });
                try { googleSignInHost.dataset.gsiRendered = 'true'; } catch (_) {}
            } catch (e) {
                console.error('Failed to render Google button:', e);
            }
        });
    }

    // Expose a safe initializer globally so standalone pages (login.html) can render the Google button
    try { window.initGoogleLoginButton = initGoogleLoginButton; } catch (_) {}

    function getAuthMessageEl(target) {
        if (target === 'register') return registerMessage || null;
        return loginMessage || null;
    }

    function getAuthModalEl(target) {
        if (target === 'register') return (typeof registerModal !== 'undefined' ? registerModal : null);
        return loginModal || null;
    }

    function applyAuthSuccess(data, target) {
        isLoggedIn = true;
        currentUser = data?.user?.username || data?.user?.full_name || 'User';
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('currentUser', currentUser);
        try { localStorage.setItem('auth_user', JSON.stringify(data?.user || {})); } catch (_) {}
        if (data?.tokens?.access) {
            localStorage.setItem('accessToken', data.tokens.access);
            localStorage.setItem('refreshToken', data.tokens.refresh || '');
            localStorage.setItem('access_token', data.tokens.access);
            localStorage.setItem('refresh_token', data.tokens.refresh || '');
        }
        if (data?.user?.id) localStorage.setItem('userId', data.user.id);

        try { updateAuthUI(); } catch (_) {}

        const modal = getAuthModalEl(target);
        if (modal) {
            try { closeModal(modal); } catch (_) {}
        }

        const dest = consumeRedirectAfterLogin();
        window.location.href = dest || 'profile.html';
    }

    function showAuthError(message, target) {
        const el = getAuthMessageEl(target);
        if (!el) return;
        el.classList.remove('hidden');
        el.textContent = message;
        el.style.color = '#EF4444';
    }

    function showAuthStatus(message, target) {
        const el = getAuthMessageEl(target);
        if (!el) return;
        el.classList.remove('hidden');
        el.textContent = message;
        el.style.color = '#B8860B';
    }

    async function exchangeGoogleCode(code, target = 'login') {
        showAuthStatus('Signing in with Google...', target);

        try {
            const response = await fetch(`${API_BASE}/api/auth/google-code/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code, redirect_uri: 'postmessage' })
            });

            let data = null;
            let rawText = '';
            try { data = await response.clone().json(); } catch(_) { try { rawText = await response.text(); } catch(_) {} }

            if (!response.ok) {
                let msg = 'Google login failed.';
                if (data && typeof data === 'object' && data.detail) msg = data.detail;
                else if (rawText) msg = `${response.status} ${response.statusText}: ${rawText.substring(0, 200)}`;
                showAuthError(msg, target);
                return;
            }

            const el = getAuthMessageEl(target);
            if (el) {
                el.classList.remove('hidden');
                const successMsg = (data && typeof data === 'object' && data.message) ? data.message : 'Login successful! Redirecting to profile...';
                el.textContent = successMsg;
                el.style.color = '#10B981';
            }

            setTimeout(() => applyAuthSuccess(data, target), 1200);
        } catch (error) {
            console.error('Google code login error:', error);
            showAuthError('Network error. Please try again.', target);
        }
    }

    function ensureGsiCodeClient() {
        if (!(window.google && window.google.accounts && window.google.accounts.oauth2)) return false;
        if (gsiCodeClient) return true;

        const clientId = getGoogleClientId();
        if (!clientId) return false;

        try {
            gsiCodeClient = window.google.accounts.oauth2.initCodeClient({
                client_id: clientId,
                scope: 'openid email profile',
                ux_mode: 'popup',
                callback: (resp) => {
                    if (resp && resp.code) {
                        exchangeGoogleCode(resp.code, gsiCodeTarget || 'login');
                    } else {
                        const msg = resp && resp.error ? resp.error : 'unknown_error';
                        showAuthError('Google sign-in failed: ' + msg, gsiCodeTarget || 'login');
                    }
                }
            });
            return true;
        } catch (e) {
            console.error('Failed to init Google code client:', e);
            return false;
        }
    }

    // Login Modal Event Listeners
    if (loginBtn && loginModal && closeLoginModalBtn && loginForm && loginMessage) {
        function ensureGoogleSignInHost() {
            googleSignInHost = document.getElementById('googleSignInBtn');
            if (googleSignInHost) return;

            const adminLink = loginForm.querySelector('a[href*="Admin_login.html"]');
            const insertBeforeNode = adminLink ? adminLink.closest('div') : null;

            const sep = document.createElement('div');
            sep.className = 'relative py-2';
            sep.innerHTML = '<div class="absolute inset-0 flex items-center"><div class="w-full border-t border-gray-200"></div></div><div class="relative flex justify-center"><span class="bg-white px-3 text-xs text-gray-500">OR</span></div>';

            const host = document.createElement('div');
            host.id = 'googleSignInBtn';
            host.className = 'w-full flex justify-center';

            if (insertBeforeNode) {
                loginForm.insertBefore(sep, insertBeforeNode);
                loginForm.insertBefore(host, insertBeforeNode);
            } else {
                loginForm.appendChild(sep);
                loginForm.appendChild(host);
            }
            googleSignInHost = host;
        }

        function loadGoogleIdentityScript(onReady) {
            const hasGoogle = () => !!(window.google && window.google.accounts && (window.google.accounts.oauth2 || window.google.accounts.id));
            if (hasGoogle()) {
                onReady();
                return;
            }

            const existing = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
            if (!existing) {
                const s = document.createElement('script');
                s.src = 'https://accounts.google.com/gsi/client';
                s.async = true;
                s.defer = true;
                s.onload = () => onReady();
                s.onerror = () => {
                    try {
                        loginMessage.classList.remove('hidden');
                        loginMessage.textContent = 'Google script blocked or failed to load. Disable adblock/VPN and allow third-party cookies.';
                        loginMessage.style.color = '#EF4444';
                    } catch (_) {}
                };
                document.head.appendChild(s);
            }

            let tries = 0;
            const intId = setInterval(() => {
                tries += 1;
                if (hasGoogle()) {
                    clearInterval(intId);
                    onReady();
                } else if (tries > 40) {
                    clearInterval(intId);
                }
            }, 150);
        }

        async function exchangeGoogleCredential(credential) {
            loginMessage.classList.remove('hidden');
            loginMessage.textContent = 'Signing in with Google...';
            loginMessage.style.color = '#B8860B';

            try {
                const response = await fetch(`${API_BASE}/api/auth/google-login/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ credential })
                });

                let data = null;
                let rawText = '';
                try { data = await response.clone().json(); } catch(_) { try { rawText = await response.text(); } catch(_) {} }

                if (!response.ok) {
                    let msg = 'Google login failed.';
                    if (data && typeof data === 'object' && data.detail) msg = data.detail;
                    else if (rawText) msg = `${response.status} ${response.statusText}: ${rawText.substring(0, 200)}`;
                    loginMessage.textContent = msg;
                    loginMessage.style.color = '#EF4444';
                    return;
                }

                isLoggedIn = true;
                currentUser = data?.user?.username || data?.user?.full_name || 'User';
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('currentUser', currentUser);
                if (data?.tokens?.access) {
                    localStorage.setItem('accessToken', data.tokens.access);
                    localStorage.setItem('refreshToken', data.tokens.refresh || '');
                    localStorage.setItem('access_token', data.tokens.access);
                    localStorage.setItem('refresh_token', data.tokens.refresh || '');
                }
                if (data?.user?.id) localStorage.setItem('userId', data.user.id);

                loginMessage.textContent = (data && typeof data === 'object' && data.message) ? data.message : 'Login successful! Redirecting to profile...';
                loginMessage.style.color = '#10B981';

                setTimeout(() => {
                    closeModal(loginModal);
                    updateAuthUI();
                    const dest = consumeRedirectAfterLogin();
                    window.location.href = dest || 'profile.html';
                }, 1200);
            } catch (error) {
                console.error('Google login error:', error);
                loginMessage.textContent = 'Network error. Please try again.';
                loginMessage.style.color = '#EF4444';
            }
        }

        function initGoogleButton() {
            ensureGoogleSignInHost();
            if (!googleSignInHost) return;

            // Avoid repeated renders into the same host (can break GIS popup messaging)
            if (googleSignInHost.dataset && googleSignInHost.dataset.gsiRendered === 'true') {
                return;
            }

            // Ensure host is empty before GIS injects its iframe/button
            try { googleSignInHost.innerHTML = ''; } catch(_) {}

            // Route GIS credential/error to the login flow
            gsiOnCredential = (cred) => exchangeGoogleCredential(cred);
            gsiOnError = (err) => {
                loginMessage.classList.remove('hidden');
                let details = '';
                try { details = err ? (typeof err === 'string' ? err : JSON.stringify(err)) : ''; } catch(_) { details = ''; }
                loginMessage.textContent = 'Google sign-in failed: ' + (details || 'unknown error');
                loginMessage.style.color = '#EF4444';
            };

            // Prefer OAuth2 code flow (uses backend client secret) if available
            if (ensureGsiCodeClient()) {
                gsiCodeMode = true;
                gsiCodeTarget = 'login';
                googleSignInHost.innerHTML = '';
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'w-full bg-white border border-gray-300 text-gray-800 py-2.5 rounded-xl font-semibold';
                btn.textContent = 'Continue with Google';
                btn.addEventListener('click', () => {
                    try { gsiCodeClient.requestCode(); } catch (e) { console.error('requestCode failed:', e); }
                });
                googleSignInHost.appendChild(btn);
                try { googleSignInHost.dataset.gsiRendered = 'true'; } catch(_) {}
                return;
            }

            if (!ensureGsiInitialized()) {
                googleSignInHost.innerHTML = '<button type="button" class="w-full bg-white border border-gray-300 text-gray-800 py-2.5 rounded-xl font-semibold" disabled>Google login not configured</button>';
                return;
            }

            try {
                window.google.accounts.id.renderButton(googleSignInHost, {
                    theme: 'outline',
                    size: 'large',
                    text: 'continue_with',
                    shape: 'pill',
                    width: 320
                });
                try { googleSignInHost.dataset.gsiRendered = 'true'; } catch(_) {}
            } catch (e) {
                console.error('Failed to render Google button:', e);
            }
        }

        function initGoogleButtonSoon() {
            ensureGoogleSignInHost();
            if (googleSignInHost && googleSignInHost.dataset && googleSignInHost.dataset.gsiRendered === 'true') {
                return;
            }
            if (googleSignInHost) {
                const hasContent = (googleSignInHost.childElementCount || 0) > 0;
                if (!hasContent) {
                    googleSignInHost.innerHTML = '<button type="button" class="w-full bg-white border border-gray-300 text-gray-800 py-2.5 rounded-xl font-semibold" disabled>Loading Google sign-in...</button>';
                }
            }

            let done = false;
            loadGoogleIdentityScript(() => {
                done = true;
                initGoogleButton();
                setTimeout(initGoogleButton, 600);
            });

            setTimeout(() => {
                if (done) return;
                try {
                    initGoogleButton();
                    if (googleSignInHost && !(googleSignInHost.dataset && googleSignInHost.dataset.gsiRendered === 'true')) {
                        googleSignInHost.innerHTML = '<button type="button" class="w-full bg-white border border-gray-300 text-gray-800 py-2.5 rounded-xl font-semibold" disabled>Google sign-in unavailable (script blocked)</button>';
                    }
                } catch(_) {}
            }, 6500);
        }

        loginBtn.addEventListener('click', () => {
            openModal(loginModal);
            try {
                if (typeof initGoogleButtonSoon === 'function') initGoogleButtonSoon();
                else if (typeof window.initGoogleLoginButton === 'function') window.initGoogleLoginButton('login');
            } catch (_) {
                try { if (typeof window.initGoogleLoginButton === 'function') window.initGoogleLoginButton('login'); } catch (_) {}
            }
        });
        
        if (mobileLoginBtn) {
            mobileLoginBtn.addEventListener('click', () => {
                if (mobileMenu) closeModal(mobileMenu);
                openModal(loginModal);
                try {
                    if (typeof initGoogleButtonSoon === 'function') initGoogleButtonSoon();
                    else if (typeof window.initGoogleLoginButton === 'function') window.initGoogleLoginButton('login');
                } catch (_) {
                    try { if (typeof window.initGoogleLoginButton === 'function') window.initGoogleLoginButton('login'); } catch (_) {}
                }
            });
        }

        // If the modal is opened by any other mechanism (e.g. URL param, other script),
        // ensure the Google button is still initialized.
        try {
            const obs = new MutationObserver(() => {
                const isOpen = loginModal && !loginModal.classList.contains('hidden');
                if (isOpen) {
                    try {
                        if (!(googleSignInHost && googleSignInHost.dataset && googleSignInHost.dataset.gsiRendered === 'true')) {
                            initGoogleButtonSoon();
                        }
                    } catch (_) {
                        initGoogleButtonSoon();
                    }
                }
            });
            if (loginModal) {
                obs.observe(loginModal, { attributes: true, attributeFilter: ['class', 'style'] });
            }
        } catch (_) {}
        
        closeLoginModalBtn.addEventListener('click', () => closeModal(loginModal));
        
        loginModal.addEventListener('click', (e) => {
            if (e.target === loginModal) {
                closeModal(loginModal);
            }
        });

        // Login form submission
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            loginMessage.classList.remove('hidden');
            loginMessage.textContent = 'Signing in...';
            loginMessage.style.color = '#B8860B';

            const username = loginForm['username'].value;
            const password = loginForm['password'].value;

            try {
                const response = await fetch(`${API_BASE}/api/auth/login/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        username: username,
                        password: password
                    })
                });

                // Try to parse JSON; if not JSON, capture text for better diagnostics
                let data = null;
                let rawText = '';
                try { 
                    data = await response.clone().json(); 
                } catch(jsonErr) { 
                    try { 
                        rawText = await response.text(); 
                        console.error('Response is not JSON:', rawText.substring(0, 200));
                    } catch(_) {} 
                }

                if (response.ok && data) {
                    isLoggedIn = true;
                    currentUser = data?.user?.username || username;
                    localStorage.setItem('isLoggedIn', 'true');
                    localStorage.setItem('currentUser', currentUser);
                    // Store tokens under both legacy and JWT-friendly keys
                    if (data?.tokens?.access) {
                        localStorage.setItem('accessToken', data.tokens.access);
                        localStorage.setItem('refreshToken', data.tokens.refresh || '');
                        localStorage.setItem('access_token', data.tokens.access);
                        localStorage.setItem('refresh_token', data.tokens.refresh || '');
                    }
                    if (data?.user?.id) localStorage.setItem('userId', data.user.id);
                    
                    loginMessage.textContent = (data && typeof data === 'object' && data.message) ? data.message : 'Login successful! Redirecting...';
                    loginMessage.style.color = '#10B981';
                    
                    setTimeout(() => {
                        // Hide message and close modal
                        loginMessage.classList.add('hidden');
                        loginMessage.textContent = '';
                        closeModal(loginModal);
                        updateAuthUI();
                        const dest = consumeRedirectAfterLogin();
                        window.location.href = dest || 'profile.html';
                    }, 1200);
                } else {
                    let errorMessage = 'Login failed. Please check your credentials.';
                    if (data && typeof data === 'object') {
                        if (data.detail) errorMessage = data.detail;
                        else if (data.non_field_errors) errorMessage = Array.isArray(data.non_field_errors) ? data.non_field_errors[0] : data.non_field_errors;
                        else if (data.username) errorMessage = Array.isArray(data.username) ? data.username[0] : data.username;
                        else if (data.password) errorMessage = Array.isArray(data.password) ? data.password[0] : data.password;
                    } else if (rawText && rawText.includes('<!DOCTYPE')) {
                        errorMessage = 'Server error: Received HTML instead of JSON. Please check your backend configuration.';
                    } else if (rawText) {
                        errorMessage = `Server error (${response.status}): Please try again.`;
                    }
                    
                    loginMessage.textContent = errorMessage;
                    loginMessage.style.color = '#EF4444';
                }
            } catch (error) {
                console.error('Login error:', error);
                loginMessage.textContent = 'Network error: ' + error.message;
                loginMessage.style.color = '#EF4444';
            }
        });

        // Login password toggle
        const toggleLoginPasswordBtn = document.getElementById('toggle-login-password');
        const loginPasswordInput = document.getElementById('login-password');

        if (toggleLoginPasswordBtn && loginPasswordInput) {
            toggleLoginPasswordBtn.addEventListener('click', function() {
                const type = loginPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                loginPasswordInput.setAttribute('type', type);
                
                const icon = toggleLoginPasswordBtn.querySelector('i');
                if (icon) {
                    if (type === 'text') {
                        icon.classList.remove('fa-eye');
                        icon.classList.add('fa-eye-slash');
                    } else {
                        icon.classList.remove('fa-eye-slash');
                        icon.classList.add('fa-eye');
                    }
                }
            });
        }
    }

    // Standalone login page support (no modal)
    // If the page contains the login form elements but not the modal triggers, wire them up here.
    if ((!loginModal || !closeLoginModalBtn) && loginForm && loginMessage) {
        // Ensure Google host exists
        googleSignInHost = document.getElementById('googleSignInBtn');

        // Initialize Google button on page load
        try {
            if (typeof window.initGoogleLoginButton === 'function') {
                window.initGoogleLoginButton('login');
            }
        } catch (_) {}

        // Login form submission
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            loginMessage.classList.remove('hidden');
            loginMessage.textContent = 'Signing in...';
            loginMessage.style.color = '#B8860B';

            const username = loginForm['username'].value;
            const password = loginForm['password'].value;

            try {
                const response = await fetch(`${API_BASE}/api/auth/login/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });

                let data = null;
                let rawText = '';
                try { 
                    data = await response.clone().json(); 
                } catch(jsonErr) { 
                    try { 
                        rawText = await response.text(); 
                        console.error('Response is not JSON:', rawText.substring(0, 200));
                    } catch(_) {} 
                }

                if (response.ok && data) {
                    isLoggedIn = true;
                    currentUser = data?.user?.username || username;
                    localStorage.setItem('isLoggedIn', 'true');
                    localStorage.setItem('currentUser', currentUser);
                    if (data?.tokens?.access) {
                        localStorage.setItem('accessToken', data.tokens.access);
                        localStorage.setItem('refreshToken', data.tokens.refresh || '');
                        localStorage.setItem('access_token', data.tokens.access);
                        localStorage.setItem('refresh_token', data.tokens.refresh || '');
                    }
                    if (data?.user?.id) localStorage.setItem('userId', data.user.id);

                    loginMessage.textContent = (data && typeof data === 'object' && data.message) ? data.message : 'Login successful! Redirecting...';
                    loginMessage.style.color = '#10B981';

                    setTimeout(() => {
                        // Hide message before redirect
                        loginMessage.classList.add('hidden');
                        loginMessage.textContent = '';
                        try { updateAuthUI(); } catch (_) {}
                        const dest = consumeRedirectAfterLogin();
                        window.location.href = dest || 'profile.html';
                    }, 1000);
                } else {
                    let errorMessage = 'Login failed. Please check your credentials.';
                    if (data && typeof data === 'object') {
                        if (data.detail) errorMessage = data.detail;
                        else if (data.non_field_errors) errorMessage = Array.isArray(data.non_field_errors) ? data.non_field_errors[0] : data.non_field_errors;
                        else if (data.username) errorMessage = Array.isArray(data.username) ? data.username[0] : data.username;
                        else if (data.password) errorMessage = Array.isArray(data.password) ? data.password[0] : data.password;
                    } else if (rawText && rawText.includes('<!DOCTYPE')) {
                        errorMessage = 'Server error: Received HTML instead of JSON. Please check your backend configuration.';
                    } else if (rawText) {
                        errorMessage = `Server error (${response.status}): Please try again.`;
                    }
                    loginMessage.textContent = errorMessage;
                    loginMessage.style.color = '#EF4444';
                }
            } catch (error) {
                console.error('Login error:', error);
                loginMessage.textContent = 'Network error: ' + error.message;
                loginMessage.style.color = '#EF4444';
            }
        });
                console.error('Login error:', error);
                loginMessage.textContent = 'Network error. Please try again.';
                loginMessage.style.color = '#EF4444';
            }
        });

        // Password toggle
        const toggleLoginPasswordBtn = document.getElementById('toggle-login-password');
        const loginPasswordInput = document.getElementById('login-password');
        if (toggleLoginPasswordBtn && loginPasswordInput) {
            toggleLoginPasswordBtn.addEventListener('click', function() {
                const type = loginPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                loginPasswordInput.setAttribute('type', type);

                const icon = toggleLoginPasswordBtn.querySelector('i');
                if (icon) {
                    if (type === 'text') {
                        icon.classList.remove('fa-eye');
                        icon.classList.add('fa-eye-slash');
                    } else {
                        icon.classList.remove('fa-eye-slash');
                        icon.classList.add('fa-eye');
                    }
                }
            });
        }
    }

    // If a page has a Login button but no modal, clicking should go to the dedicated page.
    if (loginBtn && !loginModal) {
        loginBtn.addEventListener('click', () => {
            try { window.location.href = '/login.html'; } catch (_) {}
        });
    }

    // (moved) Modal switch links are set up after both modals are defined below

    // Registration Modal
    const registerBtn = document.getElementById('registerBtn');
    const mobileRegisterBtn = document.getElementById('mobile-register-btn');
    const registerModal = document.getElementById('register-modal');
    const closeRegisterModalBtn = document.getElementById('close-register-modal-btn');
    const registerForm = document.getElementById('register-form');
    const registerMessage = document.getElementById('register-message');
    let googleSignUpHost = document.getElementById('googleSignUpBtn');

    // Now that registerModal is defined, wire up modal switch links (Login <-> Register)
    const switchToRegister = document.getElementById('switch-to-register');
    const switchToLogin = document.getElementById('switch-to-login');

    if (switchToRegister && typeof loginModal !== 'undefined' && loginModal && registerModal) {
        switchToRegister.addEventListener('click', (e) => {
            e.preventDefault();
            closeModal(loginModal);
            setTimeout(() => {
                openModal(registerModal);
                try { initGoogleSignUpButtonSoon(); } catch(_) {}
            }, 300);
        });
    }

    if (switchToLogin && typeof loginModal !== 'undefined' && loginModal && registerModal) {
        switchToLogin.addEventListener('click', (e) => {
            e.preventDefault();
            closeModal(registerModal);
            setTimeout(() => openModal(loginModal), 300);
        });
    }

    if (registerBtn && registerModal && closeRegisterModalBtn && registerForm && registerMessage) {
        function ensureGoogleSignUpHost() {
            googleSignUpHost = document.getElementById('googleSignUpBtn');
            if (googleSignUpHost) return;

            const loginLink = document.getElementById('switch-to-login');
            const insertBeforeNode = loginLink ? loginLink.closest('div') : null;

            const sep = document.createElement('div');
            sep.className = 'relative py-2';
            sep.innerHTML = '<div class="absolute inset-0 flex items-center"><div class="w-full border-t border-gray-200"></div></div><div class="relative flex justify-center"><span class="bg-white px-3 text-xs text-gray-500">OR</span></div>';

            const host = document.createElement('div');
            host.id = 'googleSignUpBtn';
            host.className = 'w-full flex justify-center';

            if (insertBeforeNode) {
                registerForm.insertBefore(sep, insertBeforeNode);
                registerForm.insertBefore(host, insertBeforeNode);
            } else {
                registerForm.appendChild(sep);
                registerForm.appendChild(host);
            }

            googleSignUpHost = host;
        }

        function loadGoogleIdentityScript(onReady) {
            const hasGoogle = () => !!(window.google && window.google.accounts && (window.google.accounts.oauth2 || window.google.accounts.id));
            if (hasGoogle()) {
                onReady();
                return;
            }

            const existing = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
            if (!existing) {
                const s = document.createElement('script');
                s.src = 'https://accounts.google.com/gsi/client';
                s.async = true;
                s.defer = true;
                s.onload = () => onReady();
                s.onerror = () => {
                    try {
                        registerMessage.classList.remove('hidden');
                        registerMessage.textContent = 'Google script blocked or failed to load. Disable adblock/VPN and allow third-party cookies.';
                        registerMessage.style.color = '#EF4444';
                    } catch (_) {}
                };
                document.head.appendChild(s);
            }

            let tries = 0;
            const intId = setInterval(() => {
                tries += 1;
                if (hasGoogle()) {
                    clearInterval(intId);
                    onReady();
                } else if (tries > 40) {
                    clearInterval(intId);
                }
            }, 150);
        }

        async function exchangeGoogleCredentialForRegister(credential) {
            registerMessage.classList.remove('hidden');
            registerMessage.textContent = 'Signing up with Google...';
            registerMessage.style.color = '#B8860B';

            try {
                const response = await fetch(`${API_BASE}/api/auth/google-login/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ credential })
                });

                let data = null;
                let rawText = '';
                try { data = await response.clone().json(); } catch(_) { try { rawText = await response.text(); } catch(_) {} }

                if (!response.ok) {
                    let msg = 'Google sign up failed.';
                    if (data && typeof data === 'object' && data.detail) msg = data.detail;
                    else if (rawText) msg = `${response.status} ${response.statusText}: ${rawText.substring(0, 200)}`;
                    registerMessage.textContent = msg;
                    registerMessage.style.color = '#EF4444';
                    return;
                }

                isLoggedIn = true;
                currentUser = data?.user?.username || data?.user?.full_name || 'User';
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('currentUser', currentUser);
                if (data?.tokens?.access) {
                    localStorage.setItem('accessToken', data.tokens.access);
                    localStorage.setItem('refreshToken', data.tokens.refresh || '');
                    localStorage.setItem('access_token', data.tokens.access);
                    localStorage.setItem('refresh_token', data.tokens.refresh || '');
                }
                if (data?.user?.id) localStorage.setItem('userId', data.user.id);

                registerMessage.textContent = 'Success! Redirecting...';
                registerMessage.style.color = '#10B981';

                setTimeout(() => {
                    closeModal(registerModal);
                    updateAuthUI();
                    const dest = consumeRedirectAfterLogin();
                    window.location.href = dest || 'profile.html';
                }, 800);
            } catch (error) {
                console.error('Google sign up error:', error);
                registerMessage.textContent = 'Network error. Please try again.';
                registerMessage.style.color = '#EF4444';
            }
        }

        function initGoogleSignUpButton() {
            ensureGoogleSignUpHost();
            if (!googleSignUpHost) return;

            // Avoid repeated renders into the same host (can break GIS popup messaging)
            if (googleSignUpHost.dataset && googleSignUpHost.dataset.gsiRendered === 'true') {
                return;
            }

            // Ensure host is empty before GIS injects its iframe/button
            try { googleSignUpHost.innerHTML = ''; } catch(_) {}

            // Route GIS credential/error to the register flow (reuse single GIS init)
            gsiOnCredential = (cred) => exchangeGoogleCredentialForRegister(cred);
            gsiOnError = (err) => {
                registerMessage.classList.remove('hidden');
                let details = '';
                try { details = err ? (typeof err === 'string' ? err : JSON.stringify(err)) : ''; } catch(_) { details = ''; }
                registerMessage.textContent = 'Google sign-up failed: ' + (details || 'unknown error');
                registerMessage.style.color = '#EF4444';
            };

            // Prefer OAuth2 code flow (uses backend client secret) if available
            if (ensureGsiCodeClient()) {
                gsiCodeMode = true;
                gsiCodeTarget = 'register';
                googleSignUpHost.innerHTML = '';
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'w-full bg-white border border-gray-300 text-gray-800 py-2.5 rounded-xl font-semibold';
                btn.textContent = 'Continue with Google';
                btn.addEventListener('click', () => {
                    try { gsiCodeClient.requestCode(); } catch (e) { console.error('requestCode failed:', e); }
                });
                googleSignUpHost.appendChild(btn);
                try { googleSignUpHost.dataset.gsiRendered = 'true'; } catch(_) {}
                return;
            }

            if (!ensureGsiInitialized()) {
                googleSignUpHost.innerHTML = '<button type="button" class="w-full bg-white border border-gray-300 text-gray-800 py-2.5 rounded-xl font-semibold" disabled>Google login not configured</button>';
                return;
            }

            try {
                window.google.accounts.id.renderButton(googleSignUpHost, {
                    theme: 'outline',
                    size: 'large',
                    text: 'continue_with',
                    shape: 'pill',
                    width: 320
                });
                try { googleSignUpHost.dataset.gsiRendered = 'true'; } catch(_) {}
            } catch (e) {
                console.error('Failed to render Google sign-up button:', e);
            }
        }

        function initGoogleSignUpButtonSoon() {
            ensureGoogleSignUpHost();
            if (googleSignUpHost) {
                googleSignUpHost.innerHTML = '<button type="button" class="w-full bg-white border border-gray-300 text-gray-800 py-2.5 rounded-xl font-semibold" disabled>Loading Google sign-in...</button>';
            }

            let done = false;
            loadGoogleIdentityScript(() => {
                done = true;
                initGoogleSignUpButton();
                setTimeout(initGoogleSignUpButton, 600);
            });

            setTimeout(() => {
                if (done) return;
                try {
                    initGoogleSignUpButton();
                    if (googleSignUpHost && !(googleSignUpHost.dataset && googleSignUpHost.dataset.gsiRendered === 'true')) {
                        googleSignUpHost.innerHTML = '<button type="button" class="w-full bg-white border border-gray-300 text-gray-800 py-2.5 rounded-xl font-semibold" disabled>Google sign-in unavailable (script blocked)</button>';
                    }
                } catch(_) {}
            }, 6500);
        }

        try { window.initGoogleSignUpButtonSoon = initGoogleSignUpButtonSoon; } catch (_) {}

        registerBtn.addEventListener('click', () => {
            openModal(registerModal);
            initGoogleSignUpButtonSoon();
        });
        
        if (mobileRegisterBtn) {
            mobileRegisterBtn.addEventListener('click', () => {
                if (mobileMenu) closeModal(mobileMenu);
                openModal(registerModal);
                initGoogleSignUpButtonSoon();
            });
        }
        
        closeRegisterModalBtn.addEventListener('click', () => closeModal(registerModal));
        
        registerModal.addEventListener('click', (e) => {
            if (e.target === registerModal) {
                closeModal(registerModal);
            }
        });

        // Profile image preview
        const profileImageInput = document.getElementById('profile-image');
        const imagePreview = document.getElementById('image-preview');
        const imagePreviewImg = document.getElementById('image-preview-img');
        const cameraIcon = document.getElementById('camera-icon');

        if (profileImageInput && imagePreview && imagePreviewImg) {
            profileImageInput.addEventListener('change', function(e) {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = function(ev) {
                        imagePreviewImg.src = ev.target.result;
                        imagePreviewImg.classList.remove('hidden');
                        if (cameraIcon) cameraIcon.classList.add('hidden');
                    };
                    reader.readAsDataURL(file);
                } else {
                    imagePreviewImg.classList.add('hidden');
                    if (cameraIcon) cameraIcon.classList.remove('hidden');
                }
            });
        }

        const mobileInput = document.getElementById('register-mobile');
        if (mobileInput) {
            mobileInput.addEventListener('input', () => {
                mobileInput.value = (mobileInput.value || '').replace(/\D/g, '').slice(0, 10);
                // Clear any previous custom message as the user edits
                try { mobileInput.setCustomValidity(''); } catch(_) {}
            });

            // Show a friendly browser popup message instead of default pattern text
            mobileInput.addEventListener('invalid', () => {
                try { mobileInput.setCustomValidity('Enter valid number'); } catch(_) {}
            });
        }

        // Registration form submission
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            registerMessage.classList.remove('hidden');
            registerMessage.textContent = 'Creating account...';
            registerMessage.style.color = '#B8860B';

            const mobileEl = document.getElementById('register-mobile');
            if (mobileEl) {
                const mobile = (mobileEl.value || '').replace(/\D/g, '');
                mobileEl.value = mobile;
                if (!/^[6-9][0-9]{9}$/.test(mobile)) {
                    try {
                        mobileEl.setCustomValidity('Enter valid number');
                        mobileEl.reportValidity();
                    } catch(_) {}
                    return;
                }
                try { mobileEl.setCustomValidity(''); } catch(_) {}
            }

            const formData = new FormData(registerForm);
            // Ensure required fields exist with correct names
            const pwd = registerForm['password'] ? registerForm['password'].value : '';
            if (!formData.has('password_confirm')) {
                formData.append('password_confirm', pwd);
            }
            // Ensure file field name matches backend expectation
            const fileInput = document.getElementById('profile-image');
            if (fileInput && fileInput.files && fileInput.files[0]) {
                // If some browsers add with a different name, force the correct name
                if (!formData.has('profile_image')) {
                    formData.append('profile_image', fileInput.files[0]);
                }
            }

            try {
                const response = await fetch(`${API_BASE}/api/auth/register/`, {
                    method: 'POST',
                    body: formData
                });

                let data = null;
                let rawText = '';
                try { data = await response.clone().json(); } catch(_) { try { rawText = await response.text(); } catch(_) {} }

                if (response.ok) {
                    registerMessage.textContent = 'Registration successful! Please login.';
                    registerMessage.style.color = '#10B981';
                    
                    setTimeout(() => {
                        closeModal(registerModal);
                        openModal(loginModal);
                    }, 2000);
                } else {
                    let errorMessage = 'Registration failed. Please try again.';
                    if (data && typeof data === 'object') {
                        if (data.username) errorMessage = Array.isArray(data.username) ? data.username[0] : data.username;
                        else if (data.email) errorMessage = Array.isArray(data.email) ? data.email[0] : data.email;
                        else if (data.mobile) errorMessage = Array.isArray(data.mobile) ? data.mobile[0] : data.mobile;
                        else if (data.password) errorMessage = Array.isArray(data.password) ? data.password[0] : data.password;
                        else if (data.non_field_errors) errorMessage = Array.isArray(data.non_field_errors) ? data.non_field_errors[0] : data.non_field_errors;
                        else if (data.detail) errorMessage = data.detail;
                    } else if (rawText) {
                        errorMessage = `${response.status} ${response.statusText}: ${rawText.substring(0, 200)}`;
                    }
                    
                    registerMessage.textContent = errorMessage;
                    registerMessage.style.color = '#EF4444';
                    // Debug: print form keys when failing for easier diagnostics
                    try { console.debug('FormData keys:', Array.from(formData.keys())); } catch (_) {}
                }
            } catch (error) {
                console.error('Registration error:', error);
                registerMessage.textContent = 'Network error. Please try again.';
                registerMessage.style.color = '#EF4444';
            }
        });

        // Registration password toggle
        const toggleRegisterPasswordBtn = document.getElementById('toggle-register-password');
        const registerPasswordInput = document.getElementById('register-password');

        if (toggleRegisterPasswordBtn && registerPasswordInput) {
            toggleRegisterPasswordBtn.addEventListener('click', function() {
                const type = registerPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                registerPasswordInput.setAttribute('type', type);
                
                const icon = toggleRegisterPasswordBtn.querySelector('i');
                if (icon) {
                    if (type === 'text') {
                        icon.classList.remove('fa-eye');
                        icon.classList.add('fa-eye-slash');
                    } else {
                        icon.classList.remove('fa-eye-slash');
                        icon.classList.add('fa-eye');
                    }
                }
            });
        }
    }

    // Logout functionality
    const logoutBtn = document.getElementById('logoutBtn');
    const mobileLogoutBtn = document.getElementById('mobile-logout-btn');

    function handleLogout() {
        isLoggedIn = false;
        currentUser = '';
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('userId');
        updateAuthUI();
        window.location.href = 'index.html';
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    if (mobileLogoutBtn) {
        mobileLogoutBtn.addEventListener('click', handleLogout);
    }

    // Protected routes check
    const protectedLinks = document.querySelectorAll('[data-requires-auth]');
    const authRequiredModal = document.getElementById('auth-required-modal');
    const closeAuthRequiredBtn = document.getElementById('close-auth-required-btn');

    if (authRequiredModal && closeAuthRequiredBtn) {
        closeAuthRequiredBtn.addEventListener('click', () => closeModal(authRequiredModal));
        
        authRequiredModal.addEventListener('click', (e) => {
            if (e.target === authRequiredModal) {
                closeModal(authRequiredModal);
            }
        });

        protectedLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                if (isLoggedIn || hasToken()) return;
                e.preventDefault();
                try {
                    const href = link.getAttribute('href') || '';
                    if (href) sessionStorage.setItem('redirectAfterLogin', href);
                } catch (_) {}
                window.location.href = '/login.html';
            });
        });
    }

    // Chatbot functionality
    // Guard: script_fixed.js can be included on many pages, and other scripts may also bind chatbot handlers.
    // Ensure we only bind once to avoid double responses.
    const shouldBindChatbot = !window.__vitthalChatbotBound;
    if (shouldBindChatbot) window.__vitthalChatbotBound = true;

const chatbotIcon = document.getElementById('chatbot-icon');
const chatbotOverlay = document.getElementById('chatbot-overlay');
const chatbotModal = document.getElementById('chatbot-modal');
const closeChatbotModalBtn = document.getElementById('close-chatbot-modal-btn');
const exitChatbotBtn = document.getElementById('exit-chatbot-btn');
const messagesContainer = document.getElementById('messages');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const voiceBtn = document.getElementById('voice-btn');
const langButtons = document.querySelectorAll('.lang-btn-modal');
const quickActionButtons = document.querySelectorAll('.action-btn-modal');
// Chatbot language state (default English)
let chatLang = 'en';
// restore language from storage if present
try {
    const saved = localStorage.getItem('chatLang');
    if (saved) chatLang = saved;
} catch(_) {}

// Voice input (Web Speech API)
if (shouldBindChatbot && voiceBtn) {
    if (!window.__vitthalChatbotVoiceBound) {
        window.__vitthalChatbotVoiceBound = true;

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        let recognition = null;
        let isListening = false;

        if (!SpeechRecognition) {
            voiceBtn.style.display = 'none';
        } else {
            recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = true;
            recognition.maxAlternatives = 1;

            function setListeningUI(on) {
                isListening = !!on;
                voiceBtn.classList.toggle('is-listening', !!on);
                voiceBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
            }

            recognition.onresult = (event) => {
                let transcript = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    transcript += event.results[i][0]?.transcript || '';
                }
                if (userInput) {
                    userInput.value = (transcript || '').trimStart();
                    userInput.focus();
                }
            };

            recognition.onerror = () => setListeningUI(false);
            recognition.onend = () => setListeningUI(false);

            voiceBtn.addEventListener('click', async () => {
                if (!recognition) return;

                if (isListening) {
                    try { recognition.stop(); } catch (_) {}
                    setListeningUI(false);
                    return;
                }

                try {
                    if (navigator.mediaDevices?.getUserMedia) {
                        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                        stream.getTracks().forEach(t => t.stop());
                    }
                } catch (_) {}

                try {
                    const langMap = { en: 'en-IN', hi: 'hi-IN', mr: 'mr-IN' };
                    recognition.lang = langMap[chatLang] || 'en-IN';
                    setListeningUI(true);
                    recognition.start();
                } catch (_) {
                    setListeningUI(false);
                }
            });
        }
    }
}

function setActiveLangButton() {
    if (!langButtons || !langButtons.length) return;
    langButtons.forEach(btn => {
        const isActive = (btn.getAttribute('data-lang') || 'en') === chatLang;
        btn.classList.toggle('active', isActive);
    });
}

function translateChatbotUI(lang) {
    const isMr = lang === 'mr';

    const headerTitle = document.querySelector('.chat-header h2');
    const headerBadge = document.querySelector('.chat-header .badge');
    if (headerTitle) headerTitle.textContent = isMr ? 'एआय सोबत संभाषण' : 'Chat with AI';
    if (headerBadge) headerBadge.textContent = isMr ? 'ऑनलाइन' : 'Online';

    const langTitle = document.querySelector('.language-selector-modal h3');
    if (langTitle) langTitle.textContent = isMr ? 'भाषा निवडा' : 'Select Language';

    const qaTitle = document.querySelector('.quick-actions-modal h3');
    if (qaTitle) qaTitle.textContent = isMr ? 'झटपट मदत' : 'Quick Actions';

    const qaButtons = document.querySelectorAll('.action-btn-modal');
    if (qaButtons && qaButtons.length) {
        qaButtons.forEach((btn) => {
            const q = (btn.getAttribute('data-query') || '').toLowerCase();
            const iconHtml = btn.querySelector('i') ? btn.querySelector('i').outerHTML : '';
            let label = btn.textContent.trim();

            if (q.includes('vitthal') || label.toLowerCase().includes('about lord vitthal')) {
                label = isMr ? 'भगवान विठ्ठल बद्दल' : 'About Lord Vitthal';
                btn.setAttribute('data-query', isMr ? 'विठ्ठल बद्दल सांगा.' : 'Tell me about Lord Vitthal.');
            } else if (q.includes('darshan') || label.toLowerCase().includes('book darshan')) {
                label = isMr ? 'दर्शन बुक करा' : 'Book Darshan';
                btn.setAttribute('data-query', isMr ? 'दर्शन कसे बुक करायचे?' : 'How to book darshan?');
            } else if (q.includes('timings') || label.toLowerCase().includes('temple timings')) {
                label = isMr ? 'मंदिर वेळा' : 'Temple Timings';
                btn.setAttribute('data-query', isMr ? 'मंदिराच्या वेळा काय आहेत?' : 'What are the temple timings?');
            } else if (q.includes('donate') || label.toLowerCase().includes('donate')) {
                label = isMr ? 'दान करा' : 'Donate';
                btn.setAttribute('data-query', isMr ? 'मी दान कसे करू शकतो?' : 'How can I donate?');
            }

            if (iconHtml) {
                btn.innerHTML = iconHtml + ' ' + label;
            } else {
                btn.textContent = label;
            }
        });
    }

    try {
        const firstBot = document.querySelector('#messages .bot-message-modal p');
        if (firstBot) {
            const isWelcome = firstBot.textContent.includes('Welcome') || firstBot.textContent.includes('स्वागत');
            if (isWelcome) {
                firstBot.textContent = isMr
                    ? '🙏 श्री विठ्ठल रुक्मिणी मंदिरात आपले स्वागत आहे! मी तुम्हाला कशी मदत करू?'
                    : '🙏 Welcome to Shri Vitthal Rukmini Mandir! How can I assist you today?';
            }
        }
    } catch (_) {}

    if (userInput) userInput.placeholder = isMr ? 'आपला संदेश लिहा...' : 'Type your message...';
}

    function openChatbotModal() {
        if (!chatbotOverlay) return;
        chatbotOverlay.classList.add('show');
        document.body.classList.add('chatbot-open');
        if (messagesContainer) messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function closeChatbotModal() {
        if (!chatbotOverlay) return;
        chatbotOverlay.classList.remove('show');
        document.body.classList.remove('chatbot-open');
    }

    if (shouldBindChatbot) {
        if (chatbotIcon) chatbotIcon.addEventListener('click', openChatbotModal);
        if (closeChatbotModalBtn) closeChatbotModalBtn.addEventListener('click', closeChatbotModal);
        if (exitChatbotBtn) exitChatbotBtn.addEventListener('click', closeChatbotModal);
        if (chatbotOverlay) {
            chatbotOverlay.addEventListener('click', (e) => {
                if (e.target === chatbotOverlay) closeChatbotModal();
            });
        }
    }

    function escapeHtml(s) {
        return (s ?? '').toString()
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function formatBotHtml(text) {
        // 1) Escape HTML to prevent injection
        // 2) Convert **bold** to <strong>bold</strong>
        // 3) Preserve newlines
        let s = escapeHtml(text);
        s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        s = s.replace(/\n/g, '<br>');
        return s;
    }

    function addMessage(sender, text) {
        if (!messagesContainer) return;
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message-box-modal', sender === 'user' ? 'user-message-modal' : 'bot-message-modal');

        const headerDiv = document.createElement('div');
        headerDiv.classList.add('message-header-modal');

        const avatarDiv = document.createElement('div');
        avatarDiv.classList.add('avatar-modal', sender === 'user' ? 'user-avatar-modal' : 'bot-avatar-modal');
        if (sender === 'user') {
            avatarDiv.textContent = '';
        } else {
            avatarDiv.innerHTML = '<img src="/static/images/cl3.jpg" alt="AI" class="bot-avatar-img" loading="lazy">';
        }

        const senderSpan = document.createElement('span');
        senderSpan.textContent = sender === 'user' ? 'You' : 'Vitthal Assistant';

        headerDiv.appendChild(avatarDiv);
        headerDiv.appendChild(senderSpan);

        const textP = document.createElement('p');
        if (sender === 'bot') {
            textP.innerHTML = formatBotHtml(text);
        } else {
            textP.textContent = (text ?? '').toString();
        }

        const timeSpan = document.createElement('span');
        timeSpan.classList.add('message-time-modal');
        timeSpan.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        messageDiv.appendChild(headerDiv);
        messageDiv.appendChild(textP);
        messageDiv.appendChild(timeSpan);
        messagesContainer.appendChild(messageDiv);

        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    let typingIndicator = null;
    function showTypingIndicator() {
        if (!messagesContainer || typingIndicator) return;
        typingIndicator = document.createElement('div');
        typingIndicator.classList.add('message-box-modal', 'bot-message-modal');
        typingIndicator.innerHTML = `
            <div class="message-header-modal">
                <div class="avatar-modal bot-avatar-modal"><img src="/static/images/cl3.jpg" alt="AI" class="bot-avatar-img" loading="lazy"></div>
                <span>Vitthal Assistant</span>
            </div>
            <div class="dot-typing"></div>
        `;
        messagesContainer.appendChild(typingIndicator);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function hideTypingIndicator() {
        if (messagesContainer && typingIndicator) {
            messagesContainer.removeChild(typingIndicator);
            typingIndicator = null;
        }
    }

    function mockBotResponse(prompt) {
        const p = (prompt || '').toLowerCase();
        if (chatLang === 'mr') {
            // Marathi responses
            if (p.includes('vitthal')) {
                return 'भगवान विठ्ठल ज्यांना विठोबा म्हणूनही ओळखले जाते, हे भगवान विष्णूंचे रूप असून विशेषतः महाराष्ट्र आणि कर्नाटकात पूजले जातात.';
            } else if (p.includes('darshan')) {
                return 'ऑनलाईन सेवा → पास बुकिंग मध्ये जाऊन तुम्ही दर्शन पास बुक करू शकता.';
            } else if (p.includes('timings') || p.includes('वेळ') || p.includes('time')) {
                return 'मंदिराची साधारण वेळ सकाळी ६:०० ते रात्री १०:०० आहे (उत्सवाच्या दिवशी बदलू शकते).';
            } else if (p.includes('donate') || p.includes('दान')) {
                return 'दान करण्यासाठी ऑनलाईन सेवांमधील डोनेशन पोर्टलचा वापर करा. तुमच्या सहकार्याबद्दल धन्यवाद!';
            } else if (p.includes('pooja') || p.includes('पूजा')) {
                return 'ऑनलाईन सेवा → पूजा सेवा येथे जाऊन तुम्ही पूजा बुक करू शकता.';
            } else if (p.includes('bhakta nivas') || p.includes('accommodation') || p.includes('निवास')) {
                return 'भक्त निवास येथे परवडणारी निवास व्यवस्था उपलब्ध आहे. बुकिंगसाठी भक्त निवास विभाग पहा.';
            }
            return 'मी मदत करण्याचा प्रयत्न करीत आहे. मंदिराशी संबंधित तुमचे प्रश्न विचारा.';
        }
        // English (default)
        if (p.includes('vitthal')) {
            return "Lord Vitthal, also known as Vithoba, is a form of Lord Vishnu worshipped mainly in Maharashtra and Karnataka.";
        } else if (p.includes('darshan')) {
            return "You can book your darshan pass via Online Services → Pass Booking.";
        } else if (p.includes('timings')) {
            return "General temple timings are 6:00 AM – 10:00 PM (may vary on festivals).";
        } else if (p.includes('donate')) {
            return "You can donate through our Online Donation Portal in Online Services. Thank you for your support!";
        } else if (p.includes('pooja')) {
            return "Book pooja services under Online Services → Pooja Services.";
        } else if (p.includes('bhakta nivas') || p.includes('accommodation')) {
            return "Bhakta Nivas offers affordable accommodation. See the Bhakta Nivas section for booking.";
        }
        return "I'm still learning, but I can help you with common queries about Shri Vitthal Rukmini Mandir.";
    }

    async function sendMessage() {
        if (!userInput) return;
        const prompt = userInput.value.trim();
        if (prompt === '') return;

        addMessage('user', prompt);
        userInput.value = '';

        showTypingIndicator();

        // Prefer backend response; fallback to local mock if backend fails.
        try {
            const resp = await fetch(`${API_BASE}/api/chatbot/chat/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: prompt, language: chatLang })
            });

            const data = await resp.json().catch(() => ({}));
            hideTypingIndicator();

            if (resp.ok) {
                addMessage('bot', data.response || data.message || mockBotResponse(prompt));
            } else {
                addMessage('bot', mockBotResponse(prompt));
            }
        } catch (e) {
            hideTypingIndicator();
            addMessage('bot', mockBotResponse(prompt));
        }
    }

    if (shouldBindChatbot && sendBtn && userInput) {
        sendBtn.addEventListener('click', sendMessage);
        userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
    }

    if (shouldBindChatbot && langButtons && langButtons.length) {
        langButtons.forEach(button => {
            button.addEventListener('click', () => {
                langButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                // Persist and apply new language
                const selected = button.getAttribute('data-lang') || 'en';
                chatLang = selected;
                try { localStorage.setItem('chatLang', chatLang); } catch(_) {}
                // Update input placeholder
                if (userInput) {
                    userInput.placeholder = (chatLang === 'mr') ? 'आपला संदेश लिहा...' : 'Type your message...';
                }
                // Inform the user
                addMessage('bot', chatLang === 'mr' ? 'भाषा मराठीवर बदलली आहे.' : `Language switched to ${button.textContent.trim()}.`);
                // Translate visible UI
                translateChatbotUI(chatLang);
            });
        });
    }

    if (shouldBindChatbot && quickActionButtons && quickActionButtons.length) {
        quickActionButtons.forEach(button => {
            button.addEventListener('click', () => {
                if (!userInput) return;
                const query = button.getAttribute('data-query') || '';
                userInput.value = query;
                sendMessage();
            });
        });
    }

    // Aesthetic enhancements: scroll reveal and subtle parallax (theme-preserving)
    try {
        const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        // Scroll reveal using IntersectionObserver
        if (!reduceMotion && 'IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries, obs) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('in-view');
                        obs.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.15, rootMargin: '0px 0px -10% 0px' });

            const autoRevealSelectors = [
                '[data-reveal]',
                'section',
                '.card-animate',
                '.reveal-stagger > *',
                '.grid > *',
                '.container > *',
                '.feature-card',
                '.gallery-item',
                '.service-card',
            ];
            const nodes = document.querySelectorAll(autoRevealSelectors.join(','));
            nodes.forEach(el => {
                // Skip if explicitly opted out
                if (el.hasAttribute('data-reveal-off')) return;
                // Only add baseline class if not already animated in
                if (!el.classList.contains('reveal') && !el.classList.contains('in-view')) {
                    el.classList.add('reveal');
                }
                observer.observe(el);
            });
        }

        // Subtle hero parallax on background
        const hero = document.querySelector('.hero-bg');
        if (!reduceMotion && hero) {
            let ticking = false;
            const onScroll = () => {
                if (ticking) return;
                ticking = true;
                window.requestAnimationFrame(() => {
                    const y = window.scrollY || window.pageYOffset || 0;
                    // Move background slightly for depth; keep within bounds
                    hero.style.backgroundPosition = `center ${Math.min(80, y * 0.35)}px`;
                    ticking = false;
                });
            };
            // Initialize once
            onScroll();
            window.addEventListener('scroll', onScroll, { passive: true });
        }
    } catch (e) {
        // Fail-safe: do nothing if older browser
        console.debug('Enhancement skipped:', e);
    }

    // After DOM ready setup above, ensure the UI reflects the saved language
    try {
        setActiveLangButton();
        translateChatbotUI(chatLang);
    } catch(_) {}

    // Events & Festival Calendar Functionality
    initEventsCalendar();

});

// Events & Festival Calendar Implementation
async function initEventsCalendar() {
    const calendarContainer = document.getElementById('mini-calendar');
    const prevBtn = document.getElementById('prev-month');
    const nextBtn = document.getElementById('next-month');
    const enableNotificationsBtn = document.getElementById('enable-notifications');
    const emailSubscribeBtn = document.getElementById('email-subscribe');
    const eventsListEl = document.getElementById('events-list');
    
    if (!calendarContainer) return;

    let currentDate = new Date();
    let currentMonth = currentDate.getMonth();
    let currentYear = currentDate.getFullYear();

    // Events map loaded from data/events.json (date => {title, type, region})
    let events = {};
    async function loadEvents() {
        try {
            const resp = await fetch('/static/data/events.json', { cache: 'no-store' });
            if (resp.ok) {
                const json = await resp.json();
                const list = Array.isArray(json.events) ? json.events : [];
                list.forEach(e => {
                    if (e && e.date && e.title) {
                        events[e.date] = { title: e.title, type: e.type || 'festival', region: e.region || null };
                    }
                });
            }
        } catch (_) {
            // Fallback sample if file missing
            events = {
                '2024-11-15': { title: 'Kartik Ekadashi', type: 'festival' },
                '2024-11-22': { title: 'Tulsi Vivah', type: 'festival' },
                '2024-12-05': { title: 'Mokshada Ekadashi', type: 'festival' }
            };
        }
    }

    function startOfTodayLocal() {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
    }

    function parseISODateLocal(isoDate) {
        // Interpret YYYY-MM-DD as local date (avoid UTC shifting)
        const m = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(String(isoDate || ''));
        if (!m) return null;
        const year = Number(m[1]);
        const monthIndex = Number(m[2]) - 1;
        const day = Number(m[3]);
        const d = new Date(year, monthIndex, day);
        d.setHours(0, 0, 0, 0);
        return d;
    }

    function monthLabel(d) {
        return d.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    }

    function typeStyles(type) {
        const t = (type || '').toLowerCase();
        if (t === 'national') return { bg: 'from-blue-100 to-indigo-100', border: 'border-blue-500', chip: 'bg-blue-500', btn: 'bg-blue-500 hover:bg-blue-600' };
        if (t === 'observance') return { bg: 'from-gray-100 to-slate-100', border: 'border-slate-500', chip: 'bg-slate-600', btn: 'bg-slate-600 hover:bg-slate-700' };
        if (t === 'celebration') return { bg: 'from-green-100 to-emerald-100', border: 'border-emerald-500', chip: 'bg-emerald-600', btn: 'bg-emerald-600 hover:bg-emerald-700' };
        if (t === 'ekadashi') return { bg: 'from-purple-100 to-pink-100', border: 'border-purple-500', chip: 'bg-purple-500', btn: 'bg-purple-500 hover:bg-purple-600' };
        return { bg: 'from-orange-100 to-yellow-100', border: 'border-primary', chip: 'bg-primary', btn: 'bg-primary hover:bg-primary-dark' };
    }

    function renderUpcomingEventsList() {
        if (!eventsListEl) return;

        const today = startOfTodayLocal();
        const upcoming = Object.keys(events)
            .map(dateStr => ({ dateStr, meta: events[dateStr], date: parseISODateLocal(dateStr) }))
            .filter(x => x.date && x.date.getTime() >= today.getTime())
            .sort((a, b) => a.date.getTime() - b.date.getTime())
            .slice(0, 3);

        if (!upcoming.length) {
            eventsListEl.innerHTML = '<div class="text-gray-600 text-sm">No upcoming events scheduled.</div>';
            return;
        }

        eventsListEl.innerHTML = upcoming.map(item => {
            const styles = typeStyles(item.meta?.type);
            const d = item.date;
            const day = String(d.getDate()).padStart(2, '0');
            const mon = monthLabel(d);
            const title = item.meta?.title || '';
            const type = item.meta?.type || 'festival';
            const isoDate = item.dateStr;

            return `
                <div class="event-card bg-gradient-to-r ${styles.bg} p-4 rounded-xl border-l-4 ${styles.border}">
                    <div class="flex items-start justify-between">
                        <div class="flex-1">
                            <div class="flex items-center gap-3 mb-2">
                                <div class="${styles.chip} text-white rounded-lg p-2 text-center min-w-[60px]">
                                    <div class="text-xs font-semibold">${mon}</div>
                                    <div class="text-lg font-bold">${day}</div>
                                </div>
                                <div>
                                    <h4 class="text-lg font-semibold text-gray-900">${title}</h4>
                                    <p class="text-sm text-gray-600">${type}</p>
                                </div>
                            </div>
                        </div>
                        <button class="${styles.btn} text-white px-4 py-2 rounded-lg text-sm font-semibold transition" type="button" data-remind="1" data-event-title="${title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')}" data-event-date="${isoDate}">
                            Remind Me
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Delegated handler for dynamic "Remind Me" buttons inside the upcoming events list
    if (eventsListEl) {
        eventsListEl.addEventListener('click', (e) => {
            const btn = e.target && e.target.closest ? e.target.closest('button[data-remind="1"]') : null;
            if (!btn) return;
            e.preventDefault();
            e.stopPropagation();

            if (!(isLoggedIn || hasToken())) {
                showAuthRequiredModal('Event Reminders');
                return;
            }

            const title = btn.getAttribute('data-event-title') || 'Event';
            const dateStr = btn.getAttribute('data-event-date') || '';
            if (!dateStr) return;

            setEventReminder({ title }, dateStr);
            btn.innerHTML = '<i class="fas fa-check mr-2"></i>Reminder Set';
            btn.disabled = true;
        });
    }

    function generateCalendar(month, year) {
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = new Date();
        
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        
        let html = `
            <div class="calendar-header">
                <span>${monthNames[month]} ${year}</span>
            </div>
            <div class="calendar-grid">
        `;
        
        // Day headers
        dayNames.forEach(day => {
            html += `<div class="calendar-day-header">${day}</div>`;
        });
        
        // Empty cells for days before the first day of the month
        for (let i = 0; i < firstDay; i++) {
            const prevMonthDay = new Date(year, month, 0).getDate() - (firstDay - i - 1);
            html += `<div class="calendar-day other-month">${prevMonthDay}</div>`;
        }
        
        // Days of the current month
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
            const hasEvent = events[dateStr];
            
            let classes = 'calendar-day';
            if (isToday) classes += ' today';
            if (hasEvent) classes += ' has-event';
            
            html += `<div class="${classes}" data-date="${dateStr}" title="${hasEvent ? hasEvent.title : ''}">${day}</div>`;
        }
        
        // Fill remaining cells with next month's days
        const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
        const remainingCells = totalCells - (firstDay + daysInMonth);
        for (let day = 1; day <= remainingCells; day++) {
            html += `<div class="calendar-day other-month">${day}</div>`;
        }
        
        html += '</div>';
        calendarContainer.innerHTML = html;
        
        // Add click handlers for calendar days
        calendarContainer.querySelectorAll('.calendar-day:not(.other-month)').forEach(dayEl => {
            dayEl.addEventListener('click', function() {
                const date = this.dataset.date;
                if (events[date]) {
                    showEventDetails(events[date], date);
                }
                
                // Update selected state
                calendarContainer.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('selected'));
                this.classList.add('selected');
            });
        });
    }

    function showEventDetails(event, date) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
        modal.innerHTML = `
            <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform scale-95 opacity-0 transition-all duration-300">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-xl font-semibold text-gray-900">${event.title}</h3>
                    <button class="close-modal text-gray-400 hover:text-gray-600">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
                <div class="mb-4">
                    <p class="text-gray-600 mb-2">Date: ${new Date(date).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                    })}</p>
                    <p class="text-gray-600">Type: ${event.type}</p>
                </div>
                <div class="flex gap-3">
                    <button class="remind-me-btn flex-1 bg-primary text-white py-2 px-4 rounded-lg font-semibold hover:bg-primary-dark transition">
                        <i class="fas fa-bell mr-2"></i>Remind Me
                    </button>
                    <button class="share-event-btn flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg font-semibold hover:bg-gray-300 transition">
                        <i class="fas fa-share mr-2"></i>Share
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Animate in
        setTimeout(() => {
            const modalContent = modal.querySelector('div > div');
            modalContent.classList.remove('scale-95', 'opacity-0');
            modalContent.classList.add('scale-100', 'opacity-100');
        }, 50);
        
        // Event handlers
        modal.querySelector('.close-modal').addEventListener('click', () => closeModal(modal));
        modal.querySelector('.remind-me-btn').addEventListener('click', () => {
            if (!(isLoggedIn || hasToken())) {
                showAuthRequiredModal('Event Reminders');
                return;
            }
            setEventReminder(event, date);
            closeModal(modal);
        });
        modal.querySelector('.share-event-btn').addEventListener('click', () => {
            shareEvent(event, date);
        });
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal(modal);
        });
    }

    function closeModal(modal) {
        const modalContent = modal.querySelector('div > div');
        modalContent.classList.remove('scale-100', 'opacity-100');
        modalContent.classList.add('scale-95', 'opacity-0');
        setTimeout(() => {
            document.body.removeChild(modal);
        }, 300);
    }

    function setEventReminder(event, date) {
        // Store reminder in localStorage
        const reminders = JSON.parse(localStorage.getItem('eventReminders') || '[]');
        const reminder = {
            id: Date.now(),
            event: event.title,
            date: date,
            created: new Date().toISOString()
        };
        reminders.push(reminder);
        localStorage.setItem('eventReminders', JSON.stringify(reminders));
        
        // Show confirmation
        showNotification(`Reminder set for ${event.title} on ${new Date(date).toLocaleDateString()}`, 'success');
        
        // If notifications are enabled, schedule browser notification
        if (Notification.permission === 'granted') {
            scheduleNotification(event, date);
        }
    }

    function shareEvent(event, date) {
        const text = `Join us for ${event.title} on ${new Date(date).toLocaleDateString()} at Shri Vitthal Rukmini Mandir, Pandharpur`;
        
        if (navigator.share) {
            navigator.share({
                title: event.title,
                text: text,
                url: window.location.href
            });
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(text).then(() => {
                showNotification('Event details copied to clipboard!', 'success');
            });
        }
    }

    function scheduleNotification(event, date) {
        const eventDate = new Date(date);
        const now = new Date();
        const timeDiff = eventDate.getTime() - now.getTime();
        const daysBefore = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        
        if (daysBefore > 0 && daysBefore <= 7) {
            // Schedule notification for 1 day before
            const notificationTime = eventDate.getTime() - (24 * 60 * 60 * 1000);
            const delay = notificationTime - now.getTime();
            
            if (delay > 0) {
                setTimeout(() => {
                    new Notification(`Reminder: ${event.title}`, {
                        body: `Tomorrow is ${event.title} at the temple. Don't miss this special occasion!`,
                        icon: '/images/logo.jpg'
                    });
                }, delay);
            }
        }
    }

    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transform translate-x-full transition-transform duration-300 ${
            type === 'success' ? 'bg-green-500 text-white' : 
            type === 'error' ? 'bg-red-500 text-white' : 
            'bg-blue-500 text-white'
        }`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.remove('translate-x-full');
        }, 100);
        
        setTimeout(() => {
            notification.classList.add('translate-x-full');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    let isApplyingNotificationsUI = false;
    function applyNotificationsEnabledUI() {
        if (!enableNotificationsBtn) return;
        if (isApplyingNotificationsUI) return;
        isApplyingNotificationsUI = true;

        try {
            const icon = enableNotificationsBtn.querySelector('i');
            const label = enableNotificationsBtn.querySelector('span');

            if (icon && !icon.classList.contains('fa-check')) {
                icon.classList.remove('fa-bell');
                icon.classList.add('fa-check');
            }

            if (label) {
                if (label.textContent !== 'Notifications Enabled') {
                    label.textContent = 'Notifications Enabled';
                }
            } else {
                if (enableNotificationsBtn.textContent !== '✓ Notifications Enabled') {
                    enableNotificationsBtn.textContent = '✓ Notifications Enabled';
                }
            }
        } finally {
            isApplyingNotificationsUI = false;
        }
    }

    function isNotificationsEnabledFlag() {
        try { return localStorage.getItem('notificationsEnabled') === 'true'; } catch(_) { return false; }
    }

    // Navigation handlers
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            currentMonth--;
            if (currentMonth < 0) {
                currentMonth = 11;
                currentYear--;
            }
            generateCalendar(currentMonth, currentYear);
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            currentMonth++;
            if (currentMonth > 11) {
                currentMonth = 0;
                currentYear++;
            }
            generateCalendar(currentMonth, currentYear);
        });
    }

    // Notification handlers
    if (enableNotificationsBtn) {
        enableNotificationsBtn.addEventListener('click', async () => {
            if (!(isLoggedIn || hasToken())) {
                showAuthRequiredModal('Enable Notifications');
                return;
            }
            if (Notification.permission === 'default') {
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    try { localStorage.setItem('notificationsEnabled', 'true'); } catch(_) {}
                    enableNotificationsBtn.disabled = true;
                    applyNotificationsEnabledUI();
                    showNotification('Push notifications enabled! You\'ll receive reminders for upcoming events.', 'success');
                } else {
                    showNotification('Notification permission denied. You can enable it in your browser settings.', 'error');
                }
            } else if (Notification.permission === 'granted') {
                try { localStorage.setItem('notificationsEnabled', 'true'); } catch(_) {}
                showNotification('Notifications are already enabled!', 'info');
            } else {
                showNotification('Please enable notifications in your browser settings.', 'error');
            }
        });

        // If i18n or other scripts rewrite the button label after we set it, re-apply when enabled.
        try {
            let notifUiObsTimer = null;
            const obs = new MutationObserver(() => {
                if (notifUiObsTimer) return;
                notifUiObsTimer = setTimeout(() => {
                    notifUiObsTimer = null;
                    if (isApplyingNotificationsUI) return;
                    if (isNotificationsEnabledFlag() || Notification.permission === 'granted') {
                        applyNotificationsEnabledUI();
                    }
                }, 0);
            });
            obs.observe(enableNotificationsBtn, { subtree: true, childList: true, characterData: true });
        } catch (_) { /* ignore */ }
    }

    if (emailSubscribeBtn) {
        emailSubscribeBtn.addEventListener('click', () => {
            if (!(isLoggedIn || hasToken())) {
                showAuthRequiredModal('Email Updates');
                return;
            }
            const email = prompt('Enter your email address to receive event updates:');
            if (email && email.includes('@')) {
                // In a real app, this would make an API call
                localStorage.setItem('emailSubscription', email);
                emailSubscribeBtn.innerHTML = '<i class="fas fa-check mr-2"></i>Subscribed';
                emailSubscribeBtn.disabled = true;
                showNotification(`Email updates enabled for ${email}`, 'success');
            } else if (email) {
                showNotification('Please enter a valid email address.', 'error');
            }
        });
    }

    // Initialize calendar after loading events
    await loadEvents();
    renderUpcomingEventsList();
    generateCalendar(currentMonth, currentYear);
    
    // Check if notifications are already enabled
    if (enableNotificationsBtn) {
        let wasEnabled = false;
        try { wasEnabled = localStorage.getItem('notificationsEnabled') === 'true'; } catch(_) { wasEnabled = false; }
        if (wasEnabled || Notification.permission === 'granted') {
            applyNotificationsEnabledUI();
            if (isLoggedIn || hasToken()) {
                enableNotificationsBtn.disabled = true;
            } else {
                enableNotificationsBtn.disabled = false;
            }
        }
    }
    
    // Check if email is already subscribed
    if (localStorage.getItem('emailSubscription') && emailSubscribeBtn) {
        emailSubscribeBtn.innerHTML = '<i class="fas fa-check mr-2"></i>Subscribed';
        if (isLoggedIn || hasToken()) {
            emailSubscribeBtn.disabled = true;
        } else {
            emailSubscribeBtn.disabled = false;
        }
    }
}
