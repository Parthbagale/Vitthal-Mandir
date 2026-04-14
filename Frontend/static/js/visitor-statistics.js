(function () {
  'use strict';

  const API_BASE = localStorage.getItem('API_BASE') || 'http://127.0.0.1:8000';
  const API_URL = `${API_BASE}/api/admin/dashboard-analytics/`;

  const RANGE_BTNS = {
    today: document.getElementById('rangeToday'),
    '7': document.getElementById('range7'),
    '30': document.getElementById('range30'),
  };
  const refreshBtn = document.getElementById('refreshBtn');

  const elError = document.getElementById('dashError');

  const kpiTodayVisitors = document.getElementById('kpiTodayVisitors');
  const kpiPassUsed = document.getElementById('kpiPassUsed');
  const kpiPassUsedSub = document.getElementById('kpiPassUsedSub');
  const kpiPoojaBookings = document.getElementById('kpiPoojaBookings');
  const kpiBhaktNivasBooked = document.getElementById('kpiBhaktNivasBooked');
  const kpiRevenue = document.getElementById('kpiRevenue');

  const visitorTrendSub = document.getElementById('visitorTrendSub');
  const passCapacitySub = document.getElementById('passCapacitySub');
  const poojaSlotsSub = document.getElementById('poojaSlotsSub');
  const bhaktNivasSub = document.getElementById('bhaktNivasSub');
  const bhaktNivasTrendSub = document.getElementById('bhaktNivasTrendSub');
  const revenueSub = document.getElementById('revenueSub');

  const fmtINR = new Intl.NumberFormat('en-IN');

  let currentRange = 'today';
  let loading = false;

  let visitorTrendChart = null;
  let passCapacityChart = null;
  let poojaSlotsChart = null;
  let bhaktNivasChart = null;
  let bhaktNivasTrendChart = null;
  let revenueChart = null;

  function showError(msg) {
    if (!elError) return;
    elError.textContent = msg || '';
    elError.style.display = msg ? 'block' : 'none';
  }

  function setActiveRangeButton(rangeKey) {
    Object.keys(RANGE_BTNS).forEach((k) => {
      const b = RANGE_BTNS[k];
      if (!b) return;
      if (k === rangeKey) b.classList.add('btn-active');
      else b.classList.remove('btn-active');
    });
  }

  function getToken() {
    return localStorage.getItem('admin_access_token') || localStorage.getItem('adminAccessToken');
  }

  function clearAdminTokens() {
    try { localStorage.removeItem('admin_access_token'); } catch (e) {}
    try { localStorage.removeItem('adminAccessToken'); } catch (e) {}
  }

  function destroyChart(ch) {
    try {
      if (ch) ch.destroy();
    } catch (e) {
      // ignore
    }
    return null;
  }

  function renderVisitorTrend(data) {
    const container = document.getElementById('visitorTrendChart');
    if (!container) return;

    visitorTrendChart = destroyChart(visitorTrendChart);

    const labels = (data && data.labels) || [];
    const series = (data && data.series) || [{ name: 'Visitors', data: [] }];

    const options = {
      chart: {
        type: 'area',
        height: '100%',
        toolbar: { show: true },
        zoom: { enabled: true },
        animations: { enabled: true, easing: 'easeinout', speed: 700 },
        foreColor: 'rgba(229,231,235,0.85)',
      },
      series,
      xaxis: {
        categories: labels,
        labels: { rotate: -45 },
        tooltip: { enabled: false },
      },
      yaxis: {
        labels: {
          formatter: (v) => Math.round(v).toString(),
        },
      },
      stroke: { curve: 'smooth', width: 3 },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 0.5,
          opacityFrom: 0.45,
          opacityTo: 0.05,
          stops: [0, 100],
        },
      },
      dataLabels: { enabled: false },
      tooltip: { theme: 'dark' },
      grid: { borderColor: 'rgba(148,163,184,0.16)' },
      colors: ['#f97316'],
    };

    visitorTrendChart = new ApexCharts(container, options);
    visitorTrendChart.render();
  }

  function renderPassCapacity(data) {
    const container = document.getElementById('passCapacityChart');
    if (!container) return;

    passCapacityChart = destroyChart(passCapacityChart);

    const capacity = (data && data.capacity) || 180;
    const booked = (data && data.booked) || 0;
    const remaining = (data && data.remaining) || Math.max(capacity - booked, 0);
    const percent = (data && data.percent) || 0;

    const options = {
      chart: {
        type: 'radialBar',
        height: '100%',
        animations: { enabled: true, easing: 'easeinout', speed: 700 },
        foreColor: 'rgba(229,231,235,0.85)',
      },
      series: [percent],
      plotOptions: {
        radialBar: {
          startAngle: -120,
          endAngle: 120,
          hollow: { size: '60%' },
          track: { background: 'rgba(148,163,184,0.14)' },
          dataLabels: {
            name: { show: true, offsetY: 22, color: 'rgba(229,231,235,0.72)' },
            value: {
              show: true,
              offsetY: -18,
              fontSize: '28px',
              fontWeight: 800,
              formatter: (v) => `${Math.round(v)}%`,
            },
          },
        },
      },
      labels: ['Usage'],
      colors: ['#a78bfa'],
      tooltip: {
        theme: 'dark',
        y: {
          formatter: () => `${booked} booked / ${capacity} capacity (remaining ${remaining})`,
        },
      },
    };

    passCapacityChart = new ApexCharts(container, options);
    passCapacityChart.render();

    if (passCapacitySub) {
      passCapacitySub.textContent = `${booked} / ${capacity} used`;
    }
  }

  function renderPoojaSlots(data) {
    const container = document.getElementById('poojaSlotsChart');
    if (!container) return;

    poojaSlotsChart = destroyChart(poojaSlotsChart);

    const categories = (data && data.categories) || [];
    const used = (data && data.used) || [];
    const remaining = (data && data.remaining) || [];
    const maxSlots = (data && data.max_slots) || 0;

    const options = {
      chart: {
        type: 'bar',
        height: '100%',
        stacked: true,
        animations: { enabled: true, easing: 'easeinout', speed: 700 },
        foreColor: 'rgba(229,231,235,0.85)',
        toolbar: { show: false },
      },
      series: [
        { name: 'Used', data: used },
        { name: 'Remaining', data: remaining },
      ],
      xaxis: {
        categories,
        max: maxSlots || undefined,
        labels: {
          formatter: (v) => `${v}`,
        },
      },
      yaxis: {
        labels: { style: { colors: 'rgba(229,231,235,0.72)' } },
      },
      plotOptions: {
        bar: {
          horizontal: true,
          barHeight: '55%',
          borderRadius: 6,
        },
      },
      dataLabels: { enabled: false },
      legend: { position: 'top', horizontalAlign: 'left' },
      tooltip: { theme: 'dark' },
      grid: { borderColor: 'rgba(148,163,184,0.16)' },
      colors: ['#22c55e', 'rgba(148,163,184,0.25)'],
    };

    poojaSlotsChart = new ApexCharts(container, options);
    poojaSlotsChart.render();
  }

  function renderBhaktNivas(data) {
    const container = document.getElementById('bhaktNivasOccupancyChart');
    if (!container) return;

    bhaktNivasChart = destroyChart(bhaktNivasChart);

    const total = (data && data.total_rooms) || 50;
    const booked = (data && data.booked_rooms) || 0;
    const available = (data && data.available_rooms) || Math.max(total - booked, 0);
    const percent = (data && data.percent) || 0;

    const options = {
      chart: {
        type: 'radialBar',
        height: '100%',
        animations: { enabled: true, easing: 'easeinout', speed: 700 },
        foreColor: 'rgba(229,231,235,0.85)',
      },
      series: [percent],
      plotOptions: {
        radialBar: {
          hollow: { size: '62%' },
          track: { background: 'rgba(148,163,184,0.14)' },
          dataLabels: {
            name: { show: true, color: 'rgba(229,231,235,0.72)' },
            value: {
              show: true,
              fontSize: '28px',
              fontWeight: 800,
              formatter: (v) => `${Math.round(v)}%`,
            },
          },
        },
      },
      labels: ['Occupancy'],
      colors: ['#f59e0b'],
      tooltip: {
        theme: 'dark',
        y: {
          formatter: () => `${booked} booked / ${total} total (available ${available})`,
        },
      },
    };

    bhaktNivasChart = new ApexCharts(container, options);
    bhaktNivasChart.render();

    if (bhaktNivasSub) {
      bhaktNivasSub.textContent = `${booked} booked, ${available} available (total ${total})`;
    }
  }

  function renderBhaktNivasTrend(data) {
    const container = document.getElementById('bhaktNivasTrendChart');
    if (!container) return;

    bhaktNivasTrendChart = destroyChart(bhaktNivasTrendChart);

    const labels = (data && data.labels) || [];
    const series = (data && data.series) || [{ name: 'Rooms Booked', data: [] }];

    const options = {
      chart: {
        type: 'area',
        height: '100%',
        toolbar: { show: true },
        zoom: { enabled: true },
        animations: { enabled: true, easing: 'easeinout', speed: 700 },
        foreColor: 'rgba(229,231,235,0.85)',
      },
      series,
      xaxis: {
        categories: labels,
        labels: { rotate: -45 },
        tooltip: { enabled: false },
      },
      stroke: { curve: 'smooth', width: 3 },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 0.5,
          opacityFrom: 0.40,
          opacityTo: 0.05,
          stops: [0, 100],
        },
      },
      dataLabels: { enabled: false },
      tooltip: { theme: 'dark' },
      grid: { borderColor: 'rgba(148,163,184,0.16)' },
      colors: ['#60a5fa'],
    };

    bhaktNivasTrendChart = new ApexCharts(container, options);
    bhaktNivasTrendChart.render();

    if (bhaktNivasTrendSub) {
      bhaktNivasTrendSub.textContent = 'Rooms booked per day';
    }
  }

  function renderRevenue(data) {
    const container = document.getElementById('revenueChart');
    if (!container) return;

    revenueChart = destroyChart(revenueChart);

    const labels = (data && data.labels) || [];
    const values = (data && data.values) || [];
    const total = (data && data.total) || values.reduce((a, b) => a + (Number(b) || 0), 0);

    const options = {
      chart: {
        type: 'donut',
        height: '100%',
        animations: { enabled: true, easing: 'easeinout', speed: 700 },
        foreColor: 'rgba(229,231,235,0.85)',
      },
      labels,
      series: values,
      legend: {
        position: 'bottom',
        labels: { colors: 'rgba(229,231,235,0.72)' },
      },
      tooltip: {
        theme: 'dark',
        y: {
          formatter: (v) => `₹${fmtINR.format(Math.round(v))}`,
        },
      },
      dataLabels: { enabled: false },
      plotOptions: {
        pie: {
          donut: {
            size: '70%',
            labels: {
              show: true,
              total: {
                show: true,
                label: 'Total',
                color: 'rgba(229,231,235,0.72)',
                formatter: () => `₹${fmtINR.format(Math.round(total))}`,
              },
            },
          },
        },
      },
      colors: ['#f97316', '#a78bfa', '#22c55e', '#60a5fa'],
    };

    revenueChart = new ApexCharts(container, options);
    revenueChart.render();

    if (revenueSub) {
      revenueSub.textContent = `Total ₹${fmtINR.format(Math.round(total))}`;
    }
  }

  function fillKpis(kpis) {
    if (kpiTodayVisitors) kpiTodayVisitors.textContent = `${kpis.today_visitors ?? 0}`;

    const used = kpis.pass_tokens_used_today ?? 0;
    const cap = kpis.pass_capacity_per_day ?? 180;
    if (kpiPassUsed) kpiPassUsed.textContent = `${used}`;
    if (kpiPassUsedSub) kpiPassUsedSub.textContent = `out of ${cap}`;

    if (kpiPoojaBookings) kpiPoojaBookings.textContent = `${kpis.pooja_bookings ?? 0}`;
    if (kpiBhaktNivasBooked) kpiBhaktNivasBooked.textContent = `${kpis.bhakt_nivas_rooms_booked ?? 0}`;

    const rev = kpis.today_revenue ?? 0;
    if (kpiRevenue) kpiRevenue.textContent = `₹${fmtINR.format(Math.round(rev))}`;
  }

  async function fetchAnalytics(rangeKey) {
    const token = getToken();
    if (!token) {
      showError('Session expired. Redirecting to login...');
      setTimeout(() => {
        window.location.replace('/Admin_login.html');
      }, 700);
      return null;
    }

    const url = `${API_URL}?range=${encodeURIComponent(rangeKey)}`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const bodyText = await res.text();
    let bodyJson = null;
    try {
      bodyJson = bodyText ? JSON.parse(bodyText) : null;
    } catch (e) {
      bodyJson = null;
    }

    if (!res.ok) {
      if (res.status === 401) {
        const code = bodyJson && bodyJson.code;
        if (code === 'token_not_valid' || (bodyJson && bodyJson.detail && String(bodyJson.detail).toLowerCase().includes('token'))) {
          clearAdminTokens();
          showError('Session expired. Redirecting to login...');
          setTimeout(() => {
            window.location.replace('/Admin_login.html');
          }, 700);
          return null;
        }
      }

      if (res.status === 403) {
        showError('Admin access required. Please login with an admin account.');
        return null;
      }

      throw new Error(`Failed to load analytics (${res.status}). ${bodyText || ''}`.trim());
    }

    return bodyJson || {};
  }

  async function load(rangeKey) {
    if (loading) return;
    loading = true;
    showError('');

    try {
      setActiveRangeButton(rangeKey);
      currentRange = rangeKey;

      if (visitorTrendSub) visitorTrendSub.textContent = `Range: ${rangeKey}`;

      const payload = await fetchAnalytics(rangeKey);
      if (!payload) return;

      fillKpis(payload.kpis || {});

      renderVisitorTrend(payload.charts && payload.charts.visitor_trend);
      renderPassCapacity(payload.charts && payload.charts.pass_capacity);
      renderPoojaSlots(payload.charts && payload.charts.pooja_slots);
      renderBhaktNivas(payload.charts && payload.charts.bhakt_nivas_occupancy);
      renderBhaktNivasTrend(payload.charts && payload.charts.bhakt_nivas_trend);
      renderRevenue(payload.charts && payload.charts.revenue_distribution);

      if (poojaSlotsSub && payload.charts && payload.charts.pooja_slots) {
        const ps = payload.charts.pooja_slots;
        poojaSlotsSub.textContent = `${ps.capacity_per_day} slots/pooja/day • ${ps.days} day(s) • max ${ps.max_slots}`;
      }
    } catch (e) {
      showError(e && e.message ? e.message : 'Failed to load dashboard.');
    } finally {
      loading = false;
    }
  }

  function bind() {
    if (RANGE_BTNS.today) {
      RANGE_BTNS.today.addEventListener('click', () => load('today'));
    }
    if (RANGE_BTNS['7']) {
      RANGE_BTNS['7'].addEventListener('click', () => load('7'));
    }
    if (RANGE_BTNS['30']) {
      RANGE_BTNS['30'].addEventListener('click', () => load('30'));
    }

    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => load(currentRange));
    }
  }

  bind();
  load('today');
})();
