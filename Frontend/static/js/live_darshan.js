/* Live Darshan Page Specific JavaScript */

document.addEventListener('DOMContentLoaded', () => {
    initializeLiveDarshan();
});

function initializeLiveDarshan() {
    // Check authentication
    if (!isAuthenticated()) {
        window.location.href = 'index.html?showLogin=true';
        return;
    }
    
    // Initialize video player
    initializeVideoPlayer();
    
    // Chat functionality
    initializeLiveChat();
    
    // Schedule display
    displayDarshanSchedule();
}

function initializeVideoPlayer() {
    const videoPlayer = document.getElementById('live-stream-player');
    
    if (videoPlayer) {
        // Add video player controls
        videoPlayer.controls = true;
        videoPlayer.autoplay = false;
        
        // Handle video errors
        videoPlayer.addEventListener('error', () => {
            showMessage('Unable to load live stream. Please try again later.', 'error');
        });
        
        // Track viewing time
        let viewingStartTime = Date.now();
        
        videoPlayer.addEventListener('play', () => {
            viewingStartTime = Date.now();
        });
        
        videoPlayer.addEventListener('pause', () => {
            const viewingDuration = Date.now() - viewingStartTime;
            console.log(`Viewing duration: ${viewingDuration}ms`);
        });
    }
}

function initializeLiveChat() {
    const chatInput = document.getElementById('live-chat-input');
    const sendButton = document.getElementById('send-chat-btn');
    const chatMessages = document.getElementById('chat-messages');
    
    if (sendButton && chatInput) {
        sendButton.addEventListener('click', () => {
            sendChatMessage(chatInput.value);
            chatInput.value = '';
        });
        
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendChatMessage(chatInput.value);
                chatInput.value = '';
            }
        });
    }
}

function sendChatMessage(message) {
    if (!message.trim()) return;
    
    const chatMessages = document.getElementById('chat-messages');
    const username = localStorage.getItem('currentUser') || 'Anonymous';
    
    const messageElement = document.createElement('div');
    messageElement.className = 'chat-message mb-3';
    messageElement.innerHTML = `
        <div class="flex items-start gap-2">
            <div class="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-semibold">
                ${username.charAt(0).toUpperCase()}
            </div>
            <div class="flex-1">
                <div class="font-semibold text-sm text-gray-900">${username}</div>
                <div class="text-gray-700">${message}</div>
            </div>
        </div>
    `;
    
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function displayDarshanSchedule() {
    const scheduleContainer = document.getElementById('darshan-schedule');
    
    if (scheduleContainer) {
        const schedule = [
            { time: '5:00 AM', event: 'Kakad Aarti' },
            { time: '12:00 PM', event: 'Madhyan Aarti' },
            { time: '8:00 PM', event: 'Sandhya Aarti' }
        ];
        
        scheduleContainer.innerHTML = schedule.map(item => `
            <div class="schedule-item p-4 bg-white rounded-lg mb-2">
                <div class="flex justify-between items-center">
                    <span class="font-semibold text-gray-900">${item.event}</span>
                    <span class="text-gray-600">${item.time}</span>
                </div>
            </div>
        `).join('');
    }
}

function showMessage(text, type = 'info') {
    const colors = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        info: 'bg-blue-500'
    };
    
    const message = document.createElement('div');
    message.className = `fixed top-4 right-4 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg z-50`;
    message.textContent = text;
    document.body.appendChild(message);
    
    setTimeout(() => {
        message.remove();
    }, 3000);
}
