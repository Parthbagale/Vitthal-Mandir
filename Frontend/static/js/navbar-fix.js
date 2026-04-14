/**
 * Navbar Fix - Ensures all navigation tabs work correctly across all pages
 */

(function() {
    'use strict';
    
    // Wait for DOM to be fully loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
    function init() {
        console.log('Navbar fix initializing...');
        
        // Small delay to ensure other scripts have loaded
        setTimeout(function() {
            initializeOnlineServicesDropdown();
            initializeMobileMenu();
            fixNavigationLinks();
            highlightActivePage();
            ensureAccessServiceFunction();
        }, 100);
    }

    function initializeOnlineServicesDropdown() {
        const onlineServicesBtn = document.getElementById('online-services-btn');
        const onlineServicesMenu = document.getElementById('online-services-menu');
        const onlineServicesDropdown = document.getElementById('online-services-dropdown');
        
        if (!onlineServicesBtn || !onlineServicesMenu) {
            console.log('Online services dropdown elements not found');
            return;
        }
        
        // Check if already initialized by script.js
        if (onlineServicesBtn.hasAttribute('data-dropdown-initialized')) {
            console.log('Online services dropdown already initialized by script.js');
            return;
        }
        
        console.log('Initializing online services dropdown via navbar-fix.js');
        
        // Mark as initialized
        onlineServicesBtn.setAttribute('data-dropdown-initialized', 'true');
        
        // Add click event
        onlineServicesBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            console.log('Online services button clicked (navbar-fix)');
            
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
        document.addEventListener('click', function(e) {
            if (onlineServicesDropdown && !onlineServicesDropdown.contains(e.target)) {
                onlineServicesMenu.classList.add('hidden');
                onlineServicesBtn.setAttribute('aria-expanded', 'false');
            }
        });
        
        // Close dropdown when pressing Escape
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                onlineServicesMenu.classList.add('hidden');
                onlineServicesBtn.setAttribute('aria-expanded', 'false');
            }
        });
        
        console.log('Online services dropdown initialized successfully');
    }

    function initializeMobileMenu() {
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        const mobileMenu = document.getElementById('mobile-menu');
        
        if (!mobileMenuBtn || !mobileMenu) {
            console.log('Mobile menu elements not found');
            return;
        }
        
        console.log('Initializing mobile menu');
        
        // Add click event
        mobileMenuBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            console.log('Mobile menu button clicked');
            
            const isExpanded = mobileMenuBtn.getAttribute('aria-expanded') === 'true';
            mobileMenuBtn.setAttribute('aria-expanded', String(!isExpanded));
            mobileMenu.classList.toggle('hidden', isExpanded);
        });
        
        // Close mobile menu when a link is clicked
        const mobileLinks = mobileMenu.querySelectorAll('a, button');
        mobileLinks.forEach(function(link) {
            link.addEventListener('click', function() {
                // Don't close for dropdown toggles
                if (!this.classList.contains('dropdown-toggle')) {
                    mobileMenu.classList.add('hidden');
                    mobileMenuBtn.setAttribute('aria-expanded', 'false');
                }
            });
        });
        
        console.log('Mobile menu initialized successfully');
    }

    function fixNavigationLinks() {
        // Ensure all navigation links work correctly
        const navLinks = document.querySelectorAll('.nav-link, #mobile-menu a');
        
        navLinks.forEach(function(link) {
            // Make sure href is properly formatted
            const href = link.getAttribute('href');
            if (href && !href.startsWith('http') && !href.startsWith('/') && !href.startsWith('#')) {
                link.setAttribute('href', '/' + href);
            }
        });
        
        console.log('Navigation links fixed');
    }

    function highlightActivePage() {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        
        // Desktop navigation
        const desktopLinks = document.querySelectorAll('#site-header .nav-link');
        desktopLinks.forEach(function(link) {
            const linkHref = link.getAttribute('href');
            if (linkHref && linkHref.includes(currentPage)) {
                link.classList.add('text-primary', 'font-semibold');
                link.classList.remove('text-gray-600');
            }
        });
        
        // Mobile navigation
        const mobileLinks = document.querySelectorAll('#mobile-menu a');
        mobileLinks.forEach(function(link) {
            const linkHref = link.getAttribute('href');
            if (linkHref && linkHref.includes(currentPage)) {
                link.classList.add('bg-gray-100', 'text-primary', 'font-semibold');
            }
        });
        
        console.log('Active page highlighted:', currentPage);
    }

    function ensureAccessServiceFunction() {
        // Only define if not already defined by script.js
        if (typeof window.accessService === 'undefined') {
            window.accessService = function(serviceName, url) {
                console.log('Accessing service:', serviceName, url);
                
                // Check if user is logged in
                const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
                const token = (localStorage.getItem('access_token') || localStorage.getItem('accessToken') || '').toString().trim();
                const authed = isLoggedIn && !!token && token !== 'null' && token !== 'undefined';

                const dest = (function(){
                    const u = (url || '').toString();
                    if (!u) return '/';
                    if (u.startsWith('http://') || u.startsWith('https://') || u.startsWith('/')) return u;
                    return '/' + u;
                })();

                if (!authed) {
                    try { sessionStorage.setItem('redirectAfterLogin', dest); } catch (_) {}
                    window.location.href = '/login.html';
                    return;
                }

                // Navigate to service
                window.location.href = dest;
            };
            console.log('accessService function created');
        } else {
            console.log('accessService function already exists');
        }
    }

    console.log('Navbar fix script loaded successfully');
})();
