document.addEventListener('DOMContentLoaded', function () {
    const dateInput = document.getElementById('prediction-date');
    const predictBtn = document.getElementById('predict-btn');
    const resultsDiv = document.getElementById('prediction-results');
    const placeholderDiv = document.getElementById('prediction-placeholder');
    const loadingDiv = document.getElementById('prediction-loading');

    // Set min date to today
    const today = new Date().toISOString().split('T')[0];
    dateInput.min = today;
    dateInput.value = today;

    let ekadashiDates = {};
    let crowdChart = null;

    // Fetch Ekadashi dates for highlighting
    fetch('/api/crowd-prediction/dates/')
        .then(response => response.json())
        .then(data => {
            ekadashiDates = data.ekadashi_dates;
            initFlatpickr();
        })
        .catch(err => {
            console.error('Error fetching ekadashi dates:', err);
            initFlatpickr(); // Initialize anyway without highlighting
        });

    function initFlatpickr() {
        flatpickr(dateInput, {
            altInput: true,
            altFormat: "d/m/Y",
            dateFormat: "Y-m-d",
            defaultDate: today,
            minDate: "today",
            onDayCreate: function (dObj, dStr, fp, dayElem) {
                const date = dayElem.dateObj;
                // Use local date string to avoid timezone shifts
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                const dateString = `${year}-${month}-${day}`;

                if (ekadashiDates[dateString]) {
                    dayElem.classList.add('ekadashi-date');
                    dayElem.title = ekadashiDates[dateString];
                }
            }
        });
    }

    predictBtn.addEventListener('click', function () {
        const selectedDate = dateInput.value;
        if (!selectedDate) {
            alert('Please select a date');
            return;
        }

        // Show loading
        loadingDiv.classList.remove('hidden');
        placeholderDiv.classList.add('hidden');
        resultsDiv.classList.add('hidden');

        fetch(`/api/crowd-prediction/?date=${selectedDate}`)
            .then(response => response.json())
            .then(data => {
                loadingDiv.classList.add('hidden');

                if (data.error) {
                    alert(data.error);
                    placeholderDiv.classList.remove('hidden');
                    return;
                }

                // Update UI
                resultsDiv.classList.remove('hidden');
                document.getElementById('res-devotees').innerText = data.predicted_devotees.toLocaleString();
                document.getElementById('res-level').innerText = data.crowd_level;
                document.getElementById('res-peak').innerText = data.peak_time;
                document.getElementById('res-best').innerText = data.best_time_for_darshan;

                // Festival logic
                const festivalContainer = document.getElementById('res-festival-container');
                if (data.is_ekadashi) {
                    festivalContainer.classList.remove('hidden');
                    document.getElementById('res-festival-name').innerText = data.festival_name || "Ekadashi Festival";
                } else {
                    festivalContainer.classList.add('hidden');
                }

                // Badge styling
                const badge = document.getElementById('res-level-badge');
                badge.innerText = data.crowd_level;
                if (data.crowd_level === 'Low') {
                    badge.className = 'px-4 py-1 rounded-full text-sm font-bold bg-green-100 text-green-700';
                } else if (data.crowd_level === 'Medium') {
                    badge.className = 'px-4 py-1 rounded-full text-sm font-bold bg-yellow-100 text-yellow-700';
                } else {
                    badge.className = 'px-4 py-1 rounded-full text-sm font-bold bg-red-100 text-red-700';
                }

                // Update Chart
                updateChart(data.hourly_predictions);
            })
            .catch(error => {
                console.error('Error fetching prediction:', error);
                loadingDiv.classList.add('hidden');
                placeholderDiv.classList.remove('hidden');
                alert('Failed to fetch prediction. Please try again later.');
            });
    });

    function updateChart(hourlyData) {
        const ctx = document.getElementById('crowdChart').getContext('2d');

        const labels = hourlyData.map(item => item.hour);
        const counts = hourlyData.map(item => item.count);

        if (crowdChart) {
            crowdChart.destroy();
        }

        crowdChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Expected Devotees',
                    data: counts,
                    borderColor: '#ff6b00',
                    backgroundColor: 'rgba(255, 107, 0, 0.1)',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointBackgroundColor: '#fff',
                    pointBorderColor: '#ff6b00',
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function (context) {
                                return `Devotees: ${context.parsed.y}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            font: {
                                size: 10
                            }
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            borderDash: [5, 5],
                            color: '#eee'
                        },
                        ticks: {
                            font: {
                                size: 10
                            }
                        }
                    }
                }
            }
        });
    }
});
