(function(){
  const API_BASE = localStorage.getItem('API_BASE') || 'http://127.0.0.1:8000';

  function normalizeUser(u) {
    const user = u && typeof u === 'object' ? u : {};
    const username = user.username || user.user_name || user.name || user.email || '';
    const email = user.email || '';
    const fullName =
      user.full_name ||
      user.fullName ||
      user.fullname ||
      [user.first_name || user.firstName || '', user.last_name || user.lastName || ''].join(' ').trim() ||
      '';
    return { username, email, full_name: fullName };
  }

  function fillUser() {
    const raw = JSON.parse(localStorage.getItem('auth_user') || '{}');
    const user = normalizeUser(raw);

    const nameEl = document.getElementById('name');

    if (nameEl) nameEl.textContent = user.full_name || user.username || 'Admin';
  }

  async function ensureUserLoaded() {
    const raw = JSON.parse(localStorage.getItem('auth_user') || '{}');
    const user = normalizeUser(raw);

    if (user.username || user.full_name) {
      return;
    }

    const token = localStorage.getItem('admin_access_token') || localStorage.getItem('adminAccessToken');
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE}/api/auth/profile/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return;

      localStorage.setItem('auth_user', JSON.stringify(data || {}));
      fillUser();
    } catch (_) {}
  }

  let entryChart = null;
  let visitorsChart = null;
  let passChart = null;
  let poojaChart = null;
  let bhaktaChart = null;

  function showAnalyticsError(msg) {
    const el = document.getElementById('analyticsError');
    if (!el) return;
    el.style.display = 'block';
    el.textContent = msg;
  }

  function hideAnalyticsError() {
    const el = document.getElementById('analyticsError');
    if (!el) return;
    el.style.display = 'none';
    el.textContent = '';
  }

  function destroyChart(c) {
    if (!c) return null;
    try { c.destroy(); } catch (_) {}
    return null;
  }

  function renderBarChart(canvasId, labels, values, label, color) {
    const ctx = document.getElementById(canvasId);
    if (!ctx || typeof Chart === 'undefined') return null;
    return new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels || [],
        datasets: [{
          label: label || '',
          data: values || [],
          backgroundColor: color || 'rgba(255, 122, 0, 0.35)',
          borderColor: (color || 'rgba(255, 122, 0, 0.35)').replace('0.35', '1'),
          borderWidth: 1,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
      }
    });
  }

  function renderDoughnutChart(canvasId, labels, values) {
    const ctx = document.getElementById(canvasId);
    if (!ctx || typeof Chart === 'undefined') return null;
    return new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels || [],
        datasets: [{
          data: values || [],
          backgroundColor: [
            'rgba(34, 197, 94, 0.80)',
            'rgba(234, 179, 8, 0.85)',
            'rgba(239, 68, 68, 0.85)'
          ],
          borderColor: 'rgba(255,255,255,0.08)',
          borderWidth: 1,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { color: '#cbd5e1' } }
        }
      }
    });
  }

  function showEntryError(msg) {
    const el = document.getElementById('entryRecordsError');
    if (!el) return;
    el.style.display = 'block';
    el.textContent = msg;
  }

  function hideEntryError() {
    const el = document.getElementById('entryRecordsError');
    if (!el) return;
    el.style.display = 'none';
    el.textContent = '';
  }

  function renderEntryChart(labels, counts, period) {
    const ctx = document.getElementById('entryRecordsChart');
    if (!ctx || typeof Chart === 'undefined') return;

    if (entryChart) {
      try { entryChart.destroy(); } catch (_) {}
    }

    entryChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: `Entries (${period})`,
          data: counts,
          backgroundColor: 'rgba(79, 70, 229, 0.18)',
          borderColor: 'rgba(79, 70, 229, 1)',
          borderWidth: 2,
          fill: true,
          tension: 0.35,
          pointRadius: 3,
          pointHoverRadius: 6,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true },
          tooltip: { enabled: true }
        },
        interaction: {
          mode: 'index',
          intersect: false
        },
        scales: {
          y: { beginAtZero: true, ticks: { precision: 0 } }
        }
      }
    });
  }

  async function loadEntryStats(period) {
    hideEntryError();

    const token = localStorage.getItem('admin_access_token') || localStorage.getItem('adminAccessToken');
    if (!token) {
      showEntryError('No access token found. Please login again.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/booking/verifications/stats/?period=${encodeURIComponent(period)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showEntryError('Failed to load entry stats. Status: ' + res.status + '\n' + JSON.stringify(data, null, 2));
        return;
      }

      renderEntryChart(data.labels || [], data.counts || [], data.period || period);
    } catch (e) {
      showEntryError('Error loading entry stats: ' + e.message);
    }
  }

  (async function guard() {
    const token = localStorage.getItem('admin_access_token') || localStorage.getItem('adminAccessToken');
    if (!token) {
      return window.location.replace('Admin_login.html');
    }
    try {
      const res = await fetch(`${API_BASE}/api/auth/admin-verify/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        return window.location.replace('Admin_login.html');
      }
    } catch (_) {
      return window.location.replace('Admin_login.html');
    }
  })();

  async function createAnnouncement(type) {
    const title = window.prompt(type === 'alert' ? 'Emergency Alert title:' : 'Announcement title:');
    if (title === null) return;
    const message = window.prompt(type === 'alert' ? 'Emergency Alert message:' : 'Announcement message:');
    if (message === null) return;

    const token = localStorage.getItem('admin_access_token') || localStorage.getItem('adminAccessToken');
    if (!token) {
      window.alert('No access token found. Please login again.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/announcements/create/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title, message, type })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        window.alert('Failed to create message. Status: ' + res.status + '\n' + (data.detail || JSON.stringify(data)));
        return;
      }
      window.alert('Saved successfully.');
    } catch (e) {
      window.alert('Error creating message: ' + e.message);
    }
  }

  async function resetVisitorCounter() {
    const ok = window.confirm("Reset today's visitor counter to 0?");
    if (!ok) return;

    const token = localStorage.getItem('admin_access_token') || localStorage.getItem('adminAccessToken');
    if (!token) {
      window.alert('No access token found. Please login again.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/visitor/reset/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        window.alert('Failed to reset visitor counter. Status: ' + res.status + '\n' + (data.detail || JSON.stringify(data)));
        return;
      }
      window.alert('Visitor counter reset.');
    } catch (e) {
      window.alert('Error resetting visitor counter: ' + e.message);
    }
  }

  function bind() {
    const showEntryRecordsBtn = document.getElementById('showEntryRecordsBtn');
    const addAnnouncementBtn = document.getElementById('addAnnouncementBtn');
    const addEmergencyAlertBtn = document.getElementById('addEmergencyAlertBtn');
    const resetVisitorCounterBtn = document.getElementById('resetVisitorCounterBtn');
    const analyticsRefreshBtn = document.getElementById('analyticsRefreshBtn');

    async function loadAnalytics() {
      hideAnalyticsError();

      const token = localStorage.getItem('admin_access_token') || localStorage.getItem('adminAccessToken');
      if (!token) {
        showAnalyticsError('No access token found. Please login again.');
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/api/admin/dashboard-analytics/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          showAnalyticsError('Failed to load analytics. Status: ' + res.status + '\n' + JSON.stringify(data, null, 2));
          return;
        }

        visitorsChart = destroyChart(visitorsChart);
        passChart = destroyChart(passChart);
        poojaChart = destroyChart(poojaChart);
        bhaktaChart = destroyChart(bhaktaChart);

        const v = data.visitor || {};
        visitorsChart = renderBarChart('chartVisitors', v.labels || [], v.counts || [], 'Visitors', 'rgba(59, 130, 246, 0.35)');

        const p = data.pass || {};
        passChart = renderDoughnutChart('chartPass', p.labels || [], p.counts || []);

        const pj = data.pooja || {};
        poojaChart = renderBarChart('chartPooja', pj.labels || [], pj.counts || [], 'Bookings', 'rgba(255, 122, 0, 0.35)');

        const b = data.bhakta_nivas || {};
        bhaktaChart = renderBarChart('chartBhakta', b.labels || [], b.counts || [], 'Bookings', 'rgba(147, 51, 234, 0.35)');
      } catch (e) {
        showAnalyticsError('Error loading analytics: ' + e.message);
      }
    }

    async function loadKpis() {
      const todayEl = document.getElementById('kpiTodayDevotees');
      const todayMetaEl = document.getElementById('kpiTodayDevoteesMeta');
      const annEl = document.getElementById('kpiActiveAnnouncements');
      const alertEl = document.getElementById('kpiActiveAlerts');

      try {
        const resToday = await fetch(`${API_BASE}/api/visitor/today/`);
        const dataToday = await resToday.json().catch(() => ({}));
        const count = Number((dataToday || {}).total_devotees || 0);
        if (todayEl) todayEl.textContent = Number.isFinite(count) ? count.toLocaleString() : '--';
        if (todayMetaEl) todayMetaEl.textContent = 'Updated ' + new Date().toLocaleTimeString();
      } catch (_) {
        if (todayEl) todayEl.textContent = '--';
      }

      const token = localStorage.getItem('admin_access_token') || localStorage.getItem('adminAccessToken');
      if (!token) return;

      try {
        const res = await fetch(`${API_BASE}/api/admin/announcements/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json().catch(() => ([]));
        if (!res.ok || !Array.isArray(data)) return;

        const activeAnnouncements = data.filter(a => a && a.active && a.type === 'announcement').length;
        const activeAlerts = data.filter(a => a && a.active && a.type === 'alert').length;
        if (annEl) annEl.textContent = String(activeAnnouncements);
        if (alertEl) alertEl.textContent = String(activeAlerts);
      } catch (_) {}
    }

    function isButton(el) {
      return !!(el && el.tagName && String(el.tagName).toUpperCase() === 'BUTTON');
    }

    const entryPeriodWeek = document.getElementById('entryPeriodWeek');
    const entryPeriodMonth = document.getElementById('entryPeriodMonth');
    const entryPeriodYear = document.getElementById('entryPeriodYear');

    // If dashboard controls are anchors (<a href="/admin/...">), allow normal navigation.
    // Only use the inline toggle/chart behavior when these are real <button> elements.
    if (showEntryRecordsBtn && isButton(showEntryRecordsBtn)) {
      showEntryRecordsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const card = document.getElementById('analyticsCard');
        if (!card) return;
        const willShow = (card.style.display === 'none' || !card.style.display);
        card.style.display = willShow ? 'block' : 'none';
        if (willShow) {
          loadAnalytics();
        }
      });
    }

    if (analyticsRefreshBtn) {
      analyticsRefreshBtn.addEventListener('click', (e) => {
        e.preventDefault();
        loadAnalytics();
      });
    }

    if (addAnnouncementBtn && isButton(addAnnouncementBtn)) {
      addAnnouncementBtn.addEventListener('click', (e) => {
        e.preventDefault();
        createAnnouncement('announcement');
      });
    }

    if (addEmergencyAlertBtn && isButton(addEmergencyAlertBtn)) {
      addEmergencyAlertBtn.addEventListener('click', (e) => {
        e.preventDefault();
        createAnnouncement('alert');
      });
    }

    if (resetVisitorCounterBtn && isButton(resetVisitorCounterBtn)) {
      resetVisitorCounterBtn.addEventListener('click', (e) => {
        e.preventDefault();
        resetVisitorCounter();
      });
    }

    if (entryPeriodWeek) entryPeriodWeek.addEventListener('click', (e) => { e.preventDefault(); loadEntryStats('week'); });
    if (entryPeriodMonth) entryPeriodMonth.addEventListener('click', (e) => { e.preventDefault(); loadEntryStats('month'); });
    if (entryPeriodYear) entryPeriodYear.addEventListener('click', (e) => { e.preventDefault(); loadEntryStats('year'); });

    fillUser();
    ensureUserLoaded();
    loadKpis();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }
})();
