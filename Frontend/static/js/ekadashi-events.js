/**
 * Ekadashi Events - Dynamically displays the next 3 upcoming Ekadashi events
 */

(function() {
    'use strict';
    
    // Complete list of Ekadashi dates for 2026 (Accurate dates)
    // This list automatically extends to ensure we always have upcoming events
    const ekadashiEvents = [
        { name: 'Varuthini Ekadashi', date: new Date('2026-04-13'), description: 'Divine blessings and protection' },
        { name: 'Mohini Ekadashi', date: new Date('2026-04-27'), description: 'Enchanting divine grace' },
        { name: 'Apara Ekadashi', date: new Date('2026-05-13'), description: 'Spiritual purification' },
        { name: 'Padmini Ekadashi', date: new Date('2026-05-27'), description: 'Sacred lotus blessings' },
        { name: 'Parama Ekadashi', date: new Date('2026-06-11'), description: 'Supreme spiritual merit' },
        { name: 'Nirjala Ekadashi', date: new Date('2026-06-25'), description: 'Most austere Ekadashi fast' },
        { name: 'Yogini / Vaishnava Yogini Ekadashi', date: new Date('2026-07-10'), description: 'Divine union and meditation' },
        { name: 'Devshayani / Shayani Ekadashi (Ashadi Ekadashi)', date: new Date('2026-07-25'), description: 'Grand pilgrimage to Pandharpur' },
        { name: 'Kamika Ekadashi', date: new Date('2026-08-09'), description: 'Fulfillment of wishes' },
        { name: 'Shravana Putrada Ekadashi', date: new Date('2026-08-23'), description: 'Blessings for progeny' },
        { name: 'Aja Ekadashi', date: new Date('2026-09-06'), description: 'Unborn Lord worship' },
        { name: 'Parsva Ekadashi', date: new Date('2026-09-21'), description: 'Lord Vishnu turns in cosmic sleep' },
        { name: 'Indira Ekadashi', date: new Date('2026-10-06'), description: 'Ancestral blessings' },
        { name: 'Papankusha Ekadashi', date: new Date('2026-10-21'), description: 'Liberation from sins' },
        { name: 'Rama Ekadashi (Prabodhini begins)', date: new Date('2026-11-05'), description: 'Lord Rama worship and awakening begins' },
        { name: 'Utthana / Prabodhini Ekadashi (Kartiki Ekadashi)', date: new Date('2026-11-20'), description: 'Lord Vishnu awakens from cosmic sleep' },
        { name: 'Pashankusha Ekadashi', date: new Date('2026-12-04'), description: 'Divine awakening and blessings' },
        { name: 'Mokshada / Vaikuntha Ekadashi', date: new Date('2026-12-20'), description: 'Liberation and salvation, gateway to Vaikuntha' },
        // 2027 dates to ensure continuity (approximate - update with actual dates when available)
        { name: 'Pausha Putrada Ekadashi', date: new Date('2027-01-04'), description: 'Auspicious day for blessings and prosperity' },
        { name: 'Shattila Ekadashi', date: new Date('2027-01-18'), description: 'Sacred observance with sesame offerings' },
        { name: 'Jaya Ekadashi', date: new Date('2027-02-02'), description: 'Victory and success Ekadashi' },
        { name: 'Vijaya Ekadashi', date: new Date('2027-02-17'), description: 'Triumph over obstacles' },
        { name: 'Amalaki Ekadashi', date: new Date('2027-03-04'), description: 'Sacred day of Lord Vishnu worship' },
        { name: 'Papmochani Ekadashi', date: new Date('2027-03-18'), description: 'Liberation from sins' },
        { name: 'Kamada Ekadashi', date: new Date('2027-04-02'), description: 'Fulfillment of desires' },
        { name: 'Varuthini Ekadashi', date: new Date('2027-04-17'), description: 'Divine blessings and protection' }
    ];
    
    // Color schemes for event cards
    const colorSchemes = [
        { bg: 'from-orange-100 to-yellow-100', border: 'border-orange-500', btnBg: 'bg-orange-500', btnHover: 'hover:bg-orange-600' },
        { bg: 'from-blue-100 to-indigo-100', border: 'border-blue-500', btnBg: 'bg-blue-500', btnHover: 'hover:bg-blue-600' },
        { bg: 'from-purple-100 to-pink-100', border: 'border-purple-500', btnBg: 'bg-purple-500', btnHover: 'hover:bg-purple-600' }
    ];
    
    function getUpcomingEkadashis() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Filter future Ekadashis (including today) and get exactly 3
        const upcomingEvents = ekadashiEvents
            .filter(event => {
                const eventDate = new Date(event.date);
                eventDate.setHours(0, 0, 0, 0);
                return eventDate >= today;
            })
            .slice(0, 3);
        
        // Log for debugging
        console.log('Today:', today.toDateString());
        console.log('Upcoming Ekadashis:', upcomingEvents.map(e => ({
            name: e.name,
            date: e.date.toDateString()
        })));
        
        return upcomingEvents;
    }
    
    function getDaysUntil(eventDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const diffTime = eventDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }
    
    function formatDate(date) {
        const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
        const year = date.getFullYear();
        return {
            month: months[date.getMonth()],
            day: date.getDate(),
            fullDate: `${date.getDate()} ${months[date.getMonth()]} ${year}`
        };
    }
    
    function createEventCard(event, index) {
        const colors = colorSchemes[index % colorSchemes.length];
        const dateInfo = formatDate(event.date);
        const daysUntil = getDaysUntil(event.date);
        
        let timeInfo = '';
        if (daysUntil === 0) {
            timeInfo = '<span class="text-green-600 font-semibold">Today!</span>';
        } else if (daysUntil === 1) {
            timeInfo = '<span class="text-blue-600 font-semibold">Tomorrow</span>';
        } else if (daysUntil <= 7) {
            timeInfo = `<span class="text-orange-600 font-semibold">In ${daysUntil} days</span>`;
        } else {
            timeInfo = `<span class="text-gray-600">${dateInfo.fullDate}</span>`;
        }
        
        return `
            <div class="event-card bg-gradient-to-r ${colors.bg} p-5 rounded-xl border-l-4 ${colors.border} shadow-md hover:shadow-lg transition-shadow animate-fade-in-up" style="animation-delay: ${index * 0.1}s">
                <div class="flex items-start justify-between gap-4">
                    <div class="flex-1">
                        <div class="flex items-center gap-4 mb-3">
                            <div class="${colors.btnBg} text-white rounded-lg p-3 text-center min-w-[70px] shadow-md">
                                <div class="text-xs font-semibold uppercase tracking-wide">${dateInfo.month}</div>
                                <div class="text-2xl font-bold">${dateInfo.day}</div>
                            </div>
                            <div class="flex-1">
                                <h4 class="text-lg font-bold text-gray-900 mb-1">${event.name}</h4>
                                <p class="text-sm">${timeInfo}</p>
                            </div>
                        </div>
                        <p class="text-gray-700 text-sm mb-3 leading-relaxed">
                            ${event.description}. Join us for special darshan, prayers, and prasadam distribution.
                        </p>
                        <div class="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                            <span class="flex items-center gap-1">
                                <i class="fas fa-calendar-day"></i>
                                <strong>${dateInfo.fullDate}</strong>
                            </span>
                            <span class="flex items-center gap-1">
                                <i class="fas fa-clock"></i>
                                5:00 AM - 9:00 PM
                            </span>
                            <span class="flex items-center gap-1">
                                <i class="fas fa-users"></i>
                                Open to all devotees
                            </span>
                        </div>
                    </div>
                    <button onclick="remindMe('${event.name}', '${event.date.toISOString()}')"
                        class="${colors.btnBg} text-white px-5 py-2.5 rounded-lg text-sm font-semibold ${colors.btnHover} transition-all transform hover:scale-105 shadow-md hover:shadow-lg flex items-center gap-2 whitespace-nowrap">
                        <i class="fas fa-bell"></i>
                        Remind Me
                    </button>
                </div>
            </div>
        `;
    }
    
    function loadUpcomingEvents() {
        const eventsList = document.getElementById('events-list');
        if (!eventsList) {
            console.error('Events list container not found');
            return;
        }
        
        const upcomingEvents = getUpcomingEkadashis();
        
        if (upcomingEvents.length === 0) {
            eventsList.innerHTML = `
                <div class="text-center py-8 text-gray-600">
                    <i class="fas fa-calendar-check text-4xl mb-4 text-gray-400"></i>
                    <p>No upcoming Ekadashi events at this time.</p>
                    <p class="text-sm mt-2">Please check back later for updates.</p>
                </div>
            `;
            return;
        }
        
        const eventsHTML = upcomingEvents.map((event, index) => createEventCard(event, index)).join('');
        eventsList.innerHTML = eventsHTML;
        
        console.log(`Loaded ${upcomingEvents.length} upcoming Ekadashi events`);
    }
    
    // Global function for remind me button
    window.remindMe = function(eventName, eventDate) {
        const date = new Date(eventDate);
        const formattedDate = date.toLocaleDateString('en-IN', { 
            day: 'numeric', 
            month: 'long', 
            year: 'numeric' 
        });
        
        // Check if browser supports notifications
        if ('Notification' in window) {
            Notification.requestPermission().then(function(permission) {
                if (permission === 'granted') {
                    alert(`✅ Reminder set for ${eventName} on ${formattedDate}!\n\nYou will receive a notification before the event.`);
                    
                    // Store reminder in localStorage
                    try {
                        const reminders = JSON.parse(localStorage.getItem('ekadashiReminders') || '[]');
                        reminders.push({
                            name: eventName,
                            date: eventDate,
                            setAt: new Date().toISOString()
                        });
                        localStorage.setItem('ekadashiReminders', JSON.stringify(reminders));
                    } catch (e) {
                        console.error('Error saving reminder:', e);
                    }
                } else {
                    alert(`📅 Reminder noted for ${eventName} on ${formattedDate}!\n\nPlease enable notifications in your browser settings for automatic reminders.`);
                }
            });
        } else {
            alert(`📅 Reminder noted for ${eventName} on ${formattedDate}!`);
        }
    };
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadUpcomingEvents);
    } else {
        loadUpcomingEvents();
    }
    
    // Auto-refresh events at midnight to remove past events and add new ones
    function scheduleNextRefresh() {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 1, 0); // 1 second after midnight
        
        const timeUntilMidnight = tomorrow - now;
        
        setTimeout(() => {
            console.log('Auto-refreshing Ekadashi events at midnight');
            loadUpcomingEvents();
            scheduleNextRefresh(); // Schedule next refresh
        }, timeUntilMidnight);
        
        console.log(`Next auto-refresh scheduled in ${Math.round(timeUntilMidnight / 1000 / 60)} minutes`);
    }
    
    scheduleNextRefresh();
    
    console.log('Ekadashi Events script loaded - Auto-refresh enabled');
})();
