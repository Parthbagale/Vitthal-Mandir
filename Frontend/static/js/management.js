document.addEventListener('DOMContentLoaded', function () {
    // --- Visitor Counter Logic ---
    const visitorCountEl = document.getElementById('visitor-count');

    function animateCounter(target) {
        let current = 0;
        const duration = 2000; // 2 seconds
        const stepTime = 20;
        const steps = duration / stepTime;
        const increment = target / steps;

        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                visitorCountEl.innerText = target.toLocaleString();
                clearInterval(timer);
            } else {
                visitorCountEl.innerText = Math.floor(current).toLocaleString();
            }
        }, stepTime);
    }

    function updateVisitorCount() {
        if (!visitorCountEl) return;

        // Increment visitor count on homepage load
        fetch('/api/visitor/increment/', { method: 'POST', headers: { 'X-CSRFToken': getCookie('csrftoken') } })
            .then(res => res.json())
            .then(data => {
                if (data.total_devotees) {
                    animateCounter(data.total_devotees);
                }
            })
            .catch(err => console.error('Error updating visitor count:', err));
    }

    // --- Announcement Marquee Logic ---
    const announcementBar = document.getElementById('announcement-bar');
    const marqueeContent = document.getElementById('marquee-content');

    function loadAnnouncements() {
        if (!announcementBar || !marqueeContent) return;

        fetch('/api/announcements/')
            .then(res => res.json())
            .then(data => {
                if (data && data.length > 0) {
                    announcementBar.classList.remove('hidden');

                    // Determine background color based on types
                    const hasAlert = data.some(a => a.type === 'alert');
                    if (hasAlert) {
                        announcementBar.className = "sticky top-0 z-[60] py-2 px-4 shadow-md overflow-hidden bg-red-600 text-white";
                    } else {
                        announcementBar.className = "sticky top-0 z-[60] py-2 px-4 shadow-md overflow-hidden bg-yellow-400 text-gray-900";
                    }

                    // Build marquee text
                    let text = "";
                    text += `<span class="marquee-item">🙏 Ram Krushna Hari!!</span>`;
                    data.forEach((ann, index) => {
                        const icon = ann.type === 'alert' ? '⚠' : '🔔';
                        const prefix = ann.type === 'alert' ? 'Crowd Alert' : 'Temple Announcement';
                        text += `<span class="marquee-item">${icon} ${prefix}: ${ann.message}</span>`;
                    });

                    marqueeContent.innerHTML = `<span class="marquee-segment">${text}</span><span class="marquee-segment" aria-hidden="true">${text}</span>`;
                }
            })
            .catch(err => console.error('Error loading announcements:', err));
    }

    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    // Initialize
    updateVisitorCount();
    loadAnnouncements();
});
