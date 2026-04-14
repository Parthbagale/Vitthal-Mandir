/**
 * Complete Chatbot Fix
 * This script ensures the chatbot works properly by providing a complete implementation
 */

(function() {
    'use strict';
    
    console.log('[Chatbot Complete Fix] Loading...');
    
    // Wait for DOM to be ready
    function init() {
        console.log('[Chatbot Complete Fix] Initializing...');
        
        // Get all elements
        const chatbotIcon = document.getElementById('chatbot-icon');
        const chatbotOverlay = document.getElementById('chatbot-overlay');
        const chatbotModal = document.getElementById('chatbot-modal');
        const closeBtn = document.getElementById('close-chatbot-modal-btn');
        const messagesContainer = document.getElementById('messages');
        const userInput = document.getElementById('user-input');
        const sendBtn = document.getElementById('send-btn');
        const voiceBtn = document.getElementById('voice-btn');
        const langButtons = document.querySelectorAll('.lang-btn-modal');
        const quickActionButtons = document.querySelectorAll('.action-btn-modal');
        
        console.log('[Chatbot Complete Fix] Elements found:', {
            chatbotIcon: !!chatbotIcon,
            chatbotOverlay: !!chatbotOverlay,
            messagesContainer: !!messagesContainer,
            userInput: !!userInput,
            sendBtn: !!sendBtn,
            langButtons: langButtons.length,
            quickActionButtons: quickActionButtons.length
        });
        
        if (!messagesContainer || !userInput || !sendBtn) {
            console.error('[Chatbot Complete Fix] Critical elements missing!');
            return;
        }
        
        // Current language
        let currentLang = 'en';
        
        // API base URL
        const API_BASE = window.location.origin;
        
        // Open chatbot
        function openChatbot() {
            console.log('[Chatbot Complete Fix] Opening chatbot');
            if (chatbotOverlay) {
                chatbotOverlay.classList.add('show');
                document.body.classList.add('chatbot-open');
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }
        }
        
        // Close chatbot
        function closeChatbot() {
            console.log('[Chatbot Complete Fix] Closing chatbot');
            if (chatbotOverlay) {
                chatbotOverlay.classList.remove('show');
                document.body.classList.remove('chatbot-open');
            }
        }
        
        // Add message to chat
        function addMessage(sender, text) {
            console.log('[Chatbot Complete Fix] Adding message:', sender, text);
            
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message-box-modal ' + (sender === 'user' ? 'user-message-modal' : 'bot-message-modal');
            
            const headerDiv = document.createElement('div');
            headerDiv.className = 'message-header-modal';
            
            const avatarDiv = document.createElement('div');
            avatarDiv.className = 'avatar-modal ' + (sender === 'user' ? 'user-avatar-modal' : 'bot-avatar-modal');
            
            if (sender === 'bot') {
                avatarDiv.innerHTML = '<img src="/static/images/cl3.jpg" alt="AI" class="bot-avatar-img" loading="lazy">';
            }
            
            const senderSpan = document.createElement('span');
            senderSpan.textContent = sender === 'user' ? 'You' : 'Vitthal Assistant';
            
            headerDiv.appendChild(avatarDiv);
            headerDiv.appendChild(senderSpan);
            
            const textP = document.createElement('p');
            textP.innerHTML = text.replace(/\n/g, '<br>');
            
            const timeSpan = document.createElement('span');
            timeSpan.className = 'message-time-modal';
            timeSpan.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            
            messageDiv.appendChild(headerDiv);
            messageDiv.appendChild(textP);
            messageDiv.appendChild(timeSpan);
            
            messagesContainer.appendChild(messageDiv);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
            
            console.log('[Chatbot Complete Fix] Message added to DOM');
        }
        
        // Show typing indicator
        let typingIndicator = null;
        function showTyping() {
            if (typingIndicator) return;
            
            typingIndicator = document.createElement('div');
            typingIndicator.className = 'message-box-modal bot-message-modal typing-indicator';
            typingIndicator.innerHTML = `
                <div class="message-header-modal">
                    <div class="avatar-modal bot-avatar-modal">
                        <img src="/static/images/cl3.jpg" alt="AI" class="bot-avatar-img" loading="lazy">
                    </div>
                    <span>Vitthal Assistant</span>
                </div>
                <p><span class="dot"></span><span class="dot"></span><span class="dot"></span></p>
            `;
            messagesContainer.appendChild(typingIndicator);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
        
        // Hide typing indicator
        function hideTyping() {
            if (typingIndicator) {
                typingIndicator.remove();
                typingIndicator = null;
            }
        }
        
        // Mock bot response (fallback)
        function getMockResponse(message) {
            const msg = message.toLowerCase();
            
            if (msg.includes('vitthal') || msg.includes('lord')) {
                return 'Lord Vitthal is the presiding deity of Pandharpur. He is a form of Lord Vishnu and is worshipped by millions of devotees. The temple is one of the most important pilgrimage sites in Maharashtra.';
            } else if (msg.includes('darshan') || msg.includes('book')) {
                return 'To book darshan, please visit our Pass Booking section. You can book online through our website. Darshan timings are from 5:00 AM to 10:00 PM daily.';
            } else if (msg.includes('timing') || msg.includes('time')) {
                return 'Temple timings:\n• Morning: 5:00 AM - 12:00 PM\n• Evening: 4:00 PM - 10:00 PM\n\nSpecial darshan timings may vary during festivals.';
            } else if (msg.includes('donate') || msg.includes('donation')) {
                return 'Thank you for your interest in donating! You can make donations through our Donations page. We accept online payments and all donations go towards temple maintenance and community services.';
            } else if (msg.includes('pooja') || msg.includes('puja')) {
                return 'We offer various pooja services including daily aarti, special pujas, and personalized ceremonies. You can book pooja services through our Pooja Services section.';
            } else if (msg.includes('hello') || msg.includes('hi') || msg.includes('namaste')) {
                return '🙏 Namaste! Welcome to Shri Vitthal Rukmini Mandir. How can I assist you today?';
            } else {
                return 'Thank you for your message. For more information, please explore our website or contact the temple office directly. Is there anything specific you would like to know about the temple?';
            }
        }
        
        // Send message
        async function sendMessage() {
            const message = userInput.value.trim();
            
            if (!message) {
                console.log('[Chatbot Complete Fix] Empty message, not sending');
                return;
            }
            
            console.log('[Chatbot Complete Fix] Sending message:', message);
            
            // Add user message
            addMessage('user', message);
            userInput.value = '';
            
            // Show typing
            showTyping();
            
            // Try to get response from backend
            try {
                const response = await fetch(`${API_BASE}/api/chatbot/chat/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        message: message,
                        language: currentLang
                    })
                });
                
                hideTyping();
                
                if (response.ok) {
                    const data = await response.json();
                    const botMessage = data.response || data.message || getMockResponse(message);
                    addMessage('bot', botMessage);
                } else {
                    // Fallback to mock response
                    addMessage('bot', getMockResponse(message));
                }
            } catch (error) {
                console.log('[Chatbot Complete Fix] API error, using mock response:', error);
                hideTyping();
                addMessage('bot', getMockResponse(message));
            }
        }
        
        // Voice Input Setup
        let recognition = null;
        let isListening = false;
        
        if (voiceBtn) {
            // Check if browser supports speech recognition
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            
            if (SpeechRecognition) {
                recognition = new SpeechRecognition();
                recognition.continuous = false;
                recognition.interimResults = true;
                recognition.lang = 'en-US'; // Default language
                
                recognition.onstart = function() {
                    isListening = true;
                    voiceBtn.classList.add('listening');
                    voiceBtn.style.backgroundColor = '#ff6b00';
                    voiceBtn.style.color = 'white';
                    console.log('[Chatbot Complete Fix] Voice recognition started');
                };
                
                recognition.onresult = function(event) {
                    let transcript = '';
                    for (let i = event.resultIndex; i < event.results.length; i++) {
                        transcript += event.results[i][0].transcript;
                    }
                    
                    console.log('[Chatbot Complete Fix] Voice transcript:', transcript);
                    
                    // Update input field with transcript
                    if (userInput) {
                        userInput.value = transcript;
                    }
                };
                
                recognition.onerror = function(event) {
                    console.error('[Chatbot Complete Fix] Voice recognition error:', event.error);
                    isListening = false;
                    voiceBtn.classList.remove('listening');
                    voiceBtn.style.backgroundColor = '';
                    voiceBtn.style.color = '';
                    
                    // Show error message
                    if (event.error === 'not-allowed') {
                        addMessage('bot', 'Microphone access denied. Please allow microphone access in your browser settings.');
                    } else if (event.error === 'no-speech') {
                        addMessage('bot', 'No speech detected. Please try again.');
                    }
                };
                
                recognition.onend = function() {
                    isListening = false;
                    voiceBtn.classList.remove('listening');
                    voiceBtn.style.backgroundColor = '';
                    voiceBtn.style.color = '';
                    console.log('[Chatbot Complete Fix] Voice recognition ended');
                    
                    // Auto-send if there's text
                    if (userInput && userInput.value.trim()) {
                        setTimeout(function() {
                            sendMessage();
                        }, 500);
                    }
                };
                
                // Voice button click handler
                voiceBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    
                    if (isListening) {
                        console.log('[Chatbot Complete Fix] Stopping voice recognition');
                        recognition.stop();
                    } else {
                        console.log('[Chatbot Complete Fix] Starting voice recognition');
                        
                        // Update language based on current selection
                        if (currentLang === 'mr') {
                            recognition.lang = 'mr-IN'; // Marathi
                        } else {
                            recognition.lang = 'en-US'; // English
                        }
                        
                        try {
                            recognition.start();
                        } catch (error) {
                            console.error('[Chatbot Complete Fix] Error starting recognition:', error);
                            addMessage('bot', 'Voice input is not available. Please type your message.');
                        }
                    }
                });
                
                console.log('[Chatbot Complete Fix] Voice recognition initialized');
            } else {
                // Browser doesn't support speech recognition
                console.warn('[Chatbot Complete Fix] Speech recognition not supported');
                voiceBtn.style.display = 'none';
            }
        }
        
        // Event Listeners
        
        // Open chatbot
        if (chatbotIcon) {
            chatbotIcon.addEventListener('click', openChatbot);
        }
        
        // Close chatbot
        if (closeBtn) {
            closeBtn.addEventListener('click', closeChatbot);
        }
        
        // Close on overlay click
        if (chatbotOverlay) {
            chatbotOverlay.addEventListener('click', function(e) {
                if (e.target === chatbotOverlay) {
                    closeChatbot();
                }
            });
        }
        
        // Send button
        if (sendBtn) {
            sendBtn.addEventListener('click', function(e) {
                e.preventDefault();
                sendMessage();
            });
        }
        
        // Enter key
        if (userInput) {
            userInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    sendMessage();
                }
            });
        }
        
        // Language buttons
        langButtons.forEach(function(button) {
            button.addEventListener('click', function() {
                console.log('[Chatbot Complete Fix] Language button clicked');
                
                // Remove active from all
                langButtons.forEach(function(btn) {
                    btn.classList.remove('active');
                });
                
                // Add active to clicked
                button.classList.add('active');
                
                // Update language
                currentLang = button.getAttribute('data-lang') || 'en';
                
                // Update placeholder
                if (userInput) {
                    userInput.placeholder = currentLang === 'mr' ? 'आपला संदेश लिहा...' : 'Type your message...';
                }
                
                // Notify user
                const langName = button.textContent.trim();
                addMessage('bot', currentLang === 'mr' ? 
                    'भाषा मराठीवर बदलली आहे.' : 
                    `Language switched to ${langName}.`
                );
            });
        });
        
        // Quick action buttons
        quickActionButtons.forEach(function(button) {
            button.addEventListener('click', function() {
                const query = button.getAttribute('data-query') || '';
                console.log('[Chatbot Complete Fix] Quick action clicked:', query);
                
                if (query && userInput) {
                    userInput.value = query;
                    sendMessage();
                }
            });
        });
        
        console.log('[Chatbot Complete Fix] All event listeners attached');
        console.log('[Chatbot Complete Fix] Chatbot is ready!');
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            // Wait longer to ensure script_fixed.js has run
            setTimeout(init, 2000);
        });
    } else {
        setTimeout(init, 2000);
    }
    
    // Also set a flag so script_fixed.js knows we're handling chatbot
    window.__vitthalChatbotOverride = true;
    
})();
