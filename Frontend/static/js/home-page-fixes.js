/**
 * Home Page Fixes - Gallery, E-Library, and Calendar
 */

// Fix 1: Gallery Images - Add fallback and error handling
document.addEventListener('DOMContentLoaded', function() {
    // Fix Gallery Images
    const galleryImages = document.querySelectorAll('.grid img[src^="/images/"]');
    galleryImages.forEach(img => {
        img.onerror = function() {
            // Try with /static/images/ prefix
            if (!this.src.includes('/static/')) {
                this.src = this.src.replace('/images/', '/static/images/');
            } else {
                // Show placeholder
                this.style.display = 'none';
                const placeholder = document.createElement('div');
                placeholder.className = 'w-full h-32 bg-gray-200 rounded-lg shadow-md flex items-center justify-center';
                placeholder.innerHTML = '<i class="fas fa-image text-gray-400 text-3xl"></i>';
                this.parentNode.insertBefore(placeholder, this);
            }
        };
    });

    // Fix 2: E-Library Cards - Ensure visibility
    const elibraryCards = document.querySelectorAll('.bg-gray-50.p-6.rounded-xl');
    elibraryCards.forEach(card => {
        card.style.minHeight = '200px';
        card.style.display = 'flex';
        card.style.flexDirection = 'column';
        card.style.alignItems = 'center';
        card.style.justifyContent = 'center';
    });

    // Fix 3: Generate Mini Calendar
    generateMiniCalendar();
    
    // Calendar navigation
    const prevBtn = document.getElementById('prev-month');
    const nextBtn = document.getElementById('next-month');
    
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            currentMonth--;
            if (currentMonth < 0) {
                currentMonth = 11;
                currentYear--;
            }
            generateMiniCalendar();
        });
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            currentMonth++;
            if (currentMonth > 11) {
                currentMonth = 0;
                currentYear++;
            }
            generateMiniCalendar();
        });
    }
});

// Calendar Variables
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

// Ekadashi dates for highlighting (example dates)
const ekadashiDates = [
    '2026-04-15',
    '2026-04-30',
    '2026-05-14',
    '2026-05-29',
    '2026-06-13',
    '2026-06-28'
];

function generateMiniCalendar() {
    const calendarEl = document.getElementById('mini-calendar');
    if (!calendarEl) return;

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    let html = `
        <div class="text-center font-semibold text-gray-900 mb-3">
            ${monthNames[currentMonth]} ${currentYear}
        </div>
        <div class="grid grid-cols-7 gap-1 text-center text-xs">
            <div class="font-semibold text-gray-600 py-1">Sun</div>
            <div class="font-semibold text-gray-600 py-1">Mon</div>
            <div class="font-semibold text-gray-600 py-1">Tue</div>
            <div class="font-semibold text-gray-600 py-1">Wed</div>
            <div class="font-semibold text-gray-600 py-1">Thu</div>
            <div class="font-semibold text-gray-600 py-1">Fri</div>
            <div class="font-semibold text-gray-600 py-1">Sat</div>
    `;
    
    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
        html += '<div class="py-2"></div>';
    }
    
    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const isEkadashi = ekadashiDates.includes(dateStr);
        const isToday = day === new Date().getDate() && 
                       currentMonth === new Date().getMonth() && 
                       currentYear === new Date().getFullYear();
        
        let classes = 'py-2 rounded cursor-pointer hover:bg-orange-100 transition';
        if (isToday) classes += ' bg-primary text-white font-bold';
        else if (isEkadashi) classes += ' ekadashi-date';
        
        html += `<div class="${classes}">${day}</div>`;
    }
    
    html += '</div>';
    calendarEl.innerHTML = html;
}

// Fix 4: Ensure reveal animations work
const revealElements = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
        }
    });
}, {
    threshold: 0.1
});

revealElements.forEach(el => revealObserver.observe(el));

// Fix 5: Stagger reveal animations
const staggerContainers = document.querySelectorAll('.reveal-stagger');
staggerContainers.forEach(container => {
    const children = container.querySelectorAll('.reveal');
    children.forEach((child, index) => {
        child.style.transitionDelay = `${index * 0.1}s`;
    });
});

// Fix 6: Ensure chatbot icon works
document.addEventListener('DOMContentLoaded', function() {
    const chatbotIcon = document.getElementById('chatbot-icon');
    const chatbotOverlay = document.getElementById('chatbot-overlay');
    
    if (chatbotIcon && chatbotOverlay) {
        // Only add handler for opening chatbot, don't interfere with internal buttons
        chatbotIcon.addEventListener('click', function(e) {
            if (!chatbotOverlay.classList.contains('show')) {
                chatbotOverlay.classList.add('show');
                document.body.classList.add('chatbot-open');
                const messagesContainer = document.getElementById('messages');
                if (messagesContainer) {
                    messagesContainer.scrollTop = messagesContainer.scrollHeight;
                }
            }
        }, true);
    }
});
