/**
 * Button Enhancements - Makes all partially implemented buttons functional
 * This file adds functionality to buttons that were previously non-functional
 */

(function() {
    'use strict';

    // ============================================
    // 1. NOTIFICATION PERMISSION HANDLER
    // ============================================
    function setupNotificationButton() {
        const notifBtn = document.getElementById('enable-notifications');
        if (!notifBtn) return;

        notifBtn.addEventListener('click', async function() {
            if (!('Notification' in window)) {
                alert('This browser does not support notifications');
                return;
            }

            if (Notification.permission === 'granted') {
                showNotificationStatus('Notifications are already enabled!', 'success');
                return;
            }

            if (Notification.permission === 'denied') {
                showNotificationStatus('Notifications are blocked. Please enable them in your browser settings.', 'error');
                return;
            }

            try {
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    showNotificationStatus('Notifications enabled successfully!', 'success');
                    new Notification('Shri Vitthal Rukmini Mandir', {
                        body: 'You will now receive updates about temple events and services.',
                        icon: '/images/mandir logo.jpg'
                    });
                    // Store preference
                    localStorage.setItem('notificationsEnabled', 'true');
                } else {
                    showNotificationStatus('Notification permission denied', 'error');
                }
            } catch (error) {
                console.error('Notification error:', error);
                showNotificationStatus('Failed to enable notifications', 'error');
            }
        });
    }

    // ============================================
    // 2. EMAIL SUBSCRIPTION HANDLER
    // ============================================
    function setupEmailSubscription() {
        const emailBtn = document.getElementById('email-subscribe');
        if (!emailBtn) return;

        emailBtn.addEventListener('click', function() {
            const email = prompt('Enter your email address to receive updates:');
            if (!email) return;

            // Validate email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                showNotificationStatus('Please enter a valid email address', 'error');
                return;
            }

            // Store subscription (in real app, send to backend)
            const subscriptions = JSON.parse(localStorage.getItem('emailSubscriptions') || '[]');
            if (subscriptions.includes(email)) {
                showNotificationStatus('This email is already subscribed!', 'info');
                return;
            }

            subscriptions.push(email);
            localStorage.setItem('emailSubscriptions', JSON.stringify(subscriptions));
            
            showNotificationStatus(`Successfully subscribed ${email} to email updates!`, 'success');
            
            // In production, send to backend
            // sendEmailSubscription(email);
        });
    }

    // ============================================
    // 3. EVENT REMINDER HANDLER
    // ============================================
    function setupEventReminders() {
        const remindButtons = document.querySelectorAll('[data-i18n="events.remind_me"]');
        
        remindButtons.forEach(button => {
            button.addEventListener('click', function() {
                const eventCard = this.closest('.bg-white, .rounded-xl');
                if (!eventCard) return;

                // Extract event details
                const eventTitle = eventCard.querySelector('h3, .text-xl')?.textContent || 'Temple Event';
                const eventDate = eventCard.querySelector('.text-gray-600')?.textContent || '';
                
                // Check notification permission
                if ('Notification' in window && Notification.permission === 'granted') {
                    // Store reminder
                    const reminders = JSON.parse(localStorage.getItem('eventReminders') || '[]');
                    const reminder = {
                        id: Date.now(),
                        title: eventTitle,
                        date: eventDate,
                        timestamp: new Date().toISOString()
                    };
                    reminders.push(reminder);
                    localStorage.setItem('eventReminders', JSON.stringify(reminders));
                    
                    showNotificationStatus(`Reminder set for ${eventTitle}`, 'success');
                    
                    // Show immediate notification
                    new Notification('Reminder Set', {
                        body: `You'll be reminded about: ${eventTitle}`,
                        icon: '/images/mandir logo.jpg'
                    });
                } else {
                    // Fallback: just store the reminder
                    const reminders = JSON.parse(localStorage.getItem('eventReminders') || '[]');
                    reminders.push({
                        id: Date.now(),
                        title: eventTitle,
                        date: eventDate
                    });
                    localStorage.setItem('eventReminders', JSON.stringify(reminders));
                    
                    showNotificationStatus(`Reminder saved for ${eventTitle}. Enable notifications to receive alerts.`, 'info');
                }
            });
        });
    }

    // ============================================
    // 4. VOICE INPUT HANDLER (for chatbot if exists)
    // ============================================
    function setupVoiceInput() {
        const voiceBtn = document.getElementById('voice-input-btn');
        if (!voiceBtn) return;

        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            voiceBtn.style.display = 'none';
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.continuous = false;
        recognition.interimResults = false;

        let isListening = false;

        voiceBtn.addEventListener('click', function() {
            if (isListening) {
                recognition.stop();
                isListening = false;
                voiceBtn.classList.remove('listening');
                return;
            }

            try {
                recognition.start();
                isListening = true;
                voiceBtn.classList.add('listening');
            } catch (error) {
                console.error('Voice recognition error:', error);
            }
        });

        recognition.onresult = function(event) {
            const transcript = event.results[0][0].transcript;
            const chatInput = document.getElementById('chat-input') || document.querySelector('input[type="text"]');
            if (chatInput) {
                chatInput.value = transcript;
                // Trigger send if there's a send button
                const sendBtn = document.getElementById('send-btn') || document.querySelector('button[type="submit"]');
                if (sendBtn) sendBtn.click();
            }
        };

        recognition.onend = function() {
            isListening = false;
            voiceBtn.classList.remove('listening');
        };

        recognition.onerror = function(event) {
            console.error('Speech recognition error:', event.error);
            isListening = false;
            voiceBtn.classList.remove('listening');
            showNotificationStatus('Voice input failed. Please try again.', 'error');
        };
    }

    // ============================================
    // 5. GENERIC BUTTON CLICK HANDLERS
    // ============================================
    function setupGenericButtons() {
        // Handle any buttons with data-action attributes
        document.querySelectorAll('[data-action]').forEach(button => {
            button.addEventListener('click', function() {
                const action = this.getAttribute('data-action');
                const target = this.getAttribute('data-target');
                
                switch(action) {
                    case 'navigate':
                        if (target) window.location.href = target;
                        break;
                    case 'scroll':
                        if (target) {
                            const element = document.querySelector(target);
                            if (element) element.scrollIntoView({ behavior: 'smooth' });
                        }
                        break;
                    case 'toggle':
                        if (target) {
                            const element = document.querySelector(target);
                            if (element) element.classList.toggle('hidden');
                        }
                        break;
                    case 'print':
                        window.print();
                        break;
                    case 'share':
                        handleShare(this);
                        break;
                }
            });
        });
    }

    // ============================================
    // 6. SHARE FUNCTIONALITY
    // ============================================
    function handleShare(button) {
        const title = button.getAttribute('data-share-title') || document.title;
        const text = button.getAttribute('data-share-text') || 'Check out Shri Vitthal Rukmini Mandir';
        const url = button.getAttribute('data-share-url') || window.location.href;

        if (navigator.share) {
            navigator.share({ title, text, url })
                .then(() => showNotificationStatus('Shared successfully!', 'success'))
                .catch(err => console.error('Share failed:', err));
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(url)
                .then(() => showNotificationStatus('Link copied to clipboard!', 'success'))
                .catch(() => showNotificationStatus('Failed to copy link', 'error'));
        }
    }

    // ============================================
    // 7. UTILITY: SHOW STATUS MESSAGES
    // ============================================
    function showNotificationStatus(message, type = 'info') {
        // Try to use existing success popup if available
        if (typeof window.showSuccessPopup === 'function' && type === 'success') {
            window.showSuccessPopup({
                title: 'Success',
                message: message
            });
            return;
        }

        // Create toast notification
        const toast = document.createElement('div');
        toast.className = `fixed top-4 right-4 z-[9999] px-6 py-3 rounded-lg shadow-lg text-white font-semibold animate-fade-in-down`;
        
        const colors = {
            success: 'bg-green-500',
            error: 'bg-red-500',
            info: 'bg-blue-500',
            warning: 'bg-yellow-500'
        };
        
        toast.classList.add(colors[type] || colors.info);
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-20px)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // ============================================
    // 8. SEND EMAIL SUBSCRIPTION TO BACKEND
    // ============================================
    async function sendEmailSubscription(email) {
        try {
            const response = await fetch('http://127.0.0.1:8000/api/subscribe/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email })
            });

            if (!response.ok) {
                throw new Error('Subscription failed');
            }

            return await response.json();
        } catch (error) {
            console.error('Email subscription error:', error);
            throw error;
        }
    }

    // ============================================
    // 9. INITIALIZE ALL ENHANCEMENTS
    // ============================================
    function init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', init);
            return;
        }

        setupNotificationButton();
        setupEmailSubscription();
        setupEventReminders();
        setupVoiceInput();
        setupGenericButtons();

        console.log('✅ Button enhancements loaded');
    }

    // Start initialization
    init();

})();
