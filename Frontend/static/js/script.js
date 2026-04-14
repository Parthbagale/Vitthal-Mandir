document.addEventListener('DOMContentLoaded', () => {
    const yearSpan = document.getElementById('year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }

    // Check if we should show login modal (from auth-check redirect)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('showLogin') === 'true') {
        // Wait a bit for DOM to be ready, then show login modal
        setTimeout(() => {
            const loginModal = document.getElementById('login-modal');
            if (loginModal) {
                openModal(loginModal);
                // Show message about needing to login
                const loginMessage = document.getElementById('login-message');
                if (loginMessage) {
                    loginMessage.classList.remove('hidden');
                    loginMessage.textContent = 'Please login to access this service';
                    loginMessage.style.color = '#B8860B';
                }
            }
        }, 500);
    }

    // Modal Elements
    const registerBtn = document.getElementById('registerBtn');
    const mobileRegisterBtn = document.getElementById('mobile-register-btn');
    const registerModal = document.getElementById('register-modal');
    const closeRegisterModalBtn = document.getElementById('close-register-modal-btn');
    const registerForm = document.getElementById('register-form');
    const registerMessage = document.getElementById('register-message');

    // Authentication System
    let isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    let currentUser = localStorage.getItem('currentUser') || null;

    function updateAuthUI() {
        const loginBtn = document.getElementById('loginBtn');
        const registerBtn = document.getElementById('registerBtn');
        const logoutBtn = document.getElementById('logoutBtn');
        const profileLink = document.getElementById('profileLink');
        const userGreeting = document.getElementById('user-greeting');

        const mobileLoginBtn = document.getElementById('mobile-login-btn');
        const mobileRegisterBtn = document.getElementById('mobile-register-btn');
        const mobileLogoutBtn = document.getElementById('mobile-logout-btn');
        const mobileProfileLink = document.getElementById('mobile-profile-link');
        const mobileUserGreeting = document.getElementById('mobile-user-greeting');

        if (isLoggedIn && currentUser) {
            // Desktop - Show profile and logout, hide auth buttons
            if (loginBtn) loginBtn.style.display = 'none';
            if (registerBtn) registerBtn.style.display = 'none';
            if (logoutBtn) logoutBtn.style.display = 'block';
            if (profileLink) profileLink.classList.remove('hidden');
            if (userGreeting) {
                userGreeting.textContent = `Welcome, ${currentUser}`;
                userGreeting.classList.remove('hidden');
            }

            // Mobile - Show profile and logout, hide auth buttons
            if (mobileLoginBtn) mobileLoginBtn.style.display = 'none';
            if (mobileRegisterBtn) mobileRegisterBtn.style.display = 'none';
            if (mobileLogoutBtn) mobileLogoutBtn.style.display = 'block';
            if (mobileProfileLink) mobileProfileLink.classList.remove('hidden');
            if (mobileUserGreeting) {
                mobileUserGreeting.textContent = `Welcome, ${currentUser}`;
                mobileUserGreeting.classList.remove('hidden');
            }
        } else {
            // Desktop - Show auth buttons, hide profile and logout
            if (loginBtn) loginBtn.style.display = 'block';
            if (registerBtn) registerBtn.style.display = 'block';
            if (logoutBtn) logoutBtn.style.display = 'none';
            if (profileLink) profileLink.classList.add('hidden');
            if (userGreeting) userGreeting.classList.add('hidden');

            // Mobile - Show auth buttons, hide profile and logout
            if (mobileLoginBtn) mobileLoginBtn.style.display = 'block';
            if (mobileRegisterBtn) mobileRegisterBtn.style.display = 'block';
            if (mobileLogoutBtn) mobileLogoutBtn.style.display = 'none';
            if (mobileProfileLink) mobileProfileLink.classList.add('hidden');
            if (mobileUserGreeting) mobileUserGreeting.classList.add('hidden');
        }
    }

    async function logout() {
        try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
                await fetch('http://localhost:8000/api/auth/logout/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                    },
                    body: JSON.stringify({
                        refresh: refreshToken
                    })
                });
            }
        } catch (error) {
            console.error('Logout error:', error);
        }

        // Clear local storage
        isLoggedIn = false;
        currentUser = null;
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userId');
        updateAuthUI();

        // Show logout message
        const message = document.createElement('div');
        message.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
        message.textContent = 'Successfully logged out!';
        document.body.appendChild(message);

        setTimeout(() => {
            document.body.removeChild(message);
        }, 3000);
    }

    function checkAuthForService(serviceName, destUrl) {
        const authed = (typeof window.isAuthenticated === 'function')
            ? window.isAuthenticated()
            : isLoggedIn;

        if (!authed) {
            // Direct redirect to login page
            try {
                const dest = (destUrl || location.href || '').toString();
                sessionStorage.setItem('redirectAfterLogin', dest);
            } catch (_) { }
            window.location.href = '/login.html';
            return false;
        }
        return true;
    }

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

    // Initialize auth UI
    updateAuthUI();

    // Online Services Dropdown Functionality
    const onlineServicesBtn = document.getElementById('online-services-btn');
    const onlineServicesMenu = document.getElementById('online-services-menu');
    const onlineServicesDropdown = document.getElementById('online-services-dropdown');

    console.log('Online Services Elements:', {
        btn: onlineServicesBtn,
        menu: onlineServicesMenu,
        dropdown: onlineServicesDropdown
    });

    // If navbar.html already bound its interactions, avoid rebinding here.
    if (!window.__vitthalNavbarBound && onlineServicesBtn && onlineServicesMenu) {
        console.log('Adding event listener to online services button');
        
        // Mark as initialized to prevent navbar-fix.js from adding duplicate listeners
        onlineServicesBtn.setAttribute('data-dropdown-initialized', 'true');
        
        // Toggle dropdown on button click (do not gate opening by auth)
        onlineServicesBtn.addEventListener('click', (e) => {
            console.log('Online services button clicked!', { isLoggedIn });
            e.preventDefault();
            e.stopPropagation();

            console.log('Toggling dropdown');

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

    // Global function to access services with authentication check
    // Do not override a newer implementation (e.g., script_fixed.js or navbar.html)
    if (typeof window.accessService === 'undefined') {
        window.accessService = function(serviceName, url) {
            if (checkAuthForService(serviceName, url)) {
                // User is authenticated, redirect to service
                window.location.href = url;
            }
        };
    }

    // Mobile Menu Toggle
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');

    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', () => {
            const isExpanded = mobileMenuBtn.getAttribute('aria-expanded') === 'true';
            mobileMenuBtn.setAttribute('aria-expanded', String(!isExpanded));
            mobileMenu.classList.toggle('hidden', isExpanded);
        });

        // Close mobile menu when a link is clicked
        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.add('hidden');
                mobileMenuBtn.setAttribute('aria-expanded', 'false');
            });
        });
    }

    // Modal Elements
    const loginBtn = document.getElementById('loginBtn');
    const mobileLoginBtn = document.getElementById('mobile-login-btn');
    const loginModal = document.getElementById('login-modal');
    const closeLoginModalBtn = document.getElementById('close-login-modal-btn');
    const loginForm = document.getElementById('login-form');
    const loginMessage = document.getElementById('login-message');


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
        }, 300); // Match CSS transition duration
    }

    if (loginBtn && loginModal && closeLoginModalBtn && loginForm && loginMessage) {
        loginBtn.addEventListener('click', () => openModal(loginModal));
        mobileLoginBtn.addEventListener('click', () => {
            closeModal(mobileMenu); // Close mobile menu first if open
            openModal(loginModal);
        });
        closeLoginModalBtn.addEventListener('click', () => closeModal(loginModal));
        loginModal.addEventListener('click', (e) => {
            if (e.target === loginModal) {
                closeModal(loginModal);
            }
        });

        loginForm.addEventListener('submit', async(e) => {
            e.preventDefault();
            loginMessage.classList.remove('hidden');
            loginMessage.textContent = 'Signing in...';
            loginMessage.style.color = '#B8860B'; // Gold color for message

            const username = loginForm['username'].value;
            const password = loginForm['password'].value;

            try {
                const response = await fetch('http://localhost:8000/api/auth/login/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        username: username,
                        password: password
                    })
                });

                const data = await response.json();

                if (response.ok) {
                    // Set authentication state
                    isLoggedIn = true;
                    currentUser = data.user.username;
                    localStorage.setItem('isLoggedIn', 'true');
                    localStorage.setItem('currentUser', currentUser);
                    localStorage.setItem('accessToken', data.tokens.access);
                    localStorage.setItem('refreshToken', data.tokens.refresh);
                    localStorage.setItem('userId', data.user.id);

                    // Check if there's a redirect URL from auth-check
                    const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
                    
                    if (redirectUrl) {
                        loginMessage.textContent = data.message || 'Login successful! Redirecting...';
                        loginMessage.style.color = '#10B981'; // Green for success
                        
                        setTimeout(() => {
                            sessionStorage.removeItem('redirectAfterLogin');
                            closeModal(loginModal);
                            updateAuthUI();
                            window.location.href = redirectUrl;
                        }, 1000);
                    } else {
                        loginMessage.textContent = data.message || 'Login successful! Redirecting to profile...';
                        loginMessage.style.color = '#10B981'; // Green for success

                        setTimeout(() => {
                            closeModal(loginModal);
                            updateAuthUI();
                            // Redirect to profile page
                            window.location.href = 'profile.html';
                        }, 1000);
                    }
                } else {
                    let errorMessage = 'Login failed. Please check your credentials.';
                    if (data.detail) errorMessage = data.detail;
                    else if (data.non_field_errors) errorMessage = data.non_field_errors[0];

                    loginMessage.textContent = errorMessage;
                    loginMessage.style.color = '#EF4444'; // Red for error
                }
            } catch (error) {
                console.error('Login error:', error);
                loginMessage.textContent = 'Network error. Please try again.';
                loginMessage.style.color = '#EF4444'; // Red for error
            }
        });
    }


    // Login password toggle functionality
    const toggleLoginPasswordBtn = document.getElementById('toggle-login-password');
    const loginPasswordInput = document.getElementById('login-password');

    if (toggleLoginPasswordBtn && loginPasswordInput) {
        toggleLoginPasswordBtn.addEventListener('click', function() {
            const type = loginPasswordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            loginPasswordInput.setAttribute('type', type);

            const icon = toggleLoginPasswordBtn.querySelector('i');
            if (type === 'password') {
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            } else {
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            }
        });
    }

    

    // Switch to register functionality
    const switchToRegisterBtn = document.getElementById('switch-to-register');
    if (switchToRegisterBtn && registerModal) {
        switchToRegisterBtn.addEventListener('click', function() {
            closeModal(loginModal);
            setTimeout(() => openModal(registerModal), 300);
        });
    }

    // Register button event listeners
    if (registerBtn) {
        registerBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Register button clicked');
            if (registerModal) {
                openModal(registerModal);
            }
        });
    }

    if (mobileRegisterBtn) {
        mobileRegisterBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Mobile register button clicked');
            const mobileMenu = document.getElementById('mobile-menu');
            if (mobileMenu) closeModal(mobileMenu);
            if (registerModal) {
                openModal(registerModal);
            }
        });
    }

    if (closeRegisterModalBtn && registerModal) {
        closeRegisterModalBtn.addEventListener('click', () => closeModal(registerModal));
        registerModal.addEventListener('click', (e) => {
            if (e.target === registerModal) {
                closeModal(registerModal);
            }
        });
    }

    // Register form submission
    if (registerForm && registerMessage) {
        registerForm.addEventListener('submit', async(e) => {
            e.preventDefault();
            registerMessage.classList.remove('hidden');
            registerMessage.textContent = 'Creating your account...';
            registerMessage.style.color = '#B8860B'; // Gold color for message

            const formData = new FormData();
            formData.append('full_name', registerForm['name'].value);
            formData.append('username', registerForm['username'].value);
            formData.append('email', registerForm['email'].value);
            formData.append('password', registerForm['password'].value);
            formData.append('password_confirm', registerForm['password'].value);

            // Add profile image if selected
            const profileImage = registerForm['profile-image'].files[0];
            if (profileImage) {
                formData.append('profile_image', profileImage);
            }

            const termsAccepted = registerForm['terms-checkbox'].checked;
            if (!termsAccepted) {
                registerMessage.textContent = 'Please accept the terms and conditions.';
                registerMessage.style.color = '#EF4444';
                return;
            }

            try {
                const response = await fetch('http://localhost:8000/api/auth/register/', {
                    method: 'POST',
                    body: formData
                });

                const data = await response.json();

                if (response.ok) {
                    // Set authentication state
                    isLoggedIn = true;
                    currentUser = data.user.full_name || data.user.username;
                    localStorage.setItem('isLoggedIn', 'true');
                    localStorage.setItem('currentUser', currentUser);
                    localStorage.setItem('accessToken', data.tokens.access);
                    localStorage.setItem('refreshToken', data.tokens.refresh);
                    localStorage.setItem('userId', data.user.id);

                    registerMessage.textContent = data.message;
                    registerMessage.style.color = '#10B981'; // Green for success

                    setTimeout(() => {
                        closeModal(registerModal);
                        updateAuthUI();
                    }, 1000);
                } else {
                    let errorMessage = 'Registration failed. Please check your information.';
                    if (data.username) errorMessage = data.username[0];
                    else if (data.email) errorMessage = data.email[0];
                    else if (data.password) errorMessage = data.password[0];
                    else if (data.non_field_errors) errorMessage = data.non_field_errors[0];

                    registerMessage.textContent = errorMessage;
                    registerMessage.style.color = '#EF4444'; // Red for error
                }
            } catch (error) {
                console.error('Registration error:', error);
                registerMessage.textContent = 'Network error. Please try again.';
                registerMessage.style.color = '#EF4444'; // Red for error
            }
        });

        // Profile image upload functionality
        const profileImageInput = document.getElementById('profile-image');
        const profilePreview = document.getElementById('profile-preview');
        const previewImage = document.getElementById('preview-image');
        const cameraIcon = document.getElementById('camera-icon');

        if (profileImageInput && profilePreview && previewImage && cameraIcon) {
            profileImageInput.addEventListener('change', function(e) {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        previewImage.src = e.target.result;
                        previewImage.classList.remove('hidden');
                        cameraIcon.classList.add('hidden');
                        profilePreview.classList.add('border-orange-400');
                    };
                    reader.readAsDataURL(file);
                }
            });
        }

        // Password toggle functionality
        const togglePasswordBtn = document.getElementById('toggle-password');
        const passwordInput = document.getElementById('register-password');

        if (togglePasswordBtn && passwordInput) {
            togglePasswordBtn.addEventListener('click', function() {
                const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                passwordInput.setAttribute('type', type);

                const icon = togglePasswordBtn.querySelector('i');
                if (type === 'password') {
                    icon.classList.remove('fa-eye-slash');
                    icon.classList.add('fa-eye');
                } else {
                    icon.classList.remove('fa-eye');
                    icon.classList.add('fa-eye-slash');
                }
            });
        }

        // Switch to login functionality
        const switchToLoginBtn = document.getElementById('switch-to-login');
        if (switchToLoginBtn && loginModal) {
            switchToLoginBtn.addEventListener('click', function() {
                closeModal(registerModal);
                setTimeout(() => openModal(loginModal), 300);
            });
        }
    }

    // Chatbot Functionality (guard for pages without chatbot markup)
    // If script_fixed.js already bound chatbot handlers, do not bind again.
    if (window.__vitthalChatbotBound) {
        return;
    }

    const chatbotIcon = document.getElementById('chatbot-icon');
    const chatbotOverlay = document.getElementById('chatbot-overlay');
    const chatbotModal = document.getElementById('chatbot-modal');
    const closeChatbotModalBtn = document.getElementById('close-chatbot-modal-btn');
    const messagesContainer = document.getElementById('messages');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const langButtons = document.querySelectorAll('.lang-btn-modal');
    const quickActionButtons = document.querySelectorAll('.action-btn-modal');

    function openChatbotModal() {
        chatbotOverlay.classList.add('show');
        document.body.classList.add('chatbot-open');
        messagesContainer.scrollTop = messagesContainer.scrollHeight; // Scroll to bottom
    }

    function closeChatbotModal() {
        chatbotOverlay.classList.remove('show');
        document.body.classList.remove('chatbot-open');
    }

    if (chatbotIcon && closeChatbotModalBtn && chatbotOverlay && messagesContainer && userInput && sendBtn) {
        chatbotIcon.addEventListener('click', openChatbotModal);
        closeChatbotModalBtn.addEventListener('click', closeChatbotModal);
        chatbotOverlay.addEventListener('click', (e) => {
            if (e.target === chatbotOverlay) {
                closeChatbotModal();
            }
        });
    }

    function addMessage(sender, text) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message-box-modal', sender === 'user' ? 'user-message-modal' : 'bot-message-modal');

        const headerDiv = document.createElement('div');
        headerDiv.classList.add('message-header-modal');

        const avatarDiv = document.createElement('div');
        avatarDiv.classList.add('avatar-modal', sender === 'user' ? 'user-avatar-modal' : 'bot-avatar-modal');
        avatarDiv.textContent = sender === 'user' ? 'You' : 'AI';

        const senderSpan = document.createElement('span');
        senderSpan.textContent = sender === 'user' ? 'You' : 'Vitthal Assistant';

        headerDiv.appendChild(avatarDiv);
        headerDiv.appendChild(senderSpan);

        const textP = document.createElement('p');
        textP.textContent = text;

        const timeSpan = document.createElement('span');
        timeSpan.classList.add('message-time-modal');
        timeSpan.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        messageDiv.appendChild(headerDiv);
        messageDiv.appendChild(textP);
        messageDiv.appendChild(timeSpan);
        messagesContainer.appendChild(messageDiv);

        messagesContainer.scrollTop = messagesContainer.scrollHeight; // Scroll to bottom
    }

    // Simulate AI Typing Indicator
    let typingIndicator = null;

    function showTypingIndicator() {
        if (typingIndicator) return;
        typingIndicator = document.createElement('div');
        typingIndicator.classList.add('message-box-modal', 'bot-message-modal');
        typingIndicator.innerHTML = `
            <div class="message-header-modal">
                <div class="avatar-modal bot-avatar-modal">AI</div>
                <span>Vitthal Assistant</span>
            </div>
            <div class="dot-typing"></div>
        `;
        messagesContainer.appendChild(typingIndicator);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function hideTypingIndicator() {
        if (typingIndicator) {
            messagesContainer.removeChild(typingIndicator);
            typingIndicator = null;
        }
    }

    async function sendMessage() {
        const prompt = userInput.value.trim();
        if (prompt === '') return;

        addMessage('user', prompt);
        userInput.value = ''; // Clear input immediately

        showTypingIndicator();

        // Simulate API call for AI response
        // In a real application, you would make a fetch call to your backend or a direct LLM API.
        // Example with placeholder for LLM API call:
        // const apiKey = ""; // If you want to use models other than gemini-2.5-flash-preview-05-20 or imagen-3.0-generate-002, provide an API key here. Otherwise, leave this as-is.
        // const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
        // try {
        //     const response = await fetch(apiUrl, {
        //         method: 'POST',
        //         headers: { 'Content-Type': 'application/json' },
        //         body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] })
        //     });
        //     const result = await response.json();
        //     const botResponse = result.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't process that.";
        //     hideTypingIndicator();
        //     addMessage('bot', botResponse);
        // } catch (error) {
        //     console.error('Error fetching AI response:', error);
        //     hideTypingIndicator();
        //     addMessage('bot', 'Sorry, I am having trouble connecting right now. Please try again later.');
        // }

        // Mock AI response for demonstration
        setTimeout(() => {
            hideTypingIndicator();
            let botResponse = "I'm still learning, but I can help you with common queries about Shri Vitthal Rukmini Mandir.";
            if (prompt.toLowerCase().includes("vitthal")) {
                botResponse = "Lord Vitthal, also known as Vithoba, is a Hindu deity predominantly worshipped in the Indian states of Maharashtra and Karnataka. He is a form of Lord Vishnu and is often depicted standing on a brick, symbolizing his wait for his devotee Pundalik.";
            } else if (prompt.toLowerCase().includes("darshan")) {
                botResponse = "You can book your darshan pass through our 'Pass Booking' section in Online Services. Please check the website for available slots.";
            } else if (prompt.toLowerCase().includes("timings")) {
                botResponse = "The general temple timings are from 6:00 AM to 10:00 PM, but they might vary on special festival days. Please check the official website or contact us for precise daily timings.";
            } else if (prompt.toLowerCase().includes("donate")) {
                botResponse = "Thank you for your generosity! You can make a donation through our 'Online Donation Portal' in the Online Services section. Every contribution helps maintain the temple and its services.";
            } else if (prompt.toLowerCase().includes("festival")) {
                botResponse = "The temple celebrates several festivals throughout the year, with Ashadhi Ekadashi and Kartiki Ekadashi being the most significant. These draw millions of devotees. Keep an eye on our news section for announcements!";
            } else if (prompt.toLowerCase().includes("pooja")) {
                botResponse = "Yes, you can book various pooja services online. Please visit the 'Pooja Services' section under Online Services for details and booking.";
            } else if (prompt.toLowerCase().includes("bhakta nivas") || prompt.toLowerCase().includes("accommodation")) {
                botResponse = "Bhakta Nivas provides comfortable and affordable accommodation for pilgrims. You can find more details and booking information in the 'Bhakta Nivas' section of our Online Services.";
            }
            addMessage('bot', botResponse);
        }, 1500); // Simulate network delay
    }

    if (sendBtn && userInput) {
        sendBtn.addEventListener('click', sendMessage);
        userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }

    langButtons.forEach(button => {
        button.addEventListener('click', () => {
            langButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            // In a real app, this would switch the language of chatbot responses
            addMessage('bot', `Language switched to ${button.textContent.trim()}.`);
        });
    });

    quickActionButtons.forEach(button => {
        button.addEventListener('click', () => {
            const query = button.dataset.query;
            if (query) {
                userInput.value = query; // Set the input field with the quick query
                sendMessage(); // Send the message
            }
        });
    });
});