/**
 * Online Services Dropdown - Ensures dropdown works on all pages
 * This script runs after all other scripts to guarantee the dropdown functionality
 */

(function() {
    'use strict';
    
    console.log('=== Online Services Dropdown Script Loading ===');
    
    function initDropdown() {
        console.log('Attempting to initialize dropdown...');
        
        const btn = document.getElementById('online-services-btn');
        const menu = document.getElementById('online-services-menu');
        const dropdown = document.getElementById('online-services-dropdown');
        
        console.log('Elements found:', {
            btn: !!btn,
            menu: !!menu,
            dropdown: !!dropdown
        });
        
        if (!btn || !menu) {
            console.error('Online services dropdown elements not found');
            return false;
        }
        
        // Check if already initialized
        if (btn.hasAttribute('data-dropdown-ready')) {
            console.log('Dropdown already initialized, re-initializing anyway');
        }
        
        console.log('Initializing online services dropdown NOW');
        
        // Remove inline onclick if it exists
        btn.removeAttribute('onclick');
        
        // Mark as initialized
        btn.setAttribute('data-dropdown-ready', 'true');
        
        // Remove all existing event listeners by cloning
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        // Add click handler directly with both methods
        newBtn.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const isHidden = menu.classList.contains('hidden');
            console.log('=== DROPDOWN CLICKED ===');
            console.log('Currently hidden:', isHidden);
            console.log('Menu classes before:', menu.className);
            
            if (isHidden) {
                menu.classList.remove('hidden');
                menu.style.display = 'block';
                newBtn.setAttribute('aria-expanded', 'true');
                console.log('Dropdown OPENED');
            } else {
                menu.classList.add('hidden');
                menu.style.display = 'none';
                newBtn.setAttribute('aria-expanded', 'false');
                console.log('Dropdown CLOSED');
            }
            
            console.log('Menu classes after:', menu.className);
            console.log('Menu display:', menu.style.display);
        };
        
        // Also add addEventListener as backup
        newBtn.addEventListener('click', function(e) {
            console.log('addEventListener also fired');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!menu.classList.contains('hidden')) {
                if (dropdown && !dropdown.contains(e.target)) {
                    console.log('Closing dropdown - clicked outside');
                    menu.classList.add('hidden');
                    menu.style.display = 'none';
                    newBtn.setAttribute('aria-expanded', 'false');
                }
            }
        }, true); // Use capture phase
        
        // Close dropdown on Escape key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && !menu.classList.contains('hidden')) {
                console.log('Closing dropdown - Escape key');
                menu.classList.add('hidden');
                menu.style.display = 'none';
                newBtn.setAttribute('aria-expanded', 'false');
            }
        });
        
        // Make sure menu is initially hidden
        menu.classList.add('hidden');
        menu.style.display = 'none';
        
        console.log('✓ Online services dropdown initialized successfully');
        return true;
    }
    
    // Multiple initialization attempts with different strategies
    function tryInit() {
        console.log('tryInit called at:', new Date().toISOString());
        if (initDropdown()) {
            console.log('✓ Dropdown initialization successful');
        } else {
            console.log('✗ Dropdown initialization failed, will retry');
        }
    }
    
    // Strategy 1: Immediate if DOM is ready
    if (document.readyState !== 'loading') {
        console.log('DOM already loaded, initializing immediately');
        tryInit();
    }
    
    // Strategy 2: DOMContentLoaded
    document.addEventListener('DOMContentLoaded', function() {
        console.log('DOMContentLoaded fired');
        setTimeout(tryInit, 50);
        setTimeout(tryInit, 200);
        setTimeout(tryInit, 500);
    });
    
    // Strategy 3: Window load
    window.addEventListener('load', function() {
        console.log('Window load event fired');
        setTimeout(tryInit, 100);
        setTimeout(tryInit, 300);
    });
    
    // Strategy 4: Delayed retries
    setTimeout(tryInit, 1000);
    setTimeout(tryInit, 2000);
    
    // Strategy 5: MutationObserver to detect when navbar is added
    const observer = new MutationObserver(function(mutations) {
        const btn = document.getElementById('online-services-btn');
        if (btn && !btn.hasAttribute('data-dropdown-ready')) {
            console.log('Navbar detected by MutationObserver');
            tryInit();
        }
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    // Stop observing after 5 seconds
    setTimeout(function() {
        observer.disconnect();
        console.log('MutationObserver disconnected');
    }, 5000);
    
    console.log('=== Online Services Dropdown Script Loaded ===');
})();
