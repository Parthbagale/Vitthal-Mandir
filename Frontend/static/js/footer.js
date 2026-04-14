/**
 * Footer JavaScript - Handles visitor count display on all pages
 */

(function() {
    'use strict';

    // Set current year in footer
    function setFooterYear() {
        const yearEl = document.getElementById('footer-year');
        if (yearEl) {
            yearEl.textContent = new Date().getFullYear();
        }
    }

    // Animate counter from 0 to target
    function animateCounter(element, target) {
        if (!element) return;
        
        let current = 0;
        const duration = 2000; // 2 seconds
        const stepTime = 20;
        const steps = duration / stepTime;
        const increment = target / steps;

        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                element.textContent = target.toLocaleString();
                clearInterval(timer);
            } else {
                element.textContent = Math.floor(current).toLocaleString();
            }
        }, stepTime);
    }

    // Fetch and display visitor count
    function fetchVisitorCount() {
        const visitorCountEl = document.getElementById('visitor-count');
        if (!visitorCountEl) return;

        // Check if we're on the index/home page
        const isHomePage = window.location.pathname === '/' || 
                          window.location.pathname === '/index.html' || 
                          window.location.pathname.endsWith('/index.html') ||
                          window.location.pathname === '';

        if (isHomePage) {
            // On home page: increment the count
            fetch('http://127.0.0.1:8000/api/visitor/increment/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            })
            .then(res => res.json())
            .then(data => {
                if (data.total_devotees) {
                    animateCounter(visitorCountEl, data.total_devotees);
                }
            })
            .catch(err => {
                console.error('Error incrementing visitor count:', err);
                // Fallback: just fetch the count
                fetchCurrentCount();
            });
        } else {
            // On other pages: just display the current count
            fetchCurrentCount();
        }
    }

    // Fetch current count without incrementing
    function fetchCurrentCount() {
        const visitorCountEl = document.getElementById('visitor-count');
        if (!visitorCountEl) return;

        fetch('http://127.0.0.1:8000/api/visitor/today/')
            .then(res => res.json())
            .then(data => {
                if (data.total_devotees !== undefined) {
                    animateCounter(visitorCountEl, data.total_devotees);
                }
            })
            .catch(err => {
                console.error('Error fetching visitor count:', err);
                visitorCountEl.textContent = '--';
            });
    }

    // Initialize when DOM is ready
    function init() {
        setFooterYear();
        fetchVisitorCount();
    }

    // Run initialization
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
