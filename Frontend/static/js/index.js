/* Index Page Specific JavaScript */

document.addEventListener('DOMContentLoaded', () => {
    // Calendar functionality
    initializeCalendar();
    
    // Event notifications
    initializeEventNotifications();
    
    // Scroll animations for index page
    initializeScrollAnimations();
});

function initializeCalendar() {
    const calendarContainer = document.getElementById('mini-calendar');
    if (!calendarContainer) return;

    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    
    let currentDate = new Date();
    
    function renderCalendar(date) {
        const year = date.getFullYear();
        const month = date.getMonth();
        
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();
        
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                           'July', 'August', 'September', 'October', 'November', 'December'];
        
        let html = `
            <div class="calendar-header mb-4">
                <div class="text-center font-semibold text-gray-800">${monthNames[month]} ${year}</div>
            </div>
            <div class="calendar-grid grid grid-cols-7 gap-1 text-center text-sm">
                <div class="font-semibold text-gray-600">Sun</div>
                <div class="font-semibold text-gray-600">Mon</div>
                <div class="font-semibold text-gray-600">Tue</div>
                <div class="font-semibold text-gray-600">Wed</div>
                <div class="font-semibold text-gray-600">Thu</div>
                <div class="font-semibold text-gray-600">Fri</div>
                <div class="font-semibold text-gray-600">Sat</div>
        `;
        
        // Empty cells for days before month starts
        for (let i = 0; i < startingDayOfWeek; i++) {
            html += '<div class="calendar-day text-gray-400"></div>';
        }
        
        // Days of the month
        const today = new Date();
        for (let day = 1; day <= daysInMonth; day++) {
            const isToday = day === today.getDate() && 
                           month === today.getMonth() && 
                           year === today.getFullYear();
            const classes = isToday ? 'calendar-day today' : 'calendar-day';
            html += `<div class="${classes}">${day}</div>`;
        }
        
        html += '</div>';
        calendarContainer.innerHTML = html;
    }
    
    if (prevMonthBtn) {
        prevMonthBtn.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() - 1);
            renderCalendar(currentDate);
        });
    }
    
    if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() + 1);
            renderCalendar(currentDate);
        });
    }
    
    renderCalendar(currentDate);
}

function initializeEventNotifications() {
    const enableNotificationsBtn = document.getElementById('enable-notifications');
    const emailSubscribeBtn = document.getElementById('email-subscribe');
    
    if (enableNotificationsBtn) {
        enableNotificationsBtn.addEventListener('click', () => {
            if ('Notification' in window) {
                Notification.requestPermission().then(permission => {
                    if (permission === 'granted') {
                        showMessage('Notifications enabled successfully!', 'success');
                    }
                });
            } else {
                showMessage('Notifications not supported in this browser', 'error');
            }
        });
    }
    
    if (emailSubscribeBtn) {
        emailSubscribeBtn.addEventListener('click', () => {
            showMessage('Email subscription feature coming soon!', 'info');
        });
    }
}

function initializeScrollAnimations() {
    const revealElements = document.querySelectorAll('.reveal');
    
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('show');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    revealElements.forEach(el => revealObserver.observe(el));
}

function showMessage(text, type = 'info') {
    const colors = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        info: 'bg-blue-500'
    };
    
    const message = document.createElement('div');
    message.className = `fixed top-4 right-4 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in`;
    message.textContent = text;
    document.body.appendChild(message);
    
    setTimeout(() => {
        message.remove();
    }, 3000);
}
