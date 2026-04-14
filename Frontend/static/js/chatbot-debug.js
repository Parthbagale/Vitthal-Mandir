/**
 * Chatbot Debug Script
 * Helps identify why chatbot buttons aren't working
 */

setTimeout(function() {
    console.log('=== CHATBOT DEBUG ===');
    console.log('window.__vitthalChatbotBound:', window.__vitthalChatbotBound);
    
    const messagesContainer = document.getElementById('messages');
    console.log('messagesContainer exists:', !!messagesContainer);
    
    const sendBtn = document.getElementById('send-btn');
    console.log('sendBtn exists:', !!sendBtn);
    
    const userInput = document.getElementById('user-input');
    console.log('userInput exists:', !!userInput);
    
    const quickActionButtons = document.querySelectorAll('.action-btn-modal');
    console.log('quickActionButtons count:', quickActionButtons.length);
    
    const langButtons = document.querySelectorAll('.lang-btn-modal');
    console.log('langButtons count:', langButtons.length);
    
    // Test if we can manually add a message
    if (messagesContainer) {
        console.log('Testing manual message add...');
        const testDiv = document.createElement('div');
        testDiv.className = 'message-box-modal bot-message-modal';
        testDiv.innerHTML = '<p>TEST MESSAGE - If you see this, addMessage should work</p>';
        messagesContainer.appendChild(testDiv);
        console.log('Test message added to DOM');
    }
    
    console.log('=== END DEBUG ===');
}, 3000);
