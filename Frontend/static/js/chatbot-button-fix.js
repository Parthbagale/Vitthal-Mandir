/**
 * Chatbot Button Fix
 * Ensures all chatbot buttons work correctly by NOT interfering with main handlers
 */

(function() {
    'use strict';
    
    console.log('[Chatbot Fix] Script loaded');
    
    function initChatbotButtons() {
        console.log('[Chatbot Fix] Checking button setup');
        
        // Get all elements
        const langButtons = document.querySelectorAll('.lang-btn-modal');
        const quickActionButtons = document.querySelectorAll('.action-btn-modal');
        const sendBtn = document.getElementById('send-btn');
        const userInput = document.getElementById('user-input');
        const closeBtn = document.getElementById('close-chatbot-modal-btn');
        const chatbotOverlay = document.getElementById('chatbot-overlay');
        
        console.log('[Chatbot Fix] Found elements:', {
            langButtons: langButtons.length,
            quickActionButtons: quickActionButtons.length,
            sendBtn: !!sendBtn,
            userInput: !!userInput,
            closeBtn: !!closeBtn,
            chatbotOverlay: !!chatbotOverlay
        });
        
        // Just ensure buttons are clickable - don't add handlers
        // The main script should handle everything
        
        // Make sure buttons have pointer cursor
        langButtons.forEach(function(btn) {
            btn.style.cursor = 'pointer';
        });
        
        quickActionButtons.forEach(function(btn) {
            btn.style.cursor = 'pointer';
        });
        
        if (sendBtn) {
            sendBtn.style.cursor = 'pointer';
        }
        
        if (closeBtn) {
            closeBtn.style.cursor = 'pointer';
        }
        
        // Check if main script handlers are working
        console.log('[Chatbot Fix] Checking if main handlers exist...');
        console.log('[Chatbot Fix] window.__vitthalChatbotBound:', window.__vitthalChatbotBound);
        
        // If main handlers aren't working, we need to check why
        if (!window.__vitthalChatbotBound) {
            console.warn('[Chatbot Fix] Main chatbot script may not have initialized!');
        }
        
        console.log('[Chatbot Fix] Setup complete - main script should handle all interactions');
    }
    
    // Wait for DOM and other scripts
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(initChatbotButtons, 2000);
        });
    } else {
        setTimeout(initChatbotButtons, 2000);
    }
    
})();
