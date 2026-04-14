/* Chatbot Specific JavaScript */

document.addEventListener('DOMContentLoaded', () => {
    initializeChatbot();
});

function initializeChatbot() {
    // Guard: this file can be loaded alongside script_fixed.js which also binds chatbot handlers.
    // Avoid double-binding which causes duplicate responses.
    if (window.__vitthalChatbotBound) {
        return;
    }
    window.__vitthalChatbotBound = true;

    const chatbotIcon = document.getElementById('chatbot-icon');
    const chatbotOverlay = document.getElementById('chatbot-overlay');
    const closeChatbotBtn = document.getElementById('close-chatbot-modal-btn');
    const messagesContainer = document.getElementById('messages');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const voiceBtn = document.getElementById('voice-btn');
    const langButtons = document.querySelectorAll('.lang-btn-modal');
    const quickActionButtons = document.querySelectorAll('.action-btn-modal');
    const exitChatbotBtn = document.getElementById('exit-chatbot-btn');
    
    let currentLanguage = 'en';

    // Voice input (Web Speech API)
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition = null;
    let isListening = false;

    if (voiceBtn) {
        if (!SpeechRecognition) {
            voiceBtn.style.display = 'none';
        } else {
            recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = true;
            recognition.maxAlternatives = 1;

            function setListeningUI(on) {
                isListening = on;
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

            recognition.onerror = () => {
                setListeningUI(false);
            };

            recognition.onend = () => {
                setListeningUI(false);
            };

            voiceBtn.addEventListener('click', async () => {
                if (!recognition) return;
                if (isListening) {
                    try { recognition.stop(); } catch (_) {}
                    setListeningUI(false);
                    return;
                }

                // Some browsers require microphone permission prompt to be user-initiated
                try {
                    // Pre-flight to trigger permission prompt in stricter browsers
                    if (navigator.mediaDevices?.getUserMedia) {
                        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                        stream.getTracks().forEach(t => t.stop());
                    }
                } catch (_) {
                    // If denied, recognition.start() may still throw; handle below.
                }

                try {
                    // Match recognition language to chatbot language if possible
                    const langMap = { en: 'en-IN', hi: 'hi-IN', mr: 'mr-IN' };
                    recognition.lang = langMap[currentLanguage] || 'en-IN';
                    setListeningUI(true);
                    recognition.start();
                } catch (_) {
                    setListeningUI(false);
                }
            });
        }
    }
    
    // Open chatbot
    if (chatbotIcon) {
        chatbotIcon.addEventListener('click', () => {
            chatbotOverlay.classList.add('show');
            document.body.classList.add('chatbot-open');
            userInput?.focus();
        });
    }
    
    // Close chatbot
    if (closeChatbotBtn) {
        closeChatbotBtn.addEventListener('click', () => {
            chatbotOverlay.classList.remove('show');
            document.body.classList.remove('chatbot-open');
        });
    }
    
    // Close on overlay click
    if (chatbotOverlay) {
        chatbotOverlay.addEventListener('click', (e) => {
            if (e.target === chatbotOverlay) {
                chatbotOverlay.classList.remove('show');
                document.body.classList.remove('chatbot-open');
            }
        });
    }

    // Exit button
    if (exitChatbotBtn) {
        exitChatbotBtn.addEventListener('click', () => {
            chatbotOverlay?.classList.remove('show');
            document.body.classList.remove('chatbot-open');
        });
    }
    
    // Language selection
    langButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            langButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentLanguage = btn.dataset.lang;
            addBotMessage(`Language switched to ${btn.textContent}`);
        });
    });
    
    // Quick actions
    quickActionButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const query = btn.dataset.query;
            if (query) {
                addUserMessage(query);
                sendMessageToBot(query);
            }
        });
    });
    
    // Send message
    if (sendBtn) {
        sendBtn.addEventListener('click', sendMessage);
    }
    
    if (userInput) {
        userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }
    
    function sendMessage() {
        const message = userInput.value.trim();
        if (!message) return;
        
        addUserMessage(message);
        userInput.value = '';
        
        sendMessageToBot(message);
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
        let s = escapeHtml(text);
        s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        s = s.replace(/\n/g, '<br>');
        return s;
    }

    function addUserMessage(text) {
        const messageDiv = createMessageElement('user', (text ?? '').toString());
        messagesContainer.appendChild(messageDiv);
        scrollToBottom();
    }
    
    function addBotMessage(text) {
        const messageDiv = createMessageElement('bot', (text ?? '').toString());
        messagesContainer.appendChild(messageDiv);
        scrollToBottom();
    }
    
    function createMessageElement(sender, text) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message-box-modal', 
            sender === 'user' ? 'user-message-modal' : 'bot-message-modal');
        
        const headerDiv = document.createElement('div');
        headerDiv.classList.add('message-header-modal');
        
        const avatarDiv = document.createElement('div');
        avatarDiv.classList.add('avatar-modal', 
            sender === 'user' ? 'user-avatar-modal' : 'bot-avatar-modal');
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
            textP.textContent = text;
        }
        
        const timeSpan = document.createElement('span');
        timeSpan.classList.add('message-time-modal');
        timeSpan.textContent = new Date().toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        messageDiv.appendChild(headerDiv);
        messageDiv.appendChild(textP);
        messageDiv.appendChild(timeSpan);
        
        return messageDiv;
    }
    
    function showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.id = 'typing-indicator';
        typingDiv.classList.add('message-box-modal', 'bot-message-modal');
        typingDiv.innerHTML = `
            <div class="message-header-modal">
                <div class="avatar-modal bot-avatar-modal"><img src="/static/images/cl3.jpg" alt="AI" class="bot-avatar-img" loading="lazy"></div>
                <span>Vitthal Assistant</span>
            </div>
            <div class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
            </div>
        `;
        messagesContainer.appendChild(typingDiv);
        scrollToBottom();
        return typingDiv;
    }
    
    function removeTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) {
            indicator.remove();
        }
    }
    
    async function sendMessageToBot(message) {
        const typingIndicator = showTypingIndicator();
        
        try {
            const response = await fetch('http://localhost:8000/api/chatbot/chat/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    language: currentLanguage
                })
            });
            
            const data = await response.json();
            
            removeTypingIndicator();
            
            if (response.ok) {
                addBotMessage(data.response || 'I apologize, I could not process that request.');
            } else {
                addBotMessage('Sorry, I encountered an error. Please try again.');
            }
        } catch (error) {
            console.error('Chatbot error:', error);
            removeTypingIndicator();
            addBotMessage('Sorry, I am currently unavailable. Please try again later.');
        }
    }
    
    function scrollToBottom() {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}
